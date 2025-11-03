import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BoardService } from '../../services/board.service';
import { Board } from '../../models/board.model';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';
import { ProjectContextService } from '../../../shared/services/project-context.service';

@Component({
  selector: 'app-board-selector',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  templateUrl: './board-selector.html',
  styleUrls: ['./board-selector.css']
})
export class BoardSelector {
  private boardService = inject(BoardService);
  private projectContextService = inject(ProjectContextService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  isOpen = signal(false);
  currentBoard = this.boardService.currentBoard;
  
  // Use computed signal instead of getter for better reactivity
  projectBoards = computed(() => {
    const projectId = this.projectContextService.currentProjectId();
    const boards = projectId ? this.boardService.getBoardsByProject(projectId) : [];
    console.log('[BoardSelector] Project ID:', projectId, 'Boards:', boards.map(b => ({ id: b.id, name: b.name, projectId: b.projectId })));
    return boards;
  });
  
  get currentBoardName(): string {
    const board = this.currentBoard();
    console.log('[BoardSelector] Current Board:', board);
    return board ? board.name : 'Select Board';
  }
  
  toggleDropdown(): void {
    this.isOpen.set(!this.isOpen());
  }
  
  selectBoard(board: Board): void {
    this.boardService.setCurrentBoard(board.id);
    
    // Navigate with query params to trigger board reload
    const projectId = this.projectContextService.currentProjectId();
    if (projectId) {
      this.router.navigate(['/projects', projectId, 'board'], {
        queryParams: { boardId: board.id }
      });
    }
    
    this.isOpen.set(false);
  }
  
  closeDropdown(): void {
    this.isOpen.set(false);
  }
  
  isSelected(board: Board): boolean {
    return this.currentBoard()?.id === board.id;
  }
}
