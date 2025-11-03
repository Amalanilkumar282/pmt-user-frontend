import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EpicApi } from '../models/api-interfaces';

export interface Epic {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  dueDate: Date;
  assigneeName: string;
  reporterName: string;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class EpicApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/Epic`;

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
   * Get all epics by project ID
   * GET /api/Epic/project/{projectId}
   */
  getEpicsByProject(projectId: string): Observable<Epic[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<EpicApi[]>(`${this.baseUrl}/project/${projectId}`, { headers })
      .pipe(map(response => response.map(epic => this.mapEpicApiToEpic(epic))));
  }

  /**
   * Map EpicApi to frontend Epic model
   */
  private mapEpicApiToEpic(apiEpic: EpicApi): Epic {
    return {
      id: apiEpic.id,
      title: apiEpic.title,
      description: apiEpic.description,
      startDate: new Date(apiEpic.startDate),
      dueDate: new Date(apiEpic.dueDate),
      assigneeName: apiEpic.assigneeName,
      reporterName: apiEpic.reporterName,
      labels: apiEpic.labels,
      createdAt: new Date(apiEpic.createdAt),
      updatedAt: new Date(apiEpic.updatedAt)
    };
  }

  /**
   * Get single epic by ID
   * GET /api/Epic/{id}
   */
  getEpicById(epicId: string) {
    const headers = this.getAuthHeaders();
    return this.http
      .get<{ status: number; data: EpicApi }>(`${this.baseUrl}/${epicId}`, { headers })
      .pipe(map(response => this.mapEpicApiToEpic(response.data)));
  }
}
