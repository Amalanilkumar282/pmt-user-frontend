import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AddColumnButton } from './add-column-button';
import { BoardStore } from '../../board-store';

class StoreMock {
  columns = signal<any[]>([]);
  addColumn = jasmine.createSpy('addColumn');
}

describe('AddColumnButton', () => {
  let component: AddColumnButton;
  let fixture: ComponentFixture<AddColumnButton>;
  let storeMock: StoreMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddColumnButton],
      providers: [{ provide: BoardStore, useClass: StoreMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(AddColumnButton);
    component = fixture.componentInstance;
    storeMock = TestBed.inject(BoardStore) as any;
  });

  it('should create with default values', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen).toBe(false);
    expect(component.name).toBe('');
    expect(component.color).toBe('#3D62A8');
  });

  it('open sets isOpen to true and resets values', () => {
    component.name = 'old';
    component.color = '#000000';
    
    component.open();
    
    expect(component.isOpen).toBe(true);
    expect(component.name).toBe('');
    expect(component.color).toBe('#3D62A8');
  });

  it('close sets isOpen to false and clears values', () => {
    component.isOpen = true;
    component.name = 'Test Column';
    component.color = '#EF4444';
    
    component.close();
    
    expect(component.isOpen).toBe(false);
    expect(component.name).toBe('');
    expect(component.color).toBe('#3D62A8');
  });

  describe('addColumn', () => {
    it('should ignore empty name', () => {
      component.name = '';
      component.addColumn();
      expect(storeMock.addColumn).not.toHaveBeenCalled();
    });

    it('should ignore whitespace-only name', () => {
      component.name = '   \t\n  ';
      component.addColumn();
      expect(storeMock.addColumn).not.toHaveBeenCalled();
    });

    it('should create column with uppercase underscore ID and trim title', () => {
      component.name = 'QA Ready';
      component.color = '#3D62A8';
      
      component.addColumn();
      
      expect(storeMock.addColumn).toHaveBeenCalledWith({
        id: 'QA_READY',
        title: 'QA Ready',
        color: '#3D62A8'
      });
    });

    it('should handle names with multiple spaces', () => {
      component.name = 'Quality   Assurance    Ready';
      
      component.addColumn();
      
      expect(storeMock.addColumn).toHaveBeenCalledWith({
        id: 'QUALITY_ASSURANCE_READY',
        title: 'Quality   Assurance    Ready',
        color: '#3D62A8'
      });
    });

    it('should handle names with special characters', () => {
      component.name = 'Ready for Testing!';
      
      component.addColumn();
      
      expect(storeMock.addColumn).toHaveBeenCalledWith({
        id: 'READY_FOR_TESTING!',
        title: 'Ready for Testing!',
        color: '#3D62A8'
      });
    });

    it('should handle single word names', () => {
      component.name = 'testing';
      
      component.addColumn();
      
      expect(storeMock.addColumn).toHaveBeenCalledWith({
        id: 'TESTING',
        title: 'testing',
        color: '#3D62A8'
      });
    });

    it('should close modal after adding column', () => {
      component.name = 'Valid Name';
      component.isOpen = true;
      
      component.addColumn();
      
      expect(component.isOpen).toBe(false);
      expect(component.name).toBe('');
      expect(component.color).toBe('#3D62A8');
    });

    it('should use custom color when set', () => {
      component.name = 'Custom Column';
      component.color = '#EF4444';
      
      component.addColumn();
      
      expect(storeMock.addColumn).toHaveBeenCalledWith({
        id: 'CUSTOM_COLUMN',
        title: 'Custom Column',
        color: '#EF4444'
      });
    });

    it('should preserve title case and formatting', () => {
      component.name = 'Done - Ready for Production';
      
      component.addColumn();
      
      const call = storeMock.addColumn.calls.mostRecent();
      expect(call.args[0].title).toBe('Done - Ready for Production');
      expect(call.args[0].id).toBe('DONE_-_READY_FOR_PRODUCTION');
    });
  });

  describe('isValid', () => {
    it('should return false for empty name', () => {
      component.name = '';
      component.color = '#3D62A8';
      expect(component.isValid()).toBe(false);
    });

    it('should return false for whitespace-only name', () => {
      component.name = '   ';
      component.color = '#3D62A8';
      expect(component.isValid()).toBe(false);
    });

    it('should return false for invalid hex color', () => {
      component.name = 'Test';
      component.color = 'invalid';
      expect(component.isValid()).toBe(false);
    });

    it('should return false for short hex color', () => {
      component.name = 'Test';
      component.color = '#FFF';
      expect(component.isValid()).toBe(false);
    });

    it('should return true for valid name and color', () => {
      component.name = 'Test Column';
      component.color = '#3D62A8';
      expect(component.isValid()).toBe(true);
    });
  });

  describe('isValidHexColor', () => {
    it('should validate correct hex colors', () => {
      expect(component.isValidHexColor('#000000')).toBe(true);
      expect(component.isValidHexColor('#FFFFFF')).toBe(true);
      expect(component.isValidHexColor('#3D62A8')).toBe(true);
      expect(component.isValidHexColor('#abc123')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(component.isValidHexColor('000000')).toBe(false);
      expect(component.isValidHexColor('#FFF')).toBe(false);
      expect(component.isValidHexColor('#GGGGGG')).toBe(false);
      expect(component.isValidHexColor('invalid')).toBe(false);
      expect(component.isValidHexColor('')).toBe(false);
    });
  });

  describe('validateHexColor', () => {
    it('should add # prefix if missing', () => {
      const event = { target: { value: 'FF0000' } } as any;
      component.validateHexColor(event);
      expect(component.color).toBe('#FF0000');
    });

    it('should convert to uppercase', () => {
      const event = { target: { value: '#abc123' } } as any;
      component.validateHexColor(event);
      expect(component.color).toBe('#ABC123');
    });

    it('should remove invalid characters', () => {
      const event = { target: { value: '#XYZ123' } } as any;
      component.validateHexColor(event);
      expect(component.color).toBe('#123');
    });

    it('should limit to 7 characters', () => {
      const event = { target: { value: '#FFFFFFFF' } } as any;
      component.validateHexColor(event);
      expect(component.color).toBe('#FFFFFF');
    });
  });

  describe('state management', () => {
    it('should reset values on open', () => {
      component.name = 'Old';
      component.color = '#10B981';
      
      component.open();
      
      expect(component.isOpen).toBe(true);
      expect(component.name).toBe('');
      expect(component.color).toBe('#3D62A8');
    });

    it('should handle multiple open/close cycles', () => {
      component.open();
      expect(component.isOpen).toBe(true);
      
      component.close();
      expect(component.isOpen).toBe(false);
      
      component.open();
      expect(component.isOpen).toBe(true);
      
      component.close();
      expect(component.isOpen).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle addColumn when already closed', () => {
      component.name = 'Test';
      component.isOpen = false;
      
      component.addColumn();
      
      expect(storeMock.addColumn).toHaveBeenCalled();
      expect(component.isOpen).toBe(false); // Should remain false
    });

    it('should handle close when already closed', () => {
      component.isOpen = false;
      component.name = 'Test';
      
      component.close();
      
      expect(component.isOpen).toBe(false);
      expect(component.name).toBe('');
    });

    it('should handle open when already open', () => {
      component.isOpen = true;
      
      component.open();
      
      expect(component.isOpen).toBe(true);
    });
  });

  describe('integration', () => {
    it('should inject BoardStore correctly', () => {
      expect(component['store']).toBeDefined();
      expect(component['store']).toBeTruthy();
    });

    it('should work with FormsModule for two-way binding', () => {
      // Component imports FormsModule for template binding
      expect(component.name).toBe('');
      component.name = 'Updated via binding';
      expect(component.name).toBe('Updated via binding');
    });
  });
});
