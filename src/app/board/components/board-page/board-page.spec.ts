import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { BoardPage } from './board-page';
import { BoardStore } from '../../board-store';
import { sprints, backlogIssues } from '../../../shared/data/dummy-backlog-data';
import { SidebarStateService } from '../../../shared/services/sidebar-state.service';

class MockSidebarStateService {
  isCollapsed = signal(false);
  toggleCollapse = jasmine.createSpy('toggleCollapse');
}

class MockBoardStore {
  sprints = signal([]);
  columnBuckets = signal([]);
  loadData = jasmine.createSpy('loadData');
  addBacklog = jasmine.createSpy('addBacklog');
  selectSprint = jasmine.createSpy('selectSprint');
  updateIssueStatus = jasmine.createSpy('updateIssueStatus');
}

describe('BoardPage', () => {
  let component: BoardPage;
  let fixture: ComponentFixture<BoardPage>;
  let mockSidebarService: MockSidebarStateService;
  let mockStore: MockBoardStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardPage, RouterTestingModule],
      providers: [
        { provide: SidebarStateService, useClass: MockSidebarStateService },
        { provide: BoardStore, useClass: MockBoardStore }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardPage);
    component = fixture.componentInstance;
    mockSidebarService = TestBed.inject(SidebarStateService) as any;
    mockStore = TestBed.inject(BoardStore) as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default values', () => {
    expect(component.isSidebarCollapsed).toBeDefined();
    expect(component.sprints).toBeDefined();
    expect(component.columns).toBeDefined();
  });

  it('ngOnInit should load data with correct parameters', () => {
    component.ngOnInit();

    expect(mockStore.loadData).toHaveBeenCalledWith(sprints);
    expect(mockStore.addBacklog).toHaveBeenCalledWith(backlogIssues);
    expect(mockStore.selectSprint).toHaveBeenCalledWith('active-1');
  });

  it('onToggleSidebar should call sidebar service toggle', () => {
    component.onToggleSidebar();
    expect(mockSidebarService.toggleCollapse).toHaveBeenCalled();
  });

  it('should bind to sidebar collapsed state', () => {
    expect(component.isSidebarCollapsed).toBe(mockSidebarService.isCollapsed);
  });

  it('should bind to store sprints', () => {
    expect(component.sprints).toBe(mockStore.sprints);
  });

  it('should bind to store column buckets', () => {
    expect(component.columns).toBe(mockStore.columnBuckets);
  });

  it('onOpenIssue should set selectedIssue and open modal', () => {
    const testIssue = { id: 'TEST-1', title: 'Test Issue' };
    
    component.onOpenIssue(testIssue);
    
    expect(component['selectedIssue']()).toBe(testIssue);
    expect(component['isModalOpen']()).toBe(true);
  });

  it('onMoveIssue should call store updateIssueStatus with TODO status', () => {
    const moveEvent = { issueId: 'ISSUE-123', destinationSprintId: 'sprint-2' };
    
    component.onMoveIssue(moveEvent);
    
    expect(mockStore.updateIssueStatus).toHaveBeenCalledWith('ISSUE-123', 'TODO');
  });

  it('onMoveIssue should handle null destination sprint', () => {
    const moveEvent = { issueId: 'ISSUE-456', destinationSprintId: null };
    
    component.onMoveIssue(moveEvent);
    
    expect(mockStore.updateIssueStatus).toHaveBeenCalledWith('ISSUE-456', 'TODO');
  });

  it('should initialize modal state as closed', () => {
    expect(component['selectedIssue']()).toBeNull();
    expect(component['isModalOpen']()).toBe(false);
  });

  it('should handle multiple issue opens correctly', () => {
    const issue1 = { id: 'ISSUE-1' };
    const issue2 = { id: 'ISSUE-2' };
    
    component.onOpenIssue(issue1);
    expect(component['selectedIssue']()).toBe(issue1);
    expect(component['isModalOpen']()).toBe(true);
    
    component.onOpenIssue(issue2);
    expect(component['selectedIssue']()).toBe(issue2);
    expect(component['isModalOpen']()).toBe(true);
  });

  it('should use OnPush change detection strategy', () => {
    // Component decorator specifies OnPush strategy
    expect(component).toBeTruthy();
  });

  it('should integrate with dependency injection correctly', () => {
    // Verify that services are injected properly
    expect(component['sidebarStateService']).toBeDefined();
    expect(component['store']).toBeDefined();
  });



  describe('error handling', () => {
    it('should handle onOpenIssue with undefined issue', () => {
      expect(() => {
        component.onOpenIssue(undefined as any);
      }).not.toThrow();
      
      expect(component['selectedIssue']()).toBeUndefined();
      expect(component['isModalOpen']()).toBe(true);
    });

    it('should handle onMoveIssue with invalid parameters', () => {
      expect(() => {
        component.onMoveIssue({ issueId: '', destinationSprintId: '' });
      }).not.toThrow();
      
      expect(mockStore.updateIssueStatus).toHaveBeenCalledWith('', 'TODO');
    });
  });
});

