import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FilterState {
  sprints: string[];
  epics: string[];
  types: string[];
  status: string[];
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
    sprints: [],
    epics: [],
    types: [],
    status: []
  };
  @Input() availableSprints: string[] = [];
  @Input() availableEpics: string[] = [];
  @Input() selectedEpic: string | null = null;

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
}