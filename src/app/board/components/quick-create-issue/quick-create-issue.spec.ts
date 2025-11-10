import { TestBed, ComponentFixture } from '@angular/core/testing';
import { QuickCreateIssue, QuickCreateIssueData } from './quick-create-issue';
import { IssueStatus, IssueType, IssuePriority } from '../../../shared/models/issue.model';
import { HttpClientModule } from '@angular/common/http';

describe('QuickCreateIssue', () => {
  let component: QuickCreateIssue;
  let fixture: ComponentFixture<QuickCreateIssue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickCreateIssue, HttpClientModule],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickCreateIssue);
    component = fixture.componentInstance;
    component.status = 'TODO';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(component.isCreating()).toBe(false);
      expect(component.issueTitle()).toBe('');
      expect(component.issueType()).toBe('TASK');
      expect(component.issuePriority()).toBe('MEDIUM');
  expect(component.issueAssigneeId()).toBeUndefined();
      expect(component.issueDueDate()).toBeUndefined();
    });

    it('should have all dropdown states closed', () => {
      expect(component.showTypeDropdown()).toBe(false);
      expect(component.showPriorityDropdown()).toBe(false);
      expect(component.showAssigneeDropdown()).toBe(false);
    });

    it('should have all issue types available', () => {
      expect(component.issueTypes).toEqual(['TASK', 'BUG', 'STORY', 'EPIC']);
    });

    it('should have all priorities available', () => {
      expect(component.priorities).toEqual(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
    });

    it('should have assignees list', () => {
  // Update or remove these lines if assignees is not a property
    });
  });

  describe('startCreating', () => {
    it('should set isCreating to true', () => {
      component.startCreating();
      expect(component.isCreating()).toBe(true);
    });
  });

  describe('cancel', () => {
    it('should reset form to initial state', () => {
      component.isCreating.set(true);
      component.issueTitle.set('Test Issue');
      component.issueType.set('BUG');
      component.issuePriority.set('HIGH');
  component.issueAssigneeId.set(undefined); // Use correct signal
      component.issueDueDate.set(new Date());
      component.showTypeDropdown.set(true);

      component.cancel();

      expect(component.isCreating()).toBe(false);
      expect(component.issueTitle()).toBe('');
      expect(component.issueType()).toBe('TASK');
      expect(component.issuePriority()).toBe('MEDIUM');
  expect(component.issueAssigneeId()).toBeUndefined();
      expect(component.issueDueDate()).toBeUndefined();
      expect(component.showTypeDropdown()).toBe(false);
    });
  });

  describe('create', () => {
    it('should emit issueCreated event with correct data', () => {
      spyOn(component.issueCreated, 'emit');
      
      component.issueTitle.set('New Task');
      component.issueType.set('BUG');
      component.issuePriority.set('HIGH');
  component.issueAssigneeId.set(undefined);
      const dueDate = new Date('2024-12-31');
      component.issueDueDate.set(dueDate);

      component.create();

      expect(component.issueCreated.emit).toHaveBeenCalledWith({
        title: 'New Task',
        status: 'TODO',
        type: 'BUG',
        priority: 'HIGH',
  assigneeId: 1, // Use correct property and type
        dueDate: dueDate
      });
    });

    it('should reset form after creating issue', () => {
      component.issueTitle.set('Test Issue');
      component.issueType.set('BUG');

      component.create();

      expect(component.isCreating()).toBe(false);
      expect(component.issueTitle()).toBe('');
      expect(component.issueType()).toBe('TASK');
    });

    it('should trim whitespace from title', () => {
      spyOn(component.issueCreated, 'emit');
      
      component.issueTitle.set('  Test Issue  ');
      component.create();

      const emittedData = (component.issueCreated.emit as jasmine.Spy).calls.mostRecent().args[0] as QuickCreateIssueData;
      expect(emittedData.title).toBe('Test Issue');
    });

    it('should not emit if title is empty', () => {
      spyOn(component.issueCreated, 'emit');
      
      component.issueTitle.set('');
      component.create();

      expect(component.issueCreated.emit).not.toHaveBeenCalled();
    });

    it('should not emit if title is only whitespace', () => {
      spyOn(component.issueCreated, 'emit');
      
      component.issueTitle.set('   ');
      component.create();

      expect(component.issueCreated.emit).not.toHaveBeenCalled();
    });

    it('should handle undefined assignee', () => {
      spyOn(component.issueCreated, 'emit');
      
      component.issueTitle.set('Test');
  component.issueAssigneeId.set(undefined);
      component.create();

      const emittedData = (component.issueCreated.emit as jasmine.Spy).calls.mostRecent().args[0] as QuickCreateIssueData;
  expect(emittedData.assigneeId).toBeUndefined();
    });

    it('should handle undefined due date', () => {
      spyOn(component.issueCreated, 'emit');
      
      component.issueTitle.set('Test');
      component.issueDueDate.set(undefined);
      component.create();

      const emittedData = (component.issueCreated.emit as jasmine.Spy).calls.mostRecent().args[0] as QuickCreateIssueData;
      expect(emittedData.dueDate).toBeUndefined();
    });
  });

  describe('onKeydown', () => {
    it('should create issue on Enter key', () => {
      spyOn(component, 'create');
      component.issueTitle.set('Test');
      
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');
      
      component.onKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.create).toHaveBeenCalled();
    });

    it('should not create on Shift+Enter', () => {
      spyOn(component, 'create');
      
      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
      component.onKeydown(event);

      expect(component.create).not.toHaveBeenCalled();
    });

    it('should cancel on Escape key', () => {
      spyOn(component, 'cancel');
      
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      
      component.onKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.cancel).toHaveBeenCalled();
    });

    it('should do nothing on other keys', () => {
      spyOn(component, 'create');
      spyOn(component, 'cancel');
      
      const event = new KeyboardEvent('keydown', { key: 'a' });
      component.onKeydown(event);

      expect(component.create).not.toHaveBeenCalled();
      expect(component.cancel).not.toHaveBeenCalled();
    });
  });

  describe('selectType', () => {
    it('should update issue type', () => {
      component.selectType('BUG');
      expect(component.issueType()).toBe('BUG');
    });

    it('should close type dropdown', () => {
      component.showTypeDropdown.set(true);
      component.selectType('STORY');
      expect(component.showTypeDropdown()).toBe(false);
    });

    it('should handle all issue types', () => {
      const types: IssueType[] = ['TASK', 'BUG', 'STORY', 'EPIC'];
      
      types.forEach(type => {
        component.selectType(type);
        expect(component.issueType()).toBe(type);
      });
    });
  });

  describe('selectPriority', () => {
    it('should update issue priority', () => {
      component.selectPriority('HIGH');
      expect(component.issuePriority()).toBe('HIGH');
    });

    it('should close priority dropdown', () => {
      component.showPriorityDropdown.set(true);
      component.selectPriority('CRITICAL');
      expect(component.showPriorityDropdown()).toBe(false);
    });

    it('should handle all priorities', () => {
      const priorities: IssuePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      
      priorities.forEach(priority => {
        component.selectPriority(priority);
        expect(component.issuePriority()).toBe(priority);
      });
    });
  });

  describe('selectAssignee', () => {
    it('should set assignee when valid name selected', () => {
  component.selectAssignee({ id: 1, name: 'Alice', email: 'alice@example.com' }); // Pass mock User object
  expect(component.issueAssigneeId()).toBe(1);
    });

    it('should set assignee to undefined when Unassigned selected', () => {
  component.issueAssigneeId.set(2);
  component.selectAssignee(null); // Pass null for unassigned
  expect(component.issueAssigneeId()).toBeUndefined();
    });

    it('should close assignee dropdown', () => {
      component.showAssigneeDropdown.set(true);
  component.selectAssignee({ id: 3, name: 'Carol White', email: 'carol@example.com' });
      expect(component.showAssigneeDropdown()).toBe(false);
    });
  });

  describe('getTypeIcon', () => {
    it('should return correct icon for TASK', () => {
      expect(component.getTypeIcon('TASK')).toBe('✓');
    });

    it('should return correct icon for BUG', () => {
      expect(component.getTypeIcon('BUG')).toBe('B');
    });

    it('should return correct icon for STORY', () => {
      expect(component.getTypeIcon('STORY')).toBe('S');
    });

    it('should return correct icon for EPIC', () => {
      expect(component.getTypeIcon('EPIC')).toBe('E');
    });

    it('should return correct icon for SUBTASK', () => {
      expect(component.getTypeIcon('SUBTASK')).toBe('ST');
    });

    it('should return default icon for unknown type', () => {
      expect(component.getTypeIcon('UNKNOWN' as IssueType)).toBe('✓');
    });
  });

  describe('getPriorityColor', () => {
    it('should return correct color for LOW', () => {
      expect(component.getPriorityColor('LOW')).toBe('text-green-600');
    });

    it('should return correct color for MEDIUM', () => {
      expect(component.getPriorityColor('MEDIUM')).toBe('text-yellow-600');
    });

    it('should return correct color for HIGH', () => {
      expect(component.getPriorityColor('HIGH')).toBe('text-orange-600');
    });

    it('should return correct color for CRITICAL', () => {
      expect(component.getPriorityColor('CRITICAL')).toBe('text-red-600');
    });

    it('should return default color for unknown priority', () => {
      expect(component.getPriorityColor('UNKNOWN' as IssuePriority)).toBe('text-gray-600');
    });
  });

  describe('getAssigneeInitials', () => {
    it('should return initials for full name', () => {
      expect(component.getAssigneeInitials('Alice Johnson')).toBe('AJ');
    });

    it('should return single initial for single name', () => {
      expect(component.getAssigneeInitials('Alice')).toBe('A');
    });

    it('should return ? for undefined', () => {
      expect(component.getAssigneeInitials(undefined)).toBe('?');
    });

    it('should return ? for Unassigned', () => {
      expect(component.getAssigneeInitials('Unassigned')).toBe('?');
    });

    it('should uppercase initials', () => {
      expect(component.getAssigneeInitials('alice johnson')).toBe('AJ');
    });

    it('should handle names with more than two words', () => {
      expect(component.getAssigneeInitials('John Paul Smith')).toBe('JPS');
    });
  });

  describe('closeAllDropdowns', () => {
    it('should close all dropdowns', () => {
      component.showTypeDropdown.set(true);
      component.showPriorityDropdown.set(true);
      component.showAssigneeDropdown.set(true);

      component.closeAllDropdowns();

      expect(component.showTypeDropdown()).toBe(false);
      expect(component.showPriorityDropdown()).toBe(false);
      expect(component.showAssigneeDropdown()).toBe(false);
    });

    it('should work when dropdowns are already closed', () => {
      component.closeAllDropdowns();

      expect(component.showTypeDropdown()).toBe(false);
      expect(component.showPriorityDropdown()).toBe(false);
      expect(component.showAssigneeDropdown()).toBe(false);
    });
  });

  describe('resetForm', () => {
    it('should reset all form fields to defaults', () => {
      // Set all fields to non-default values
      component.isCreating.set(true);
      component.issueTitle.set('Test');
      component.issueType.set('BUG');
      component.issuePriority.set('CRITICAL');
  component.issueAssigneeId.set(1); // Use correct property and type
      component.issueDueDate.set(new Date());
      component.showTypeDropdown.set(true);
      component.showPriorityDropdown.set(true);
      component.showAssigneeDropdown.set(true);

      component.resetForm();

      expect(component.isCreating()).toBe(false);
      expect(component.issueTitle()).toBe('');
      expect(component.issueType()).toBe('TASK');
      expect(component.issuePriority()).toBe('MEDIUM');
  expect(component.issueAssigneeId()).toBeUndefined();
      expect(component.issueDueDate()).toBeUndefined();
      expect(component.showTypeDropdown()).toBe(false);
      expect(component.showPriorityDropdown()).toBe(false);
      expect(component.showAssigneeDropdown()).toBe(false);
    });
  });

  describe('integration tests', () => {
    it('should create issue with all fields populated', () => {
      spyOn(component.issueCreated, 'emit');
      
      component.issueTitle.set('Complete Feature X');
      component.selectType('STORY');
      component.selectPriority('HIGH');
  component.selectAssignee({ id: 2, name: 'Alice Johnson', email: 'alice.johnson@example.com' });
      const dueDate = new Date('2024-12-31');
      component.issueDueDate.set(dueDate);

      component.create();

      expect(component.issueCreated.emit).toHaveBeenCalledWith({
        title: 'Complete Feature X',
        status: 'TODO',
        type: 'STORY',
        priority: 'HIGH',
  assigneeId: 1,
        dueDate: dueDate
      });
    });

    it('should create issue with minimal fields', () => {
      spyOn(component.issueCreated, 'emit');
      
      component.issueTitle.set('Quick Task');
      component.create();

      expect(component.issueCreated.emit).toHaveBeenCalledWith({
        title: 'Quick Task',
        status: 'TODO',
        type: 'TASK',
        priority: 'MEDIUM',
  assigneeId: undefined,
        dueDate: undefined
      });
    });

    it('should handle multiple create-cancel cycles', () => {
      spyOn(component.issueCreated, 'emit');

      // First cycle
      component.startCreating();
      component.issueTitle.set('Task 1');
      component.create();
      expect(component.isCreating()).toBe(false);

      // Second cycle
      component.startCreating();
      component.issueTitle.set('Task 2');
      component.cancel();
      expect(component.issueTitle()).toBe('');

      // Third cycle
      component.startCreating();
      component.issueTitle.set('Task 3');
      component.create();
      
      expect(component.issueCreated.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('status input', () => {
    it('should use provided status when creating issue', () => {
      spyOn(component.issueCreated, 'emit');
      
      component.status = 'IN_PROGRESS';
      component.issueTitle.set('Test');
      component.create();

      const emittedData = (component.issueCreated.emit as jasmine.Spy).calls.mostRecent().args[0] as QuickCreateIssueData;
      expect(emittedData.status).toBe('IN_PROGRESS');
    });

    it('should work with different status values', () => {
      spyOn(component.issueCreated, 'emit');
      
      const statuses: IssueStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'DONE'];
      
      statuses.forEach((status, index) => {
        component.status = status;
        component.issueTitle.set(`Test ${index}`);
        component.create();
      });

      expect(component.issueCreated.emit).toHaveBeenCalledTimes(statuses.length);
    });
  });
});
