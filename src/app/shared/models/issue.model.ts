export type IssueType = 'STORY' | 'TASK' | 'BUG' | 'EPIC';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export interface Issue {
  id: string;
  title: string;
  description?: string;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  assignee?: string;
  storyPoints?: number;
  sprintId?: string;
  createdAt: Date;
  updatedAt: Date;
}
