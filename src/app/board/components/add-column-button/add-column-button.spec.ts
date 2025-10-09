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
    expect(component.color).toBe('#A1C4FD');
  });

  it('open sets isOpen to true', () => {
    expect(component.isOpen).toBe(false);
    component.open();
    expect(component.isOpen).toBe(true);
  });

  it('close sets isOpen to false and clears name', () => {
    component.isOpen = true;
    component.name = 'Test Column';
    
    component.close();
    
    expect(component.isOpen).toBe(false);
    expect(component.name).toBe('');
  });

  it('close preserves color when clearing', () => {
    component.isOpen = true;
    component.name = 'Test';
    component.color = '#EF4444';
    
    component.close();
    
    expect(component.color).toBe('#EF4444');
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

    it('should create column with uppercase underscore ID', () => {
      component.name = 'QA Ready';
      component.color = '#A1C4FD';
      
      component.addColumn();
      
      expect(storeMock.addColumn).toHaveBeenCalledWith({
        id: 'QA_READY',
        title: 'QA Ready',
        color: '#A1C4FD'
      });
    });

    it('should handle names with multiple spaces', () => {
      component.name = 'Quality   Assurance    Ready';
      
      component.addColumn();
      
      expect(storeMock.addColumn).toHaveBeenCalledWith({
        id: 'QUALITY_ASSURANCE_READY',
        title: 'Quality   Assurance    Ready',
        color: '#A1C4FD'
      });
    });

    it('should handle names with special characters', () => {
      component.name = 'Ready for Testing!';
      
      component.addColumn();
      
      expect(storeMock.addColumn).toHaveBeenCalledWith({
        id: 'READY_FOR_TESTING!',
        title: 'Ready for Testing!',
        color: '#A1C4FD'
      });
    });

    it('should handle single word names', () => {
      component.name = 'testing';
      
      component.addColumn();
      
      expect(storeMock.addColumn).toHaveBeenCalledWith({
        id: 'TESTING',
        title: 'testing',
        color: '#A1C4FD'
      });
    });

    it('should close modal after adding column', () => {
      component.name = 'Valid Name';
      component.isOpen = true;
      
      component.addColumn();
      
      expect(component.isOpen).toBe(false);
      expect(component.name).toBe('');
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

  describe('state management', () => {
    it('should maintain state independently between operations', () => {
      component.name = 'First Column';
      component.color = '#10B981';
      component.open();
      
      expect(component.isOpen).toBe(true);
      expect(component.name).toBe('First Column');
      expect(component.color).toBe('#10B981');
      
      component.addColumn();
      
      expect(component.isOpen).toBe(false);
      expect(component.name).toBe('');
      expect(component.color).toBe('#10B981'); // Should persist
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
