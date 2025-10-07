import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkItemForm } from './work-item-form';
import { Issue } from '../../../../shared/models/issue.model';

describe('WorkItemForm', () => {
  let component: WorkItemForm;
  let fixture: ComponentFixture<WorkItemForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WorkItemForm] }).compileComponents();
    fixture = TestBed.createComponent(WorkItemForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('toggleTypeDropdown toggles flag', () => {
    const before = component.showTypeDropdown;
    component.toggleTypeDropdown();
    expect(component.showTypeDropdown).toBe(!before);
  });

  it('selectType sets type and closes dropdown', () => {
    component.showTypeDropdown = true;
    component.selectType('BUG');
    expect(component.type).toBe('BUG');
    expect(component.showTypeDropdown).toBeFalse();
  });

  it('addWorkItem emits when title provided and resets fields', done => {
    component.title = 'New Item';
    component.type = 'STORY';
    let emitted: Issue | null = null;
    component.workItemCreated.subscribe((item: Issue) => {
      emitted = item;
    });
    component.addWorkItem();
    // emitted should now be set
    expect(emitted).toBeTruthy();
    expect(emitted!.title).toBe('New Item');
    expect(emitted!.type).toBe('STORY');
    // component fields should be reset synchronously by the method
    expect(component.title).toBe('');
    expect(component.type).toBe('TASK');
    done();
  });

  it('getTypeIcon returns an icon for known types', () => {
    expect(component.getTypeIcon('TASK')).toBe('📋');
    expect(component.getTypeIcon('BUG')).toBe('🐛');
  });
});
