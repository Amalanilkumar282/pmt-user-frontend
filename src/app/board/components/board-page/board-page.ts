import { ChangeDetectionStrategy, Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Navbar } from '../../../shared/navbar/navbar';
import { SidebarStateService } from '../../../shared/services/sidebar-state.service';
import { ProjectContextService } from '../../../shared/services/project-context.service';
import { UserContextService } from '../../../shared/services/user-context.service';
import { BoardColumn } from '../board-column/board-column';
import { BoardStore } from '../../board-store';
import { BoardToolbar } from '../board-toolbar/board-toolbar';
import { BoardColumnsContainer } from '../board-columns-container/board-columns-container';
import { IssueDetailedView } from '../../../backlog/issue-detailed-view/issue-detailed-view';
import { BoardService } from '../../services/board.service';
import { signal } from '@angular/core';
import { DEFAULT_COLUMNS } from '../../utils';

@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [
    CommonModule, 
    Sidebar, 
    Navbar, 
    BoardToolbar,
    BoardColumnsContainer,
    IssueDetailedView
  ],
  templateUrl: './board-page.html',
  styleUrls: ['./board-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  private userContextService = inject(UserContextService);
  private boardService = inject(BoardService);
  private store = inject(BoardStore);

  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  sprints = this.store.sprints;
  columns = this.store.columnBuckets;
  // modal state for issue detailed view
  protected selectedIssue = signal(null as any);
  protected isModalOpen = signal(false);
  
  constructor() {
    // React to board changes
    effect(() => {
      const board = this.boardService.currentBoard();
      if (board) {
        // Update store columns based on board configuration
        this.store.columns.set([...board.columns]);
        console.log('[BoardPage] Board changed, updated columns:', board.columns.length);
      }
    });
    
    // Subscribe to route param changes (project changes)
    this.route.parent?.params.subscribe(async params => {
      const projectId = params['projectId'];
      console.log('[BoardPage] Project changed to:', projectId);
      if (projectId) {
        this.projectContextService.setCurrentProjectId(projectId);
        this.boardService.accessProject(projectId);
        console.log('[BoardPage] Set project context and accessed project');
        
        // Load boards and data from backend
        await this.loadProjectData(projectId);
        
        // Check if we have a boardId in query params
        const currentBoardId = this.route.snapshot.queryParamMap.get('boardId');
        if (currentBoardId) {
          console.log('[BoardPage] Loading board from query param:', currentBoardId);
          await this.loadBoardById(Number(currentBoardId));
        } else {
          // Load default board for this project
          console.log('[BoardPage] No boardId, loading default board');
          await this.loadDefaultBoard(projectId);
        }
      }
    });
    
    // Subscribe to query param changes (board selection within same project)
    this.route.queryParams.subscribe(async params => {
      const boardId = params['boardId'];
      const currentProjectId = this.projectContextService.currentProjectId();
      
      // Only reload if boardId changed and we're in the same project
      if (boardId && boardId !== this.boardService.currentBoardId() && currentProjectId) {
        await this.loadBoardById(Number(boardId));
      }
    });
  }

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }

  async ngOnInit(): Promise<void> {
    // Initial load - Set project context from route params
    const projectId = this.route.parent?.snapshot.paramMap.get('projectId');
    
    // Avoid referencing `window` during server-side rendering
    const isBrowser = typeof window !== 'undefined';
    console.log('[BoardPage] ngOnInit - Route params:', {
      projectId: projectId,
      fullUrl: isBrowser ? window.location.href : 'server',
      routeSnapshot: this.route.snapshot,
      parentRoute: this.route.parent?.snapshot
    });
    
    if (!projectId) {
      console.error('[BoardPage] No project ID found in route');
      if (isBrowser) {
        console.log('[BoardPage] Current URL:', window.location.href);
        console.log('[BoardPage] Expected URL format: /projects/{projectId}/board');
      }
      return;
    }
    
    console.log(`[BoardPage] Project ID extracted: ${projectId}`);
    
    this.projectContextService.setCurrentProjectId(projectId);
    this.boardService.accessProject(projectId);
    
    // Load all project data from backend
    await this.loadProjectData(projectId);
    
    // Check for boardId in query params
    const boardId = this.route.snapshot.queryParamMap.get('boardId');
    
    if (boardId) {
      // Load specific board from URL
      await this.loadBoardById(Number(boardId));
    } else {
      // No boardId specified, load default board
      await this.loadDefaultBoard(projectId);
    }
  }
  
  /**
   * Load all project data: boards, issues, sprints
   */
  private async loadProjectData(projectId: string): Promise<void> {
    try {
      console.log('[BoardPage] Loading project data for:', projectId);
      
      // Load boards and board data in parallel
      await Promise.all([
        this.boardService.loadBoardsByProject(projectId),
        this.store.loadBoardData(projectId)
      ]);
      
      console.log('[BoardPage] Project data loaded successfully');
    } catch (error) {
      console.error('[BoardPage] Error loading project data:', error);
    }
  }
  
  /**
   * Load specific board by ID
   */
  private async loadBoardById(boardId: number): Promise<void> {
    try {
      console.log('[BoardPage] Loading board:', boardId);
      const board = await this.boardService.loadBoardById(boardId);
      
      if (board) {
        this.boardService.setCurrentBoard(board.id);
        console.log('[BoardPage] Board loaded:', board.name);
      } else {
        console.warn(`Board ${boardId} not found`);
      }
    } catch (error) {
      console.error('[BoardPage] Error loading board:', error);
    }
  }
  
  private async loadDefaultBoard(projectId: string): Promise<void> {
    // Check if we have a teamId in query params
    const teamId = this.route.snapshot.queryParamMap.get('teamId');
    
    let defaultBoard;
    
    if (teamId) {
      // Load team's current sprint board
      console.log('[BoardPage] loadDefaultBoard - Loading team board for team:', teamId);
      defaultBoard = this.boardService.getDefaultTeamBoard(teamId);
    } else {
      // Load project's default board - get userId from UserContextService
      const userId = this.userContextService.getCurrentUserIdString() || 'unknown';
      console.log('[BoardPage] loadDefaultBoard - Loading project board - ProjectId:', projectId, 'UserId:', userId);
      defaultBoard = await this.boardService.getDefaultBoard(projectId, userId);
    }
    
    console.log('[BoardPage] loadDefaultBoard - Default board returned:', defaultBoard);
    
    if (defaultBoard) {
      console.log('[BoardPage] loadDefaultBoard - Loading board:', defaultBoard.id, defaultBoard.name);
      this.boardService.setCurrentBoard(defaultBoard.id);
      
      // Update URL with boardId query param
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { boardId: defaultBoard.id },
        queryParamsHandling: 'merge'
      });
    } else {
      console.warn(`[BoardPage] No boards found for project ${projectId}`);
      console.log('[BoardPage] TIP: Create a board in the backend first, or check if the project ID is correct');
      
      // Don't create fallback board - let the user know they need to create one
      // Set a safe default state
      this.store.selectSprint('BACKLOG');
    }
  }

  // open issue detailed view from task card
  onOpenIssue(issue: any) {
    this.selectedIssue.set(issue);
    this.isModalOpen.set(true);
  }
  
  // open issue detailed view and scroll to comments
  onOpenIssueComments(issue: any) {
    this.selectedIssue.set(issue);
    this.isModalOpen.set(true);
    
    // Use setTimeout to ensure modal is rendered before scrolling
    setTimeout(() => {
      const commentsSection = document.getElementById('issue-comments-section');
      if (commentsSection) {
        commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  // public handler for moveIssue emitted by issue-detailed-view
  onMoveIssue(event: { issueId: string, destinationSprintId: string | null }) {
    this.store.updateIssueStatus(event.issueId, 'TODO' as any);
  }
}
