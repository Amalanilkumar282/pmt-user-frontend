import { ChangeDetectionStrategy, Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Navbar } from '../../../shared/navbar/navbar';
import { SidebarStateService } from '../../../shared/services/sidebar-state.service';
import { ProjectContextService } from '../../../shared/services/project-context.service';
import { BoardColumn } from '../board-column/board-column';
import { BoardStore } from '../../board-store';
import { BoardToolbar } from '../board-toolbar/board-toolbar';
import { BoardColumnsContainer } from '../board-columns-container/board-columns-container';
import { IssueDetailedView } from '../../../backlog/issue-detailed-view/issue-detailed-view';
import { BoardService } from '../../services/board.service';
import { signal } from '@angular/core';
// import { DUMMY_SPRINTS, BACKLOG } from './seed.full';
import { sprints, completedSprint1Issues, completedSprint2Issues, activeSprintIssues, backlogIssues } from '../../../shared/data/dummy-backlog-data';

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
      }
    });
    
    // Subscribe to route param changes (project changes)
    this.route.parent?.params.subscribe(params => {
      const projectId = params['projectId'];
      console.log('🚀 BoardPage - Project changed to:', projectId);
      if (projectId) {
        this.projectContextService.setCurrentProjectId(projectId);
        this.boardService.accessProject(projectId);
        console.log('🚀 BoardPage - Set project context and accessed project');
        
        // Load sprint data
        this.store.loadData(sprints);
        this.store.addBacklog(backlogIssues);
        
        // Check if we have a boardId in query params
        const currentBoardId = this.route.snapshot.queryParamMap.get('boardId');
        if (currentBoardId) {
          console.log('🚀 BoardPage - Loading board from query param:', currentBoardId);
          this.store.loadBoard(currentBoardId);
        } else {
          // Load default board for this project
          console.log('🚀 BoardPage - No boardId, loading default board');
          this.loadDefaultBoard(projectId);
        }
      }
    });
    
    // Subscribe to query param changes (board selection within same project)
    this.route.queryParams.subscribe(params => {
      const boardId = params['boardId'];
      const currentProjectId = this.projectContextService.currentProjectId();
      
      // Only reload if boardId changed and we're in the same project
      if (boardId && boardId !== this.boardService.currentBoardId() && currentProjectId) {
        this.store.loadBoard(boardId);
      }
    });
  }

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }

  ngOnInit(): void {
    // Initial load - Set project context from route params
    const projectId = this.route.parent?.snapshot.paramMap.get('projectId');
    if (!projectId) {
      console.error('No project ID found in route');
      return;
    }
    
    this.projectContextService.setCurrentProjectId(projectId);
    this.boardService.accessProject(projectId);
    
    // Load sprint data
    this.store.loadData(sprints);
    this.store.addBacklog(backlogIssues);
    
    // Check for boardId in query params
    const boardId = this.route.snapshot.queryParamMap.get('boardId');
    
    if (boardId) {
      // Load specific board from URL
      const success = this.store.loadBoard(boardId);
      
      if (!success) {
        // Board not found, fall back to default
        console.warn(`Board ${boardId} not found, loading default board`);
        this.loadDefaultBoard(projectId);
      }
    } else {
      // No boardId specified, load default board
      this.loadDefaultBoard(projectId);
    }
  }
  
  private loadDefaultBoard(projectId: string): void {
    // TODO: Get actual userId from auth service
    const userId = 'user-1';
    console.log('🎲 loadDefaultBoard - ProjectId:', projectId, 'UserId:', userId);
    
    const defaultBoard = this.boardService.getDefaultBoard(projectId, userId);
    console.log('🎲 loadDefaultBoard - Default board returned:', defaultBoard);
    
    if (defaultBoard) {
      console.log('🎲 loadDefaultBoard - Loading board:', defaultBoard.id, defaultBoard.name);
      this.store.loadBoard(defaultBoard.id);
      
      // Update URL with boardId query param
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { boardId: defaultBoard.id },
        queryParamsHandling: 'merge'
      });
    } else {
      console.warn(`No default board found for project ${projectId}`);
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
