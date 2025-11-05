import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Issue } from '../shared/models/issue.model';
import { Sprint } from '../sprint/sprint-container/sprint-container';

interface SummaryCardData {
  type: 'completed' | 'updated' | 'created' | 'due-soon';
  count: number;
  label: string;
  timePeriod: string;
}

interface SprintStatus {
  label: string;
  count: number;
  colorClass: string;
}

interface RecentIssue {
  title: string;
  code: string;
  statusBg: string;
  statusLetter: string;
  assigneeBg: string;
  assigneeInitials: string;
  description?: string;
  status?: string;
  priority?: string;
}

@Injectable({
  providedIn: 'root',
})
export class IssueSummaryService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Fetch recent issues for a project from backend API
   */
  getRecentIssuesByProjectId(projectId: string, limit: number = 6): Observable<RecentIssue[]> {
    console.log('🔄 Fetching recent issues for project:', projectId);
    return this.http.get<any>(`${this.apiUrl}/api/Issue/project/${projectId}/recent`).pipe(
      map((response) => {
        console.log('📥 Recent issues API response:', response);
        if (response.status === 200 && Array.isArray(response.data)) {
          console.log('✅ Valid response with', response.data.length, 'issues');
          return response.data.slice(0, limit).map((issue: any) => {
            // Assignee Initials Logic
            const assigneeName = issue.assigneeName || 'Unassigned';
            const initialsMatch = assigneeName.match(/\b\w/g) || [];
            const assigneeInitials = (
              initialsMatch.length > 1
                ? initialsMatch.slice(0, 2).join('').toUpperCase()
                : assigneeName.slice(0, 2).toUpperCase()
            ).padEnd(2, '?');

            // Generate consistent color for assignee using the initials
            const assigneeBg = this.stringToHslColor(assigneeInitials, 70, 45);

            // Get issue type from backend
            const issueType = (issue.issueType || 'TASK').toUpperCase();
            
            // Get status display name
            const statusDisplay = this.STATUS_DISPLAY_MAP[issue.status] || issue.status || 'Open';

            return {
              title: issue.title,
              code: issue.key || '',
              statusBg: this.ISSUE_TYPE_COLOR_MAP[issueType] || '#9CA3AF',
              statusLetter: this.STATUS_LETTER_MAP[issueType] || '?',
              assigneeBg: assigneeBg,
              assigneeInitials: assigneeInitials,
              description: issue.description,
              status: statusDisplay,
              priority: issue.priority ? (issue.priority.charAt(0) + issue.priority.slice(1).toLowerCase()) : 'Medium',
            };
          });
        }
        return [];
      })
    );
  }
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  // Use environment API URL for consistency
  private readonly API_BASE_URL = `${environment.apiUrl}/api`;
  private readonly CURRENT_DATE = new Date();
  private readonly MS_PER_DAY = 1000 * 60 * 60 * 24;

  private readonly ISSUE_TYPE_COLOR_MAP: { [key: string]: string } = {
    STORY: '#3B82F6',
    TASK: '#10B981',
    BUG: '#EF4444',
    EPIC: '#9333EA',
  };

  private readonly STATUS_LETTER_MAP: { [key: string]: string } = {
    STORY: 'S',
    TASK: 'T',
    BUG: 'B',
    EPIC: 'E',
  };

  private readonly STATUS_DISPLAY_MAP: { [key: string]: string } = {
    TODO: 'Open',
    IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'Pending Review',
    DONE: 'Completed',
  };

  /**
   * Generates a consistent, attractive color based on a string (like initials).
   * This replaces the need for a static ASSIGNEE_BG_MAP.
   */
  private stringToHslColor(_str: string, _s: number, _l: number): string {
    // Return a fixed color for all assignees
    return '#FF5722'; // blue tone
  }

  private getAllIssues(): Issue[] {
    // TODO: Replace with actual API call to fetch all issues
    return [];
  }

  /**
   * Get authentication headers with access token
   */
  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (this.isBrowser) {
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  /**
   * Fetch sprints from API for a given project
   * Maps API response to Sprint interface
   */
  getSprintsByProjectId(projectId: string): Observable<Sprint[]> {
    const headers = this.getAuthHeaders();
    const url = `${this.API_BASE_URL}/sprints/project/${projectId}`;
    
    console.log('🔄 Fetching sprints from:', url);
    console.log('🔍 Project ID:', projectId);
    
    return this.http.get<any>(url, { headers }).pipe(
      map((response) => {
        console.log('📥 Sprints API response:', response);
        
        if (response.status === 200 && response.data) {
          console.log('📊 Total sprints returned:', response.data.length);
          
          const sprints = response.data.map((sprint: any) => ({
            id: sprint.id,
            name: sprint.name,
            // Handle both snake_case and camelCase field names
            startDate: sprint.start_date ? new Date(sprint.start_date) : (sprint.startDate ? new Date(sprint.startDate) : undefined),
            endDate: sprint.due_date ? new Date(sprint.due_date) : (sprint.dueDate ? new Date(sprint.dueDate) : undefined),
            status: (sprint.status?.toUpperCase() || 'PLANNED') as 'ACTIVE' | 'COMPLETED' | 'PLANNED',
            issues: [],
            teamAssigned: sprint.team_id ? `Team ${sprint.team_id}` : (sprint.teamId ? `Team ${sprint.teamId}` : undefined),
          }));
          
          console.log('✅ Mapped', sprints.length, 'sprints');
          console.log('📋 Sprint names:', sprints.map((s: Sprint) => `${s.name} (${s.status})`).join(', '));
          
          return sprints;
        }
        
        console.warn('⚠️ No sprint data in response');
        return [];
      })
    );
  }

  /**
   * Fetch issues from API for a specific project and sprint
   * API format: /api/Issue/project/{projectId}/sprint/{sprintId}/issues
   */
  getIssuesByProjectAndSprint(projectId: string, sprintId: string): Observable<Issue[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<any>(`${this.API_BASE_URL}/Issue/project/${projectId}/sprint/${sprintId}/issues`, { headers }).pipe(
      map((response) => {
        if (response.status === 200 && response.data) {
          console.log('🔍 Raw API response - Total issues:', response.data.length);
          return response.data.map((issue: any) => {
            // Map statusName to our IssueStatus type
            let status: string = 'TODO';
            if (issue.statusName) {
              const statusMap: { [key: string]: string } = {
                'To Do': 'TODO',
                'TODO': 'TODO',
                'In Progress': 'IN_PROGRESS',
                'IN_PROGRESS': 'IN_PROGRESS',
                'In Review': 'IN_REVIEW',
                'IN_REVIEW': 'IN_REVIEW',
                'Done': 'DONE',
                'DONE': 'DONE',
                'Blocked': 'BLOCKED',
                'BLOCKED': 'BLOCKED'
              };
              status = statusMap[issue.statusName] || issue.statusName.toUpperCase().replace(/\s+/g, '_');
            }
            
            console.log('📦 Issue:', issue.title, '| Key:', issue.key, '| Status:', issue.statusName, '→', status);
            console.log('   Available dates:', {
              updatedAt: issue.updatedAt,
              completedAt: issue.completedAt,
              dueDate: issue.dueDate,
              startDate: issue.startDate
            });
            
            // For DONE issues, use updatedAt as completedAt (fallback to dueDate if updatedAt not provided)
            let completedAtDate: Date | undefined = undefined;
            if (status === 'DONE') {
              if (issue.completedAt) {
                completedAtDate = new Date(issue.completedAt);
                console.log('✅ Using completedAt:', completedAtDate.toLocaleDateString());
              } else if (issue.updatedAt) {
                completedAtDate = new Date(issue.updatedAt);
                console.log('✅ Using updatedAt as completedAt:', completedAtDate.toLocaleDateString());
              } else if (issue.dueDate) {
                completedAtDate = new Date(issue.dueDate);
                console.log('⚠️ Using dueDate as completedAt for', issue.title, ':', completedAtDate.toLocaleDateString());
              } else {
                console.warn('❌ No date available for DONE issue:', issue.title);
              }
            }
            
            return {
              id: issue.id || issue.issueId,
              key: issue.key, // Map the key field (e.g., PMT-011)
              title: issue.title || issue.name,
              description: issue.description,
              type: (issue.issueType || issue.type || 'TASK').toUpperCase(),
              priority: (issue.priority || 'MEDIUM').toUpperCase(),
              status: status,
              assignee: issue.assigneeName || issue.assignee || issue.assignedTo,
              storyPoints: issue.storyPoints || 0,
              sprintId: issue.sprintId,
              teamId: issue.teamId,
              epicId: issue.epicId,
              epicName: issue.epicName || null,
              startDate: issue.startDate ? new Date(issue.startDate) : undefined,
              dueDate: issue.dueDate ? new Date(issue.dueDate) : undefined,
              endDate: issue.endDate ? new Date(issue.endDate) : undefined,
              createdAt: issue.createdAt ? new Date(issue.createdAt) : (issue.startDate ? new Date(issue.startDate) : new Date()),
              updatedAt: issue.updatedAt ? new Date(issue.updatedAt) : (issue.dueDate ? new Date(issue.dueDate) : new Date()),
              completedAt: completedAtDate,
            } as Issue;
          });
        }
        return [];
      })
    );
  }

  /**
   * @deprecated Use getSprintsByProjectId instead
   * Returns empty array - no more dummy data
   */
  getAllSprints(): Sprint[] {
    return [];
  }

  getIssuesBySprintId(sprintId: string | null): Issue[] {
    // TODO: Replace with actual API call to fetch issues by sprint ID
    return this.getAllIssues();
  }

  private isWithinLastDays(date: Date, days: number): boolean {
    const diffDays = (this.CURRENT_DATE.getTime() - new Date(date).getTime()) / this.MS_PER_DAY;
    return diffDays >= 0 && diffDays <= days;
  }

  private isWithinNextDays(date: Date, days: number): boolean {
    const diffDays = (new Date(date).getTime() - this.CURRENT_DATE.getTime()) / this.MS_PER_DAY;
    return diffDays >= 0 && diffDays <= days;
  }

  getCompletedIssuesCount(sprintId: string | null, days: number = 7): number {
    return this.getIssuesBySprintId(sprintId).filter(
      (issue) => issue.status === 'DONE' && this.isWithinLastDays(issue.updatedAt, days)
    ).length;
  }

  getUpdatedIssuesCount(sprintId: string | null, days: number = 7): number {
    return this.getIssuesBySprintId(sprintId).filter((issue) =>
      this.isWithinLastDays(issue.updatedAt, days)
    ).length;
  }

  getCreatedIssuesCount(sprintId: string | null, days: number = 7): number {
    return this.getIssuesBySprintId(sprintId).filter((issue) =>
      this.isWithinLastDays(issue.createdAt, days)
    ).length;
  }

  getDueSoonCount(sprintId: string | null, days: number = 7): number {
    // TODO: Replace with actual API call
    return 0;
  }

  /**
   * Get issue summary cards with real API data
   * Fetches from multiple endpoints and calculates metrics
   */
  getIssueSummaryCards(projectId: string, sprintId: string | null = null): Observable<SummaryCardData[]> {
    const headers = this.getAuthHeaders();
    
    console.log('📊 [getIssueSummaryCards] Called with:', { projectId, sprintId });
    
    // If no sprint selected or 'all', use activity-summary API endpoint
    if (!sprintId || sprintId === 'all') {
      console.log('📊 Fetching activity summary for all sprints in project:', projectId);
      const url = `${this.API_BASE_URL}/Issue/project/${projectId}/activity-summary`;
      console.log('📊 API URL:', url);
      
      // Use the new activity-summary endpoint
      return this.http.get<any>(url, { headers }).pipe(
        map((response) => {
          console.log('📥 [getIssueSummaryCards] Activity summary API response:', response);
          if (response.status === 200 && response.data) {
            const data = response.data;
            console.log('✅ Activity summary data:', data);
            
            return [
              { type: 'completed' as const, count: data.completed || 0, label: 'COMPLETED', timePeriod: 'in the last 7 days' },
              { type: 'updated' as const, count: data.updated || 0, label: 'UPDATED', timePeriod: 'in the last 7 days' },
              { type: 'created' as const, count: data.created || 0, label: 'CREATED', timePeriod: 'in the last 7 days' },
              { type: 'due-soon' as const, count: data.dueSoon || 0, label: 'DUE SOON', timePeriod: 'in the next 7 days' },
            ];
          }
          console.warn('⚠️ [getIssueSummaryCards] Invalid response format');
          return this.getEmptySummaryCards();
        })
      );
    }
    
    // Sprint-specific metrics - use sprint activity-summary endpoint
    console.log('📊 Fetching activity summary for sprint:', sprintId, 'in project:', projectId);
    const url = `${this.API_BASE_URL}/Issue/project/${projectId}/sprint/${sprintId}/activity-summary`;
    console.log('📊 API URL:', url);
    
    return this.http.get<any>(url, { headers }).pipe(
      map((response) => {
        console.log('📥 [getIssueSummaryCards] Sprint activity summary API response:', response);
        if (response.status === 200 && response.data) {
          const data = response.data;
          console.log('✅ Sprint activity summary data:', data);
          
          return [
            { type: 'completed' as const, count: data.completed || 0, label: 'COMPLETED', timePeriod: 'in the last 7 days' },
            { type: 'updated' as const, count: data.updated || 0, label: 'UPDATED', timePeriod: 'in the last 7 days' },
            { type: 'created' as const, count: data.created || 0, label: 'CREATED', timePeriod: 'in the last 7 days' },
            { type: 'due-soon' as const, count: data.dueSoon || 0, label: 'DUE SOON', timePeriod: 'in the next 7 days' },
          ];
        }
        console.warn('⚠️ [getIssueSummaryCards] Invalid response format for sprint');
        return this.getEmptySummaryCards();
      })
    );
  }

  private getEmptySummaryCards(): SummaryCardData[] {
    return [
      { type: 'completed' as const, count: 0, label: 'COMPLETED', timePeriod: 'in the last 7 days' },
      { type: 'updated' as const, count: 0, label: 'UPDATED', timePeriod: 'in the last 7 days' },
      { type: 'created' as const, count: 0, label: 'CREATED', timePeriod: 'in the last 7 days' },
      { type: 'due-soon' as const, count: 0, label: 'DUE SOON', timePeriod: 'in the next 7 days' },
    ];
  }

  /**
   * Get sprint status breakdown from API
   * Fetches issue status counts for the selected sprint
   * For 'all' sprints: uses project-level API endpoint
   */
  getSprintStatuses(sprintId: string | null = null, projectId?: string): Observable<SprintStatus[]> {
    const headers = this.getAuthHeaders();
    
    // Handle "All Sprints" case with project-level API
    if (!sprintId || sprintId === 'all') {
      if (!projectId) {
        console.warn('⚠️ Project ID required for "All Sprints" view');
        return new Observable((observer) => {
          observer.next(this.getEmptyStatusBreakdown());
          observer.complete();
        });
      }
      
      console.log('📊 Fetching status breakdown for ALL sprints in project:', projectId);
      const url = `${this.API_BASE_URL}/Issue/project/${projectId}/status-count`;
      
      return this.http.get<any>(url, { headers }).pipe(
        map((response) => {
          console.log('📥 Project status API response:', response);
          
          if (response.status === 200 && response.data) {
            return this.mapStatusBreakdown(response.data);
          }
          
          console.warn('⚠️ Invalid response format, returning empty status breakdown');
          return this.getEmptyStatusBreakdown();
        })
      );
    }
    
    // Sprint-specific status counts
    console.log('📊 Fetching sprint status breakdown for sprint:', sprintId);
    const url = `${this.API_BASE_URL}/Issue/sprint/${sprintId}/status-count`;
    
    return this.http.get<any>(url, { headers }).pipe(
      map((response) => {
        console.log('📥 Sprint status API response:', response);
        
        if (response.status === 200 && response.data) {
          return this.mapStatusBreakdown(response.data);
        }
        
        console.warn('⚠️ Invalid response format, returning empty status breakdown');
        return this.getEmptyStatusBreakdown();
      })
    );
  }

  private mapStatusBreakdown(data: any): SprintStatus[] {
    // Map API response to our status structure
    const todo = data.todo || data.TODO || data['To Do'] || 0;
    const inProgress = (data.inProgress || data.IN_PROGRESS || data['In Progress'] || 0) + 
                     (data.inReview || data.IN_REVIEW || data['In Review'] || 0);
    const done = data.done || data.DONE || data.Done || data.completed || 0;
    
    console.log('✅ Status breakdown:', { todo, inProgress, done });
    
    return [
      { label: 'To Do', count: todo, colorClass: 'bg-blue-500' },
      { label: 'In Progress', count: inProgress, colorClass: 'bg-yellow-500' },
      { label: 'Done', count: done, colorClass: 'bg-green-500' },
    ];
  }

  private getEmptyStatusBreakdown(): SprintStatus[] {
    return [
      { label: 'To Do', count: 0, colorClass: 'bg-blue-500' },
      { label: 'In Progress', count: 0, colorClass: 'bg-yellow-500' },
      { label: 'Done', count: 0, colorClass: 'bg-green-500' },
    ];
  }

  /**
   * Get issue type counts from API
   * Fetches breakdown of Story/Task/Bug/Epic counts for the selected sprint
   */
  getIssueTypeCounts(projectId: string, sprintId: string | null = null): Observable<{ name: string; count: number }[]> {
    const headers = this.getAuthHeaders();
    
    if (!sprintId || sprintId === 'all') {
      console.log('📊 Fetching issue type counts for entire project:', projectId);
      const url = `${this.API_BASE_URL}/Issue/project/${projectId}/type-count`;
      
      return this.http.get<any>(url, { headers }).pipe(
        map((response) => {
          console.log('📥 Issue type count API response (project):', response);
          
          if (response.status === 200 && response.data) {
            return this.mapIssueTypeCounts(response.data);
          }
          
          console.warn('⚠️ Invalid response format, returning empty type counts');
          return this.getEmptyTypeCounts();
        })
      );
    }
    
    console.log('📊 Fetching issue type counts for sprint:', sprintId);
    const url = `${this.API_BASE_URL}/Issue/project/${projectId}/sprint/${sprintId}/type-count`;
    
    return this.http.get<any>(url, { headers }).pipe(
      map((response) => {
        console.log('📥 Issue type count API response (sprint):', response);
        
        if (response.status === 200 && response.data) {
          return this.mapIssueTypeCounts(response.data);
        }
        
        console.warn('⚠️ Invalid response format, returning empty type counts');
        return this.getEmptyTypeCounts();
      })
    );
  }

  private mapIssueTypeCounts(data: any): { name: string; count: number }[] {
    // Handle various response formats from API
    const story = data.story || data.STORY || data.Story || 0;
    const task = data.task || data.TASK || data.Task || 0;
    const bug = data.bug || data.BUG || data.Bug || 0;
    const epic = data.epic || data.EPIC || data.Epic || 0;
    
    console.log('✅ Type counts:', { story, task, bug, epic });
    
    return [
      { name: 'Story', count: story },
      { name: 'Task', count: task },
      { name: 'Bug', count: bug },
      { name: 'Epic', count: epic },
    ];
  }

  private getEmptyTypeCounts(): { name: string; count: number }[] {
    return [
      { name: 'Story', count: 0 },
      { name: 'Task', count: 0 },
      { name: 'Bug', count: 0 },
      { name: 'Epic', count: 0 },
    ];
  }

  /**
   * Get the most recently created issues.
   */
  getRecentIssues(sprintId: string | null, limit: number = 6): RecentIssue[] {
    return this.getIssuesBySprintId(sprintId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((issue) => {
        // Assignee Initials Logic
        const assigneeName = issue.assignee || 'Unassigned';
        const initialsMatch = assigneeName.match(/\b\w/g) || [];
        const assigneeInitials = (
          initialsMatch.length > 1
            ? initialsMatch.slice(0, 2).join('').toUpperCase()
            : assigneeName.slice(0, 2).toUpperCase()
        ).padEnd(2, '?');

        // Generate consistent color using the initials
        const assigneeBg = this.stringToHslColor(assigneeInitials, 70, 45); // S=70% (vivid), L=45% (medium dark)

        return {
          title: issue.title,
          code: issue.id,
          statusBg: this.ISSUE_TYPE_COLOR_MAP[issue.type] || '#9CA3AF',
          statusLetter: this.STATUS_LETTER_MAP[issue.type] || '?',
          assigneeBg: assigneeBg,
          assigneeInitials: assigneeInitials,
          description: issue.description,
          status: issue.status,
          priority: issue.priority.charAt(0) + issue.priority.slice(1).toLowerCase(),
        };
      });
  }
}
