import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange, EventEmitter } from '@angular/core';
import { IssueDetailedView } from './issue-detailed-view';
import { Issue } from '../../shared/models/issue.model';
import { ModalService } from '../../modal/modal-service';
import { HttpClientModule } from '@angular/common/http';

describe('IssueDetailedView', () => {
  let component: IssueDetailedView;
  let fixture: ComponentFixture<IssueDetailedView>;
  let mockModalService: jasmine.SpyObj<ModalService>;

  const mockIssue: Issue = {
    id: 'issue-123',
    title: 'Test Issue',
    description: 'Test Description',
    type: 'STORY',
    priority: 'HIGH',
    status: 'TODO',
    assignee: 'John Doe',
    storyPoints: 5,
    sprintId: 'sprint-1',
    epicId: undefined,
    labels: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02')
  };

  beforeEach(async () => {
    mockModalService = jasmine.createSpyObj('ModalService', ['open']);

    await TestBed.configureTestingModule({
      imports: [IssueDetailedView, HttpClientModule],
      providers: [
        { provide: ModalService, useValue: mockModalService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssueDetailedView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set issue through input', () => {
    component.issue = mockIssue;
    expect(component['_issue']()).toEqual(mockIssue);
  });

  it('should set isOpen through input', () => {
    component.isOpen = true;
    expect(component['_isOpen']()).toBe(true);
  });

  it('should emit close event when onClose is called', () => {
    spyOn(component.close, 'emit');
    component['onClose']();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should close on backdrop click', () => {
    spyOn(component.close, 'emit');
    const mockEvent = {
      target: document.createElement('div'),
      currentTarget: document.createElement('div')
    } as any;
    mockEvent.target = mockEvent.currentTarget;
    
    component['onBackdropClick'](mockEvent);
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should not close when clicking inside panel', () => {
    spyOn(component.close, 'emit');
    const mockEvent = {
      target: document.createElement('div'),
      currentTarget: document.createElement('section')
    } as any;
    
    component['onBackdropClick'](mockEvent);
    expect(component.close.emit).not.toHaveBeenCalled();
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

  it('should return correct priority class for HIGH', () => {
    const className = component['getPriorityClass']('HIGH');
    expect(className).toContain('orange');
  });

  it('should return correct priority class for CRITICAL', () => {
    const className = component['getPriorityClass']('CRITICAL');
    expect(className).toContain('red');
  });

  it('should return correct status class for TODO', () => {
    const className = component['getStatusClass']('TODO');
    expect(className).toContain('gray');
  });

  it('should return correct status class for IN_PROGRESS', () => {
    const className = component['getStatusClass']('IN_PROGRESS');
    expect(className).toContain('blue');
  });

  it('should return correct status class for DONE', () => {
    const className = component['getStatusClass']('DONE');
    expect(className).toContain('green');
  });

  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    const formatted = component['formatDate'](date);
    expect(formatted).toContain('2024');
    expect(formatted).toContain('Jan');
  });

  it('should emit deleteIssue event when delete is confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component.deleteIssue, 'emit');
    spyOn(component.close, 'emit');
    component.issue = mockIssue;
    
    component['onDelete']();
    
    expect(component.deleteIssue.emit).toHaveBeenCalledWith('issue-123');
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should not emit deleteIssue event when delete is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    spyOn(component.deleteIssue, 'emit');
    component.issue = mockIssue;
    
    component['onDelete']();
    
    expect(component.deleteIssue.emit).not.toHaveBeenCalled();
  });

  it('should toggle move dropdown', () => {
    component['showMoveDropdown'].set(false);
    component['toggleMoveDropdown']();
    expect(component['showMoveDropdown']()).toBe(true);
    
    component['toggleMoveDropdown']();
    expect(component['showMoveDropdown']()).toBe(false);
  });

  it('should emit moveIssue event when move is confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component.moveIssue, 'emit');
    spyOn(component.close, 'emit');
    component.issue = mockIssue;
    
    component['onMove']('sprint-2', 'Sprint 2');
    
    expect(component.moveIssue.emit).toHaveBeenCalledWith({
      issueId: 'issue-123',
      destinationSprintId: 'sprint-2'
    });
    expect(component['showMoveDropdown']()).toBe(false);
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should not emit moveIssue event when move is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    spyOn(component.moveIssue, 'emit');
    component.issue = mockIssue;
    
    component['onMove']('sprint-2', 'Sprint 2');
    
    expect(component.moveIssue.emit).not.toHaveBeenCalled();
  });

  it('should handle move to backlog (null sprintId)', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component.moveIssue, 'emit');
    component.issue = mockIssue;
    
    component['onMove'](null, 'Backlog');
    
    expect(component.moveIssue.emit).toHaveBeenCalledWith({
      issueId: 'issue-123',
      destinationSprintId: null
    });
  });

  it('should stop event propagation when closing move dropdown', () => {
    const mockEvent = jasmine.createSpyObj('MouseEvent', ['stopPropagation']);
    component['closeMoveDropdown'](mockEvent);
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should open modal service when onEditIssue is called', () => {
    component.issue = mockIssue;
    component.availableSprints = [
      { id: 'sprint-1', name: 'Sprint 1', status: 'active' }
    ];
    
    component['onEditIssue']();
    
    expect(mockModalService.open).toHaveBeenCalled();
  });

  it('should not call modal service if issue is null', () => {
    component.issue = null;
    component['onEditIssue']();
    expect(mockModalService.open).not.toHaveBeenCalled();
  });
});
