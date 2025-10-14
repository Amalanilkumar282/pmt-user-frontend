import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { BoardStore } from '../../board-store';
import { BoardColumnDef } from '../../models';

@Component({
  selector: 'app-edit-board-columns',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './edit-board-columns.html',
  styleUrl: './edit-board-columns.css'
})
export class EditBoardColumns {
  private store = inject(BoardStore);
  
  isOpen = signal(false);
  editableColumns = signal<BoardColumnDef[]>([]);

  open() {
    // Clone current columns for editing
    this.editableColumns.set([...this.store.columns()]);
    this.isOpen.set(true);
  }
  
  close() {
    this.isOpen.set(false);
  }

  drop(event: CdkDragDrop<BoardColumnDef[]>) {
    const cols = [...this.editableColumns()];
    moveItemInArray(cols, event.previousIndex, event.currentIndex);
    this.editableColumns.set(cols);
  }

  updateTitle(col: BoardColumnDef, newTitle: string) {
    col.title = newTitle;
    this.editableColumns.set([...this.editableColumns()]);
  }

  save() {
    // Save to store
    this.store.columns.set([...this.editableColumns()]);
    this.close();
  }
}
