import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { GroupByMenu } from './group-by-menu';
import { BoardStore } from '../../board-store';

class StoreMock {
  groupBy = signal<'NONE'|'ASSIGNEE'|'EPIC'|'SUBTASK'>('NONE');
}

describe('GroupByMenu', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupByMenu],
      providers: [{ provide: BoardStore, useClass: StoreMock }]
    }).compileComponents();
  });

  it('getCurrentLabel reflects current groupBy', () => {
    const fixture = TestBed.createComponent(GroupByMenu);
    const cmp = fixture.componentInstance;
    expect(cmp.getCurrentLabel()).toBe('None');
    (TestBed.inject(BoardStore) as any as StoreMock).groupBy.set('ASSIGNEE');
    expect(cmp.getCurrentLabel()).toBe('Assignee');
  });

  it('toggle and selectOption set value and close menu', () => {
    const fixture = TestBed.createComponent(GroupByMenu);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;

    cmp.toggleMenu();
    expect(cmp.isOpen).toBeTrue();

    cmp.selectOption('EPIC');
    expect(store.groupBy()).toBe('EPIC');
    expect(cmp.isOpen).toBeFalse();
  });

  it('isSelected checks equality', () => {
    const fixture = TestBed.createComponent(GroupByMenu);
    const cmp = fixture.componentInstance;
    const store = TestBed.inject(BoardStore) as any as StoreMock;
    store.groupBy.set('SUBTASK');
    expect(cmp.isSelected('SUBTASK')).toBeTrue();
    expect(cmp.isSelected('NONE')).toBeFalse();
  });
});
