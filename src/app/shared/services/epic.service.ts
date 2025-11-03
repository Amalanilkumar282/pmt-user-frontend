import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Epic, 
  EpicApiResponse, 
  CreateEpicRequest, 
  UpdateEpicRequest 
} from '../models/epic.model';
import { Issue, IssueApiResponse } from '../models/issue.model';

interface ApiResponse<T> {
  status: number;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class EpicService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/Epic`;
  private issueBaseUrl = `${environment.apiUrl}/api/Issue`;

  /**
   * Get authorization headers with JWT token from sessionStorage
   */
  private getAuthHeaders(): HttpHeaders {
    // Check if running in browser (not SSR)
    if (typeof sessionStorage !== 'undefined') {
      const token = sessionStorage.getItem('accessToken') || '';
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': '*/*'
      });
    }
    // SSR fallback - no auth token
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'accept': '*/*'
    });
  }

  /**
   * Map backend API response to frontend Epic model
   */
  private mapApiResponseToEpic(apiEpic: EpicApiResponse): Epic {
    return {
      id: apiEpic.id,
      projectId: apiEpic.projectId,
      name: apiEpic.title,
      title: apiEpic.title,
      description: apiEpic.description,
      startDate: apiEpic.startDate ? new Date(apiEpic.startDate) : null,
      dueDate: apiEpic.dueDate ? new Date(apiEpic.dueDate) : null,
      assignee: apiEpic.assigneeName,
      assigneeName: apiEpic.assigneeName,
      reporter: apiEpic.reporterName,
      reporterName: apiEpic.reporterName,
      labels: apiEpic.labels || [],
      createdAt: new Date(apiEpic.createdAt),
      updatedAt: new Date(apiEpic.updatedAt),
      progress: 0, // Will be calculated from child work items
      issueCount: 0, // Will be set from child work items
      isExpanded: false,
      status: 'TODO'
    };
  }

  /**
   * Map status ID to status string (from IssueService)
   */
  private mapStatusIdToStatus(statusId: number): string {
    const statusMap: { [key: number]: string } = {
      1: 'TODO',
      2: 'IN_PROGRESS',
      3: 'IN_REVIEW',
      4: 'DONE',
      5: 'BLOCKED',
    };
    return statusMap[statusId] || 'TODO';
  }

  /**
   * Map backend API response to frontend Issue model (for child work items)
   */
  private mapApiResponseToIssue(apiIssue: IssueApiResponse): Issue {
    return {
      id: apiIssue.id,
      key: apiIssue.key,
      projectId: apiIssue.projectId,
      title: apiIssue.title,
      description: apiIssue.description,
      type: apiIssue.issueType as any,
      issueType: apiIssue.issueType,
      priority: apiIssue.priority as any,
      status: this.mapStatusIdToStatus(apiIssue.statusId) as any,
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
   * 1) Create Epic
   * POST /api/Epic
   */
  createEpic(epic: CreateEpicRequest): Observable<Epic> {
    const headers = this.getAuthHeaders();
    console.log('🚀 [EpicService] Creating epic:', epic);
    console.log('🚀 [EpicService] Request JSON:', JSON.stringify(epic, null, 2));
    
    return this.http.post<ApiResponse<EpicApiResponse>>(this.baseUrl, epic, { headers }).pipe(
      map(response => {
        console.log('✅ [EpicService] Epic created successfully:', response);
        return this.mapApiResponseToEpic(response.data);
      }),
      catchError(error => {
        console.error('❌ [EpicService] Error creating epic:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 2) Get all epics by project ID
   * GET /api/Epic/project/{projectId}
   */
  getAllEpicsByProject(projectId: string): Observable<Epic[]> {
    const headers = this.getAuthHeaders();
    const url = `${this.baseUrl}/project/${projectId}`;
    console.log('📥 [EpicService] Fetching epics for project:', projectId);
    
    return this.http.get<EpicApiResponse[]>(url, { headers }).pipe(
      map(response => {
        console.log('✅ [EpicService] Epics fetched successfully:', response);
        return response.map(epic => this.mapApiResponseToEpic(epic));
      }),
      catchError(error => {
        console.error('❌ [EpicService] Error fetching epics:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 3) Get epic details by epic ID
   * GET /api/Epic/{epicId}
   */
  getEpicById(epicId: string): Observable<Epic> {
    const headers = this.getAuthHeaders();
    const url = `${this.baseUrl}/${epicId}`;
    console.log('📥 [EpicService] Fetching epic details:', epicId);
    
    return this.http.get<ApiResponse<EpicApiResponse>>(url, { headers }).pipe(
      map(response => {
        console.log('✅ [EpicService] Epic details fetched successfully:', response);
        return this.mapApiResponseToEpic(response.data);
      }),
      catchError(error => {
        console.error('❌ [EpicService] Error fetching epic details:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 4) Update Epic
   * PUT /api/Epic
   */
  updateEpic(epic: UpdateEpicRequest): Observable<string> {
    const headers = this.getAuthHeaders();
    console.log('🔄 [EpicService] Updating epic:', epic);
    console.log('🔄 [EpicService] Request JSON:', JSON.stringify(epic, null, 2));
    
    return this.http.put<ApiResponse<string>>(this.baseUrl, epic, { headers }).pipe(
      map(response => {
        console.log('✅ [EpicService] Epic updated successfully:', response);
        return response.data;
      }),
      catchError(error => {
        console.error('❌ [EpicService] Error updating epic:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 5) Delete Epic
   * DELETE /api/Epic/{epicId}
   */
  deleteEpic(epicId: string): Observable<string> {
    const headers = this.getAuthHeaders();
    const url = `${this.baseUrl}/${epicId}`;
    console.log('🗑️ [EpicService] Deleting epic:', epicId);
    
    return this.http.delete<ApiResponse<string>>(url, { headers }).pipe(
      map(response => {
        console.log('✅ [EpicService] Epic deleted successfully:', response);
        return response.data;
      }),
      catchError(error => {
        console.error('❌ [EpicService] Error deleting epic:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 6) Get child work items by epic ID
   * GET /api/Issue/epic/{epicId}
   */
  getChildWorkItemsByEpicId(epicId: string): Observable<Issue[]> {
    const headers = this.getAuthHeaders();
    const url = `${this.issueBaseUrl}/epic/${epicId}`;
    console.log('📥 [EpicService] Fetching child work items for epic:', epicId);
    
    return this.http.get<ApiResponse<IssueApiResponse[]>>(url, { headers }).pipe(
      map(response => {
        console.log('✅ [EpicService] Child work items fetched successfully:', response);
        return response.data.map(issue => this.mapApiResponseToIssue(issue));
      }),
      catchError(error => {
        console.error('❌ [EpicService] Error fetching child work items:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Helper method to get user ID from session storage
   */
  getCurrentUserId(): number | null {
    if (typeof sessionStorage !== 'undefined') {
      const userId = sessionStorage.getItem('userId');
      return userId ? parseInt(userId, 10) : null;
    }
    return null;
  }

  /**
   * Helper method to format date to ISO string for backend
   */
  formatDateForBackend(date: Date | null): string | null {
    if (!date) return null;
    return date.toISOString();
  }
}
