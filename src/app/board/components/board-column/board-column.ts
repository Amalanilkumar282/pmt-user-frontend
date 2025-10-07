import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Output() openIssue = new EventEmitter<Issue>();
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

  onOpen(issue: Issue) {
    this.openIssue.emit(issue);
  }

  drop(event: CdkDragDrop<Issue[]>) {
    if (event.previousContainer === event.container) {
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
}
