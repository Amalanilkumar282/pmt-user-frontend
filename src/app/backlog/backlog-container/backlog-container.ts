import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { IssueList } from '../issue-list/issue-list';
import { IssueDetailedView } from '../issue-detailed-view/issue-detailed-view';
import { Issue } from '../../shared/models/issue.model';
import { IssueService, UpdateIssueRequest } from '../../shared/services/issue.service';

@Component({
  selector: 'app-backlog-container',
  imports: [CommonModule, FormsModule, DragDropModule, IssueList, IssueDetailedView],
  templateUrl: './backlog-container.html',
  styleUrl: './backlog-container.css'
})
export class BacklogContainer {
  private issueService = inject(IssueService);
  
  // Backlog issues: use a signal so derived/computed values react when
  // the Input is updated. This ensures `paginatedIssues` recomputes when
  // tests or parent components replace the array.
  private issuesSignal = signal<Issue[]>([]);

  @Input()
  set issues(value: Issue[]) {
    this.issuesSignal.set(value ?? []);
  }
  get issues(): Issue[] {
    return this.issuesSignal();
  }
  @Input() availableSprints: Array<{ id: string, name: string, status: string }> = [];
  @Input() connectedDropLists: string[] = [];
  @Output() moveIssue = new EventEmitter<{ issueId: string, destinationSprintId: string | null }>();

  // Modal state
  protected selectedIssue = signal<Issue | null>(null);
  protected isModalOpen = signal(false);
  protected isCollapsed = signal(false);

  // Pagination state - converted to signals for reactivity
  protected currentPageSignal = signal(1);
  protected itemsPerPageSignal = signal(10);

  // Expose as regular properties for template binding
  get currentPage(): number {
    return this.currentPageSignal();
  }
  set currentPage(value: number) {
    this.currentPageSignal.set(value);
  }

  get itemsPerPage(): number {
    return this.itemsPerPageSignal();
  }
  set itemsPerPage(value: number) {
    this.itemsPerPageSignal.set(value);
  }

  // Computed pagination values
  get totalPages(): number {
    return Math.ceil(this.issues.length / this.itemsPerPageSignal());
  }

  get startItem(): number {
    return this.issues.length === 0 ? 0 : (this.currentPageSignal() - 1) * this.itemsPerPageSignal() + 1;
  }

  get endItem(): number {
    const end = this.currentPageSignal() * this.itemsPerPageSignal();
    return end > this.issues.length ? this.issues.length : end;
  }

  protected paginatedIssues = computed(() => {
    const start = (this.currentPageSignal() - 1) * this.itemsPerPageSignal();
    const end = start + this.itemsPerPageSignal();
    return this.issues.slice(start, end);
  });

  toggleCollapse(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }

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
    // Adjust current page if needed
    if (this.paginatedIssues().length === 0 && this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Pagination methods
  onItemsPerPageChange(): void {
    this.currentPage = 1; // Reset to first page when changing items per page
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToFirstPage(): void {
    this.currentPage = 1;
  }

  goToLastPage(): void {
    this.currentPage = this.totalPages;
  }

  onMoveIssue(event: { issueId: string, destinationSprintId: string | null }): void {
    this.moveIssue.emit(event);
  }

  onUpdateIssue(updates: Partial<Issue>): void {
    const issue = this.selectedIssue();
    if (!issue) return;

    console.log('[BacklogContainer] Updating issue:', issue.id, updates);

    // Helper to format dates to UTC ISO string
    const formatDateToUTC = (date: Date | string | undefined): string | null => {
      if (!date) return null;
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      return d.toISOString();
    };

    // Build the update request matching the backend API format
    const updateReq: UpdateIssueRequest = {
      projectId: issue.projectId || '',
      issueType: (updates.type || issue.type || 'TASK').toUpperCase(),
      title: updates.title || issue.title,
      description: updates.description !== undefined ? updates.description : (issue.description || ''),
      priority: (updates.priority || issue.priority || 'MEDIUM').toUpperCase(),
      assigneeId: updates.assignee ? parseInt(updates.assignee) : (issue.assigneeId || null),
      startDate: formatDateToUTC(updates.startDate !== undefined ? updates.startDate : issue.startDate),
      dueDate: formatDateToUTC(updates.dueDate !== undefined ? updates.dueDate : issue.dueDate),
      sprintId: updates.sprintId !== undefined ? updates.sprintId : (issue.sprintId || null),
      storyPoints: updates.storyPoints !== undefined ? updates.storyPoints : (issue.storyPoints || 0),
      epicId: updates.epicId !== undefined ? updates.epicId : (issue.epicId || null),
      reporterId: issue.reporterId || null,
      attachmentUrl: updates.attachmentUrl !== undefined ? updates.attachmentUrl : (issue.attachmentUrl || null),
      statusId: issue.statusId || 1,
      labels: updates.labels ? JSON.stringify(updates.labels) : (issue.labels ? JSON.stringify(issue.labels) : null)
    };

    console.log('[BacklogContainer] Sending update request:', updateReq);

    // Call the API
    this.issueService.updateIssue(issue.id, updateReq).subscribe({
      next: (response) => {
        console.log('[BacklogContainer] Issue updated successfully:', response);
        
        // Update the local issue in the list
        const updatedIssue: Issue = { ...issue, ...updates };
        this.issues = this.issues.map(i => i.id === issue.id ? updatedIssue : i);
        this.selectedIssue.set(updatedIssue);
      },
      error: (error) => {
        console.error('[BacklogContainer] Failed to update issue:', error);
        alert('Failed to update issue. Please try again.');
      }
    });
  }

  onDrop(event: CdkDragDrop<Issue[]>): void {
    const issue = event.item.data as Issue;
    // Emit move event to parent component with null to indicate backlog
    this.moveIssue.emit({
      issueId: issue.id,
      destinationSprintId: null
    });
  }
}
