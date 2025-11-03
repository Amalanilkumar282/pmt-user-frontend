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
   * Get all issues for a project
   */
  getProjectIssues(projectId: string): Observable<Issue[]> {
    const url = `${this.baseUrl}/project/${projectId}/issues`;
    return this.http.get<GetIssuesResponse>(url).pipe(
      map((response) => {
        if (response.status === 200 && response.data) {
          return response.data.map((apiIssue) => this.mapApiResponseToIssue(apiIssue));
        }
        return [];
      })
    );
  }

  /**
   * Get all issues assigned to a user
   */
  getIssuesByUser(userId: string): Observable<Issue[]> {
    const url = `${this.baseUrl}/user/${userId}`;
    return this.http.get<GetIssuesResponse>(url).pipe(
      map((response) => {
        if (response.status === 200 && response.data) {
          return response.data.map((apiIssue) => this.mapApiResponseToIssue(apiIssue));
        }
        return [];
      })
    );
  }

  createIssue(issue: CreateIssueRequest): Observable<CreateIssueResponse> {
    return this.http.post<CreateIssueResponse>(this.baseUrl, issue);
  }

  /**
   * Update an existing issue
   */
  updateIssue(issueId: string, issue: UpdateIssueRequest): Observable<UpdateIssueResponse> {
    const url = `${this.baseUrl}/${issueId}`;
    console.log('Updating issue:', issueId, issue);
    return this.http.put<UpdateIssueResponse>(url, issue);
  }
}
