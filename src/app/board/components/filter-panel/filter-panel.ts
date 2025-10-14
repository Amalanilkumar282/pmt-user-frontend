import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardStore } from '../../board-store';
import { FilterState } from '../../models';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';
import { AvatarClassPipe, InitialsPipe } from '../../../shared/pipes/avatar.pipe';

type FilterKey = keyof FilterState;

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective, FormsModule, AvatarClassPipe, InitialsPipe],
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterPanel {
  private store = inject(BoardStore);
  isOpen = false;
  activeField: keyof FilterState | null = null;
  
  // Filter field keys for template iteration
  readonly filterFields: FilterKey[] = ['assignees', 'workTypes', 'labels', 'statuses', 'priorities'];
  
  // Search queries for each filter type
  assigneeSearch = signal('');
  workTypeSearch = signal('');
  labelSearch = signal('');
  statusSearch = signal('');
  prioritySearch = signal('');

  assignees = computed(() => {
    const issues = this.store.issues();
    const values = issues
      .map(i => i.assignee)
      .filter((v): v is string => typeof v === 'string' && v.length > 0);
    const unique = Array.from(new Set(values)).sort();
    
    const search = this.assigneeSearch().toLowerCase().trim();
    if (!search) return unique;
    
    return unique.filter(a => a.toLowerCase().includes(search));
  });

  statuses = computed(() => {
    const allStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];
    const search = this.statusSearch().toLowerCase().trim();
    if (!search) return allStatuses;
    
    return allStatuses.filter(s => s.toLowerCase().includes(search));
  });

  workTypes = computed(() => {
    const issues = this.store.issues();
    const unique = Array.from(new Set(issues.map(i => i.type))).sort();
    
    const search = this.workTypeSearch().toLowerCase().trim();
    if (!search) return unique;
    
    return unique.filter(w => w.toLowerCase().includes(search));
  });

  labels = computed(() => {
    const issues = this.store.issues();
    const unique = Array.from(new Set(issues.flatMap(i => i.labels || []))).sort();
    
    const search = this.labelSearch().toLowerCase().trim();
    if (!search) return unique;
    
    return unique.filter(l => l.toLowerCase().includes(search));
  });

  priorities = computed(() => {
    const allPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const search = this.prioritySearch().toLowerCase().trim();
    if (!search) return allPriorities;
    
    return allPriorities.filter(p => p.toLowerCase().includes(search));
  });

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
    if (!this.isOpen) {
      this.activeField = null;
      this.clearSearches();
    }
  }

  selectField(field: keyof FilterState): void {
    this.activeField = field;
  }
  
  clearSearches(): void {
    this.assigneeSearch.set('');
    this.workTypeSearch.set('');
    this.labelSearch.set('');
    this.statusSearch.set('');
    this.prioritySearch.set('');
  }
  
  clearAllFilters(): void {
    this.store.clearFilters();
    this.clearSearches();
  }
}
