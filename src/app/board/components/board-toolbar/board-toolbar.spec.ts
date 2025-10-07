import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BoardToolbar } from './board-toolbar';
import { BoardStore } from '../../board-store';

class StoreMock {
  search = signal('');
  selectedSprintId = signal<'BACKLOG'|string>('BACKLOG');
  sprints = signal([{ id:'s1', name:'S1'}]);
  groupBy = signal<'NONE'|'ASSIGNEE'|'EPIC'|'SUBTASK'>('NONE');
}

describe('BoardToolbar', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardToolbar],
      providers: [{ provide: BoardStore, useClass: StoreMock }]
    }).compileComponents();
  });

  it('onSearch updates store.search', () => {
    const fixture = TestBed.createComponent(BoardToolbar);
    const cmp = fixture.componentInstance;
    cmp.onSearch({ target: { value: 'foo' } } as any);
    const store = TestBed.inject(BoardStore) as any as StoreMock;
    expect(store.search()).toBe('foo');
  });

  it('selectSprint updates selectedSprintId', () => {
    const fixture = TestBed.createComponent(BoardToolbar);
    const cmp = fixture.componentInstance;
    cmp.selectSprint('s1');
    const store = TestBed.inject(BoardStore) as any as StoreMock;
    expect(store.selectedSprintId()).toBe('s1');
  });

  it('getSprintLabel returns names and Backlog', () => {
    const fixture = TestBed.createComponent(BoardToolbar);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    expect(cmp.getSprintLabel('BACKLOG')).toBe('Backlog');
    expect(cmp.getSprintLabel('s1')).toBe('S1');
    expect(cmp.getSprintLabel('unknown')).toBe('Select Sprint');

    // empty sprints case
    store.sprints.set([]);
    expect(cmp.getSprintLabel('s1')).toBe('Select Sprint');
  });

  it('getGroupByLabel maps values', () => {
    const fixture = TestBed.createComponent(BoardToolbar);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    store.groupBy.set('ASSIGNEE');
    expect(cmp.getGroupByLabel()).toBe('Assignee');
    store.groupBy.set('EPIC');
    expect(cmp.getGroupByLabel()).toBe('Epic');
    store.groupBy.set('SUBTASK');
    expect(cmp.getGroupByLabel()).toBe('Sub Task');
    store.groupBy.set('NONE');
    expect(cmp.getGroupByLabel()).toBe('None');
  });
});
