import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  status: number;
  data: T;
  message: string;
  succeeded?: boolean;
}

export interface SprintDto {
  id: string;
  name?: string;
  sprintName?: string;
  sprint_goal?: string;
  sprintGoal?: string;
  start_date?: string;
  startDate?: string;
  due_date?: string;
  dueDate?: string;
  status: string;
  story_point?: string | number;
  storyPoint?: number;
  project_id?: string;
  projectId?: string;
  team_id?: number;
  teamId?: number;
  team_assigned?: number;
  teamAssigned?: number;
}

export interface EpicDto {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  project_id?: string;
  projectId?: string;
  start_date?: string;
  startDate?: string;
  due_date?: string;
  dueDate?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  assignee_id?: number;
  assigneeId?: number;
  reporter_id?: number;
  reporterId?: number;
  labels?: string[] | string;
}

export interface IssueDto {
  id: string;
  key?: string;
  issue_key?: string;
  issueKey?: string;
  title: string;
  description: string;
  type?: string;
  issue_type?: string;
  issueType?: string;
  priority: string;
  status: string | number;
  assignee_id?: number;
  assigneeId?: number;
  assignee_name?: string;
  assigneeName?: string;
  reporter_id?: number;
  reporterId?: number;
  reporter_name?: string;
  reporterName?: string;
  project_id?: string;
  projectId?: string;
  sprint_id?: string | null;
  sprintId?: string | null;
  epic_id?: string | null;
  epicId?: string | null;
  story_points?: number;
  storyPoints?: number;
  created_at?: string;
  createdAt?: string;
  updated_at?: string | null;
  updatedAt?: string | null;
  start_date?: string | null;
  startDate?: string | null;
  due_date?: string | null;
  dueDate?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TimelineService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get authorization headers with JWT token from sessionStorage
   */
  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('accessToken');
    
    if (!token) {
      console.error('❌ [TimelineService] No access token found in sessionStorage');
      console.error('❌ [TimelineService] Please log in again to get a valid token');
    } else {
      console.log('🔑 [TimelineService] Using token:', token.substring(0, 20) + '...');
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token || ''}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Fetch all sprints for a project
   * GET /api/sprints/project/{projectId}
   */
  getSprintsByProject(projectId: string): Observable<SprintDto[]> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiUrl}/api/sprints/project/${projectId}`;
    
    console.log('🔍 [TimelineService] Fetching sprints:', { projectId, url });
    
    return this.http.get<SprintDto[] | ApiResponse<SprintDto[]>>(url, { headers }).pipe(
      map(response => {
        console.log('✅ [TimelineService] Sprints response:', response);
        
        // Handle both response formats
        if (Array.isArray(response)) {
          // Direct array response
          return response;
        } else if (response && 'data' in response && response.data) {
          // Wrapped in ApiResponse
          return response.data;
        }
        
        return [];
      }),
      catchError(error => {
        // If 404 (no sprints found) or 401 (unauthorized), return empty array instead of throwing error
        if (error.status === 404) {
          console.warn('⚠️ [TimelineService] No sprints found for project, returning empty array');
          return of([]);
        }
        if (error.status === 401) {
          console.error('❌ [TimelineService] Unauthorized - token may be expired');
          return of([]);
        }
        console.error('❌ [TimelineService] Error fetching sprints:', error);
        return of([]);
      })
    );
  }

  /**
   * Fetch all epics for a project
   * GET /api/epic/project/{projectId}
   */
  getEpicsByProject(projectId: string): Observable<EpicDto[]> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiUrl}/api/epic/project/${projectId}`;
    
    console.log('🔍 [TimelineService] Fetching epics:', { projectId, url });
    
    return this.http.get<EpicDto[] | ApiResponse<EpicDto[]>>(url, { headers }).pipe(
      map(response => {
        console.log('✅ [TimelineService] Epics response:', response);
        
        // Handle both response formats
        if (Array.isArray(response)) {
          return response;
        } else if (response && 'data' in response && response.data) {
          return response.data;
        }
        
        return [];
      }),
      catchError(error => {
        // If 404 (no epics found) or 401 (unauthorized), return empty array instead of throwing error
        if (error.status === 404) {
          console.warn('⚠️ [TimelineService] No epics found for project, returning empty array');
          return of([]);
        }
        if (error.status === 401) {
          console.error('❌ [TimelineService] Unauthorized - token may be expired');
          return of([]);
        }
        console.error('❌ [TimelineService] Error fetching epics:', error);
        return of([]);
      })
    );
  }

  /**
   * Fetch all issues for a project
   * GET /api/issue/project/{projectId}/issues
   */
  getIssuesByProject(projectId: string): Observable<IssueDto[]> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiUrl}/api/issue/project/${projectId}/issues`;
    
    console.log('🔍 [TimelineService] Fetching issues:', { projectId, url });
    
    return this.http.get<IssueDto[] | ApiResponse<IssueDto[]>>(url, { headers }).pipe(
      map(response => {
        console.log('✅ [TimelineService] Issues response:', response);
        
        // Handle both response formats
        if (Array.isArray(response)) {
          return response;
        } else if (response && 'data' in response && response.data) {
          return response.data;
        }
        
        return [];
      }),
      catchError(error => {
        // If 404 (no issues found) or 401 (unauthorized), return empty array instead of throwing error
        if (error.status === 404) {
          console.warn('⚠️ [TimelineService] No issues found for project, returning empty array');
          return of([]);
        }
        if (error.status === 401) {
          console.error('❌ [TimelineService] Unauthorized - token may be expired');
          return of([]);
        }
        console.error('❌ [TimelineService] Error fetching issues:', error);
        return of([]);
      })
    );
  }

  /**
   * Fetch all timeline data for a project (sprints, epics, issues)
   */
  getTimelineData(projectId: string): Observable<{
    sprints: SprintDto[];
    epics: EpicDto[];
    issues: IssueDto[];
  }> {
    return forkJoin({
      sprints: this.getSprintsByProject(projectId),
      epics: this.getEpicsByProject(projectId),
      issues: this.getIssuesByProject(projectId)
    });
  }
}
