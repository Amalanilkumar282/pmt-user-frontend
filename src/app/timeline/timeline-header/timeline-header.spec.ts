import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { TimelineHeaderComponent, FilterState, StatusOption } from './timeline-header';

describe('TimelineHeaderComponent', () => {
  let component: TimelineHeaderComponent;
  let fixture: ComponentFixture<TimelineHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimelineHeaderComponent, HttpClientModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default values', () => {
    expect(component.currentView).toBe('day');
    expect(component.displayMode).toBe('epics');
    expect(component.selectedEpic).toBeNull();
    expect(component.availableEpics).toEqual([]);
    expect(component.selectedFilters).toEqual({
      epics: [],
      types: [],
      status: []
    });
  });

  it('should emit viewChanged event when time scale buttons are clicked', () => {
    spyOn(component.viewChanged, 'emit');

    component.changeTimeScale('month');
    expect(component.viewChanged.emit).toHaveBeenCalledWith('month');

    component.changeTimeScale('year');
    expect(component.viewChanged.emit).toHaveBeenCalledWith('year');

    component.changeTimeScale('day');
    expect(component.viewChanged.emit).toHaveBeenCalledWith('day');
  });

  it('should emit filterToggled event when filters are toggled', () => {
    spyOn(component.filterToggled, 'emit');

    const mockEvent = { target: { checked: true } } as unknown as Event;
    
    component.toggleFilter('epics', 'Epic 1', mockEvent);
    expect(component.filterToggled.emit).toHaveBeenCalledWith({
      type: 'epics',
      value: 'Epic 1',
      checked: true
    });

    const mockEvent2 = { target: { checked: false } } as unknown as Event;
    component.toggleFilter('types', 'bug', mockEvent2);
    expect(component.filterToggled.emit).toHaveBeenCalledWith({
      type: 'types',
      value: 'bug',
      checked: false
    });
  });

  it('should emit filtersCleared event when clear filters is called', () => {
    spyOn(component.filtersCleared, 'emit');

    component.clearFilters();
    expect(component.filtersCleared.emit).toHaveBeenCalled();
  });

  it('should emit backToEpics event when back button is clicked', () => {
    spyOn(component.backToEpics, 'emit');

    component.onBackToEpics();
    expect(component.backToEpics.emit).toHaveBeenCalled();
  });

  it('should calculate filter counts correctly', () => {
    component.selectedFilters = {
      epics: ['Epic A', 'Epic B'],
      types: ['story', 'bug'],
      status: ['todo']
    };

    expect(component.getFilterCount('epics')).toBe(2);
    expect(component.getFilterCount('types')).toBe(2);
    expect(component.getFilterCount('status')).toBe(1);
  });

  it('should toggle dropdown visibility and close others', () => {
    // Create mock DOM elements without appending to document body
    const mockButton = document.createElement('button');
    const mockDropdown = document.createElement('div');
    mockDropdown.classList.add('filter-dropdown');
    
    const otherDropdown = document.createElement('div');
    otherDropdown.classList.add('filter-dropdown', 'show');

    // Mock querySelectorAll to return our test dropdowns
    spyOn(document, 'querySelectorAll').and.returnValue([
      mockDropdown, 
      otherDropdown
    ] as any);

    const mockEvent = {
      stopPropagation: jasmine.createSpy('stopPropagation'),
      currentTarget: mockButton
    } as any;

    // Set nextElementSibling to mockDropdown
    Object.defineProperty(mockButton, 'nextElementSibling', {
      value: mockDropdown,
      writable: true
    });

    component.toggleDropdown(mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockDropdown.classList.contains('show')).toBe(true);
    expect(otherDropdown.classList.contains('show')).toBe(false);
  });

  it('should close all dropdowns when clicking outside', () => {
    const dropdown1 = document.createElement('div');
    const dropdown2 = document.createElement('div');
    dropdown1.classList.add('filter-dropdown', 'show');
    dropdown2.classList.add('filter-dropdown', 'show');

    // Mock querySelectorAll to return our test dropdowns
    spyOn(document, 'querySelectorAll').and.returnValue([
      dropdown1, 
      dropdown2
    ] as any);

    const mockEvent = { 
      target: document.createElement('div') // Create a neutral element
    } as any;

    spyOn(mockEvent.target, 'closest').and.returnValue(null);

    component.onDocumentClick(mockEvent);

    expect(dropdown1.classList.contains('show')).toBe(false);
    expect(dropdown2.classList.contains('show')).toBe(false);
  });

  it('should keep dropdown open when clicking inside dropdown container', () => {
    const dropdown = document.createElement('div');
    dropdown.classList.add('filter-dropdown', 'show');
    const container = document.createElement('div');
    container.classList.add('relative');
    container.appendChild(dropdown);

    // Mock querySelectorAll to return our test dropdown
    spyOn(document, 'querySelectorAll').and.returnValue([dropdown] as any);

    const mockEvent = { 
      target: dropdown 
    } as any;

    // Mock closest to return the container (simulating click inside dropdown)
    spyOn(mockEvent.target, 'closest').and.returnValue(container);

    component.onDocumentClick(mockEvent);

    expect(dropdown.classList.contains('show')).toBe(true);
  });

  it('should accept input properties correctly', () => {
    const testFilters: FilterState = {
      epics: ['Epic A', 'Epic B'],
      types: ['story'],
      status: ['done']
    };

    component.currentView = 'month';
    component.displayMode = 'issues';
    component.selectedEpic = 'Test Epic';
    component.availableEpics = ['Epic 1', 'Epic 2', 'Epic 3'];
    component.selectedFilters = testFilters;

    fixture.detectChanges();

    expect(component.currentView).toBe('month');
    expect(component.displayMode).toBe('issues');
    expect(component.selectedEpic).toBe('Test Epic');
    expect(component.availableEpics).toEqual(['Epic 1', 'Epic 2', 'Epic 3']);
    expect(component.selectedFilters).toEqual(testFilters);
  });

  it('should have all output event emitters defined and functional', () => {
    expect(component.viewChanged).toBeDefined();
    expect(component.filterToggled).toBeDefined();
    expect(component.filtersCleared).toBeDefined();
    expect(component.backToEpics).toBeDefined();

    // Test that they are actually EventEmitter instances
    expect(component.viewChanged.emit).toBeDefined();
    expect(component.filterToggled.emit).toBeDefined();
    expect(component.filtersCleared.emit).toBeDefined();
    expect(component.backToEpics.emit).toBeDefined();
  });

  it('should filter epics based on search query', () => {
    component.availableEpics = ['Epic Alpha', 'Epic Beta', 'Gamma Epic', 'Delta Project'];
    
    // Test with no search query
    component.epicSearchQuery = '';
    expect(component.getFilteredEpics()).toEqual(['Epic Alpha', 'Epic Beta', 'Gamma Epic', 'Delta Project']);
    
    // Test with search query
    component.epicSearchQuery = 'epic';
    expect(component.getFilteredEpics()).toEqual(['Epic Alpha', 'Epic Beta', 'Gamma Epic']);
    
    // Test case-insensitive search
    component.epicSearchQuery = 'BETA';
    expect(component.getFilteredEpics()).toEqual(['Epic Beta']);
    
    // Test with no matches
    component.epicSearchQuery = 'xyz';
    expect(component.getFilteredEpics()).toEqual([]);
  });

  it('should update epic search query on input change', () => {
    const mockEvent = {
      target: { value: 'test query' }
    } as any;
    
    component.onEpicSearchChange(mockEvent);
    expect(component.epicSearchQuery).toBe('test query');
  });

  it('should clear epic search query', () => {
    component.epicSearchQuery = 'some search';
    component.clearEpicSearch();
    expect(component.epicSearchQuery).toBe('');
  });

  it('should return all status options with defaults first', () => {
    component.statusOptions = [
      { id: 1, statusName: 'IN_PROGRESS', displayName: '', value: '' },
      { id: 2, statusName: 'CUSTOM_STATUS', displayName: '', value: '' }
    ];
    
    const allStatuses = component.getAllStatusOptions();
    
    // Should have 3 defaults + 1 custom (IN_PROGRESS is duplicate)
    expect(allStatuses.length).toBe(4);
    expect(allStatuses[0].statusName).toBe('TODO');
    expect(allStatuses[1].statusName).toBe('IN_PROGRESS');
    expect(allStatuses[2].statusName).toBe('DONE');
    expect(allStatuses[3].statusName).toBe('CUSTOM_STATUS');
  });

  it('should format status names correctly', () => {
    expect(component.formatStatusName('IN_PROGRESS')).toBe('In Progress');
    expect(component.formatStatusName('TODO')).toBe('To Do');
    expect(component.formatStatusName('DONE')).toBe('Done');
    expect(component.formatStatusName('CUSTOM_STATUS')).toBe('Custom Status');
  });

  it('should get correct status values for filtering', () => {
    expect(component.getStatusValue('TODO')).toBe('todo');
    expect(component.getStatusValue('IN_PROGRESS')).toBe('progress');
    expect(component.getStatusValue('DONE')).toBe('done');
    expect(component.getStatusValue('IN_REVIEW')).toBe('review');
    expect(component.getStatusValue('BLOCKED')).toBe('blocked');
    expect(component.getStatusValue('CUSTOM_STATUS')).toBe('customstatus');
  });
});