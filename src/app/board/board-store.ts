import { Injectable, computed, signal, inject } from '@angular/core';
import type { Issue } from '../shared/models/issue.model';
import type { IssueStatus } from '../shared/models/issue.model';
import type { FilterState, GroupBy, Sprint, BoardColumnDef } from './models';
import { DEFAULT_COLUMNS, fuzzyIncludes, statusOrder, priorityOrder } from './utils';
import { BoardService } from './services/board.service';

@Injectable({ providedIn: 'root' })
export class BoardStore {
  private boardService = inject(BoardService);
  
  // raw data (inject your dummy data at module bootstrap or here)
  private _issues = signal<Issue[]>([]);
  private _sprints = signal<Sprint[]>([]);

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
      if (board.type === 'TEAM' && board.teamId) {
        list = list.filter(i => i.teamId === board.teamId);
      }
      // If board is project-based, show all issues from the project
      // (no additional filtering needed as issues are already project-scoped)
    }

    // Sprint filter - only apply if board type is TEAM or if no board is loaded
    if (!board || board.type === 'TEAM') {
      // For team boards or no board, always apply sprint filtering
      list = sprintId === 'BACKLOG'
        ? list.filter(i => !i.sprintId)
        : list.filter(i => i.sprintId === sprintId);
    } else if (board.type === 'PROJECT') {
      // For project boards, show all sprints combined (no sprint filtering)
      // Only filter backlog items if includeBacklog is false
      if (!board.includeBacklog) {
        list = list.filter(i => i.sprintId); // Exclude backlog items
      }
      // Otherwise show all issues regardless of sprint
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

    // stable ordering
    return list.sort((a,b) => statusOrder[a.status]-statusOrder[b.status] || a.updatedAt.getTime()-b.updatedAt.getTime());
  });

  // columns with their issues
  columnBuckets = computed(() => {
    const cols = this.columns();
    const issues = this.visibleIssues();
    const groupByType = this.groupBy();
    
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
      return cols.map(c => ({
        def: c,
        items: sortByPriority(issues.filter(i => i.status === c.id))
      }));
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
        console.log('📋 loadBoard - Team board, selecting active sprint:', activeSprint.id);
        this.selectedSprintId.set(activeSprint.id);
      } else {
        console.log('📋 loadBoard - Team board, no active sprint, selecting BACKLOG');
        this.selectedSprintId.set('BACKLOG');
      }
    } else if (board.type === 'PROJECT') {
      // Project boards: Show ALL issues (BACKLOG shows everything)
      console.log('📋 loadBoard - Project board, selecting BACKLOG (all issues)');
      this.selectedSprintId.set('BACKLOG');
    }
    
    return true;
  }

  selectSprint(id: string | 'BACKLOG') { this.selectedSprintId.set(id); }
  setSearch(q: string) { this.search.set(q); }
  applyFilters(f: Partial<FilterState>) { this.filters.update(curr => ({...curr, ...f})); }
  clearFilters() { this.filters.set({ assignees: [], workTypes: [], labels: [], statuses: [], priorities: [] }); }
  setGroupBy(g: GroupBy) { this.groupBy.set(g); }

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
      id: `ISSUE-${Date.now()}`,
      title: issueData.title || 'Untitled Issue',
      status: issueData.status || 'TODO',
      type: issueData.type || 'TASK',
      priority: issueData.priority || 'MEDIUM',
      assignee: issueData.assignee,
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
