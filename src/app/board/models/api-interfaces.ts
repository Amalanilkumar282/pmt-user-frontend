// API Response Wrapper Interface
export interface ApiResponse<T> {
  status: number;
  data: T;
  message: string;
}

// Board API Interfaces
export interface BoardColumnApi {
  id: string;
  statusId: number;
  statusName: string;
  boardColumnName: string;
  boardColor: string;
  position: number;
}

export interface BoardApi {
  id: number;
  projectId: string;
  projectName: string;
  teamId: number | null;
  teamName: string | null;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  createdBy: number;
  createdByName: string;
  updatedBy: number | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: string | null;
  columns: BoardColumnApi[];
}

// Issue API Interfaces
export interface IssueApi {
  id: string;                   
  key: string;                   
  projectId: string;
  issueType: string;
  title: string;
  description: string;
  priority: string;
  assigneeId: number;
  startDate: string;
  dueDate: string;
  statusId: number;              // NOW PROVIDED
  sprintId: string;
  parentIssueId: string | null;
  storyPoints: number;
  epicId: string;
  reporterId: number;
  labels: string;                // JSON string array
  attachmentUrl: string | null;
}

// Sprint API Interfaces
export interface SprintApi {
  id: string;
  projectId: string;
  name: string;
  sprintGoal: string;
  startDate: string;
  dueDate: string;
  status: string;
  storyPoint: number;
  teamId: number;
  createdAt: string;
  updatedAt: string;
}

// Epic API Interfaces
export interface EpicApi {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  assigneeName: string;
  reporterName: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

// Label API Interfaces
export interface LabelApi {
  id: number;
  name: string;
  colour: string;
}

// Team API Interfaces
export interface TeamMemberApi {
  name: string;
  email: string;
  role: string;
}

export interface TeamApi {
  teamName: string;
  projectName: string;
  description: string;
  isActive: boolean;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
  lead: TeamMemberApi;
  members: TeamMemberApi[];
  memberCount: number;
  activeSprints: number;
  completedSprints: number;
}

// Status API Interfaces
export interface StatusApi {
  id: number;
  name: string;
  color: string;
}
