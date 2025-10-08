import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EpicList } from './epic-list';
import { Epic } from '../../shared/models/epic.model';

describe('EpicList', () => {
  let component: EpicList;
  let fixture: ComponentFixture<EpicList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpicList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EpicList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default epic values', () => {
    expect(component.epic).toBeDefined();
    expect(component.epic.id).toBe('');
    expect(component.epic.name).toBe('');
    expect(component.epic.isExpanded).toBe(false);
  });

  it('should emit toggleExpand event when onToggleExpand is called', () => {
    component.epic = {
      id: 'epic-123',
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
    spyOn(component.toggleExpand, 'emit');

    component.onToggleExpand();

    expect(component.toggleExpand.emit).toHaveBeenCalledWith('epic-123');
  });

  it('should emit viewDetails event when onViewDetails is called', () => {
    component.epic = {
      id: 'epic-456',
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
    spyOn(component.viewDetails, 'emit');

    component.onViewDetails();

    expect(component.viewDetails.emit).toHaveBeenCalledWith('epic-456');
  });

  it('should return empty string when formatDate is called with null', () => {
    const result = component.formatDate(null);
    expect(result).toBe('');
  });

  it('should format date correctly when valid date is provided', () => {
    const date = new Date('2024-03-15');
    const result = component.formatDate(date);
    expect(result).toContain('March');
    expect(result).toContain('2024');
  });

  it('should accept epic input and set it correctly', () => {
    const testEpic: Epic = {
      id: 'epic-789',
      name: 'Input Test Epic',
      description: 'Test description',
      startDate: new Date('2024-01-01'),
      dueDate: new Date('2024-12-31'),
      progress: 50,
      issueCount: 10,
      isExpanded: true,
      assignee: 'John Doe',
      labels: ['feature'],
      parent: 'None',
      team: 'Team A',
      sprint: 'Sprint 1',
      storyPoints: 8,
      reporter: 'Jane Smith',
      status: 'IN_PROGRESS',
      childWorkItems: []
    };

    component.epic = testEpic;
    fixture.detectChanges();

    expect(component.epic.id).toBe('epic-789');
    expect(component.epic.name).toBe('Input Test Epic');
    expect(component.epic.progress).toBe(50);
    expect(component.epic.issueCount).toBe(10);
    expect(component.epic.isExpanded).toBe(true);
  });
});
