import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
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
  status?: string | number;
  status_id?: number;
  statusId?: number;
  status_name?: string;
  statusName?: string;
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

export interface StatusDto {
  id: number;
  statusName: string;
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
    
    return this.http.get<SprintDto[] | ApiResponse<SprintDto[]>>(url, { headers }).pipe(
      map(response => {
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
        if (error.status === 404 || error.status === 401) {
          return of([]);
        }
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
    
    return this.http.get<EpicDto[] | ApiResponse<EpicDto[]>>(url, { headers }).pipe(
      map(response => {
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
        if (error.status === 404 || error.status === 401) {
          return of([]);
        }
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
    
    return this.http.get<IssueDto[] | ApiResponse<IssueDto[]>>(url, { headers }).pipe(
      map(response => {
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
        if (error.status === 404 || error.status === 401) {
          return of([]);
        }
        return of([]);
      })
    );
  }

  /**
   * Fetch all unique statuses for a project
   * GET /api/Issue/project/{projectId}/statuses
   */
  getStatusesByProject(projectId: string): Observable<StatusDto[]> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiUrl}/api/Issue/project/${projectId}/statuses`;
    
    return this.http.get<ApiResponse<StatusDto[]>>(url, { headers }).pipe(
      map(response => {
        // Handle wrapped response format
        if (response && 'data' in response && response.data) {
          return response.data;
        }
        
        return [];
      }),
      catchError(error => {
        // If 404 (no statuses found) or 401 (unauthorized), return empty array instead of throwing error
        if (error.status === 404 || error.status === 401) {
          return of([]);
        }
        return of([]);
      })
    );
  }

  /**
   * Fetch all timeline data for a project (sprints, epics, issues)
   * OPTIMIZED: Calls APIs in parallel for maximum speed
   */
  getTimelineData(projectId: string): Observable<{
    sprints: SprintDto[];
    epics: EpicDto[];
    issues: IssueDto[];
  }> {
    // Parallel API calls for maximum performance
    console.log(`🚀 [TimelineService] Fetching timeline data in PARALLEL for project: ${projectId}`);
    
    return forkJoin({
      sprints: this.getSprintsByProject(projectId),
      epics: this.getEpicsByProject(projectId),
      issues: this.getIssuesByProject(projectId)
    }).pipe(
      shareReplay(1) // Cache the result for multiple subscribers
    );
  }

  /**
   * Fetch timeline data progressively for better UX
   * Returns partial data as each API call completes
   * OPTIMIZED: Parallel execution with progressive callbacks
   */
  getTimelineDataProgressive(
    projectId: string,
    onSprintsLoaded?: (sprints: SprintDto[]) => void,
    onEpicsLoaded?: (epics: EpicDto[]) => void,
    onIssuesLoaded?: (issues: IssueDto[]) => void
  ): Observable<{
    sprints: SprintDto[];
    epics: EpicDto[];
    issues: IssueDto[];
  }> {
    console.log(`🚀 [TimelineService] Fetching timeline data PROGRESSIVELY for project: ${projectId}`);
    
    // Start all requests in parallel
    const sprints$ = this.getSprintsByProject(projectId).pipe(shareReplay(1));
    const epics$ = this.getEpicsByProject(projectId).pipe(shareReplay(1));
    const issues$ = this.getIssuesByProject(projectId).pipe(shareReplay(1));
    
    // Trigger callbacks as data arrives
    if (onSprintsLoaded) {
      sprints$.subscribe(onSprintsLoaded);
    }
    if (onEpicsLoaded) {
      epics$.subscribe(onEpicsLoaded);
    }
    if (onIssuesLoaded) {
      issues$.subscribe(onIssuesLoaded);
    }
    
    // Return combined result
    return forkJoin({
      sprints: sprints$,
      epics: epics$,
      issues: issues$
    });
  }

  /**
   * Update epic dates (for drag-and-drop timeline functionality)
   * PUT /api/Epic/{epicId}/dates
   */
  updateEpicDates(epicId: string, startDate: Date, dueDate: Date): Observable<any> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiUrl}/api/Epic/${epicId}/dates`;
    
    return this.http.put(url, {
      startDate: startDate.toISOString(),
      dueDate: dueDate.toISOString()
    }, { headers }).pipe(
      catchError(error => {
        console.error('Error updating epic dates:', error);
        throw error;
      })
    );
  }

  /**
   * Update issue dates (for drag-and-drop timeline functionality)
   * PUT /api/Issue/{issueId}/dates
   */
  updateIssueDates(issueId: string, startDate: Date, dueDate: Date): Observable<any> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiUrl}/api/Issue/${issueId}/dates`;
    
    return this.http.put(url, {
      startDate: startDate.toISOString(),
      dueDate: dueDate.toISOString()
    }, { headers }).pipe(
      catchError(error => {
        console.error('Error updating issue dates:', error);
        throw error;
      })
    );
  }

  /**
   * Fetch all timeline data for a project in parallel
   * Alias for getTimelineData() - both use optimized parallel calls
   */
  getTimelineDataParallel(projectId: string): Observable<{
    sprints: SprintDto[];
    epics: EpicDto[];
    issues: IssueDto[];
  }> {
    // Use the optimized parallel implementation
    return this.getTimelineData(projectId);
  }
}
