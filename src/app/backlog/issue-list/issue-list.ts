import { Component, Input, Output, EventEmitter, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Issue, IssuePriority, IssueStatus } from '../../shared/models/issue.model';
import { InlineEditService } from '../../shared/services/inline-edit.service';
import { ProjectContextService } from '../../shared/services/project-context.service';

@Component({
  selector: 'app-issue-list',
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './issue-list.html',
  styleUrl: './issue-list.css'
})
export class IssueList implements OnInit {
  @Input() set issues(value: Issue[]) {
    this._issues.set(value);
  }
  
  @Input() isReadOnly: boolean = false;
  
  @Output() issueClick = new EventEmitter<Issue>();
  @Output() issueStatusChange = new EventEmitter<{ issue: Issue; newStatus: string }>();
  @Output() issueUpdated = new EventEmitter<Issue>();
  @Output() issueDeleted = new EventEmitter<string>();

  private _issues = signal<Issue[]>([]);
  protected issues$ = computed(() => this._issues());
  
  private inlineEditService = inject(InlineEditService);
  private projectContextService = inject(ProjectContextService);
  
  // Inline editing state
  protected editingField = signal<{ issueId: string; field: string } | null>(null);
  protected tempValues = signal<{ [key: string]: any }>({});
  
  // Dropdown options
  protected projectMembers = signal<Array<{ id: number; name: string }>>([]);
  protected projectStatuses = signal<Array<{ id: number; name: string }>>([]);
  protected priorities: IssuePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  
  // Loading states
  protected isLoadingMembers = signal(false);
  protected isLoadingStatuses = signal(false);
  
  // Track if an issue is being dragged to prevent click events
  private isDragging = false;

  // Group issues by status for better organization
  protected issuesByStatus = computed(() => {
    const issues = this._issues();
    return {
      todo: issues.filter(i => i.status === 'TODO'),
      inProgress: issues.filter(i => i.status === 'IN_PROGRESS'),
      inReview: issues.filter(i => i.status === 'IN_REVIEW'),
      done: issues.filter(i => i.status === 'DONE')
    };
  });
  
  ngOnInit() {
    this.loadProjectData();
  }
  
  private loadProjectData() {
    const projectId = this.projectContextService.currentProjectId();
    if (!projectId) return;
    
    // Load project members
    this.isLoadingMembers.set(true);
    this.inlineEditService.getProjectMembers(projectId).subscribe({
      next: (members) => {
        this.projectMembers.set(members);
        this.isLoadingMembers.set(false);
      },
      error: () => this.isLoadingMembers.set(false)
    });
    
    // Load project statuses
    this.isLoadingStatuses.set(true);
    this.inlineEditService.getProjectStatuses(projectId).subscribe({
      next: (statuses) => {
        this.projectStatuses.set(statuses);
        this.isLoadingStatuses.set(false);
      },
      error: () => this.isLoadingStatuses.set(false)
    });
  }

  protected getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'STORY': 'fa-solid fa-book',
      'TASK': 'fa-solid fa-check-circle',
      'BUG': 'fa-solid fa-bug',
      'EPIC': 'fa-solid fa-bolt'
    };
    return icons[type] || 'fa-solid fa-file';
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

  protected onIssueClick(issue: Issue): void {
    // Only emit click event if not dragging
    if (!this.isDragging) {
      this.issueClick.emit(issue);
    }
  }
  
  protected onDragStarted(): void {
    this.isDragging = true;
  }
  
  protected onDragEnded(): void {
    // Reset drag state after a brief delay to prevent click event
    setTimeout(() => {
      this.isDragging = false;
    }, 100);
  }
  
  // Inline editing methods
  protected startEdit(issue: Issue, field: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.isReadOnly) return;
    
    this.editingField.set({ issueId: issue.id, field });
    const currentValues = this.tempValues();
    currentValues[issue.id] = {
      ...currentValues[issue.id],
      [field]: (issue as any)[field]
    };
    this.tempValues.set(currentValues);
  }
  
  protected isEditing(issueId: string, field: string): boolean {
    const editing = this.editingField();
    return editing?.issueId === issueId && editing?.field === field;
  }
  
  protected cancelEdit(): void {
    this.editingField.set(null);
  }
  
  protected saveTitle(issue: Issue, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const newTitle = this.tempValues()[issue.id]?.title;
    if (!newTitle || newTitle === issue.title) {
      this.cancelEdit();
      return;
    }
    
    this.inlineEditService.updateIssueName(issue, newTitle).subscribe({
      next: (updatedIssue) => {
        this.updateIssueInList(updatedIssue);
        this.issueUpdated.emit(updatedIssue);
        this.cancelEdit();
      },
      error: () => this.cancelEdit()
    });
  }
  
  protected savePriority(issue: Issue, newPriority: IssuePriority): void {
    if (newPriority === issue.priority) {
      this.cancelEdit();
      return;
    }
    
    this.inlineEditService.updateIssuePriority(issue, newPriority).subscribe({
      next: (updatedIssue) => {
        this.updateIssueInList(updatedIssue);
        this.issueUpdated.emit(updatedIssue);
        this.cancelEdit();
      },
      error: () => this.cancelEdit()
    });
  }
  
  protected saveAssignee(issue: Issue, assigneeName: string): void {
    this.inlineEditService.updateIssueAssignee(issue, assigneeName).subscribe({
      next: (updatedIssue) => {
        this.updateIssueInList(updatedIssue);
        this.issueUpdated.emit(updatedIssue);
        this.cancelEdit();
      },
      error: () => this.cancelEdit()
    });
  }
  
  protected saveStatus(issue: Issue, newStatus: string): void {
    if (newStatus === issue.status) {
      this.cancelEdit();
      return;
    }
    
    this.inlineEditService.updateIssueStatus(issue, newStatus as IssueStatus).subscribe({
      next: (updatedIssue) => {
        this.updateIssueInList(updatedIssue);
        this.issueUpdated.emit(updatedIssue);
        this.issueStatusChange.emit({ issue: updatedIssue, newStatus });
        this.cancelEdit();
      },
      error: () => this.cancelEdit()
    });
  }
  
  protected deleteIssue(issue: Issue, event: Event): void {
    event.stopPropagation();
    if (this.isReadOnly) return;
    
    if (confirm(`Are you sure you want to delete "${issue.title}"?`)) {
      this.inlineEditService.deleteIssue(issue.id).subscribe({
        next: (success) => {
          if (success) {
            this.removeIssueFromList(issue.id);
            this.issueDeleted.emit(issue.id);
          }
        }
      });
    }
  }
  
  private updateIssueInList(updatedIssue: Issue): void {
    const currentIssues = this._issues();
    const index = currentIssues.findIndex(i => i.id === updatedIssue.id);
    if (index !== -1) {
      currentIssues[index] = updatedIssue;
      this._issues.set([...currentIssues]);
    }
  }
  
  private removeIssueFromList(issueId: string): void {
    const currentIssues = this._issues();
    this._issues.set(currentIssues.filter(i => i.id !== issueId));
  }
  
  protected getStatusDisplayName(status: string): string {
    return status.replace(/_/g, ' ');
  }
}
