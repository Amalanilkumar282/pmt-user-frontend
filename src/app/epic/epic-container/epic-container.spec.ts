import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EpicContainer } from './epic-container';
import { Epic } from '../../shared/models/epic.model';

describe('EpicContainer', () => {
  let component: EpicContainer;
  let fixture: ComponentFixture<EpicContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpicContainer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EpicContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with epics from dummy data', () => {
    expect(component.epics).toBeDefined();
    expect(component.epics.length).toBeGreaterThan(0);
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
    component.newEpicName = 'Test Epic Name';
    spyOn(component.epicCreated, 'emit');
    
    component.createEpic();
    
    expect(component.epics.length).toBe(initialLength + 1);
    expect(component.epics[initialLength].name).toBe('Test Epic Name');
    expect(component.epicCreated.emit).toHaveBeenCalled();
    expect(component.isCreating).toBe(false);
    expect(component.newEpicName).toBe('');
  });

  it('should trim whitespace when creating epic', () => {
    const initialLength = component.epics.length;
    component.newEpicName = '  Test Epic  ';
    
    component.createEpic();
    
    expect(component.epics[initialLength].name).toBe('Test Epic');
  });

  it('should not create epic if name is empty', () => {
    const initialLength = component.epics.length;
    component.newEpicName = '';
    
    component.createEpic();
    
    expect(component.epics.length).toBe(initialLength);
  });

  it('should not create epic if name contains only whitespace', () => {
    const initialLength = component.epics.length;
    component.newEpicName = '   ';
    
    component.createEpic();
    
    expect(component.epics.length).toBe(initialLength);
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
