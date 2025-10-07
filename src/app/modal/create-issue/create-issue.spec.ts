import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { CreateIssue } from './create-issue';
import { ModalService, ModalConfig, FormField } from '../modal-service';
import { NgIf, NgFor } from '@angular/common';

describe('CreateIssue Component', () => {
  let component: CreateIssue;
  let fixture: ComponentFixture<CreateIssue>;
  let modalService: ModalService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateIssue, FormsModule, NgIf, NgFor],
      providers: [ModalService]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateIssue);
    component = fixture.componentInstance;
    modalService = TestBed.inject(ModalService);
    fixture.detectChanges();
  });

  afterEach(() => {
    modalService.close(); // reset modal state
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should open the modal', () => {
  const testConfig: ModalConfig = {
    id: 'test-modal',
    title: 'Edit Issue',
    projectName: 'Project X',
    fields: [],
    data: {}
  };

  modalService.open(testConfig);
  fixture.detectChanges();

  expect(component.show).toBeTrue();
});

it('should populate form data when modal opens', () => {
  const testConfig: ModalConfig = {
    id: 'test-modal',
    title: 'Edit Issue',
    projectName: 'Project X',
    fields: [
      { label: 'Title', type: 'text', model: 'title' } as FormField,
      { label: 'Status', type: 'select', model: 'status', options: ['TODO', 'DONE'] } as FormField
    ],
    data: { title: 'Test Issue', status: 'TODO' }
  };

  modalService.open(testConfig);
  fixture.detectChanges();

  expect(component.modalTitle).toBe('Edit Issue');
  expect(component.projectName).toBe('Project X');
  expect(component.fields.length).toBe(2);
  expect(component.formData.title).toBe('Test Issue');
  expect(component.formData.status).toBe('TODO');
});


  it('should close modal', () => {
    modalService.open({
      id: 'test-modal',
      title: 'Modal',
      fields: [],
      data: {}
    });

    fixture.detectChanges();
    expect(component.show).toBeTrue();

    const spyClose = spyOn(modalService, 'close').and.callThrough();
    component.close();
    expect(spyClose).toHaveBeenCalled();
    expect(component.show).toBeFalse();
  });

  it('should submit form and close modal', () => {
    const spyClose = spyOn(component, 'close');
    component.formData = { title: 'New Issue' };
    component.submit();
    expect(spyClose).toHaveBeenCalled();
  });

  it('should handle field change', () => {
    let changedValue: any = null;
    const field: FormField = {
      label: 'Title',
      type: 'text',
      model: 'title',
      onChange: (value, formData) => { changedValue = value; }
    };

    component.formData = { title: '' };
    component.handleChange('Updated', field);
    expect(changedValue).toBe('Updated');
  });

  it('should handle file selection', () => {
    const field: FormField = { label: 'Attachment', type: 'file', model: 'attachments' };
    const fakeFile = new File(['dummy content'], 'dummy.txt', { type: 'text/plain' });
    const event = { target: { files: [fakeFile] } };

    component.handleFileSelect(event, field);
    expect(component.formData.attachments.length).toBe(1);
    expect(component.formData.attachments[0].name).toBe('dummy.txt');
  });

  it('should add and remove labels', () => {
    component.formData.labels = [];
    component.addLabel('bug');
    component.addLabel('feature');

    expect(component.formData.labels).toEqual(['bug', 'feature']);

    component.removeLabel('bug');
    expect(component.formData.labels).toEqual(['feature']);
  });
});
