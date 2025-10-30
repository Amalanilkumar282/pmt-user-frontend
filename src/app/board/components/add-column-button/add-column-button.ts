import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardStore } from '../../board-store';
import { IssueStatus } from '../../../shared/models/issue.model';

@Component({
  selector: 'app-add-column-button',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-column-button.html',
  styleUrl: './add-column-button.css'
})
export class AddColumnButton {
  private store = inject(BoardStore);
  isOpen = false;
  name = '';
  color = '#3D62A8'; // Default to primary color
  position = 1; // Default position
  selectedStatus: string = ''; // Selected or new status
  statusSearchQuery = ''; // Search query for status
  showStatusDropdown = false; // Show/hide status dropdown

  // Available statuses for dropdown
  availableStatuses: IssueStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'DONE'];

  // Get current columns to determine max position
  currentColumns = computed(() => this.store.columns());
  
  // Get max position for validation
  maxPosition = computed(() => {
    const columns = this.currentColumns();
    return columns.length > 0 ? Math.max(...columns.map(c => c.position)) + 1 : 1;
  });

  // Filtered statuses based on search
  get filteredStatuses(): string[] {
    if (!this.statusSearchQuery.trim()) {
      return this.availableStatuses;
    }
    const query = this.statusSearchQuery.toUpperCase();
    return this.availableStatuses.filter(status => 
      status.includes(query)
    );
  }

  // Check if the entered status is new (not in existing statuses)
  get isNewStatus(): boolean {
    const query = this.statusSearchQuery.trim().toUpperCase();
    return query.length > 0 && !this.availableStatuses.includes(query as IssueStatus);
  }

  // Jira-like: Only 6 essential preset colors for quick access
  presetColors = [
    '#3D62A8', // Primary Blue
    '#10B981', // Success Green
    '#F59E0B', // Warning Amber
    '#EF4444', // Danger Red
    '#8B5CF6', // Purple
    '#64748B', // Neutral Gray
  ];

  // Simplified color names
  private colorNames: Record<string, string> = {
    '#3D62A8': 'Blue',
    '#10B981': 'Green',
    '#F59E0B': 'Amber',
    '#EF4444': 'Red',
    '#8B5CF6': 'Purple',
    '#64748B': 'Gray',
  };

  getColorName(hex: string): string {
    return this.colorNames[hex] || 'Custom';
  }

  open() { 
    this.isOpen = true; 
    this.name = '';
    this.color = '#3D62A8';
    this.position = this.maxPosition();
    this.selectedStatus = '';
    this.statusSearchQuery = '';
    this.showStatusDropdown = false;
  }
  
  close() { 
    this.isOpen = false; 
    this.name = ''; 
    this.color = '#3D62A8';
    this.position = 1;
    this.selectedStatus = '';
    this.statusSearchQuery = '';
    this.showStatusDropdown = false;
  }

  onStatusInputFocus() {
    this.showStatusDropdown = true;
  }

  onStatusInputBlur() {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      this.showStatusDropdown = false;
    }, 200);
  }

  onStatusSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.trim();
    
    // Convert to uppercase and replace spaces with underscores
    value = value.toUpperCase().replace(/\s+/g, '_');
    
    this.statusSearchQuery = value;
    this.showStatusDropdown = true;
  }

  selectStatus(status: string) {
    this.selectedStatus = status;
    this.statusSearchQuery = status;
    this.showStatusDropdown = false;
  }

  useNewStatus() {
    const newStatus = this.statusSearchQuery.trim().toUpperCase().replace(/\s+/g, '_');
    if (newStatus) {
      this.selectedStatus = newStatus;
      this.showStatusDropdown = false;
    }
  }

  isValid(): boolean {
    return this.name.trim().length > 0 && 
           this.isValidHexColor(this.color) &&
           this.position > 0 &&
           this.position <= this.maxPosition();
  }

  isValidHexColor(hex: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
  }

  validateHexColor(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    
    // Ensure it starts with #
    if (!value.startsWith('#')) {
      value = '#' + value.replace(/^#+/, '');
    }
    
    // Remove invalid characters
    value = value.replace(/[^#0-9A-Fa-f]/g, '');
    
    // Limit to 7 characters (#RRGGBB)
    if (value.length > 7) {
      value = value.substring(0, 7);
    }
    
    this.color = value.toUpperCase();
  }

  addColumn() {
    if (!this.isValid()) return;
    
    const id = this.name.toUpperCase().replace(/\s+/g, '_');
    const finalStatus = this.selectedStatus || this.statusSearchQuery.trim().toUpperCase().replace(/\s+/g, '_');
    
    this.store.addColumn({ 
      id: id as any, 
      title: this.name.trim(), 
      color: this.color,
      position: this.position,
      status: finalStatus || undefined
    });
    this.close();
  }
}
