export type IssueType = 'STORY' | 'TASK' | 'BUG' | 'EPIC' | 'SUBTASK';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';

export interface Issue {
  id: string;
  key?: string; // Issue key from backend (e.g., "PROJ001-1")
  projectId?: string; // Project ID
  title: string;
  description: string;
  type: IssueType;
  issueType?: string; // Backend field name
  priority: IssuePriority;
  status: IssueStatus;
  statusId?: number; // Backend status ID
  assignee?: string;
  assigneeId?: number | null; // Backend assignee ID
  reporterId?: number | null; // Reporter ID
  storyPoints?: number;
  sprintId?: string;
  teamId?: string; // Team that owns this issue
  labels?: string[];
  createdAt: Date;
  updatedAt: Date;
  startDate?: Date;
  dueDate?: Date;
  endDate?: Date; // Estimated completion date
  completedAt?: Date; // When the issue was marked as DONE
  parentId?: string;
  parentIssueId?: string | null; // Backend field name
  epicId?: string | null;
  epicName?: string | null; // Epic name from backend
  attachments?: File[];
  attachmentUrl?: string | null; // Backend attachment URL
}

// Backend API response interface
export interface IssueApiResponse {
  id: string;
  key: string;
  projectId: string;
  issueType: string;
  title: string;
  description: string;
  priority: string;
  assigneeId: number | null;
  startDate: string | null;
  dueDate: string | null;
  statusId: number;
  sprintId: string | null;
  parentIssueId: string | null;
  storyPoints: number;
  epicId: string | null;
  epicName: string | null; // Epic name from backend
  reporterId: number | null;
  labels: string;
  attachmentUrl: string | null;
}

export interface GetIssuesResponse {
  status: number;
  data: IssueApiResponse[];
  message: string;
}
