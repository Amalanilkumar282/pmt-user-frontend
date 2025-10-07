import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BoardPage } from './board-page';
import { BoardStore } from '../../board-store';
import { SidebarStateService } from '../../../shared/services/sidebar-state.service';

class SidebarStateServiceMock {
  isCollapsed = signal(false);
  toggleCollapse = jasmine.createSpy('toggleCollapse').and.callFake(() =>
    this.isCollapsed.set(!this.isCollapsed())
  );
}

class BoardStoreMock {
  sprints = signal<any[]>([{ id:'s1', name:'Sprint 1', startDate: new Date(), endDate: new Date(), status: 'ACTIVE', issues: [] }]);
  columnBuckets = signal<any[]>([]);
  loadData = jasmine.createSpy('loadData');
  addBacklog = jasmine.createSpy('addBacklog');
  selectSprint = jasmine.createSpy('selectSprint');
}

describe('BoardPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardPage]
    });

    // Ensure inject() calls inside the component get our concrete mocks
    TestBed.overrideProvider(SidebarStateService, { useValue: new SidebarStateServiceMock() });
    TestBed.overrideProvider(BoardStore, { useValue: new BoardStoreMock() });

    // Prevent the real template from instantiating child components that need many providers
    TestBed.overrideComponent(BoardPage as any, {
      set: { template: '<div></div>' }
    });

    await TestBed.compileComponents();
  });


  it('creates and wires signals', () => {
    const fixture = TestBed.createComponent(BoardPage);
    const cmp = fixture.componentInstance;
    expect(cmp).toBeTruthy();
    expect(typeof cmp.isSidebarCollapsed()).toBe('boolean');
    const store = TestBed.inject(BoardStore) as any as BoardStoreMock;
    expect(cmp.sprints()).toEqual(store.sprints());
  });

  it('ngOnInit bootstraps data and selects sprint', () => {
    const fixture = TestBed.createComponent(BoardPage);
    const store = TestBed.inject(BoardStore) as unknown as BoardStoreMock;
    // Call ngOnInit manually to avoid instantiating child components in the test
    fixture.componentInstance.ngOnInit();

    expect(store.loadData).toHaveBeenCalled();
    expect(store.addBacklog).toHaveBeenCalled();
    expect(store.selectSprint).toHaveBeenCalledWith('active-1');
  });

  it('onToggleSidebar toggles', () => {
    const fixture = TestBed.createComponent(BoardPage);
    const cmp = fixture.componentInstance;
    const svc = TestBed.inject(SidebarStateService) as any;
    cmp.onToggleSidebar();
    expect(svc.toggleCollapse).toHaveBeenCalled();
  });
});
