import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Role {
  id: number;
  name: string;
}

export interface RoleApiResponse {
  status: number;
  data: Role[];
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  
  // Signal to cache roles
  private rolesSignal = signal<Role[]>([]);
  
  // Readonly access to roles
  roles = this.rolesSignal.asReadonly();

  /**
   * Fetch all roles from the backend API
   * @returns Observable of roles array
   */
  getAllRoles(): Observable<Role[]> {
    console.log('🔐 Fetching roles from API');

    return this.http.get<RoleApiResponse>(`${this.apiUrl}/api/Role`).pipe(
      map((response) => {
        console.log('✅ Roles API response:', response);

        if ((response.status === 200 || response.status === 0) && response.data) {
          // Cache the roles in signal
          this.rolesSignal.set(response.data);
          console.log('✅ Roles cached successfully:', response.data.length, 'roles');
          return response.data;
        } else {
          console.error('❌ Failed to fetch roles:', response.message);
          return [];
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get role by ID from cached roles
   * @param roleId - The ID of the role
   * @returns Role object or undefined
   */
  getRoleById(roleId: number): Role | undefined {
    return this.rolesSignal().find((role) => role.id === roleId);
  }

  /**
   * Get role name by ID
   * @param roleId - The ID of the role
   * @returns Role name or 'Unknown Role'
   */
  getRoleName(roleId: number): string {
    const role = this.getRoleById(roleId);
    return role ? role.name : 'Unknown Role';
  }

  /**
   * Handle HTTP errors
   * @param error - HTTP error response
   * @returns Observable error
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred while fetching roles';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Unauthorized. Please login again.';
      } else if (error.status === 404) {
        errorMessage = 'Roles endpoint not found.';
      } else if (error.status === 0) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      } else {
        errorMessage = error.error?.message || `Server error: ${error.status}`;
      }
    }

    console.error('RoleService Error:', errorMessage, error);
    return throwError(() => ({ message: errorMessage }));
  }
}
