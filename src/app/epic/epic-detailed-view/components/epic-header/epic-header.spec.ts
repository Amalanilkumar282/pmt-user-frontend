import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EpicHeader } from './epic-header';
import { Epic } from '../../../../shared/models/epic.model';
import { HttpClientModule } from '@angular/common/http';

describe('EpicHeader', () => {
  let component: EpicHeader;
  let fixture: ComponentFixture<EpicHeader>;

  const epic: Epic = { id: 'e1', name: 'E1', description: '', startDate: null, dueDate: null, progress: 0, issueCount: 0, isExpanded: false, assignee: 'A', labels: [], parent: 'None', team: 'None', sprint: 'None', storyPoints: 0, reporter: 'R', childWorkItems: [], status: 'TODO' } as any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EpicHeader, HttpClientModule] }).compileComponents();
    fixture = TestBed.createComponent(EpicHeader);
    component = fixture.componentInstance;
    component.epic = epic;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('onClose should emit close event', done => {
    component.close.subscribe(() => done());
    component.onClose();
  });
});
