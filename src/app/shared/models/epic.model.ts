export type EpicStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';

// Backend API response structure
export interface EpicApiResponse {
  id: string;
  projectId: string;
  title: string;
  description: string;
  startDate: string | null;
  dueDate: string | null;
  assigneeName: string;
  reporterName: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

// Backend API request structure for create/update
export interface CreateEpicRequest {
  projectId: string;
  title: string;
  description: string;
  startDate: string | null;
  dueDate: string | null;
  assigneeId: number | null;
  reporterId: number | null;
  labels: string[];
}

export interface UpdateEpicRequest {
  id: string;
  title: string;
  description: string;
  startDate: string | null;
  dueDate: string | null;
  assigneeId: number | null;
  reporterId: number | null;
  labels: string[];
}

// Frontend Epic model (unified for display)
export interface Epic {
  id: string;
  projectId?: string;
  name: string; // Maps to title in backend
  title?: string; // Backend field
  description: string;
  startDate: Date | null;
  dueDate: Date | null;
  progress: number; // 0-100 percentage (calculated from child work items)
  issueCount: number; // Number of child work items
  isExpanded?: boolean;
  assignee?: string; // assigneeName from backend
  assigneeId?: number;
  assigneeName?: string;
  labels?: string[];
  parent?: string;
  team?: string;
  sprint?: string;
  storyPoints?: number;
  reporter?: string; // reporterName from backend
  reporterId?: number;
  reporterName?: string;
  childWorkItems?: string[]; // Array of issue IDs
  status?: EpicStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
