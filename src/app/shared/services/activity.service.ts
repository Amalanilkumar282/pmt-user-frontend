import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ActivityLogDto {
  id: string;
  userId: number;
  userName?: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
}

export interface ActivityResponse {
  status: number;
  data: ActivityLogDto[]; // Data is an array directly, not nested
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private baseUrl = `${environment.apiUrl}/api/User`;
  
  constructor(private http: HttpClient) {}

  /**
   * Get activity logs for a user
   * @param userId The user ID
   * @param take Number of records to fetch (default: 50)
   */
  getUserActivities(userId: number, take: number = 50): Observable<ActivityResponse> {
    const token = sessionStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ActivityResponse>(
      `${this.baseUrl}/${userId}/activities?take=${take}`,
      { headers }
    );
  }
}
