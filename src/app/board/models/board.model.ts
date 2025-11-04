import { BoardColumnDef } from '../models';

export type BoardType = 'TEAM' | 'PROJECT';
export type BoardSource = 'TEAM' | 'CUSTOM';

export interface Board {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  type: BoardType;
  source: BoardSource;
  
  // If team-based board
  teamId?: string;
  teamName?: string;
  
  // Board configuration
  columns: BoardColumnDef[];
  includeBacklog: boolean;
  includeDone: boolean;
  
  // Additional fields from backend
  description?: string;
  isActive?: boolean;
  metadata?: string | null;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
  isDefault: boolean;
}

export interface CreateBoardDto {
  name: string;
  description?: string;
  projectId: string;
  type: string; // 'kanban', 'team', 'custom' - backend accepts lowercase strings
  source?: BoardSource;
  teamId?: number; // Backend expects number
  columns?: BoardColumnDef[];
  includeBacklog?: boolean;
  includeDone?: boolean;
}

export interface UpdateBoardDto {
  name?: string;
  columns?: BoardColumnDef[];
  includeBacklog?: boolean;
  includeDone?: boolean;
}

export interface RecentProject {
  id: string;
  name: string;
  boards: Board[];
  lastAccessed: string;
}
