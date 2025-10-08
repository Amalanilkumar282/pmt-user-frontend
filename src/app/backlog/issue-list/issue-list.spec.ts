import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IssueList } from './issue-list';
import { Issue } from '../../shared/models/issue.model';

describe('IssueList', () => {
  let component: IssueList;
  let fixture: ComponentFixture<IssueList>;

  const mockIssues: Issue[] = [
    {
      id: 'issue-1',
      title: 'Todo Issue',
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
      title: 'In Progress Issue',
      description: 'Test',
      type: 'TASK',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      labels: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'issue-3',
      title: 'Done Issue',
      description: 'Test',
      type: 'BUG',
      priority: 'LOW',
      status: 'DONE',
      labels: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssueList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept issues input', () => {
    component.issues = mockIssues;
    expect(component['_issues']()).toEqual(mockIssues);
  });

  it('should compute issues$ signal', () => {
    component.issues = mockIssues;
    expect(component['issues$']()).toEqual(mockIssues);
  });

  it('should group issues by status', () => {
    component.issues = mockIssues;
    const grouped = component['issuesByStatus']();
    
    expect(grouped.todo.length).toBe(1);
    expect(grouped.inProgress.length).toBe(1);
    expect(grouped.done.length).toBe(1);
    expect(grouped.inReview.length).toBe(0);
  });

  it('should return correct type icon for STORY', () => {
    const icon = component['getTypeIcon']('STORY');
    expect(icon).toBe('📖');
  });

  it('should return correct type icon for TASK', () => {
    const icon = component['getTypeIcon']('TASK');
    expect(icon).toBe('✓');
  });

  it('should return correct type icon for BUG', () => {
    const icon = component['getTypeIcon']('BUG');
    expect(icon).toBe('🐛');
  });

  it('should return correct type icon for EPIC', () => {
    const icon = component['getTypeIcon']('EPIC');
    expect(icon).toBe('⚡');
  });

  it('should return default icon for unknown type', () => {
    const icon = component['getTypeIcon']('UNKNOWN');
    expect(icon).toBe('📝');
  });

  it('should return correct priority class for LOW', () => {
    const className = component['getPriorityClass']('LOW');
    expect(className).toContain('gray');
  });

  it('should return correct priority class for MEDIUM', () => {
    const className = component['getPriorityClass']('MEDIUM');
    expect(className).toContain('blue');
  });

  it('should return correct priority class for HIGH', () => {
    const className = component['getPriorityClass']('HIGH');
    expect(className).toContain('orange');
  });

  it('should return correct priority class for CRITICAL', () => {
    const className = component['getPriorityClass']('CRITICAL');
    expect(className).toContain('red');
  });

  it('should return default class for unknown priority', () => {
    const className = component['getPriorityClass']('UNKNOWN');
    expect(className).toContain('gray');
  });

  it('should emit issueClick event when onIssueClick is called', () => {
    spyOn(component.issueClick, 'emit');
    const issue = mockIssues[0];
    
    component['onIssueClick'](issue);
    
    expect(component.issueClick.emit).toHaveBeenCalledWith(issue);
  });

  it('should handle empty issues array', () => {
    component.issues = [];
    const grouped = component['issuesByStatus']();
    
    expect(grouped.todo.length).toBe(0);
    expect(grouped.inProgress.length).toBe(0);
    expect(grouped.inReview.length).toBe(0);
    expect(grouped.done.length).toBe(0);
  });

  it('should update when issues input changes', () => {
    component.issues = mockIssues;
    expect(component['issues$']().length).toBe(3);
    
    const newIssues: Issue[] = [mockIssues[0]];
    component.issues = newIssues;
    expect(component['issues$']().length).toBe(1);
  });
});
