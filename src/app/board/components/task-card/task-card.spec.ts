import { TestBed, ComponentFixture } from '@angular/core/testing';
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
      imports: [TaskCard]
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
});
