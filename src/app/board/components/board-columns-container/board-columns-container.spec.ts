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
});
