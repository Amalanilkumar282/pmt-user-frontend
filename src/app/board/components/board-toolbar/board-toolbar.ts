import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardStore } from '../../board-store';
import { BoardService } from '../../services/board.service';
import { GroupBy } from '../../models';
import { SprintFilterComponent } from '../../../shared/sprint-filter/sprint-filter';
import { FilterPanel } from '../filter-panel/filter-panel';
import { GroupByMenu } from '../group-by-menu/group-by-menu';
import { AddColumnButton } from '../add-column-button/add-column-button';
import { BoardSearch } from '../../../shared/components/board-search/board-search';
import { AvatarClassPipe, InitialsPipe } from '../../../shared/pipes/avatar.pipe';
import { EditBoardColumns } from '../edit-board-columns/edit-board-columns';
import { BoardSelector } from '../board-selector/board-selector';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';

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
    BoardSearch,
    AvatarClassPipe,
    InitialsPipe,
    EditBoardColumns,
    BoardSelector,
    ClickOutsideDirective
  ],
  templateUrl: './board-toolbar.html',
  styleUrls: ['./board-toolbar.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardToolbar {
  private store = inject(BoardStore);
  private boardService = inject(BoardService);
  
  readonly search = this.store.search;
  readonly selectedSprintId = this.store.selectedSprintId;
  readonly sprints = this.store.sprints;
  readonly currentBoard = this.boardService.currentBoard;
  readonly filters = this.store.filters;
  readonly showAllAssignees = signal(false);
  
  // Hide sprint filter for PROJECT type boards
  readonly showSprintFilter = computed(() => {
    const board = this.currentBoard();
    return !board || board.type === 'TEAM';
  });
  
  readonly assignees = computed(() => {
    const set = new Set<string>();
    for (const i of this.store.visibleIssues()) {
      if (i.assignee) set.add(i.assignee);
    }
    return Array.from(set).sort((a,b)=>a.localeCompare(b));
  });

  toggleAssigneeFilter(assignee: string): void {
    const current = this.filters();
    const assignees = current.assignees || [];
    
    if (assignees.includes(assignee)) {
      // Remove filter
      this.store.filters.set({
        ...current,
        assignees: assignees.filter(a => a !== assignee)
      });
    } else {
      // Add filter
      this.store.filters.set({
        ...current,
        assignees: [...assignees, assignee]
      });
    }
  }

  isAssigneeFiltered(assignee: string): boolean {
    return this.filters().assignees?.includes(assignee) || false;
  }
  
  toggleAllAssigneesDropdown(event: Event): void {
    event.stopPropagation();
    this.showAllAssignees.set(!this.showAllAssignees());
  }
  
  closeAllAssigneesDropdown(): void {
    this.showAllAssignees.set(false);
  }

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
