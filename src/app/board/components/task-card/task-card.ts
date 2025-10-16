import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import type { Issue } from '../../../shared/models/issue.model';
import { AvatarClassPipe, InitialsPipe } from '../../../shared/pipes/avatar.pipe';
import { BoardStore } from '../../board-store';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, AvatarClassPipe, InitialsPipe, ClickOutsideDirective],
  templateUrl: './task-card.html',
  styleUrls: ['./task-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskCard implements OnInit {
  private store = inject(BoardStore);
  
  // allow tests to create the component without providing an issue
  @Input() issue: Issue = {
    id: '',
    title: '',
    description: '',
    type: 'TASK',
    priority: 'LOW',
    status: 'TODO',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  @Input() colorClass = '#A1C4FD'; // Default blue color
  @Output() open = new EventEmitter<Issue>();
  @Output() titleChanged = new EventEmitter<{ issueId: string, newTitle: string }>();
  @Output() assigneeClicked = new EventEmitter<Issue>();
  
  // Editing state
  isEditingTitle = signal(false);
  editedTitle = signal('');
  showAssigneeDropdown = signal(false);
  showDatePicker = signal(false);
  assigneeSearchQuery = signal('');
  
  // Available assignees
  readonly availableAssignees = ['Alice Johnson', 'Bob Smith', 'Carol White', 'David Brown', 'Eve Davis', 'Unassigned'];
  
  // Filtered assignees based on search
  readonly filteredAssignees = computed(() => {
    const query = this.assigneeSearchQuery().toLowerCase();
    if (!query) return this.availableAssignees;
    return this.availableAssignees.filter(a => a.toLowerCase().includes(query));
  });
  
  // Basic metadata placeholders
  commentsCount = 0;
  attachmentsCount = 0;

  // Label color palette - vibrant and varied
  private labelColors = [
    { bg: '#E0E7FF', text: '#4338CA' }, 
    { bg: '#DBEAFE', text: '#1E40AF' },
    { bg: '#D1FAE5', text: '#047857' }, 
    { bg: '#FEE2E2', text: '#B91C1C' }, 
    { bg: '#FEF3C7', text: '#92400E' }, 
    { bg: '#FCE7F3', text: '#BE185D' }, 
    { bg: '#E9D5FF', text: '#7C3AED' }, 
    { bg: '#CCFBF1', text: '#0F766E' }, 
  ];

  getLabelBgColor(label: string): string {
    const hash = label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.labelColors[hash % this.labelColors.length].bg;
  }

  getLabelTextColor(label: string): string {
    const hash = label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.labelColors[hash % this.labelColors.length].text;
  }

  getPriorityClass(priority: string): string {
    const classes = {
      CRITICAL: 'bg-red-100 text-red-800',
      HIGH: 'bg-orange-100 text-orange-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-green-100 text-green-800'
    };
    return classes[priority as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  }

  getPriorityPill(priority: string): string {
    const classes = {
      CRITICAL: 'bg-rose-100 text-rose-700',
      HIGH: 'bg-orange-100 text-orange-700',
      MEDIUM: 'bg-amber-100 text-amber-700',
      LOW: 'bg-emerald-100 text-emerald-700'
    } as const;
    return classes[priority as keyof typeof classes] || 'bg-slate-100 text-slate-700';
  }

  ngOnInit() {
    // Deterministic demo values derived from issue id so UI is stable and testable
    const num = this.issue.id.split('').reduce((a,c)=>a + c.charCodeAt(0), 0);
    this.commentsCount = num % 10;          // 0..9
    this.attachmentsCount = num % 7;        // 0..6
  }

  getProgressValue(): number {
    // Map status to progress for a stable visual like design
    const map: Record<string, number> = {
      TODO: 10,
      IN_PROGRESS: 55,
      IN_REVIEW: 80,
      DONE: 100,
      BLOCKED: 5
    };
    return map[this.issue.status] ?? 10;
  }
  
  // Title editing methods
  startEditingTitle(event: Event): void {
    event.stopPropagation(); // Prevent card click
    this.editedTitle.set(this.issue.title);
    this.isEditingTitle.set(true);
  }
  
  saveTitle(): void {
    const newTitle = this.editedTitle().trim();
    if (newTitle && newTitle !== this.issue.title) {
      // Update BoardStore directly
      this.store.updateIssueTitle(this.issue.id, newTitle);
    }
    this.isEditingTitle.set(false);
  }
  
  cancelEditTitle(event: Event): void {
    event.stopPropagation();
    this.isEditingTitle.set(false);
  }
  
  onTitleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveTitle();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEditTitle(event);
    }
  }
  
  // Assignee click handler
  onAssigneeClick(event: Event): void {
    event.stopPropagation(); // Prevent card click
    this.assigneeSearchQuery.set(''); // Reset search when opening
    this.showAssigneeDropdown.set(!this.showAssigneeDropdown());
  }
  
  selectAssignee(assignee: string): void {
    const newAssignee = assignee === 'Unassigned' ? undefined : assignee;
    this.store.updateIssueAssignee(this.issue.id, newAssignee);
    this.showAssigneeDropdown.set(false);
    this.assigneeSearchQuery.set(''); // Reset search
  }
  
  closeAssigneeDropdown(): void {
    this.showAssigneeDropdown.set(false);
    this.assigneeSearchQuery.set(''); // Reset search
  }
  
  // Due date handlers
  onDueDateClick(event: Event): void {
    event.stopPropagation();
    this.showDatePicker.set(!this.showDatePicker());
  }
  
  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newDate = input.value ? new Date(input.value) : undefined;
    this.store.updateIssueDueDate(this.issue.id, newDate);
    this.showDatePicker.set(false);
  }
  
  clearDueDate(): void {
    this.store.updateIssueDueDate(this.issue.id, undefined);
    this.showDatePicker.set(false);
  }
  
  closeDatePicker(): void {
    this.showDatePicker.set(false);
  }
  
  formatDateForInput(date?: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }
}
