import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EpicDescription } from './epic-description';
import { Epic } from '../../../../shared/models/epic.model';
import { HttpClientModule } from '@angular/common/http';

describe('EpicDescription', () => {
  let component: EpicDescription;
  let fixture: ComponentFixture<EpicDescription>;

  const epic: Epic = { id: 'e1', name: 'E1', description: 'orig', startDate: null, dueDate: null, progress: 0, issueCount: 0, isExpanded: false, assignee: 'A', labels: [], parent: 'None', team: 'None', sprint: 'None', storyPoints: 0, reporter: 'R', childWorkItems: [], status: 'TODO' } as any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EpicDescription, HttpClientModule] }).compileComponents();
    fixture = TestBed.createComponent(EpicDescription);
    component = fixture.componentInstance;
    component.epic = { ...epic };
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('startEditing should set editing true and copy description', () => {
    component.startEditing();
    expect(component.editing).toBeTrue();
    expect(component.tempDescription).toBe('orig');
  });

  it('save should update epic description, emit and stop editing', done => {
    component.epic.description = 'orig';
    component.startEditing();
    component.tempDescription = 'new';
    component.epicUpdated.subscribe(updated => {
      expect(updated.description).toBe('new');
      expect(component.editing).toBeFalse();
      done();
    });
    component.save();
  });

  it('cancel should stop editing without changing epic', () => {
    component.startEditing();
    component.tempDescription = 'x';
    component.cancel();
    expect(component.editing).toBeFalse();
    expect(component.epic.description).toBe('orig');
  });
});
