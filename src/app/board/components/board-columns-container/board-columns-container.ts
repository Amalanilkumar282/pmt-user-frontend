import { ChangeDetectionStrategy, Component, computed, inject, Output, EventEmitter } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { BoardStore } from '../../board-store';
import { BoardColumn } from '../board-column/board-column';
import { Issue, IssueStatus } from '../../../shared/models/issue.model';
import { BoardColumnDef } from '../../models';
import { ProjectContextService } from '../../../shared/services/project-context.service';

@Component({
  selector: 'app-board-columns-container',
  standalone: true,
  imports: [CommonModule, DragDropModule, BoardColumn],
  templateUrl: './board-columns-container.html',
  styleUrls: ['./board-columns-container.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardColumnsContainer {
  private store = inject(BoardStore);
  private projectContextService = inject(ProjectContextService);
  
  readonly buckets = this.store.columnBuckets;
  readonly groupBy = this.store.groupBy;
  @Output() openIssue = new EventEmitter<any>();
  @Output() openIssueComments = new EventEmitter<any>();

  readonly dropListIds = computed(() => 
    this.buckets().map(b => b.def.id)
  );

  // returns a plain array
  dropListIdsArray() {
    return this.dropListIds();
  }

  track(_: number, item: { def: BoardColumnDef; items: Issue[] }): string {
    return item.def.id;
  }

  onOpenIssue(issue: Issue) {
    this.openIssue.emit(issue);
  }
  
  onOpenIssueComments(issue: Issue) {
    this.openIssueComments.emit(issue);
  }

  async onDrop(event: CdkDragDrop<Issue[]>) {
    const issue = event.previousContainer.data[event.previousIndex];
    const projectId = this.projectContextService.currentProjectId();

    if (event.previousContainer === event.container || event.previousContainer.data === event.container.data) {
      // Same column - just reorder
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // Different column - transfer and update status via API
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Find the target column definition to get its statusId
      const targetColumnDef = this.buckets().find(b => b.def.id === event.container.id)?.def;
      
      if (targetColumnDef?.statusId !== undefined && projectId && issue) {
        try {
          console.log('[BoardColumnsContainer] Drag-drop: Updating issue status', {
            issueId: issue.id,
            issueKey: issue.key,
            fromStatus: issue.statusId,
            toStatus: targetColumnDef.statusId,
            columnName: targetColumnDef.title
          });
          
          // Update via backend API
          await this.store.updateIssueStatusApi(issue.id, targetColumnDef.statusId, projectId);
          
          console.log('[BoardColumnsContainer] Issue status updated successfully via API');
        } catch (error) {
          console.error('[BoardColumnsContainer] Failed to update issue status:', error);
          
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
        console.error('[BoardColumnsContainer] Missing data for status update:', {
          targetColumnDef,
          statusId: targetColumnDef?.statusId,
          projectId,
          issue: issue?.id
        });
      }
    }
  }
}
