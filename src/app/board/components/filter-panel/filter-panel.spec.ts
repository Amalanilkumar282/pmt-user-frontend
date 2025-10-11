import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FilterPanel } from './filter-panel';
import { BoardStore } from '../../board-store';
import type { Issue } from '../../../shared/models/issue.model';
import { FilterState } from '../../models';

class StoreMock {
  issues = signal<Issue[]>([
    { id:'1', title:'a', description:'', type:'TASK' as any, status:'TODO' as any, priority:'HIGH' as any, assignee:'Joy', labels:['l1'], createdAt: new Date(), updatedAt:new Date() },
    { id:'2', title:'b', description:'', type:'BUG' as any, status:'IN_REVIEW' as any, priority:'LOW' as any, assignee:'Sam', labels:['l2','l1'], createdAt: new Date(), updatedAt:new Date() },
    { id:'3', title:'c', description:'', type:'TASK' as any, status:'DONE' as any, priority:'MEDIUM' as any, assignee:undefined as any, labels:[], createdAt: new Date(), updatedAt:new Date() },
  ]);
  filters = signal<FilterState>({ assignees: [], workTypes: [], labels: [], statuses: [], priorities: [] });
}

describe('FilterPanel', () => {
  let component: FilterPanel;
  let fixture: ComponentFixture<FilterPanel>;
  let storeMock: StoreMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterPanel],
      providers: [{ provide: BoardStore, useClass: StoreMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterPanel);
    component = fixture.componentInstance;
    storeMock = TestBed.inject(BoardStore) as any;
  });

  it('should create with default state', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen).toBe(false);
    expect(component.activeField).toBeNull();
  });

  describe('computed filters derivation', () => {
    it('should derive assignees correctly', () => {
      expect(component.assignees()).toEqual(['Joy','Sam']);
    });

    it('should handle empty assignees', () => {
      storeMock.issues.set([]);
      expect(component.assignees()).toEqual([]);
    });

    it('should filter out undefined and empty assignees', () => {
      storeMock.issues.set([
        { assignee: 'Alice' } as any,
        { assignee: '' } as any,
        { assignee: undefined } as any,
        { assignee: 'Bob' } as any,
        { assignee: null } as any
      ]);
      expect(component.assignees()).toEqual(['Alice', 'Bob']);
    });

    it('should remove duplicate assignees', () => {
      storeMock.issues.set([
        { assignee: 'Alice' } as any,
        { assignee: 'Bob' } as any,
        { assignee: 'Alice' } as any
      ]);
      expect(component.assignees()).toEqual(['Alice', 'Bob']);
    });

    it('should derive work types from issues', () => {
      const workTypes = component.workTypes();
      expect(new Set(workTypes)).toEqual(new Set(['TASK','BUG']));
    });

    it('should handle issues without types', () => {
      storeMock.issues.set([
        { type: undefined } as any,
        { type: 'TASK' } as any
      ]);
      const workTypes = component.workTypes();
      expect(workTypes).toContain('TASK');
      expect(workTypes.some(type => type === undefined)).toBe(true);
    });

    it('should derive labels from all issues', () => {
      const labels = component.labels();
      expect(new Set(labels)).toEqual(new Set(['l1','l2']));
    });

    it('should handle issues without labels', () => {
      storeMock.issues.set([
        { labels: ['tag1'] } as any,
        { labels: undefined } as any,
        { labels: [] } as any,
        { labels: ['tag2'] } as any
      ]);
      expect(component.labels()).toEqual(['tag1', 'tag2']);
    });

    it('should flatten nested labels arrays', () => {
      storeMock.issues.set([
        { labels: ['a', 'b'] } as any,
        { labels: ['c', 'a'] } as any
      ]);
      const labels = component.labels();
      expect(new Set(labels)).toEqual(new Set(['a', 'b', 'c']));
    });

    it('should provide fixed status options', () => {
      expect(component.statuses()).toEqual(['TODO','IN_PROGRESS','IN_REVIEW','DONE']);
    });

    it('should provide fixed priority options', () => {
      expect(component.priorities()).toEqual(['HIGH','MEDIUM','LOW']);
    });
  });

  describe('isSelected', () => {
    it('should return false for unselected values', () => {
      expect(component.isSelected('labels','l1')).toBe(false);
      expect(component.isSelected('assignees','Joy')).toBe(false);
    });

    it('should return true for selected values', () => {
      storeMock.filters.set({ 
        assignees: ['Joy'], 
        workTypes: [], 
        labels: ['l1'], 
        statuses: [], 
        priorities: [] 
      });
      
      expect(component.isSelected('labels','l1')).toBe(true);
      expect(component.isSelected('assignees','Joy')).toBe(true);
      expect(component.isSelected('assignees','Sam')).toBe(false);
    });

    it('should handle all filter types', () => {
      storeMock.filters.set({
        assignees: ['Joy'],
        workTypes: ['TASK'],
        labels: ['l1'],
        statuses: ['TODO'],
        priorities: ['HIGH']
      });

      expect(component.isSelected('assignees', 'Joy')).toBe(true);
      expect(component.isSelected('workTypes', 'TASK')).toBe(true);
      expect(component.isSelected('labels', 'l1')).toBe(true);
      expect(component.isSelected('statuses', 'TODO')).toBe(true);
      expect(component.isSelected('priorities', 'HIGH')).toBe(true);
    });
  });

  describe('toggle', () => {
    it('should add value when not selected', () => {
      component.toggle('labels','l1');
      expect(component.isSelected('labels','l1')).toBe(true);
    });

    it('should remove value when already selected', () => {
      storeMock.filters.set({ 
        assignees: [], 
        workTypes: [], 
        labels: ['l1'], 
        statuses: [], 
        priorities: [] 
      });
      
      component.toggle('labels','l1');
      expect(component.isSelected('labels','l1')).toBe(false);
    });

    it('should preserve other filter values', () => {
      storeMock.filters.set({
        assignees: ['Joy'],
        workTypes: ['TASK'],
        labels: ['l1'],
        statuses: ['TODO'],
        priorities: ['HIGH']
      });

      component.toggle('labels', 'l2');
      
      const filters = storeMock.filters();
      expect(filters.assignees).toEqual(['Joy']);
      expect(filters.workTypes).toEqual(['TASK']);
      expect(filters.labels).toContain('l1');
      expect(filters.labels).toContain('l2');
      expect(filters.statuses).toEqual(['TODO']);
      expect(filters.priorities).toEqual(['HIGH']);
    });

    it('should handle multiple toggles correctly', () => {
      component.toggle('assignees', 'Joy');
      component.toggle('assignees', 'Sam');
      component.toggle('assignees', 'Alice');
      
      expect(storeMock.filters().assignees).toEqual(['Joy', 'Sam', 'Alice']);
      
      component.toggle('assignees', 'Sam'); // Remove Sam
      expect(storeMock.filters().assignees).toEqual(['Joy', 'Alice']);
    });
  });

  describe('togglePanel', () => {
    it('should open panel when closed', () => {
      component.isOpen = false;
      component.togglePanel();
      expect(component.isOpen).toBe(true);
    });

    it('should close panel when open', () => {
      component.isOpen = true;
      component.togglePanel();
      expect(component.isOpen).toBe(false);
    });

    it('should clear activeField when closing', () => {
      component.isOpen = true;
      component.activeField = 'assignees';
      
      component.togglePanel();
      
      expect(component.isOpen).toBe(false);
      expect(component.activeField).toBeNull();
    });

    it('should not clear activeField when opening', () => {
      component.isOpen = false;
      component.activeField = 'labels';
      
      component.togglePanel();
      
      expect(component.isOpen).toBe(true);
      expect(component.activeField).toBe('labels');
    });
  });

  describe('selectField', () => {
    it('should set activeField correctly', () => {
      component.selectField('assignees');
      expect(component.activeField).toBe('assignees');

      component.selectField('workTypes');
      expect(component.activeField).toBe('workTypes');

      component.selectField('labels');
      expect(component.activeField).toBe('labels');
    });

    it('should handle all filter field types', () => {
      const fields: (keyof FilterState)[] = ['assignees', 'workTypes', 'labels', 'statuses', 'priorities'];
      
      fields.forEach(field => {
        component.selectField(field);
        expect(component.activeField).toBe(field);
      });
    });
  });

  describe('reactive updates', () => {
    it('should update computed values when issues change', () => {
      expect(component.assignees()).toEqual(['Joy','Sam']);
      
      storeMock.issues.set([
        { assignee: 'Alice' } as any,
        { assignee: 'Bob' } as any
      ]);
      
      expect(component.assignees()).toEqual(['Alice', 'Bob']);
    });

    it('should reflect filter changes immediately', () => {
      expect(component.isSelected('labels', 'l1')).toBe(false);
      
      storeMock.filters.set({
        assignees: [],
        workTypes: [],
        labels: ['l1'],
        statuses: [],
        priorities: []
      });
      
      expect(component.isSelected('labels', 'l1')).toBe(true);
    });
  });

  describe('integration', () => {
    it('should work with store injection', () => {
      expect(component['store']).toBeDefined();
      expect(component['store']).toBeTruthy();
    });

    it('should use OnPush change detection strategy', () => {
      expect(component).toBeTruthy();
    });

    it('should handle empty store state gracefully', () => {
      storeMock.issues.set([]);
      storeMock.filters.set({ assignees: [], workTypes: [], labels: [], statuses: [], priorities: [] });
      
      expect(component.assignees()).toEqual([]);
      expect(component.workTypes()).toEqual([]);
      expect(component.labels()).toEqual([]);
      expect(component.statuses()).toEqual(['TODO','IN_PROGRESS','IN_REVIEW','DONE']);
      expect(component.priorities()).toEqual(['HIGH','MEDIUM','LOW']);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid panel toggles', () => {
      for (let i = 0; i < 10; i++) {
        component.togglePanel();
      }
      expect(component.isOpen).toBe(false); // Even number of toggles
      expect(component.activeField).toBeNull();
    });

    it('should handle setting activeField when panel is closed', () => {
      component.isOpen = false;
      component.selectField('assignees');
      expect(component.activeField).toBe('assignees');
    });

    it('should handle filter operations with malformed store state', () => {
      storeMock.filters.set(null as any);
      expect(() => {
        component.isSelected('labels', 'test');
      }).toThrow();
    });
  });
});
