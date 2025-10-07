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
  issues?: Issue[];
}

export interface BoardColumnDef {
  id: Status;
  title: string;
  color: string;
}

export type GroupBy = 'NONE' | 'ASSIGNEE' | 'EPIC' | 'SUBTASK';

export interface FilterState {
  assignees: string[];
  workTypes: IssueType[];
  labels: string[];
  statuses: Status[];
  priorities: Priority[];
}
