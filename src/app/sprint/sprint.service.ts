import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SprintRequest {
  projectId: string;
  sprintName: string;
  sprintGoal: string | null;
  teamAssigned: number | null;
  startDate: string | undefined;
  dueDate: string | undefined;
  status: string;
  storyPoint: number;
}

export interface SprintResponse {
  status: number;
  data: {
    id: string;
    projectId: string;
    sprintName: string;
    sprintGoal: string;
    teamAssigned: number;
    startDate: string;
    dueDate: string;
    status: string;
    storyPoint: number;
  };
  message: string;
}

@Injectable({ providedIn: 'root' })
export class SprintService {
  private baseUrl = '/api/Sprint';

  constructor(private http: HttpClient) {}

  createSprint(sprint: SprintRequest): Observable<SprintResponse> {
    const token = sessionStorage.getItem('accessToken') || '';
    console.log('Auth token from sessionStorage:', token ? 'Token found' : 'No token found');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.post<SprintResponse>(`${this.baseUrl}`, sprint, { headers });
  }
}
