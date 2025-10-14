import { BoardColumnDef, Status } from './models';

export const DEFAULT_COLUMNS: BoardColumnDef[] = [
  { id: 'TODO',        title: 'To Do',        color: '#A1C4FD' },  
  { id: 'IN_PROGRESS', title: 'In Progress',  color: '#FFA500' },  
  { id: 'BLOCKED',     title: 'Blocked',      color: '#EF4444' },  
  { id: 'IN_REVIEW',   title: 'In Review',    color: '#A78BFA' },  
  { id: 'DONE',        title: 'Done',         color: '#10B981' },  
];

export const statusOrder: Record<Status, number> = {
  TODO: 0, IN_PROGRESS: 1, BLOCKED: 2, IN_REVIEW: 3, DONE: 4
};

export const priorityOrder: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3
};

export function fuzzyIncludes(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.trim().toLowerCase());
}
