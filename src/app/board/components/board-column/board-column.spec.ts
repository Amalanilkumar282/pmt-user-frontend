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

  it('drop across containers updates status via store only (no manual transfer)', () => {
    const fixture = TestBed.createComponent(BoardColumn);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    cmp.def = { id: 'DONE' as any, title:'Done', color:'' };
    const otherData: Issue[] = [{id:'a'} as any];
    const event: any = {
      previousContainer: { data: otherData },
      container: { data: cmp.items },
      previousIndex: 0,
      currentIndex: 0
    };
    cmp.drop(event);
    expect(store.updateIssueStatus).toHaveBeenCalledWith('a', 'DONE' as any);
    // Ensure we did not push into cmp.items directly (single source of truth is store)
    expect(cmp.items.length).toBe(0);
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
});
