import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssueList } from '../issue-list/issue-list';
import { IssueDetailedView } from '../issue-detailed-view/issue-detailed-view';
import { Issue } from '../../shared/models/issue.model';

@Component({
  selector: 'app-backlog-container',
  imports: [CommonModule, IssueList, IssueDetailedView],
  templateUrl: './backlog-container.html',
  styleUrl: './backlog-container.css'
})
export class BacklogContainer {
  @Input() issues: Issue[] = [];

  // Modal state
  protected selectedIssue = signal<Issue | null>(null);
  protected isModalOpen = signal(false);

  onIssueClick(issue: Issue): void {
    this.selectedIssue.set(issue);
    this.isModalOpen.set(true);
  }

  onCloseModal(): void {
    this.isModalOpen.set(false);
    setTimeout(() => this.selectedIssue.set(null), 300);
  }

  onDeleteIssue(issueId: string): void {
    console.log('Delete issue from backlog:', issueId);
    this.issues = this.issues.filter(i => i.id !== issueId);
  }
}
