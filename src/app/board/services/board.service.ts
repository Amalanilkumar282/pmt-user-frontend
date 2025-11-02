import { Injectable, signal, computed, inject } from '@angular/core';
import { Board, CreateBoardDto, UpdateBoardDto, RecentProject, BoardType } from '../models/board.model';
import { DEFAULT_COLUMNS } from '../utils';
import { BoardColumnDef } from '../models';
import { TeamsService } from '../../teams/services/teams.service';
import { BoardApiService } from './board-api.service';
import { TeamApiService } from './team-api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private teamsService = inject(TeamsService);
  private boardApiService = inject(BoardApiService);
  private teamApiService = inject(TeamApiService);
  
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
      
      // Enrich default/project boards with aggregated columns from all project boards
      const enrichedBoards = boards.map(board => {
        if (board.type === 'PROJECT' || (!board.teamId && board.type !== 'TEAM')) {
          // This is a default/project board - aggregate unique columns from all boards
          return this.enrichDefaultBoardColumns(board, boards);
        }
        return board;
      });
      
      this.boardsSignal.set(enrichedBoards);
      console.log('[BoardService] Loaded boards from API:', enrichedBoards);
    } catch (error) {
      console.error('[BoardService] Error loading boards:', error);
      // Fallback to empty boards on error
      this.boardsSignal.set([]);
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  /**
   * Enrich default board with unique columns from all project boards
   * This ensures the default board shows all possible statuses from the entire project
   * 
   * IMPORTANT: Uniqueness is determined by statusId (numeric), NOT by status name.
   * Multiple boards can have columns with the same status (e.g., "To Do", "TODO", "to do")
   * but as long as they map to the same statusId in the backend, they count as ONE column
   * in the default board. This prevents duplicate columns for the same status.
   */
  private enrichDefaultBoardColumns(defaultBoard: Board, allBoards: Board[]): Board {
    // Collect all unique columns by statusId from all boards in the project
    const columnsByStatusId = new Map<number, BoardColumnDef>();
    
    console.log('[BoardService.enrichDefaultBoardColumns] Processing default board:', defaultBoard.name);
    console.log('[BoardService.enrichDefaultBoardColumns] Project boards count:', allBoards.length);
    
    // First, iterate through all boards to find unique statusIds
    for (const board of allBoards) {
      if (board.projectId === defaultBoard.projectId) {
        console.log(`[BoardService.enrichDefaultBoardColumns] Board "${board.name}" has ${board.columns.length} columns:`, 
          board.columns.map(c => ({ title: c.title, statusId: c.statusId })));
        
        for (const column of board.columns) {
          if (column.statusId !== undefined) {
            if (!columnsByStatusId.has(column.statusId)) {
              columnsByStatusId.set(column.statusId, column);
              console.log(`[BoardService.enrichDefaultBoardColumns] Added unique column: ${column.title} (statusId: ${column.statusId})`);
            } else {
              console.log(`[BoardService.enrichDefaultBoardColumns] Skipped duplicate statusId ${column.statusId}: ${column.title} (already have ${columnsByStatusId.get(column.statusId)?.title})`);
            }
          }
        }
      }
    }
    
    // Convert to array and sort by position (or statusId as fallback)
    const uniqueColumns = Array.from(columnsByStatusId.values())
      .sort((a, b) => {
        // Sort by position if available, otherwise by statusId
        if (a.position !== undefined && b.position !== undefined) {
          return a.position - b.position;
        }
        return (a.statusId || 0) - (b.statusId || 0);
      })
      // Reassign positions sequentially
      .map((col, index) => ({ ...col, position: index }));
    
    console.log('[BoardService.enrichDefaultBoardColumns] Final unique columns:', {
      boardName: defaultBoard.name,
      originalColumns: defaultBoard.columns.length,
      enrichedColumns: uniqueColumns.length,
      columns: uniqueColumns.map(c => ({ title: c.title, statusId: c.statusId, position: c.position }))
    });
    
    return {
      ...defaultBoard,
      columns: uniqueColumns.length > 0 ? uniqueColumns : defaultBoard.columns
    };
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
  
  /**
   * Get default board for a user in a project
   * LOGIC:
   * 1. Check if user has teamId in current project
   * 2. If YES → return team's board (board with that teamId)
   * 3. If NO → return default board (type='default' or first project board)
   */
  async getDefaultBoard(projectId: string, userId: string): Promise<Board | null> {
    console.log('[BoardService] getDefaultBoard - ProjectId:', projectId, 'UserId:', userId);
    
    try {
      // Step 1: Check if user belongs to any team in this project
      const teams = await firstValueFrom(this.teamApiService.getTeamsByProject(projectId));
      console.log('[BoardService] Teams in project:', teams);
      
      // Find team where current user is a member or lead
      const userEmail = this.getUserEmail();
      const userTeam = teams.find(team => 
        team.members.some(member => member.email === userEmail) ||
        team.lead.email === userEmail
      );
      
      console.log('[BoardService] User team found:', userTeam);
      
      if (userTeam) {
        // User has a team - find board with this team's ID
        // Note: TeamApi doesn't have ID, need to match by team name
        const teamBoard = this.boardsSignal().find(
          b => b.teamName === userTeam.name && b.projectId === projectId
        );
        
        if (teamBoard) {
          console.log('[BoardService] Returning team board:', teamBoard.name);
          return teamBoard;
        }
        
        console.warn('[BoardService] User has team but no board found for team:', userTeam.name);
      }
      
      // Step 2: User has no team OR team has no board - prefer a project-level DEFAULT board
      // First preference: a board explicitly marked as default and of type PROJECT
      const defaultProjectBoard = this.boardsSignal().find(
        b => b.projectId === projectId &&
             (b.type === 'PROJECT' || b.type.toLowerCase() === 'project') &&
             b.isDefault === true
      );

      if (defaultProjectBoard) {
        console.log('[BoardService] Returning default project board:', defaultProjectBoard.name);
        return defaultProjectBoard;
      }

      // Second preference: any board explicitly of type PROJECT (regardless of isDefault)
      const anyProjectBoard = this.boardsSignal().find(
        b => b.projectId === projectId && (b.type === 'PROJECT' || b.type.toLowerCase() === 'project')
      );

      if (anyProjectBoard) {
        console.log('[BoardService] Returning project board (non-team):', anyProjectBoard.name);
        return anyProjectBoard;
      }

      // Third preference: any non-team board (could be CUSTOM but not tied to a team)
      const nonTeamBoard = this.boardsSignal().find(
        b => b.projectId === projectId && !b.teamId
      );

      if (nonTeamBoard) {
        console.log('[BoardService] Returning first non-team project board:', nonTeamBoard.name);
        return nonTeamBoard;
      }
      
      // Last resort: return any board for this project
      const anyBoard = this.getBoardsByProject(projectId)[0] || null;
      console.log('[BoardService] Returning any available board:', anyBoard?.name || 'null');
      return anyBoard;
      
    } catch (error) {
      console.error('[BoardService] Error getting user team:', error);
      
      // Fallback to project board on error
      const fallback = this.boardsSignal().find(
        b => b.projectId === projectId && b.type === 'PROJECT'
      ) || this.getBoardsByProject(projectId)[0] || null;
      
      console.log('[BoardService] Error fallback board:', fallback?.name || 'null');
      return fallback;
    }
  }
  
  /**
   * Helper: Get current user's email from session
   */
  private getUserEmail(): string {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('userEmail') || '';
    }
    return '';
  }
  
  // Create board
  async createBoardApi(dto: CreateBoardDto): Promise<Board | null> {
    // Validation
    if (!dto.name || dto.name.trim().length === 0) {
      console.error('[BoardService] Board name is required');
      return null;
    }
    
    if (!dto.projectId) {
      console.error('[BoardService] Project ID is required');
      return null;
    }
    
    try {
      this.loadingSignal.set(true);
      
      // Get current user ID for createdBy
      const userId = parseInt(sessionStorage.getItem('userId') || '0', 10);
      if (!userId) {
        console.error('[BoardService] No user ID found for board creation');
        return null;
      }
      
      // Map CreateBoardDto to backend API DTO
      const apiDto: any = {
        projectId: dto.projectId,
        name: dto.name.trim(),
        description: '',
        type: dto.type.toLowerCase(), // Backend expects lowercase
        teamId: dto.teamId ? parseInt(dto.teamId, 10) : null,
        createdBy: userId,
        metadata: null
      };
      
      const response = await firstValueFrom(this.boardApiService.createBoard(apiDto));
      
      if (response.status === 200 || response.status === 201) {
        console.log('[BoardService] Board created successfully:', response);
        // Reload boards from API
        await this.loadBoardsByProject(dto.projectId);
        // Find the newly created board
        const newBoard = this.boardsSignal().find(b => b.name === dto.name);
        return newBoard || null;
      } else {
        console.error('[BoardService] Failed to create board:', response);
        return null;
      }
    } catch (error) {
      console.error('[BoardService] Error creating board:', error);
      return null;
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  // Update board
  async updateBoardApi(boardId: string, dto: UpdateBoardDto): Promise<Board | null> {
    try {
      this.loadingSignal.set(true);
      
      const userId = parseInt(sessionStorage.getItem('userId') || '0', 10);
      const numericBoardId = parseInt(boardId, 10);
      
      const apiDto: any = {
        boardId: numericBoardId,
        name: dto.name,
        updatedBy: userId,
        removeTeamAssociation: false
      };
      
      const response = await firstValueFrom(this.boardApiService.updateBoard(numericBoardId, apiDto));
      
      if (response.status === 200) {
        console.log('[BoardService] Board updated successfully');
        // Reload board from API
        return await this.loadBoardById(numericBoardId);
      } else {
        console.error('[BoardService] Failed to update board:', response);
        return null;
      }
    } catch (error) {
      console.error('[BoardService] Error updating board:', error);
      return null;
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  // Delete board
  async deleteBoardApi(boardId: string): Promise<boolean> {
    try {
      this.loadingSignal.set(true);
      
      const userId = parseInt(sessionStorage.getItem('userId') || '0', 10);
      const numericBoardId = parseInt(boardId, 10);
      
      const response = await firstValueFrom(this.boardApiService.deleteBoard(numericBoardId, userId));
      
      if (response.status === 200 && response.data === true) {
        console.log('[BoardService] Board deleted successfully');
        // Remove from local cache
        this.boardsSignal.update(boards => boards.filter(b => b.id !== boardId));
        return true;
      } else {
        console.error('[BoardService] Failed to delete board:', response);
        return false;
      }
    } catch (error) {
      console.error('[BoardService] Error deleting board:', error);
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  // Column Management API Methods
  
  /**
   * Create a new column for a board
   */
  async createColumnApi(boardId: string, columnName: string, color: string, statusName: string, position: number): Promise<boolean> {
    try {
      this.loadingSignal.set(true);
      
      const numericBoardId = parseInt(boardId, 10);
      const dto: any = {
        boardId: numericBoardId,
        boardColumnName: columnName,
        boardColor: color,
        statusName: statusName,
        position: position
      };
      
      const response = await firstValueFrom(this.boardApiService.createBoardColumn(dto));
      
      if (response.status === 200 || response.status === 201) {
        console.log('[BoardService] Column created successfully');
        // Reload board to get updated columns
        await this.loadBoardById(numericBoardId);
        return true;
      } else {
        console.error('[BoardService] Failed to create column:', response);
        return false;
      }
    } catch (error) {
      console.error('[BoardService] Error creating column:', error);
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  /**
   * Update an existing column
   */
  async updateColumnApi(columnId: string, boardId: string, updates: { name?: string; color?: string; position?: number }): Promise<boolean> {
    try {
      this.loadingSignal.set(true);
      
      const userId = parseInt(sessionStorage.getItem('userId') || '0', 10);
      const numericBoardId = parseInt(boardId, 10);
      
      const dto: any = {
        columnId: columnId,
        boardId: numericBoardId,
        boardColumnName: updates.name,
        boardColor: updates.color,
        position: updates.position,
        updatedBy: userId
      };
      
      const response = await firstValueFrom(this.boardApiService.updateBoardColumn(columnId, dto));
      
      if (response.status === 200) {
        console.log('[BoardService] Column updated successfully');
        // Reload board to get updated columns
        await this.loadBoardById(numericBoardId);
        return true;
      } else {
        console.error('[BoardService] Failed to update column:', response);
        return false;
      }
    } catch (error) {
      console.error('[BoardService] Error updating column:', error);
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  /**
   * Delete a column from a board
   */
  async deleteColumnApi(columnId: string, boardId: string): Promise<boolean> {
    try {
      this.loadingSignal.set(true);
      
      const userId = parseInt(sessionStorage.getItem('userId') || '0', 10);
      const numericBoardId = parseInt(boardId, 10);
      
      const response = await firstValueFrom(this.boardApiService.deleteBoardColumn(columnId, numericBoardId, userId));
      
      if (response.status === 200) {
        console.log('[BoardService] Column deleted successfully');
        // Reload board to get updated columns
        await this.loadBoardById(numericBoardId);
        return true;
      } else {
        console.error('[BoardService] Failed to delete column:', response);
        return false;
      }
    } catch (error) {
      console.error('[BoardService] Error deleting column:', error);
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  // Create board (local - kept for backward compatibility)
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
