import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardPage } from './board-page';
import { BoardStore } from '../../board-store';
import { sprints, backlogIssues } from '../../../shared/data/dummy-backlog-data';

describe('BoardPage', () => {
  let component: BoardPage;
  let fixture: ComponentFixture<BoardPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should load data and select a sprint', () => {
    const store = TestBed.inject(BoardStore);
    const loadSpy = spyOn(store, 'loadData').and.callThrough();
    const addBacklogSpy = spyOn(store, 'addBacklog').and.callThrough();
    const selectSpy = spyOn(store, 'selectSprint').and.callThrough();

    component.ngOnInit();

    expect(loadSpy).toHaveBeenCalled();
    expect(addBacklogSpy).toHaveBeenCalled();
    expect(selectSpy).toHaveBeenCalled();
  });
});
