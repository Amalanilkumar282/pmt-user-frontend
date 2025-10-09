import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import type { Issue } from '../../../shared/models/issue.model';
import { AvatarClassPipe, InitialsPipe } from '../../../shared/pipes/avatar.pipe';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, DragDropModule, AvatarClassPipe, InitialsPipe],
  templateUrl: './task-card.html',
  styleUrls: ['./task-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskCard implements OnInit {
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
  // Basic metadata placeholders (can be wired to real fields if added later)
  commentsCount = 0;
  attachmentsCount = 0;
  dueDate?: Date;

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
    // fake due date within the last 30 days for display
    const daysAgo = (num % 24) + 1;
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    this.dueDate = d;
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
}
