import { BoardColumnDef, Status } from './models';

export const DEFAULT_COLUMNS: BoardColumnDef[] = [
  { id: 'TODO',        title: 'To Do',        color: 'border-sky-400' },
  { id: 'IN_PROGRESS', title: 'In Progress',  color: 'border-violet-400' },
  { id: 'BLOCKED',     title: 'Blocked',      color: 'border-red-400' },
  { id: 'IN_REVIEW',   title: 'In Review',    color: 'border-amber-400' },
  { id: 'DONE',        title: 'Done',         color: 'border-emerald-400' },
];

export const statusOrder: Record<Status, number> = {
  TODO: 0, IN_PROGRESS: 1, BLOCKED: 2, IN_REVIEW: 3, DONE: 4
};

export function fuzzyIncludes(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.trim().toLowerCase());
}
