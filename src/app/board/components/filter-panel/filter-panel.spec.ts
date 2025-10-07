import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FilterPanel } from './filter-panel';
import { BoardStore } from '../../board-store';
import type { Issue } from '../../../shared/models/issue.model';

class StoreMock {
  issues = signal<Issue[]>([
    { id:'1', title:'a', description:'', type:'TASK' as any, status:'TODO' as any, priority:'HIGH' as any, assignee:'Joy', labels:['l1'], createdAt: new Date(), updatedAt:new Date() },
    { id:'2', title:'b', description:'', type:'BUG' as any, status:'IN_REVIEW' as any, priority:'LOW' as any, assignee:'Sam', labels:['l2','l1'], createdAt: new Date(), updatedAt:new Date() },
    { id:'3', title:'c', description:'', type:'TASK' as any, status:'DONE' as any, priority:'MEDIUM' as any, assignee:undefined as any, labels:[], createdAt: new Date(), updatedAt:new Date() },
  ]);
  filters = signal<any>({ assignees: [], workTypes: [], labels: [], statuses: [], priorities: [] });
}

describe('FilterPanel', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterPanel],
      providers: [{ provide: BoardStore, useClass: StoreMock }]
    }).compileComponents();
  });

  it('derives assignees/workTypes/labels/priorities', () => {
    const fixture = TestBed.createComponent(FilterPanel);
    const cmp = fixture.componentInstance;

    expect(cmp.assignees()).toEqual(['Joy','Sam']);
    expect(cmp.statuses()).toEqual(['TODO','IN_PROGRESS','IN_REVIEW','DONE']);
    expect(new Set(cmp.workTypes())).toEqual(new Set(['TASK','BUG']));
    expect(new Set(cmp.labels())).toEqual(new Set(['l1','l2']));
    expect(cmp.priorities()).toEqual(['HIGH','MEDIUM','LOW']);
  });

  it('isSelected and toggle update filters', () => {
    const fixture = TestBed.createComponent(FilterPanel);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    expect(cmp.isSelected('labels','l1')).toBeFalse();
    cmp.toggle('labels','l1');
    expect(cmp.isSelected('labels','l1')).toBeTrue();

    cmp.toggle('labels','l1'); // remove
    expect(cmp.isSelected('labels','l1')).toBeFalse();

    cmp.selectField('statuses');
    expect(cmp.activeField).toBe('statuses');

    cmp.togglePanel();
    expect(cmp.isOpen).toBeTrue();
    cmp.togglePanel();
    expect(cmp.isOpen).toBeFalse();
    expect(cmp.activeField).toBeNull();

    // ensure store.filters got updated structure
    expect(store.filters()).toEqual(jasmine.objectContaining({
      assignees: [], workTypes: [], labels: [], statuses: [], priorities: []
    }));
  });
});
