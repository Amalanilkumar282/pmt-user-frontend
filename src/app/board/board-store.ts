import { Injectable, computed, signal, inject, effect } from '@angular/core';
import type { Issue } from '../shared/models/issue.model';
import type { IssueStatus } from '../shared/models/issue.model';
import type { FilterState, GroupBy, Sprint, BoardColumnDef } from './models';
import { DEFAULT_COLUMNS, fuzzyIncludes, statusOrder, priorityOrder } from './utils';
import { BoardService } from './services/board.service';
import { IssueApiService } from './services/issue-api.service';
import { SprintApiService } from './services/sprint-api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BoardStore {
  private boardService = inject(BoardService);
  private issueApiService = inject(IssueApiService);
  private sprintApiService = inject(SprintApiService);
  
  // raw data
  private _issues = signal<Issue[]>([]);
  private _sprints = signal<Sprint[]>([]);
  private _loadingIssues = signal<boolean>(false);
  private _loadingSprints = signal<boolean>(false);
  
  // Cache tracking
  private _loadedProjectId: string | null = null;

  // UI state
  // selectedSprintId is either a sprint id string or null (no selection)
  selectedSprintId = signal<string | null>(null);
  search = signal<string>('');
  filters = signal<FilterState>({ assignees: [], workTypes: [], labels: [], statuses: [], priorities: [] });
  groupBy = signal<GroupBy>('NONE');
  columns = signal<BoardColumnDef[]>([...DEFAULT_COLUMNS]);

  // Board context
  currentBoard = this.boardService.currentBoard;

  // derived
  sprints = computed(() => this._sprints());
  // Sprints available for the current board (team-specific). Empty for project/default boards.
  availableSprints = computed(() => {
    const board = this.currentBoard();
    const allSprints = this._sprints();
    console.log('[BoardStore.availableSprints] Computing available sprints');
    console.log('[BoardStore.availableSprints] Current board:', board);
    console.log('[BoardStore.availableSprints] All sprints:', allSprints.length, allSprints);
    
    if (!board || !board.teamId) {
      console.log('[BoardStore.availableSprints] No team board, returning empty array');
      return [] as Sprint[];
    }
    
    // Check if any sprints have teamId set
    const sprintsWithTeamId = allSprints.filter(s => s.teamId !== undefined && s.teamId !== null);
    console.log('[BoardStore.availableSprints] Sprints with teamId:', sprintsWithTeamId.length, sprintsWithTeamId);
    
    // Convert both to strings for comparison (handle type mismatch: board.teamId is string, sprint.teamId is number)
    const boardTeamId = String(board.teamId);
    console.log('[BoardStore.availableSprints] Board teamId (as string):', boardTeamId);
    
    const filtered = allSprints.filter(s => String(s.teamId) === boardTeamId);
    console.log('[BoardStore.availableSprints] Filtered team sprints (teamId=' + boardTeamId + '):', filtered.length, filtered);
    
    // If no sprints match the team, log warning
    if (filtered.length === 0 && allSprints.length > 0) {
      console.warn('[BoardStore.availableSprints] No sprints found for teamId:', boardTeamId);
      console.warn('[BoardStore.availableSprints] Available sprint teamIds:', allSprints.map(s => ({ id: s.id, name: s.name, teamId: s.teamId })));
    }
    
    return filtered;
  });
  
  // Auto-select the active sprint (or first) when availableSprints populate and no selection exists
  private _autoSelectSprint = effect(() => {
    const available = this.availableSprints();
    const currentSelection = this.selectedSprintId();
    // Only auto-select for team boards when there is no selection yet
    if (available.length > 0 && !currentSelection) {
      const active = available.find(s => s.status === 'ACTIVE');
      const pick = active ? active.id : available[0].id;
      console.log('[BoardStore._autoSelectSprint] Auto-selecting sprint:', pick);
      this.selectedSprintId.set(pick);
    }
  });

  // Ensure that when the current board changes we immediately select that board's active sprint
  // This handles the case where boards are switched after sprints have already been loaded
  private _onBoardChange = effect(() => {
    const board = this.currentBoard();
    const allSprints = this._sprints();
    console.log('[BoardStore._onBoardChange] Detected board change:', board?.id);

    if (!board) {
      // No board context -> clear selection
      this.selectedSprintId.set(null);
      return;
    }

    // Only apply sprint selection for team boards
    if (!board.teamId) {
      this.selectedSprintId.set(null);
      return;
    }

    const boardTeamId = String(board.teamId);
    const teamSprints = allSprints.filter(s => String(s.teamId) === boardTeamId);
    const active = teamSprints.find(s => s.status === 'ACTIVE');

    if (active) {
      console.log('[BoardStore._onBoardChange] Selecting active sprint for board:', active.id);
      this.selectedSprintId.set(active.id);
    } else if (teamSprints.length > 0) {
      console.log('[BoardStore._onBoardChange] No active sprint - defaulting to first team sprint:', teamSprints[0].id);
      this.selectedSprintId.set(teamSprints[0].id);
    } else {
      console.log('[BoardStore._onBoardChange] No team sprints available for board - clearing selection');
      this.selectedSprintId.set(null);
    }
  });
  issues = computed(() => this._issues());
  loadingIssues = this._loadingIssues.asReadonly();
  loadingSprints = this._loadingSprints.asReadonly();
  
  /**
   * Load issues from backend API
   */
  async loadIssuesByProject(projectId: string): Promise<void> {
    // Skip if already loaded for this project and not loading
    if (projectId === this._loadedProjectId && this._issues().length > 0) {
      console.log('[BoardStore] Issues already cached for project:', projectId);
      return;
    }
    
    try {
      console.log('[BoardStore] Loading issues for project:', projectId);
      this._loadingIssues.set(true);
      const issues = await firstValueFrom(this.issueApiService.getIssuesByProject(projectId));
      this._issues.set(issues);
      console.log('[BoardStore] Loaded issues from API:', issues.length, issues);
      
      // Log issue distribution by status
      if (issues.length > 0) {
        const statusCounts = issues.reduce((acc, issue) => {
          acc[issue.status] = (acc[issue.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log('[BoardStore] Issue distribution by status:', statusCounts);
      } else {
        console.warn('[BoardStore] No issues returned from API');
      }
    } catch (error) {
      console.error('[BoardStore] Error loading issues:', error);
      this._issues.set([]);
    } finally {
      this._loadingIssues.set(false);
    }
  }
  
  /**
   * Load sprints from backend API
   */
  async loadSprintsByProject(projectId: string): Promise<void> {
    // Skip if already loaded for this project and not loading
    if (projectId === this._loadedProjectId && this._sprints().length > 0) {
      console.log('[BoardStore] Sprints already cached for project:', projectId);
      return;
    }
    
    try {
      console.log('[BoardStore] Loading sprints for project:', projectId);
      this._loadingSprints.set(true);
      const sprints = await firstValueFrom(this.sprintApiService.getSprintsByProject(projectId));
      this._sprints.set(sprints);
      console.log('[BoardStore] Loaded sprints from API:', sprints.length, sprints);
      
      // If current board is a team board, default selected sprint to that team's active sprint
      const board = this.currentBoard();
      console.log('[BoardStore] Current board:', board);
      
      if (board && board.teamId) {
        console.log('[BoardStore] Team board detected, teamId:', board.teamId);
        // Convert both to strings for comparison (handle type mismatch)
        const boardTeamId = String(board.teamId);
        const teamSprints = sprints.filter(s => String(s.teamId) === boardTeamId);
        console.log('[BoardStore] Team sprints filtered:', teamSprints.length, teamSprints);
        
        const active = teamSprints.find(s => s.status === 'ACTIVE');
        if (active) {
          console.log('[BoardStore] Setting selectedSprintId to active team sprint:', active.id, active.name);
          this.selectedSprintId.set(active.id);
        } else if (teamSprints.length > 0) {
          // No active sprint, default to first available team sprint
          console.log('[BoardStore] No active sprint for team, defaulting to first team sprint:', teamSprints[0].id);
          this.selectedSprintId.set(teamSprints[0].id);
        } else {
          console.log('[BoardStore] No team sprints available, leaving sprint selection empty');
          this.selectedSprintId.set(null);
        }
      } else {
        console.log('[BoardStore] Not a team board or no board set, keeping current selection');
      }
    } catch (error) {
      console.error('[BoardStore] Error loading sprints:', error);
      this._sprints.set([]);
    } finally {
      this._loadingSprints.set(false);
    }
  }
  
  /**
   * Load all board data (issues + sprints) for a project
   */
  async loadBoardData(projectId: string): Promise<void> {
    // Mark this project as loaded
    this._loadedProjectId = projectId;
    
    await Promise.all([
      this.loadIssuesByProject(projectId),
      this.loadSprintsByProject(projectId)
    ]);
  }

  // visible issues after board context + sprint selection + filters + search
  visibleIssues = computed(() => {
    const board = this.currentBoard();
    const sprintId = this.selectedSprintId();
    const f = this.filters();
    const q = this.search().trim();

    let list = this.issues();

    // Board-based filtering with null safety
    if (board) {
      // If board is team-based, filter issues by team.
      // Note: the Issue API does not always include a teamId on the issue object,
      // so we consider an issue to belong to the team when either:
      //  - issue.teamId matches the board teamId, or
      //  - issue.sprintId references a sprint that belongs to the board's team.
      if (board.teamId) {
        const boardTeamId = String(board.teamId);

        // Build set of sprint ids that belong to this team (handle type mismatch on sprint.teamId)
        const teamSprintIds = this._sprints()
          .filter(s => String(s.teamId) === boardTeamId)
          .map(s => s.id);

        console.log('[BoardStore.visibleIssues] Board is team board, teamSprintIds:', teamSprintIds);

        list = list.filter(i => {
          // If issue explicitly has teamId, use it
          if (i.teamId) return String(i.teamId) === boardTeamId;
          // Otherwise, if it belongs to a sprint that is owned by the team, include it
          if (i.sprintId) return teamSprintIds.includes(i.sprintId);
          // No team info - don't include in a team board view
          return false;
        });
      }
      // If board has no teamId (default/project board), show all issues from the project
      // (no additional filtering needed as issues are already project-scoped)
    }

    // Sprint filter - Only apply if board is present and is a team board (has teamId)
    if (board && board.teamId) {
      // For team boards, apply sprint filtering: if selectedSprintId is null -> show all team issues
      if (!sprintId) {
        // no sprint selected -> keep all team issues
      } else {
        list = list.filter(i => i.sprintId === sprintId);
      }
    } else {
      // For default/project boards (no teamId) or when there's no board context,
      // show ALL issues regardless of sprint. This matches the requirement that
      // project/default boards display all project issues.
      if (board) {
        console.log('[BoardStore] Default/project board - showing all issues (no sprint filter)');
      } else {
        console.log('[BoardStore] No board context - showing all issues (no sprint filter)');
      }
    }

    // filters with null safety
    if (f.assignees?.length) list = list.filter(i => i.assignee && f.assignees.includes(i.assignee));
    if (f.workTypes?.length) list = list.filter(i => f.workTypes.includes(i.type));
    if (f.labels?.length)    list = list.filter(i => (i.labels ?? []).some(l => f.labels.includes(l)));
    if (f.statuses?.length)  list = list.filter(i => f.statuses.includes(i.status));
    if (f.priorities?.length) list = list.filter(i => f.priorities.includes(i.priority));

    // search (title + description + id)
    if (q) {
      list = list.filter(i =>
        fuzzyIncludes(i.title ?? '', q) ||
        fuzzyIncludes(i.description ?? '', q) ||
        fuzzyIncludes(i.id ?? '', q)
      );
    }

    // stable ordering - sort by status first, then by createdAt, then by updatedAt as tiebreaker
    // This prevents card jumping when titles are updated while maintaining predictable order
    return list.sort((a,b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      
      const createdDiff = a.createdAt.getTime() - b.createdAt.getTime();
      if (createdDiff !== 0) return createdDiff;
      
      // Tiebreaker: use updatedAt for items created at the same time
      return a.updatedAt.getTime() - b.updatedAt.getTime();
    });
  });

  // columns with their issues
  columnBuckets = computed(() => {
    const cols = this.columns();
    const issues = this.visibleIssues();
    const groupByType = this.groupBy();
    
    console.log('[BoardStore] Computing columnBuckets:', {
      columnsCount: cols.length,
      columns: cols.map(c => c.id),
      issuesCount: issues.length,
      issues: issues.map(i => ({ id: i.id, title: i.title, status: i.status }))
    });
    
    // Helper function to sort issues by priority
    const sortByPriority = (issueList: Issue[]): Issue[] => {
      return issueList.sort((a, b) => {
        const priorityA = priorityOrder[a.priority] ?? 999;
        const priorityB = priorityOrder[b.priority] ?? 999;
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        // Use createdAt for stable sorting (doesn't change when you edit)
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
    };
    
    // If no grouping, return regular columns with priority-sorted issues
    if (groupByType === 'NONE') {
      const buckets = cols.map(c => {
        // CRITICAL: Match by statusId, not status name
        const columnIssues = issues.filter(i => i.statusId === c.statusId);
        console.log(`[BoardStore] Column "${c.title}" (statusId=${c.statusId}): ${columnIssues.length} issues`);
        if (columnIssues.length > 0) {
          console.log(`[BoardStore] Column "${c.title}" matched issues:`, columnIssues.map(i => ({ 
            key: i.key, 
            title: i.title, 
            statusId: i.statusId 
          })));
        }
        return {
          def: c,
          items: sortByPriority(columnIssues)
        };
      });
      console.log('[BoardStore] Final buckets:', buckets.map(b => ({ 
        column: b.def.title, 
        statusId: b.def.statusId,
        count: b.items.length 
      })));
      console.log('[BoardStore] All issues with statusId:', issues.map(i => ({ 
        key: i.key, 
        statusId: i.statusId,
        title: i.title 
      })));
      return buckets;
    }
    
    // Group by Assignee - within each column, group issues by assignee
    if (groupByType === 'ASSIGNEE') {
      return cols.map(c => {
        // Match by statusId on the issue to the column's statusId
        const columnIssues = issues.filter(i => i.statusId === c.statusId);

        // Group issues by assignee
        const grouped = new Map<string, Issue[]>();
        columnIssues.forEach(issue => {
          const assignee = issue.assignee || 'Unassigned';
          if (!grouped.has(assignee)) {
            grouped.set(assignee, []);
          }
          grouped.get(assignee)!.push(issue);
        });

        // Sort each group by priority and flatten
        const sortedIssues: Issue[] = [];
        Array.from(grouped.entries())
          .sort(([a], [b]) => a.localeCompare(b)) // Sort assignee names alphabetically
          .forEach(([_, groupIssues]) => {
            sortedIssues.push(...sortByPriority(groupIssues));
          });

        return {
          def: c,
          items: sortedIssues,
          groupedBy: 'ASSIGNEE' as const
        };
      });
    }
    
    // Group by Epic - within each column, group issues by epic
    if (groupByType === 'EPIC') {
      return cols.map(c => {
        const columnIssues = issues.filter(i => i.statusId === c.statusId);

        // Group issues by epic
        const grouped = new Map<string, Issue[]>();
        columnIssues.forEach(issue => {
          const epic = issue.epicId || 'No Epic';
          if (!grouped.has(epic)) {
            grouped.set(epic, []);
          }
          grouped.get(epic)!.push(issue);
        });

        // Sort each group by priority and flatten
        const sortedIssues: Issue[] = [];
        Array.from(grouped.entries())
          .sort(([a], [b]) => a.localeCompare(b)) // Sort epic IDs alphabetically
          .forEach(([_, groupIssues]) => {
            sortedIssues.push(...sortByPriority(groupIssues));
          });

        return {
          def: c,
          items: sortedIssues,
          groupedBy: 'EPIC' as const
        };
      });
    }
    
    // Group by Subtask - within each column, group issues by parent
    if (groupByType === 'SUBTASK') {
      return cols.map(c => {
        const columnIssues = issues.filter(i => i.statusId === c.statusId);

        // Group issues by parent
        const grouped = new Map<string, Issue[]>();
        columnIssues.forEach(issue => {
          const parent = issue.parentId || 'No Parent';
          if (!grouped.has(parent)) {
            grouped.set(parent, []);
          }
          grouped.get(parent)!.push(issue);
        });

        // Sort each group by priority and flatten
        const sortedIssues: Issue[] = [];
        Array.from(grouped.entries())
          .sort(([a], [b]) => a.localeCompare(b)) // Sort parent IDs alphabetically
          .forEach(([_, groupIssues]) => {
            sortedIssues.push(...sortByPriority(groupIssues));
          });

        return {
          def: c,
          items: sortedIssues,
          groupedBy: 'SUBTASK' as const
        };
      });
    }
    
    return cols.map(c => ({
      def: c,
      items: sortByPriority(issues.filter(i => i.statusId === c.statusId))
    }));
  });

  // actions
  loadData(allSprints: Sprint[]) {
    this._sprints.set(allSprints);
    // flatten issues for store; keep sprintId on each issue (already present)
  const flattened = allSprints.flatMap(s => (s.issues ?? []).map(i => ({...i, sprintId: i.sprintId ?? s.id })));
    this._issues.set([...flattened]); // backlog can be injected separately by caller
  }

  addBacklog(backlog: Issue[]) {
    this._issues.update(list => [...list, ...backlog.map(i => ({...i, sprintId: i.sprintId}))]);
  }

  // Load board context and apply board-specific settings
  loadBoard(boardId: string): boolean {
    const board = this.boardService.getBoardById(boardId);
    
    if (!board) {
      console.warn(`Board with id ${boardId} not found`);
      return false;
    }

    this.boardService.setCurrentBoard(boardId);
    
    // Update columns based on board configuration
    if (board.columns && board.columns.length > 0) {
      this.columns.set([...board.columns]);
    }
    
    // Set sprint selection based on board type
    if (board.type === 'TEAM') {
      // Team boards: Show ACTIVE sprint issues by default
      const boardTeamId = String(board.teamId);
      const teamSprints = this._sprints().filter(s => String(s.teamId) === boardTeamId);
      const activeSprint = teamSprints.find(s => s.status === 'ACTIVE');
      if (activeSprint) {
        console.log('[BoardStore] loadBoard - Team board, selecting active sprint:', activeSprint.id);
        this.selectedSprintId.set(activeSprint.id);
      } else if (teamSprints.length > 0) {
        console.log('[BoardStore] loadBoard - Team board, no active sprint, selecting first team sprint:', teamSprints[0].id);
        this.selectedSprintId.set(teamSprints[0].id);
      } else {
        console.log('[BoardStore] loadBoard - Team board, no sprints available, leaving selection empty');
        this.selectedSprintId.set(null);
      }
    } else if (board.type === 'PROJECT') {
      // Project boards: Show ALL issues (no sprint filter)
      console.log('[BoardStore] loadBoard - Project board, clearing sprint selection (show all issues)');
      this.selectedSprintId.set(null);
    }
    
    return true;
  }

  selectSprint(id: string | null) { this.selectedSprintId.set(id); }
  setSearch(q: string) { this.search.set(q); }
  applyFilters(f: Partial<FilterState>) { this.filters.update(curr => ({...curr, ...f})); }
  clearFilters() { this.filters.set({ assignees: [], workTypes: [], labels: [], statuses: [], priorities: [] }); }
  setGroupBy(g: GroupBy) { this.groupBy.set(g); }

  /**
   * Update issue status (API-backed) - used for drag-and-drop
   */
  async updateIssueStatusApi(issueId: string, statusId: number, projectId: string): Promise<void> {
    try {
      console.log('[BoardStore] Updating issue status via API:', { issueId, statusId, projectId });
      
      // Find the full issue object
      const issue = this._issues().find(i => i.id === issueId);
      if (!issue) {
        throw new Error(`Issue ${issueId} not found in store`);
      }
      
      // Create full DTO with all required fields
      const dto = this.issueApiService.mapIssueToUpdateDto(issue, projectId, { statusId });
      await firstValueFrom(this.issueApiService.updateIssue(dto));
      
      // Update local state optimistically after successful API call
      this._issues.update(list => list.map(i => 
        i.id === issueId 
          ? { ...i, statusId, updatedAt: new Date() }
          : i
      ));
      
      console.log('[BoardStore] Issue status updated successfully');
    } catch (error) {
      console.error('[BoardStore] Error updating issue status:', error);
      throw error;
    }
  }

  /**
   * Update issue with partial fields (API-backed) - used for issue detail edits
   */
  async updateIssueApi(issueId: string, projectId: string, updates: Partial<Issue>): Promise<void> {
    try {
      console.log('[BoardStore] Updating issue via API:', { issueId, projectId, updates });
      
      // Find the full issue object
      const issue = this._issues().find(i => i.id === issueId);
      if (!issue) {
        throw new Error(`Issue ${issueId} not found in store`);
      }
      
      // Create full DTO with all required fields
      const dto = this.issueApiService.mapIssueToUpdateDto(issue, projectId, updates);
      await firstValueFrom(this.issueApiService.updateIssue(dto));
      
      // Update local state optimistically after successful API call
      this._issues.update(list => list.map(i => 
        i.id === issueId 
          ? { ...i, ...updates, updatedAt: new Date() }
          : i
      ));
      
      console.log('[BoardStore] Issue updated successfully');
    } catch (error) {
      console.error('[BoardStore] Error updating issue:', error);
      throw error;
    }
  }

  /**
   * Create new issue (API-backed)
   */
  async createIssueApi(issueData: Partial<Issue>, projectId: string): Promise<void> {
    try {
      const dto = this.issueApiService.mapIssueToCreateDto(issueData, projectId);
      await firstValueFrom(this.issueApiService.createIssue(dto));
      // Reload issues after creation
      await this.loadIssuesByProject(projectId);
      console.log('[BoardStore] Issue created');
    } catch (error) {
      console.error('[BoardStore] Error creating issue:', error);
      throw error;
    }
  }

  // Legacy local-only methods (for offline mode or fallback)
  updateIssueStatus(issueId: string, status: IssueStatus) {
    this._issues.update(list => list.map(i => i.id === issueId ? ({...i, status, updatedAt: new Date()}) : i));
  }

  updateIssueTitle(issueId: string, newTitle: string) {
    this._issues.update(list => list.map(i => i.id === issueId ? ({...i, title: newTitle, updatedAt: new Date()}) : i));
  }

  updateIssueDescription(issueId: string, newDescription: string) {
    this._issues.update(list => list.map(i => i.id === issueId ? ({...i, description: newDescription, updatedAt: new Date()}) : i));
  }

  updateIssueAssignee(issueId: string, assignee: string | undefined) {
    this._issues.update(list => list.map(i => i.id === issueId ? ({...i, assignee, updatedAt: new Date()}) : i));
  }

  updateIssueDueDate(issueId: string, dueDate: Date | undefined) {
    this._issues.update(list => list.map(i => i.id === issueId ? ({...i, dueDate, updatedAt: new Date()}) : i));
  }

  createIssue(issueData: Partial<Issue>): Issue {
    const newIssue: Issue = {
      // Use timestamp plus a small random suffix to avoid collisions when
      // createIssue is called multiple times rapidly in tests.
      id: `ISSUE-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      title: issueData.title || 'Untitled Issue',
      status: issueData.status || 'TODO',
      type: issueData.type || 'TASK',
      priority: issueData.priority || 'MEDIUM',
      assignee: issueData.assignee,
      dueDate: issueData.dueDate,
      description: issueData.description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      labels: issueData.labels || [],
  // Normalize sprintId to string | undefined. selectedSprintId can be null.
  sprintId: issueData.sprintId ?? (this.selectedSprintId() ?? undefined),
      teamId: issueData.teamId,
      storyPoints: issueData.storyPoints,
      parentId: issueData.parentId,
      epicId: issueData.epicId
    };

    this._issues.update(list => [...list, newIssue]);
    return newIssue;
  }

  addColumn(def: BoardColumnDef) {
    this.columns.update(cols => {
      // Shift all columns at or after the new position to the right
      const updatedCols = cols.map(col => {
        if (col.position >= def.position) {
          return { ...col, position: col.position + 1 };
        }
        return col;
      });
      
      // Insert the new column and sort by position
      const newCols = [...updatedCols, def];
      return newCols.sort((a, b) => a.position - b.position);
    });
  }

  removeColumn(id: string) {
    this.columns.update(cols => {
      const removedCol = cols.find(c => c.id === id);
      if (!removedCol) return cols;
      
      // Remove the column and shift remaining columns left
      const filtered = cols.filter(c => c.id !== id);
      return filtered.map(col => {
        if (col.position > removedCol.position) {
          return { ...col, position: col.position - 1 };
        }
        return col;
      }).sort((a, b) => a.position - b.position);
    });
  }
}
