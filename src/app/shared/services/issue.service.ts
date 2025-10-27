import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface CreateIssueRequest {
	projectId?: string;
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
	// Backend integration removed — return a local observable instead
	createIssue(issue: CreateIssueRequest): Observable<CreateIssueResponse> {
		console.warn('IssueService.createIssue called but backend integration was removed.');
		return of({ status: 0, data: issue, message: 'Backend integration disabled' });
	}
}
