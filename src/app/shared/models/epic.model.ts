export interface Epic {
  id: string;
  name: string;
  description: string;
  startDate: Date | null;
  dueDate: Date | null;
  progress: number; // 0-100 percentage
  issueCount: number;
  isExpanded?: boolean;
  assignee?: string;
  labels?: string[];
  parent?: string;
  team?: string;
  sprint?: string;
  storyPoints?: number;
  reporter?: string;
  childWorkItems?: string[]; // Array of issue IDs
}
