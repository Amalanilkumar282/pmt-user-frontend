import { ChangeDetectionStrategy, Component, computed, inject, Output, EventEmitter } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { BoardStore } from '../../board-store';
import { BoardColumn } from '../board-column/board-column';
import { Issue, IssueStatus } from '../../../shared/models/issue.model';
import { BoardColumnDef } from '../../models';

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
  readonly buckets = this.store.columnBuckets;
  @Output() openIssue = new EventEmitter<any>();

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

  onDrop(event: CdkDragDrop<Issue[]>) {
    if (event.previousContainer === event.container || event.previousContainer.data === event.container.data) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      // Update issue status
      const issue = event.container.data[event.currentIndex];
      const newStatus = event.container.id as IssueStatus;
      this.store.updateIssueStatus(issue.id, newStatus);
    }
  }
}
