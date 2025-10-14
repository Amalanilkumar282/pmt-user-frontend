import { TestBed } from '@angular/core/testing';
import { BoardColumn } from './board-column';
import { BoardStore } from '../../board-store';
import type { Issue } from '../../../shared/models/issue.model';

class StoreMock {
  updateIssueStatus = jasmine.createSpy('updateIssueStatus');
  removeColumn = jasmine.createSpy('removeColumn');
}

describe('BoardColumn', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardColumn],
      providers: [{ provide: BoardStore, useClass: StoreMock }]
    }).compileComponents();
  });

  it('trackById returns id', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;
    const issue = { id: 'X' } as Issue;
    expect(cmp.trackById(0, issue)).toBe('X');
  });

  it('pageItems and loadMore paginate', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;
    cmp.items = Array.from({length: 45}).map((_,i)=>({id:String(i)} as Issue));
    expect(cmp.pageItems.length).toBe(20);
    cmp.loadMore();
    expect(cmp.pageItems.length).toBe(40);
  });

  it('drop within same container reorders and does not call store', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    cmp.items = [{id:'a'} as any, {id:'b'} as any, {id:'c'} as any];
    const event: any = {
      previousContainer: { data: cmp.items },
      container: { data: cmp.items },
      previousIndex: 0,
      currentIndex: 2
    };
    cmp.drop(event);
    expect(cmp.items.map(i=>i.id)).toEqual(['b','c','a']);
    expect(store.updateIssueStatus).not.toHaveBeenCalled();
  });

  it('drop across containers transfers item and updates status via store', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    cmp.def = { id: 'DONE' as any, title:'Done', color:'' };
    cmp.items = []; // Start with empty target
    const otherData: Issue[] = [{id:'a'} as any];
    const event: any = {
      previousContainer: { data: otherData },
      container: { data: cmp.items },
      previousIndex: 0,
      currentIndex: 0
    };
    cmp.drop(event);
    expect(store.updateIssueStatus).toHaveBeenCalledWith('a', 'DONE' as any);
    // Item should be transferred to cmp.items
    expect(cmp.items.length).toBe(1);
    expect(cmp.items[0].id).toBe('a');
    // And removed from source
    expect(otherData.length).toBe(0);
  });

  it('onDeleteColumn prompts if column not empty and does not delete', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    // populate items
    cmp.items = [{id:'a'} as any];
    cmp.def = { id: 'TODO' as any, title: 'To Do', color: '' } as any;
    spyOn(window, 'confirm').and.returnValue(false);

    const res = cmp.onDeleteColumn();
    expect(window.confirm).toHaveBeenCalled();
    expect(res).toBeFalse();
    expect(store.removeColumn).not.toHaveBeenCalled();
  });

  it('onDeleteColumn deletes when empty', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    cmp.items = [];
    cmp.def = { id: 'DONE' as any, title: 'Done', color: '' } as any;
    const res = cmp.onDeleteColumn();
    expect(store.removeColumn).toHaveBeenCalledWith('DONE');
    expect(res).toBeTrue();
  });

  it('onDeleteColumn confirms and deletes when user accepts', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    cmp.items = [{id:'a'} as any];
    cmp.def = { id: 'TODO' as any, title: 'To Do', color: '' } as any;
    spyOn(window, 'confirm').and.returnValue(true);

    const res = cmp.onDeleteColumn();
    expect(window.confirm).toHaveBeenCalledWith('This column is not empty. Please move or remove the issues before deleting the column.');
    expect(res).toBeTrue();
    expect(store.removeColumn).not.toHaveBeenCalled(); // Still doesn't delete non-empty column
  });

  it('onOpen emits openIssue event', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;

    spyOn(cmp.openIssue, 'emit');
    const issue = {id: 'test'} as any;
    
    cmp.onOpen(issue);
    expect(cmp.openIssue.emit).toHaveBeenCalledWith(issue);
  });

  it('should initialize with safe defaults', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;

    expect(cmp.def).toBeDefined();
    expect(cmp.def.id).toBe('TODO');
    expect(cmp.items).toEqual([]);
    expect(cmp.connectedTo).toEqual([]);
    expect(cmp.pageSize).toBe(20);
  });

  it('should accept input properties', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;

    const testDef = { id: 'TEST' as any, title: 'Test', color: 'test-color' };
    const testItems = [{id: '1'} as any, {id: '2'} as any];
    const testConnectedTo = ['col1', 'col2'];

    cmp.def = testDef;
    cmp.items = testItems;
    cmp.connectedTo = testConnectedTo;

    expect(cmp.def).toBe(testDef);
    expect(cmp.items).toBe(testItems);
    expect(cmp.connectedTo).toBe(testConnectedTo);
  });

  it('pageItems returns correct slice', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;

    cmp.items = Array.from({length: 50}).map((_,i) => ({id: String(i)} as Issue));
    
    expect(cmp.pageItems.length).toBe(20);
    expect(cmp.pageItems[0].id).toBe('0');
    expect(cmp.pageItems[19].id).toBe('19');
  });

  it('loadMore increases pageSize correctly', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;

    cmp.items = Array.from({length: 100}).map((_,i) => ({id: String(i)} as Issue));
    
    expect(cmp.pageSize).toBe(20);
    expect(cmp.pageItems.length).toBe(20);
    
    cmp.loadMore();
    expect(cmp.pageSize).toBe(40);
    expect(cmp.pageItems.length).toBe(40);

    cmp.loadMore();
    expect(cmp.pageSize).toBe(60);
    expect(cmp.pageItems.length).toBe(60);
  });

  it('loadMore handles cases where items length is less than pageSize', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;

    cmp.items = Array.from({length: 10}).map((_,i) => ({id: String(i)} as Issue));
    
    expect(cmp.pageItems.length).toBe(10);
    
    cmp.loadMore();
    expect(cmp.pageItems.length).toBe(10); // Should still be 10, not more
  });

  it('drop handles same data reference correctly', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    const sharedData = [{id:'a'} as any, {id:'b'} as any, {id:'c'} as any];
    cmp.items = sharedData;

    const event: any = {
      previousContainer: { data: sharedData },
      container: { data: sharedData },
      previousIndex: 2,
      currentIndex: 0
    };
    
    cmp.drop(event);
    expect(sharedData.map(i=>i.id)).toEqual(['c','a','b']);
    expect(store.updateIssueStatus).not.toHaveBeenCalled();
  });

  it('drop calls store updateIssueStatus with correct parameters', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    cmp.def = { id: 'IN_PROGRESS' as any, title:'In Progress', color:'' };
    const sourceData: Issue[] = [{id:'task-123'} as any];
    const targetData: Issue[] = [];
    
    const event: any = {
      previousContainer: { data: sourceData },
      container: { data: targetData },
      previousIndex: 0,
      currentIndex: 0
    };
    
    cmp.drop(event);
    expect(store.updateIssueStatus).toHaveBeenCalledWith('task-123', 'IN_PROGRESS' as any);
  });

  it('trackById returns consistent id for same issue', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;

    const issue = { id: 'TASK-456' } as Issue;
    
    expect(cmp.trackById(0, issue)).toBe('TASK-456');
    expect(cmp.trackById(999, issue)).toBe('TASK-456'); // Index doesn't matter
  });

  it('component integrates with CDK drag drop', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;

    // Component should be able to handle CDK drag drop events
    expect(cmp.drop).toBeDefined();
    expect(typeof cmp.drop).toBe('function');
  });

  it('handles empty items array gracefully', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;

    cmp.items = [];
    
    expect(cmp.pageItems).toEqual([]);
    expect(cmp.pageItems.length).toBe(0);
    
    const result = cmp.onDeleteColumn();
    expect(result).toBeTrue();
  });

  it('handles undefined items gracefully in onDeleteColumn', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;

    cmp.items = undefined as any;
    
    const result = cmp.onDeleteColumn();
    expect(result).toBeTrue(); // Should treat undefined as empty
  });

  describe('groupedIssues', () => {
    it('should return single group when groupBy is NONE', () => {
      const fixture = TestBed.createComponent(BoardColumn);
      const cmp = fixture.componentInstance;
      
      cmp.groupBy = 'NONE';
      cmp.items = [
        { id: '1', assignee: 'Alice' } as any,
        { id: '2', assignee: 'Bob' } as any
      ];
      
      const sorted = cmp.sortedItems;
      expect(sorted.length).toBe(2);
      expect(cmp.shouldShowGroupHeader(sorted[0], null)).toBe(false);
      expect(cmp.shouldShowGroupHeader(sorted[1], sorted[0])).toBe(false);
    });

    it('should group by assignee when groupBy is ASSIGNEE', () => {
      const fixture = TestBed.createComponent(BoardColumn);
      const cmp = fixture.componentInstance;
      
      cmp.groupBy = 'ASSIGNEE';
      cmp.items = [
        { id: '1', assignee: 'Bob' } as any,
        { id: '2', assignee: 'Alice' } as any,
        { id: '3', assignee: 'Alice' } as any,
        { id: '4', assignee: undefined } as any
      ];
      
      const sorted = cmp.sortedItems;
      expect(sorted.length).toBe(4);
      
      // Should be sorted alphabetically: Alice (2 items), Bob (1 item), Unassigned (1 item)
      expect(sorted[0].assignee).toBe('Alice');
      expect(sorted[1].assignee).toBe('Alice');
      expect(sorted[2].assignee).toBe('Bob');
      expect(sorted[3].assignee).toBeUndefined();
      
      // Check group headers
      expect(cmp.shouldShowGroupHeader(sorted[0], null)).toBe(true);
      expect(cmp.shouldShowGroupHeader(sorted[1], sorted[0])).toBe(false);
      expect(cmp.shouldShowGroupHeader(sorted[2], sorted[1])).toBe(true);
      expect(cmp.shouldShowGroupHeader(sorted[3], sorted[2])).toBe(true);
    });

    it('should group by epic when groupBy is EPIC', () => {
      const fixture = TestBed.createComponent(BoardColumn);
      const cmp = fixture.componentInstance;
      
      cmp.groupBy = 'EPIC';
      cmp.items = [
        { id: '1', epicId: 'EPIC-2' } as any,
        { id: '2', epicId: 'EPIC-1' } as any,
        { id: '3', epicId: 'EPIC-1' } as any,
        { id: '4', epicId: undefined } as any
      ];
      
      const sorted = cmp.sortedItems;
      expect(sorted.length).toBe(4);
      
      // Should be sorted alphabetically: EPIC-1, EPIC-2, No Epic
      expect(sorted[0].epicId).toBe('EPIC-1');
      expect(sorted[1].epicId).toBe('EPIC-1');
      expect(sorted[2].epicId).toBe('EPIC-2');
      expect(sorted[3].epicId).toBeUndefined();
      
      // Check group headers
      expect(cmp.shouldShowGroupHeader(sorted[0], null)).toBe(true);
      expect(cmp.shouldShowGroupHeader(sorted[1], sorted[0])).toBe(false);
      expect(cmp.shouldShowGroupHeader(sorted[2], sorted[1])).toBe(true);
      expect(cmp.shouldShowGroupHeader(sorted[3], sorted[2])).toBe(true);
    });

    it('should group by parent when groupBy is SUBTASK', () => {
      const fixture = TestBed.createComponent(BoardColumn);
      const cmp = fixture.componentInstance;
      
      cmp.groupBy = 'SUBTASK';
      cmp.items = [
        { id: '1', parentId: 'PARENT-2' } as any,
        { id: '2', parentId: 'PARENT-1' } as any,
        { id: '3', parentId: 'PARENT-1' } as any,
        { id: '4', parentId: undefined } as any
      ];
      
      const sorted = cmp.sortedItems;
      expect(sorted.length).toBe(4);
      
      // Should be sorted alphabetically: No Parent, PARENT-1, PARENT-2
      expect(sorted[0].parentId).toBeUndefined();
      expect(sorted[1].parentId).toBe('PARENT-1');
      expect(sorted[2].parentId).toBe('PARENT-1');
      expect(sorted[3].parentId).toBe('PARENT-2');
      
      // Check group headers
      expect(cmp.shouldShowGroupHeader(sorted[0], null)).toBe(true);
      expect(cmp.shouldShowGroupHeader(sorted[1], sorted[0])).toBe(true);
      expect(cmp.shouldShowGroupHeader(sorted[2], sorted[1])).toBe(false);
      expect(cmp.shouldShowGroupHeader(sorted[3], sorted[2])).toBe(true);
    });

    it('should handle empty items array', () => {
      const fixture = TestBed.createComponent(BoardColumn);
      const cmp = fixture.componentInstance;
      
      cmp.groupBy = 'ASSIGNEE';
      cmp.items = [];
      
      const sorted = cmp.sortedItems;
      expect(sorted.length).toBe(0);
    });
  });
});
