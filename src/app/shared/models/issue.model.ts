export type IssueType = 'STORY' | 'TASK' | 'BUG' | 'EPIC' | 'SUBTASK';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';

export interface Issue {
  id: string;
  key?: string; // Issue key like PMT-011, PMT-012
  title: string;
  description: string;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
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
}
