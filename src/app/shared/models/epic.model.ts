export interface Epic {
  id: string;
  name: string;
  startDate: Date | null;
  dueDate: Date | null;
  progress: number; // 0-100 percentage
  issueCount: number;
  isExpanded?: boolean;
}
