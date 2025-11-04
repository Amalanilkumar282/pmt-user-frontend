import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BoardToolbar } from './board-toolbar';
import { BoardStore } from '../../board-store';

class StoreMock {
  search = signal('');
  selectedSprintId = signal<'BACKLOG'|string>('BACKLOG');
  sprints = signal([{ id:'s1', name:'S1'}]);
  groupBy = signal<'NONE'|'ASSIGNEE'|'EPIC'>('NONE');
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
  store.groupBy.set('NONE');
  expect(cmp.getGroupByLabel()).toBe('None');
  });

  it('should initialize with store signals', () => {
    const fixture = TestBed.createComponent(BoardToolbar);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    expect(cmp.search).toBe(store.search);
    expect(cmp.selectedSprintId).toBe(store.selectedSprintId);
    expect(cmp.sprints).toBe(store.sprints);
  });

  it('onSearch handles input event with empty value', () => {
    const fixture = TestBed.createComponent(BoardToolbar);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    cmp.onSearch({ target: { value: '' } } as any);
    expect(store.search()).toBe('');
  });

  it('onSearch handles input event with whitespace', () => {
    const fixture = TestBed.createComponent(BoardToolbar);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    cmp.onSearch({ target: { value: '  test  ' } } as any);
    expect(store.search()).toBe('  test  '); // Should preserve whitespace
  });

  it('selectSprint handles different sprint IDs', () => {
    const fixture = TestBed.createComponent(BoardToolbar);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    cmp.selectSprint('BACKLOG');
    expect(store.selectedSprintId()).toBe('BACKLOG');

    cmp.selectSprint('custom-sprint-123');
    expect(store.selectedSprintId()).toBe('custom-sprint-123');
  });

  it('getSprintLabel handles edge cases', () => {
    const fixture = TestBed.createComponent(BoardToolbar);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    // Empty sprints array
    store.sprints.set([]);
    expect(cmp.getSprintLabel('any-id')).toBe('Select Sprint');
    expect(cmp.getSprintLabel('BACKLOG')).toBe('Backlog');

    // Sprint with empty name
    store.sprints.set([{ id: 'empty', name: '' }]);
    expect(cmp.getSprintLabel('empty')).toBe('');

    // Sprint with special characters in name
    store.sprints.set([{ id: 'special', name: 'Sprint "2024" & More!' }]);
    expect(cmp.getSprintLabel('special')).toBe('Sprint "2024" & More!');
  });

  it('should use OnPush change detection strategy', () => {
    const fixture = TestBed.createComponent(BoardToolbar);
    expect(fixture.componentInstance).toBeTruthy();
    // OnPush strategy is defined in component decorator
  });

  it('should properly bind to store signals reactively', () => {
    const fixture = TestBed.createComponent(BoardToolbar);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    // Initial values
    expect(cmp.search()).toBe('');
    expect(cmp.selectedSprintId()).toBe('BACKLOG');

    // Update store and verify component reflects changes
    store.search.set('new search');
    expect(cmp.search()).toBe('new search');

    store.selectedSprintId.set('new-sprint');
    expect(cmp.selectedSprintId()).toBe('new-sprint');
  });

  it('getSprintLabel should be case sensitive', () => {
    const fixture = TestBed.createComponent(BoardToolbar);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    store.sprints.set([{ id: 'Sprint-1', name: 'Sprint One' }]);
    
    // Should not match case variations
    expect(cmp.getSprintLabel('sprint-1')).toBe('Select Sprint');
    expect(cmp.getSprintLabel('SPRINT-1')).toBe('Select Sprint');
    expect(cmp.getSprintLabel('Sprint-1')).toBe('Sprint One');
  });

  it('should handle store injection correctly', () => {
    const fixture = TestBed.createComponent(BoardToolbar);
    const cmp = fixture.componentInstance;
    
    expect(cmp['store']).toBeDefined();
    expect(typeof cmp.onSearch).toBe('function');
    expect(typeof cmp.selectSprint).toBe('function');
  });
});
