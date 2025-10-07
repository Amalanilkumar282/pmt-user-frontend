import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardSearch } from './board-search';
import { BoardStore } from '../../board-store';

describe('BoardSearch', () => {
  let component: BoardSearch;
  let fixture: ComponentFixture<BoardSearch>;
  let store: BoardStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardSearch],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardSearch);
    component = fixture.componentInstance;
    store = TestBed.inject(BoardStore);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onInput should call store.setSearch', () => {
    const spy = spyOn(store, 'setSearch');
    const input = { target: { value: 'query' } } as any as Event;
    component.onInput(input);
    expect(spy).toHaveBeenCalledWith('query');
  });
});
