import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, of, catchError, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  email: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/User`;
  
  // Cache for user data to avoid repeated API calls
  private userCache = new Map<number, Observable<User>>();
  private allUsersCache?: Observable<User[]>;

  private getAuthHeaders(): HttpHeaders {
    if (typeof sessionStorage !== 'undefined') {
      const token = sessionStorage.getItem('accessToken') || '';
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'accept': 'text/plain',
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'accept': 'text/plain',
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get all users
   * GET /api/User
   */
  getAllUsers(): Observable<User[]> {
    if (!this.allUsersCache) {
      const headers = this.getAuthHeaders();
      this.allUsersCache = this.http
        .get<ApiResponse<User[]>>(this.baseUrl, { headers })
        .pipe(
          map(response => response.data),
          catchError(error => {
            console.error('[UserApiService] Error fetching users:', error);
            return of([]); // Return empty array on error
          }),
          shareReplay(1) // Cache the result
        );
    }
    return this.allUsersCache;
  }

  /**
   * Get user by ID
   * GET /api/User/{id}
   */
  getUserById(userId: number): Observable<User | null> {
    if (!this.userCache.has(userId)) {
      const headers = this.getAuthHeaders();
      const obs = this.http
        .get<ApiResponse<User>>(`${this.baseUrl}/${userId}`, { headers })
        .pipe(
          map(response => response.data),
          catchError(error => {
            console.error(`[UserApiService] Error fetching user ${userId}:`, error);
            // Return fallback user object
            return of({
              id: userId,
              email: `user${userId}@example.com`,
              name: `User ${userId}`
            } as User);
          }),
          shareReplay(1) // Cache the result
        );
      this.userCache.set(userId, obs);
    }
    return this.userCache.get(userId)!;
  }

  /**
   * Get users by project ID
   * GET /api/User/project/{projectId}
   */
  getUsersByProject(projectId: string): Observable<User[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ApiResponse<User[]>>(`${this.baseUrl}/project/${projectId}`, { headers })
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error(`[UserApiService] Error fetching users for project ${projectId}:`, error);
          return of([]);
        })
      );
  }

  /**
   * Extract initials from user name
   * "Alice Wonder" → "AW"
   * "Bob" → "B"
   */
  getInitials(name: string): string {
    if (!name) return '?';
    
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Generate consistent avatar color based on user ID or name
   */
  getAvatarColor(userId: number): string {
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#FFA07A', // Light Salmon
      '#98D8C8', // Mint
      '#FFD93D', // Yellow
      '#A8E6CF', // Light Green
      '#FF8B94', // Pink
      '#C7CEEA', // Lavender
      '#FBAED2', // Light Pink
    ];
    
    return colors[userId % colors.length];
  }

  /**
   * Clear cache (useful when user data changes)
   */
  clearCache() {
    this.userCache.clear();
    this.allUsersCache = undefined;
  }
}
