import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, SprintApi } from '../models/api-interfaces';
import { Sprint } from '../models';

@Injectable({ providedIn: 'root' })
export class SprintApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/Sprint`;

  private getAuthHeaders(): HttpHeaders {
    // Check if running in browser (not SSR)
    if (typeof sessionStorage !== 'undefined') {
      const token = sessionStorage.getItem('accessToken') || '';
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      });
    }
    // SSR fallback - no auth token
    return new HttpHeaders({
      'accept': '*/*'
    });
  }

  /**
   * Get all sprints by project ID
   * GET /api/sprints/project/{projectId}
   */
  getSprintsByProject(projectId: string): Observable<Sprint[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ApiResponse<SprintApi[]>>(`${this.baseUrl}/project/${projectId}`, { headers })
      .pipe(map(response => response.data.map(sprint => this.mapSprintApiToSprint(sprint))));
  }

  /**
   * Map SprintApi to frontend Sprint model
   */
  private mapSprintApiToSprint(apiSprint: SprintApi): Sprint {
    return {
      id: apiSprint.id,
      name: apiSprint.name,
      startDate: new Date(apiSprint.startDate),
      endDate: new Date(apiSprint.dueDate),
      status: this.mapSprintStatus(apiSprint.status),
      issues: [] // Issues will be loaded separately
    };
  }

  /**
   * Map API sprint status to frontend status
   */
  private mapSprintStatus(apiStatus: string): 'PLANNED' | 'ACTIVE' | 'COMPLETED' {
    const statusMap: Record<string, 'PLANNED' | 'ACTIVE' | 'COMPLETED'> = {
      'PLANNED': 'PLANNED',
      'ACTIVE': 'ACTIVE',
      'COMPLETED': 'COMPLETED'
    };
    return statusMap[apiStatus] || 'PLANNED';
  }
}
