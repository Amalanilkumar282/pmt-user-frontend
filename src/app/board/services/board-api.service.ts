import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, BoardApi, BoardColumnApi } from '../models/api-interfaces';
import { Board } from '../models/board.model';
import { BoardColumnDef } from '../models';

export interface CreateBoardDto {
  projectId: string;
  name: string;
  description?: string;
  type: string; // 'team', 'custom', 'kanban'
  teamId?: number | null;
  createdBy: number;
  metadata?: string;
}

export interface UpdateBoardDto {
  boardId: number;
  name?: string;
  description?: string;
  type?: string;
  teamId?: number | null;
  isActive?: boolean;
  metadata?: string;
  updatedBy: number;
  removeTeamAssociation?: boolean;
}

export interface CreateBoardColumnDto {
  boardId: number;
  boardColumnName: string;
  boardColor: string;
  statusName: string;
  position: number;
}

export interface UpdateBoardColumnDto {
  columnId: string;
  boardId: number;
  boardColumnName?: string;
  boardColor?: string;
  position?: number;
  statusName?: string;
  updatedBy: number;
}

@Injectable({ providedIn: 'root' })
export class BoardApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/Board`;

  private getAuthHeaders(): HttpHeaders {
    // Check if running in browser (not SSR)
    if (typeof sessionStorage !== 'undefined') {
      const token = sessionStorage.getItem('accessToken') || '';
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'accept': 'text/plain',
        'Content-Type': 'application/json'
      });
    }
    // SSR fallback - no auth token
    return new HttpHeaders({
      'accept': 'text/plain',
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get all boards by project ID
   * GET /api/Board/project/{projectId}
   */
  getBoardsByProject(projectId: string): Observable<Board[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ApiResponse<BoardApi[]>>(`${this.baseUrl}/project/${projectId}`, { headers })
      .pipe(map(response => response.data.map(board => this.mapBoardApiToBoard(board))));
  }

  /**
   * Get single board by ID
   * GET /api/Board/{boardId}?includeInactive=false
   */
  getBoardById(boardId: number, includeInactive: boolean = false): Observable<Board> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ApiResponse<BoardApi>>(`${this.baseUrl}/${boardId}?includeInactive=${includeInactive}`, { headers })
      .pipe(map(response => this.mapBoardApiToBoard(response.data)));
  }

  /**
   * Get board columns by board ID
   * GET /api/Board/{boardId}/columns
   */
  getBoardColumns(boardId: number): Observable<BoardColumnDef[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ApiResponse<BoardColumnApi[]>>(`${this.baseUrl}/${boardId}/columns`, { headers })
      .pipe(map(response => response.data.map(col => this.mapColumnApiToColumnDef(col))));
  }

  /**
   * Create new board
   * POST /api/Board
   */
  createBoard(dto: CreateBoardDto): Observable<ApiResponse<any>> {
    const headers = this.getAuthHeaders();
    return this.http.post<ApiResponse<any>>(this.baseUrl, dto, { headers });
  }

  /**
   * Update existing board
   * PUT /api/Board/{boardId}
   */
  updateBoard(boardId: number, dto: UpdateBoardDto): Observable<ApiResponse<any>> {
    const headers = this.getAuthHeaders();
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/${boardId}`, dto, { headers });
  }

  /**
   * Delete board (soft delete)
   * DELETE /api/Board/{boardId}?deletedBy={userId}
   */
  deleteBoard(boardId: number, deletedBy: number): Observable<ApiResponse<boolean>> {
    const headers = this.getAuthHeaders();
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/${boardId}?deletedBy=${deletedBy}`, { headers });
  }

  /**
   * Create new board column
   * POST /api/board/column
   */
  createBoardColumn(dto: CreateBoardColumnDto): Observable<ApiResponse<any>> {
    const headers = this.getAuthHeaders();
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/column`, dto, { headers });
  }

  /**
   * Update board column
   * PUT /api/Board/column/{columnId}
   */
  updateBoardColumn(columnId: string, dto: UpdateBoardColumnDto): Observable<ApiResponse<any>> {
    const headers = this.getAuthHeaders();
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/column/${columnId}`, dto, { headers });
  }

  /**
   * Delete board column
   * DELETE /api/Board/column/{columnId}?boardId={boardId}&deletedBy={userId}
   */
  deleteBoardColumn(columnId: string, boardId: number, deletedBy: number): Observable<ApiResponse<any>> {
    const headers = this.getAuthHeaders();
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/column/${columnId}?boardId=${boardId}&deletedBy=${deletedBy}`, 
      { headers }
    );
  }

  /**
   * Map BoardApi to frontend Board model
   */
  private mapBoardApiToBoard(apiBoard: BoardApi): Board {
    // Map columns and sort by position
    const sortedColumns = apiBoard.columns
      .map(col => this.mapColumnApiToColumnDef(col))
      .sort((a, b) => a.position - b.position);
      
    return {
      id: apiBoard.id.toString(),
      name: apiBoard.name,
      description: apiBoard.description || undefined,
      projectId: apiBoard.projectId,
      projectName: apiBoard.projectName,
      teamId: apiBoard.teamId?.toString(),
      teamName: apiBoard.teamName || undefined,
      type: apiBoard.teamId ? 'TEAM' : 'PROJECT',
      source: 'CUSTOM',
      columns: sortedColumns,  // Use sorted columns
      includeBacklog: false,
      includeDone: true,
      isActive: apiBoard.isActive,
      metadata: apiBoard.metadata,
      createdBy: apiBoard.createdBy.toString(),
      createdAt: apiBoard.createdAt,
      updatedAt: apiBoard.updatedAt,
      isDefault: false
    };
  }

  /**
   * Map BoardColumnApi to frontend BoardColumnDef model
   */
  private mapColumnApiToColumnDef(apiColumn: BoardColumnApi): BoardColumnDef {
    // CRITICAL FIX: Column matching should be by statusId, not by name
    // - Column id can be anything (we use statusName for compatibility with existing code)
    // - Column statusId is what matters for matching issues
    // - Issues have statusId, columns have statusId, match by number not string
    console.log('[BoardApiService] Mapping column:', {
      columnId: apiColumn.id,
      boardColumnName: apiColumn.boardColumnName,
      statusName: apiColumn.statusName,
      statusId: apiColumn.statusId,
      color: apiColumn.boardColor,
      position: apiColumn.position
    });
    
    return {
      id: apiColumn.statusName as any,  // Keep as statusName for backward compatibility
      title: apiColumn.boardColumnName,  // Display the custom column name
      color: apiColumn.boardColor,
      position: apiColumn.position,
      status: apiColumn.statusName,
      statusId: apiColumn.statusId  // CRITICAL: This is used for issue matching
    };
  }
}

