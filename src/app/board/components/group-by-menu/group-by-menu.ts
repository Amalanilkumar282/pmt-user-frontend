import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardStore } from '../../board-store';
import { GroupBy } from '../../models';

@Component({
  selector: 'app-group-by-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './group-by-menu.html',
  styleUrl: './group-by-menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupByMenu {
  private store = inject(BoardStore);
  isOpen = false;

  readonly groupByOptions = [
    { label: 'None', value: 'NONE' as const },
    { label: 'Assignee', value: 'ASSIGNEE' as const },
    { label: 'Epic', value: 'EPIC' as const },
    { label: 'Subtask', value: 'SUBTASK' as const }
  ];

  getCurrentLabel(): string {
    const current = this.store.groupBy();
    return this.groupByOptions.find(opt => opt.value === current)?.label || 'None';
  }

  isSelected(value: GroupBy): boolean {
    return this.store.groupBy() === value;
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  selectOption(value: GroupBy): void {
    this.store.groupBy.set(value);
    this.isOpen = false;
  }
}
