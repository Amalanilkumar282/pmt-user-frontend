import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Status {
  id: number;
  statusName: string;
}

export interface StatusApiResponse {
  status: number;
  data: Status[];
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class StatusService {
  private baseUrl = `${environment.apiUrl}/api/Status`;
  private statusCache = new Map<string, Observable<Status[]>>();

  constructor(private http: HttpClient) {}

  /**
   * Get authorization headers with JWT token from sessionStorage
   */
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
   * Get all statuses for a project
   * GET /api/Issue/project/{projectId}/statuses
   */
  getStatusesByProject(projectId: string): Observable<Status[]> {
    // Check cache first
    if (this.statusCache.has(projectId)) {
      return this.statusCache.get(projectId)!;
    }

    // Backend exposes statuses via the Issue controller for project-level statuses
    const url = `${environment.apiUrl}/api/Issue/project/${projectId}/statuses`;
    const headers = this.getAuthHeaders();
    
    console.log('📥 [StatusService] Fetching statuses for project:', projectId);
    
    const request = this.http.get<StatusApiResponse>(url, { headers }).pipe(
      map((response) => {
        console.log('✅ [StatusService] Statuses loaded:', response);
        return response.data || [];
      }),
      catchError((error) => {
        console.error('❌ [StatusService] Error loading statuses:', error);
        // Return default statuses on error
        return of([
          { id: 1, statusName: 'TO_DO' },
          { id: 2, statusName: 'IN_PROGRESS' },
          { id: 3, statusName: 'IN_REVIEW' },
          { id: 4, statusName: 'DONE' },
          { id: 5, statusName: 'BLOCKED' }
        ]);
      }),
      shareReplay(1) // Cache the result
    );

    this.statusCache.set(projectId, request);
    return request;
  }

  /**
   * Map status ID to status name
   */
  mapStatusIdToName(statusId: number): string {
    const statusMap: { [key: number]: string } = {
      1: 'TO_DO',
      2: 'IN_PROGRESS',
      3: 'IN_REVIEW',
      4: 'DONE',
      5: 'BLOCKED'
    };
    return statusMap[statusId] || 'TO_DO';
  }

  /**
   * Map status name to status ID
   */
  mapStatusNameToId(statusName: string): number {
    const statusMap: { [key: string]: number } = {
      'TO_DO': 1,
      'TODO': 1,
      'IN_PROGRESS': 2,
      'IN_REVIEW': 3,
      'DONE': 4,
      'BLOCKED': 5
    };
    return statusMap[statusName] || 1;
  }

  /**
   * Clear cache (useful when statuses are updated)
   */
  clearCache(): void {
    this.statusCache.clear();
  }
}
