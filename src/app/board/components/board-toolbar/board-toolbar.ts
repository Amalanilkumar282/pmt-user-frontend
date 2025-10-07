import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardStore } from '../../board-store';
import { GroupBy } from '../../models';
import { SprintFilterComponent } from '../../../summary/sprint-filter/sprint-filter';
import { FilterPanel } from '../filter-panel/filter-panel';
import { GroupByMenu } from '../group-by-menu/group-by-menu';
import { AddColumnButton } from '../add-column-button/add-column-button';
import { BoardSearch } from '../../../shared/components/board-search/board-search';

@Component({
  selector: 'app-board-toolbar',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
  SprintFilterComponent,
    FilterPanel,
    GroupByMenu,
    AddColumnButton,
    BoardSearch
  ],
  templateUrl: './board-toolbar.html',
  styleUrls: ['./board-toolbar.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardToolbar {
  private store = inject(BoardStore);
  
  readonly search = this.store.search;
  readonly selectedSprintId = this.store.selectedSprintId;
  readonly sprints = this.store.sprints;

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.store.search.set(target.value);
  }

  selectSprint(id: string): void {
    this.store.selectedSprintId.set(id);
  }

  getSprintLabel(id: string): string {
    if (id === 'BACKLOG') return 'Backlog';
    const sprint = this.sprints().find(s => s.id === id);
    return sprint ? sprint.name : 'Select Sprint';
  }

  getGroupByLabel(): string {
    const groupBy = this.store.groupBy();
    const labels: Record<GroupBy, string> = {
      NONE: 'None',
      ASSIGNEE: 'Assignee',
      EPIC: 'Epic',
      SUBTASK: 'Sub Task'
    };
    return labels[groupBy];
  }
}
