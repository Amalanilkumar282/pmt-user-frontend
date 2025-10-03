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
  color = 'border-slate-300';

  open() { this.isOpen = true; }
  close() { this.isOpen = false; this.name = ''; }

  addColumn() {
    if (!this.name.trim()) return;
    const id = this.name.toUpperCase().replace(/\s+/g, '_');
    this.store.addColumn({ id: id as any, title: this.name, color: this.color });
    this.close();
  }
}
