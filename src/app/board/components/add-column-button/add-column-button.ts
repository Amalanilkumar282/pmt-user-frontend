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
  color = '#A1C4FD'; // Default blue

  // Available color options
  colorOptions = [
    { name: 'Blue', value: '#A1C4FD' },
    { name: 'Orange', value: '#FFA500' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Violet', value: '#A78BFA' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Yellow', value: '#F59E0B' },
  ];

  open() { this.isOpen = true; }
  close() { this.isOpen = false; this.name = ''; this.color = '#A1C4FD'; }

  addColumn() {
    if (!this.name.trim()) return;
    const id = this.name.toUpperCase().replace(/\s+/g, '_');
    this.store.addColumn({ id: id as any, title: this.name, color: this.color });
    this.close();
  }
}
