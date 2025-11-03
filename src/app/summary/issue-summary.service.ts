import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Issue } from '../shared/models/issue.model';
import { Sprint } from '../sprint/sprint-container/sprint-container';
import {
  activeSprintIssues,
  backlogIssues,
  completedSprint1Issues,
  completedSprint2Issues,
  plannedSprintIssues,
  sprints,
} from '../shared/data/dummy-backlog-data';

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
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  // Use direct API URL instead of proxy
  private readonly API_BASE_URL = 'https://localhost:7117/api';
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
    return [
      ...completedSprint1Issues,
      ...completedSprint2Issues,
      ...activeSprintIssues,
      ...plannedSprintIssues,
      ...backlogIssues,
    ];
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
    
    return this.http.get<any>(`${this.API_BASE_URL}/sprints/project/${projectId}`, { headers }).pipe(
      map((response) => {
        if (response.status === 200 && response.data) {
          return response.data.map((sprint: any) => ({
            id: sprint.id,
            name: sprint.name,
            startDate: new Date(sprint.startDate),
            endDate: new Date(sprint.dueDate), // Map dueDate to endDate
            status: sprint.status as 'ACTIVE' | 'COMPLETED' | 'PLANNED',
            issues: [],
            teamAssigned: sprint.teamId ? `Team ${sprint.teamId}` : undefined,
          }));
        }
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
            
            console.log('📦 Issue:', issue.title, '| Key:', issue.key, '| Status:', issue.statusName, '→', status, '| Updated:', issue.updatedAt);
            
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
              createdAt: issue.createdAt ? new Date(issue.createdAt) : new Date(),
              updatedAt: issue.updatedAt ? new Date(issue.updatedAt) : new Date(),
              completedAt: issue.completedAt ? new Date(issue.completedAt) : (status === 'DONE' && issue.updatedAt ? new Date(issue.updatedAt) : undefined),
            } as Issue;
          });
        }
        return [];
      })
    );
  }

  /**
   * @deprecated Use getSprintsByProjectId instead
   * Returns dummy sprint data for backward compatibility
   */
  getAllSprints(): Sprint[] {
    return sprints;
  }

  getIssuesBySprintId(sprintId: string | null): Issue[] {
    if (!sprintId || sprintId === 'all') {
      return this.getAllIssues();
    }
    if (sprintId === 'backlog') {
      return backlogIssues;
    }
    return this.getAllIssues().filter((issue) => issue.sprintId === sprintId);
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
    const issues = this.getIssuesBySprintId(sprintId);
    let sprintEndDate: Date | undefined;

    if (sprintId && sprintId !== 'all' && sprintId !== 'backlog') {
      sprintEndDate = sprints.find((s) => s.id === sprintId)?.endDate;
    } else if (sprintId === 'all' || !sprintId) {
      sprintEndDate = sprints.find((s) => s.status === 'ACTIVE')?.endDate;
    }

    if (!sprintEndDate) return 0;

    return issues.filter(
      (issue) => issue.status !== 'DONE' && this.isWithinNextDays(sprintEndDate, days)
    ).length;
  }

  getIssueSummaryCards(sprintId: string | null = null): SummaryCardData[] {
    const days = 7;
    return [
      {
        type: 'completed',
        count: this.getCompletedIssuesCount(sprintId, days),
        label: 'COMPLETED',
        timePeriod: 'in the last 7 days',
      },
      {
        type: 'updated',
        count: this.getUpdatedIssuesCount(sprintId, days),
        label: 'UPDATED',
        timePeriod: 'in the last 7 days',
      },
      {
        type: 'created',
        count: this.getCreatedIssuesCount(sprintId, days),
        label: 'CREATED',
        timePeriod: 'in the last 7 days',
      },
      {
        type: 'due-soon',
        count: this.getDueSoonCount(sprintId, days),
        label: 'DUE SOON',
        timePeriod: 'in the next 7 days',
      },
    ];
  }

  /**
   * Get sprint status breakdown based on filtered sprint
   */
  getSprintStatuses(sprintId: string | null = null): SprintStatus[] {
    const issues = this.getIssuesBySprintId(sprintId);
    const counts = issues.reduce(
      (acc, issue) => {
        if (issue.status === 'TODO') acc.todo++;
        else if (issue.status === 'IN_PROGRESS' || issue.status === 'IN_REVIEW') acc.inProgress++;
        else if (issue.status === 'DONE') acc.done++;
        return acc;
      },
      { todo: 0, inProgress: 0, done: 0 }
    );

    return [
      { label: 'To Do', count: counts.todo, colorClass: 'bg-blue-500' },
      { label: 'In Progress', count: counts.inProgress, colorClass: 'bg-yellow-500' },
      { label: 'Done', count: counts.done, colorClass: 'bg-green-500' },
    ];
  }

  /**
   * Get issue type breakdown based on filtered sprint
   */
  getIssueTypeCounts(sprintId: string | null = null): { name: string; count: number }[] {
    const issues = this.getIssuesBySprintId(sprintId);
    const counts = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return [
      { name: 'Story', count: counts['STORY'] || 0 },
      { name: 'Task', count: counts['TASK'] || 0 },
      { name: 'Bug', count: counts['BUG'] || 0 },
      { name: 'Epic', count: counts['EPIC'] || 0 },
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
