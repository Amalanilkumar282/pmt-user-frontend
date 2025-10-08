import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EpicDetailedView } from './epic-detailed-view';
import { Epic } from '../../shared/models/epic.model';
import { Issue } from '../../shared/models/issue.model';

describe('EpicDetailedView', () => {
  let component: EpicDetailedView;
  let fixture: ComponentFixture<EpicDetailedView>;

  const mockEpic: Epic = {
    id: 'epic-1',
    name: 'Test Epic',
    description: 'Test Description',
    startDate: new Date('2024-01-01'),
    dueDate: new Date('2024-12-31'),
    progress: 50,
    issueCount: 5,
    isExpanded: true,
    assignee: 'John Doe',
    labels: ['feature'],
    parent: 'None',
    team: 'Team A',
    sprint: 'Sprint 1',
    storyPoints: 20,
    reporter: 'Jane Smith',
    status: 'IN_PROGRESS',
    childWorkItems: ['item-1', 'item-2']
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpicDetailedView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EpicDetailedView);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default epic values', () => {
    fixture.detectChanges();
    expect(component.epic).toBeDefined();
    expect(component.epic.assignee).toBe('Unassigned');
    expect(component.epic.labels).toEqual([]);
  });

  it('should load work items for epic-1', () => {
    component.epic = { ...mockEpic, id: 'epic-1' };
    component.ngOnInit();
    expect(component.workItems).toBeDefined();
    expect(component.workItems.length).toBeGreaterThan(0);
  });

  it('should load work items for epic-2', () => {
    component.epic = { ...mockEpic, id: 'epic-2' };
    component.ngOnInit();
    expect(component.workItems).toBeDefined();
    expect(component.workItems.length).toBeGreaterThan(0);
  });

  it('should load empty work items for unknown epic', () => {
    component.epic = { ...mockEpic, id: 'epic-unknown' };
    component.ngOnInit();
    expect(component.workItems).toEqual([]);
  });

  it('should initialize epic defaults on ngOnInit', () => {
    component.epic = {
      id: 'test',
      name: 'Test',
      description: '',
      startDate: null,
      dueDate: null,
      progress: 0,
      issueCount: 0,
      isExpanded: false,
      assignee: '',
      labels: [],
      parent: '',
      team: '',
      sprint: '',
      storyPoints: undefined,
      reporter: '',
      childWorkItems: [],
      status: ''
    } as any;

    component.ngOnInit();

    expect(component.epic.assignee).toBe('Unassigned');
    expect(component.epic.reporter).toBe('Unassigned');
    expect(component.epic.parent).toBe('None');
    expect(component.epic.team).toBe('None');
    expect(component.epic.sprint).toBe('None');
    expect(component.epic.status).toBe('TODO');
    expect(component.epic.storyPoints).toBe(0);
  });

  it('should emit close event when onClose is called', () => {
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should update epic and emit event when onEpicUpdated is called', () => {
    spyOn(component.epicUpdated, 'emit');
    const updatedEpic: Epic = { ...mockEpic, name: 'Updated Epic' };
    
    component.onEpicUpdated(updatedEpic);
    
    expect(component.epic.name).toBe('Updated Epic');
    expect(component.epicUpdated.emit).toHaveBeenCalledWith(updatedEpic);
  });

  it('should update work items and emit event when onWorkItemsChanged is called', () => {
    component.epic = mockEpic;
    spyOn(component.epicUpdated, 'emit');
    const newWorkItems: Issue[] = [
      {
        id: 'item-1',
        title: 'Work Item 1',
        description: 'Description 1',
        type: 'TASK',
        priority: 'MEDIUM',
        status: 'TODO',
        assignee: 'John Doe',
        storyPoints: 3,
        labels: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    component.onWorkItemsChanged(newWorkItems);

    expect(component.workItems).toEqual(newWorkItems);
    expect(component.epic.childWorkItems).toEqual(['item-1']);
    expect(component.epic.issueCount).toBe(1);
    expect(component.epicUpdated.emit).toHaveBeenCalled();
  });

  it('should create new work item and emit event when onWorkItemCreated is called', () => {
    component.epic = mockEpic;
    component.workItems = [];
    spyOn(component.epicUpdated, 'emit');
    
    const newWorkItem: Issue = {
      id: 'temp-id',
      title: 'New Work Item',
      description: '',
      type: 'TASK',
      priority: 'MEDIUM',
      status: 'TODO',
      labels: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    component.onWorkItemCreated(newWorkItem);

    expect(component.workItems.length).toBe(1);
    expect(component.workItems[0].title).toBe('New Work Item');
    expect(component.workItems[0].epicId).toBe('epic-1');
    expect(component.epic.issueCount).toBe(1);
    expect(component.epicUpdated.emit).toHaveBeenCalled();
  });

  it('should initialize childWorkItems array if undefined when creating work item', () => {
    component.epic = { ...mockEpic, childWorkItems: undefined } as any;
    const newWorkItem: Issue = {
      id: 'temp-id',
      title: 'New Work Item',
      description: '',
      type: 'TASK',
      priority: 'MEDIUM',
      status: 'TODO',
      labels: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    component.onWorkItemCreated(newWorkItem);

    expect(component.epic.childWorkItems).toBeDefined();
    expect(component.epic.childWorkItems!.length).toBeGreaterThan(0);
  });

  it('should set default values for new work item', () => {
    component.epic = mockEpic;
    const newWorkItem: Issue = {
      id: 'temp-id',
      title: 'Test Item',
      description: 'Test Description',
      type: 'STORY',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      labels: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    component.onWorkItemCreated(newWorkItem);

    const createdItem = component.workItems[0];
    expect(createdItem.priority).toBe('MEDIUM');
    expect(createdItem.status).toBe('TODO');
    expect(createdItem.assignee).toBe('Unassigned');
    expect(createdItem.storyPoints).toBe(0);
    expect(createdItem.description).toBe('');
  });
});
