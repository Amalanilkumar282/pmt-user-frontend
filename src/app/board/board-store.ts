import { Injectable, computed, signal, inject } from '@angular/core';
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

  // UI state
  selectedSprintId = signal<string | 'BACKLOG'>('BACKLOG');
  search = signal<string>('');
  filters = signal<FilterState>({ assignees: [], workTypes: [], labels: [], statuses: [], priorities: [] });
  groupBy = signal<GroupBy>('NONE');
  columns = signal<BoardColumnDef[]>([...DEFAULT_COLUMNS]);

  // Board context
  currentBoard = this.boardService.currentBoard;

  // derived
  sprints = computed(() => this._sprints());
  issues = computed(() => this._issues());
  loadingIssues = this._loadingIssues.asReadonly();
  loadingSprints = this._loadingSprints.asReadonly();
  
  /**
   * Load issues from backend API
   */
  async loadIssuesByProject(projectId: string): Promise<void> {
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
    try {
      this._loadingSprints.set(true);
      const sprints = await firstValueFrom(this.sprintApiService.getSprintsByProject(projectId));
      this._sprints.set(sprints);
      console.log('[BoardStore] Loaded sprints from API:', sprints.length);
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
      // If board is team-based, filter issues by team
      if (board.teamId) {
        // Team board - issues should be from this team only
        list = list.filter(i => i.teamId === board.teamId);
      }
      // If board has no teamId (default/project board), show all issues from the project
      // (no additional filtering needed as issues are already project-scoped)
    }

    // Sprint filter - CRITICAL: Only apply if board has teamId (team board)
    if (!board || board.teamId) {
      // For team boards or no board, apply sprint filtering
      list = sprintId === 'BACKLOG'
        ? list.filter(i => !i.sprintId)
        : list.filter(i => i.sprintId === sprintId);
    } else {
      // For default/project boards (no teamId), show ALL issues regardless of sprint
      // This matches your requirement: "issues are from get all issues by project id"
      // No sprint filtering at all - show everything
      console.log('[BoardStore] Default board - showing all issues (no sprint filter)');
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
        const columnIssues = issues.filter(i => i.status === c.id);
        
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
        const columnIssues = issues.filter(i => i.status === c.id);
        
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
        const columnIssues = issues.filter(i => i.status === c.id);
        
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
      items: sortByPriority(issues.filter(i => i.status === c.id))
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
      const activeSprint = this._sprints().find(s => s.status === 'ACTIVE');
      if (activeSprint) {
        console.log('[BoardStore] loadBoard - Team board, selecting active sprint:', activeSprint.id);
        this.selectedSprintId.set(activeSprint.id);
      } else {
        console.log('[BoardStore] loadBoard - Team board, no active sprint, selecting BACKLOG');
        this.selectedSprintId.set('BACKLOG');
      }
    } else if (board.type === 'PROJECT') {
      // Project boards: Show ALL issues (BACKLOG shows everything)
      console.log('[BoardStore] loadBoard - Project board, selecting BACKLOG (all issues)');
      this.selectedSprintId.set('BACKLOG');
    }
    
    return true;
  }

  selectSprint(id: string | 'BACKLOG') { this.selectedSprintId.set(id); }
  setSearch(q: string) { this.search.set(q); }
  applyFilters(f: Partial<FilterState>) { this.filters.update(curr => ({...curr, ...f})); }
  clearFilters() { this.filters.set({ assignees: [], workTypes: [], labels: [], statuses: [], priorities: [] }); }
  setGroupBy(g: GroupBy) { this.groupBy.set(g); }

  /**
   * Update issue status (API-backed)
   */
  async updateIssueStatusApi(issueId: string, statusId: number, projectId: string): Promise<void> {
    try {
      await firstValueFrom(this.issueApiService.updateIssueStatus(issueId, statusId, projectId));
      // Update local state after successful API call
      this.updateIssueStatus(issueId, 'TODO' as any); // TODO: Map statusId to IssueStatus
      console.log('[BoardStore] Issue status updated');
    } catch (error) {
      console.error('[BoardStore] Error updating issue status:', error);
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
      sprintId: issueData.sprintId || this.selectedSprintId(),
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
