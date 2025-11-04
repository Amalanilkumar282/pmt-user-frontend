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
import { UserApiService } from '../../../shared/services/user-api.service';
import { EditBoardColumns } from '../edit-board-columns/edit-board-columns';
import { BoardSelector } from '../board-selector/board-selector';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';
import { BoardOptionsMenu } from '../board-options-menu/board-options-menu';

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
    ClickOutsideDirective,
    BoardOptionsMenu
  ],
  templateUrl: './board-toolbar.html',
  styleUrls: ['./board-toolbar.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardToolbar {
  private store = inject(BoardStore);
  private boardService = inject(BoardService);
  private userApi = inject(UserApiService);
  
  readonly search = this.store.search;
  readonly selectedSprintId = this.store.selectedSprintId;
  readonly sprints = this.store.sprints;
  readonly availableSprints = this.store.availableSprints;
  readonly currentBoard = this.boardService.currentBoard;
  readonly filters = this.store.filters;
  readonly showAllAssignees = signal(false);
  
  // Show sprint filter only for team boards (boards with teamId)
  readonly showSprintFilter = computed(() => {
    const board = this.currentBoard();
    const shouldShow = board && !!board.teamId;
    console.log('[BoardToolbar.showSprintFilter] Board:', board, 'Show:', shouldShow);
    // Show sprint selector if board has a teamId (team board)
    // Hide for default/project boards (no teamId)
    return shouldShow;
  });
  
  readonly assignees = computed(() => {
    const set = new Set<string>();
    // Use all loaded issues (store.issues) to derive the full list of project assignees.
    // Using visibleIssues here caused avatars to disappear when filters were applied
    // because the visible set shrank to only filtered assignees. We want the avatar
    // list to be stable so users can toggle multiple assignees without the list
    // removing other options.
    for (const i of this.store.issues()) {
      if (!i.assignee) continue;

      // If assignee looks like a numeric user id (API may return numeric ids as strings),
      // try to resolve to a display name from the user cache. If not cached yet, trigger
      // a background fetch and fall back to the raw id until resolved.
      const a = i.assignee;
      const numericMatch = /^\d+$/.test(a);
      if (numericMatch) {
        const cached = this._userNameCache.get(a);
        if (cached) {
          set.add(cached);
        } else {
          // trigger background fetch (non-blocking)
          this.resolveUserName(a);
          set.add(a); // show id until name is resolved
        }
      } else {
        // likely already a display name
        set.add(a);
      }
    }
    // include deterministic ordering
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  // Simple in-memory cache for numeric userId -> display name
  private _userNameCache = new Map<string, string>();

  // Resolve a numeric user id to a display name and cache it. This performs a background
  // request via UserApiService and updates the cache when done.
  private resolveUserName(userIdStr: string): void {
    // Avoid duplicate requests
    if (this._userNameCache.has(userIdStr) || this._pendingUserFetch?.has(userIdStr)) return;

    const id = Number(userIdStr);
    if (Number.isNaN(id)) return;

    // mark pending
    this._pendingUserFetch = this._pendingUserFetch || new Set<string>();
    this._pendingUserFetch.add(userIdStr);

    this.userApi.getUserById(id).subscribe({
      next: user => {
        const name = user?.name || `User ${id}`;
        this._userNameCache.set(userIdStr, name);
        this._pendingUserFetch!.delete(userIdStr);
        // touch the store search signal to force recompute of computed properties
        // (cheap trick: toggle search signal value briefly)
        const q = this.store.search();
        this.store.search.set(q + ' ');
        this.store.search.set(q);
      },
      error: () => {
        this._pendingUserFetch!.delete(userIdStr);
      }
    });
  }
  private _pendingUserFetch?: Set<string>;

  toggleAssigneeFilter(assignee: string): void {
    const current = this.filters();
    const assignees = (current && current.assignees) || [];

    console.log('[BoardToolbar.toggleAssigneeFilter] current assignees:', assignees, 'toggling:', assignee);

    let newAssignees: string[];
    if (assignees.includes(assignee)) {
      // Remove filter
      newAssignees = assignees.filter(a => a !== assignee);
    } else {
      // Add filter
      newAssignees = [...assignees, assignee];
    }

    console.log('[BoardToolbar.toggleAssigneeFilter] new assignees:', newAssignees);

    this.store.filters.set({
      ...current,
      assignees: newAssignees
    });
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

  selectSprint(id: string | null): void {
    this.store.selectSprint(id);
  }

  getSprintLabel(id: string | null): string {
    if (!id) return 'All Sprints';
    const sprint = this.availableSprints().find(s => s.id === id) || this.sprints().find(s => s.id === id);
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
