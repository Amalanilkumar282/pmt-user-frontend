import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, signal, inject, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import type { Issue } from '../../../shared/models/issue.model';
import { AvatarClassPipe, InitialsPipe } from '../../../shared/pipes/avatar.pipe';
import { BoardStore } from '../../board-store';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';
import { UserApiService } from '../../../shared/services/user-api.service';
import { shareReplay } from 'rxjs/operators';
import { EpicApiService } from '../../services/epic-api.service';
import { ProjectContextService } from '../../../shared/services/project-context.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, AvatarClassPipe, InitialsPipe, ClickOutsideDirective],
  templateUrl: './task-card.html',
  styleUrls: ['./task-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskCard implements OnInit, AfterViewInit {
  // Static caches shared across all card instances
  private static projectMembersCache: Map<string, { id: number; name: string }[]> = new Map();
  private static epicsCache: Map<string, string> = new Map();
  // When loadingProjectMembers stores an observable it represents an in-flight request
  private static loadingProjectMembers: Map<string, any> = new Map();
  // When loadingEpics stores an observable it represents an in-flight request
  private static loadingEpics: Map<string, any> = new Map();
  
  private store = inject(BoardStore);
  
  @ViewChild('titleTextarea') titleTextarea?: ElementRef<HTMLTextAreaElement>;
  
  // allow tests to create the component without providing an issue
  @Input() issue: Issue = {
    id: '',
    key: '',
    title: '',
    description: '',
    type: 'TASK',
    priority: 'LOW',
    status: 'TODO',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  @Input() colorClass = '#A1C4FD'; // Default blue color
  @Output() open = new EventEmitter<Issue>();
  @Output() openComments = new EventEmitter<Issue>();
  @Output() titleChanged = new EventEmitter<{ issueId: string, newTitle: string }>();
  @Output() assigneeClicked = new EventEmitter<Issue>();
  
  // Editing state
  isEditingTitle = signal(false);
  editedTitle = signal('');
  isEditingDescription = signal(false);
  editedDescription = signal('');
  showAssigneeDropdown = signal(false);
  showDatePicker = signal(false);
  assigneeSearchQuery = signal('');
  
  // Available assignees (populated from project members)
  availableAssignees: { id: string | 'unassigned', name: string }[] = [];

  // Filtered assignees based on search
  readonly filteredAssignees = computed(() => {
    const query = this.assigneeSearchQuery().toLowerCase();
    if (!query) return this.availableAssignees;
    return this.availableAssignees.filter(a => a.name.toLowerCase().includes(query));
  });
  
  // Basic metadata placeholders
  commentsCount = 0;
  attachmentsCount = 0;

  // Resolved display values
  assigneeName = signal<string | null>(null);
  epicTitle = signal<string | null>(null);

  private userApi = inject(UserApiService);
  private epicApi = inject(EpicApiService);
  private projectContext = inject(ProjectContextService);

  // Cached project members
  private projectMembers: { id: number; name: string }[] = [];

  // Helper to provide a display string used by pipes in template
  displayAssignee(): string {
    return this.assigneeName() ?? (this.issue.assignee ?? 'Unassigned');
  }

  // Label color palette - vibrant and varied
  private labelColors = [
    { bg: '#E0E7FF', text: '#4338CA' }, 
    { bg: '#DBEAFE', text: '#1E40AF' },
    { bg: '#D1FAE5', text: '#047857' }, 
    { bg: '#FEE2E2', text: '#B91C1C' }, 
    { bg: '#FEF3C7', text: '#92400E' }, 
    { bg: '#FCE7F3', text: '#BE185D' }, 
    { bg: '#E9D5FF', text: '#7C3AED' }, 
    { bg: '#CCFBF1', text: '#0F766E' }, 
  ];

  getLabelBgColor(label: string): string {
    const hash = label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.labelColors[hash % this.labelColors.length].bg;
  }

  getLabelTextColor(label: string): string {
    const hash = label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.labelColors[hash % this.labelColors.length].text;
  }

  getEpicName(epicId: string): string {
    const title = this.epicTitle();
    if (title) return title;
    if (!epicId) return 'No Epic';
    return `Epic: ${epicId.replace('epic-', '').toUpperCase()}`;
  }

  getPriorityClass(priority: string): string {
    const classes = {
      CRITICAL: 'bg-red-100 text-red-800',
      HIGH: 'bg-orange-100 text-orange-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-green-100 text-green-800'
    };
    return classes[priority as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  }

  getPriorityPill(priority: string): string {
    const classes = {
      CRITICAL: 'bg-rose-100 text-rose-700',
      HIGH: 'bg-orange-100 text-orange-700',
      MEDIUM: 'bg-amber-100 text-amber-700',
      LOW: 'bg-emerald-100 text-emerald-700'
    } as const;
    return classes[priority as keyof typeof classes] || 'bg-slate-100 text-slate-700';
  }

  ngAfterViewInit(): void {
    // Auto-resize title textarea after view initialization
    if (this.titleTextarea && this.isEditingTitle()) {
      this.resizeTitleTextarea();
    }
  }

  ngOnInit() {
    // Deterministic demo values derived from issue id so UI is stable and testable
    const num = this.issue.id.split('').reduce((a,c)=>a + c.charCodeAt(0), 0);
    this.commentsCount = num % 10;          // 0..9
    this.attachmentsCount = num % 7;        // 0..6

    // Resolve assignee name if assignee is an id
    const assignee = this.issue.assignee;
    if (!assignee) {
      this.assigneeName.set(null);
    } else {
      const numericId = Number(assignee);
      if (!isNaN(numericId) && numericId > 0) {
        // Try to resolve from cached project members first
        const pm = this.projectMembers.find(m => m.id === numericId);
        if (pm) {
          this.assigneeName.set(pm.name);
        } else {
          this.userApi.getUserById(numericId).subscribe({
            next: user => {
              if (user) {
                this.assigneeName.set(user.name || `User ${user.id}`);
              } else {
                this.assigneeName.set(`User ${numericId}`);
              }
            },
            error: () => this.assigneeName.set(`User ${numericId}`)
          });
        }
      } else {
        this.assigneeName.set(assignee);
      }
    }

    // Load project members for assignee dropdown (non-blocking, with caching)
    try {
      const projectId = this.projectContext.currentProjectId();
      if (projectId) {
        // Check cache first
        const cached = TaskCard.projectMembersCache.get(projectId);
        if (cached) {
          this.projectMembers = cached;
          this.availableAssignees = [
            ...cached.map(m => ({ id: m.id.toString(), name: m.name })),
            { id: 'unassigned', name: 'Unassigned' }
          ];
        } else if (!TaskCard.loadingProjectMembers.get(projectId)) {
          // Start a single in-flight request and store the observable so other
          // TaskCard instances can subscribe to the same stream and populate
          // their own availableAssignees when it resolves.
          const req$ = this.userApi.getUsersByProject(projectId).pipe(shareReplay(1));
          TaskCard.loadingProjectMembers.set(projectId, req$);

          req$.subscribe({
            next: members => {
              const memberList = members.map(m => ({ id: m.id, name: m.name }));
              TaskCard.projectMembersCache.set(projectId, memberList);
              TaskCard.loadingProjectMembers.delete(projectId);

              this.projectMembers = memberList;
              this.availableAssignees = [
                ...memberList.map(m => ({ id: m.id.toString(), name: m.name })),
                { id: 'unassigned', name: 'Unassigned' }
              ];
            },
            error: () => {
              TaskCard.loadingProjectMembers.delete(projectId);
              this.availableAssignees = [{ id: 'unassigned', name: 'Unassigned' }];
            }
          });
        } else {
          // Another instance has started loading members for this project.
          // Subscribe to the in-flight observable so this card is updated
          // when the request completes.
          const inFlight$ = TaskCard.loadingProjectMembers.get(projectId);
          if (inFlight$ && inFlight$.subscribe) {
            inFlight$.subscribe({
              next: (members: any[]) => {
                const memberList = members.map(m => ({ id: m.id, name: m.name }));
                this.projectMembers = memberList;
                this.availableAssignees = [
                  ...memberList.map(m => ({ id: m.id.toString(), name: m.name })),
                  { id: 'unassigned', name: 'Unassigned' }
                ];
              },
              error: () => {
                this.availableAssignees = [{ id: 'unassigned', name: 'Unassigned' }];
              }
            });
          } else {
            // Fallback: ensure at least 'Unassigned' is available
            this.availableAssignees = [{ id: 'unassigned', name: 'Unassigned' }];
          }
        }
      }
    } catch (e) {
      // ignore in non-browser environments
    }

    // Resolve epic title if epicId present (with caching)
    if (this.issue.epicId) {
      const epicId = this.issue.epicId;
      const cachedTitle = TaskCard.epicsCache.get(epicId);
      if (cachedTitle) {
        this.epicTitle.set(cachedTitle);
      } else if (!TaskCard.loadingEpics.get(epicId)) {
        // start a single in-flight request and share it
        const req$ = this.epicApi.getEpicById(epicId).pipe(shareReplay(1));
        TaskCard.loadingEpics.set(epicId, req$);

        req$.subscribe({
          next: e => {
            TaskCard.epicsCache.set(epicId, e.title);
            TaskCard.loadingEpics.delete(epicId);
            this.epicTitle.set(e.title);
          },
          error: () => {
            TaskCard.loadingEpics.delete(epicId);
          }
        });
      } else {
        const inFlight$ = TaskCard.loadingEpics.get(epicId);
        if (inFlight$ && inFlight$.subscribe) {
          inFlight$.subscribe({
            next: (e: any) => {
              TaskCard.epicsCache.set(epicId, e.title);
              this.epicTitle.set(e.title);
            },
            error: () => {
              // keep epicTitle as null
            }
          });
        }
      }
    }
  }

  /**
   * HYBRID PROGRESS CALCULATION ALGORITHM
   * ======================================
   * 
   * This algorithm calculates issue progress using multiple signals:
   * 1. Status-based baseline (explicit workflow state)
   * 2. Time-based progress (schedule adherence)
   * 3. Story point complexity adjustment (larger items progress slower)
   * 
   * ALGORITHM STEPS:
   * 
   * Step 1: Status Baseline Mapping
   * --------------------------------
   * Map each workflow status to a baseline progress percentage:
   * - TODO: 10% (minimal, just created)
   * - IN_PROGRESS: 55% (active work, halfway assumption)
   * - IN_REVIEW: 80% (work complete, awaiting approval)
   * - DONE: 100% (fully complete)
   * - BLOCKED: 5% (stalled, minimal progress)
   * 
   * Rationale: Status reflects intentional team decisions about work state.
   * This provides a stable, predictable baseline even without time tracking.
   * 
   * Step 2: Time-Based Progress (if dates available)
   * -------------------------------------------------
   * Formula: timeProgress = (elapsed / totalDuration) × 100
   * 
   * Where:
   * - elapsed = min(totalDuration, currentTime - startTime)
   * - totalDuration = dueDate - startDate (or createdAt if no startDate)
   * - Clamped to [0, totalDuration] to prevent negative or >100% values
   * 
   * Rationale: Time-based progress reflects schedule reality. An issue
   * halfway through its timeline should ideally be ~50% complete.
   * 
   * Step 3: Hybrid Combination
   * ---------------------------
   * Formula: combined = (statusBaseline × 0.6) + (timeProgress × 0.4)
   * 
   * Weights:
   * - Status: 60% - Prioritizes human judgment (team moved card)
   * - Time: 40% - Reflects schedule adherence and urgency
   * 
   * Rationale: Status changes are deliberate actions that should dominate,
   * but time progress prevents stale cards from appearing healthy when
   * they're behind schedule.
   * 
   * Step 4: Story Point Complexity Adjustment (optional)
   * -----------------------------------------------------
   * Formula: adjusted = combined × (1 - reduction)
   * Where: reduction = min(0.15, storyPoints / 200)
   * 
   * Examples:
   * - 1 point: 0.5% reduction (minimal)
   * - 5 points: 2.5% reduction
   * - 13 points: 6.5% reduction
   * - 20+ points: 10-15% reduction (capped)
   * 
   * Rationale: Larger story points indicate complexity, unknowns, or scope.
   * These items typically progress slower than simple tasks. This adjustment
   * prevents inflated progress bars on epics while keeping small tasks realistic.
   * 
   * Step 5: Boundary Clamping
   * --------------------------
   * Final result is clamped to [0, 100] range to ensure valid percentage.
   * 
   * DECISION TREE:
   * 
   * 1. Is status === 'DONE'?
   *    YES → Return 100% (always complete)
   *    NO → Continue to step 2
   * 
   * 2. Are both startDate/createdAt AND dueDate available?
   *    NO → Return statusBaseline (fallback to simple status mapping)
   *    YES → Continue to step 3
   * 
   * 3. Calculate timeProgress from elapsed time
   * 
   * 4. Combine statusBaseline (60%) + timeProgress (40%)
   * 
   * 5. Are storyPoints > 0?
   *    YES → Apply complexity reduction
   *    NO → Use combined value as-is
   * 
   * 6. Return clamped result [0-100]
   * 
   * EXAMPLES:
   * 
   * Example 1: Simple task, on schedule
   * - Status: IN_PROGRESS (55%)
   * - Start: 5 days ago, Due: 5 days from now (50% elapsed)
   * - Story Points: 2
   * - Calculation:
   *   timeProgress = (5 / 10) × 100 = 50%
   *   combined = (55 × 0.6) + (50 × 0.4) = 33 + 20 = 53%
   *   reduction = min(0.15, 2/200) = 0.01 (1%)
   *   final = 53 × 0.99 = 52.47% → 52%
   * 
   * Example 2: Complex story, behind schedule
   * - Status: IN_PROGRESS (55%)
   * - Start: 10 days ago, Due: 5 days ago (150% elapsed = overdue)
   * - Story Points: 21
   * - Calculation:
   *   timeProgress = (15 / 15) × 100 = 100% (capped)
   *   combined = (55 × 0.6) + (100 × 0.4) = 33 + 40 = 73%
   *   reduction = min(0.15, 21/200) = 0.105 (10.5%)
   *   final = 73 × 0.895 = 65.34% → 65%
   *   → Also flagged as overdue (red progress bar)
   * 
   * Example 3: No dates provided
   * - Status: TODO (10%)
   * - No startDate or dueDate
   * - Story Points: 3
   * - Calculation:
   *   → Fallback to statusBaseline
   *   final = 10%
   * 
   * VISUAL INDICATORS:
   * 
   * Overdue Detection:
   * - Condition: currentTime > dueDate AND status !== 'DONE'
   * - Visual: Progress bar color changes to #ef4444 (red)
   * - Tooltip: Shows "(Overdue)" label
   * 
   * This provides immediate visual feedback when issues are late,
   * prompting team action or deadline adjustment.
   */
  getProgressValue(): number {
    // Step 1: Status baseline mapping
    const statusMap: Record<string, number> = {
      TODO: 10,
      IN_PROGRESS: 55,
      IN_REVIEW: 80,
      DONE: 100,
      BLOCKED: 5
    };

    // Early exit for completed items
    if (this.issue.status === 'DONE') return 100;

    const baseline = statusMap[this.issue.status] ?? 10;

    // Step 2: Check if time-based calculation is possible
    const start = (this.issue as any).startDate ?? this.issue.createdAt;
    const due = this.issue.dueDate;

    if (start && due && due.getTime && start.getTime) {
      const now = new Date();
      
      // Calculate time-based progress
      const total = Math.max(1, due.getTime() - start.getTime());
      const elapsed = Math.max(0, Math.min(total, now.getTime() - start.getTime()));
      const timeProgress = Math.round((elapsed / total) * 100);

      // Step 3: Hybrid combination (status 60% + time 40%)
      const combined = Math.round(baseline * 0.6 + timeProgress * 0.4);

      // Step 4: Story point complexity adjustment
      if (this.issue.storyPoints && this.issue.storyPoints > 0) {
        const sp = this.issue.storyPoints;
        // Reduction formula: up to 15% for very large stories (>20 points)
        const reduction = Math.min(0.15, sp / 200);
        const adjusted = Math.round(combined * (1 - reduction));
        return Math.max(0, Math.min(100, adjusted));
      }

      // Step 5: Boundary clamping
      return Math.max(0, Math.min(100, combined));
    }

    // Fallback: Use status baseline only
    return baseline;
  }

  /**
   * Determines if an issue is overdue.
   * 
   * Conditions:
   * - Must have a dueDate
   * - Current time must be past dueDate
   * - Status must NOT be 'DONE' (completed items can't be overdue)
   * 
   * @returns true if issue is overdue, false otherwise
   */
  isOverdue(): boolean {
    if (!this.issue.dueDate) return false;
    if (this.issue.status === 'DONE') return false;
    const now = new Date();
    return now.getTime() > this.issue.dueDate.getTime();
  }

  /**
   * Returns the appropriate color for the progress bar.
   * 
   * Logic:
   * - Red (#ef4444) when overdue to provide visual warning
   * - Column color otherwise for consistency
   * 
   * @returns Hex color string for progress bar
   */
  progressColor(): string {
    // Show red for overdue items
    if (this.isOverdue()) {
      return '#ef4444';
    }
    // Use column color for normal items
    return this.colorClass;
  }

  /**
   * Returns a descriptive tooltip for the progress bar.
   * Includes percentage and overdue status if applicable.
   * 
   * @returns Tooltip string with progress info
   */
  getProgressTooltip(): string {
    const percentage = this.getProgressValue();
    const overdue = this.isOverdue() ? ' (OVERDUE)' : '';
    
    // Add time remaining info if dueDate exists
    if (this.issue.dueDate && !this.isOverdue()) {
      const now = new Date();
      const diff = this.issue.dueDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
      
      if (daysLeft === 0) return `${percentage}% complete (Due today)`;
      if (daysLeft === 1) return `${percentage}% complete (1 day left)`;
      if (daysLeft > 1) return `${percentage}% complete (${daysLeft} days left)`;
    }
    
    return `${percentage}% complete${overdue}`;
  }
  
  // Title editing methods
  startEditingTitle(event: Event): void {
    event.stopPropagation(); // Prevent card click
    this.editedTitle.set(this.issue.title);
    this.isEditingTitle.set(true);
    // Resize after Angular renders the textarea
    setTimeout(() => this.resizeTitleTextarea(), 0);
  }
  
  saveTitle(): void {
    const newTitle = this.editedTitle().trim();
    if (newTitle && newTitle !== this.issue.title) {
      // Persist change via API-backed update
      try {
        const projectId = this.projectContext.currentProjectId();
        if (projectId) {
          void this.store.updateIssueApi(this.issue.id, projectId, { title: newTitle });
        } else {
          // fallback to local update
          this.store.updateIssueTitle(this.issue.id, newTitle);
        }
      } catch (e) {
        this.store.updateIssueTitle(this.issue.id, newTitle);
      }
    }
    this.isEditingTitle.set(false);
  }
  
  cancelEditTitle(event: Event): void {
    event.stopPropagation();
    this.isEditingTitle.set(false);
  }
  
  onTitleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveTitle();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEditTitle(event);
    }
  }

  autoResizeTitleTextarea(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.resizeTitleTextarea(textarea);
  }

  private resizeTitleTextarea(textarea?: HTMLTextAreaElement): void {
    const element = textarea || this.titleTextarea?.nativeElement;
    if (element) {
      // Reset height to auto to get the correct scrollHeight
      element.style.height = 'auto';
      // Set height to scrollHeight to fit content
      element.style.height = element.scrollHeight + 'px';
    }
  }
  
  // Description editing
  startEditingDescription(event: Event): void {
    event.stopPropagation();
    this.editedDescription.set(this.issue.description || '');
    this.isEditingDescription.set(true);
  }
  
  saveDescription(): void {
    const newDescription = this.editedDescription().trim();
    if (newDescription !== this.issue.description) {
      try {
        const projectId = this.projectContext.currentProjectId();
        if (projectId) {
          void this.store.updateIssueApi(this.issue.id, projectId, { description: newDescription });
        } else {
          this.store.updateIssueDescription(this.issue.id, newDescription);
        }
      } catch (e) {
        this.store.updateIssueDescription(this.issue.id, newDescription);
      }
    }
    this.isEditingDescription.set(false);
  }
  
  cancelEditingDescription(): void {
    this.isEditingDescription.set(false);
  }
  
  // Assignee click handler
  onAssigneeClick(event: Event): void {
    event.stopPropagation(); // Prevent card click
    this.assigneeSearchQuery.set(''); // Reset search when opening
    this.showDatePicker.set(false); // Close date picker if open
    this.showAssigneeDropdown.set(!this.showAssigneeDropdown());
  }
  
  selectAssignee(assigneeEntry: { id: string | 'unassigned', name: string }): void {
    const newAssignee = assigneeEntry.id === 'unassigned' ? undefined : assigneeEntry.id;
    try {
      const projectId = this.projectContext.currentProjectId();
      if (projectId) {
        void this.store.updateIssueApi(this.issue.id, projectId, { assignee: newAssignee });
      } else {
        this.store.updateIssueAssignee(this.issue.id, newAssignee);
      }
    } catch (e) {
      this.store.updateIssueAssignee(this.issue.id, newAssignee);
    }
    // Optimistic UI update for assignee display
    this.assigneeName.set(assigneeEntry.id === 'unassigned' ? null : assigneeEntry.name);
    this.showAssigneeDropdown.set(false);
    this.assigneeSearchQuery.set(''); // Reset search
  }
  
  closeAssigneeDropdown(): void {
    this.showAssigneeDropdown.set(false);
    this.assigneeSearchQuery.set(''); // Reset search
  }
  
  // Due date handlers
  onDueDateClick(event: Event): void {
    event.stopPropagation();
    this.showAssigneeDropdown.set(false); // Close assignee dropdown if open
    this.showDatePicker.set(!this.showDatePicker());
  }
  
  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newDate = input.value ? new Date(input.value) : undefined;
    try {
      const projectId = this.projectContext.currentProjectId();
      if (projectId) {
        void this.store.updateIssueApi(this.issue.id, projectId, { dueDate: newDate });
      } else {
        this.store.updateIssueDueDate(this.issue.id, newDate);
      }
    } catch (e) {
      this.store.updateIssueDueDate(this.issue.id, newDate);
    }
    this.showDatePicker.set(false);
  }
  
  clearDueDate(): void {
    try {
      const projectId = this.projectContext.currentProjectId();
      if (projectId) {
        void this.store.updateIssueApi(this.issue.id, projectId, { dueDate: undefined });
      } else {
        this.store.updateIssueDueDate(this.issue.id, undefined);
      }
    } catch (e) {
      this.store.updateIssueDueDate(this.issue.id, undefined);
    }
    this.showDatePicker.set(false);
  }
  
  closeDatePicker(): void {
    this.showDatePicker.set(false);
  }
  
  formatDateForInput(date?: Date): string {
    if (!date) return '';
    const d = new Date(date);
    // Format as YYYY-MM-DD in local timezone (not UTC)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Comments click handler - opens modal and scrolls to comments
  onCommentsClick(event: Event): void {
    event.stopPropagation();
    this.openComments.emit(this.issue);
  }
}
