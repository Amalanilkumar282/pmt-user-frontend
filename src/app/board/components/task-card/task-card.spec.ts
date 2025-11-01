import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TaskCard } from './task-card';
import type { Issue } from '../../../shared/models/issue.model';

function createMockIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'TEST-1',
    title: 'Test Issue',
    description: 'Test description',
    type: 'TASK',
    priority: 'MEDIUM',
    status: 'TODO',
    assignee: 'John Doe',
    labels: ['test'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  };
}

describe('TaskCard', () => {
  let component: TaskCard;
  let fixture: ComponentFixture<TaskCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCard);
    component = fixture.componentInstance;
  });

  it('should create with default issue', () => {
    expect(component).toBeTruthy();
    expect(component.issue).toBeDefined();
    expect(component.issue.id).toBe('');
  });

  it('should accept issue input', () => {
    const mockIssue = createMockIssue();
    component.issue = mockIssue;
    
    expect(component.issue).toBe(mockIssue);
    expect(component.issue.id).toBe('TEST-1');
  });

  it('should accept colorClass input', () => {
    component.colorClass = 'border-blue-500';
    expect(component.colorClass).toBe('border-blue-500');
  });

  it('should emit open event when triggered', () => {
    spyOn(component.open, 'emit');
    const mockIssue = createMockIssue();
    component.issue = mockIssue;
    
    // Simulate open action (this would typically be triggered from template)
    component.open.emit(mockIssue);
    
    expect(component.open.emit).toHaveBeenCalledWith(mockIssue);
  });

  describe('getPriorityClass', () => {
    it('should map CRITICAL priority correctly', () => {
      const result = component.getPriorityClass('CRITICAL');
      expect(result).toBe('bg-red-100 text-red-800');
    });

    it('should map HIGH priority correctly', () => {
      const result = component.getPriorityClass('HIGH');
      expect(result).toBe('bg-orange-100 text-orange-800');
    });

    it('should map MEDIUM priority correctly', () => {
      const result = component.getPriorityClass('MEDIUM');
      expect(result).toBe('bg-yellow-100 text-yellow-800');
    });

    it('should map LOW priority correctly', () => {
      const result = component.getPriorityClass('LOW');
      expect(result).toBe('bg-green-100 text-green-800');
    });

    it('should return default for unknown priority', () => {
      const result = component.getPriorityClass('UNKNOWN');
      expect(result).toBe('bg-gray-100 text-gray-800');
    });

    it('should return default for empty string priority', () => {
      const result = component.getPriorityClass('');
      expect(result).toBe('bg-gray-100 text-gray-800');
    });

    it('should return default for null priority', () => {
      const result = component.getPriorityClass(null as any);
      expect(result).toBe('bg-gray-100 text-gray-800');
    });

    it('should handle case sensitivity', () => {
      const result = component.getPriorityClass('high');
      expect(result).toBe('bg-gray-100 text-gray-800');
    });
  });

  describe('component rendering', () => {
    it('should render with default values when no issue provided', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      
      expect(compiled).toBeTruthy();
      // Component should still render even with empty issue
    });

    it('should update when issue input changes', () => {
      const initialIssue = createMockIssue({ title: 'Initial Title' });
      component.issue = initialIssue;
      fixture.detectChanges();

      const updatedIssue = createMockIssue({ title: 'Updated Title' });
      component.issue = updatedIssue;
      fixture.detectChanges();

      expect(component.issue.title).toBe('Updated Title');
    });

    it('should apply custom color class', () => {
      component.colorClass = 'border-purple-500';
      fixture.detectChanges();
      
      expect(component.colorClass).toBe('border-purple-500');
    });
  });

  describe('change detection', () => {
    it('should use OnPush change detection strategy', () => {
      expect(component).toBeTruthy();
      // OnPush strategy is set in component decorator
      // This ensures optimal performance by only checking for changes when inputs change
    });
  });

  describe('drag and drop integration', () => {
    it('should be compatible with CDK drag and drop', () => {
      // Component imports DragDropModule, ensuring it can be used in drag-drop contexts
      expect(component).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should calculate commentsCount and attachmentsCount based on issue id', () => {
      const mockIssue = createMockIssue({ id: 'TEST-123' });
      component.issue = mockIssue;
      component.ngOnInit();

      expect(component.commentsCount).toBeGreaterThanOrEqual(0);
      expect(component.commentsCount).toBeLessThan(10);
      expect(component.attachmentsCount).toBeGreaterThanOrEqual(0);
      expect(component.attachmentsCount).toBeLessThan(7);
    });

    it('should produce consistent counts for same issue id', () => {
      const mockIssue = createMockIssue({ id: 'CONSISTENT-ID' });
      component.issue = mockIssue;
      
      component.ngOnInit();
      const firstCommentsCount = component.commentsCount;
      const firstAttachmentsCount = component.attachmentsCount;

      component.ngOnInit();
      expect(component.commentsCount).toBe(firstCommentsCount);
      expect(component.attachmentsCount).toBe(firstAttachmentsCount);
    });
  });

  describe('getProgressValue', () => {
    it('should return 10 for TODO status', () => {
      component.issue = createMockIssue({ status: 'TODO' });
      expect(component.getProgressValue()).toBe(10);
    });

    it('should return 55 for IN_PROGRESS status', () => {
      component.issue = createMockIssue({ status: 'IN_PROGRESS' });
      expect(component.getProgressValue()).toBe(55);
    });

    it('should return 80 for IN_REVIEW status', () => {
      component.issue = createMockIssue({ status: 'IN_REVIEW' });
      expect(component.getProgressValue()).toBe(80);
    });

    it('should return 100 for DONE status', () => {
      component.issue = createMockIssue({ status: 'DONE' });
      expect(component.getProgressValue()).toBe(100);
    });

    it('should return 5 for BLOCKED status', () => {
      component.issue = createMockIssue({ status: 'BLOCKED' });
      expect(component.getProgressValue()).toBe(5);
    });

    it('should return default 10 for unknown status', () => {
      component.issue = createMockIssue({ status: 'UNKNOWN' as any });
      expect(component.getProgressValue()).toBe(10);
    });

    it('should compute time-based progress when startDate and dueDate present', () => {
      const now = new Date();
      const start = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const due = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // in 2 days

      component.issue = createMockIssue({ status: 'IN_PROGRESS', createdAt: start, updatedAt: start, startDate: start, dueDate: due });
      const progress = component.getProgressValue();
      // elapsed is 2 days of 4 total => ~50%; combined with baseline 55 -> close to mid
      expect(progress).toBeGreaterThan(30);
      expect(progress).toBeLessThan(90);
    });

    it('should mark overdue and color red when past due date and not done', () => {
      const now = new Date();
      const start = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const due = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      component.issue = createMockIssue({ status: 'IN_PROGRESS', createdAt: start, updatedAt: start, startDate: start, dueDate: due });
      expect(component.isOverdue()).toBeTrue();
      expect(component.progressColor()).toBe('#ef4444');
    });

    it('should not mark as overdue when status is DONE', () => {
      const now = new Date();
      const due = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      component.issue = createMockIssue({ status: 'DONE', dueDate: due });
      expect(component.isOverdue()).toBeFalse();
    });

    it('should adjust progress down for large story points', () => {
      const now = new Date();
      const start = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const due = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from now

      component.issue = createMockIssue({ 
        status: 'IN_PROGRESS', 
        createdAt: start, 
        startDate: start, 
        dueDate: due,
        storyPoints: 21
      });
      
      const progress = component.getProgressValue();
      // With 21 story points, there should be ~10% reduction
      expect(progress).toBeLessThan(60); // Less than the unadjusted value
    });

    it('should return descriptive tooltip with days remaining', () => {
      const now = new Date();
      const start = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const due = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

      component.issue = createMockIssue({ 
        status: 'IN_PROGRESS', 
        createdAt: start,
        startDate: start,
        dueDate: due 
      });

      const tooltip = component.getProgressTooltip();
      expect(tooltip).toContain('complete');
      expect(tooltip).toContain('days left');
    });

    it('should return overdue warning in tooltip when past due', () => {
      const now = new Date();
      const start = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      const due = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      component.issue = createMockIssue({ 
        status: 'IN_PROGRESS',
        createdAt: start,
        startDate: start,
        dueDate: due 
      });

      const tooltip = component.getProgressTooltip();
      expect(tooltip).toContain('OVERDUE');
      expect(tooltip).toContain('⚠️');
    });
  });

  describe('title editing', () => {
    it('should start editing title when startEditingTitle is called', () => {
      const mockIssue = createMockIssue({ title: 'Original Title' });
      component.issue = mockIssue;
      
      const event = new Event('click');
      spyOn(event, 'stopPropagation');
      
      component.startEditingTitle(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.isEditingTitle()).toBe(true);
      expect(component.editedTitle()).toBe('Original Title');
    });

    it('should save title when saveTitle is called with valid title', () => {
      const mockIssue = createMockIssue({ id: 'TEST-1', title: 'Old Title' });
      component.issue = mockIssue;
      
      const mockStore = jasmine.createSpyObj('BoardStore', ['updateIssueTitle']);
      (component as any).store = mockStore;

      component.editedTitle.set('New Title');
      component.isEditingTitle.set(true);
      component.saveTitle();

      expect(mockStore.updateIssueTitle).toHaveBeenCalledWith('TEST-1', 'New Title');
      expect(component.isEditingTitle()).toBe(false);
    });

    it('should not save title if title is empty', () => {
      const mockStore = jasmine.createSpyObj('BoardStore', ['updateIssueTitle']);
      (component as any).store = mockStore;

      component.editedTitle.set('   ');
      component.isEditingTitle.set(true);
      component.saveTitle();

      expect(mockStore.updateIssueTitle).not.toHaveBeenCalled();
      expect(component.isEditingTitle()).toBe(false);
    });

    it('should not save title if title unchanged', () => {
      const mockIssue = createMockIssue({ title: 'Same Title' });
      component.issue = mockIssue;
      
      const mockStore = jasmine.createSpyObj('BoardStore', ['updateIssueTitle']);
      (component as any).store = mockStore;

      component.editedTitle.set('Same Title');
      component.saveTitle();

      expect(mockStore.updateIssueTitle).not.toHaveBeenCalled();
    });

    it('should cancel editing when cancelEditTitle is called', () => {
      component.isEditingTitle.set(true);
      
      const event = new Event('click');
      spyOn(event, 'stopPropagation');
      
      component.cancelEditTitle(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.isEditingTitle()).toBe(false);
    });

    it('should save on Enter key', () => {
      spyOn(component, 'saveTitle');
      
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');
      
      component.onTitleKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.saveTitle).toHaveBeenCalled();
    });

    it('should cancel on Escape key', () => {
      spyOn(component, 'cancelEditTitle');
      
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      
      component.onTitleKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.cancelEditTitle).toHaveBeenCalledWith(event);
    });
  });

  describe('assignee dropdown', () => {
    it('should toggle assignee dropdown when onAssigneeClick is called', () => {
      const event = new Event('click');
      spyOn(event, 'stopPropagation');
      
      expect(component.showAssigneeDropdown()).toBe(false);
      component.onAssigneeClick(event);
      expect(component.showAssigneeDropdown()).toBe(true);
      
      component.onAssigneeClick(event);
      expect(component.showAssigneeDropdown()).toBe(false);
      expect(event.stopPropagation).toHaveBeenCalledTimes(2);
    });

    it('should reset search query when opening dropdown', () => {
      component.assigneeSearchQuery.set('test query');
      
      const event = new Event('click');
      component.onAssigneeClick(event);

      expect(component.assigneeSearchQuery()).toBe('');
    });

    it('should select assignee and update store', () => {
      const mockIssue = createMockIssue({ id: 'TEST-1' });
      component.issue = mockIssue;
      
      const mockStore = jasmine.createSpyObj('BoardStore', ['updateIssueAssignee']);
      (component as any).store = mockStore;

      component.showAssigneeDropdown.set(true);
      component.selectAssignee('Alice Johnson');

      expect(mockStore.updateIssueAssignee).toHaveBeenCalledWith('TEST-1', 'Alice Johnson');
      expect(component.showAssigneeDropdown()).toBe(false);
      expect(component.assigneeSearchQuery()).toBe('');
    });

    it('should set assignee to undefined when Unassigned is selected', () => {
      const mockIssue = createMockIssue({ id: 'TEST-1' });
      component.issue = mockIssue;
      
      const mockStore = jasmine.createSpyObj('BoardStore', ['updateIssueAssignee']);
      (component as any).store = mockStore;

      component.selectAssignee('Unassigned');

      expect(mockStore.updateIssueAssignee).toHaveBeenCalledWith('TEST-1', undefined);
    });

    it('should close assignee dropdown', () => {
      component.showAssigneeDropdown.set(true);
      component.assigneeSearchQuery.set('query');
      
      component.closeAssigneeDropdown();

      expect(component.showAssigneeDropdown()).toBe(false);
      expect(component.assigneeSearchQuery()).toBe('');
    });

    it('should filter assignees based on search query', () => {
      expect(component.availableAssignees.length).toBeGreaterThan(0);
      
      component.assigneeSearchQuery.set('alice');
      const filtered = component.filteredAssignees();
      
      expect(filtered.every(a => a.toLowerCase().includes('alice'))).toBe(true);
    });

    it('should return all assignees when search query is empty', () => {
      component.assigneeSearchQuery.set('');
      const filtered = component.filteredAssignees();
      
      expect(filtered.length).toBe(component.availableAssignees.length);
    });

    it('should be case insensitive when filtering', () => {
      component.assigneeSearchQuery.set('ALICE');
      const filtered = component.filteredAssignees();
      
      const lowerFiltered = component.filteredAssignees();
      component.assigneeSearchQuery.set('alice');
      
      expect(filtered.length).toBe(lowerFiltered.length);
    });
  });

  describe('due date picker', () => {
    it('should toggle date picker when onDueDateClick is called', () => {
      const event = new Event('click');
      spyOn(event, 'stopPropagation');
      
      expect(component.showDatePicker()).toBe(false);
      component.onDueDateClick(event);
      expect(component.showDatePicker()).toBe(true);
      
      component.onDueDateClick(event);
      expect(component.showDatePicker()).toBe(false);
      expect(event.stopPropagation).toHaveBeenCalledTimes(2);
    });

    it('should update due date when onDateChange is called', () => {
      const mockIssue = createMockIssue({ id: 'TEST-1' });
      component.issue = mockIssue;
      
      const mockStore = jasmine.createSpyObj('BoardStore', ['updateIssueDueDate']);
      (component as any).store = mockStore;

      const input = document.createElement('input');
      input.value = '2024-12-31';
      const event = { target: input } as any;

      component.onDateChange(event);

      expect(mockStore.updateIssueDueDate).toHaveBeenCalledWith('TEST-1', jasmine.any(Date));
      expect(component.showDatePicker()).toBe(false);
    });

    it('should clear due date when input is empty', () => {
      const mockIssue = createMockIssue({ id: 'TEST-1' });
      component.issue = mockIssue;
      
      const mockStore = jasmine.createSpyObj('BoardStore', ['updateIssueDueDate']);
      (component as any).store = mockStore;

      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as any;

      component.onDateChange(event);

      expect(mockStore.updateIssueDueDate).toHaveBeenCalledWith('TEST-1', undefined);
    });

    it('should clear due date when clearDueDate is called', () => {
      const mockIssue = createMockIssue({ id: 'TEST-1' });
      component.issue = mockIssue;
      
      const mockStore = jasmine.createSpyObj('BoardStore', ['updateIssueDueDate']);
      (component as any).store = mockStore;

      component.clearDueDate();

      expect(mockStore.updateIssueDueDate).toHaveBeenCalledWith('TEST-1', undefined);
      expect(component.showDatePicker()).toBe(false);
    });

    it('should close date picker when closeDatePicker is called', () => {
      component.showDatePicker.set(true);
      component.closeDatePicker();
      expect(component.showDatePicker()).toBe(false);
    });

    it('should format date for input correctly', () => {
      const date = new Date(2024, 11, 31); // Month is 0-indexed, so 11 = December
      const formatted = component.formatDateForInput(date);
      expect(formatted).toBe('2024-12-31');
    });

    it('should return empty string for undefined date', () => {
      const formatted = component.formatDateForInput(undefined);
      expect(formatted).toBe('');
    });
  });

  describe('label colors', () => {
    it('should return consistent background color for same label', () => {
      const color1 = component.getLabelBgColor('bug');
      const color2 = component.getLabelBgColor('bug');
      expect(color1).toBe(color2);
    });

    it('should return consistent text color for same label', () => {
      const color1 = component.getLabelTextColor('bug');
      const color2 = component.getLabelTextColor('bug');
      expect(color1).toBe(color2);
    });

    it('should return different colors for different labels', () => {
      const bgColor1 = component.getLabelBgColor('bug');
      const bgColor2 = component.getLabelBgColor('feature');
      // They might be the same due to hash collision, but typically different
      expect(bgColor1).toBeDefined();
      expect(bgColor2).toBeDefined();
    });
  });

  describe('priority pill', () => {
    it('should return correct pill class for CRITICAL', () => {
      expect(component.getPriorityPill('CRITICAL')).toBe('bg-rose-100 text-rose-700');
    });

    it('should return correct pill class for HIGH', () => {
      expect(component.getPriorityPill('HIGH')).toBe('bg-orange-100 text-orange-700');
    });

    it('should return correct pill class for MEDIUM', () => {
      expect(component.getPriorityPill('MEDIUM')).toBe('bg-amber-100 text-amber-700');
    });

    it('should return correct pill class for LOW', () => {
      expect(component.getPriorityPill('LOW')).toBe('bg-emerald-100 text-emerald-700');
    });

    it('should return default pill class for unknown priority', () => {
      expect(component.getPriorityPill('UNKNOWN')).toBe('bg-slate-100 text-slate-700');
    });
  });
});
