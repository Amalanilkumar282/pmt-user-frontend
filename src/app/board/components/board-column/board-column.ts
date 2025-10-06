import { ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BoardColumnDef } from '../../models';
import type { Issue, IssueStatus } from '../../../shared/models/issue.model';
import { BoardStore } from '../../board-store';
import { TaskCard } from '../task-card/task-card';

@Component({
  selector: 'app-board-column',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskCard],
  templateUrl: './board-column.html',
  styleUrls: ['./board-column.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardColumn {
  @Input() def!: BoardColumnDef;
  @Input() items: Issue[] = [];
  @Input() connectedTo: string[] = [];

  trackById(index: number, item: Issue): string {
    return item.id;
  }  // simple pagination per column
  pageSize = 20;
  get pageItems() { return this.items.slice(0, this.pageSize); }
  loadMore() { this.pageSize += 20; }

  constructor(private store: BoardStore) {}

  drop(event: CdkDragDrop<Issue[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }
    const item = event.previousContainer.data[event.previousIndex];
    // update status in store
    this.store.updateIssueStatus(item.id, this.def.id as IssueStatus);
    // Do NOT manually transferArrayItem across containers. The store is the single source of truth
    // and columnBuckets() will recompute the lists. Rely on the store update to re-render the columns.
  }
}
