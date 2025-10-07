import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';
import { Sprint } from '../../../sprint/sprint-container/sprint-container';

@Component({
  selector: 'app-sprint-select',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  templateUrl: './sprint-select.html',
  styleUrls: ['./sprint-select.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SprintSelect {
  @Input() sprints: Sprint[] = [];
  @Input() selectedId: string | 'BACKLOG' = 'BACKLOG';
  @Output() select = new EventEmitter<string|'BACKLOG'>();

  open = false;

  getCurrentLabel(): string {
    if (this.selectedId === 'BACKLOG') return 'Backlog';
    const sprint = this.sprints.find(s => s.id === this.selectedId);
    return sprint ? this.label(sprint) : 'Select Sprint';
  }

  label(s: Sprint): string {
    return s.status === 'ACTIVE' ? `${s.name} - Current` : s.name;
  }

  selectSprint(id: string | 'BACKLOG'): void {
    this.select.emit(id);
    this.open = false;
  }

  get selectedRange(): string {
    if (this.selectedId === 'BACKLOG') return '';
    const sprint = this.sprints.find(s => s.id === this.selectedId);
    if (!sprint) return '';
    const sd = new Date(sprint.startDate);
    const ed = new Date(sprint.endDate);
    return `${sd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${ed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }
}
