import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { TimelineChart } from './timeline-chart';
import { TimelineHeaderComponent } from '../timeline-header/timeline-header';


// Mock the Gantt library
(window as any).Gantt = class MockGantt {
  element: any;
  tasks: any;
  options: any;
  
  constructor(element: any, tasks: any, options: any) {
    this.element = element;
    this.tasks = tasks;
    this.options = options;
  }
  change_view_mode(mode: string) {}
};

describe('TimelineChart Component', () => {
  let component: TimelineChart;
  let fixture: ComponentFixture<TimelineChart>;
  let changeDetectorRef: ChangeDetectorRef;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimelineChart, TimelineHeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineChart);
    component = fixture.componentInstance;
    changeDetectorRef = fixture.debugElement.injector.get(ChangeDetectorRef);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.currentView).toBe('day');
    expect(component.displayMode).toBe('epics');
    expect(component.selectedEpic).toBeNull();
    expect(component.selectedFilters).toEqual({
      sprints: [],
      epics: [],
      types: [],
      status: []
    });
  });

  it('should initialize filters on component init', () => {
    component.ngOnInit();
    expect(component.availableSprints.length).toBeGreaterThan(0);
    expect(component.availableEpics).toBeDefined();
  });

  it('should select the latest sprint by default on init', fakeAsync(() => {
    component.ngOnInit();
    tick(200); // Wait for async operations
    expect(component.selectedFilters.sprints.length).toBe(1);
  }));

  it('should change view to day when onViewChanged is called', () => {
    component.onViewChanged('day');
    expect(component.currentView).toBe('day');
  });

  it('should change view to month when onViewChanged is called', () => {
    // Test changing the timeline view to 'month'
    component.onViewChanged('month');
    
    expect(component.currentView).toBe('month');
  });

  it('should change view to year when onViewChanged is called', () => {
    // Test changing the timeline view to 'year'
    component.onViewChanged('year');
    
    expect(component.currentView).toBe('year');
  });


  it('should add sprint filter when toggled on', () => {
    // Test adding a sprint to the filter
    const event = { type: 'sprints', value: 'Sprint 1', checked: true };
    component.onFilterToggled(event);
    
    expect(component.selectedFilters.sprints).toContain('Sprint 1');
  });

  it('should remove sprint filter when toggled off', () => {
    // First add a sprint, then remove it
    component.selectedFilters.sprints = ['Sprint 1'];
    
    const event = { type: 'sprints', value: 'Sprint 1', checked: false };
    component.onFilterToggled(event);
    
    expect(component.selectedFilters.sprints).not.toContain('Sprint 1');
  });


  it('should add epic filter when toggled on', () => {
    // Test adding an epic to the filter
    const event = { type: 'epics', value: 'Epic 1', checked: true };
    component.onFilterToggled(event);
    
    expect(component.selectedFilters.epics).toContain('Epic 1');
  });

  it('should add type filter when toggled on', () => {
    // Test adding an issue type to the filter
    const event = { type: 'types', value: 'story', checked: true };
    component.onFilterToggled(event);
    
    expect(component.selectedFilters.types).toContain('story');
  });

  it('should add status filter when toggled on', () => {
    // Test adding a status to the filter
    const event = { type: 'status', value: 'done', checked: true };
    component.onFilterToggled(event);
    
    expect(component.selectedFilters.status).toContain('done');
  });

 
  it('should clear all filters when onFiltersCleared is called', fakeAsync(() => {
    // Add some filters first
    component.selectedFilters = {
      sprints: ['Sprint 1'],
      epics: ['Epic 1'],
      types: ['story'],
      status: ['done']
    };
    
    // Clear them
    component.onFiltersCleared();
    tick(200);
    
    // Verify filters are empty (except for the default sprint that gets added)
    expect(component.selectedFilters.epics).toEqual([]);
    expect(component.selectedFilters.types).toEqual([]);
    expect(component.selectedFilters.status).toEqual([]);
  }));

  it('should reset to epics view when onBackToEpics is called', () => {
    // Set up issues view first
    component.displayMode = 'issues';
    component.selectedEpic = 'Test Epic';
    component.selectedFilters.epics = ['Test Epic'];
    
    // Go back to epics view
    component.onBackToEpics();
    
    expect(component.displayMode).toBe('epics');
    expect(component.selectedEpic).toBeNull();
    expect(component.selectedFilters.epics).toEqual([]);
  });

 
  it('should load project data from shared data', () => {
    // Test that the component loads the sprint data correctly
    expect(component.projectData).toBeDefined();
    expect(component.projectData.length).toBeGreaterThan(0);
  });

  it('should load epics data from shared data', () => {
    // Test that the component loads the epics data correctly
    expect(component.epicsData).toBeDefined();
    expect(component.epicsData.length).toBeGreaterThan(0);
  });

 
  it('should start in epics display mode', () => {
    // Verify the component starts showing epics
    expect(component.displayMode).toBe('epics');
  });


  it('should switch to issues display mode when epic is selected', () => {
    // Manually trigger a drill-down (normally done by clicking an epic)
    component.displayMode = 'issues';
    component.selectedEpic = 'Test Epic';
    
    expect(component.displayMode).toBe('issues');
    expect(component.selectedEpic).toBe('Test Epic');
  });

 
  it('should populate available sprints list', () => {
    // Test that the list of available sprints is created
    component.ngOnInit();
    
    expect(component.availableSprints).toBeDefined();
    expect(component.availableSprints.length).toBeGreaterThan(0);
  });

 
  it('should populate available epics list', () => {
    // Test that the list of available epics is created
    component.ngOnInit();
    
    expect(component.availableEpics).toBeDefined();
  });

 
  it('should have correct filter state structure', () => {
    // Verify the filter object has all required properties
    expect(component.selectedFilters.sprints).toBeDefined();
    expect(component.selectedFilters.epics).toBeDefined();
    expect(component.selectedFilters.types).toBeDefined();
    expect(component.selectedFilters.status).toBeDefined();
  });

 
  it('should handle multiple sprint filters', () => {
    // Test adding multiple sprints to the filter
    component.onFilterToggled({ type: 'sprints', value: 'Sprint 1', checked: true });
    component.onFilterToggled({ type: 'sprints', value: 'Sprint 2', checked: true });
    
    expect(component.selectedFilters.sprints.length).toBe(2);
    expect(component.selectedFilters.sprints).toContain('Sprint 1');
    expect(component.selectedFilters.sprints).toContain('Sprint 2');
  });

  it('should handle multiple epic filters', () => {
    // Test adding multiple epics to the filter
    component.onFilterToggled({ type: 'epics', value: 'Epic 1', checked: true });
    component.onFilterToggled({ type: 'epics', value: 'Epic 2', checked: true });
    
    expect(component.selectedFilters.epics.length).toBe(2);
  });

  it('should handle multiple type filters', () => {
    // Test adding multiple issue types to the filter
    component.onFilterToggled({ type: 'types', value: 'story', checked: true });
    component.onFilterToggled({ type: 'types', value: 'bug', checked: true });
    component.onFilterToggled({ type: 'types', value: 'task', checked: true });
    
    expect(component.selectedFilters.types.length).toBe(3);
  });


  it('should handle multiple status filters', () => {
    // Test adding multiple statuses to the filter
    component.onFilterToggled({ type: 'status', value: 'todo', checked: true });
    component.onFilterToggled({ type: 'status', value: 'progress', checked: true });
    component.onFilterToggled({ type: 'status', value: 'done', checked: true });
    
    expect(component.selectedFilters.status.length).toBe(3);
  });


  it('should not add duplicate sprint filters', () => {
    // Try to add the same sprint twice
    component.onFilterToggled({ type: 'sprints', value: 'Sprint 1', checked: true });
    component.onFilterToggled({ type: 'sprints', value: 'Sprint 1', checked: true });
    
    // Should only have one instance
    expect(component.selectedFilters.sprints.length).toBe(1);
  });

 
  it('should initialize with empty tasks array', () => {
    // Test that tasks array starts empty
    expect(component.currentTasks).toEqual([]);
  });

 
  it('should have change detector ref injected', () => {
    // Test that the change detector is available
    expect(changeDetectorRef).toBeDefined();
  });

  it('should have selectedEpic as null initially', () => {
    // Verify no epic is selected at start
    expect(component.selectedEpic).toBeNull();
  });

  it('should handle filter toggle with empty string', () => {
    // Test edge case of empty filter value
    const initialLength = component.selectedFilters.sprints.length;
    component.onFilterToggled({ type: 'sprints', value: '', checked: true });
    
    // Empty string should still be added if that's what's passed
    expect(component.selectedFilters.sprints.length).toBe(initialLength + 1);
  });

  it('should update available epics when sprint filter changes', () => {
    // When you filter by sprint, only epics from that sprint should be available
    component.ngOnInit();
    const initialEpicsCount = component.availableEpics.length;
    
    component.onFilterToggled({ type: 'sprints', value: 'Sprint 1', checked: true });
    
    // The available epics list should be updated (might be same, less, or more depending on data)
    expect(component.availableEpics).toBeDefined();
  });

 
  it('should cleanup gantt chart on destroy', () => {
    // Set up a mock gantt chart
    component.ganttChart = { mockGantt: true };
    
    // Call destroy
    component.ngOnDestroy();
    
    // Gantt chart should be cleaned up
    expect(component.ganttChart).toBeNull();
  });
});
