import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  GetIssuesResponse,
  IssueApiResponse,
  Issue,
  IssueType,
  IssuePriority,
  IssueStatus,
} from '../models/issue.model';

export interface CreateIssueRequest {
  projectId: string;
  issueType: string;
  title: string;
  description: string;
  priority: string;
  assigneeId: number | null;
  startDate: string | undefined;
  dueDate: string | undefined;
  sprintId: string | null;
  storyPoints: number;
  epicId: string | null;
  reporterId: number | null;
  attachmentUrl: string | null;
  labels: string | undefined;
  statusId?: number; // Optional: defaults to TODO (1) if not provided
}

export interface UpdateIssueRequest {
  projectId: string;
  issueType: string;
  title: string;
  description: string;
  priority: string;
  assigneeId: number | null;
  startDate: string | null;
  dueDate: string | null;
  sprintId: string | null;
  storyPoints: number;
  epicId: string | null;
  reporterId: number | null;
  attachmentUrl: string | null;
  statusId: number;
  labels: string | null;
}

export interface CreateIssueResponse {
  status: number;
  data: {
    projectId: string;
    issueType: string;
    title: string;
    description: string;
    priority: string;
    assigneeId: number;
    startDate: string;
    dueDate: string;
    sprintId: string;
    storyPoints: number;
    epicId: string;
    reporterId: number;
    attachmentUrl: string;
    labels: string;
  };
  message: string;
}

export interface UpdateIssueResponse {
  status: number;
  data: any;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class IssueService {
  private baseUrl = '/api/Issue';

  constructor(private http: HttpClient) {}

  /**
   * Get authorization headers with JWT token from sessionStorage
   */
  private getAuthHeaders() {
    const token = sessionStorage.getItem('accessToken');
    
    if (!token) {
      console.error('❌ [IssueService] No access token found in sessionStorage. Please log in.');
    }
    
    return { 'Authorization': `Bearer ${token || ''}` };
  }

  /**
   * Map status ID to status string
   */
  private mapStatusIdToStatus(statusId: number): IssueStatus {
    const statusMap: { [key: number]: IssueStatus } = {
      1: 'TODO',
      2: 'IN_PROGRESS',
      3: 'IN_REVIEW',
      4: 'DONE',
      5: 'BLOCKED',
    };
    return statusMap[statusId] || 'TODO';
  }

  /**
   * Convert backend API response to frontend Issue model
   */
  private mapApiResponseToIssue(apiIssue: IssueApiResponse): Issue {
    return {
      id: apiIssue.id,
      key: apiIssue.key,
      projectId: apiIssue.projectId,
      title: apiIssue.title,
      description: apiIssue.description,
      type: apiIssue.issueType as IssueType,
      issueType: apiIssue.issueType,
      priority: apiIssue.priority as IssuePriority,
      status: this.mapStatusIdToStatus(apiIssue.statusId),
      statusId: apiIssue.statusId,
      statusName: apiIssue.statusName,
      assigneeId: apiIssue.assigneeId,
      assignee: apiIssue.assigneeId ? `User ${apiIssue.assigneeId}` : undefined,
      assigneeName: apiIssue.assigneeName || undefined,
      reporterId: apiIssue.reporterId,
      storyPoints: apiIssue.storyPoints,
      sprintId: apiIssue.sprintId || undefined,
      sprintName: apiIssue.sprintName || undefined,
      epicId: apiIssue.epicId || undefined,
      epicName: apiIssue.epicName || undefined,
      parentIssueId: apiIssue.parentIssueId,
      parentId: apiIssue.parentIssueId || undefined,
      labels: apiIssue.labels ? JSON.parse(apiIssue.labels) : [],
      attachmentUrl: apiIssue.attachmentUrl,
      startDate: apiIssue.startDate ? new Date(apiIssue.startDate) : undefined,
      dueDate: apiIssue.dueDate ? new Date(apiIssue.dueDate) : undefined,
      createdAt: apiIssue.createdAt ? new Date(apiIssue.createdAt) : new Date(),
      updatedAt: apiIssue.updatedAt ? new Date(apiIssue.updatedAt) : new Date(),
    };
  }

  /**
   * Get all issues for a project (with optional pagination)
   */
  getProjectIssues(projectId: string, page?: number, pageSize?: number): Observable<Issue[]> {
    let url = `${this.baseUrl}/project/${projectId}/issues`;
    
    // Add pagination params if provided
    if (page !== undefined && pageSize !== undefined) {
      url += `?page=${page}&pageSize=${pageSize}`;
    }
    
    return this.http.get<GetIssuesResponse>(url, { headers: this.getAuthHeaders() }).pipe(
      map((response) => {
        if (response.status === 200 && response.data) {
          return response.data.map((apiIssue) => this.mapApiResponseToIssue(apiIssue));
        }
        return [];
      })
    );
  }

  /**
   * Get paginated issues for a project (new optimized method)
   */
  getProjectIssuesPaginated(
    projectId: string, 
    page: number = 1, 
    pageSize: number = 50
  ): Observable<{ issues: Issue[], total: number, hasMore: boolean }> {
    const url = `${this.baseUrl}/project/${projectId}/issues?page=${page}&pageSize=${pageSize}`;
    
    return this.http.get<GetIssuesResponse>(url, { headers: this.getAuthHeaders() }).pipe(
      map((response) => {
        if (response.status === 200 && response.data) {
          const issues = response.data.map((apiIssue) => this.mapApiResponseToIssue(apiIssue));
          return {
            issues,
            total: response.data.length,
            hasMore: response.data.length === pageSize
          };
        }
        return { issues: [], total: 0, hasMore: false };
      })
    );
  }

  /**
   * Get all issues assigned to a user
   */
  getIssuesByUser(userId: string): Observable<Issue[]> {
    const url = `${this.baseUrl}/user/${userId}`;
    return this.http.get<GetIssuesResponse>(url, { headers: this.getAuthHeaders() }).pipe(
      map((response) => {
        if (response.status === 200 && response.data) {
          return response.data.map((apiIssue) => this.mapApiResponseToIssue(apiIssue));
        }
        return [];
      })
    );
  }

  createIssue(issue: CreateIssueRequest): Observable<CreateIssueResponse> {
    return this.http.post<CreateIssueResponse>(this.baseUrl, issue, { headers: this.getAuthHeaders() });
  }

  /**
   * Update an existing issue
   */
  updateIssue(issueId: string, issue: UpdateIssueRequest): Observable<UpdateIssueResponse> {
    const url = `${this.baseUrl}/${issueId}`;
    const headers = this.getAuthHeaders();
    
    console.log('🔄 [IssueService] Updating issue:', {
      issueId,
      url,
      headers,
      payload: issue
    });
    console.log('🔄 [IssueService] Request JSON:', JSON.stringify(issue, null, 2));
    
    return this.http.put<UpdateIssueResponse>(url, issue, { headers }).pipe(
      map((response) => {
        console.log('✅ [IssueService] Update successful:', response);
        return response;
      })
    );
  }

  /**
   * Update an existing issue using V2 endpoint (supports null sprintId)
   * PUT /api/Issue/{id}/v2
   */
  updateIssueV2(issueId: string, updateData: Partial<UpdateIssueRequest>): Observable<UpdateIssueResponse> {
    const url = `${this.baseUrl}/${issueId}/v2`;
    const headers = this.getAuthHeaders();
    
    console.log('🔄 [IssueService] Updating issue V2:', {
      issueId,
      url,
      payload: updateData
    });
    
    return this.http.put<UpdateIssueResponse>(url, updateData, { headers }).pipe(
      map((response) => {
        console.log('✅ [IssueService] V2 Update successful:', response);
        return response;
      })
    );
  }
}
