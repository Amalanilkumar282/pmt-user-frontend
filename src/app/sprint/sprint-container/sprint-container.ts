import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { IssueList } from '../../backlog/issue-list/issue-list';
import { IssueDetailedView } from '../../backlog/issue-detailed-view/issue-detailed-view';
import { Issue } from '../../shared/models/issue.model';
import { formatDisplayDate } from '../../shared/utils/date-formatter';

export interface Sprint {
  id: string;
  projectId?: string;
  name: string;
  sprintGoal?: string;
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'PLANNED';
  storyPoint?: number;
  teamId?: number;
  teamAssigned?: string; // Keep for backward compatibility
  issues?: Issue[];
  createdAt?: Date;
  updatedAt?: Date | null;
}

@Component({
  selector: 'app-sprint-container',
  imports: [CommonModule, DragDropModule, IssueList, IssueDetailedView],
  templateUrl: './sprint-container.html',
  styleUrl: './sprint-container.css'
})
export class SprintContainer {
  @Input() sprint: Sprint = {
    id: '1',
    name: 'new sprint3',
    startDate: new Date('2025-10-04'),
    endDate: new Date('2025-10-13'),
    status: 'ACTIVE',
    issues: []
  };
  @Input() availableSprints: Array<{ id: string, name: string, status: string }> = [];
  @Input() connectedDropLists: string[] = [];

  @Output() completeSprint = new EventEmitter<string>();
  @Output() deleteSprint = new EventEmitter<string>();
  @Output() startSprint = new EventEmitter<string>();
  @Output() editSprint = new EventEmitter<string>();
  @Output() moveIssue = new EventEmitter<{ issueId: string, destinationSprintId: string | null }>();
  @Output() issueUpdated = new EventEmitter<Issue>();
  @Output() issueDeleted = new EventEmitter<string>();

  // Modal state
  protected selectedIssue = signal<Issue | null>(null);
  protected isModalOpen = signal(false);
  protected isCollapsed = signal(false);

  ngOnInit(): void {
    // Collapse completed sprints by default
    if (this.sprint.status === 'COMPLETED') {
      this.isCollapsed.set(true);
    }
  }

  formatDate(date: Date): string {
    return formatDisplayDate(date);
  }

  toggleCollapse(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }

  onSprintAction(): void {
    if (this.sprint.status === 'PLANNED') {
      this.startSprint.emit(this.sprint.id);
    } else if (this.sprint.status === 'ACTIVE') {
      this.completeSprint.emit(this.sprint.id);
    }
  }

  getActionButtonText(): string {
    return this.sprint.status === 'PLANNED' ? 'Start Sprint' : 'Complete Sprint';
  }

  isActionButtonDisabled(): boolean {
    return this.sprint.status === 'COMPLETED';
  }

  onEdit(): void {
    this.editSprint.emit(this.sprint.id);
  }

  onDelete(): void {
    this.deleteSprint.emit(this.sprint.id);
  }

  onIssueClick(issue: Issue): void {
    this.selectedIssue.set(issue);
    this.isModalOpen.set(true);
  }

  onCloseModal(): void {
    this.isModalOpen.set(false);
    setTimeout(() => this.selectedIssue.set(null), 300); // Delay clearing for animation
  }

  onDeleteIssue(issueId: string): void {
    console.log('Delete issue:', issueId);
    // Remove issue from sprint
    if (this.sprint.issues) {
      this.sprint.issues = this.sprint.issues.filter(i => i.id !== issueId);
    }
    this.issueDeleted.emit(issueId);
  }

  onIssueUpdatedInline(updatedIssue: Issue): void {
    // Update local state
    if (this.sprint.issues) {
      this.sprint.issues = this.sprint.issues.map(i => i.id === updatedIssue.id ? updatedIssue : i);
    }
    // Emit to parent
    this.issueUpdated.emit(updatedIssue);
  }

  onIssueDeletedInline(issueId: string): void {
    // Update local state
    if (this.sprint.issues) {
      this.sprint.issues = this.sprint.issues.filter(i => i.id !== issueId);
    }
    this.issueDeleted.emit(issueId);
  }

  onMoveIssue(event: { issueId: string, destinationSprintId: string | null }): void {
    this.moveIssue.emit(event);
  }

  onUpdateIssue(updates: Partial<Issue>): void {
    console.log('[SprintContainer] onUpdateIssue - updating local state with:', updates);
    
    const issue = this.selectedIssue();
    if (!issue) {
      console.error('[SprintContainer] No selected issue found!');
      return;
    }

    // Update the local issue in the list
    const updatedIssue: Issue = { ...issue, ...updates };
    if (this.sprint.issues) {
      this.sprint.issues = this.sprint.issues.map(i => i.id === issue.id ? updatedIssue : i);
    }
    this.selectedIssue.set(updatedIssue);
    
    console.log('[SprintContainer] Local state updated successfully');
  }

  onDrop(event: CdkDragDrop<Issue[]>): void {
    const issue = event.item.data as Issue;
    // Emit move event to parent component
    this.moveIssue.emit({
      issueId: issue.id,
      destinationSprintId: this.sprint.id
    });
  }
}
