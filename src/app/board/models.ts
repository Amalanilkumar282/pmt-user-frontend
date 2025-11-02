import type { Issue, IssueType } from '../shared/models/issue.model';
import type { IssuePriority as Priority } from '../shared/models/issue.model';
import type { IssueStatus as Status } from '../shared/models/issue.model';

export type { Issue, IssueType, Priority, Status };

export interface Sprint {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  teamId?: number; // optional team association (from API)
  issues?: Issue[];
}

export interface BoardColumnDef {
  id: Status;
  title: string;
  color: string;
  position: number;  // Position order (1 for first column, 2 for second, etc.)
  status?: string;   // Optional status mapping for the column
  statusId?: number; // Backend status ID
}

export type GroupBy = 'NONE' | 'ASSIGNEE' | 'EPIC' | 'SUBTASK';

export interface FilterState {
  assignees: string[];
  workTypes: IssueType[];
  labels: string[];
  statuses: Status[];
  priorities: Priority[];
}
