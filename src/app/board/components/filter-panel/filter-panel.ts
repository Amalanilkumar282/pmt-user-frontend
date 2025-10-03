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
  activeField: keyof FilterState | null = null;

  assignees = computed(() => {
    const issues = this.store.issues();
    const values = issues
      .map(i => i.assignee)
      .filter((v): v is string => typeof v === 'string' && v.length > 0);
    return Array.from(new Set(values));
  });

  statuses = computed(() => [
    'TODO',
    'IN_PROGRESS',
    'IN_REVIEW',
    'DONE'
  ]);

  workTypes = computed(() => {
    // derive from issues
    const issues = this.store.issues();
    return Array.from(new Set(issues.map(i => i.type)));
  });

  labels = computed(() => {
    const issues = this.store.issues();
    return Array.from(new Set(issues.flatMap(i => i.labels || [])));
  });

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
    if (!this.isOpen) this.activeField = null;
  }

  selectField(field: keyof FilterState): void {
    this.activeField = field;
  }
}
