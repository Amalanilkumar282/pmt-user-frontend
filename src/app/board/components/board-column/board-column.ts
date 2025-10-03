import { ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BoardColumnDef, Issue, Status } from '../../models';
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
    this.store.updateIssueStatus(item.id, this.def.id as Status);
    // reflect in UI list arrays
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
  }
}
