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
// import { ActivityPanel } from '../../../shared/activity-panel/activity-panel';
import { BoardService } from '../../services/board.service';
import { signal } from '@angular/core';
import { DEFAULT_COLUMNS } from '../../utils';
import { Issue } from '../../../shared/models/issue.model';
import { EpicApiService } from '../../services/epic-api.service';
import { UserApiService } from '../../../shared/services/user-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [
    CommonModule, 
    Sidebar, 
    Navbar, 
    BoardToolbar,
    BoardColumnsContainer,
  IssueDetailedView,
  // ActivityPanel,
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
  private epicApi = inject(EpicApiService);
  private userApi = inject(UserApiService);

  isSidebarCollapsed = this.sidebarStateService.isCollapsed;

  sprints = this.store.sprints;
  columns = this.store.columnBuckets;
  // modal state for issue detailed view
  protected selectedIssue = signal(null as any);
  protected isModalOpen = signal(false);
  // activity panel state
  protected isActivityPanelOpen = signal(false);
  
  // Guards to prevent duplicate loading
  private _lastLoadedProjectId: string | null = null;
  private _lastLoadedBoardId: string | null = null;
  private _isInitializing = false;
  
  constructor() {
    // React to board changes
    effect(() => {
      const board = this.boardService.currentBoard();
      if (board) {
        // Update store columns based on board configuration
        this.store.columns.set([...board.columns]);
      }
    });
    
    // Subscribe to route param changes (project changes) - SKIP initial load
    this.route.parent?.params.subscribe(async params => {
      const projectId = params['projectId'];
      
      // Skip if we're initializing, already loaded this project, or this is the initial load
      if (this._isInitializing || projectId === this._lastLoadedProjectId || this._lastLoadedProjectId === null) {
        return;
      }
      
      if (projectId) {
        this.projectContextService.setCurrentProjectId(projectId);
        await this.boardService.accessProject(projectId);
        
        // Load boards and data from backend
        await this.loadProjectData(projectId);
        
        // Check if we have a boardId in query params
        const currentBoardId = this.route.snapshot.queryParamMap.get('boardId');
        if (currentBoardId) {
          await this.loadBoardById(Number(currentBoardId));
        } else {
          // Load default board for this project
          await this.loadDefaultBoard(projectId);
        }
      }
    });
    
    // Subscribe to query param changes (board selection within same project)
    this.route.queryParams.subscribe(async params => {
      const boardId = params['boardId'];
      const currentProjectId = this.projectContextService.currentProjectId();
      
      // Skip if we're initializing, no boardId, or already loaded this board
      if (this._isInitializing || !boardId || boardId === this._lastLoadedBoardId) {
        return;
      }
      
      // Only reload if boardId changed and we're in the same project
      if (boardId !== this.boardService.currentBoardId() && currentProjectId) {
        await this.loadBoardById(Number(boardId));
      }
    });
  }

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }
  
  onOpenActivityPanel(): void {
    this.isActivityPanelOpen.set(true);
  }
  
  onCloseActivityPanel(): void {
    this.isActivityPanelOpen.set(false);
  }

  async ngOnInit(): Promise<void> {
    this._isInitializing = true;
    
    // Initial load - Set project context from route params
    const projectId = this.route.parent?.snapshot.paramMap.get('projectId');
    
    if (!projectId) {
      this._isInitializing = false;
      return;
    }
    
    this.projectContextService.setCurrentProjectId(projectId);
    await this.boardService.accessProject(projectId);
    
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
    
    this._isInitializing = false;
  }
  
  /**
   * Load all project data: boards, issues, sprints
   */
  private async loadProjectData(projectId: string): Promise<void> {
    // Skip if already loaded this project
    if (projectId === this._lastLoadedProjectId) {
      return;
    }
    
    try {
      // Load boards and board data in parallel
      await Promise.all([
        this.boardService.loadBoardsByProject(projectId),
        this.store.loadBoardData(projectId)
      ]);
      
      this._lastLoadedProjectId = projectId;
    } catch (error) {
      console.error('[BoardPage] Error loading project data:', error);
    }
  }
  
  /**
   * Load specific board by ID
   */
  private async loadBoardById(boardId: number): Promise<void> {
    const boardIdStr = String(boardId);
    
    // Skip if already loaded this board
    if (boardIdStr === this._lastLoadedBoardId) {
      console.log('[BoardPage] Board already loaded:', boardId);
      return;
    }
    
    try {
      console.log('[BoardPage] Loading board:', boardId);
      const board = await this.boardService.loadBoardById(boardId);
      
      if (board) {
        this.boardService.setCurrentBoard(board.id);
        this._lastLoadedBoardId = board.id;
        console.log('[BoardPage] Board loaded:', board.name);
        
        // Only reload sprints if we haven't loaded them yet for this project
        const projectId = this.projectContextService.currentProjectId();
        if (projectId && this.store.sprints().length === 0) {
          console.log('[BoardPage] Reloading sprints after board change');
          await this.store.loadSprintsByProject(projectId);
        }
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
      this._lastLoadedBoardId = defaultBoard.id;
      
      // Update URL with boardId query param
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { boardId: defaultBoard.id },
        queryParamsHandling: 'merge'
      });
      
      // Only reload sprints if we haven't loaded them yet for this project
      if (this.store.sprints().length === 0) {
        console.log('[BoardPage] Reloading sprints after board change');
        await this.store.loadSprintsByProject(projectId);
      }
    } else {
      console.warn(`[BoardPage] No boards found for project ${projectId}`);
      console.log('[BoardPage] TIP: Create a board in the backend first, or check if the project ID is correct');
      
      // Don't create fallback board - let the user know they need to create one
      // Clear sprint selection (show all issues)
      this.store.selectSprint(null);
    }
  }

  // open issue detailed view from task card
  async onOpenIssue(issue: any) {
    const enriched = { ...issue } as any;

    // Resolve epic name if missing
    try {
      if (enriched.epicId && !enriched.epicName) {
        const epic = await firstValueFrom(this.epicApi.getEpicById(enriched.epicId));
        if (epic && epic.title) enriched.epicName = epic.title;
      }
    } catch (e) {
      // ignore
    }

    // Resolve sprint name from store if available
    try {
      if (enriched.sprintId && !enriched.sprintName) {
        const sprint = this.store.sprints().find(s => s.id === enriched.sprintId);
        if (sprint) enriched.sprintName = sprint.name;
      }
    } catch (e) {
      // ignore
    }

    // Resolve assignee name if it's a numeric id
    try {
      const a = enriched.assignee;
      if (a && /^\d+$/.test(String(a)) && !enriched.assigneeName) {
        const user = await firstValueFrom(this.userApi.getUserById(Number(a)));
        if (user && user.name) enriched.assigneeName = user.name;
      }
    } catch (e) {
      // ignore
    }

    this.selectedIssue.set(enriched);
    this.isModalOpen.set(true);
  }
  
  // open issue detailed view and scroll to comments
  async onOpenIssueComments(issue: any) {
    await this.onOpenIssue(issue);

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

  // public handler for updateIssue emitted by issue-detailed-view
  async onUpdateIssue(updates: Partial<Issue>): Promise<void> {
    const issue = this.selectedIssue();
    const projectId = this.projectContextService.currentProjectId();
    
    if (!issue || !projectId) {
      console.error('[BoardPage] Cannot update issue: missing issue or project ID');
      return;
    }
    
    try {
      console.log('[BoardPage] Updating issue:', issue.id, updates);
      await this.store.updateIssueApi(issue.id, projectId, updates);
      console.log('[BoardPage] Issue updated successfully');
      
      // Note: Edit modal closes itself after onSubmit callback
      // The issue-detailed-view modal stays open to show the updated data
    } catch (error) {
      console.error('[BoardPage] Failed to update issue:', error);
      alert('Failed to update issue. Please try again.');
    }
  }
}