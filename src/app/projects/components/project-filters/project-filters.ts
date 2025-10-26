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
  @Input() selectedStatus: string = 'all';
  @Input() selectedDU: string = 'all';

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() statusFilterChange = new EventEmitter<string>();
  @Output() duFilterChange = new EventEmitter<string>();

  statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  dus = [
    { value: 'all', label: 'All DU' },
    { value: 'ATC', label: 'ATC' },
    { value: 'DES', label: 'DES' },
    { value: 'RWA', label: 'RWA' },
    { value: 'DTS', label: 'DTS' },
  ];

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.searchQueryChange.emit(query);
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.statusFilterChange.emit(status);
  }

  onDUChange(du: string): void {
    this.selectedDU = du;
    this.duFilterChange.emit(du);
  }
}
