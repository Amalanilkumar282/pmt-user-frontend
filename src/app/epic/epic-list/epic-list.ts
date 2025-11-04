import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Epic } from '../../shared/models/epic.model';
import { formatDisplayDate } from '../../shared/utils/date-formatter';

@Component({
  selector: 'app-epic-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './epic-list.html',
  styleUrl: './epic-list.css'
})
export class EpicList {
  @Input() epic: Epic = {
    id: '',
    name: '',
    description: '',
    startDate: null,
    dueDate: null,
    progress: 0,
    issueCount: 0,
    isExpanded: false,
    assignee: 'Unassigned',
    labels: [],
    parent: 'None',
    team: 'None',
    sprint: 'None',
    storyPoints: 0,
    reporter: 'Unassigned',
    childWorkItems: [],
    status: 'TODO'
  };
  @Output() toggleExpand = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<string>();

  onToggleExpand(): void {
    this.toggleExpand.emit(this.epic.id);
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.epic.id);
  }

  formatDate(date: Date | null): string {
    return formatDisplayDate(date);
  }
}
