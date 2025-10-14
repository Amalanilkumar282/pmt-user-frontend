import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardStore } from '../../board-store';

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
  }
  
  close() { 
    this.isOpen = false; 
    this.name = ''; 
    this.color = '#3D62A8';
  }

  isValid(): boolean {
    return this.name.trim().length > 0 && this.isValidHexColor(this.color);
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
    this.store.addColumn({ 
      id: id as any, 
      title: this.name.trim(), 
      color: this.color 
    });
    this.close();
  }
}
