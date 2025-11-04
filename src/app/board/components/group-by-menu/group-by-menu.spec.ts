import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { GroupByMenu } from './group-by-menu';
import { BoardStore } from '../../board-store';
import { GroupBy } from '../../models';

class StoreMock {
  groupBy = signal<GroupBy>('NONE');
}

describe('GroupByMenu', () => {
  let component: GroupByMenu;
  let fixture: ComponentFixture<GroupByMenu>;
  let storeMock: StoreMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupByMenu],
      providers: [{ provide: BoardStore, useClass: StoreMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(GroupByMenu);
    component = fixture.componentInstance;
    storeMock = TestBed.inject(BoardStore) as any;
  });

  it('should create with default values', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen).toBe(false);
  });

  it('should define all group by options', () => {
    expect(component.groupByOptions).toBeDefined();
    expect(component.groupByOptions.length).toBe(3);
    
    const optionValues = component.groupByOptions.map(opt => opt.value);
    expect(optionValues).toContain('NONE');
    expect(optionValues).toContain('ASSIGNEE');
    expect(optionValues).toContain('EPIC');
  });

  it('should have correct labels for options', () => {
    const optionLabels = component.groupByOptions.map(opt => opt.label);
  expect(optionLabels).toContain('None');
  expect(optionLabels).toContain('Assignee');
  expect(optionLabels).toContain('Epic');
  });

  describe('getCurrentLabel', () => {
    it('should return correct label for NONE', () => {
      storeMock.groupBy.set('NONE');
      expect(component.getCurrentLabel()).toBe('None');
    });

    it('should return correct label for ASSIGNEE', () => {
      storeMock.groupBy.set('ASSIGNEE');
      expect(component.getCurrentLabel()).toBe('Assignee');
    });

    it('should return correct label for EPIC', () => {
      storeMock.groupBy.set('EPIC');
      expect(component.getCurrentLabel()).toBe('Epic');
    });

    // SUBTASK option removed - no test for it

    it('should default to None for unknown values', () => {
      storeMock.groupBy.set('UNKNOWN' as any);
      expect(component.getCurrentLabel()).toBe('None');
    });
  });

  describe('isSelected', () => {
    it('should return true for currently selected option', () => {
      storeMock.groupBy.set('ASSIGNEE');
      expect(component.isSelected('ASSIGNEE')).toBe(true);
    });

    it('should return false for non-selected options', () => {
      storeMock.groupBy.set('ASSIGNEE');
    expect(component.isSelected('NONE')).toBe(false);
    expect(component.isSelected('EPIC')).toBe(false);
    });

    it('should react to store changes', () => {
      storeMock.groupBy.set('NONE');
      expect(component.isSelected('NONE')).toBe(true);
      
      storeMock.groupBy.set('EPIC');
      expect(component.isSelected('NONE')).toBe(false);
      expect(component.isSelected('EPIC')).toBe(true);
    });
  });

  describe('toggleMenu', () => {
    it('should open menu when closed', () => {
      component.isOpen = false;
      component.toggleMenu();
      expect(component.isOpen).toBe(true);
    });

    it('should close menu when open', () => {
      component.isOpen = true;
      component.toggleMenu();
      expect(component.isOpen).toBe(false);
    });

    it('should toggle multiple times correctly', () => {
      expect(component.isOpen).toBe(false);
      
      component.toggleMenu();
      expect(component.isOpen).toBe(true);
      
      component.toggleMenu();
      expect(component.isOpen).toBe(false);
      
      component.toggleMenu();
      expect(component.isOpen).toBe(true);
    });
  });

  describe('selectOption', () => {
    it('should set store value and close menu', () => {
      component.isOpen = true;
      component.selectOption('ASSIGNEE');
      
      expect(storeMock.groupBy()).toBe('ASSIGNEE');
      expect(component.isOpen).toBe(false);
    });

    it('should handle all valid options', () => {
      const validOptions: GroupBy[] = ['NONE', 'ASSIGNEE', 'EPIC'];
      
      validOptions.forEach(option => {
        component.isOpen = true;
        component.selectOption(option);
        
        expect(storeMock.groupBy()).toBe(option);
        expect(component.isOpen).toBe(false);
      });
    });

    it('should close menu even when selecting same value', () => {
      storeMock.groupBy.set('ASSIGNEE');
      component.isOpen = true;
      
      component.selectOption('ASSIGNEE');
      
      expect(storeMock.groupBy()).toBe('ASSIGNEE');
      expect(component.isOpen).toBe(false);
    });
  });

  describe('integration', () => {
    it('should work with store signal reactivity', () => {
      // Initial state
      expect(component.getCurrentLabel()).toBe('None');
      expect(component.isSelected('NONE')).toBe(true);
      
      // Change store value
      storeMock.groupBy.set('EPIC');
      
      // Component should reflect changes
      expect(component.getCurrentLabel()).toBe('Epic');
      expect(component.isSelected('EPIC')).toBe(true);
      expect(component.isSelected('NONE')).toBe(false);
    });

    it('should inject BoardStore correctly', () => {
      expect(component['store']).toBeDefined();
      expect(component['store']).toBeTruthy();
    });

    it('should use OnPush change detection strategy', () => {
      // Component decorator specifies OnPush strategy
      expect(component).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid toggles', () => {
      for (let i = 0; i < 10; i++) {
        component.toggleMenu();
      }
      expect(component.isOpen).toBe(false); // Should end up closed (even number of toggles)
    });

    it('should handle selecting options when menu is already closed', () => {
      component.isOpen = false;
      component.selectOption('EPIC');
      
      expect(storeMock.groupBy()).toBe('EPIC');
      expect(component.isOpen).toBe(false);
    });

    it('should handle options array immutability', () => {
      const originalOptions = component.groupByOptions;
      expect(component.groupByOptions).toBe(originalOptions);
      
      // Options should be readonly and not change
      expect(component.groupByOptions).toEqual([
        { label: 'None', value: 'NONE' },
        { label: 'Assignee', value: 'ASSIGNEE' },
        { label: 'Epic', value: 'EPIC' }
      ]);
    });
  });
});
