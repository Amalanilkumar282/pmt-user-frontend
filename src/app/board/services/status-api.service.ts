import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-interfaces';

export interface Status {
  id: number;
  statusName: string;
}

@Injectable({ providedIn: 'root' })
export class StatusApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/Status`;

  private getAuthHeaders(): HttpHeaders {
    // Check if running in browser (not SSR)
    if (typeof sessionStorage !== 'undefined') {
      const token = sessionStorage.getItem('accessToken') || '';
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'accept': 'text/plain'
      });
    }
    // SSR fallback - no auth token
    return new HttpHeaders({
      'accept': 'text/plain'
    });
  }

  /**
   * Get status by ID
   * GET /api/Status/{statusId}
   */
  getStatusById(statusId: number): Observable<Status> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ApiResponse<Status>>(`${this.baseUrl}/${statusId}`, { headers })
      .pipe(map(response => response.data));
  }

  /**
   * Get all statuses (if endpoint exists)
   * GET /api/Status
   */
  getAllStatuses(): Observable<Status[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ApiResponse<Status[]>>(this.baseUrl, { headers })
      .pipe(map(response => response.data));
  }

  /**
   * Get all statuses for a specific project
   * GET /api/Status/project/{projectId}
   */
  getStatusesByProject(projectId: string): Observable<Status[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ApiResponse<Status[]>>(`${this.baseUrl}/project/${projectId}`, { headers })
      .pipe(map(response => response.data));
  }
}
