import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  userId: string; // Changed to string to support GUID format
  email: string;
  name: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  avatarUrl?: string; // Optional avatar URL
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  // Support both old and new API response formats
  succeeded?: boolean; // New format
  status?: number; // Old format
  statusCode?: number; // New format
  data: {
    userId: string | number; // Support both string (GUID) and number formats
    email: string;
    name: string;
    accessToken: string;
    refreshToken: string;
    avatarUrl?: string; // Optional field from API
    accessTokenExpires?: string; // Optional - may not be in response
    refreshTokenExpires?: string; // Optional - may not be in response
    isActive?: boolean; // Optional - may not be in response
    isSuperAdmin?: boolean; // Optional - may not be in response
  };
  message?: string; // Optional error message
}

export interface RefreshTokenResponse {
  // Support both old and new API response formats
  succeeded?: boolean; // New format
  status?: number; // Old format
  statusCode?: number; // New format
  data: {
    userId: string | number; // Support both string (GUID) and number formats
    email: string;
    name: string;
    accessToken: string;
    refreshToken: string;
    avatarUrl?: string; // Optional field
    accessTokenExpires?: string; // Optional
    refreshTokenExpires?: string; // Optional
    isActive?: boolean; // Optional
    isSuperAdmin?: boolean; // Optional
  };
  message?: string; // Optional error message
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private isBrowser: boolean;
  private apiUrl = environment.apiUrl;

  constructor(private router: Router) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    let storedUser: string | null = null;
    if (this.isBrowser) {
      storedUser = sessionStorage.getItem('currentUser');
    }
    
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginCredentials): Observable<User> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/api/Auth/login`, credentials)
      .pipe(
        map(response => {
          console.log('Login response:', response);
          console.log('Response succeeded:', response.succeeded);
          console.log('Response statusCode:', response.statusCode);
          console.log('Response status (old format):', response.status);
          console.log('Response data:', response.data);
          
          // Check if login was successful (support both old and new API formats)
          const isSuccess = response.succeeded === true || response.status === 200;
          
          if (isSuccess && response.data) {
            // Convert userId to string for consistency
            const userIdString = String(response.data.userId);
            
            const user: User = {
              userId: userIdString,
              email: response.data.email,
              name: response.data.name,
              isActive: response.data.isActive ?? true, // Default to true if not provided
              isSuperAdmin: response.data.isSuperAdmin ?? false, // Default to false if not provided
              avatarUrl: response.data.avatarUrl
            };

            // Store user details and tokens in session storage (browser only)
            if (this.isBrowser) {
              sessionStorage.setItem('currentUser', JSON.stringify(user));
              sessionStorage.setItem('accessToken', response.data.accessToken);
              sessionStorage.setItem('refreshToken', response.data.refreshToken);
              
              // Store userId separately for easy access by other components
              sessionStorage.setItem('userId', userIdString);
              
              // Only store expiry dates if they exist in the response
              if (response.data.accessTokenExpires) {
                sessionStorage.setItem('accessTokenExpires', response.data.accessTokenExpires);
              }
              if (response.data.refreshTokenExpires) {
                sessionStorage.setItem('refreshTokenExpires', response.data.refreshTokenExpires);
              }
              
              console.log('✅ Token stored in sessionStorage:', {
                userId: userIdString,
                email: response.data.email,
                tokenLength: response.data.accessToken.length
              });
            }
            
            this.currentUserSubject.next(user);
            console.log('✅ User logged in successfully:', user);
            return user;
          } else {
            const errorMsg = response.message || 'Login failed';
            console.error('❌ Login failed:', errorMsg);
            throw new Error(errorMsg);
          }
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    // Remove user and tokens from session storage (browser only)
    if (this.isBrowser) {
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('accessTokenExpires');
      sessionStorage.removeItem('refreshTokenExpires');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    if (!this.currentUserValue) return false;
    
    // Check if access token is expired
    if (this.isBrowser) {
      const expiresAt = sessionStorage.getItem('accessTokenExpires');
      if (expiresAt) {
        const isExpired = new Date(expiresAt) <= new Date();
        if (isExpired) {
          // Token expired, logout
          this.logout();
          return false;
        }
      }
    }
    
    return true;
  }

  getAccessToken(): string | null {
    if (this.isBrowser) {
      return sessionStorage.getItem('accessToken');
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (this.isBrowser) {
      return sessionStorage.getItem('refreshToken');
    }
    return null;
  }

  // Method to refresh access token using refresh token
  refreshAccessToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/api/Auth/refresh`, { refreshToken })
      .pipe(
        map(response => {
          console.log('Token refresh response:', response);
          
          // Check if refresh was successful (support both old and new API formats)
          const isSuccess = response.succeeded === true || response.status === 200;
          
          if (isSuccess && response.data && response.data.accessToken) {
            // Convert userId to string for consistency
            const userIdString = String(response.data.userId);
            
            // Update user information if it changed
            const user: User = {
              userId: userIdString,
              email: response.data.email,
              name: response.data.name,
              isActive: response.data.isActive ?? true,
              isSuperAdmin: response.data.isSuperAdmin ?? false,
              avatarUrl: response.data.avatarUrl
            };

            // Store updated user details and tokens in session storage
            if (this.isBrowser) {
              sessionStorage.setItem('currentUser', JSON.stringify(user));
              sessionStorage.setItem('accessToken', response.data.accessToken);
              sessionStorage.setItem('refreshToken', response.data.refreshToken);
              sessionStorage.setItem('userId', userIdString);
              
              // Only store expiry dates if they exist
              if (response.data.accessTokenExpires) {
                sessionStorage.setItem('accessTokenExpires', response.data.accessTokenExpires);
              }
              if (response.data.refreshTokenExpires) {
                sessionStorage.setItem('refreshTokenExpires', response.data.refreshTokenExpires);
              }
            }
            
            // Update current user subject
            this.currentUserSubject.next(user);
            console.log('Tokens refreshed successfully');
            
            return response.data.accessToken;
          }
          throw new Error('Failed to refresh token');
        }),
        catchError((error) => {
          // If refresh token is invalid or expired, logout user
          console.error('Token refresh failed:', error);
          this.logout();
          return throwError(() => error);
        })
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Invalid request';
      } else if (error.status === 0) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      } else {
        errorMessage = error.error?.message || `Server error: ${error.status}`;
      }
    }
    
    return throwError(() => ({ message: errorMessage }));
  }
}
