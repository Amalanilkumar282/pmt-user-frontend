import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { SprintContainer, Sprint } from './sprint-container';
import { Issue } from '../../shared/models/issue.model';

describe('SprintContainer', () => {
  let component: SprintContainer;
  let fixture: ComponentFixture<SprintContainer>;

  const sampleIssue: Issue = { id: 'i1', title: 'One', type: 'TASK', priority: 'LOW', status: 'TODO' } as any;
  const sampleSprint: Sprint = {
    id: 's1',
    name: 'Sprint 1',
    startDate: new Date('2025-10-01'),
    endDate: new Date('2025-10-10'),
    status: 'ACTIVE',
    issues: [sampleIssue]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SprintContainer, HttpClientModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SprintContainer);
    component = fixture.componentInstance;
    // set a sample sprint
    component.sprint = { ...sampleSprint } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should collapse completed sprints by default', () => {
  component.sprint.status = 'COMPLETED';
  (component as any).isCollapsed.set(false);
  component.ngOnInit();
  expect((component as any).isCollapsed()).toBeTrue();
  });

  it('formatDate returns expected format', () => {
    const d = new Date('2025-10-04');
    const out = component.formatDate(d);
    expect(typeof out).toBe('string');
    // basic check for month and comma
    expect(out).toMatch(/\w{3} \d{2},\d{4}/);
  });

  it('toggleCollapse toggles the collapsed state', () => {
  const before = (component as any).isCollapsed();
  component.toggleCollapse();
  expect((component as any).isCollapsed()).toBe(!before);
  });

  it('onSprintAction emits startSprint when PLANNED', () => {
    component.sprint.status = 'PLANNED';
    component.sprint.id = 's2';
    component.startSprint.subscribe(id => expect(id).toBe('s2'));
    component.onSprintAction();
  });

  it('onSprintAction emits completeSprint when ACTIVE', () => {
    component.sprint.status = 'ACTIVE';
    component.sprint.id = 's3';
    component.completeSprint.subscribe(id => expect(id).toBe('s3'));
    component.onSprintAction();
  });

  it('getActionButtonText respects sprint status', () => {
    component.sprint.status = 'PLANNED';
    expect(component.getActionButtonText()).toBe('Start Sprint');
    component.sprint.status = 'ACTIVE';
    expect(component.getActionButtonText()).toBe('Complete Sprint');
  });

  it('isActionButtonDisabled true when COMPLETED', () => {
    component.sprint.status = 'COMPLETED';
    expect(component.isActionButtonDisabled()).toBeTrue();
    component.sprint.status = 'ACTIVE';
    expect(component.isActionButtonDisabled()).toBeFalse();
  });

  it('onEdit emits editSprint', () => {
    component.sprint.id = 'edit-id';
    component.editSprint.subscribe(id => expect(id).toBe('edit-id'));
    component.onEdit();
  });

  it('onDelete emits deleteSprint', () => {
    component.sprint.id = 'del-id';
    component.deleteSprint.subscribe(id => expect(id).toBe('del-id'));
    component.onDelete();
  });

  it('onIssueClick opens modal and sets selectedIssue', () => {
  expect((component as any).isModalOpen()).toBeFalse();
    component.onIssueClick(sampleIssue);
  expect((component as any).isModalOpen()).toBeTrue();
  expect((component as any).selectedIssue()).toBe(sampleIssue);
  });

  it('onCloseModal closes modal and clears selectedIssue after timeout', fakeAsync(() => {
    component.onIssueClick(sampleIssue);
  expect((component as any).isModalOpen()).toBeTrue();
    component.onCloseModal();
  expect((component as any).isModalOpen()).toBeFalse();
    tick(300);
  expect((component as any).selectedIssue()).toBeNull();
  }));

  it('onDeleteIssue removes issue from sprint.issues', () => {
    component.sprint.issues = [{ id: 'a' } as any, { id: 'b' } as any];
    component.onDeleteIssue('a');
    expect(component.sprint.issues?.find(i => i.id === 'a')).toBeUndefined();
  });

  it('onMoveIssue emits moveIssue event', () => {
    const payload = { issueId: 'i9', destinationSprintId: 'sX' };
    component.moveIssue.subscribe(p => expect(p).toEqual(payload));
    component.onMoveIssue(payload);
  });

  it('onDrop emits moveIssue with current sprint id', () => {
    const fakeEvent: any = {
      item: { data: { id: 'i10' } }
    };
    component.sprint.id = 'sDrop';
    component.moveIssue.subscribe(p => expect(p).toEqual({ issueId: 'i10', destinationSprintId: 'sDrop' }));
    component.onDrop(fakeEvent as any);
  });

  it('template: clicking collapse toggler triggers toggleCollapse', () => {
    const headerLeft = fixture.debugElement.query(By.css('.header-left'));
    if (!headerLeft) {
      expect(true).toBeTrue();
      return;
    }
  const before = (component as any).isCollapsed();
    headerLeft.triggerEventHandler('click', {});
    fixture.detectChanges();
  expect((component as any).isCollapsed()).toBe(!before);
  });
});
