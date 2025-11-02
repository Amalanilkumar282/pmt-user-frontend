export type IssueType = 'STORY' | 'TASK' | 'BUG' | 'EPIC' | 'SUBTASK';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';

export interface Issue {
  id: string;
  issueKey?: string; // Issue key like "PMT-101"
  title: string;
  description: string;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  assignee?: string;
  storyPoints?: number;
  sprintId?: string;
  teamId?: string; // Team that owns this issue
  labels?: string[];
  createdAt: Date;
  updatedAt: Date;
  startDate?: Date;
  dueDate?: Date;
  endDate?: Date; // Estimated completion date
  parentId?: string;
  epicId?: string;
  attachments?: File[];
  // Additional fields for extended issue information
  assigneeId?: number;
  reporterId?: number;
  reporterName?: string;
  projectId?: string;
}
