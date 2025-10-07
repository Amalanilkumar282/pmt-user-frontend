import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-filters.html',
  styleUrl: './project-filters.css',
})
export class ProjectFilters {
  @Input() searchQuery: string = '';
  @Input() projectTypes: string[] = [];
  @Input() showFilterDropdown: boolean = false;

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() filterDropdownToggle = new EventEmitter<void>();
  @Output() typeFilter = new EventEmitter<string>();

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.searchQueryChange.emit(query);
  }

  toggleFilters(): void {
    this.filterDropdownToggle.emit();
  }

  filterByType(type: string): void {
    this.typeFilter.emit(type);
  }
}
