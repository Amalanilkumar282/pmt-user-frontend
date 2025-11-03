import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { IssueDetailedView } from '../issue-detailed-view/issue-detailed-view';
import { IssueList } from '../issue-list/issue-list';
import { Issue } from '../../shared/models/issue.model';

@Component({
  selector: 'app-all-issues-list',
  imports: [CommonModule, FormsModule, DragDropModule, IssueDetailedView, IssueList],
  templateUrl: './all-issues-list.html',
  styleUrl: './all-issues-list.css'
})
export class AllIssuesList {
  private issuesSignal = signal<Issue[]>([]);

  @Input()
  set issues(value: Issue[]) {
    this.issuesSignal.set(value ?? []);
  }
  get issues(): Issue[] {
    return this.issuesSignal();
  }
  
  @Input() availableSprints: Array<{ id: string, name: string, status: string }> = [];
  @Output() moveIssue = new EventEmitter<{ issueId: string, destinationSprintId: string | null }>();

  // Modal state
  protected selectedIssue = signal<Issue | null>(null);
  protected isModalOpen = signal(false);
  protected isCollapsed = signal(false);

  // Pagination state
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

  // Separate completed and active issues
  protected completedIssues = computed(() => {
    return this.paginatedIssues().filter(issue => {
      // Check both status and statusId for DONE/completed state
      return issue.status === 'DONE' || issue.statusId === 4;
    });
  });

  protected activeIssues = computed(() => {
    return this.paginatedIssues().filter(issue => {
      // Check both status and statusId for active state
      return issue.status !== 'DONE' && issue.statusId !== 4;
    });
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
    console.log('Delete issue from all issues:', issueId);
    this.issues = this.issues.filter(i => i.id !== issueId);
    // Adjust current page if needed
    if (this.paginatedIssues().length === 0 && this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Pagination methods
  onItemsPerPageChange(): void {
    this.currentPage = 1;
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
    console.log('[AllIssuesList] onUpdateIssue - updating local state with:', updates);
    
    const issue = this.selectedIssue();
    if (!issue) {
      console.error('[AllIssuesList] No selected issue found!');
      return;
    }

    // Update the local issue in the list
    const updatedIssue: Issue = { ...issue, ...updates };
    this.issues = this.issues.map(i => i.id === issue.id ? updatedIssue : i);
    this.selectedIssue.set(updatedIssue);
    
    console.log('[AllIssuesList] Local state updated successfully');
  }
  
  onDropActiveIssues(event: CdkDragDrop<Issue[]>): void {
    // Don't do anything - issues should stay in their original location
    // The drag-drop in all-issues view is for visual feedback only
    // We're not reordering or moving issues within the all-issues list
    console.log('Drop event in all-issues (active):', event);
  }
  
  onDropCompletedIssues(event: CdkDragDrop<Issue[]>): void {
    // Don't do anything - issues should stay in their original location
    // The drag-drop in all-issues view is for visual feedback only
    console.log('Drop event in all-issues (completed):', event);
  }
}
