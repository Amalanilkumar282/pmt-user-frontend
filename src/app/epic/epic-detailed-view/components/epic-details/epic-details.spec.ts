import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EpicDetails } from './epic-details';
import { Epic } from '../../../../shared/models/epic.model';

describe('EpicDetails', () => {
  let component: EpicDetails;
  let fixture: ComponentFixture<EpicDetails>;

  const baseEpic: Epic = { id: 'epic-x', name: 'X', description: '', startDate: null, dueDate: null, progress: 0, issueCount: 0, isExpanded: false, assignee: '', labels: [], parent: '', team: '', sprint: '', storyPoints: 0, reporter: '', childWorkItems: [], status: 'TODO' } as any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EpicDetails] }).compileComponents();
    fixture = TestBed.createComponent(EpicDetails);
    component = fixture.componentInstance;
    component.epic = { ...baseEpic };
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('ngOnInit should populate availableEpics excluding the current epic', () => {
    (component as any).ngOnInit();
    expect(component.availableEpics.find(e => e.id === component.epic.id)).toBeUndefined();
  });

  it('startEdit and save should update field and emit', done => {
    component.startEdit('name', 'Old');
    // simulate user changing the temp value while editing
    component.temp['name'] = 'NewName';
    component.epicUpdated.subscribe(e => {
      expect(e.name).toBe('NewName');
      done();
    });
    component.save('name');
    expect(component.editing['name']).toBeFalse();
  });

  it('saveDueDate and saveStartDate should set dates and emit', done => {
    component.temp['dueDate'] = '2025-10-10';
    component.temp['startDate'] = '2025-10-01';
    let callCount = 0;
    component.epicUpdated.subscribe(e => {
      callCount++;
      if (callCount === 1) expect(e.dueDate).toBeTruthy();
      if (callCount === 2) expect(e.startDate).toBeTruthy();
      if (callCount === 2) done();
    });
    component.saveDueDate();
    component.saveStartDate();
  });

  it('addLabel should add unique label and emit', done => {
    component.temp['newLabel'] = 'Label1';
    component.epicUpdated.subscribe(e => {
      expect(e.labels).toContain('Label1');
      done();
    });
    component.addLabel();
  });

  it('removeLabel should remove label and emit', done => {
    component.epic.labels = ['A','B'];
    component.epicUpdated.subscribe(e => {
      expect(e.labels).not.toContain('A');
      done();
    });
    component.removeLabel('A');
  });

  it('formatDate and formatDateForInput produce strings', () => {
    const d = new Date('2025-10-05');
    expect(component.formatDate(d)).toBeTruthy();
    expect(component.formatDateForInput(d)).toMatch(/2025-10-05/);
  });

  it('getStatusClass and getStatusLabel map properly', () => {
    expect(component.getStatusClass('TODO')).toBe('status-todo');
    expect(component.getStatusLabel('IN_PROGRESS')).toBe('IN PROGRESS');
  });
});
