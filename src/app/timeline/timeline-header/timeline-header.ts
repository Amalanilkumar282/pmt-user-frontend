import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FilterState {
  epics: string[];
  types: string[];
  status: string[];
}

export interface StatusOption {
  id: number;
  statusName: string;
  displayName: string;
  value: string;
}

@Component({
  selector: 'app-timeline-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline-header.html',
  styleUrls: ['./timeline-header.css']
})
export class TimelineHeaderComponent {
  @Input() currentView: 'day' | 'month' | 'year' = 'month';
  @Input() displayMode: 'epics' | 'issues' = 'epics';
  @Input() selectedFilters: FilterState = {
    epics: [],
    types: [],
    status: []
  };
  @Input() availableEpics: string[] = [];
  @Input() selectedEpic: string | null = null;
  @Input() statusOptions: StatusOption[] = [];

  @Output() viewChanged = new EventEmitter<'day' | 'month' | 'year'>();
  @Output() filterToggled = new EventEmitter<{ type: string; value: string; checked: boolean }>();
  @Output() filtersCleared = new EventEmitter<void>();
  @Output() backToEpics = new EventEmitter<void>();
  @Output() displayRangeChanged = new EventEmitter<number>();
  @Output() showCompletedChanged = new EventEmitter<boolean>();
  @Output() expandAllEpics = new EventEmitter<void>();
  @Output() collapseAllEpics = new EventEmitter<void>();

  openDropdownId: string | null = null;
  showCompleted: boolean = true;
  displayRangeMonths: number = 12;
  displayRangeOptions = [1, 3, 6, 12, 24];
  epicSearchQuery: string = '';

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-container')) {
      this.closeAllDropdowns();
    }
  }

  changeTimeScale(scale: 'day' | 'month' | 'year') {
    this.viewChanged.emit(scale);
  }

  toggleFilter(type: string, value: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.filterToggled.emit({
      type,
      value,
      checked: checkbox.checked
    });
  }

  clearFilters() {
    this.filtersCleared.emit();
  }

  onBackToEpics() {
    this.backToEpics.emit();
  }

  getFilterCount(type: string): number {
    return (this.selectedFilters as any)[type].length;
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    const dropdown = button.nextElementSibling as HTMLElement;
    const dropdownId = dropdown.id;
    
    // Close all other dropdowns
    document.querySelectorAll('.filter-dropdown').forEach(dd => {
      if (dd !== dropdown) {
        dd.classList.remove('show');
      }
    });
    
    // Toggle current dropdown
    const isOpening = !dropdown.classList.contains('show');
    dropdown.classList.toggle('show');
    
    // Update openDropdownId for arrow rotation
    this.openDropdownId = isOpening ? dropdownId : null;
  }

  private closeAllDropdowns() {
    document.querySelectorAll('.filter-dropdown').forEach(dd => {
      dd.classList.remove('show');
    });
    this.openDropdownId = null;
  }

  isDropdownOpen(dropdownId: string): boolean {
    return this.openDropdownId === dropdownId;
  }

  toggleShowCompleted() {
    this.showCompleted = !this.showCompleted;
    this.showCompletedChanged.emit(this.showCompleted);
  }

  onDisplayRangeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.displayRangeMonths = parseInt(select.value);
    this.displayRangeChanged.emit(this.displayRangeMonths);
  }

  onExpandAllEpics() {
    this.expandAllEpics.emit();
  }

  onCollapseAllEpics() {
    this.collapseAllEpics.emit();
  }

  getFilteredEpics(): string[] {
    if (!this.epicSearchQuery.trim()) {
      return this.availableEpics;
    }
    const query = this.epicSearchQuery.toLowerCase();
    return this.availableEpics.filter(epic => 
      epic.toLowerCase().includes(query)
    );
  }

  onEpicSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.epicSearchQuery = input.value;
  }

  clearEpicSearch() {
    this.epicSearchQuery = '';
  }

  /**
   * Get all status options including default and API-fetched ones
   * Always includes TO_DO, IN_PROGRESS, DONE at the top
   */
  getAllStatusOptions(): StatusOption[] {
    const defaultStatuses: StatusOption[] = [
      { id: -1, statusName: 'TODO', displayName: 'To Do', value: 'todo' },
      { id: -2, statusName: 'IN_PROGRESS', displayName: 'In Progress', value: 'progress' },
      { id: -3, statusName: 'DONE', displayName: 'Done', value: 'done' }
    ];

    // Filter out duplicates from API that match default statuses
    const additionalStatuses = this.statusOptions
      .filter(status => {
        const normalizedName = status.statusName.toUpperCase().replace(/_/g, '');
        return !['TODO', 'INPROGRESS', 'DONE'].includes(normalizedName);
      })
      .map(status => ({
        ...status,
        displayName: this.formatStatusName(status.statusName),
        value: this.getStatusValue(status.statusName)
      }));

    return [...defaultStatuses, ...additionalStatuses];
  }

  /**
   * Format status name for display (e.g., "IN_PROGRESS" -> "In Progress")
   */
  formatStatusName(statusName: string): string {
    if (!statusName) return '';
    
    // Handle common status mappings
    const mappings: { [key: string]: string } = {
      'TODO': 'To Do',
      'TO_DO': 'To Do',
      'IN_PROGRESS': 'In Progress',
      'INPROGRESS': 'In Progress',
      'DONE': 'Done',
      'IN_REVIEW': 'In Review',
      'BLOCKED': 'Blocked'
    };

    const upperName = statusName.toUpperCase();
    if (mappings[upperName]) {
      return mappings[upperName];
    }

    // Convert snake_case to Title Case
    return statusName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get filter value for status (used in filtering logic)
   */
  getStatusValue(statusName: string): string {
    if (!statusName) return '';
    
    const upperName = statusName.toUpperCase().replace(/_/g, '');
    
    // Map to filter values that the timeline chart expects
    const mappings: { [key: string]: string } = {
      'TODO': 'todo',
      'INPROGRESS': 'progress',
      'DONE': 'done',
      'INREVIEW': 'review',
      'BLOCKED': 'blocked'
    };

    if (mappings[upperName]) {
      return mappings[upperName];
    }

    // Default: lowercase with underscores removed
    return statusName.toLowerCase().replace(/_/g, '');
  }
}