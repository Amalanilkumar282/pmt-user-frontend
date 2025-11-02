export type IssueType = 'STORY' | 'TASK' | 'BUG' | 'EPIC' | 'SUBTASK';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';

export interface Issue {
  id: string;
  issueKey?: string; 
  title: string;
  description: string;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  statusId?: number;  // Backend status ID for column matching
  assignee?: string;
  assignedTo?: string;
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
  epicId?: string;
  attachments?: File[];
  // Additional fields for extended issue information
  assigneeId?: number;
  reporterId?: number;
  reporterName?: string;
  projectId?: string;
}
