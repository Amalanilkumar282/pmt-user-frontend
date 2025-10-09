import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import type { Issue } from '../../../shared/models/issue.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './task-card.html',
  styleUrls: ['./task-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskCard {
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
  @Input() colorClass = 'border-slate-200';
  @Output() open = new EventEmitter<Issue>();

  getPriorityClass(priority: string): string {
    const classes = {
      CRITICAL: 'bg-red-100 text-red-800',
      HIGH: 'bg-orange-100 text-orange-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-green-100 text-green-800'
    };
    return classes[priority as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  }

  getInitials(name: string | undefined): string {
    if (!name) return '?';
    return name.trim().split(/\s+/)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
