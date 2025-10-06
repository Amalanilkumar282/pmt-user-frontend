import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Epic } from '../../shared/models/epic.model';

@Component({
  selector: 'app-epic-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './epic-list.html',
  styleUrl: './epic-list.css'
})
export class EpicList {
  @Input() epic!: Epic;
  @Output() toggleExpand = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<string>();

  onToggleExpand(): void {
    this.toggleExpand.emit(this.epic.id);
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.epic.id);
  }

  formatDate(date: Date | null): string {
    if (!date) return '';
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  }
}
