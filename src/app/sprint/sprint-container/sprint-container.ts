import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssueList } from '../../backlog/issue-list/issue-list';
import { Issue } from '../../shared/models/issue.model';

export interface Sprint {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'PLANNED';
  issues?: Issue[];
}

@Component({
  selector: 'app-sprint-container',
  imports: [CommonModule, IssueList],
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

  @Output() completeSprint = new EventEmitter<string>();
  @Output() deleteSprint = new EventEmitter<string>();

  formatDate(date: Date): string {
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month} ${day},${year}`;
  }

  onComplete(): void {
    this.completeSprint.emit(this.sprint.id);
  }

  onDelete(): void {
    this.deleteSprint.emit(this.sprint.id);
  }
}
