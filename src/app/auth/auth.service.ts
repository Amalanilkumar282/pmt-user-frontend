import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;

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
    return new Observable(observer => {
      // Simulate API call with setTimeout
      // TODO: Replace with actual backend API call
      setTimeout(() => {
        // Mock authentication - Replace with actual API call
        if (credentials.email && credentials.password.length >= 6) {
          const user: User = {
            id: '1',
            email: credentials.email,
            name: credentials.email.split('@')[0]
          };

          // Store user details and tokens in session storage (browser only)
          // When integrating backend, store: accessToken, refreshToken, user
          if (this.isBrowser) {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            sessionStorage.setItem('accessToken', 'mock-access-token');
            sessionStorage.setItem('refreshToken', 'mock-refresh-token');
          }
          
          this.currentUserSubject.next(user);
          observer.next(user);
          observer.complete();
        } else {
          observer.error({ message: 'Invalid email or password' });
        }
      }, 800);
    });
  }

  logout(): void {
    // Remove user and tokens from session storage (browser only)
    if (this.isBrowser) {
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserValue;
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
    return new Observable(observer => {
      // TODO: Replace with actual backend API call
      // Example: this.http.post('/api/auth/refresh', { refreshToken: this.getRefreshToken() })
      setTimeout(() => {
        const newAccessToken = 'new-mock-access-token';
        if (this.isBrowser) {
          sessionStorage.setItem('accessToken', newAccessToken);
        }
        observer.next(newAccessToken);
        observer.complete();
      }, 500);
    });
  }
}
