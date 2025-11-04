import { Component, effect, inject, signal, viewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarStateService } from '../services/sidebar-state.service';
import { ProjectContextService } from '../services/project-context.service';
import { BoardService } from '../../board/services/board.service';
import { ProjectService, Project } from '../../projects/services/project.service';
import { RecentProject } from '../../board/models/board.model';
import { AddBoardModal } from '../../board/components/add-board-modal/add-board-modal';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, AddBoardModal],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  standalone: true,
})
export class Sidebar implements OnInit {
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  private projectService = inject(ProjectService);
  private router = inject(Router);
  boardService = inject(BoardService); // Made public for template access

  addBoardModal = viewChild<AddBoardModal>('addBoardModal');

  isStateReady = signal(false);
  expandedProjectId = signal<string | null>(null);

  currentProjectId = this.projectContextService.currentProjectId;
  recentProjects = signal<RecentProject[]>([]);
  isLoadingRecentProjects = signal<boolean>(false);

  constructor() {
    // Mark ready after state loads
    effect(() => {
      this.sidebarStateService.isCollapsed();
      this.isStateReady.set(true);
    });
    
    // Load recent projects from backend
    this.boardService.loadRecentProjects();
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
      // Load boards for this project if not already loaded
      const project = this.recentProjects().find((p) => p.id === projectId);
      if (project && project.boards.length === 0) {
        // Boards will be loaded by BoardService when needed
        this.boardService.loadBoardsByProject(projectId).then(() => {
          // Update the project's boards in our local state
          const boardServiceProject = this.boardService
            .recentProjects()
            .find((p) => p.id === projectId);
          if (boardServiceProject) {
            const updatedProjects = this.recentProjects().map((p) =>
              p.id === projectId ? { ...p, boards: boardServiceProject.boards } : p
            );
            this.recentProjects.set(updatedProjects);
          }
        });
      }
    }
  }

  isProjectExpanded(projectId: string): boolean {
    return this.expandedProjectId() === projectId;
  }

  navigateToProject(projectId: string): void {
    // Find the project to get its name
    const project = this.recentProjects().find(p => p.id === projectId);
    const projectName = project?.name || 'Unknown Project';
    
    // Set the current project ID and name in session storage
    this.projectContextService.setCurrentProjectId(projectId, projectName);
    console.log('✅ [Sidebar] Navigating to project:', projectId, projectName);

    // Update recent projects - move to top (async but don't await)
    this.boardService.accessProject(projectId);

    // Get the default "All Issues" board for this project (async)
    const userId = 'user-1'; // TODO: Get from auth service
    this.boardService
      .getDefaultBoard(projectId, userId)
      .then((defaultBoard) => {
        if (defaultBoard) {
          console.log(
            '[Sidebar] Navigating to project',
            projectId,
            'with default board',
            defaultBoard.id
          );
          // Navigate with boardId in query params
          this.router.navigate(['/projects', projectId, 'board'], {
            queryParams: { boardId: defaultBoard.id },
          });
        } else {
          console.warn('[Sidebar] No default board found for project', projectId);
          // Navigate without boardId, board-page will handle it
          this.router.navigate(['/projects', projectId, 'board']);
        }
      })
      .catch((err) => {
        console.error('[Sidebar] Error resolving default board:', err);
        this.router.navigate(['/projects', projectId, 'board']);
      });
  }

  navigateToBoard(projectId: string, boardId: string): void {
    // Find the project to get its name
    const project = this.recentProjects().find(p => p.id === projectId);
    const projectName = project?.name || 'Unknown Project';
    
    // Set the current project ID and name in session storage
    this.projectContextService.setCurrentProjectId(projectId, projectName);

    // Set current board and navigate with query param
    this.boardService.setCurrentBoard(boardId);
    this.router.navigate(['/projects', projectId, 'board'], {
      queryParams: { boardId },
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
      // Set the current project ID in session storage
      this.projectContextService.setCurrentProjectId(board.projectId);

      this.router.navigate(['/projects', board.projectId, 'board'], {
        queryParams: { boardId },
      });
    }
  }

  /**
   * Transform API Project to RecentProject for sidebar display
   */
  private transformToRecentProject(project: Project): RecentProject {
    return {
      id: project.id,
      name: project.name,
      boards: [], // Boards will be loaded separately when project is expanded
      lastAccessed: project.lastUpdated || new Date().toISOString(),
    };
  }

  /**
   * Load recent projects from API
   */
  private loadRecentProjects(): void {
    const userId = this.projectService.getUserId();

    if (!userId) {
      // User not logged in
      return;
    }

    this.isLoadingRecentProjects.set(true);

    this.projectService.getRecentProjects(userId, 2).subscribe({
      next: (projects: Project[]) => {
        console.log('✅ [Sidebar] Recent projects loaded:', projects);
        const recentProjectsData = projects.map((p: Project) => this.transformToRecentProject(p));
        this.recentProjects.set(recentProjectsData);
        this.isLoadingRecentProjects.set(false);
      },
      error: (error: any) => {
        console.error('❌ [Sidebar] Error loading recent projects:', error);
        this.isLoadingRecentProjects.set(false);
        this.recentProjects.set([]);
      },
    });
  }

  ngOnInit(): void {
    // Load recent projects when sidebar initializes
    this.loadRecentProjects();
  }
}
