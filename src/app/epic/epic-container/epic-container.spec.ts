import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EpicContainer } from './epic-container';
import { Epic } from '../../shared/models/epic.model';
import { HttpClientModule } from '@angular/common/http';
import { EpicService } from '../../shared/services/epic.service';
import { ToastService } from '../../shared/services/toast.service';
import { of, throwError } from 'rxjs';

describe('EpicContainer', () => {
  let component: EpicContainer;
  let fixture: ComponentFixture<EpicContainer>;
  let mockEpicService: jasmine.SpyObj<EpicService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  const mockEpics: Epic[] = [
    {
      id: 'epic-1',
      name: 'Test Epic 1',
      description: 'Test description',
      startDate: null,
      dueDate: null,
      progress: 0,
      issueCount: 0,
      isExpanded: false,
      assignee: 'Unassigned',
      labels: [],
      parent: 'None',
      team: 'None',
      sprint: 'None',
      storyPoints: 0,
      reporter: 'Unassigned',
      status: 'TODO',
      childWorkItems: []
    },
    {
      id: 'epic-2',
      name: 'Test Epic 2',
      description: 'Test description 2',
      startDate: null,
      dueDate: null,
      progress: 50,
      issueCount: 5,
      isExpanded: false,
      assignee: 'Unassigned',
      labels: [],
      parent: 'None',
      team: 'None',
      sprint: 'None',
      storyPoints: 10,
      reporter: 'Unassigned',
      status: 'IN_PROGRESS',
      childWorkItems: []
    }
  ];

  beforeEach(async () => {
    mockEpicService = jasmine.createSpyObj('EpicService', [
      'getAllEpicsByProject',
      'createEpic',
      'getCurrentUserId'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);

    // Setup default mock responses
    mockEpicService.getAllEpicsByProject.and.returnValue(of(mockEpics));
    mockEpicService.getCurrentUserId.and.returnValue(1);

    await TestBed.configureTestingModule({
      imports: [EpicContainer, HttpClientModule],
      providers: [
        { provide: EpicService, useValue: mockEpicService },
        { provide: ToastService, useValue: mockToastService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EpicContainer);
    component = fixture.componentInstance;
    component.projectId = 'test-project-1';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with epics from dummy data', () => {
    expect(component.epics).toBeDefined();
    expect(component.epics.length).toBe(2); // mockEpics has 2 items
    expect(mockEpicService.getAllEpicsByProject).toHaveBeenCalledWith('test-project-1');
  });

  it('should initialize with isCreating as false', () => {
    expect(component.isCreating).toBe(false);
  });

  it('should toggle expand state of an epic', () => {
    const mockEpic: Epic = {
      id: 'test-epic-1',
      name: 'Test Epic',
      description: '',
      startDate: null,
      dueDate: null,
      progress: 0,
      issueCount: 0,
      isExpanded: false,
      assignee: 'Unassigned',
      labels: [],
      parent: 'None',
      team: 'None',
      sprint: 'None',
      storyPoints: 0,
      reporter: 'Unassigned',
      status: 'TODO',
      childWorkItems: []
    };
    component.epics = [mockEpic];
    
    component.onToggleExpand('test-epic-1');
    
    expect(component.epics[0].isExpanded).toBe(true);
  });

  it('should toggle expand from true to false', () => {
    const mockEpic: Epic = {
      id: 'test-epic-1',
      name: 'Test Epic',
      description: '',
      startDate: null,
      dueDate: null,
      progress: 0,
      issueCount: 0,
      isExpanded: true,
      assignee: 'Unassigned',
      labels: [],
      parent: 'None',
      team: 'None',
      sprint: 'None',
      storyPoints: 0,
      reporter: 'Unassigned',
      status: 'TODO',
      childWorkItems: []
    };
    component.epics = [mockEpic];
    
    component.onToggleExpand('test-epic-1');
    
    expect(component.epics[0].isExpanded).toBe(false);
  });

  it('should emit viewDetails event when onViewDetails is called', () => {
    spyOn(component.viewDetails, 'emit');
    
    component.onViewDetails('epic-123');
    
    expect(component.viewDetails.emit).toHaveBeenCalledWith('epic-123');
  });

  it('should set isCreating to true when startCreatingEpic is called', fakeAsync(() => {
    component.startCreatingEpic();
    tick();
    
    expect(component.isCreating).toBe(true);
    expect(component.newEpicName).toBe('');
  }));

  it('should cancel creating epic if name is empty', () => {
    component.isCreating = true;
    component.newEpicName = '';
    
    component.cancelCreatingEpic();
    
    expect(component.isCreating).toBe(false);
  });

  it('should not cancel creating epic if name has value', () => {
    component.isCreating = true;
    component.newEpicName = 'New Epic';
    
    component.cancelCreatingEpic();
    
    expect(component.isCreating).toBe(true);
  });

  it('should create new epic when createEpic is called with valid name', () => {
    const initialLength = component.epics.length;
    const newEpic: Epic = {
      id: 'new-epic-1',
      name: 'Test Epic Name',
      description: '',
      startDate: null,
      dueDate: null,
      progress: 0,
      issueCount: 0,
      isExpanded: true,
      assignee: 'Unassigned',
      labels: [],
      parent: 'None',
      team: 'None',
      sprint: 'None',
      storyPoints: 0,
      reporter: 'Unassigned',
      status: 'TODO',
      childWorkItems: []
    };
    
    mockEpicService.createEpic.and.returnValue(of(newEpic));
    component.newEpicName = 'Test Epic Name';
    spyOn(component.epicCreated, 'emit');
    
    component.createEpic();
    
    expect(component.epics.length).toBe(initialLength + 1);
    expect(component.epics[initialLength].name).toBe('Test Epic Name');
    expect(component.epicCreated.emit).toHaveBeenCalledWith(newEpic);
    expect(component.isCreating).toBe(false);
    expect(component.newEpicName).toBe('');
    expect(mockToastService.success).toHaveBeenCalledWith('Epic created successfully');
  });

  it('should trim whitespace when creating epic', () => {
    const initialLength = component.epics.length;
    const newEpic: Epic = {
      id: 'new-epic-2',
      name: 'Test Epic',
      description: '',
      startDate: null,
      dueDate: null,
      progress: 0,
      issueCount: 0,
      isExpanded: true,
      assignee: 'Unassigned',
      labels: [],
      parent: 'None',
      team: 'None',
      sprint: 'None',
      storyPoints: 0,
      reporter: 'Unassigned',
      status: 'TODO',
      childWorkItems: []
    };
    
    mockEpicService.createEpic.and.returnValue(of(newEpic));
    component.newEpicName = '  Test Epic  ';
    
    component.createEpic();
    
    expect(mockEpicService.createEpic).toHaveBeenCalled();
    const callArgs = mockEpicService.createEpic.calls.mostRecent().args[0];
    expect(callArgs.title).toBe('Test Epic'); // Verify trimmed value was sent
    expect(component.epics[initialLength].name).toBe('Test Epic');
  });

  it('should not create epic if name is empty', () => {
    const initialLength = component.epics.length;
    component.newEpicName = '';
    
    component.createEpic();
    
    expect(component.epics.length).toBe(initialLength);
    expect(mockEpicService.createEpic).not.toHaveBeenCalled();
    expect(mockToastService.error).toHaveBeenCalledWith('Epic name is required');
  });

  it('should not create epic if name contains only whitespace', () => {
    const initialLength = component.epics.length;
    component.newEpicName = '   ';
    
    component.createEpic();
    
    expect(component.epics.length).toBe(initialLength);
    expect(mockEpicService.createEpic).not.toHaveBeenCalled();
    expect(mockToastService.error).toHaveBeenCalledWith('Epic name is required');
  });

  it('should create epic when Enter key is pressed', () => {
    component.newEpicName = 'New Epic from Enter';
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(event, 'preventDefault');
    spyOn(component, 'createEpic');
    
    component.onKeyDown(event);
    
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.createEpic).toHaveBeenCalled();
  });

  it('should cancel creating epic when Escape key is pressed', () => {
    component.isCreating = true;
    component.newEpicName = 'Test';
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    spyOn(event, 'preventDefault');
    
    component.onKeyDown(event);
    
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.isCreating).toBe(false);
    expect(component.newEpicName).toBe('');
  });

  it('should handle input blur by canceling after delay', fakeAsync(() => {
    component.isCreating = true;
    component.newEpicName = '';
    
    component.onInputBlur();
    tick(200);
    
    expect(component.isCreating).toBe(false);
  }));

  it('should emit closeEpicPanel event when onClose is called', () => {
    spyOn(component.closeEpicPanel, 'emit');
    
    component.onClose();
    
    expect(component.closeEpicPanel.emit).toHaveBeenCalled();
  });
});
