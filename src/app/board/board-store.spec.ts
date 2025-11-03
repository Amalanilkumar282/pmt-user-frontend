import { BoardStore } from './board-store';
import { TestBed } from '@angular/core/testing';
import { Injector, runInInjectionContext } from '@angular/core';
import { BoardService } from './services/board.service';
import { IssueApiService } from './services/issue-api.service';
import { SprintApiService } from './services/sprint-api.service';
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
  let mockBoardService: Partial<BoardService>;
  let mockIssueApiService: Partial<IssueApiService>;
  let mockSprintApiService: Partial<SprintApiService>;

  beforeEach(() => {
    // Provide minimal mocks so BoardStore can be instantiated via DI
    mockBoardService = ({
      currentBoard: () => null as any,
      getBoardById: () => null as any,
      setCurrentBoard: () => {}
    } as unknown) as Partial<BoardService>;

    mockIssueApiService = {
      getIssuesByProject: () => ({ toPromise: () => Promise.resolve([]) } as any)
    } as Partial<IssueApiService>;

    mockSprintApiService = {
      getSprintsByProject: () => ({ toPromise: () => Promise.resolve([]) } as any)
    } as Partial<SprintApiService>;

    TestBed.configureTestingModule({
      providers: [
        { provide: BoardService, useValue: mockBoardService },
        { provide: IssueApiService, useValue: mockIssueApiService },
        { provide: SprintApiService, useValue: mockSprintApiService }
      ]
    });

    // Create BoardStore inside an injection context so its `inject()` calls work
    const injector = TestBed.inject(Injector);
    store = runInInjectionContext(injector, () => new BoardStore());
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
    expect(todo.items.map((i: Issue) => i.id)).toEqual(['a']);
    expect(done.items.map((i: Issue) => i.id)).toEqual(['b']);
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
    store.addColumn({ id: 'QA' as any, title:'QA', color:'border-slate-300', position: 6 });
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

  it('removeColumn removes a column by id', () => {
    const before = store.columns().map(c => c.id);
    store.addColumn({ id: 'QA' as any, title: 'QA', color: '', position: 6 });
    expect(store.columns().map(c => c.id)).toContain('QA' as any);
    store.removeColumn('QA' as any);
    expect(store.columns().map(c => c.id)).not.toContain('QA' as any);
    // ensure other columns remain
    expect(store.columns().length).toBe(before.length);
  });

  it('removeColumn does nothing for non-existent column id', () => {
    const before = store.columns().length;
    store.removeColumn('NONEXISTENT' as any);
    expect(store.columns().length).toBe(before);
  });

  it('columnBuckets includes all columns even when empty', () => {
    const s = mkSprint('s1', [mkIssue({status:'TODO' as any})]);
    store.loadData([s]);
    store.selectSprint('s1');
    
    const buckets = store.columnBuckets();
    expect(buckets.length).toBe(DEFAULT_COLUMNS.length);
    
    const emptyBucket = buckets.find(b => b.def.id === 'DONE');
    expect(emptyBucket?.items.length).toBe(0);
  });

  it('visibleIssues handles edge cases with filters', () => {
    const s = mkSprint('s1', [
      mkIssue({id:'1', assignee: undefined, labels: [], type: undefined as any}),
      mkIssue({id:'2', assignee: 'John', labels: ['bug'], type: 'TASK' as any})
    ]);
    store.loadData([s]);
    store.selectSprint('s1');

    // Filter by non-existent assignee
    store.applyFilters({ assignees: ['NonExistent'] });
    expect(store.visibleIssues().length).toBe(0);

    // Filter by empty array should show all
    store.applyFilters({ assignees: [] });
    expect(store.visibleIssues().length).toBe(2);
  });

  it('visibleIssues search is case insensitive and searches multiple fields', () => {
    const s = mkSprint('s1', [
      mkIssue({id:'1', title:'Frontend Task', description:'Fix UI bug'}),
      mkIssue({id:'2', title:'Backend API', description:'Add new endpoint'}),
      mkIssue({id:'3', title:'Testing', description:'Write unit tests'})
    ]);
    store.loadData([s]);
    store.selectSprint('s1');

    // Search in title (case insensitive)
    store.setSearch('frontend');
    expect(store.visibleIssues().map(i => i.id)).toEqual(['1']);

    // Search in description
    store.setSearch('endpoint');
    expect(store.visibleIssues().map(i => i.id)).toEqual(['2']);

    // Search should handle empty string
    store.setSearch('');
    expect(store.visibleIssues().length).toBe(3);
  });

  it('updateIssueStatus handles non-existent issue gracefully', () => {
    const issue = mkIssue({id:'x'});
    store.addBacklog([issue]);
    
    // Try to update non-existent issue
    expect(() => {
      store.updateIssueStatus('non-existent', 'DONE' as any);
    }).not.toThrow();
    
    // Original issue should be unchanged
    const unchanged = store.issues().find(i => i.id === 'x');
    expect(unchanged?.status).toBe('TODO');
  });

  it('loadData handles empty sprints array', () => {
    store.loadData([]);
    expect(store.issues().length).toBe(0);
    expect(store.sprints().length).toBe(0);
  });

  it('loadData preserves existing issues when called multiple times', () => {
    const s1 = mkSprint('s1', [mkIssue({id:'A'})]);
    store.loadData([s1]);
    expect(store.issues().length).toBe(1);

    const s2 = mkSprint('s2', [mkIssue({id:'B'})]);
    store.loadData([s2]);
    // Should replace, not append
    expect(store.issues().length).toBe(1);
    expect(store.issues()[0].id).toBe('B');
  });

  it('addBacklog handles empty array', () => {
    store.addBacklog([]);
    expect(store.issues().length).toBe(0);
  });

  it('addBacklog appends to existing issues without replacement', () => {
    const sprint = mkSprint('s1', [mkIssue({id:'A'})]);
    store.loadData([sprint]);
    
    store.addBacklog([mkIssue({id:'B'}), mkIssue({id:'C'})]);
    expect(store.issues().length).toBe(3);
    expect(store.issues().map(i => i.id).sort()).toEqual(['A', 'B', 'C']);
  });

  it('visibleIssues ordering is stable and predictable', () => {
    const s = mkSprint('s1', [
      mkIssue({id:'1', status:'DONE' as any, updatedAt: new Date(2024,0,1)}),
      mkIssue({id:'2', status:'TODO' as any, updatedAt: new Date(2024,0,2)}),
      mkIssue({id:'3', status:'TODO' as any, updatedAt: new Date(2024,0,1)}),
      mkIssue({id:'4', status:'IN_PROGRESS' as any, updatedAt: new Date(2024,0,3)})
    ]);
    store.loadData([s]);
    store.selectSprint('s1');
    
    const ordered = store.visibleIssues().map(i => i.id);
    // Should order by status first (statusOrder), then by updatedAt desc
    // TODO(3,1) -> TODO(2,2) -> IN_PROGRESS(4,3) -> DONE(1,1)
    expect(ordered).toEqual(['3', '2', '4', '1']);
  });

  it('columnBuckets maintains correct bucket structure', () => {
    const s = mkSprint('s1', [mkIssue({status:'TODO' as any})]);
    store.loadData([s]);
    store.selectSprint('s1');
    
    const buckets = store.columnBuckets();
    buckets.forEach(bucket => {
      expect(bucket.def).toBeDefined();
      expect(bucket.items).toBeDefined();
      expect(bucket.def.id).toBeDefined();
      expect(bucket.def.title).toBeDefined();
      expect(bucket.def.color).toBeDefined();
      expect(Array.isArray(bucket.items)).toBe(true);
    });
  });

  it('multiple filter types work together correctly', () => {
    const s = mkSprint('s1', [
      mkIssue({id:'1', assignee:'Alice', type:'TASK' as any, labels:['ui'], status:'TODO' as any, priority:'HIGH' as any}),
      mkIssue({id:'2', assignee:'Alice', type:'BUG' as any, labels:['ui'], status:'TODO' as any, priority:'HIGH' as any}),
      mkIssue({id:'3', assignee:'Bob', type:'TASK' as any, labels:['ui'], status:'TODO' as any, priority:'HIGH' as any}),
      mkIssue({id:'4', assignee:'Alice', type:'TASK' as any, labels:['backend'], status:'TODO' as any, priority:'HIGH' as any})
    ]);
    store.loadData([s]);
    store.selectSprint('s1');

    // Apply multiple filters
    store.applyFilters({
      assignees: ['Alice'],
      workTypes: ['TASK' as any],
      labels: ['ui'],
      statuses: ['TODO' as any],
      priorities: ['HIGH' as any]
    });

    const filtered = store.visibleIssues();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('1');
  });

  it('signal updates trigger reactivity correctly', () => {
    let computedCallCount = 0;
    
    // Create a computed that depends on store signals
    const computed = () => {
      computedCallCount++;
      return store.selectedSprintId() + ':' + store.search();
    };

    // Initial computation
    expect(computed()).toBe('BACKLOG:');
    expect(computedCallCount).toBe(1);

    // Update should trigger recomputation
    store.selectSprint('test' as any);
    expect(computed()).toBe('test:');
    expect(computedCallCount).toBe(2);

    store.setSearch('query');
    expect(computed()).toBe('test:query');
    expect(computedCallCount).toBe(3);
  });

  describe('groupBy functionality', () => {
    it('should group issues by assignee within each column when groupBy is ASSIGNEE', () => {
      const s = mkSprint('s1', [
        mkIssue({id:'1', assignee:'Bob', status:'TODO' as any, priority:'HIGH' as any}),
        mkIssue({id:'2', assignee:'Alice', status:'TODO' as any, priority:'LOW' as any}),
        mkIssue({id:'3', assignee:'Alice', status:'TODO' as any, priority:'CRITICAL' as any}),
        mkIssue({id:'4', assignee:'Bob', status:'IN_PROGRESS' as any, priority:'MEDIUM' as any}),
      ]);
      store.loadData([s]);
      store.selectSprint('s1');
      store.setGroupBy('ASSIGNEE');

      const buckets = store.columnBuckets();
      
      // Should still have the same number of columns (not multiplied)
      expect(buckets.length).toBe(DEFAULT_COLUMNS.length);
      expect(buckets.map(b => b.def.title)).toEqual(['To Do', 'In Progress', 'Blocked', 'In Review', 'Done']);
      
      // Check TODO column - should have Alice's issues grouped, then Bob's, sorted by priority within each group
      const todoBucket = buckets.find(b => b.def.id === 'TODO');
      expect(todoBucket?.items.length).toBe(3);
      // Alice comes before Bob (alphabetically), Alice's CRITICAL before LOW, Bob's HIGH
      expect(todoBucket?.items[0].id).toBe('3'); // Alice - CRITICAL
      expect(todoBucket?.items[1].id).toBe('2'); // Alice - LOW
      expect(todoBucket?.items[2].id).toBe('1'); // Bob - HIGH
      
      // Check IN_PROGRESS column
      const inProgressBucket = buckets.find(b => b.def.id === 'IN_PROGRESS');
      expect(inProgressBucket?.items.length).toBe(1);
      expect(inProgressBucket?.items[0].id).toBe('4'); // Bob - MEDIUM
    });

    it('should group issues by epic within each column when groupBy is EPIC', () => {
      const s = mkSprint('s1', [
        mkIssue({id:'1', epicId:'EPIC-2', status:'TODO' as any, priority:'HIGH' as any}),
        mkIssue({id:'2', epicId:'EPIC-1', status:'TODO' as any, priority:'LOW' as any}),
        mkIssue({id:'3', epicId:'EPIC-1', status:'TODO' as any, priority:'CRITICAL' as any}),
        mkIssue({id:'4', epicId: undefined, status:'TODO' as any, priority:'MEDIUM' as any}),
      ]);
      store.loadData([s]);
      store.selectSprint('s1');
      store.setGroupBy('EPIC');

      const buckets = store.columnBuckets();
      
      // Should still have the same number of columns
      expect(buckets.length).toBe(DEFAULT_COLUMNS.length);
      
      // Check TODO column - issues grouped by epic, sorted by priority within each
      const todoBucket = buckets.find(b => b.def.id === 'TODO');
      expect(todoBucket?.items.length).toBe(4);
      // EPIC-1 comes first (alphabetically), then EPIC-2, then No Epic
      expect(todoBucket?.items[0].id).toBe('3'); // EPIC-1 - CRITICAL
      expect(todoBucket?.items[1].id).toBe('2'); // EPIC-1 - LOW
      expect(todoBucket?.items[2].id).toBe('1'); // EPIC-2 - HIGH
      expect(todoBucket?.items[3].id).toBe('4'); // No Epic - MEDIUM
    });

    it('should group issues by parent within each column when groupBy is SUBTASK', () => {
      const s = mkSprint('s1', [
        mkIssue({id:'1', parentId:'PARENT-2', status:'TODO' as any, priority:'HIGH' as any}),
        mkIssue({id:'2', parentId:'PARENT-1', status:'TODO' as any, priority:'LOW' as any}),
        mkIssue({id:'3', parentId:'PARENT-1', status:'TODO' as any, priority:'CRITICAL' as any}),
        mkIssue({id:'4', parentId: undefined, status:'TODO' as any, priority:'MEDIUM' as any}),
      ]);
      store.loadData([s]);
      store.selectSprint('s1');
      store.setGroupBy('SUBTASK');

      const buckets = store.columnBuckets();
      
      // Should still have the same number of columns
      expect(buckets.length).toBe(DEFAULT_COLUMNS.length);
      
      // Check TODO column - issues grouped by parent, sorted by priority within each
      const todoBucket = buckets.find(b => b.def.id === 'TODO');
      expect(todoBucket?.items.length).toBe(4);
      // No Parent, PARENT-1, then PARENT-2 (alphabetically)
      expect(todoBucket?.items[0].id).toBe('4'); // No Parent - MEDIUM
      expect(todoBucket?.items[1].id).toBe('3'); // PARENT-1 - CRITICAL
      expect(todoBucket?.items[2].id).toBe('2'); // PARENT-1 - LOW
      expect(todoBucket?.items[3].id).toBe('1'); // PARENT-2 - HIGH
    });

    it('should sort issues by priority when groupBy is NONE', () => {
      const s = mkSprint('s1', [
        mkIssue({id:'1', status:'TODO' as any, priority:'LOW' as any}),
        mkIssue({id:'2', status:'TODO' as any, priority:'CRITICAL' as any}),
        mkIssue({id:'3', status:'TODO' as any, priority:'HIGH' as any}),
        mkIssue({id:'4', status:'TODO' as any, priority:'MEDIUM' as any}),
      ]);
      store.loadData([s]);
      store.selectSprint('s1');
      store.setGroupBy('NONE');

      const buckets = store.columnBuckets();
      
      // Should have default columns
      expect(buckets.length).toBe(DEFAULT_COLUMNS.length);
      expect(buckets.map(b => b.def.title)).toEqual(['To Do', 'In Progress', 'Blocked', 'In Review', 'Done']);
      
      // Issues should be sorted by priority: CRITICAL > HIGH > MEDIUM > LOW
      const todoBucket = buckets.find(b => b.def.id === 'TODO');
      expect(todoBucket?.items.length).toBe(4);
      expect(todoBucket?.items[0].id).toBe('2'); // CRITICAL
      expect(todoBucket?.items[1].id).toBe('3'); // HIGH
      expect(todoBucket?.items[2].id).toBe('4'); // MEDIUM
      expect(todoBucket?.items[3].id).toBe('1'); // LOW
    });

    it('should handle empty issues with groupBy', () => {
      store.loadData([]);
      store.setGroupBy('ASSIGNEE');

      const buckets = store.columnBuckets();
      
      // Should create default columns when no issues
      expect(buckets.length).toBe(DEFAULT_COLUMNS.length);
      buckets.forEach(bucket => {
        expect(bucket.items.length).toBe(0);
      });
    });

    it('should switch between groupBy modes correctly', () => {
      const s = mkSprint('s1', [
        mkIssue({id:'1', assignee:'Alice', epicId:'EPIC-1', status:'TODO' as any}),
      ]);
      store.loadData([s]);
      store.selectSprint('s1');

      // Start with NONE
      store.setGroupBy('NONE');
      let buckets = store.columnBuckets();
      expect(buckets.map(b => b.def.title)).toEqual(['To Do', 'In Progress', 'Blocked', 'In Review', 'Done']);

      // Switch to ASSIGNEE - should still have same columns, just grouped differently
      store.setGroupBy('ASSIGNEE');
      buckets = store.columnBuckets();
      expect(buckets.length).toBe(DEFAULT_COLUMNS.length);
      expect(buckets.map(b => b.def.title)).toEqual(['To Do', 'In Progress', 'Blocked', 'In Review', 'Done']);

      // Switch to EPIC
      store.setGroupBy('EPIC');
      buckets = store.columnBuckets();
      expect(buckets.length).toBe(DEFAULT_COLUMNS.length);
      expect(buckets.map(b => b.def.title)).toEqual(['To Do', 'In Progress', 'Blocked', 'In Review', 'Done']);

      // Switch back to NONE
      store.setGroupBy('NONE');
      buckets = store.columnBuckets();
      expect(buckets.map(b => b.def.title)).toEqual(['To Do', 'In Progress', 'Blocked', 'In Review', 'Done']);
    });

    it('should respect filters when grouping by assignee', () => {
      const s = mkSprint('s1', [
        mkIssue({id:'1', assignee:'Alice', status:'TODO' as any}),
        mkIssue({id:'2', assignee:'Bob', status:'TODO' as any}),
        mkIssue({id:'3', assignee:'Alice', status:'IN_PROGRESS' as any}),
      ]);
      store.loadData([s]);
      store.selectSprint('s1');
      store.setGroupBy('ASSIGNEE');
      
      // Filter to only Alice
      store.applyFilters({
        assignees: ['Alice'],
        workTypes: [],
        labels: [],
        statuses: [],
        priorities: []
      });

      const buckets = store.columnBuckets();
      
      // Should have all columns but only Alice's issues
      expect(buckets.length).toBe(DEFAULT_COLUMNS.length);
      const todoBucket = buckets.find(b => b.def.id === 'TODO');
      expect(todoBucket?.items.length).toBe(1);
      expect(todoBucket?.items[0].assignee).toBe('Alice');
      
      const inProgressBucket = buckets.find(b => b.def.id === 'IN_PROGRESS');
      expect(inProgressBucket?.items.length).toBe(1);
      expect(inProgressBucket?.items[0].assignee).toBe('Alice');
    });
  });

  describe('new board methods', () => {
    it('updateIssueTitle should update issue title and updatedAt', () => {
      const issue = mkIssue({id:'x', title:'Old Title', updatedAt:new Date(2020,0,1)});
      store.addBacklog([issue]);

      const before = store.issues().find(i=>i.id==='x')!;
      expect(before.title).toBe('Old Title');

      store.updateIssueTitle('x', 'New Title');

      const after = store.issues().find(i=>i.id==='x')!;
      expect(after.title).toBe('New Title');
      expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
    });

    it('updateIssueTitle should handle non-existent issue gracefully', () => {
      expect(() => {
        store.updateIssueTitle('non-existent', 'New Title');
      }).not.toThrow();
    });

    it('updateIssueAssignee should update assignee', () => {
      const issue = mkIssue({id:'x', assignee:'Old Assignee'});
      store.addBacklog([issue]);

      store.updateIssueAssignee('x', 'New Assignee');

      const after = store.issues().find(i=>i.id==='x')!;
      expect(after.assignee).toBe('New Assignee');
    });

    it('updateIssueAssignee should handle undefined assignee', () => {
      const issue = mkIssue({id:'x', assignee:'Someone'});
      store.addBacklog([issue]);

      store.updateIssueAssignee('x', undefined);

      const after = store.issues().find(i=>i.id==='x')!;
      expect(after.assignee).toBeUndefined();
    });

    it('updateIssueAssignee should update updatedAt timestamp', () => {
      const issue = mkIssue({id:'x', updatedAt:new Date(2020,0,1)});
      store.addBacklog([issue]);

      const before = store.issues().find(i=>i.id==='x')!;
      store.updateIssueAssignee('x', 'New Assignee');

      const after = store.issues().find(i=>i.id==='x')!;
      expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
    });

    it('updateIssueAssignee should handle non-existent issue gracefully', () => {
      expect(() => {
        store.updateIssueAssignee('non-existent', 'Someone');
      }).not.toThrow();
    });

    it('updateIssueDueDate should update due date', () => {
      const issue = mkIssue({id:'x'});
      store.addBacklog([issue]);

      const dueDate = new Date('2024-12-31');
      store.updateIssueDueDate('x', dueDate);

      const after = store.issues().find(i=>i.id==='x')!;
      expect(after.dueDate).toBe(dueDate);
    });

    it('updateIssueDueDate should handle undefined due date', () => {
      const issue = mkIssue({id:'x', dueDate: new Date('2024-12-31')});
      store.addBacklog([issue]);

      store.updateIssueDueDate('x', undefined);

      const after = store.issues().find(i=>i.id==='x')!;
      expect(after.dueDate).toBeUndefined();
    });

    it('updateIssueDueDate should update updatedAt timestamp', () => {
      const issue = mkIssue({id:'x', updatedAt:new Date(2020,0,1)});
      store.addBacklog([issue]);

      const before = store.issues().find(i=>i.id==='x')!;
      store.updateIssueDueDate('x', new Date('2024-12-31'));

      const after = store.issues().find(i=>i.id==='x')!;
      expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
    });

    it('updateIssueDueDate should handle non-existent issue gracefully', () => {
      expect(() => {
        store.updateIssueDueDate('non-existent', new Date());
      }).not.toThrow();
    });

    it('createIssue should create new issue with all fields', () => {
      const issueData = {
        title: 'New Issue',
        status: 'TODO' as any,
        type: 'TASK' as any,
        priority: 'HIGH' as any,
        assignee: 'Alice',
        dueDate: new Date('2024-12-31')
      };

      store.createIssue(issueData);

      const issues = store.issues();
      expect(issues.length).toBe(1);
      
      const created = issues[0];
      expect(created.title).toBe('New Issue');
      expect(created.status).toBe('TODO');
      expect(created.type).toBe('TASK');
      expect(created.priority).toBe('HIGH');
      expect(created.assignee).toBe('Alice');
      expect(created.dueDate).toEqual(new Date('2024-12-31'));
      expect(created.id).toBeDefined();
      expect(created.createdAt).toBeDefined();
      expect(created.updatedAt).toBeDefined();
    });

    it('createIssue should generate unique IDs', () => {
      store.createIssue({
        title: 'Issue 1',
        status: 'TODO' as any,
        type: 'TASK' as any,
        priority: 'MEDIUM' as any
      });

      store.createIssue({
        title: 'Issue 2',
        status: 'TODO' as any,
        type: 'TASK' as any,
        priority: 'MEDIUM' as any
      });

      const issues = store.issues();
      expect(issues.length).toBe(2);
      expect(issues[0].id).not.toBe(issues[1].id);
    });

    it('createIssue should handle optional fields', () => {
      store.createIssue({
        title: 'Minimal Issue',
        status: 'TODO' as any,
        type: 'TASK' as any,
        priority: 'LOW' as any
      });

      const created = store.issues()[0];
      expect(created.assignee).toBeUndefined();
      expect(created.dueDate).toBeUndefined();
    });

    it('createIssue should set default values for required fields', () => {
      store.createIssue({
        title: 'Test Issue',
        status: 'TODO' as any,
        type: 'TASK' as any,
        priority: 'MEDIUM' as any
      });

      const created = store.issues()[0];
      expect(created.description).toBe('');
      expect(created.labels).toEqual([]);
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);
    });

    it('createIssue should append to existing issues', () => {
      const existing = mkIssue({id:'existing'});
      store.addBacklog([existing]);

      store.createIssue({
        title: 'New',
        status: 'TODO' as any,
        type: 'TASK' as any,
        priority: 'MEDIUM' as any
      });

      expect(store.issues().length).toBe(2);
      expect(store.issues().find(i => i.id === 'existing')).toBeDefined();
    });
  });

  fdescribe('sorting by createdAt', () => {
    it('should sort issues by createdAt instead of updatedAt to prevent card jumping', () => {
      const s = mkSprint('s1', [
        mkIssue({id:'1', status:'TODO' as any, createdAt: new Date(2024,0,3), updatedAt: new Date(2024,0,10)}),
        mkIssue({id:'2', status:'TODO' as any, createdAt: new Date(2024,0,1), updatedAt: new Date(2024,0,11)}),
        mkIssue({id:'3', status:'TODO' as any, createdAt: new Date(2024,0,2), updatedAt: new Date(2024,0,9)})
      ]);
      store.loadData([s]);
      store.selectSprint('s1');

      const buckets = store.columnBuckets();
      const todoBucket = buckets.find(b => b.def.id === 'TODO');
      
      // Should be ordered by priority first, then by createdAt (oldest first)
      // Since all have same priority, order should be by createdAt: 2, 3, 1
      expect(todoBucket?.items[0].id).toBe('2'); // Created Jan 1
      expect(todoBucket?.items[1].id).toBe('3'); // Created Jan 2
      expect(todoBucket?.items[2].id).toBe('1'); // Created Jan 3
    });

    it('should maintain stable card positions when updating issue title', () => {
      const s = mkSprint('s1', [
        mkIssue({id:'1', status:'TODO' as any, title:'First', createdAt: new Date(2024,0,1)}),
        mkIssue({id:'2', status:'TODO' as any, title:'Second', createdAt: new Date(2024,0,2)}),
        mkIssue({id:'3', status:'TODO' as any, title:'Third', createdAt: new Date(2024,0,3)})
      ]);
      store.loadData([s]);
      store.selectSprint('s1');

      const beforeUpdate = store.columnBuckets().find(b => b.def.id === 'TODO')?.items.map(i => i.id);
      
      // Update middle card's title (this updates updatedAt but shouldn't change position)
      store.updateIssueTitle('2', 'Second Updated');

      const afterUpdate = store.columnBuckets().find(b => b.def.id === 'TODO')?.items.map(i => i.id);
      
      // Order should remain the same because sorting is by createdAt
      expect(afterUpdate).toEqual(beforeUpdate);
    });
  });
});




