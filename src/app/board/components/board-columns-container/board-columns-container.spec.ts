import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BoardColumnsContainer } from './board-columns-container';
import { BoardStore } from '../../board-store';
import type { Issue } from '../../../shared/models/issue.model';

class BoardStoreMock {
  columnBuckets = signal([
    { def: { id: 'TODO', title:'To Do', color:'x'}, items: [{ id:'1'} as Issue] },
    { def: { id: 'DONE', title:'Done', color:'y'}, items: [{ id:'2'} as Issue] }
  ]);
  updateIssueStatus = jasmine.createSpy('updateIssueStatus');
}

describe('BoardColumnsContainer', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardColumnsContainer],
      providers: [{ provide: BoardStore, useClass: BoardStoreMock }]
    }).compileComponents();
  });

  it('computes dropListIds', () => {
    const fixture = TestBed.createComponent(BoardColumnsContainer);
    const cmp = fixture.componentInstance;
    expect(cmp.dropListIds()).toEqual(['TODO','DONE']);
    expect(cmp.dropListIdsArray()).toEqual(['TODO','DONE']);
  });

  it('track uses def.id', () => {
    const fixture = TestBed.createComponent(BoardColumnsContainer);
    const cmp = fixture.componentInstance;
    const key = cmp.track(0, { def: { id:'TODO', title:'To Do', color:''}, items: [] } as any);
    expect(key).toBe('TODO');
  });

  it('onDrop reorders within same container', () => {
    const fixture = TestBed.createComponent(BoardColumnsContainer);
    const cmp = fixture.componentInstance;

    const data: Issue[] = [{id:'a'} as any, {id:'b'} as any, {id:'c'} as any];
    const event: any = {
      previousContainer: { data },
      container: { data, id: 'TODO' },
      previousIndex: 0,
      currentIndex: 2
    };
    cmp.onDrop(event);
    expect(data.map(i=>i.id)).toEqual(['b','c','a']);
  });

  it('onDrop moves across containers and updates status', () => {
    const fixture = TestBed.createComponent(BoardColumnsContainer);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as BoardStoreMock;

    const fromData: Issue[] = [{id:'a'} as any];
    const toData: Issue[] = [];
    const event: any = {
      previousContainer: { data: fromData, id:'TODO' },
      container: { data: toData, id: 'DONE' },
      previousIndex: 0,
      currentIndex: 0
    };

    cmp.onDrop(event);
    expect(fromData.length).toBe(0);
    expect(toData.map(i=>i.id)).toEqual(['a']);
    expect(store.updateIssueStatus).toHaveBeenCalledWith('a', 'DONE');
  });

  it('dropListIds computed signal returns correct array', () => {
    const fixture = TestBed.createComponent(BoardColumnsContainer);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as BoardStoreMock;

    // Update mock to have different columns
    store.columnBuckets.set([
      { def: { id: 'TODO' as any, title:'To Do', color:'x'}, items: [] },
      { def: { id: 'IN_PROGRESS' as any, title:'In Progress', color:'y'}, items: [] },
      { def: { id: 'DONE' as any, title:'Done', color:'z'}, items: [] }
    ]);

    const result = cmp.dropListIds();
    expect(result.length).toBe(3);
    expect(result).toContain('TODO');
    expect(result).toContain('IN_PROGRESS');
    expect(result).toContain('DONE');
  });

  it('dropListIdsArray returns same as dropListIds computed', () => {
    const fixture = TestBed.createComponent(BoardColumnsContainer);
    const cmp = fixture.componentInstance;

    const computedIds = cmp.dropListIds();
    const arrayIds = cmp.dropListIdsArray();
    
    expect(arrayIds).toEqual(computedIds);
    expect(Array.isArray(arrayIds)).toBe(true);
  });

  it('onOpenIssue emits openIssue event', () => {
    const fixture = TestBed.createComponent(BoardColumnsContainer);
    const cmp = fixture.componentInstance;

    spyOn(cmp.openIssue, 'emit');
    const issue = {id: 'test-issue'} as any;
    
    cmp.onOpenIssue(issue);
    expect(cmp.openIssue.emit).toHaveBeenCalledWith(issue);
  });

  it('track function uses def.id consistently', () => {
    const fixture = TestBed.createComponent(BoardColumnsContainer);
    const cmp = fixture.componentInstance;

    const bucket1 = { def: { id:'TODO', title:'To Do', color:''}, items: [] } as any;
    const bucket2 = { def: { id:'DONE', title:'Done', color:''}, items: [] } as any;
    
    expect(cmp.track(0, bucket1)).toBe('TODO');
    expect(cmp.track(1, bucket2)).toBe('DONE');
    expect(cmp.track(999, bucket1)).toBe('TODO'); // Index doesn't affect result
  });

  it('onDrop handles reordering in middle of array', () => {
    const fixture = TestBed.createComponent(BoardColumnsContainer);
    const cmp = fixture.componentInstance;

    const data: Issue[] = [
      {id:'first'} as any, 
      {id:'second'} as any, 
      {id:'third'} as any, 
      {id:'fourth'} as any
    ];
    
    const event: any = {
      previousContainer: { data },
      container: { data, id: 'TODO' },
      previousIndex: 1, // 'second'
      currentIndex: 3   // Move to position 3
    };
    
    cmp.onDrop(event);
    expect(data.map(i=>i.id)).toEqual(['first', 'third', 'fourth', 'second']);
  });

  it('onDrop moves item to specific position in target container', () => {
    const fixture = TestBed.createComponent(BoardColumnsContainer);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as BoardStoreMock;

    const fromData: Issue[] = [{id:'moving'} as any];
    const toData: Issue[] = [{id:'existing1'} as any, {id:'existing2'} as any];
    
    const event: any = {
      previousContainer: { data: fromData, id:'TODO' },
      container: { data: toData, id: 'IN_PROGRESS' },
      previousIndex: 0,
      currentIndex: 1 // Insert between existing items
    };

    cmp.onDrop(event);
    expect(fromData.length).toBe(0);
    expect(toData.map(i=>i.id)).toEqual(['existing1', 'moving', 'existing2']);
    expect(store.updateIssueStatus).toHaveBeenCalledWith('moving', 'IN_PROGRESS');
  });

  it('buckets signal is reactive to store changes', () => {
    const fixture = TestBed.createComponent(BoardColumnsContainer);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as BoardStoreMock;

    const initialBuckets = cmp.buckets();
    expect(initialBuckets.length).toBe(2);

    // Update store buckets
    store.columnBuckets.set([
      { def: { id: 'SINGLE', title:'Single Column', color:'x'}, items: [] }
    ]);

    const updatedBuckets = cmp.buckets();
    expect(updatedBuckets.length).toBe(1);
    expect(updatedBuckets[0].def.id).toBe('SINGLE');
  });

  it('component handles empty buckets array', () => {
    const fixture = TestBed.createComponent(BoardColumnsContainer);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as BoardStoreMock;

    store.columnBuckets.set([]);

    expect(cmp.buckets()).toEqual([]);
    expect(cmp.dropListIds()).toEqual([]);
    expect(cmp.dropListIdsArray()).toEqual([]);
  });

  it('onDrop does not call store when containers are the same reference', () => {
    const fixture = TestBed.createComponent(BoardColumnsContainer);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as BoardStoreMock;

    const sharedData: Issue[] = [{id:'a'} as any, {id:'b'} as any];
    const event: any = {
      previousContainer: { data: sharedData },
      container: { data: sharedData, id: 'TODO' },
      previousIndex: 0,
      currentIndex: 1
    };

    cmp.onDrop(event);
    expect(sharedData.map(i=>i.id)).toEqual(['b', 'a']);
    expect(store.updateIssueStatus).not.toHaveBeenCalled();
  });

  it('integration with store and drag drop works correctly', () => {
    const fixture = TestBed.createComponent(BoardColumnsContainer);
    const cmp = fixture.componentInstance;

    // Component should work with injected store
    expect(cmp.buckets).toBeDefined();
    expect(cmp.dropListIds).toBeDefined();
    expect(typeof cmp.onDrop).toBe('function');
  });

  it('track function handles objects with same structure but different ids', () => {
    const fixture = TestBed.createComponent(BoardColumnsContainer);
    const cmp = fixture.componentInstance;

    const bucket1 = { def: { id:'A', title:'Title A', color:'red'}, items: [{id:'1'}] } as any;
    const bucket2 = { def: { id:'B', title:'Title A', color:'red'}, items: [{id:'1'}] } as any;
    
    expect(cmp.track(0, bucket1)).toBe('A');
    expect(cmp.track(0, bucket2)).toBe('B');
    expect(cmp.track(0, bucket1)).not.toBe(cmp.track(0, bucket2));
  });
});
