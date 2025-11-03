import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Issue } from '../../shared/models/issue.model';
import {
  activeSprintIssues,
  completedSprint1Issues,
  completedSprint2Issues,
} from '../../shared/data/dummy-backlog-data';

interface Tab {
  id: string;
  label: string;
  count: number;
}

@Component({
  selector: 'app-tabbed-issues',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabbed-issues.html',
  styleUrls: ['./tabbed-issues.css'],
})
export class TabbedIssues implements OnInit, OnChanges {
  @Input() userIssues: Issue[] = [];
  @Input() isLoading: boolean = false;

  activeTab: string = 'workedOn';
  currentUser = 'Harrel Alex'; // This could come from an auth service

  tabs: Tab[] = [
    { id: 'workedOn', label: 'Worked On', count: 0 },
    { id: 'assigned', label: 'Assigned to me', count: 0 },
    { id: 'boards', label: 'Boards', count: 0 },
  ];

  ngOnInit(): void {
    this.updateTabCounts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userIssues']) {
      this.updateTabCounts();
    }
  }

  private updateTabCounts(): void {
    this.tabs[0].count = this.workedOnIssues.length;
    this.tabs[1].count = this.assignedIssues.length;
  }

  get workedOnIssues(): Issue[] {
    if (this.userIssues.length === 0) {
      return [];
    }

    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    return this.userIssues
      .filter((issue) => issue.updatedAt && issue.updatedAt >= oneMonthAgo)
      .sort((a, b) => {
        const aTime = a.updatedAt?.getTime() || 0;
        const bTime = b.updatedAt?.getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, 10);
  }

  get assignedIssues(): Issue[] {
    if (this.userIssues.length === 0) {
      return [];
    }

    return this.userIssues.sort((a, b) => {
      const aTime = a.updatedAt?.getTime() || 0;
      const bTime = b.updatedAt?.getTime() || 0;
      return bTime - aTime;
    });
  }

  getIssuesByTimeGroup(issues: Issue[]): { label: string; issues: Issue[] }[] {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const lastWeek = issues.filter((issue) => issue.updatedAt && issue.updatedAt >= sevenDaysAgo);
    const lastMonth = issues.filter(
      (issue) =>
        issue.updatedAt && issue.updatedAt < sevenDaysAgo && issue.updatedAt >= thirtyDaysAgo
    );

    const groups = [];
    if (lastWeek.length > 0) {
      groups.push({ label: 'IN THE LAST WEEK', issues: lastWeek });
    }
    if (lastMonth.length > 0) {
      groups.push({ label: 'IN THE LAST MONTH', issues: lastMonth });
    }

    return groups;
  }

  getIssueIcon(type: string): string {
    const icons: { [key: string]: string } = {
      STORY: 'fa-solid fa-book',
      TASK: 'fa-solid fa-check-circle',
      BUG: 'fa-solid fa-bug',
      EPIC: 'fa-solid fa-bolt',
    };
    return icons[type] || 'fa-solid fa-file';
  }

  getAssigneeInitials(assignee?: string): string {
    if (!assignee) return 'UN';
    return assignee
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getStatusText(issue: Issue): string {
    if (!issue.updatedAt) return 'Updated';

    const now = new Date();
    const diffTime = now.getTime() - issue.updatedAt.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Updated';
    if (diffDays === 1) return 'Updated';
    return 'Updated';
  }

  selectTab(tabId: string): void {
    this.activeTab = tabId;
  }
}
