import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { BoardStore } from '../../board-store';
import { BoardColumnDef } from '../../models';
import { BoardService } from '../../services/board.service';

@Component({
  selector: 'app-edit-board-columns',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './edit-board-columns.html',
  styleUrl: './edit-board-columns.css'
})
export class EditBoardColumns {
  private store = inject(BoardStore);
  private boardService = inject(BoardService);
  
  isOpen = signal(false);
  editableColumns = signal<BoardColumnDef[]>([]);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  open() {
    // Deep clone current columns for editing (to avoid mutating originals)
    const originalColumns = this.store.columns();
    const clonedColumns = originalColumns.map(col => ({
      ...col,
      // Create new object with all properties copied
      id: col.id,
      columnId: col.columnId,
      title: col.title,
      color: col.color,
      position: col.position,
      status: col.status,
      statusId: col.statusId
    }));
    this.editableColumns.set(clonedColumns);
    this.errorMessage.set(null);
    this.isOpen.set(true);
  }
  
  close() {
    this.isOpen.set(false);
    this.isSaving.set(false);
    this.errorMessage.set(null);
  }

  drop(event: CdkDragDrop<BoardColumnDef[]>) {
    const cols = [...this.editableColumns()];
    moveItemInArray(cols, event.previousIndex, event.currentIndex);
    
    // CRITICAL: Update position property for all columns after reordering
    // This ensures the save() method can detect position changes
    for (let i = 0; i < cols.length; i++) {
      cols[i].position = i + 1; // 1-based position
    }
    
    this.editableColumns.set(cols);
    console.log('[EditBoardColumns] Columns reordered:', cols.map(c => ({ title: c.title, position: c.position })));
  }

  updateTitle(col: BoardColumnDef, newTitle: string) {
    col.title = newTitle;
    this.editableColumns.set([...this.editableColumns()]);
  }
  
  updateColor(col: BoardColumnDef, newColor: string) {
    col.color = newColor;
    this.editableColumns.set([...this.editableColumns()]);
  }

  async save() {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    
    // Persist changes to backend where necessary, then refresh store
    const originalCols = this.store.columns();
    const editedCols = [...this.editableColumns()];

    console.log('[EditBoardColumns] Original columns:', originalCols.map(c => ({ title: c.title, position: c.position, columnId: c.columnId })));
    console.log('[EditBoardColumns] Edited columns:', editedCols.map(c => ({ title: c.title, position: c.position, columnId: c.columnId })));

    const board = this.store.currentBoard();
    const boardId = board?.id;

    if (!boardId) {
      console.warn('[EditBoardColumns] No current board selected - applying locally');
      this.store.columns.set(editedCols);
      this.isSaving.set(false);
      this.close();
      return;
    }

    // Ensure positions are sequential (1-based) - redundant if drop() already did this, but safe
    for (let i = 0; i < editedCols.length; i++) {
      editedCols[i].position = i + 1;
    }

    let successCount = 0;
    let failCount = 0;

    // Iterate and update only changed columns
    for (const col of editedCols) {
      try {
        // Find original column by stable id (id field) if present
        const orig = originalCols.find(c => c.id === col.id) || originalCols.find(c => c.columnId === col.columnId);

        // Build updates object only with changed values
        const updates: { name?: string; color?: string; position?: number } = {};
        if (!orig || col.title !== orig.title) updates.name = col.title;
        if (!orig || col.color !== orig.color) updates.color = col.color;
        if (!orig || col.position !== orig.position) updates.position = col.position;

        if (Object.keys(updates).length === 0) {
          console.log('[EditBoardColumns] No changes for column:', col.title);
          continue; // nothing to update
        }

        console.log('[EditBoardColumns] Changes detected for column:', col.title, {
          original: orig ? { title: orig.title, position: orig.position, color: orig.color } : 'not found',
          new: { title: col.title, position: col.position, color: col.color },
          updates
        });

        if (!col.columnId) {
          // If there's no backend column id, we cannot update — log and skip
          console.warn('[EditBoardColumns] Column has no backend id, skipping update:', col);
          failCount++;
          continue;
        }

        console.log('[EditBoardColumns] Updating column:', {
          columnId: col.columnId,
          title: col.title,
          updates
        });

        // Await each update to keep ordering predictable (positions)
        const ok = await this.boardService.updateColumnApi(col.columnId, boardId, updates);
        if (ok) {
          successCount++;
          console.log('[EditBoardColumns] Successfully updated column:', col.title);
        } else {
          failCount++;
          console.error('[EditBoardColumns] Failed to update column:', col.title);
        }
      } catch (err) {
        failCount++;
        console.error('[EditBoardColumns] Error updating column:', col.title, err);
      }
    }

    console.log('[EditBoardColumns] Update summary:', { successCount, failCount });

    // Refresh board from backend to get updated columns
    try {
      console.log('[EditBoardColumns] Reloading board from backend:', boardId);
      await this.boardService.loadBoardById(parseInt(boardId));
      console.log('[EditBoardColumns] Board reloaded successfully');
    } catch (err) {
      console.error('[EditBoardColumns] Error refreshing board after column updates:', err);
      this.errorMessage.set('Failed to reload board after updates');
    }

    this.isSaving.set(false);

    // Show error if any updates failed
    if (failCount > 0) {
      this.errorMessage.set(`${failCount} column(s) failed to update. Check console for details.`);
      // Don't close the modal so user can see the error
    } else {
      this.close();
    }
  }
}
