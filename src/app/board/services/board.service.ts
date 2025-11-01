import { Injectable, signal, computed, inject } from '@angular/core';
import { Board, CreateBoardDto, UpdateBoardDto, RecentProject, BoardType } from '../models/board.model';
import { DEFAULT_COLUMNS } from '../utils';
import { TeamsService } from '../../teams/services/teams.service';
import { BoardApiService } from './board-api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private teamsService = inject(TeamsService);
  private boardApiService = inject(BoardApiService);
  
  // Signal-based state
  private boardsSignal = signal<Board[]>([]);
  private recentProjectsSignal = signal<RecentProject[]>(this.getInitialRecentProjects());
  private currentBoardIdSignal = signal<string | null>(null);
  private loadingSignal = signal<boolean>(false);
  
  // Public computed signals
  boards = this.boardsSignal.asReadonly();
  recentProjects = this.recentProjectsSignal.asReadonly();
  currentBoardId = this.currentBoardIdSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();
  
  currentBoard = computed(() => {
    const id = this.currentBoardIdSignal();
    return id ? this.boardsSignal().find(b => b.id === id) : null;
  });
  
  // Load boards from backend
  async loadBoardsByProject(projectId: string): Promise<void> {
    try {
      this.loadingSignal.set(true);
      const boards = await firstValueFrom(this.boardApiService.getBoardsByProject(projectId));
      this.boardsSignal.set(boards);
      console.log('[BoardService] Loaded boards from API:', boards);
    } catch (error) {
      console.error('[BoardService] Error loading boards:', error);
      // Fallback to empty boards on error
      this.boardsSignal.set([]);
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  // Load single board from backend
  async loadBoardById(boardId: number): Promise<Board | null> {
    try {
      this.loadingSignal.set(true);
      const board = await firstValueFrom(this.boardApiService.getBoardById(boardId));
      
      // Update the board in the signal if it exists
      const currentBoards = this.boardsSignal();
      const boardIndex = currentBoards.findIndex(b => b.id === board.id);
      
      if (boardIndex >= 0) {
        const updatedBoards = [...currentBoards];
        updatedBoards[boardIndex] = board;
        this.boardsSignal.set(updatedBoards);
      } else {
        this.boardsSignal.set([...currentBoards, board]);
      }
      
      console.log('[BoardService] Loaded board from API:', board);
      return board;
    } catch (error) {
      console.error('[BoardService] Error loading board:', error);
      return null;
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  // Get boards by project (from cache)
  getBoardsByProject(projectId: string): Board[] {
    return this.boardsSignal().filter(b => b.projectId === projectId);
  }
  
  // Get board by ID (from cache)
  getBoardById(boardId: string): Board | undefined {
    return this.boardsSignal().find(b => b.id === boardId);
  }
  
  // Get boards by team
  getBoardsByTeam(teamId: string): Board[] {
    return this.boardsSignal().filter(b => b.teamId === teamId);
  }
  
  // Get default board for a team (current sprint board)
  getDefaultTeamBoard(teamId: string): Board | null {
    const team = this.teamsService.getTeamById(teamId);
    if (!team) return null;
    
    // Get the current sprint (first active sprint)
    const currentSprintId = team.activeSprints[0];
    
    if (currentSprintId) {
      // Look for a board with this sprint name
      const sprintBoard = this.boardsSignal().find(
        b => b.teamId === teamId && 
             b.type === 'TEAM' && 
             b.name.toLowerCase().includes('sprint')
      );
      
      if (sprintBoard) return sprintBoard;
    }
    
    // Fallback: return default team board or first team board
    const defaultTeamBoard = this.boardsSignal().find(
      b => b.teamId === teamId && b.type === 'TEAM' && b.isDefault
    );
    
    if (defaultTeamBoard) return defaultTeamBoard;
    
    // Last fallback: return first team board
    return this.getBoardsByTeam(teamId)[0] || null;
  }
  
  // Get default board for a user in a project
  getDefaultBoard(projectId: string, userId: string): Board | null {
    console.log('[BoardService] getDefaultBoard - ProjectId:', projectId, 'UserId:', userId);
    
    // ALWAYS return the PROJECT "All Issues" board when clicking on a project
    // This matches Jira's behavior where project navigation goes to "All Issues"
    const projectBoard = this.boardsSignal().find(
      b => b.projectId === projectId && b.type === 'PROJECT' && b.isDefault
    );
    
    console.log('[BoardService] getDefaultBoard - Found project board:', projectBoard);
    
    if (projectBoard) return projectBoard;
    
    // Fallback: return first board for project
    const fallback = this.getBoardsByProject(projectId)[0] || null;
    console.log('[BoardService] getDefaultBoard - Fallback board:', fallback);
    return fallback;
  }
  
  // Create board
  createBoard(dto: CreateBoardDto): Board | null {
    // Validation
    if (!dto.name || dto.name.trim().length === 0) {
      console.error('Board name is required');
      return null;
    }
    
    if (!dto.projectId) {
      console.error('Project ID is required');
      return null;
    }
    
    // Validate teamId if provided
    if (dto.teamId) {
      const team = this.teamsService.getTeamById(dto.teamId);
      if (!team) {
        console.error(`Team with id ${dto.teamId} not found`);
        return null;
      }
      
      // Ensure team belongs to the project
      if (team.projectId !== dto.projectId) {
        console.error(`Team ${dto.teamId} does not belong to project ${dto.projectId}`);
        return null;
      }
    }
    
    // Validate columns
    if (dto.columns && dto.columns.length === 0) {
      console.error('At least one column is required');
      return null;
    }
    
    const newBoard: Board = {
      id: `board-${Date.now()}`,
      name: dto.name.trim(),
      projectId: dto.projectId,
      projectName: this.getProjectName(dto.projectId),
      type: dto.type,
      source: dto.source,
      teamId: dto.teamId,
      teamName: dto.teamId ? this.getTeamName(dto.teamId) : undefined,
      columns: dto.columns || [...DEFAULT_COLUMNS],
      includeBacklog: dto.includeBacklog ?? true,
      includeDone: dto.includeDone ?? true,
      createdBy: 'user-1', // TODO: Get from auth service
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
    };
    
    this.boardsSignal.update(boards => [...boards, newBoard]);
    this.addBoardToRecentProject(dto.projectId, newBoard);
    
    return newBoard;
  }
  
  // Update board
  updateBoard(id: string, dto: UpdateBoardDto): Board | null {
    const boardIndex = this.boardsSignal().findIndex(b => b.id === id);
    if (boardIndex === -1) return null;
    
    this.boardsSignal.update(boards => {
      const updated = [...boards];
      const board = { ...updated[boardIndex] };
      
      if (dto.name) board.name = dto.name;
      if (dto.columns) board.columns = dto.columns;
      if (dto.includeBacklog !== undefined) board.includeBacklog = dto.includeBacklog;
      if (dto.includeDone !== undefined) board.includeDone = dto.includeDone;
      board.updatedAt = new Date().toISOString();
      
      updated[boardIndex] = board;
      return updated;
    });
    
    return this.boardsSignal()[boardIndex];
  }
  
  // Delete board
  deleteBoard(id: string): boolean {
    const initialLength = this.boardsSignal().length;
    this.boardsSignal.update(boards => boards.filter(b => b.id !== id));
    
    // Remove from recent projects
    this.recentProjectsSignal.update(projects =>
      projects.map(p => ({
        ...p,
        boards: p.boards.filter(b => b.id !== id)
      }))
    );
    
    return this.boardsSignal().length < initialLength;
  }
  
  // Set current board
  setCurrentBoard(boardId: string | null): void {
    this.currentBoardIdSignal.set(boardId);
  }
  
  // Update recent projects when a project is accessed
  accessProject(projectId: string): void {
    const projectBoards = this.getBoardsByProject(projectId);
    const projectName = this.getProjectName(projectId);
    
    this.recentProjectsSignal.update(projects => {
      const existing = projects.find(p => p.id === projectId);
      const updated = projects.filter(p => p.id !== projectId);
      
      const projectData: RecentProject = {
        id: projectId,
        name: projectName,
        boards: projectBoards,
        lastAccessed: new Date().toISOString()
      };
      
      // Add to top of list
      return [projectData, ...updated].slice(0, 5); // Keep only 5 recent projects
    });
  }
  
  // Add board to recent project
  private addBoardToRecentProject(projectId: string, board: Board): void {
    this.recentProjectsSignal.update(projects =>
      projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            boards: [...p.boards, board]
          };
        }
        return p;
      })
    );
  }
  
  // Helper methods
  private getProjectName(projectId: string): string {
    const projectNames: Record<string, string> = {
      '1': 'Website Redesign',
      '2': 'Mobile App Development',
      '3': 'Marketing Campaign',
      '4': 'Backend Infrastructure',
      '5': 'Customer Portal',
    };
    return projectNames[projectId] || 'Unknown Project';
  }
  
  private getTeamName(teamId: string): string {
    const team = this.teamsService.getTeamById(teamId);
    return team?.name || 'Unknown Team';
  }
  
  // Initialize with dummy data
  private getInitialBoards(): Board[] {
    const teams = this.teamsService.teams();
    const boards: Board[] = [];
    
    // Create team-based boards for each team
    teams.forEach(team => {
      boards.push({
        id: `board-team-${team.id}`,
        name: `${team.name} Board`,
        projectId: team.projectId,
        projectName: team.projectName || this.getProjectName(team.projectId),
        type: 'TEAM',
        source: 'TEAM',
        teamId: team.id,
        teamName: team.name,
        columns: [...DEFAULT_COLUMNS],
        includeBacklog: true,
        includeDone: true,
        createdBy: team.lead.id,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        isDefault: true,
      });
    });
    
    // Create project-level boards
    const projectIds = ['1', '2', '3', '4', '5'];
    projectIds.forEach(projectId => {
      boards.push({
        id: `board-project-${projectId}`,
        name: `${this.getProjectName(projectId)} - All Issues`,
        projectId,
        projectName: this.getProjectName(projectId),
        type: 'PROJECT',
        source: 'CUSTOM',
        columns: [...DEFAULT_COLUMNS],
        includeBacklog: true,
        includeDone: true,
        createdBy: 'user-1',
        createdAt: '2024-10-01T10:00:00Z',
        updatedAt: '2024-10-01T10:00:00Z',
        isDefault: true,
      });
    });
    
    // Add custom boards
    boards.push({
      id: 'board-custom-1',
      name: 'Sprint Planning Board',
      projectId: '1',
      projectName: 'Website Redesign',
      type: 'PROJECT',
      source: 'CUSTOM',
      columns: [
        { id: 'TODO', title: 'To Do', color: '#3D62A8', position: 1 },
        { id: 'IN_PROGRESS', title: 'In Progress', color: '#10B981', position: 2 },
        { id: 'IN_REVIEW', title: 'In Review', color: '#F59E0B', position: 3 },
        { id: 'DONE', title: 'Done', color: '#EF4444', position: 4 },
      ],
      includeBacklog: false,
      includeDone: true,
      createdBy: 'user-1',
      createdAt: '2024-10-10T10:00:00Z',
      updatedAt: '2024-10-10T10:00:00Z',
      isDefault: false,
    });
    
    return boards;
  }
  
  private getInitialRecentProjects(): RecentProject[] {
    // CRITICAL: Get all boards ONCE to avoid duplication
    const allBoards = this.boardsSignal();
    const projects: RecentProject[] = [];
    
    // Filter boards for project 1
    const project1Boards = allBoards.filter(b => b.projectId === '1');
    projects.push({
      id: '1',
      name: 'Website Redesign',
      boards: project1Boards,
      lastAccessed: new Date().toISOString()
    });
    
    // Filter boards for project 4
    const project4Boards = allBoards.filter(b => b.projectId === '4');
    projects.push({
      id: '4',
      name: 'Backend Infrastructure',
      boards: project4Boards,
      lastAccessed: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    });
    
    return projects;
  }
}
