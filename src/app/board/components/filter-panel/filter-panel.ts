import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardStore } from '../../board-store';
import { FilterState } from '../../models';

type FilterKey = keyof FilterState;

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterPanel {
  private store = inject(BoardStore);
  isOpen = false;

  assignees = computed(() => {
    const issues = this.store.issues();
    return [...new Set(issues.map(i => i.assignee))].filter(Boolean);
  });

  statuses = computed(() => [
    'TODO',
    'IN_PROGRESS',
    'IN_REVIEW',
    'DONE'
  ]);

  priorities = computed(() => [
    'HIGH',
    'MEDIUM',
    'LOW'
  ]);

  isSelected(filterType: keyof FilterState, value: string): boolean {
    const filters = this.store.filters();
    return (filters[filterType] as string[]).includes(value);
  }

  toggle(filterType: keyof FilterState, value: string): void {
    const currentFilters = this.store.filters();
    const values = currentFilters[filterType] as string[];
    const newValues = values.includes(value)
      ? values.filter(v => v !== value)
      : [...values, value];
    
    this.store.filters.set({
      ...currentFilters,
      [filterType]: newValues
    });
  }

  togglePanel(): void {
    this.isOpen = !this.isOpen;
  }
}
