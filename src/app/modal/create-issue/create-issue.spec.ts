import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of, Subject } from 'rxjs';
import { CreateIssue } from './create-issue';
import { ModalService, ModalConfig, FormField } from '../modal-service';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

describe('CreateIssue Component (Full Suite)', () => {
  let component: CreateIssue;
  let fixture: ComponentFixture<CreateIssue>;
  let modalServiceMock: any;
  let activeModal$: Subject<string | null>;

  beforeEach(async () => {
    activeModal$ = new Subject<string | null>();

    modalServiceMock = {
      activeModal$: activeModal$.asObservable(),
      getConfig: jasmine.createSpy('getConfig').and.returnValue({
        title: 'Create Issue',
        projectName: 'Alpha',
        modalDesc: 'Testing modal',
        showLabels: true,
        submitText: 'Save Issue',
        fields: [
          { label: 'Title', type: 'text', model: 'title', required: true },
          { label: 'Description', type: 'textarea', model: 'description' }
        ],
        data: { title: '', description: '' }
      }),
      close: jasmine.createSpy('close'),
      open: jasmine.createSpy('open')
    };

    await TestBed.configureTestingModule({
      imports: [CreateIssue, FormsModule, CommonModule],
      providers: [
        { provide: ModalService, useValue: modalServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateIssue);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ─────────────────────────────────────────────
  // 🧩 COMPONENT CREATION
  // ─────────────────────────────────────────────
  it('should create component (success)', () => {
    expect(component).toBeTruthy();
  });

  // ─────────────────────────────────────────────
  // 🧠 MODAL INITIALIZATION
  // ─────────────────────────────────────────────
  it('should set modal data correctly when activeModal emits (success)', fakeAsync(() => {
    activeModal$.next('createIssue');
    tick();

    expect(component.show).toBeTrue();
    expect(component.modalTitle).toBe('Create Issue');
    expect(component.projectName).toBe('Alpha');
    expect(component.submitButtonText).toBe('Save Issue');
  }));

  it('should hide modal if null id emitted (failure)', fakeAsync(() => {
    activeModal$.next(null);
    tick();
    expect(component.show).toBeFalse();
  }));

  // ─────────────────────────────────────────────
  // 🧍‍♂️ CLOSE FUNCTION
  // ─────────────────────────────────────────────
  it('should call modalService.close() and reset errors (success)', () => {
    component.formError = 'Error';
    component.invalidFields.add('title');

    component.close();

    expect(modalServiceMock.close).toHaveBeenCalled();
    expect(component.formError).toBe('');
    expect(component.invalidFields.size).toBe(0);
  });

  // no “failure” case for close — it’s deterministic.

  // ─────────────────────────────────────────────
  // 🚨 FORM VALIDATION
  // ─────────────────────────────────────────────
  it('should mark required fields invalid when missing (failure)', () => {
    component.fields = [{ label: 'Title', type: 'text', model: 'title', required: true }];
    component.formData = { title: '' };

    component.submit();

    expect(component.invalidFields.has('title')).toBeTrue();
    expect(component.showErrorToast).toBeTrue();
  });

  it('should not mark any fields invalid when all required fields filled (success)', () => {
    spyOn(component, 'close');
    component.fields = [{ label: 'Title', type: 'text', model: 'title', required: true }];
    component.formData = { title: 'Valid Title' };

    component.submit();

    expect(component.invalidFields.size).toBe(0);
    expect(component.close).toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────
  // 🍞 SHOW TOAST
  // ─────────────────────────────────────────────
  it('should show and hide toast correctly (success)', fakeAsync(() => {
    component.showToast('All good', 1000);

    expect(component.formError).toBe('All good');
    expect(component.showErrorToast).toBeTrue();

    tick(1000);
    expect(component.showErrorToast).toBeFalse();
    expect(component.formError).toBe('');
  }));

  it('should override previous toast if called again quickly (failure)', fakeAsync(() => {
    component.showToast('First', 1000);
    tick(500);
    component.showToast('Second', 1000);
    expect(component.formError).toBe('Second');
  }));

  // ─────────────────────────────────────────────
  // 💥 SHAKE ANIMATION
  // ─────────────────────────────────────────────
  it('should set shakeFields for invalid fields (failure)', fakeAsync(() => {
    component.fields = [{ label: 'Title', type: 'text', model: 'title', required: true }];
    component.formData = { title: '' };
    component.submit();

    expect(component.shakeFields.has('title')).toBeTrue();
  }));

  it('should clear shakeFields after timeout (success)', fakeAsync(() => {
    component.fields = [{ label: 'Title', type: 'text', model: 'title', required: true }];
    component.formData = { title: '' };
    component.submit();
    tick(600);
    expect(component.shakeFields.size).toBe(0);
  }));

  // ─────────────────────────────────────────────
  // ⚙️ HANDLE CHANGE
  // ─────────────────────────────────────────────
  it('should update formData and remove invalid field (success)', () => {
    const field = { model: 'title', required: true };
    component.invalidFields.add('title');

    component.handleChange('Updated', field as any);

    expect(component.formData['title']).toBe('Updated');
    expect(component.invalidFields.has('title')).toBeFalse();
  });

  it('should call onChange callback if provided (success)', () => {
    const spy = jasmine.createSpy('onChange');
    const field = { model: 'status', required: false, onChange: spy };

    component.handleChange('DONE', field as any);
    expect(spy).toHaveBeenCalledWith('DONE', component.formData);
  });

  it('should not call onChange if not provided (failure)', () => {
    const field = { model: 'status', required: false };
    expect(() => component.handleChange('DONE', field as any)).not.toThrow();
  });

  // ─────────────────────────────────────────────
  // 📁 HANDLE FILE SELECT
  // ─────────────────────────────────────────────
  it('should update formData with file list (success)', () => {
    const mockEvent = { target: { files: ['fileA', 'fileB'] } };
    const field = { model: 'attachments' };
    component.handleFileSelect(mockEvent, field as any);

    expect(component.formData['attachments']).toEqual(['fileA', 'fileB']);
  });

  it('should safely handle empty file list (failure)', () => {
    const mockEvent = { target: { files: [] } };
    const field = { model: 'attachments' };
    component.handleFileSelect(mockEvent, field as any);

    expect(component.formData['attachments']).toEqual([]);
  });

  // ─────────────────────────────────────────────
  // 🏷️ LABEL MANAGEMENT
  // ─────────────────────────────────────────────
  it('should add new label when not existing (success)', () => {
    component.formData.labels = [];
    component.addLabel('Backend');
    expect(component.formData.labels.includes('Backend')).toBeTrue();
  });

  it('should not add duplicate label (failure)', () => {
    component.formData.labels = ['Backend'];
    component.addLabel('Backend');
    expect(component.formData.labels.length).toBe(1);
  });

  it('should remove existing label (success)', () => {
    component.formData.labels = ['Frontend', 'UI'];
    component.removeLabel('UI');
    expect(component.formData.labels).toEqual(['Frontend']);
  });

  it('should safely handle removing label not present (failure)', () => {
    component.formData.labels = ['UI'];
    component.removeLabel('Nonexistent');
    expect(component.formData.labels).toEqual(['UI']);
  });

  // ─────────────────────────────────────────────
  // 🧹 NGONDESTROY CLEANUP
  // ─────────────────────────────────────────────
  it('should unsubscribe safely (success)', () => {
    spyOn(component['sub'], 'unsubscribe');
    component.ngOnDestroy();
    expect(component['sub'].unsubscribe).toHaveBeenCalled();
  });

  it('should not throw if subscription not created (failure)', () => {
    component['sub'] = undefined as any;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should reset body overflow style on destroy (success)', () => {
    document.body.style.overflow = 'hidden';
    component.ngOnDestroy();
    expect(document.body.style.overflow).toBe('');
  });
});