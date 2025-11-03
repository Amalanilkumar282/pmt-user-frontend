import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GetIssuesResponse, IssueApiResponse, Issue, IssueType, IssuePriority, IssueStatus } from '../models/issue.model';

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
	 * Get authorization headers with access token from session storage
	 */
	private getAuthHeaders(): HttpHeaders {
		const token = sessionStorage.getItem('accessToken') || '';
		return new HttpHeaders({
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json'
		});
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
			5: 'BLOCKED'
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
			updatedAt: apiIssue.updatedAt ? new Date(apiIssue.updatedAt) : new Date()
		};
	}

	/**
	 * Get all issues for a project
	 */
	getProjectIssues(projectId: string): Observable<Issue[]> {
		const url = `${this.baseUrl}/project/${projectId}/issues`;
		return this.http.get<GetIssuesResponse>(url, { headers: this.getAuthHeaders() })
			.pipe(
				map(response => {
					if (response.status === 200 && response.data) {
						return response.data.map(apiIssue => this.mapApiResponseToIssue(apiIssue));
					}
					return [];
				})
			);
	}

	createIssue(issue: CreateIssueRequest): Observable<CreateIssueResponse> {
		const token = sessionStorage.getItem('accessToken') || '';
		console.log('Auth token from sessionStorage:', token ? 'Token found' : 'No token found');
		const headers = { 'Authorization': `Bearer ${token}` };
		return this.http.post<CreateIssueResponse>(this.baseUrl, issue, { headers });
	}

	/**
	 * Update an existing issue
	 */
	updateIssue(issueId: string, issue: UpdateIssueRequest): Observable<UpdateIssueResponse> {
		const url = `${this.baseUrl}/${issueId}`;
		console.log('Updating issue:', issueId, issue);
		return this.http.put<UpdateIssueResponse>(url, issue, { headers: this.getAuthHeaders() });
	}
}
