export type IssueType = 'STORY' | 'TASK' | 'BUG' | 'EPIC' | 'SUBTASK';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED' | string; // Allow dynamic statuses

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
  statusName?: string; // Backend status name
  assignee?: string;
  assigneeId?: number | null; // Backend assignee ID
  assigneeName?: string; // Backend assignee name
  reporterId?: number | null; // Reporter ID
  storyPoints?: number;
  sprintId?: string | null;
  sprintName?: string | null; // Sprint name from backend
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
  assigneeName: string | null; // Assignee name from backend
  startDate: string | null;
  dueDate: string | null;
  statusId: number;
  statusName: string; // Status name from backend
  sprintId: string | null;
  sprintName: string | null; // Sprint name from backend
  parentIssueId: string | null;
  storyPoints: number;
  epicId: string | null;
  epicName: string | null; // Epic name from backend
  reporterId: number | null;
  labels: string;
  attachmentUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface GetIssuesResponse {
  status: number;
  data: IssueApiResponse[];
  message: string;
}
