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
  @Input() currentView: 'day' | 'month' | 'year' = 'day';
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
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
    
    document.querySelectorAll('.filter-dropdown').forEach(dd => {
      if (dd !== dropdown) {
        dd.classList.remove('show');
      }
    });
    
    dropdown.classList.toggle('show');
  }

  private closeAllDropdowns() {
    document.querySelectorAll('.filter-dropdown').forEach(dd => {
      dd.classList.remove('show');
    });
  }
}