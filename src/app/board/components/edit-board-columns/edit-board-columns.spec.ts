import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditBoardColumns } from './edit-board-columns';
import { BoardStore } from '../../board-store';
import { signal } from '@angular/core';
import { BoardColumnDef } from '../../models';

class BoardStoreMock {
  columns = signal<BoardColumnDef[]>([
    { id: 'TODO', title: 'To Do', color: '#3D62A8', position: 1 },
    { id: 'IN_PROGRESS', title: 'In Progress', color: '#10B981', position: 2 },
    { id: 'DONE', title: 'Done', color: '#EF4444', position: 3 }
  ]);
}

describe('EditBoardColumns', () => {
  let component: EditBoardColumns;
  let fixture: ComponentFixture<EditBoardColumns>;
  let storeMock: BoardStoreMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditBoardColumns],
      providers: [
        { provide: BoardStore, useClass: BoardStoreMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditBoardColumns);
    component = fixture.componentInstance;
    storeMock = TestBed.inject(BoardStore) as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with modal closed', () => {
    expect(component.isOpen()).toBe(false);
  });

  it('should initialize with empty editable columns', () => {
    expect(component.editableColumns()).toEqual([]);
  });

  describe('open()', () => {
    it('should set isOpen to true', () => {
      component.open();
      expect(component.isOpen()).toBe(true);
    });

    it('should clone current columns from store', () => {
      component.open();
      
      const editableColumns = component.editableColumns();
      const storeColumns = storeMock.columns();
      
      expect(editableColumns.length).toBe(storeColumns.length);
      expect(editableColumns).toEqual(storeColumns);
      // Should be a copy, not the same reference
      expect(editableColumns).not.toBe(storeColumns);
    });

    it('should create deep copy of columns', () => {
      component.open();
      
      const editableColumns = component.editableColumns();
      const storeColumns = storeMock.columns();
      
      // Modify editable columns
      editableColumns[0].title = 'Modified Title';
      
      // Store columns should remain unchanged
      expect(storeColumns[0].title).toBe('To Do');
    });

    it('should reload columns on each open', () => {
      // First open
      component.open();
      component.editableColumns()[0].title = 'Changed';
      component.close();
      
      // Second open should reload from store
      component.open();
      expect(component.editableColumns()[0].title).toBe('To Do');
    });
  });

  describe('close()', () => {
    it('should set isOpen to false', () => {
      component.open();
      component.close();
      expect(component.isOpen()).toBe(false);
    });

    it('should not modify store columns', () => {
      component.open();
      const originalTitle = storeMock.columns()[0].title;
      
      component.editableColumns()[0].title = 'Changed';
      component.close();
      
      expect(storeMock.columns()[0].title).toBe(originalTitle);
    });

    it('should keep editableColumns after close', () => {
      component.open();
      component.editableColumns()[0].title = 'Modified';
      
      component.close();
      
      // EditableColumns should still have the changes (not cleared)
      expect(component.editableColumns()[0].title).toBe('Modified');
    });
  });

  describe('drop()', () => {
    beforeEach(() => {
      component.open();
    });

    it('should reorder columns when dragged', () => {
      const cols = component.editableColumns();
      const event: any = {
        previousIndex: 0,
        currentIndex: 2,
        container: { data: cols },
        previousContainer: { data: cols }
      };

      component.drop(event);

      const reordered = component.editableColumns();
      expect(reordered[0].id).toBe('IN_PROGRESS');
      expect(reordered[1].id).toBe('DONE');
      expect(reordered[2].id).toBe('TODO');
    });

    it('should handle moving from first to last position', () => {
      const cols = component.editableColumns();
      const event: any = {
        previousIndex: 0,
        currentIndex: 2,
        container: { data: cols },
        previousContainer: { data: cols }
      };

      component.drop(event);

      const reordered = component.editableColumns();
      expect(reordered.length).toBe(3);
      expect(reordered[2].id).toBe('TODO');
    });

    it('should handle moving from last to first position', () => {
      const cols = component.editableColumns();
      const event: any = {
        previousIndex: 2,
        currentIndex: 0,
        container: { data: cols },
        previousContainer: { data: cols }
      };

      component.drop(event);

      const reordered = component.editableColumns();
      expect(reordered[0].id).toBe('DONE');
      expect(reordered[1].id).toBe('TODO');
      expect(reordered[2].id).toBe('IN_PROGRESS');
    });

    it('should handle moving to same position', () => {
      const cols = component.editableColumns();
      const originalOrder = cols.map(c => c.id);
      
      const event: any = {
        previousIndex: 1,
        currentIndex: 1,
        container: { data: cols },
        previousContainer: { data: cols }
      };

      component.drop(event);

      const reordered = component.editableColumns();
      expect(reordered.map(c => c.id)).toEqual(originalOrder);
    });

    it('should maintain all column properties after reorder', () => {
      const cols = component.editableColumns();
      const originalColumn = { ...cols[0] };
      
      const event: any = {
        previousIndex: 0,
        currentIndex: 2,
        container: { data: cols },
        previousContainer: { data: cols }
      };

      component.drop(event);

      const movedColumn = component.editableColumns()[2];
      expect(movedColumn.id).toBe(originalColumn.id);
      expect(movedColumn.title).toBe(originalColumn.title);
      expect(movedColumn.color).toBe(originalColumn.color);
    });
  });

  describe('updateTitle()', () => {
    beforeEach(() => {
      component.open();
    });

    it('should update column title', () => {
      const col = component.editableColumns()[0];
      const newTitle = 'Backlog';

      component.updateTitle(col, newTitle);

      expect(component.editableColumns()[0].title).toBe('Backlog');
    });

    it('should trigger signal update', () => {
      const col = component.editableColumns()[0];
      const spy = jasmine.createSpy('effect');
      
      // Create an effect to observe changes
      let observedValue: BoardColumnDef[] = [];
      const subscription = TestBed.runInInjectionContext(() => {
        const { effect } = require('@angular/core');
        return effect(() => {
          observedValue = component.editableColumns();
          spy();
        });
      });

      component.updateTitle(col, 'New Title');

      expect(spy).toHaveBeenCalled();
      expect(observedValue[0].title).toBe('New Title');
    });

    it('should update title even when empty', () => {
      const col = component.editableColumns()[0];

      component.updateTitle(col, '');

      expect(component.editableColumns()[0].title).toBe('');
    });

    it('should handle special characters in title', () => {
      const col = component.editableColumns()[0];
      const specialTitle = 'On Hold - Waiting for Review!';

      component.updateTitle(col, specialTitle);

      expect(component.editableColumns()[0].title).toBe(specialTitle);
    });

    it('should maintain order when updating title', () => {
      const originalOrder = component.editableColumns().map(c => c.id);

      component.updateTitle(component.editableColumns()[1], 'Updated Title');

      const newOrder = component.editableColumns().map(c => c.id);
      expect(newOrder).toEqual(originalOrder);
    });

    it('should not affect other columns', () => {
      const originalSecondColumn = { ...component.editableColumns()[1] };

      component.updateTitle(component.editableColumns()[0], 'Changed');

      const secondColumn = component.editableColumns()[1];
      expect(secondColumn.id).toBe(originalSecondColumn.id);
      expect(secondColumn.title).toBe(originalSecondColumn.title);
      expect(secondColumn.color).toBe(originalSecondColumn.color);
    });
  });

  describe('save()', () => {
    beforeEach(() => {
      component.open();
    });

    it('should save changes to store', () => {
      component.editableColumns()[0].title = 'Backlog';
      component.editableColumns()[1].title = 'Active Development';

      component.save();

      const storeColumns = storeMock.columns();
      expect(storeColumns[0].title).toBe('Backlog');
      expect(storeColumns[1].title).toBe('Active Development');
    });

    it('should close modal after saving', () => {
      component.save();
      expect(component.isOpen()).toBe(false);
    });

    it('should save reordered columns', () => {
      const cols = component.editableColumns();
      const event: any = {
        previousIndex: 0,
        currentIndex: 2,
        container: { data: cols },
        previousContainer: { data: cols }
      };
      component.drop(event);

      component.save();

      const storeColumns = storeMock.columns();
      expect(storeColumns[0].id).toBe('IN_PROGRESS');
      expect(storeColumns[2].id).toBe('TODO');
    });

    it('should save both reorder and title changes together', () => {
      // Reorder
      const cols = component.editableColumns();
      const event: any = {
        previousIndex: 0,
        currentIndex: 1,
        container: { data: cols },
        previousContainer: { data: cols }
      };
      component.drop(event);

      // Rename
      component.editableColumns()[0].title = 'Working';

      component.save();

      const storeColumns = storeMock.columns();
      expect(storeColumns[0].id).toBe('IN_PROGRESS');
      expect(storeColumns[0].title).toBe('Working');
    });

    it('should create new array reference in store', () => {
      const originalRef = storeMock.columns();

      component.save();

      const newRef = storeMock.columns();
      expect(newRef).not.toBe(originalRef);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow: open, modify, save', () => {
      // Open
      component.open();
      expect(component.isOpen()).toBe(true);

      // Modify
      component.editableColumns()[0].title = 'To-Do';
      const cols = component.editableColumns();
      component.drop({
        previousIndex: 0,
        currentIndex: 2,
        container: { data: cols },
        previousContainer: { data: cols }
      } as any);

      // Save
      component.save();

      // Verify
      expect(component.isOpen()).toBe(false);
      const storeColumns = storeMock.columns();
      expect(storeColumns[2].title).toBe('To-Do');
    });

    it('should handle cancel workflow: open, modify, close without save', () => {
      const originalTitle = storeMock.columns()[0].title;

      // Open and modify
      component.open();
      component.editableColumns()[0].title = 'Changed';

      // Close without saving
      component.close();

      // Store should be unchanged
      expect(storeMock.columns()[0].title).toBe(originalTitle);
    });

    it('should handle multiple edit sessions', () => {
      // First session
      component.open();
      component.editableColumns()[0].title = 'Temp';
      component.save();

      // Second session
      component.open();
      component.editableColumns()[0].title = 'Final';
      component.save();

      expect(storeMock.columns()[0].title).toBe('Final');
    });

    it('should handle opening without closing previous session', () => {
      component.open();
      component.editableColumns()[0].title = 'First Edit';
      
      // Open again without closing/saving
      component.open();
      
      // Should reload from store
      expect(component.editableColumns()[0].title).toBe('To Do');
    });
  });

  describe('edge cases', () => {
    it('should handle empty columns array', () => {
      storeMock.columns.set([]);
      
      component.open();
      
      expect(component.editableColumns()).toEqual([]);
      expect(() => component.save()).not.toThrow();
    });

    it('should handle single column', () => {
      storeMock.columns.set([{ id: 'TODO', title: 'To Do', color: '#3D62A8', position: 1 }]);
      
      component.open();
      component.editableColumns()[0].title = 'Changed';
      component.save();

      expect(storeMock.columns()[0].title).toBe('Changed');
    });

    it('should handle very long column names', () => {
      component.open();
      const longName = 'A'.repeat(100);
      
      component.updateTitle(component.editableColumns()[0], longName);
      component.save();

      expect(storeMock.columns()[0].title).toBe(longName);
    });

    it('should handle unicode characters in title', () => {
      component.open();
      const unicodeTitle = '待办事项 🚀';
      
      component.updateTitle(component.editableColumns()[0], unicodeTitle);
      component.save();

      expect(storeMock.columns()[0].title).toBe(unicodeTitle);
    });
  });
});
