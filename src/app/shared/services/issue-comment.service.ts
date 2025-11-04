import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Response interfaces matching backend structure
export interface CommentMention {
  id: string;
  mentionUserId: number;
  mentionUserName: string;
  mentionUserEmail: string;
}

export interface IssueComment {
  id: string;
  issueId: string;
  authorId: number;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  mentions: CommentMention[];
}

export interface CreateCommentRequest {
  issueId: string;
  body: string;
  authorId: number;
  mentionedUserIds: number[];
}

export interface CreateCommentResponse {
  status: number;
  data: {
    id: string;
    issueId: string;
    body: string;
    createdAt: string;
  };
  message: string;
}

export interface GetCommentsResponse {
  status: number;
  data: IssueComment[];
  message: string;
}

export interface GetCommentResponse {
  status: number;
  data: IssueComment;
  message: string;
}

export interface UpdateCommentRequest {
  id: string;
  body: string;
  updatedBy: number;
  mentionedUserIds: number[];
}

export interface UpdateCommentResponse {
  status: number;
  data: string; // commentId
  message: string;
}

export interface DeleteCommentResponse {
  status: number;
  data: string; // commentId
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class IssueCommentService {
  private http = inject(HttpClient);
  private baseUrl = '/api/Issue';

  /**
   * Get all comments for an issue
   */
  getCommentsByIssue(issueId: string): Observable<GetCommentsResponse> {
    const url = `${this.baseUrl}/${issueId}/comments`;
    console.log('[IssueCommentService] GET getCommentsByIssue URL:', url);
    
    return this.http.get<GetCommentsResponse>(url);
  }

  /**
   * Get a single comment by ID
   */
  getCommentById(commentId: string): Observable<GetCommentResponse> {
    return this.http.get<GetCommentResponse>(`${this.baseUrl}/comments/${commentId}`);
  }

  /**
   * Create a new comment
   */
  createComment(request: CreateCommentRequest): Observable<CreateCommentResponse> {
    const url = `${this.baseUrl}/${request.issueId}/comments`;
    console.log('[IssueCommentService] POST createComment URL:', url);
    console.log('[IssueCommentService] Request body:', request);
    
    return this.http.post<CreateCommentResponse>(url, request);
  }

  /**
   * Update an existing comment
   */
  updateComment(commentId: string, request: UpdateCommentRequest): Observable<UpdateCommentResponse> {
    return this.http.put<UpdateCommentResponse>(
      `${this.baseUrl}/comments/${commentId}`,
      request
    );
  }

  /**
   * Delete a comment
   */
  deleteComment(commentId: string): Observable<DeleteCommentResponse> {
    return this.http.delete<DeleteCommentResponse>(`${this.baseUrl}/comments/${commentId}`);
  }
}
