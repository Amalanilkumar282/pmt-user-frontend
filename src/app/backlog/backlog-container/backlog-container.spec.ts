import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BacklogContainer } from './backlog-container';
import { Issue } from '../../shared/models/issue.model';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

describe('BacklogContainer', () => {
  let component: BacklogContainer;
  let fixture: ComponentFixture<BacklogContainer>;

  const mockIssues: Issue[] = [
    {
      id: 'issue-1',
      title: 'Issue 1',
      description: 'Test',
      type: 'STORY',
      priority: 'HIGH',
      status: 'TODO',
      labels: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'issue-2',
      title: 'Issue 2',
      description: 'Test',
      type: 'TASK',
      priority: 'MEDIUM',
      status: 'TODO',
      labels: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BacklogContainer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BacklogContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty issues', () => {
    expect(component.issues).toEqual([]);
  });

  it('should toggle collapse state', () => {
    expect(component['isCollapsed']()).toBe(false);
    component.toggleCollapse();
    expect(component['isCollapsed']()).toBe(true);
    component.toggleCollapse();
    expect(component['isCollapsed']()).toBe(false);
  });

  it('should open modal when issue is clicked', () => {
    const issue = mockIssues[0];
    component.onIssueClick(issue);
    
    expect(component['selectedIssue']()).toEqual(issue);
    expect(component['isModalOpen']()).toBe(true);
  });

  it('should close modal', (done) => {
    component.onIssueClick(mockIssues[0]);
    expect(component['isModalOpen']()).toBe(true);
    
    component.onCloseModal();
    expect(component['isModalOpen']()).toBe(false);
    
    setTimeout(() => {
      expect(component['selectedIssue']()).toBeNull();
      done();
    }, 350);
  });

  it('should delete issue and adjust pagination', () => {
    component.issues = [...mockIssues];
    component.currentPage = 1;
    
    component.onDeleteIssue('issue-1');
    
    expect(component.issues.length).toBe(1);
    expect(component.issues.find(i => i.id === 'issue-1')).toBeUndefined();
  });

  it('should adjust current page when deleting last item on page', () => {
    component.issues = [mockIssues[0]];
    component.currentPage = 2;
    component.itemsPerPage = 1;
    
    component.onDeleteIssue('issue-1');
    
    expect(component.currentPage).toBe(1);
  });

  it('should calculate totalPages correctly', () => {
    component.issues = Array.from({ length: 25 }, (_, i) => ({
      ...mockIssues[0],
      id: `issue-${i}`
    }));
    component.itemsPerPage = 10;
    
    expect(component.totalPages).toBe(3);
  });

  it('should calculate startItem correctly', () => {
    component.issues = mockIssues;
    component.currentPage = 1;
    component.itemsPerPage = 10;
    
    expect(component.startItem).toBe(1);
  });

  it('should return 0 for startItem when no issues', () => {
    component.issues = [];
    expect(component.startItem).toBe(0);
  });

  it('should calculate endItem correctly', () => {
    component.issues = mockIssues;
    component.currentPage = 1;
    component.itemsPerPage = 10;
    
    expect(component.endItem).toBe(2);
  });

  it('should paginate issues correctly', async () => {
    component.issues = Array.from({ length: 15 }, (_, i) => ({
      ...mockIssues[0],
      id: `issue-${i}`
    }));
    component.currentPage = 1;
    component.itemsPerPage = 10;

    // In some test environments Angular signals/computeds evaluate lazily.
    // Call detectChanges and await whenStable in a retry loop with a
    // tiny delay so the computed value has a chance to materialize.
    let paginated = [] as any[];
    for (let attempt = 0; attempt < 10; attempt++) {
      fixture.detectChanges();
      // wait for any pending microtasks/macrotasks to settle
      // whenStable resolves when async tasks are done in the fixture's zone
      // add a short timeout to allow any queued callbacks to run
      // (this is intentionally tiny to keep tests fast)
      // eslint-disable-next-line no-await-in-loop
      await fixture.whenStable();
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 5));
      // read computed signal
      paginated = component['paginatedIssues']();
      if (paginated.length > 0) break;
    }

    expect(paginated.length).toBe(10);
  });

  it('should reset to first page when changing items per page', () => {
    component.currentPage = 3;
    component.onItemsPerPageChange();
    expect(component.currentPage).toBe(1);
  });

  it('should navigate to next page', () => {
    component.issues = Array.from({ length: 25 }, (_, i) => ({
      ...mockIssues[0],
      id: `issue-${i}`
    }));
    component.currentPage = 1;
    component.itemsPerPage = 10;
    
    component.nextPage();
    expect(component.currentPage).toBe(2);
  });

  it('should not go beyond last page', () => {
    component.issues = mockIssues;
    component.currentPage = 1;
    component.itemsPerPage = 10;
    
    component.nextPage();
    expect(component.currentPage).toBe(1);
  });

  it('should navigate to previous page', () => {
    component.currentPage = 2;
    component.previousPage();
    expect(component.currentPage).toBe(1);
  });

  it('should not go below first page', () => {
    component.currentPage = 1;
    component.previousPage();
    expect(component.currentPage).toBe(1);
  });

  it('should navigate to first page', () => {
    component.currentPage = 5;
    component.goToFirstPage();
    expect(component.currentPage).toBe(1);
  });

  it('should navigate to last page', () => {
    component.issues = Array.from({ length: 30 }, (_, i) => ({
      ...mockIssues[0],
      id: `issue-${i}`
    }));
    component.itemsPerPage = 10;
    component.currentPage = 1;
    
    component.goToLastPage();
    expect(component.currentPage).toBe(3);
  });

  it('should emit moveIssue event', () => {
    spyOn(component.moveIssue, 'emit');
    const event = { issueId: 'issue-1', destinationSprintId: 'sprint-1' };
    
    component.onMoveIssue(event);
    
    expect(component.moveIssue.emit).toHaveBeenCalledWith(event);
  });

  it('should handle drop event and emit moveIssue with null sprintId', () => {
    spyOn(component.moveIssue, 'emit');
    const mockDropEvent = {
      item: {
        data: mockIssues[0]
      }
    } as CdkDragDrop<Issue[]>;
    
    component.onDrop(mockDropEvent);
    
    expect(component.moveIssue.emit).toHaveBeenCalledWith({
      issueId: 'issue-1',
      destinationSprintId: null
    });
  });

  it('should set currentPage through property', () => {
    component.currentPage = 5;
    expect(component.currentPage).toBe(5);
  });

  it('should set itemsPerPage through property', () => {
    component.itemsPerPage = 20;
    expect(component.itemsPerPage).toBe(20);
  });
});
