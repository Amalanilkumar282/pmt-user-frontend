import { Component, effect, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarStateService } from '../services/sidebar-state.service';
import { ProjectContextService } from '../services/project-context.service';
import { BoardService } from '../../board/services/board.service';
import { RecentProject } from '../../board/models/board.model';
import { AddBoardModal } from '../../board/components/add-board-modal/add-board-modal';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, AddBoardModal],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  standalone: true,
})
export class Sidebar {
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  private router = inject(Router);
  boardService = inject(BoardService); // Made public for template access
  
  addBoardModal = viewChild<AddBoardModal>('addBoardModal');
  
  isStateReady = signal(false);
  expandedProjectId = signal<string | null>(null);
  
  currentProjectId = this.projectContextService.currentProjectId;
  recentProjects = this.boardService.recentProjects;

  constructor() {
    // Mark ready after state loads
    effect(() => {
      this.sidebarStateService.isCollapsed();
      this.isStateReady.set(true);
    });
  }

  // Use shared state from service
  // provide a tolerant isCollapsed callable that supports multiple shapes
  // of the SidebarStateService used across tests and app code:
  // - a signal/callable `isCollapsed()`
  // - a `getCollapsed()` method
  // - or a boolean property `isCollapsed`
  isCollapsed: () => boolean = (() => {
    const svc: any = this.sidebarStateService;
    if (typeof svc.isCollapsed === 'function') {
      return svc.isCollapsed.bind(svc);
    }
    if (typeof svc.getCollapsed === 'function') {
      return () => svc.getCollapsed();
    }
    // fallback: coerce truthiness
    return () => !!svc.isCollapsed;
  })();

  // Navigation items could be defined here if needed
  navItems = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard', active: true },
    { icon: 'recent', label: 'Recent', route: '/recent', active: false },
    { icon: 'projects', label: 'Projects', route: '/projects', active: false },
    { icon: 'starred', label: 'Starred', route: '/starred', active: false },
    { icon: 'settings', label: 'Settings', route: '/settings', active: false },
  ];

  toggleCollapse(): void {
    this.sidebarStateService.toggleCollapse();
  }

  setCollapsed(collapsed: boolean): void {
    this.sidebarStateService.setCollapsed(collapsed);
  }
  
  toggleProjectExpanded(projectId: string): void {
    if (this.expandedProjectId() === projectId) {
      this.expandedProjectId.set(null);
    } else {
      this.expandedProjectId.set(projectId);
    }
  }
  
  isProjectExpanded(projectId: string): boolean {
    return this.expandedProjectId() === projectId;
  }
  
  navigateToProject(projectId: string): void {
    // Update recent projects - move to top
    this.boardService.accessProject(projectId);
    
    // Get the default "All Issues" board for this project
    const userId = 'user-1'; // TODO: Get from auth service
    const defaultBoard = this.boardService.getDefaultBoard(projectId, userId);
    
    if (defaultBoard) {
      console.log('🔗 Sidebar - Navigating to project', projectId, 'with default board', defaultBoard.id);
      // Navigate with boardId in query params
      this.router.navigate(['/projects', projectId, 'board'], {
        queryParams: { boardId: defaultBoard.id }
      });
    } else {
      console.warn('🔗 Sidebar - No default board found for project', projectId);
      // Navigate without boardId, board-page will handle it
      this.router.navigate(['/projects', projectId, 'board']);
    }
  }
  
  navigateToBoard(projectId: string, boardId: string): void {
    // Set current board and navigate with query param
    this.boardService.setCurrentBoard(boardId);
    this.router.navigate(['/projects', projectId, 'board'], {
      queryParams: { boardId }
    });
  }
  
  openAddBoardModal(projectId: string): void {
    const modal = this.addBoardModal();
    if (modal) {
      modal.open(projectId);
    }
  }
  
  onBoardCreated(boardId: string): void {
    // Navigate to the newly created board
    const board = this.boardService.getBoardById(boardId);
    if (board) {
      this.router.navigate(['/projects', board.projectId, 'board'], {
        queryParams: { boardId }
      });
    }
  }
}
