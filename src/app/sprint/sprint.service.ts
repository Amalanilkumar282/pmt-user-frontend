import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Request/Response interfaces for Sprint Creation
export interface SprintRequest {
  projectId: string; // Required
  sprintName?: string | null; // Optional - auto-generated if null
  sprintGoal?: string | null; // Optional
  teamId?: string | null; // Optional - changed to string (GUID)
  startDate?: string | null; // Optional - ISO 8601 format
  endDate?: string | null; // Optional - ISO 8601 format
  targetStoryPoints?: number | null; // Optional
  status?: string | null; // Optional
}

export interface SprintResponse {
  succeeded: boolean;
  statusCode: number;
  data: {
    id: string;
    sprintName: string;
    status: string;
    startDate: string;
    dueDate: string;
    storyPoint: number;
  };
  message?: string;
}

// Sprint API Response from GET /api/sprints/project/{projectId}
export interface SprintApiData {
  id: string;
  projectId: string;
  name: string;
  sprintGoal: string;
  startDate: string;
  dueDate: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  storyPoint: number;
  teamId: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface GetSprintsResponse {
  status: number;
  data: SprintApiData[];
  message: string;
}

// Team interfaces
export interface TeamMember {
  id: string;
  name: string;
  email: string | null; // ⚠️ Can be null - V2 API handles nullable emails
  role: string;
}

export interface Team {
  teamId?: string; // Optional - backend may use teamId
  id?: string; // Optional - backend may use id
  teamName?: string; // Backend uses teamName
  name?: string; // Alternative field name
  projectName?: string;
  description?: string;
  isActive?: boolean;
  tags?: any;
  members?: TeamMember[];
  createdAt?: string;
  updatedAt?: string;
}

// Backend returns array directly, not wrapped in response object
export interface TeamsApiResponse {
  succeeded?: boolean; // Optional - not always present
  statusCode?: number; // Optional - not always present
  data?: Team[]; // Optional - might be array directly
  // Support direct array response
  [key: number]: Team;
  length?: number;
}

// AI Sprint Plan Request/Response
export interface AISprintPlanRequest {
  sprintGoal?: string | null; // Optional
  startDate?: string | null; // Optional - ISO 8601 format
  endDate?: string | null; // Optional - ISO 8601 format
  status?: string | null; // Optional
  targetStoryPoints?: number | null; // Optional
  teamId?: number | null; // Optional - backend uses integer
}

export interface AISprintPlanIssue {
  issueId: string;
  issueKey: string;
  title: string; // Issue title from response
  storyPoints: number;
  suggestedAssigneeId: number;
  rationale: string;
}

export interface AISprintPlanResponse {
  status: number;
  data: {
    sprintPlan: {
      selectedIssues: AISprintPlanIssue[];
      totalStoryPoints: number;
      summary: string;
      recommendations: Array<{
        type: string;
        severity: string;
        message: string;
      }>;
      capacityAnalysis: {
        teamCapacityUtilization: number;
        estimatedCompletionProbability: number;
        riskFactors: string[];
      };
    };
  };
  message: string;
}

// Issue Creation interfaces
export interface IssueCreateRequest {
  title: string;
  description: string;
  issueType: string;
  priority: string;
  storyPoints: number;
  assigneeId?: string;
  projectId: string;
  labels?: string[];
}

export interface IssueCreateResponse {
  succeeded: boolean;
  statusCode: number;
  data: {
    id: string;
    title: string;
    issueType: string;
    priority: string;
    storyPoints: number;
    status: string;
    assigneeId?: string;
    projectId: string;
    labels?: string[];
  };
}

@Injectable({ providedIn: 'root' })
export class SprintService {
  private baseUrl = '/api/sprints';
  private teamsBaseUrl = '/api/Team'; // Note: Capital 'T' as per API documentation
  private issuesBaseUrl = '/api/Issue';

  constructor(private http: HttpClient) {}

  /**
   * Get authorization headers with JWT token from sessionStorage
   * Token is set during login via AuthService
   */
  private getAuthHeaders() {
    const token = sessionStorage.getItem('accessToken');
    
    if (!token) {
      console.error('❌ [SprintService] No access token found in sessionStorage. Please log in.');
    }
    
    return { 'Authorization': `Bearer ${token || ''}` };
  }

  /**
   * Create a new sprint
   * POST /api/sprints
   */
  createSprint(sprint: SprintRequest): Observable<SprintResponse> {
    console.log('Creating sprint:', sprint);
    return this.http.post<SprintResponse>(`${this.baseUrl}`, sprint, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Update an existing sprint
   * PUT /api/sprints/{sprintId}
   */
  updateSprint(sprintId: string, sprint: SprintRequest): Observable<SprintResponse> {
    console.log('Updating sprint:', sprintId, sprint);
    return this.http.put<SprintResponse>(`${this.baseUrl}/${sprintId}`, sprint, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get all sprints for a specific project
   * GET /api/sprints/project/{projectId}
   * 
   * Returns array of sprints including their details:
   * - id, projectId, name, sprintGoal
   * - startDate, dueDate, status (PLANNED/ACTIVE/COMPLETED)
   * - storyPoint, teamId, createdAt, updatedAt
   */
  getSprintsByProject(projectId: string, page?: number, pageSize?: number): Observable<GetSprintsResponse> {
    let url = `${this.baseUrl}/project/${projectId}`;
    const headers = this.getAuthHeaders();
    
    // Add pagination params if provided
    if (page !== undefined && pageSize !== undefined) {
      url += `?page=${page}&pageSize=${pageSize}`;
    }
    
    console.log('🔍 [SprintService] Fetching sprints for project:', {
      projectId,
      url,
      hasToken: !!sessionStorage.getItem('accessToken'),
      pagination: page !== undefined ? { page, pageSize } : 'none'
    });
    
    return this.http.get<GetSprintsResponse>(url, { headers });
  }

  /**
   * Get paginated sprints (new optimized method)
   */
  getSprintsByProjectPaginated(
    projectId: string, 
    page: number = 1, 
    pageSize: number = 20
  ): Observable<{ sprints: SprintApiData[], total: number, hasMore: boolean }> {
    const url = `${this.baseUrl}/project/${projectId}?page=${page}&pageSize=${pageSize}`;
    const headers = this.getAuthHeaders();
    
    return this.http.get<GetSprintsResponse>(url, { headers }).pipe(
      map((response: GetSprintsResponse) => ({
        sprints: response.data || [],
        total: response.data?.length || 0,
        hasMore: (response.data?.length || 0) === pageSize
      }))
    );
  }

  /**
   * Fetch teams for a specific project using V2 API
   * GET /api/Team/project/{projectId}/v2
   * 
   * V2 API properly handles nullable emails and returns wrapped response:
   * Response: {succeeded: true, statusCode: 200, data: [{id, name, members: [...]}]}
   * 
   * Each team member may have null email if not set in database.
   */
  getTeamsByProject(projectId: string): Observable<any> {
    const url = `${this.teamsBaseUrl}/project/${projectId}/v2`;
    const headers = this.getAuthHeaders();
    
    console.log('🔍 [SprintService] Fetching teams for project (V2 API):', {
      projectId,
      url,
      hasToken: !!sessionStorage.getItem('accessToken'),
      headers
    });
    
    return this.http.get<any>(url, { headers });
  }

  /**
   * Generate AI-powered sprint plan
   * POST /api/sprints/projects/{projectId}/ai-plan
   */
  generateAISprintPlan(projectId: string, request: AISprintPlanRequest): Observable<AISprintPlanResponse> {
    console.log('Generating AI sprint plan for project:', projectId, request);
    return this.http.post<AISprintPlanResponse>(
      `${this.baseUrl}/projects/${projectId}/ai-plan`,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Create a single issue
   * POST /api/Issue
   */
  createIssue(issue: IssueCreateRequest): Observable<IssueCreateResponse> {
    console.log('Creating issue:', issue);
    return this.http.post<IssueCreateResponse>(
      `${this.issuesBaseUrl}`,
      issue,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Create multiple issues in batch
   * Returns an array of responses for each issue creation
   */
  createBulkIssues(issues: IssueCreateRequest[]): Observable<IssueCreateResponse[]> {
    console.log('Creating bulk issues:', issues.length);
    
    // Create an array of observables for each issue
    const issueObservables = issues.map(issue => this.createIssue(issue));
    
    // Use forkJoin to wait for all requests to complete
    // Note: This will fail if any single request fails
    // For better error handling, consider using combineLatest or custom logic
    return new Observable(observer => {
      const results: IssueCreateResponse[] = [];
      let completed = 0;
      
      issueObservables.forEach((observable, index) => {
        observable.subscribe({
          next: (response) => {
            results[index] = response;
            completed++;
            if (completed === issueObservables.length) {
              observer.next(results);
              observer.complete();
            }
          },
          error: (error) => {
            console.error(`Failed to create issue at index ${index}:`, error);
            observer.error(error);
          }
        });
      });
    });
  }
}
