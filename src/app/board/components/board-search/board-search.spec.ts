import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BoardSearch } from './board-search';
import { BoardStore } from '../../board-store';

class StoreMock {
  search = signal('');
  setSearch = jasmine.createSpy('setSearch').and.callFake((v: string) => this.search.set(v));
}

describe('BoardSearch', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardSearch],
      providers: [{ provide: BoardStore, useClass: StoreMock }]
    }).compileComponents();
  });

  it('onInput updates search signal', () => {
    const fixture = TestBed.createComponent(BoardSearch);
    const cmp = fixture.componentInstance;
    const inputEvt = { target: { value: 'abc' } } as unknown as Event;
    cmp.onInput(inputEvt);
    const store = TestBed.inject(BoardStore) as any as StoreMock;
    expect(store.setSearch).toHaveBeenCalledWith('abc');
    expect(store.search()).toBe('abc');
  });
});
