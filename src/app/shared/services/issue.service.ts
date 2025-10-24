import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateIssueRequest {
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
	attachmentUrl: string | null;
}

export interface CreateIssueResponse {
	status: number;
	data: any;
	message: string;
}

@Injectable({ providedIn: 'root' })
export class IssueService {
	private apiUrl = 'https://localhost:7117/api/issue'; // Full backend API URL

	constructor(private http: HttpClient) {}

		createIssue(issue: Omit<CreateIssueRequest, 'projectId'>): Observable<CreateIssueResponse> {
			return this.http.post<CreateIssueResponse>(this.apiUrl, issue);
		}
}
