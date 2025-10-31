import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class IssueService {
	private baseUrl = '/api/Issue';

	constructor(private http: HttpClient) {}

	createIssue(issue: CreateIssueRequest): Observable<CreateIssueResponse> {
		const token = sessionStorage.getItem('accessToken') || '';
		console.log('Auth token from sessionStorage:', token ? 'Token found' : 'No token found');
		const headers = { 'Authorization': `Bearer ${token}` };
		return this.http.post<CreateIssueResponse>(this.baseUrl, issue, { headers });
	}
}
