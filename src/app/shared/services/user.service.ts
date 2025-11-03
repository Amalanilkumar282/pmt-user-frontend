import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  deletedAt?: string;
  jiraId?: string;
  type?: string;
}

export interface UserApiResponse {
  status: number;
  data: User[];
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  
  // Signal to cache users
  private usersSignal = signal<User[]>([]);
  
  // Readonly access to users
  users = this.usersSignal.asReadonly();

  /**
   * Fetch all users from the backend API
   * @returns Observable of users array
   */
  getAllUsers(): Observable<User[]> {
    console.log('🔐 Fetching all users from API');

    return this.http.get<UserApiResponse>(`${this.apiUrl}/api/User/all`).pipe(
      map((response) => {
        console.log('✅ Users API response:', response);

        if ((response.status === 200 || response.status === 0) && response.data) {
          // Filter only active users with valid name and email
          const activeUsers = response.data.filter(user => 
            user.isActive && 
            user.name && 
            user.email &&
            user.name.trim() !== '' &&
            user.email.trim() !== ''
          );
          // Cache the users in signal
          this.usersSignal.set(activeUsers);
          console.log('✅ Users cached successfully:', activeUsers.length, 'active users');
          return activeUsers;
        } else {
          console.error('❌ Failed to fetch users:', response.message);
          return [];
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get user by ID from cached users
   * @param userId - The ID of the user
   * @returns User object or undefined
   */
  getUserById(userId: number): User | undefined {
    return this.usersSignal().find((user) => user.id === userId);
  }

  /**
   * Get user name by ID
   * @param userId - The ID of the user
   * @returns User name or 'Unknown User'
   */
  getUserName(userId: number): string {
    const user = this.getUserById(userId);
    return user ? user.name : 'Unknown User';
  }

  /**
   * Search users by query string
   * @param query - Search query
   * @returns Filtered users array
   */
  searchUsers(query: string): User[] {
    if (!query || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    return this.usersSignal().filter(user => {
      // Handle null/undefined values safely
      const name = user.name?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      
      return name.includes(lowerQuery) || email.includes(lowerQuery);
    });
  }

  /**
   * Handle HTTP errors
   * @param error - HTTP error response
   * @returns Observable error
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred while fetching users';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Unauthorized. Please login again.';
      } else if (error.status === 404) {
        errorMessage = 'Users endpoint not found.';
      } else if (error.status === 0) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      } else {
        errorMessage = error.error?.message || `Server error: ${error.status}`;
      }
    }

    console.error('UserService Error:', errorMessage, error);
    return throwError(() => ({ message: errorMessage }));
  }
}
