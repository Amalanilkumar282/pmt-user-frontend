import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, IssueApi } from '../models/api-interfaces';
import { Issue } from '../../shared/models/issue.model';
import { AuthTokenService } from './auth-token.service';
import { UserContextService } from '../../shared/services/user-context.service';

export interface CreateIssueDto {
  projectId: string;
  issueType: string;
  title: string;
  description: string;
  priority: string;
  statusId?: number;
  assigneeId: number;
  startDate?: string;
  dueDate?: string;
  sprintId?: string;
  storyPoints?: number;
  epicId?: string;
  reporterId: number;
  attachmentUrl?: string;
  labels?: string;
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
  private userContextService = inject(UserContextService);
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
    const headers = this.authTokenService.getAuthHeaders({ 'accept': 'text/plain', 'Content-Type': 'application/json' });
    // Build a clean DTO with no undefined/null values - some backends reject undefined fields
    const cleanDto: Record<string, any> = Object.entries(dto || {}).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null) {
        acc[k] = v;
      }
      return acc;
    }, {} as Record<string, any>);

    // Log outgoing DTO as JSON for clear console output
    try {
      console.log('[IssueApiService] Creating issue - DTO (stringified):', JSON.stringify(cleanDto));
    } catch { /* ignore logging failures */ }

    return this.http.post<ApiResponse<IssueApi>>(this.baseUrl, cleanDto, { headers })
      .pipe(
        map((resp) => {
          try { console.log('[IssueApiService] Create response (stringified):', JSON.stringify(resp)); } catch { console.log('[IssueApiService] Create response:', resp); }
          return resp;
        }),
        catchError((err) => {
          // Log full error to console to help diagnose 500 from backend
          try { console.error('[IssueApiService] Create error (body):', JSON.stringify(err?.error || err)); } catch { console.error('[IssueApiService] Create error:', err); }
          // Rethrow so callers (store/component) can handle and show toasts
          return throwError(() => err);
        })
      );
  }

  /**
   * Update existing issue (including status)
   * PUT /api/Issue/{id}
   */
  updateIssue(dto: UpdateIssueDto): Observable<ApiResponse<string>> {
    const headers = this.authTokenService.getAuthHeaders({ 'accept': 'text/plain', 'Content-Type': 'application/json' });
    console.log('[IssueApiService] Sending update DTO:', dto);
    return this.http.put<ApiResponse<string>>(`${this.baseUrl}/${dto.id}`, dto, { headers });
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
    // Backend does not always return createdAt/updatedAt in Issue API; use current time when missing
    createdAt: new Date(),
    updatedAt: new Date(),
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
      const statusMap: Record<number, 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED'> = {
        1: 'TODO',        // To Do
        2: 'IN_PROGRESS', // In Progress
        3: 'IN_REVIEW',   // In Review
        4: 'DONE',        // Done
        5: 'BLOCKED'      // On Hold/Blocked mapped to BLOCKED
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
    // Handle assigneeId from multiple sources (quick-create passes number, legacy uses string)
    let assigneeId = 1;
    if ((issue as any).assigneeId !== undefined) {
      assigneeId = (issue as any).assigneeId;
    } else if (issue.assignee) {
      assigneeId = parseInt(issue.assignee);
    }

    // Handle dates - HTML date inputs return strings, not Date objects
    let startDateString: string | undefined = undefined;
    let dueDateString: string | undefined = undefined;

    if (issue.startDate) {
      if (issue.startDate instanceof Date) {
        startDateString = issue.startDate.toISOString();
      } else if (typeof issue.startDate === 'string') {
        startDateString = new Date(issue.startDate).toISOString();
      }
    }

    if (issue.dueDate) {
      if (issue.dueDate instanceof Date) {
        dueDateString = issue.dueDate.toISOString();
      } else if (typeof issue.dueDate === 'string') {
        dueDateString = new Date(issue.dueDate).toISOString();
      }
    }

    // Get reporter from auth context
    const reporterId = this.userContextService?.getCurrentUserId() ?? 1;

    return {
      projectId: projectId,
      issueType: issue.type || 'TASK',
      title: issue.title || '',
      description: issue.description || '',
      priority: issue.priority || 'MEDIUM',
      assigneeId: assigneeId,
      startDate: startDateString,
      dueDate: dueDateString,
      sprintId: issue.sprintId || undefined,
      storyPoints: issue.storyPoints || 0,
      epicId: issue.epicId || undefined,
      reporterId: reporterId,
        statusId: (issue as any).statusId ?? undefined,
      attachmentUrl: undefined,
      labels: JSON.stringify(issue.labels || [])
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
