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
  issueType: string;
  title: string;
  description: string;
  priority: string;
  assigneeId: number;
  startDate?: string;
  dueDate?: string;
  sprintId?: string | null;
  storyPoints: number;
  epicId?: string | null;
  reporterId: number;
  attachmentUrl?: string | null;
  statusId: number;
  labels: string;
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
    const headers = this.authTokenService.getAuthHeaders({ 'accept': 'text/plain' });
    
    return this.http
      .get<ApiResponse<IssueApi[]>>(`${this.baseUrl}/project/${projectId}/issues`, { headers })
      .pipe(
        map(response => response.data.map(issue => this.mapIssueApiToIssue(issue)))
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
    const headers = this.authTokenService.getAuthHeaders({ 'accept': 'text/plain', 'Content-Type': 'application/json' });
    console.log('[IssueApiService] Sending update DTO:', dto);
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

    const mappedStatus = this.mapStatusIdToStatus(apiIssue.statusId);

    return {
      id: apiIssue.id,                    // Now using real ID from API
      key: apiIssue.key,                  // Issue key (PROJ-123)
      title: apiIssue.title,
      description: apiIssue.description,
      type: this.mapIssueType(apiIssue.issueType),
      priority: this.mapPriority(apiIssue.priority),
      status: mappedStatus, // Now mapping from statusId
      statusId: apiIssue.statusId, // CRITICAL: Preserve statusId for column matching
      // Prefer assignee name from API when available; fall back to id string
      assignee: (apiIssue as any).assigneeName ?? apiIssue.assigneeId?.toString(),
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
   * Map to column names that match the board columns
   */
  private mapStatusIdToStatus(statusId: number): 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED' {
    // Map statusId to the actual column names used by the board
    // These should match the column names returned from the board API
    const statusMap: Record<number, any> = {
      1: 'To Do',        // Match board column name
      2: 'In Progress',  // Match board column name
      3: 'In Review',    // Match board column name
      4: 'Done',         // Match board column name
      5: 'On Hold',      // Match board column name
      6: 'BLOCKED'       // Fallback
    };
    return statusMap[statusId] || 'To Do';
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

  /**
   * Map frontend Issue partial updates to UpdateIssueDto
   * IMPORTANT: Backend requires ALL fields, so we need the full issue object
   */
  mapIssueToUpdateDto(issue: Issue, projectId: string, updates: Partial<Issue>): UpdateIssueDto {
    // Merge updates with existing issue data
    const merged = { ...issue, ...updates };
    
    const dto: UpdateIssueDto = {
      id: merged.id,
      projectId: projectId,
      issueType: merged.type,
      title: merged.title,
      description: merged.description || '',
      priority: merged.priority,
      // If assignee is missing, send null to match backend expectations (backend treats null as unassigned)
      assigneeId: merged.assignee ? parseInt(merged.assignee) : null as any,
      // Send explicit null for dates when not present (backend example uses null)
      startDate: merged.startDate ? merged.startDate.toISOString() : null as any,
      dueDate: merged.dueDate ? merged.dueDate.toISOString() : null as any,
      // Use null for missing optional GUIDs to avoid 'undefined' being sent
      sprintId: merged.sprintId ?? null,
      storyPoints: merged.storyPoints ?? 0,
      epicId: merged.epicId ?? null,
      reporterId: (merged as any).reporterId ?? 1, // fallback
      // Backend examples use empty string for attachmentUrl when none exists
      attachmentUrl: (merged as any).attachmentUrl ?? '',
      statusId: merged.statusId ?? 1, // Default to "To Do" if not set
      labels: JSON.stringify(merged.labels || [])
    };

    console.log('[IssueApiService] Mapped issue to DTO:', { original: issue, updates, merged, dto });
    return dto;
  }
}
