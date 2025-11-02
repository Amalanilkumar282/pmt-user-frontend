import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, LabelApi } from '../models/api-interfaces';

export interface Label {
  id: number;
  name: string;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class LabelApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/Label`;

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
   * Get all labels
   * GET /api/Label
   */
  getAllLabels(): Observable<Label[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ApiResponse<LabelApi[]>>(`${this.baseUrl}`, { headers })
      .pipe(
        map(response => response.data.map(label => this.mapLabelApiToLabel(label))),
        // If labels endpoint is missing or returns 404, fall back to empty list
        // This prevents create-issue modal from breaking when backend doesn't expose labels
        catchError(err => {
          console.warn('[LabelApiService] Failed to fetch labels, returning empty list', err?.status || err);
          return of([] as Label[]);
        })
      );
  }

  /**
   * Map LabelApi to frontend Label model
   */
  private mapLabelApiToLabel(apiLabel: LabelApi): Label {
    return {
      id: apiLabel.id,
      name: apiLabel.name,
      color: apiLabel.colour // Note: API uses 'colour' spelling
    };
  }
}
