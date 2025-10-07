import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkItemsTable } from './work-items-table';
import { Issue } from '../../../../shared/models/issue.model';

describe('WorkItemsTable', () => {
  let component: WorkItemsTable;
  let fixture: ComponentFixture<WorkItemsTable>;

  const items: Issue[] = [
    { id: '1', title: 'A', status: 'TODO' } as any,
    { id: '2', title: 'B', status: 'DONE' } as any
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WorkItemsTable] }).compileComponents();
    fixture = TestBed.createComponent(WorkItemsTable);
    component = fixture.componentInstance;
    component.workItems = [...items];
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('getProgressPercentage returns correct percent', () => {
    expect(component.getProgressPercentage()).toBe('50%');
  });

  it('startEditing initializes editing and tempValues', () => {
    component.startEditing('1', 'title');
    expect(component.isEditing('1', 'title')).toBeTrue();
    expect(component.tempValues['1']['title']).toBeDefined();
  });

  it('saveItem updates item, clears editing flag and emits', done => {
    component.startEditing('1', 'title');
    component.tempValues['1'] = { title: 'Updated' };
    component.workItemsChanged.subscribe(ws => {
      expect(ws.find(w => w.id === '1')?.title).toBe('Updated');
      done();
    });
    component.saveItem('1', 'title');
    expect(component.isEditing('1', 'title')).toBeFalse();
  });

  it('cancelEdit clears editing flag', () => {
    component.startEditing('1', 'title');
    component.cancelEdit('1', 'title');
    expect(component.isEditing('1', 'title')).toBeFalse();
  });

  it('deleteItem prompts confirm and removes item when confirmed', () => {
    // stub confirm
    spyOn(window, 'confirm').and.returnValue(true);
    component.deleteItem('1');
    expect(component.workItems.find(i => i.id === '1')).toBeUndefined();
  });

  it('getPriorityClass/getStatusClass/getStatusLabel/getTypeIcon return expected strings', () => {
    expect(component.getPriorityClass('LOW')).toBe('priority-low');
    expect(component.getStatusClass('DONE')).toBe('status-done');
    expect(component.getStatusLabel('IN_PROGRESS')).toBe('IN PROGRESS');
    expect(component.getTypeIcon('TASK' as any)).toBe('📋');
  });
});
