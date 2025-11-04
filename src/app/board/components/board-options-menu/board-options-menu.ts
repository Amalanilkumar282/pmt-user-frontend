import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardService } from '../../services/board.service';
import { BoardStore } from '../../board-store';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmationModal } from '../../../shared/components/confirmation-modal/confirmation-modal';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';

@Component({
  selector: 'app-board-options-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModal, ClickOutsideDirective],
  templateUrl: './board-options-menu.html',
  styleUrl: './board-options-menu.css'
})
export class BoardOptionsMenu {
  private boardService = inject(BoardService);
  private store = inject(BoardStore);
  private toast = inject(ToastService);

  showMenu = signal(false);
  showEditModal = signal(false);
  showDeleteConfirmation = signal(false);
  editedBoardName = signal('');

  currentBoard = this.boardService.currentBoard;
  
  // Check if board can be deleted (no issues and no custom columns)
  canDeleteBoard = computed(() => {
    const board = this.currentBoard();
    if (!board) return false;
    
    // Can't delete default boards
    if (board.isDefault) return false;
    
    // Check if there are any issues
    const hasIssues = this.store.issues().length > 0;
    
    // Check if there are custom columns (more than default)
    const hasCustomColumns = board.columns.length > 3;
    
    return !hasIssues && !hasCustomColumns;
  });

  canEditBoard = computed(() => {
    const board = this.currentBoard();
    // Do not allow editing of default (all-issues) boards. Only allow edit
    // when a non-default board is present. This hides the 'Edit Board' action
    // for the special default board as requested.
    return !!board && !board.isDefault;
  });

  // Whether there are any visible options to show in the menu. If false,
  // the toolbar can omit rendering the three-dots button entirely.
  readonly hasOptions = computed(() => {
    return this.canEditBoard() || this.canDeleteBoard();
  });

  toggleMenu() {
    this.showMenu.update(v => !v);
  }

  closeMenu() {
    this.showMenu.set(false);
  }

  openEditModal() {
    const board = this.currentBoard();
    if (board) {
      this.editedBoardName.set(board.name);
      this.showEditModal.set(true);
      this.closeMenu();
    }
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.editedBoardName.set('');
  }

  async saveEdit() {
    const board = this.currentBoard();
    const name = this.editedBoardName().trim();

    if (!board) return;
    if (!name) {
      try { this.toast.error('Board name cannot be empty'); } catch {}
      return;
    }

    try {
      // Call API to update board. updateBoardApi will reload the board on success.
      const updated = await this.boardService.updateBoardApi(board.id, { name });
      if (updated) {
        try { this.toast.success('Board updated successfully'); } catch {}
        // Ensure store is showing the updated board
        this.store.loadBoard(updated.id);
      } else {
        try { this.toast.error('Failed to update board'); } catch {}
      }
    } catch (err) {
      console.error('[BoardOptionsMenu] Error updating board via API:', err);
      try { this.toast.error('Error updating board'); } catch {}
    } finally {
      this.closeEditModal();
    }
  }

  openDeleteConfirmation() {
    this.showDeleteConfirmation.set(true);
    this.closeMenu();
  }

  closeDeleteConfirmation() {
    this.showDeleteConfirmation.set(false);
  }

  confirmDelete() {
    const board = this.currentBoard();
    if (board) {
      this.boardService.deleteBoard(board.id);
      this.closeDeleteConfirmation();
      
      // Navigate to default board for this project (async)
      this.boardService.getDefaultBoard(board.projectId, 'user-1').then(defaultBoard => {
        if (defaultBoard) {
          this.store.loadBoard(defaultBoard.id);
        }
      });
    }
  }
}
