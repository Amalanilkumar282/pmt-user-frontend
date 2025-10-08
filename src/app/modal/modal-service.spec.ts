import { TestBed } from '@angular/core/testing';
import { ModalService, ModalConfig, FormField } from './modal-service';

describe('ModalService', () => {
  let service: ModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have activeModal$ observable', (done) => {
    service.activeModal$.subscribe(value => {
      expect(value).toBeNull();
      done();
    });
  });

  it('should open modal with config', (done) => {
    const config: ModalConfig = {
      id: 'test-modal',
      title: 'Test Modal',
      projectName: 'Test Project'
    };

    service.open(config);

    service.activeModal$.subscribe(modalId => {
      if (modalId === 'test-modal') {
        expect(modalId).toBe('test-modal');
        done();
      }
    });
  });

  it('should close modal and emit null', (done) => {
    const config: ModalConfig = {
      id: 'test-modal',
      title: 'Test Modal'
    };

    service.open(config);
    service.close();

    service.activeModal$.subscribe(modalId => {
      if (modalId === null) {
        expect(modalId).toBeNull();
        done();
      }
    });
  });

  it('should store modal configuration', () => {
    const config: ModalConfig = {
      id: 'test-modal-2',
      title: 'Test Modal 2',
      projectName: 'Project Alpha',
      modalDesc: 'Test description'
    };

    service.open(config);
    const retrievedConfig = service.getConfig('test-modal-2');

    expect(retrievedConfig).toEqual(config);
  });

  it('should return undefined for non-existent modal', () => {
    const retrievedConfig = service.getConfig('non-existent-modal');
    expect(retrievedConfig).toBeUndefined();
  });

  it('should handle modal config with fields', () => {
    const fields: FormField[] = [
      { label: 'Title', type: 'text', model: 'title', required: true },
      { label: 'Description', type: 'textarea', model: 'description' }
    ];

    const config: ModalConfig = {
      id: 'form-modal',
      title: 'Form Modal',
      fields: fields,
      data: { title: 'Test', description: 'Test Description' }
    };

    service.open(config);
    const retrievedConfig = service.getConfig('form-modal');

    expect(retrievedConfig?.fields).toEqual(fields);
    expect(retrievedConfig?.data).toEqual({ title: 'Test', description: 'Test Description' });
  });

  it('should handle modal config with showLabels', () => {
    const config: ModalConfig = {
      id: 'label-modal',
      title: 'Label Modal',
      showLabels: true
    };

    service.open(config);
    const retrievedConfig = service.getConfig('label-modal');

    expect(retrievedConfig?.showLabels).toBe(true);
  });

  it('should handle modal config with submitText', () => {
    const config: ModalConfig = {
      id: 'submit-modal',
      title: 'Submit Modal',
      submitText: 'Save Changes'
    };

    service.open(config);
    const retrievedConfig = service.getConfig('submit-modal');

    expect(retrievedConfig?.submitText).toBe('Save Changes');
  });

  it('should overwrite existing modal config with same id', () => {
    const config1: ModalConfig = {
      id: 'modal-1',
      title: 'First Title'
    };

    const config2: ModalConfig = {
      id: 'modal-1',
      title: 'Second Title'
    };

    service.open(config1);
    service.open(config2);

    const retrievedConfig = service.getConfig('modal-1');
    expect(retrievedConfig?.title).toBe('Second Title');
  });

  it('should handle multiple different modals', () => {
    const config1: ModalConfig = { id: 'modal-a', title: 'Modal A' };
    const config2: ModalConfig = { id: 'modal-b', title: 'Modal B' };

    service.open(config1);
    service.open(config2);

    expect(service.getConfig('modal-a')?.title).toBe('Modal A');
    expect(service.getConfig('modal-b')?.title).toBe('Modal B');
  });

  it('should handle form field with options', () => {
    const fields: FormField[] = [
      { 
        label: 'Priority', 
        type: 'select', 
        model: 'priority', 
        options: ['LOW', 'MEDIUM', 'HIGH'] 
      }
    ];

    const config: ModalConfig = {
      id: 'select-modal',
      fields: fields
    };

    service.open(config);
    const retrievedConfig = service.getConfig('select-modal');

    expect(retrievedConfig?.fields?.[0].options).toEqual(['LOW', 'MEDIUM', 'HIGH']);
  });

  it('should handle form field with colSpan', () => {
    const fields: FormField[] = [
      { label: 'Title', type: 'text', model: 'title', colSpan: 2 }
    ];

    const config: ModalConfig = {
      id: 'colspan-modal',
      fields: fields
    };

    service.open(config);
    const retrievedConfig = service.getConfig('colspan-modal');

    expect(retrievedConfig?.fields?.[0].colSpan).toBe(2);
  });
});
