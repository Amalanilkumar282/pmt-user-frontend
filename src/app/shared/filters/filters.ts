import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterCriteria {
  searchText: string;
  quickFilter: string | null;
  type: string | null;
  priority: string | null;
  status: string | null;
  assignee: string | null;
  sort: string;
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

  // Search
  searchText: string = '';

  // Quick Filters
  activeQuickFilter: string | null = null;

  // Dropdown Filters
  selectedType: string | null = null;
  selectedPriority: string | null = null;
  selectedStatus: string | null = null;
  selectedAssignee: string | null = null;
  selectedSort: string = 'Recently Updated';

  // Dropdown state
  openDropdown: string | null = null;

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

  selectAssignee(assignee: string | null): void {
    this.selectedAssignee = assignee;
    this.openDropdown = null;
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
      this.selectedAssignee ||
      this.selectedSort !== 'Recently Updated');
  }

  clearAllFilters(): void {
    this.searchText = '';
    this.activeQuickFilter = null;
    this.selectedType = null;
    this.selectedPriority = null;
    this.selectedStatus = null;
    this.selectedAssignee = null;
    this.selectedSort = 'Recently Updated';
    this.emitFilters();
  }

  private emitFilters(): void {
    const criteria: FilterCriteria = {
      searchText: this.searchText,
      quickFilter: this.activeQuickFilter,
      type: this.selectedType,
      priority: this.selectedPriority,
      status: this.selectedStatus,
      assignee: this.selectedAssignee,
      sort: this.selectedSort
    };
    this.filtersChanged.emit(criteria);
  }
}
