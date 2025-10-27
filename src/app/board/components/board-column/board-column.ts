import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BoardColumnDef, GroupBy } from '../../models';
import type { Issue, IssueStatus } from '../../../shared/models/issue.model';
import { BoardStore } from '../../board-store';
import { TaskCard } from '../task-card/task-card';
import { QuickCreateIssue, QuickCreateIssueData } from '../quick-create-issue/quick-create-issue';

interface GroupedIssues {
  groupName: string;
  issues: Issue[];
}

@Component({
  selector: 'app-board-column',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskCard, QuickCreateIssue],
  templateUrl: './board-column.html',
  styleUrls: ['./board-column.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardColumn {
  private store = inject(BoardStore);
  
  @Output() openIssue = new EventEmitter<Issue>();
  @Output() openIssueComments = new EventEmitter<Issue>();
  @Output() quickCreateIssue = new EventEmitter<{ title: string, status: IssueStatus }>();
  // safe default to avoid undefined accesses in tests
  @Input() def: BoardColumnDef = { id: 'TODO', title: '', color: 'border-slate-200' };
  @Input() items: Issue[] = [];
  @Input() connectedTo: string[] = [];
  @Input() groupBy: GroupBy = 'NONE';

  trackById(index: number, item: Issue): string {
    return item.id;
  }
  
  // Get the previous issue to determine if we need to show a group header
  getPreviousIssue(index: number): Issue | null {
    return index > 0 ? this.items[index - 1] : null;
  }
  
  // Check if we should show a group header before this issue
  shouldShowGroupHeader(issue: Issue, previousIssue: Issue | null): boolean {
    if (this.groupBy === 'NONE') return false;
    
    const currentGroup = this.getGroupKey(issue);
    const previousGroup = previousIssue ? this.getGroupKey(previousIssue) : null;
    
    return currentGroup !== previousGroup;
  }
  
  // Get the group key for an issue
  getGroupKey(issue: Issue): string {
    if (this.groupBy === 'ASSIGNEE') {
      return issue.assignee || 'Unassigned';
    } else if (this.groupBy === 'EPIC') {
      return issue.epicId || 'No Epic';
    } else if (this.groupBy === 'SUBTASK') {
      return issue.parentId || 'No Parent';
    }
    return '';
  }
  
  // Get sorted items by group
  get sortedItems(): Issue[] {
    if (this.groupBy === 'NONE') {
      return this.items;
    }
    
    // Sort items by their group key
    return [...this.items].sort((a, b) => {
      const groupA = this.getGroupKey(a);
      const groupB = this.getGroupKey(b);
      return groupA.localeCompare(groupB);
    });
  }
  
  // simple pagination per column
  pageSize = 20;
  get pageItems() { return this.items.slice(0, this.pageSize); }
  loadMore() { this.pageSize += 20; }

  onOpen(issue: Issue) {
    this.openIssue.emit(issue);
  }
  
  onOpenComments(issue: Issue) {
    this.openIssueComments.emit(issue);
  }

  drop(event: CdkDragDrop<Issue[]>) {
    // Same container - reorder within column
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      
      // Sync back to items array if using sortedItems
      if (this.groupBy !== 'NONE') {
        this.items.length = 0;
        this.items.push(...event.container.data);
      }
      return;
    }
    
    // Different container - move between columns  
    const item = event.previousContainer.data[event.previousIndex];
    
    // Transfer the item
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
    
    // Sync both source and destination items arrays if needed
    const sourceColumn = (event.previousContainer as any)._element?.nativeElement?.closest?.('app-board-column');
    const destColumn = (event.container as any)._element?.nativeElement?.closest?.('app-board-column');
    
    // Update status in store (this will trigger re-render with correct data)
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
  
  onQuickCreate(issueData: QuickCreateIssueData): void {
    // Create issue directly in BoardStore
    const currentBoard = this.store.currentBoard();
    this.store.createIssue({
      title: issueData.title,
      status: issueData.status,
      type: issueData.type,
      priority: issueData.priority,
      assignee: issueData.assignee === 'Unassigned' ? undefined : issueData.assignee,
      teamId: currentBoard?.type === 'TEAM' ? currentBoard.teamId : undefined
    });
  }
}
