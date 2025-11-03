import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BoardColumnDef, GroupBy } from '../../models';
import type { Issue, IssueStatus } from '../../../shared/models/issue.model';
import { BoardStore } from '../../board-store';
import { BoardService } from '../../services/board.service';
import { TaskCard } from '../task-card/task-card';
import { QuickCreateIssue, QuickCreateIssueData } from '../quick-create-issue/quick-create-issue';
import { ConfirmationModal } from '../../../shared/components/confirmation-modal/confirmation-modal';
import { ProjectContextService } from '../../../shared/services/project-context.service';

interface GroupedIssues {
  groupName: string;
  issues: Issue[];
}

@Component({
  selector: 'app-board-column',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskCard, QuickCreateIssue, ConfirmationModal],
  templateUrl: './board-column.html',
  styleUrls: ['./board-column.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardColumn {
  private store = inject(BoardStore);
  private boardService = inject(BoardService);
  private projectContextService = inject(ProjectContextService);
  
  @Output() openIssue = new EventEmitter<Issue>();
  @Output() openIssueComments = new EventEmitter<Issue>();
  @Output() quickCreateIssue = new EventEmitter<{ title: string, status: IssueStatus }>();
  // safe default to avoid undefined accesses in tests
  @Input() def: BoardColumnDef = { id: 'TODO', title: '', color: 'border-slate-200', position: 1 };
  @Input() items: Issue[] = [];
  @Input() connectedTo: string[] = [];
  @Input() groupBy: GroupBy = 'NONE';

  // Confirmation modal state
  showDeleteConfirmation = signal(false);
  isDeletingColumn = signal(false);
  deleteError = signal<string | null>(null);

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

  async drop(event: CdkDragDrop<Issue[]>) {
    // Same container - reorder within column (no API call needed)
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      
      // Sync back to items array if using sortedItems
      if (this.groupBy !== 'NONE') {
        this.items.length = 0;
        this.items.push(...event.container.data);
      }
      return;
    }
    
    // Different container - move between columns and update via API
    const item = event.previousContainer.data[event.previousIndex];
    const projectId = this.projectContextService.currentProjectId();
    
    // Optimistic update - transfer the item in UI
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
    
    // Call backend API to persist the status change
    if (this.def.statusId !== undefined && projectId && item) {
      try {
        console.log('[BoardColumn] Drag-drop: Updating issue status via API', {
          issueId: item.id,
          issueKey: item.key,
          fromStatus: item.statusId,
          toStatus: this.def.statusId,
          columnName: this.def.title
        });
        
        await this.store.updateIssueStatusApi(item.id, this.def.statusId, projectId);
        
        console.log('[BoardColumn] Issue status updated successfully');
      } catch (error) {
        console.error('[BoardColumn] Failed to update issue status:', error);
        
        // Rollback UI change on error
        transferArrayItem(
          event.container.data,
          event.previousContainer.data,
          event.currentIndex,
          event.previousIndex
        );
        
        alert('Failed to update issue status. Please try again.');
      }
    } else {
      console.error('[BoardColumn] Missing data for status update:', {
        statusId: this.def.statusId,
        projectId,
        issue: item?.id
      });
      
      // Fallback to local update if API data is missing
      this.store.updateIssueStatus(item.id, this.def.id as IssueStatus);
    }
  }

  onDeleteColumn() {
    // Always show confirmation modal before deleting
    this.showDeleteConfirmation.set(true);
    return false;
  }

  async confirmDeleteColumn() {
    // If there are items in the column, don't delete
    if ((this.items ?? []).length > 0) {
      // User confirmed but column has items - we don't actually delete
      // This shouldn't happen since we check in the modal, but just in case
      this.showDeleteConfirmation.set(false);
      return;
    }
    
    const board = this.store.currentBoard();
    if (!board || !board.id) {
      // Fallback: delete locally if no board context
      this.store.removeColumn(this.def.id as any);
      this.showDeleteConfirmation.set(false);
      return;
    }

    // Use columnId (the backend database ID) for the API call, fallback to id
    const columnIdToDelete = this.def.columnId || String(this.def.id);
    
    try {
      this.isDeletingColumn.set(true);
      this.deleteError.set(null);
      
      console.log('[BoardColumn] Deleting column:', {
        columnId: columnIdToDelete,
        columnTitle: this.def.title,
        boardId: board.id,
        columnDef: this.def
      });
      
      // Call backend API to delete column
      const success = await this.boardService.deleteColumnApi(columnIdToDelete, String(board.id));
      
      if (success) {
        // Refresh board columns in store
        this.store.loadBoard(String(board.id));
        this.showDeleteConfirmation.set(false);
      } else {
        this.deleteError.set('Failed to delete column');
      }
    } catch (err) {
      console.error('[BoardColumn] Error deleting column:', err);
      this.deleteError.set('Error deleting column');
    } finally {
      this.isDeletingColumn.set(false);
    }
  }

  cancelDeleteColumn() {
    this.showDeleteConfirmation.set(false);
    this.deleteError.set(null);
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
