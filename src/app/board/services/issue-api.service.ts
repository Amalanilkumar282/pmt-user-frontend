import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, IssueApi } from '../models/api-interfaces';
import { Issue } from '../../shared/models/issue.model';
import { AuthTokenService } from './auth-token.service';

export interface CreateIssueDto {
  projectId: string;
  issueType: string;
  title: string;
  description: string;
  priority: string;
  assigneeId: number;
  startDate?: string;
  dueDate?: string;
  sprintId?: string;
  storyPoints?: number;
  epicId?: string;
  reporterId: number;
  attachmentUrl?: string;
}

export interface UpdateIssueDto {
  id: string;
  projectId: string;
  issueType?: string;
  title?: string;
  description?: string;
  priority?: string;
  assigneeId?: number;
  startDate?: string;
  dueDate?: string;
  sprintId?: string;
  storyPoints?: number;
  epicId?: string;
  reporterId?: number;
  attachmentUrl?: string;
  statusId?: number;
}

@Injectable({ providedIn: 'root' })
export class IssueApiService {
  private http = inject(HttpClient);
  private authTokenService = inject(AuthTokenService);
  private baseUrl = `${environment.apiUrl}/api/Issue`;

  /**
   * Get all issues by project ID
   * GET /api/Issue/project/{projectId}/issues
   */
  getIssuesByProject(projectId: string): Observable<Issue[]> {
    this.authTokenService.logAuthStatus(); // Debug auth status
    const headers = this.authTokenService.getAuthHeaders({ 'accept': 'text/plain' });
    
    console.log('🌐 IssueApiService - Fetching issues for project:', projectId);
    console.log('🌐 API URL:', `${this.baseUrl}/project/${projectId}/issues`);
    console.log('🔑 Has Auth Token:', this.authTokenService.isAuthenticated());
    
    return this.http
      .get<ApiResponse<IssueApi[]>>(`${this.baseUrl}/project/${projectId}/issues`, { headers })
      .pipe(
        map(response => {
          console.log('📥 IssueApiService - Raw API response:', response);
          const issues = response.data.map(issue => this.mapIssueApiToIssue(issue));
          console.log('📥 IssueApiService - Mapped issues:', issues);
          return issues;
        })
      );
  }

  /**
   * Get issues by project ID and sprint ID
   * GET /api/Issue/project/{projectId}/sprint/{sprintId}/issues
   */
  getIssuesByProjectAndSprint(projectId: string, sprintId: string): Observable<Issue[]> {
    const headers = this.authTokenService.getAuthHeaders({ 'accept': 'text/plain' });
    return this.http
      .get<ApiResponse<IssueApi[]>>(`${this.baseUrl}/project/${projectId}/sprint/${sprintId}/issues`, { headers })
      .pipe(map(response => response.data.map(issue => this.mapIssueApiToIssue(issue))));
  }

  /**
   * Create new issue
   * POST /api/Issue
   */
  createIssue(dto: CreateIssueDto): Observable<ApiResponse<IssueApi>> {
    const headers = this.authTokenService.getAuthHeaders({ 'accept': 'text/plain' });
    return this.http.post<ApiResponse<IssueApi>>(this.baseUrl, dto, { headers });
  }

  /**
   * Update existing issue (including status)
   * PUT /api/Issue
   */
  updateIssue(dto: UpdateIssueDto): Observable<ApiResponse<string>> {
    const headers = this.authTokenService.getAuthHeaders({ 'accept': 'text/plain' });
    return this.http.put<ApiResponse<string>>(this.baseUrl, dto, { headers });
  }

  /**
   * Update issue status only
   * PUT /api/Issue (with only statusId changed)
   */
  updateIssueStatus(issueId: string, statusId: number, projectId: string): Observable<ApiResponse<string>> {
    const headers = this.authTokenService.getAuthHeaders({ 'accept': 'text/plain' });
    const dto: UpdateIssueDto = {
      id: issueId,
      projectId: projectId,
      statusId: statusId
    };
    return this.http.put<ApiResponse<string>>(this.baseUrl, dto, { headers });
  }

  /**
   * Map IssueApi to frontend Issue model
   */
  private mapIssueApiToIssue(apiIssue: IssueApi): Issue {
    // Parse labels from JSON string
    let labels: string[] = [];
    try {
      labels = apiIssue.labels ? JSON.parse(apiIssue.labels) : [];
    } catch {
      labels = [];
    }

    return {
      id: apiIssue.id,                    // Now using real ID from API
      title: apiIssue.title,
      description: apiIssue.description,
      type: this.mapIssueType(apiIssue.issueType),
      priority: this.mapPriority(apiIssue.priority),
      status: this.mapStatusIdToStatus(apiIssue.statusId), // Now mapping from statusId
      assignee: apiIssue.assigneeId?.toString(),
      labels: labels,
      sprintId: apiIssue.sprintId,
      epicId: apiIssue.epicId,
      parentId: apiIssue.parentIssueId || undefined,
      storyPoints: apiIssue.storyPoints,
      startDate: apiIssue.startDate ? new Date(apiIssue.startDate) : undefined,
      dueDate: apiIssue.dueDate ? new Date(apiIssue.dueDate) : undefined,
      createdAt: new Date(), // API doesn't provide, using current time
      updatedAt: new Date(), // API doesn't provide, using current time
      teamId: undefined // Not provided in API response
    };
  }

  /**
   * Map statusId to IssueStatus
   * This is a basic mapping - you may need to adjust based on your status configuration
   */
  private mapStatusIdToStatus(statusId: number): 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED' {
    // Default mapping - adjust based on your actual status IDs
    const statusMap: Record<number, 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED'> = {
      1: 'TODO',
      2: 'IN_PROGRESS',
      3: 'IN_REVIEW',
      4: 'DONE',
      5: 'BLOCKED'
    };
    return statusMap[statusId] || 'TODO';
  }

  /**
   * Map API issue type to frontend IssueType
   */
  private mapIssueType(apiType: string): 'STORY' | 'TASK' | 'BUG' | 'EPIC' {
    const typeMap: Record<string, 'STORY' | 'TASK' | 'BUG' | 'EPIC'> = {
      'STORY': 'STORY',
      'TASK': 'TASK',
      'BUG': 'BUG',
      'EPIC': 'EPIC'
    };
    return typeMap[apiType] || 'TASK';
  }

  /**
   * Map API priority to frontend Priority
   */
  private mapPriority(apiPriority: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const priorityMap: Record<string, 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = {
      'CRITICAL': 'CRITICAL',
      'HIGH': 'HIGH',
      'MEDIUM': 'MEDIUM',
      'LOW': 'LOW'
    };
    return priorityMap[apiPriority] || 'MEDIUM';
  }

  /**
   * Map frontend Issue to CreateIssueDto
   */
  mapIssueToCreateDto(issue: Partial<Issue>, projectId: string): CreateIssueDto {
    return {
      projectId: projectId,
      issueType: issue.type || 'TASK',
      title: issue.title || '',
      description: issue.description || '',
      priority: issue.priority || 'MEDIUM',
      assigneeId: issue.assignee ? parseInt(issue.assignee) : 1,
      startDate: issue.startDate?.toISOString(),
      dueDate: issue.dueDate?.toISOString(),
      sprintId: issue.sprintId || undefined,
      storyPoints: issue.storyPoints || 0,
      epicId: issue.epicId || undefined,
      reporterId: 1, // TODO: Get from auth service
      attachmentUrl: undefined
    };
  }
}
