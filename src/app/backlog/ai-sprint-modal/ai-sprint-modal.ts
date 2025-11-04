import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserApiService } from '../../shared/services/user-api.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-ai-sprint-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-sprint-modal.html',
  styleUrl: './ai-sprint-modal.css'
})
export class AiSprintModal implements OnChanges {
  @Input() isOpen = false;
  @Input() suggestions: any | null = null; // AI Sprint Plan response (from parent)
  @Input() isLoading = false; // Loading state controlled by parent
  @Output() close = new EventEmitter<void>();
  @Output() commit = new EventEmitter<string[]>(); // Emit selected issue IDs
  @Output() loadingComplete = new EventEmitter<void>(); // Notify parent when user names are loaded

  private userApiService = inject(UserApiService);
  private cdr = inject(ChangeDetectorRef);

  selectedIssueIds: Set<string> = new Set();
  displayedIssues: any[] = []; // Track issues after removals
  assigneeNames = new Map<number, string>(); // Cache for assignee names
  internalLoading = false; // Internal loading state for user fetching

  ngOnChanges(changes: SimpleChanges): void {
    // When suggestions are loaded, fetch user names before showing content
    if (changes['suggestions'] && this.suggestions?.selectedIssues && this.suggestions.selectedIssues.length > 0) {
      this.displayedIssues = [...this.suggestions.selectedIssues];
      this.selectAllIssues();
      this.loadAssigneeNamesSync(); // Fetch user names synchronously
    }
    // Reset selection when modal is closed
    if (changes['isOpen'] && !this.isOpen) {
      this.selectedIssueIds.clear();
      this.displayedIssues = [];
      this.assigneeNames.clear();
      this.internalLoading = false;
    }
  }

  private loadAssigneeNamesSync(): void {
    // Collect all unique assignee IDs
    const assigneeIds = this.displayedIssues
      .map(issue => issue.suggestedAssigneeId)
      .filter(id => id != null && id !== undefined);

    // Remove duplicates
    const uniqueIds = [...new Set(assigneeIds)];

    if (uniqueIds.length === 0) {
      // No assignees to fetch, we're done
      return;
    }

    this.internalLoading = true;

    // Create an array of observables for each user fetch
    const userFetchObservables = uniqueIds.map(userId =>
      this.userApiService.getUserById(userId).pipe(
        catchError(err => {
          console.error(`Failed to fetch user ${userId}:`, err);
          // Return fallback name on error
          return of({ id: userId, name: 'Anyone', email: '' } as any);
        })
      )
    );

    // Wait for all user fetches to complete
    forkJoin(userFetchObservables).subscribe({
      next: (users) => {
        // Populate the assigneeNames map
        users.forEach(user => {
          if (user) {
            this.assigneeNames.set(user.id, user.name || 'Anyone');
          }
        });
        this.internalLoading = false;
        this.cdr.detectChanges(); // Trigger change detection
      },
      error: (err) => {
        console.error('Error fetching assignee names:', err);
        // Set all names to 'Anyone' on error
        uniqueIds.forEach(id => this.assigneeNames.set(id, 'Anyone'));
        this.internalLoading = false;
        this.cdr.detectChanges(); // Trigger change detection
      }
    });
  }

  getAssigneeName(assigneeId: number): string {
    // Return cached name or 'Anyone' if not found/loaded
    return this.assigneeNames.get(assigneeId) || 'Anyone';
  }

  // Computed property to check if we're still loading (parent loading or internal user fetching)
  get isStillLoading(): boolean {
    return this.isLoading || this.internalLoading;
  }

  onClose(): void {
    this.close.emit();
  }

  onCommit(): void {
    // Close modal immediately
    this.close.emit();
    
    // Then emit the issue IDs for background processing
    const displayedIds = this.displayedIssues.map(issue => issue.issueId);
    console.log('Committing with displayed issues:', displayedIds);
    this.commit.emit(displayedIds);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  toggleIssueSelection(issueId: string): void {
    if (this.selectedIssueIds.has(issueId)) {
      this.selectedIssueIds.delete(issueId);
    } else {
      this.selectedIssueIds.add(issueId);
    }
  }

  isIssueSelected(issueId: string): boolean {
    return this.selectedIssueIds.has(issueId);
  }

  selectAllIssues(): void {
    if (this.displayedIssues.length > 0) {
      this.displayedIssues.forEach((issue: any) => {
        this.selectedIssueIds.add(issue.issueId);
      });
    }
  }

  deselectAllIssues(): void {
    this.selectedIssueIds.clear();
  }

  removeIssue(issueId: string): void {
    // Remove from displayed issues
    this.displayedIssues = this.displayedIssues.filter(issue => issue.issueId !== issueId);
    // Remove from selection if selected
    this.selectedIssueIds.delete(issueId);
  }

  getTotalStoryPoints(): number {
    if (!this.displayedIssues || this.displayedIssues.length === 0) return 0;
    return this.displayedIssues.reduce(
      (sum: number, issue: any) => sum + (issue.storyPoints || 0),
      0
    );
  }

  getSelectedStoryPoints(): number {
    if (!this.displayedIssues || this.displayedIssues.length === 0) return 0;
    return this.displayedIssues
      .filter((issue: any) => this.selectedIssueIds.has(issue.issueId))
      .reduce((sum: number, issue: any) => sum + (issue.storyPoints || 0), 0);
  }

  getDisplayedIssuesCount(): number {
    return this.displayedIssues.length;
  }
}
