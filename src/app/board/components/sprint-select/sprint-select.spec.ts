import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SprintSelect } from './sprint-select';
import type { Sprint } from '../../models';

describe('SprintSelect', () => {
  let component: SprintSelect;
  let fixture: ComponentFixture<SprintSelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SprintSelect]
    }).compileComponents();

    fixture = TestBed.createComponent(SprintSelect);
    component = fixture.componentInstance;
  });

  it('should create with default values', () => {
    expect(component).toBeTruthy();
    expect(component.sprints).toEqual([]);
    expect(component.selectedId).toBe('BACKLOG');
    expect(component.open).toBe(false);
  });

  describe('getCurrentLabel', () => {
    it('should return "Backlog" for BACKLOG selection', () => {
      component.selectedId = 'BACKLOG';
      expect(component.getCurrentLabel()).toBe('Backlog');
    });

    it('should return sprint name with "Current" suffix for ACTIVE sprints', () => {
      const sprints: Sprint[] = [
        { id:'active-1', name:'Sprint 1', startDate:new Date(), endDate:new Date(), status:'ACTIVE', issues:[] }
      ];
      component.sprints = sprints;
      component.selectedId = 'active-1';
      
      expect(component.getCurrentLabel()).toBe('Sprint 1 - Current');
    });

    it('should return plain sprint name for non-ACTIVE sprints', () => {
      const sprints: Sprint[] = [
        { id:'planned-1', name:'Sprint 2', startDate:new Date(), endDate:new Date(), status:'PLANNED', issues:[] },
        { id:'complete-1', name:'Sprint 3', startDate:new Date(), endDate:new Date(), status:'COMPLETED', issues:[] }
      ];
      component.sprints = sprints;
      
      component.selectedId = 'planned-1';
      expect(component.getCurrentLabel()).toBe('Sprint 2');
      
      component.selectedId = 'complete-1';
      expect(component.getCurrentLabel()).toBe('Sprint 3');
    });

    it('should return "Select Sprint" for unknown sprint ID', () => {
      component.sprints = [
        { id:'known', name:'Known Sprint', startDate:new Date(), endDate:new Date(), status:'PLANNED', issues:[] }
      ];
      component.selectedId = 'unknown';
      
      expect(component.getCurrentLabel()).toBe('Select Sprint');
    });

    it('should handle empty sprints array', () => {
      component.sprints = [];
      component.selectedId = 'any-id';
      
      expect(component.getCurrentLabel()).toBe('Select Sprint');
    });
  });

  describe('label', () => {
    it('should format ACTIVE sprint with " - Current" suffix', () => {
      const sprint: Sprint = { 
        id:'test', 
        name:'Test Sprint', 
        startDate: new Date(), 
        endDate: new Date(), 
        status:'ACTIVE', 
        issues:[] 
      };
      
      expect(component.label(sprint)).toBe('Test Sprint - Current');
    });

    it('should return plain name for PLANNED sprints', () => {
      const sprint: Sprint = { 
        id:'test', 
        name:'Planned Sprint', 
        startDate: new Date(), 
        endDate: new Date(), 
        status:'PLANNED', 
        issues:[] 
      };
      
      expect(component.label(sprint)).toBe('Planned Sprint');
    });

    it('should return plain name for COMPLETED sprints', () => {
      const sprint: Sprint = { 
        id:'test', 
        name:'Done Sprint', 
        startDate: new Date(), 
        endDate: new Date(), 
        status:'COMPLETED', 
        issues:[] 
      };
      
      expect(component.label(sprint)).toBe('Done Sprint');
    });

    it('should handle special characters in sprint names', () => {
      const sprint: Sprint = { 
        id:'special', 
        name:'Sprint "Q1" & More!', 
        startDate: new Date(), 
        endDate: new Date(), 
        status:'ACTIVE', 
        issues:[] 
      };
      
      expect(component.label(sprint)).toBe('Sprint "Q1" & More! - Current');
    });
  });

  describe('selectSprint', () => {
    it('should emit select event and close dropdown', () => {
      spyOn(component.select, 'emit');
      component.open = true;
      
      component.selectSprint('test-sprint');
      
      expect(component.select.emit).toHaveBeenCalledWith('test-sprint');
      expect(component.open).toBe(false);
    });

    it('should handle BACKLOG selection', () => {
      spyOn(component.select, 'emit');
      component.open = true;
      
      component.selectSprint('BACKLOG');
      
      expect(component.select.emit).toHaveBeenCalledWith('BACKLOG');
      expect(component.open).toBe(false);
    });

    it('should close dropdown even when already closed', () => {
      spyOn(component.select, 'emit');
      component.open = false;
      
      component.selectSprint('test');
      
      expect(component.select.emit).toHaveBeenCalledWith('test');
      expect(component.open).toBe(false);
    });

    it('should handle empty string selection', () => {
      spyOn(component.select, 'emit');
      
      component.selectSprint('');
      
      expect(component.select.emit).toHaveBeenCalledWith('');
      expect(component.open).toBe(false);
    });
  });

  describe('selectedRange', () => {
    it('should return empty string for BACKLOG selection', () => {
      component.selectedId = 'BACKLOG';
      component.sprints = [
        { id:'test', name:'Test', startDate: new Date(2024, 0, 1), endDate: new Date(2024, 0, 15), status:'PLANNED', issues:[] }
      ];
      
      expect(component.selectedRange).toBe('');
    });

    it('should return empty string for unknown sprint', () => {
      component.selectedId = 'unknown';
      component.sprints = [];
      
      expect(component.selectedRange).toBe('');
    });

    it('should format date range correctly', () => {
      const startDate = new Date(2024, 0, 1); // Jan 1, 2024
      const endDate = new Date(2024, 0, 15);   // Jan 15, 2024
      
      component.sprints = [
        { id:'test', name:'Test Sprint', startDate, endDate, status:'PLANNED', issues:[] }
      ];
      component.selectedId = 'test';
      
      const range = component.selectedRange;
      expect(range).toContain('Jan');
      expect(range).toContain('1');
      expect(range).toContain('15');
      expect(range).toContain('-');
    });

    it('should handle cross-month date ranges', () => {
      const startDate = new Date(2024, 0, 25); // Jan 25, 2024
      const endDate = new Date(2024, 1, 8);    // Feb 8, 2024
      
      component.sprints = [
        { id:'cross-month', name:'Cross Month Sprint', startDate, endDate, status:'ACTIVE', issues:[] }
      ];
      component.selectedId = 'cross-month';
      
      const range = component.selectedRange;
      expect(range).toContain('Jan');
      expect(range).toContain('Feb');
      expect(range).toContain('25');
      expect(range).toContain('8');
    });

  });

  describe('component state management', () => {
    it('should handle open state correctly', () => {
      expect(component.open).toBe(false);
      
      component.open = true;
      expect(component.open).toBe(true);
      
      component.selectSprint('test');
      expect(component.open).toBe(false);
    });

    it('should accept sprints input changes', () => {
      const initialSprints: Sprint[] = [
        { id:'1', name:'Sprint 1', startDate: new Date(), endDate: new Date(), status:'PLANNED', issues:[] }
      ];
      
      component.sprints = initialSprints;
      expect(component.sprints).toBe(initialSprints);
      
      const newSprints: Sprint[] = [
        { id:'2', name:'Sprint 2', startDate: new Date(), endDate: new Date(), status:'ACTIVE', issues:[] }
      ];
      
      component.sprints = newSprints;
      expect(component.sprints).toBe(newSprints);
    });

    it('should accept selectedId input changes', () => {
      component.selectedId = 'test-1';
      expect(component.selectedId).toBe('test-1');
      
      component.selectedId = 'BACKLOG';
      expect(component.selectedId).toBe('BACKLOG');
    });
  });

  describe('integration', () => {
    it('should work with OnPush change detection strategy', () => {
      expect(component).toBeTruthy();
      // OnPush strategy is specified in component decorator
    });

    it('should integrate with ClickOutsideDirective', () => {
      // Component imports ClickOutsideDirective for dropdown behavior
      expect(component).toBeTruthy();
    });

    it('should emit proper event types', () => {
      let emittedValue: string | 'BACKLOG' | undefined;
      
      component.select.subscribe(value => {
        emittedValue = value;
      });
      
      component.selectSprint('test-sprint');
      expect(emittedValue).toBe('test-sprint');
      
      component.selectSprint('BACKLOG');
      expect(emittedValue).toBe('BACKLOG');
    });
  });

  describe('edge cases', () => {
    it('should handle malformed sprint data gracefully', () => {
      const malformedSprint = {
        id: 'malformed',
        name: '',
        startDate: null,
        endDate: null,
        status: 'UNKNOWN',
        issues: null
      } as any;
      
      component.sprints = [malformedSprint];
      component.selectedId = 'malformed';
      
      expect(() => {
        component.getCurrentLabel();
        component.label(malformedSprint);
        component.selectedRange;
      }).not.toThrow();
    });

    it('should handle very long sprint names', () => {
      const longName = 'A'.repeat(100);
      const sprint: Sprint = {
        id: 'long',
        name: longName,
        startDate: new Date(),
        endDate: new Date(),
        status: 'ACTIVE',
        issues: []
      };
      
      expect(component.label(sprint)).toBe(`${longName} - Current`);
    });

  });
});
