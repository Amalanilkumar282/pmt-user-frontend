import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IssueDetailedView } from '../issue-detailed-view/issue-detailed-view';
import { Issue } from '../../shared/models/issue.model';

@Component({
  selector: 'app-all-issues-list',
  imports: [CommonModule, FormsModule, IssueDetailedView],
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
    return this.paginatedIssues().filter(issue => issue.status === 'DONE');
  });

  protected activeIssues = computed(() => {
    return this.paginatedIssues().filter(issue => issue.status !== 'DONE');
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

  protected getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'STORY': '📖',
      'TASK': '✓',
      'BUG': '🐛',
      'EPIC': '⚡'
    };
    return icons[type] || '📝';
  }

  protected getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      'LOW': 'bg-gray-100 text-gray-700',
      'MEDIUM': 'bg-blue-100 text-blue-700',
      'HIGH': 'bg-orange-100 text-orange-700',
      'CRITICAL': 'bg-red-100 text-red-700'
    };
    return classes[priority] || 'bg-gray-100 text-gray-700';
  }
}
