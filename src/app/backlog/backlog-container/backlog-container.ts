import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IssueList } from '../issue-list/issue-list';
import { IssueDetailedView } from '../issue-detailed-view/issue-detailed-view';
import { Issue } from '../../shared/models/issue.model';

@Component({
  selector: 'app-backlog-container',
  imports: [CommonModule, FormsModule, IssueList, IssueDetailedView],
  templateUrl: './backlog-container.html',
  styleUrl: './backlog-container.css'
})
export class BacklogContainer {
  @Input() issues: Issue[] = [];
  @Input() availableSprints: Array<{ id: string, name: string, status: string }> = [];
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
}
