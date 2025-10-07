import { BoardStore } from './board-store';
import { DEFAULT_COLUMNS, statusOrder, fuzzyIncludes } from './utils';
import type { Issue } from '../shared/models/issue.model';
import type { Sprint } from './models';

function mkIssue(partial: Partial<Issue> = {}): Issue {
  return {
    id: partial.id ?? 'ISS-1',
    title: partial.title ?? 'Fix login',
    description: partial.description ?? 'desc',
    type: partial.type ?? 'TASK' as any,
    status: partial.status ?? 'TODO' as any,
    priority: partial.priority ?? 'MEDIUM' as any,
    assignee: partial.assignee ?? 'Joy',
    labels: partial.labels ?? ['ui'],
    sprintId: partial.sprintId,
    createdAt: partial.createdAt ?? new Date(2024, 0, 1),
    updatedAt: partial.updatedAt ?? new Date(2024, 0, 1),
    ...partial
  };
}

function mkSprint(id: string, issues: Issue[], status: Sprint['status'] = 'ACTIVE'): Sprint {
  return {
    id, name: `Sprint ${id}`, startDate: new Date(2024,0,1), endDate: new Date(2024,0,15),
    status, issues
  };
}

describe('BoardStore', () => {
  let store: BoardStore;

  beforeEach(() => {
    store = new BoardStore();
  });

  it('initializes with defaults', () => {
    expect(store.selectedSprintId()).toBe('BACKLOG');
    expect(store.search()).toBe('');
    expect(store.filters()).toEqual({ assignees: [], workTypes: [], labels: [], statuses: [], priorities: [] });
    expect(store.groupBy()).toBe('NONE');
    expect(store.columns()).toEqual(DEFAULT_COLUMNS);
  });

  it('loadData flattens sprint issues and preserves sprintId', () => {
    const s1 = mkSprint('s1', [mkIssue({id:'A', sprintId:'s1'}), mkIssue({id:'B', sprintId:'s1'})]);
    const s2 = mkSprint('s2', [mkIssue({id:'C'}), mkIssue({id:'D'})]); // will set sprintId to s2
    store.loadData([s1, s2]);

    const all = store.issues();
    expect(all.map(i => i.id).sort()).toEqual(['A','B','C','D']);
    expect(all.find(i => i.id==='C')!.sprintId).toBe('s2');
  });

  it('addBacklog appends issues without altering sprintId', () => {
    store.addBacklog([mkIssue({id:'BL-1', sprintId: undefined}), mkIssue({id:'BL-2', sprintId: undefined})]);
    const ids = store.issues().map(i => i.id);
    expect(ids).toEqual(['BL-1','BL-2']);
    expect(store.issues()[0].sprintId).toBeUndefined();
  });

  it('visibleIssues filters by sprint selection', () => {
    const active = mkSprint('active-1', [
      mkIssue({id:'A', sprintId:'active-1'}),
      mkIssue({id:'B', sprintId:'active-1'})
    ]);
    store.loadData([active]);
    store.addBacklog([mkIssue({id:'BL'})]);

    store.selectSprint('active-1');
    expect(store.visibleIssues().map(i=>i.id)).toEqual(['A','B']);

    store.selectSprint('BACKLOG');
    expect(store.visibleIssues().map(i=>i.id)).toEqual(['BL']);
  });

  it('visibleIssues applies all filters & search and is stably ordered', () => {
    const s = mkSprint('s1', [
      mkIssue({id:'1', title:'Alpha', description:'x', assignee:'A', type:'TASK' as any, labels:['l1'], status:'IN_PROGRESS' as any, priority:'HIGH' as any, updatedAt:new Date(2024,0,2)}),
      mkIssue({id:'2', title:'Bravo', description:'y', assignee:'B', type:'BUG' as any, labels:['l2'], status:'TODO' as any, priority:'LOW' as any, updatedAt:new Date(2024,0,1)}),
      mkIssue({id:'3', title:'charlie', description:'searchME', assignee:'A', type:'BUG' as any, labels:['l1','l3'], status:'IN_REVIEW' as any, priority:'MEDIUM' as any, updatedAt:new Date(2024,0,3)})
    ]);
    store.loadData([s]);
    store.selectSprint('s1');

    store.applyFilters({ assignees:['A'], workTypes:['BUG' as any], labels:['l1'], statuses:['IN_REVIEW' as any], priorities:['MEDIUM' as any] });
    store.setSearch('searchme');

    const vis = store.visibleIssues();
    expect(vis.map(i=>i.id)).toEqual(['3']);

    // ordering by statusOrder then updatedAt
    store.clearFilters();
    store.setSearch('');
    const ordered = store.visibleIssues().map(i=>i.id);
    // 2(TODO) -> 1(IN_PROGRESS) -> 3(IN_REVIEW)
    expect(ordered).toEqual(['2','1','3']);
    expect(statusOrder['TODO']).toBeLessThan(statusOrder['IN_PROGRESS']);
  });

  it('columnBuckets groups issues by status against current columns', () => {
    const s = mkSprint('s1', [
      mkIssue({id:'a', status:'TODO' as any}),
      mkIssue({id:'b', status:'DONE' as any}),
    ]);
    store.loadData([s]);
    store.selectSprint('s1');
    const buckets = store.columnBuckets();
    const todo = buckets.find(b => b.def.id === 'TODO')!;
    const done = buckets.find(b => b.def.id === 'DONE')!;
    expect(todo.items.map(i=>i.id)).toEqual(['a']);
    expect(done.items.map(i=>i.id)).toEqual(['b']);
  });

  it('updateIssueStatus mutates status and updates updatedAt', () => {
    const issue = mkIssue({id:'x', status:'TODO' as any, updatedAt:new Date(2020,0,1)});
    store.addBacklog([issue]);

    const before = store.issues().find(i=>i.id==='x')!;
    store.updateIssueStatus('x', 'DONE' as any);
    const after = store.issues().find(i=>i.id==='x')!;
    expect(after.status).toBe('DONE' as any);
    expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
  });

  it('addColumn appends to columns', () => {
    store.addColumn({ id: 'QA' as any, title:'QA', color:'border-slate-300' });
    expect(store.columns().map(c=>c.id)).toContain('QA' as any);
  });

  it('setters update signals', () => {
    store.selectSprint('s1' as any);
    expect(store.selectedSprintId()).toBe('s1' as any);

    store.setSearch('abc');
    expect(store.search()).toBe('abc');

    store.applyFilters({ statuses: ['DONE' as any] });
    expect(store.filters().statuses).toEqual(['DONE' as any]);

    store.clearFilters();
    expect(store.filters()).toEqual({ assignees: [], workTypes: [], labels: [], statuses: [], priorities: [] });

    store.setGroupBy('ASSIGNEE');
    expect(store.groupBy()).toBe('ASSIGNEE');
  });
});

