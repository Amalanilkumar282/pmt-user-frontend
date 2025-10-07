import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardColumn } from './board-column';
import { BoardStore } from '../../board-store';
import type { Issue } from '../../../shared/models/issue.model';

describe('BoardColumn', () => {
  let component: BoardColumn;
  let fixture: ComponentFixture<BoardColumn>;
  let store: BoardStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardColumn],
      providers: [BoardStore]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardColumn);
    component = fixture.componentInstance;
    store = TestBed.inject(BoardStore);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('drop should call store.updateIssueStatus when moving across containers', () => {
    const spy = spyOn(store, 'updateIssueStatus');
    const issue: Issue = { id: 't1', title: 'T', description: '', status: 'TODO', createdAt: new Date(0), updatedAt: new Date(0), type: 'TASK', priority: 'LOW' };
    const event: any = {
      previousContainer: { data: [issue] },
      container: { data: [] },
      previousIndex: 0,
      currentIndex: 0
    };
    component.def = { id: 'IN_PROGRESS', title: 'In Progress' } as any;
    component.drop(event);
    expect(spy).toHaveBeenCalledWith('t1', 'IN_PROGRESS');
  });
});
