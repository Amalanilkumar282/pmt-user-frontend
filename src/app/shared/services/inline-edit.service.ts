import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { IssueService, UpdateIssueRequest } from './issue.service';
import { Issue, IssuePriority, IssueStatus } from '../models/issue.model';
import { ToastService } from './toast.service';
import { UserApiService } from './user-api.service';
import { StatusService } from './status.service';
import { ProjectContextService } from './project-context.service';

/**
 * Service to handle inline editing of issues across different components
 * Provides centralized logic for updating issue fields (name, priority, assignee, status)
 * and deleting issues with proper API integration
 */
@Injectable({
  providedIn: 'root'
})
export class InlineEditService {
  private issueService = inject(IssueService);
  private toastService = inject(ToastService);
  private userApiService = inject(UserApiService);
  private statusService = inject(StatusService);
  private projectContextService = inject(ProjectContextService);

  /**
   * Update issue title/name
   */
  updateIssueName(issue: Issue, newTitle: string): Observable<Issue> {
    if (!newTitle.trim()) {
      this.toastService.error('Issue title cannot be empty');
      return of(issue);
    }

    return this.updateIssue(issue, { title: newTitle }, 'title');
  }

  /**
   * Update issue priority
   */
  updateIssuePriority(issue: Issue, newPriority: IssuePriority): Observable<Issue> {
    return this.updateIssue(issue, { priority: newPriority }, 'priority');
  }

  /**
   * Update issue assignee
   * @param issue - The issue to update
   * @param assigneeNameOrId - Can be assignee name string or "Unassigned", or user ID number
   */
  updateIssueAssignee(issue: Issue, assigneeNameOrId: string | number | null): Observable<Issue> {
    // If assignee is "Unassigned" or null, set to null
    if (assigneeNameOrId === 'Unassigned' || assigneeNameOrId === null || assigneeNameOrId === '') {
      return this.updateIssue(issue, { 
        assignee: undefined,
        assigneeId: null,
        assigneeName: undefined
      }, 'assignee');
    }

    // If it's a number, treat it as assigneeId
    if (typeof assigneeNameOrId === 'number') {
      return this.updateIssue(issue, { 
        assigneeId: assigneeNameOrId 
      }, 'assignee');
    }

    // If it's a string, we need to find the user ID
    const projectId = this.projectContextService.currentProjectId();
    if (!projectId) {
      this.toastService.error('No project context available');
      return of(issue);
    }

    // Fetch project members to map name to ID
    return new Observable(observer => {
      this.userApiService.getUsersByProject(projectId).subscribe({
        next: (users) => {
          const user = users.find(u => u.name === assigneeNameOrId);
          if (user) {
            this.updateIssue(issue, { 
              assigneeId: user.id,
              assigneeName: user.name
            }, 'assignee').subscribe({
              next: (updatedIssue) => observer.next(updatedIssue),
              error: (err) => observer.error(err),
              complete: () => observer.complete()
            });
          } else {
            this.toastService.error('User not found in project');
            observer.next(issue);
            observer.complete();
          }
        },
        error: (error) => {
          console.error('Error fetching project users:', error);
          this.toastService.error('Failed to fetch project users');
          observer.error(error);
        }
      });
    });
  }

  /**
   * Update issue status
   * @param issue - The issue to update
   * @param newStatus - The new status (can be status name or IssueStatus)
   */
  updateIssueStatus(issue: Issue, newStatus: IssueStatus | string): Observable<Issue> {
    // Map status name to status ID
    const statusId = this.statusService.mapStatusNameToId(newStatus);
    
    return this.updateIssue(issue, { 
      status: newStatus as IssueStatus,
      statusId: statusId
    }, 'status');
  }

  /**
   * Delete an issue
   */
  deleteIssue(issueId: string): Observable<boolean> {
    console.log('🗑️ [InlineEditService] Deleting issue:', issueId);
    
    return this.issueService.deleteIssue(issueId).pipe(
      map(() => {
        console.log('✅ [InlineEditService] Issue deleted successfully');
        this.toastService.success('Issue deleted successfully');
        return true;
      }),
      catchError((error) => {
        console.error('❌ [InlineEditService] Error deleting issue:', error);
        this.toastService.error('Failed to delete issue');
        return of(false);
      })
    );
  }

  /**
   * Generic update method that builds the full update request
   */
  private updateIssue(issue: Issue, updates: Partial<Issue>, fieldName: string): Observable<Issue> {
    console.log(`🔄 [InlineEditService] Updating ${fieldName} for issue:`, issue.id);
    
    // Build the update request with all required fields
    const updateRequest: UpdateIssueRequest = {
      projectId: issue.projectId || this.projectContextService.currentProjectId() || '',
      issueType: (issue.type || 'TASK').toUpperCase(),
      title: updates.title !== undefined ? updates.title : (issue.title || ''),
      description: issue.description || '',
      priority: (updates.priority || issue.priority || 'MEDIUM').toUpperCase(),
      assigneeId: updates.assigneeId !== undefined ? updates.assigneeId : (issue.assigneeId || null),
      startDate: issue.startDate ? issue.startDate.toISOString() : null,
      dueDate: issue.dueDate ? issue.dueDate.toISOString() : null,
      sprintId: issue.sprintId || null,
      storyPoints: issue.storyPoints || 0,
      epicId: issue.epicId || null,
      reporterId: issue.reporterId || null,
      attachmentUrl: issue.attachmentUrl || null,
      statusId: updates.statusId !== undefined ? updates.statusId : (issue.statusId || 1),
      labels: issue.labels ? JSON.stringify(issue.labels) : null
    };

    console.log(`🔄 [InlineEditService] Update request:`, updateRequest);

    return this.issueService.updateIssue(issue.id, updateRequest).pipe(
      map((response) => {
        console.log(`✅ [InlineEditService] ${fieldName} updated successfully`);
        this.toastService.success(`Issue ${fieldName} updated successfully`);
        
        // Return the updated issue
        return {
          ...issue,
          ...updates,
          updatedAt: new Date()
        };
      }),
      catchError((error) => {
        console.error(`❌ [InlineEditService] Error updating ${fieldName}:`, error);
        this.toastService.error(`Failed to update issue ${fieldName}`);
        return of(issue); // Return original issue on error
      })
    );
  }

  /**
   * Get project members for assignee dropdown
   */
  getProjectMembers(projectId: string): Observable<Array<{ id: number; name: string }>> {
    return this.userApiService.getUsersByProject(projectId).pipe(
      map(users => users.map(u => ({ id: u.id, name: u.name }))),
      catchError(() => of([]))
    );
  }

  /**
   * Get available statuses for a project
   */
  getProjectStatuses(projectId: string): Observable<Array<{ id: number; name: string }>> {
    return this.statusService.getStatusesByProject(projectId).pipe(
      map(statuses => statuses.map(s => ({ id: s.id, name: s.statusName }))),
      catchError(() => of([
        { id: 1, name: 'TO_DO' },
        { id: 2, name: 'IN_PROGRESS' },
        { id: 3, name: 'IN_REVIEW' },
        { id: 4, name: 'DONE' },
        { id: 5, name: 'BLOCKED' }
      ]))
    );
  }
}
