import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

export interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  customerOrgName: string | null;
  customerDomainUrl: string | null;
  customerDescription: string | null;
  pocEmail: string | null;
  pocPhone: string | null;
  projectManagerName: string | null;
  deliveryUnitName: string | null;
  statusName: string | null;
}

export interface ApiResponse {
  status: number;
  data: ProjectResponse[];
  message: string;
}

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  du: string;
  lastUpdated: string;
  teamMembers: string[];
  starred: boolean;
  description?: string | null;
  customerOrgName?: string | null;
  customerDomainUrl?: string | null;
  customerDescription?: string | null;
  pocEmail?: string | null;
  pocPhone?: string | null;
  projectManagerName?: string | null;
  deliveryUnitName?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  private apiUrl = environment.apiUrl;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * Get all projects for a specific user
   * @param userId - The ID of the user
   * @returns Observable of projects array
   */
  getProjectsByUserId(userId: string): Observable<Project[]> {
    console.log('🔐 Fetching projects for user:', userId);

    return this.http.get<ApiResponse>(`${this.apiUrl}/api/Project/user/${userId}`).pipe(
      map((response) => {
        console.log('✅ Projects API response:', response);

        if (response.status === 200 && response.data) {
          return response.data.map((project) => this.transformToProject(project));
        } else {
          console.error('❌ Failed to fetch projects:', response.message);
          return [];
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get recent projects for a specific user
   * @param userId - The ID of the user
   * @param take - Number of recent projects to fetch (default: 2)
   * @returns Observable of recent projects array
   */
  getRecentProjects(userId: string, take: number = 2): Observable<Project[]> {
    console.log('🔐 Fetching recent projects for user:', userId, 'take:', take);

    return this.http
      .get<ApiResponse>(`${this.apiUrl}/api/Project/recent/${userId}?take=${take}`)
      .pipe(
        map((response) => {
          console.log('✅ Recent Projects API response:', response);

          if (response.status === 200 && response.data) {
            return response.data.map((project) => this.transformToProject(project));
          } else {
            console.error('❌ Failed to fetch recent projects:', response.message);
            return [];
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Transform API project response to Project interface
   * @param apiProject - Project data from API
   * @returns Transformed Project object
   */
  private transformToProject(apiProject: ProjectResponse): Project {
    return {
      id: apiProject.id,
      name: apiProject.name,
      status: this.mapStatus(apiProject.statusName),
      du: apiProject.deliveryUnitName || 'Unknown',
      lastUpdated: new Date().toISOString(),
      teamMembers: [],
      starred: this.getStarredStatus(apiProject.id),
      description: apiProject.description,
      customerOrgName: apiProject.customerOrgName,
      customerDomainUrl: apiProject.customerDomainUrl,
      customerDescription: apiProject.customerDescription,
      pocEmail: apiProject.pocEmail,
      pocPhone: apiProject.pocPhone,
      projectManagerName: apiProject.projectManagerName,
      deliveryUnitName: apiProject.deliveryUnitName,
    };
  }

  /**
   * Map status name to status type
   * @param statusName - Status name from API
   * @returns 'active' or 'inactive'
   */
  private mapStatus(statusName: string | null): 'active' | 'inactive' {
    if (!statusName) return 'active';
    return statusName.toLowerCase() === 'active' ? 'active' : 'inactive';
  }

  /**
   * Extract DU (Delivery Unit) from customer org name or return default
   * @param customerOrgName - Customer organization name
   * @returns DU code
   */
  private extractDU(customerOrgName: string | null): string {
    if (!customerOrgName) return 'UNK';

    // Extract first 3 letters as DU code
    const du = customerOrgName.substring(0, 3).toUpperCase();
    return du || 'UNK';
  }

  /**
   * Get starred status from session storage
   * @param projectId - Project ID
   * @returns boolean indicating if project is starred
   */
  private getStarredStatus(projectId: string): boolean {
    if (!this.isBrowser) return false;

    const starredProjects = sessionStorage.getItem('starredProjects');
    if (starredProjects) {
      const starred: string[] = JSON.parse(starredProjects);
      return starred.includes(projectId);
    }
    return false;
  }

  /**
   * Toggle starred status for a project
   * @param projectId - Project ID
   * @returns New starred status
   */
  toggleStarredStatus(projectId: string): boolean {
    if (!this.isBrowser) return false;

    const starredProjects = sessionStorage.getItem('starredProjects');
    let starred: string[] = starredProjects ? JSON.parse(starredProjects) : [];

    const index = starred.indexOf(projectId);
    if (index > -1) {
      // Remove from starred
      starred.splice(index, 1);
      sessionStorage.setItem('starredProjects', JSON.stringify(starred));
      return false;
    } else {
      // Add to starred
      starred.push(projectId);
      sessionStorage.setItem('starredProjects', JSON.stringify(starred));
      return true;
    }
  }

  /**
   * Get user ID from session storage
   * @returns User ID or null if not found
   */
  getUserId(): string | null {
    if (!this.isBrowser) return null;
    return sessionStorage.getItem('userId');
  }

  /**
   * Set current project ID in session storage
   * @param projectId - Project ID to set
   */
  setCurrentProjectId(projectId: string): void {
    if (this.isBrowser) {
      sessionStorage.setItem('currentProjectId', projectId);
      console.log('✅ Current project ID set:', projectId);
    }
  }

  /**
   * Get current project ID from session storage
   * @returns Current project ID or null
   */
  getCurrentProjectId(): string | null {
    if (!this.isBrowser) return null;
    return sessionStorage.getItem('currentProjectId');
  }

  /**
   * Clear current project ID from session storage
   */
  clearCurrentProjectId(): void {
    if (this.isBrowser) {
      sessionStorage.removeItem('currentProjectId');
      console.log('✅ Current project ID cleared');
    }
  }

  /**
   * Handle HTTP errors
   * @param error - HTTP error response
   * @returns Observable error
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred while fetching projects';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Unauthorized. Please login again.';
      } else if (error.status === 404) {
        errorMessage = 'Projects not found for this user.';
      } else if (error.status === 0) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      } else {
        errorMessage = error.error?.message || `Server error: ${error.status}`;
      }
    }

    console.error('ProjectService Error:', errorMessage, error);
    return throwError(() => ({ message: errorMessage }));
  }
}
