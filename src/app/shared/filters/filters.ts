import { Component, EventEmitter, Output, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterCriteria {
  searchText: string;
  quickFilter: string | null;
  type: string | null;
  priority: string | null;
  status: string | null;
  assignees: string[];
  sort: string;
  // New fields
  view: 'sprints' | 'all-issues';
  epicId: string | null;
  showCompletedSprints: boolean;
  showEpicPanel: boolean;
}

@Component({
  selector: 'app-filters',
  imports: [CommonModule, FormsModule],
  templateUrl: './filters.html',
  styleUrl: './filters.css',
  standalone: true
})
export class Filters {
  @Output() filtersChanged = new EventEmitter<FilterCriteria>();

  // Collapse state
  isCollapsed = signal(false);

  // Search
  searchText: string = '';

  // Quick Filters
  activeQuickFilter: string | null = null;

  // Dropdown Filters
  selectedType: string | null = null;
  selectedPriority: string | null = null;
  selectedStatus: string | null = null;
  selectedAssignees: string[] = [];
  selectedSort: string = 'Recently Updated';

  // Dropdown state
  openDropdown: string | null = null;

  // New view and filter states
  currentView: 'sprints' | 'all-issues' = 'sprints';
  selectedEpicId: string | null = null;
  showCompletedSprints = signal(false);
  showEpicPanel = signal(false);

  // Epic options - will be passed from parent
  @Input() epicOptions: Array<{ id: string, name: string }> = [];

  onSearchChange(): void {
    this.emitFilters();
  }

  clearSearch(): void {
    this.searchText = '';
    this.emitFilters();
  }

  toggleQuickFilter(filter: string): void {
    if (this.activeQuickFilter === filter) {
      this.activeQuickFilter = null;
    } else {
      this.activeQuickFilter = filter;
    }
    this.emitFilters();
  }

  toggleDropdown(dropdown: string): void {
    this.openDropdown = this.openDropdown === dropdown ? null : dropdown;
  }

  selectType(type: string | null): void {
    this.selectedType = type;
    this.openDropdown = null;
    this.emitFilters();
  }

  selectPriority(priority: string | null): void {
    this.selectedPriority = priority;
    this.openDropdown = null;
    this.emitFilters();
  }

  selectStatus(status: string | null): void {
    this.selectedStatus = status;
    this.openDropdown = null;
    this.emitFilters();
  }

  toggleAssignee(assignee: string | null): void {
    // null means 'All' -> clear selection
    if (assignee === null) {
      this.selectedAssignees = [];
      this.openDropdown = null;
      this.emitFilters();
      return;
    }

    const idx = this.selectedAssignees.indexOf(assignee);
    if (idx === -1) this.selectedAssignees = [...this.selectedAssignees, assignee];
    else this.selectedAssignees = this.selectedAssignees.filter(a => a !== assignee);

    this.emitFilters();
  }

  selectSort(sort: string): void {
    this.selectedSort = sort;
    this.openDropdown = null;
    this.emitFilters();
  }

  hasActiveFilters(): boolean {
    return !!
      (this.searchText ||
      this.activeQuickFilter ||
      this.selectedType ||
      this.selectedPriority ||
      this.selectedStatus ||
      (this.selectedAssignees && this.selectedAssignees.length > 0) ||
      this.selectedEpicId ||
      this.selectedSort !== 'Recently Updated');
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.searchText) count++;
    if (this.activeQuickFilter) count++;
    if (this.selectedType) count++;
    if (this.selectedPriority) count++;
    if (this.selectedStatus) count++;
    if (this.selectedAssignees && this.selectedAssignees.length > 0) count++;
    if (this.selectedEpicId) count++;
    if (this.selectedSort !== 'Recently Updated') count++;
    return count;
  }

  clearAllFilters(): void {
    this.searchText = '';
    this.activeQuickFilter = null;
    this.selectedType = null;
    this.selectedPriority = null;
    this.selectedStatus = null;
    this.selectedAssignees = [];
    this.selectedEpicId = null;
    this.selectedSort = 'Recently Updated';
    // Keep view and toggle states when clearing filters
    this.emitFilters();
  }

  toggleCollapse(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }

  // New methods for view and epic management
  toggleView(view: 'sprints' | 'all-issues'): void {
    this.currentView = view;
    this.emitFilters();
  }

  toggleEpicPanel(): void {
    this.showEpicPanel.set(!this.showEpicPanel());
    this.emitFilters();
  }

  onEpicFilterChange(epicId: string | null): void {
    this.selectedEpicId = epicId;
    this.emitFilters();
  }

  toggleCompletedSprints(): void {
    this.showCompletedSprints.set(!this.showCompletedSprints());
    this.emitFilters();
  }

  getSelectedEpicName(): string {
    if (!this.selectedEpicId) return 'All';
    const epic = this.epicOptions.find(e => e.id === this.selectedEpicId);
    return epic ? epic.name : 'All';
  }

  private emitFilters(): void {
    const criteria: FilterCriteria = {
      searchText: this.searchText,
      quickFilter: this.activeQuickFilter,
      type: this.selectedType,
      priority: this.selectedPriority,
      status: this.selectedStatus,
      assignees: this.selectedAssignees,
      sort: this.selectedSort,
      view: this.currentView,
      epicId: this.selectedEpicId,
      showCompletedSprints: this.showCompletedSprints(),
      showEpicPanel: this.showEpicPanel()
    };
    this.filtersChanged.emit(criteria);
  }
}
