import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BoardColumnDef, GroupBy } from '../../models';
import type { Issue, IssueStatus } from '../../../shared/models/issue.model';
import { BoardStore } from '../../board-store';
import { TaskCard } from '../task-card/task-card';

interface GroupedIssues {
  groupName: string;
  issues: Issue[];
}

@Component({
  selector: 'app-board-column',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskCard],
  templateUrl: './board-column.html',
  styleUrls: ['./board-column.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardColumn {
  @Output() openIssue = new EventEmitter<Issue>();
  // safe default to avoid undefined accesses in tests
  @Input() def: BoardColumnDef = { id: 'TODO', title: '', color: 'border-slate-200' };
  @Input() items: Issue[] = [];
  @Input() connectedTo: string[] = [];
  @Input() groupBy: GroupBy = 'NONE';

  trackById(index: number, item: Issue): string {
    return item.id;
  }
  
  // Group issues based on groupBy mode
  get groupedIssues(): GroupedIssues[] {
    if (this.groupBy === 'NONE') {
      return [{ groupName: '', issues: this.items }];
    }
    
    const groups = new Map<string, Issue[]>();
    
    this.items.forEach(issue => {
      let groupKey = '';
      
      if (this.groupBy === 'ASSIGNEE') {
        groupKey = issue.assignee || 'Unassigned';
      } else if (this.groupBy === 'EPIC') {
        groupKey = issue.epicId || 'No Epic';
      } else if (this.groupBy === 'SUBTASK') {
        groupKey = issue.parentId || 'No Parent';
      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(issue);
    });
    
    // Convert map to array and sort by group name
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupName, issues]) => ({ groupName, issues }));
  }
  
  // simple pagination per column
  pageSize = 20;
  get pageItems() { return this.items.slice(0, this.pageSize); }
  loadMore() { this.pageSize += 20; }

  constructor(private store: BoardStore) {}

  onOpen(issue: Issue) {
    this.openIssue.emit(issue);
  }

  drop(event: CdkDragDrop<Issue[]>) {
    // Consider containers the same when they are the same object or share the same data array
    if (event.previousContainer === event.container || event.previousContainer?.data === event.container?.data) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }
    const item = event.previousContainer.data[event.previousIndex];
    // update status in store
    this.store.updateIssueStatus(item.id, this.def.id as IssueStatus);
    }

  onDeleteColumn() {
    // if there are items in the column, ask user to move them first
    if ((this.items ?? []).length > 0) {
      const ok = confirm('This column is not empty. Please move or remove the issues before deleting the column.');
      return ok; // returns true/false for possible callers, but we don't delete unless empty
    }
    // delete column via store
    this.store.removeColumn(this.def.id as any);
    return true;
  }

  getColumnColorClass(): string {
    // Map column colors to indicator dot colors
    const colorMap: Record<string, string> = {
      'border-slate-300': 'bg-gray-400',
      'border-rose-300': 'bg-red-400',
      'border-emerald-300': 'bg-green-400',
      'border-blue-300': 'bg-blue-400',
      'border-purple-300': 'bg-purple-400',
      'border-orange-300': 'bg-orange-400',
      'border-yellow-300': 'bg-yellow-400'
    };
    return colorMap[this.def.color] || 'bg-gray-400';
  }
}
