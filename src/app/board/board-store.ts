import { Injectable, computed, signal } from '@angular/core';
import type { Issue } from '../shared/models/issue.model';
import type { IssueStatus } from '../shared/models/issue.model';
import type { FilterState, GroupBy, Sprint, BoardColumnDef } from './models';
import { DEFAULT_COLUMNS, fuzzyIncludes, statusOrder } from './utils';

@Injectable({ providedIn: 'root' })
export class BoardStore {
  // raw data (inject your dummy data at module bootstrap or here)
  private _issues = signal<Issue[]>([]);
  private _sprints = signal<Sprint[]>([]);

  // UI state
  selectedSprintId = signal<string | 'BACKLOG'>('BACKLOG');
  search = signal<string>('');
  filters = signal<FilterState>({ assignees: [], workTypes: [], labels: [], statuses: [], priorities: [] });
  groupBy = signal<GroupBy>('NONE');
  columns = signal<BoardColumnDef[]>([...DEFAULT_COLUMNS]);

  // derived
  sprints = computed(() => this._sprints());

  issues = computed(() => this._issues());

  // visible issues after sprint selection + filters + search
  visibleIssues = computed(() => {
    const sprintId = this.selectedSprintId();
    const f = this.filters();
    const q = this.search().trim();

    let list = this.issues();

    // sprint filter
    list = sprintId === 'BACKLOG'
      ? list.filter(i => !i.sprintId)
      : list.filter(i => i.sprintId === sprintId);

    // filters
    if (f.assignees.length) list = list.filter(i => i.assignee && f.assignees.includes(i.assignee));
    if (f.workTypes.length) list = list.filter(i => f.workTypes.includes(i.type));
    if (f.labels.length)    list = list.filter(i => (i.labels ?? []).some(l => f.labels.includes(l)));
    if (f.statuses.length)  list = list.filter(i => f.statuses.includes(i.status));
    if (f.priorities.length) list = list.filter(i => f.priorities.includes(i.priority));

    // search (title + description + id)
    if (q) {
      list = list.filter(i =>
        fuzzyIncludes(i.title, q) ||
        fuzzyIncludes(i.description, q) ||
        fuzzyIncludes(i.id, q)
      );
    }

    // stable ordering
    return list.sort((a,b) => statusOrder[a.status]-statusOrder[b.status] || a.updatedAt.getTime()-b.updatedAt.getTime());
  });

  // columns with their issues
  columnBuckets = computed(() => {
    const cols = this.columns();
    const issues = this.visibleIssues();
    return cols.map(c => ({
      def: c,
      items: issues.filter(i => i.status === c.id)
    }));
  });

  // actions
  loadData(allSprints: Sprint[]) {
    this._sprints.set(allSprints);
    // flatten issues for store; keep sprintId on each issue (already present)
  const flattened = allSprints.flatMap(s => (s.issues ?? []).map(i => ({...i, sprintId: i.sprintId ?? s.id })));
    this._issues.set([...flattened]); // backlog can be injected separately by caller
  }

  addBacklog(backlog: Issue[]) {
    this._issues.update(list => [...list, ...backlog.map(i => ({...i, sprintId: i.sprintId}))]);
  }

  selectSprint(id: string | 'BACKLOG') { this.selectedSprintId.set(id); }
  setSearch(q: string) { this.search.set(q); }
  applyFilters(f: Partial<FilterState>) { this.filters.update(curr => ({...curr, ...f})); }
  clearFilters() { this.filters.set({ assignees: [], workTypes: [], labels: [], statuses: [], priorities: [] }); }
  setGroupBy(g: GroupBy) { this.groupBy.set(g); }

  updateIssueStatus(issueId: string, status: IssueStatus) {
    this._issues.update(list => list.map(i => i.id === issueId ? ({...i, status, updatedAt: new Date()}) : i));
  }

  addColumn(def: BoardColumnDef) {
    this.columns.update(cols => [...cols, def]);
  }
}
