import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineHeaderComponent, FilterState } from '../timeline-header/timeline-header';
import { sprints as sharedSprints, epics as sharedEpics } from '../../shared/data/dummy-backlog-data';
import { Issue } from '../../shared/models/issue.model';
import { Epic } from '../../shared/models/epic.model';
import { EpicDetailedView } from '../../epic/epic-detailed-view/epic-detailed-view';
import { IssueDetailedView } from '../../backlog/issue-detailed-view/issue-detailed-view';

interface Sprint {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'COMPLETED' | 'ACTIVE' | 'PLANNED';
  issues?: Issue[];
}

interface TimelineRow {
  id: string;
  type: 'sprints-overview' | 'sprint' | 'epic' | 'issue';
  name: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  progress?: number;
  issueType?: string;
  expanded?: boolean;
  level?: number;
  visible?: boolean;
  sprints?: Sprint[]; // For sprints-overview row to hold multiple sprint bars
}

interface MonthHeader {
  name: string;
  left: number;
  width: number;
}

interface WeekHeader {
  name: string;
  left: number;
  width: number;
}

interface DayHeader {
  name: string;
  left: number;
  width: number;
  date: Date;
}

interface YearHeader {
  name: string;
  left: number;
  width: number;
}

@Component({
  selector: 'app-timeline-chart',
  standalone: true,
  imports: [CommonModule, TimelineHeaderComponent, EpicDetailedView, IssueDetailedView],
  templateUrl: './timeline-chart.html',
  styleUrls: ['./timeline-chart.css']
})
export class TimelineChart implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;
  @ViewChild('sidebarContent', { static: false }) sidebarContent!: ElementRef;
  @ViewChild('chartContent', { static: false }) chartContent!: ElementRef;
  @ViewChild('headerScroll', { static: false }) headerScroll!: ElementRef;
  @ViewChild('fixedScrollbar', { static: false }) fixedScrollbar!: ElementRef;
  
  currentView: 'day' | 'month' | 'year' = 'month';
  selectedFilters: FilterState = {
    epics: [],
    types: [],
    status: []
  };
  
  projectData: Sprint[] = sharedSprints;
  epicsData: Epic[] = sharedEpics;
  displayMode: 'epics' | 'issues' = 'epics';
  selectedEpic: string | null = null;
  availableEpics: string[] = [];

  // Timeline properties
  timelineRows: TimelineRow[] = [];
  monthHeaders: MonthHeader[] = [];
  weekHeaders: WeekHeader[] = [];
  dayHeaders: DayHeader[] = [];
  yearHeaders: YearHeader[] = [];
  expandedRows: Set<string> = new Set();
  dateRange: { start: Date; end: Date } = { start: new Date(), end: new Date() };
  chartWidth: number = 0;
  
  // Display options
  showCompleted: boolean = true;
  displayRangeMonths: number = 12;
  
  // Modal state for epic and issue details
  selectedEpicForModal: Epic | null = null;
  selectedIssueForModal: Issue | null = null;
  isEpicModalOpen: boolean = false;
  isIssueModalOpen: boolean = false;
  
  // Scroll synchronization flags
  private isScrollingSidebar = false;
  private isScrollingChart = false;
  private isScrollingHeader = false;
  private isScrollingFixedBar = false;

  // Mouse drag scrolling properties
  private isDraggingScroll = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private scrollStartX = 0;
  private scrollStartY = 0;

  // Bar resize properties
  resizingBar: { id: string; side: 'left' | 'right'; startX: number; originalStart: Date; originalEnd: Date } | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // Get projectId from route parameters
    this.route.parent?.paramMap.subscribe(params => {
      this.projectId = params.get('projectId');
      
      if (this.projectId) {
        this.loadTimelineData(this.projectId);
      } else {
        this.errorMessage = 'No project ID found in route';
      }
    });
  }

  /**
   * Load all timeline data from backend APIs
   */
  loadTimelineData(projectId: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.timelineService.getTimelineData(projectId).subscribe({
      next: (data) => {
        // Transform sprints
        this.projectData = this.transformSprints(data.sprints, data.issues);
        
        // Transform epics
        this.epicsData = this.transformEpics(data.epics);
        
        // Store all issues
        this.allIssues = this.transformIssues(data.issues);
        
        // Initialize filters and prepare timeline
        this.initializeFilters();
        this.availableEpics = this.getUniqueEpics();
        
        this.prepareTimelineData();
        
        this.isLoading = false;
        
        // Scroll to today after data is loaded and rendered
        setTimeout(() => {
          this.updateDateHeaders();
          this.scrollToTodayCenter();
          this.cdr.detectChanges();
        }, 300);
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        // Don't show error message - just initialize with empty data
        this.projectData = [];
        this.epicsData = [];
        this.allIssues = [];
        
        this.initializeFilters();
        this.availableEpics = [];
        this.prepareTimelineData();
        
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Transform Sprint DTOs to Sprint interface
   */
  private transformSprints(sprintDtos: SprintDto[], issueDtos: IssueDto[]): Sprint[] {
    return sprintDtos.map(dto => {
      // Find issues belonging to this sprint
      const sprintIssues = this.transformIssues(
        issueDtos.filter(issue => 
          (issue.sprint_id || issue.sprintId) === dto.id
        )
      );
      
      // Handle both snake_case and camelCase
      const name = dto.name || dto.sprintName || 'Unnamed Sprint';
      const startDate = dto.start_date || dto.startDate;
      const endDate = dto.due_date || dto.dueDate;
      
      return {
        id: dto.id,
        name: name,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: this.mapSprintStatus(dto.status),
        issues: sprintIssues
      };
    });
  }

  /**
   * Map backend sprint status to frontend status
   */
  private mapSprintStatus(status: string): 'COMPLETED' | 'ACTIVE' | 'PLANNED' {
    const upperStatus = (status || '').toUpperCase();
    const statusMap: { [key: string]: 'COMPLETED' | 'ACTIVE' | 'PLANNED' } = {
      'COMPLETED': 'COMPLETED',
      'ACTIVE': 'ACTIVE',
      'PLANNED': 'PLANNED',
      'INPROGRESS': 'ACTIVE',
      'IN_PROGRESS': 'ACTIVE',
      'NOTSTARTED': 'PLANNED',
      'NOT_STARTED': 'PLANNED',
      'CLOSED': 'COMPLETED',
      'DONE': 'COMPLETED'
    };
    return statusMap[upperStatus] || 'PLANNED';
  }

  /**
   * Transform Epic DTOs to Epic interface
   */
  private transformEpics(epicDtos: EpicDto[]): Epic[] {
    return epicDtos.map(dto => {
      // Handle both snake_case and camelCase, and title vs name
      const name = dto.title || dto.name || 'Unnamed Epic';
      const description = dto.description || '';
      const startDate = dto.start_date || dto.startDate;
      const dueDate = dto.due_date || dto.dueDate;
      const createdAt = dto.created_at || dto.createdAt;
      const updatedAt = dto.updated_at || dto.updatedAt;
      const projectId = dto.project_id || dto.projectId;
      
      return {
        id: dto.id,
        name: name,
        description: description,
        status: dto.status as any || 'TODO',
        priority: dto.priority as any || 'MEDIUM',
        projectId: projectId || '',
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
        progress: 0, // Will be calculated based on issues
        issueCount: 0 // Will be calculated based on issues
      };
    });
  }

  /**
   * Transform Issue DTOs to Issue interface
   */
  private transformIssues(issueDtos: IssueDto[]): Issue[] {
    return issueDtos.map(dto => {
      // Handle both snake_case and camelCase
      const key = dto.key || dto.issue_key || dto.issueKey || 'N/A';
      const issueType = dto.type || dto.issue_type || dto.issueType || 'TASK';
      const assigneeName = dto.assignee_name || dto.assigneeName || 'Unassigned';
      const assigneeId = dto.assignee_id || dto.assigneeId || 0;
      const reporterId = dto.reporter_id || dto.reporterId || 0;
      const reporterName = dto.reporter_name || dto.reporterName;
      const storyPoints = dto.story_points || dto.storyPoints || 0;
      const projectId = dto.project_id || dto.projectId || '';
      const sprintId = dto.sprint_id || dto.sprintId;
      const epicId = dto.epic_id || dto.epicId;
      const createdAt = dto.created_at || dto.createdAt;
      const updatedAt = dto.updated_at || dto.updatedAt;
      const dueDate = dto.due_date || dto.dueDate;
      const startDate = dto.start_date || dto.startDate;
      
      // Map numeric status to string
      const status = this.mapNumericStatus(dto.status);
      
      return {
        id: dto.id,
        key: key,
        title: dto.title,
        description: dto.description || '',
        type: this.mapIssueType(issueType),
        priority: dto.priority as any,
        status: status,
        assignee: assigneeName,
        assigneeId: assigneeId,
        reporterId: reporterId,
        reporterName: reporterName,
        storyPoints: storyPoints,
        projectId: projectId,
        sprintId: sprintId || undefined,
        epicId: epicId || undefined,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        startDate: startDate ? new Date(startDate) : undefined
      };
    });
  }

  /**
   * Map numeric status (1,2,3,4) to string status
   */
  private mapNumericStatus(status: string | number): 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED' {
    // If it's already a string, try to map it
    if (typeof status === 'string') {
      const upperStatus = status.toUpperCase();
      const statusMap: { [key: string]: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED' } = {
        'TODO': 'TODO',
        'IN_PROGRESS': 'IN_PROGRESS',
        'INPROGRESS': 'IN_PROGRESS',
        'IN_REVIEW': 'IN_REVIEW',
        'INREVIEW': 'IN_REVIEW',
        'DONE': 'DONE',
        'COMPLETED': 'DONE',
        'BLOCKED': 'BLOCKED'
      };
      return statusMap[upperStatus] || 'TODO';
    }
    
    // Map numeric status: 1=TODO, 2=IN_PROGRESS, 3=IN_REVIEW, 4=DONE
    const numericStatusMap: { [key: number]: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED' } = {
      1: 'TODO',
      2: 'IN_PROGRESS',
      3: 'IN_REVIEW',
      4: 'DONE',
      5: 'BLOCKED'
    };
    
    return numericStatusMap[status as number] || 'TODO';
  }

  /**
   * Map backend issue type to frontend IssueType
   */
  private mapIssueType(type: string): 'STORY' | 'TASK' | 'BUG' | 'EPIC' | 'SUBTASK' {
    const upperType = (type || 'TASK').toUpperCase();
    const typeMap: { [key: string]: 'STORY' | 'TASK' | 'BUG' | 'EPIC' | 'SUBTASK' } = {
      'STORY': 'STORY',
      'TASK': 'TASK',
      'BUG': 'BUG',
      'EPIC': 'EPIC',
      'SUBTASK': 'SUBTASK',
      'SUB_TASK': 'SUBTASK',
      'USER_STORY': 'STORY'
    };
    return typeMap[upperType] || 'TASK';
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.updateDateHeaders();
      this.scrollToTodayCenter();
      this.cdr.detectChanges();
    }, 100);

    // Add mouse move and up listeners for bar resize
    document.addEventListener('mousemove', this.onBarResizeMove.bind(this));
    document.addEventListener('mouseup', this.onBarResizeEnd.bind(this));
    
    // Add drag scrolling listeners
    if (this.chartContent && this.chartContent.nativeElement) {
      const chartEl = this.chartContent.nativeElement;
      chartEl.addEventListener('mousedown', this.onDragScrollStart.bind(this));
      document.addEventListener('mousemove', this.onDragScrollMove.bind(this));
      document.addEventListener('mouseup', this.onDragScrollEnd.bind(this));
    }
  }

  ngOnDestroy() {
    // Cleanup bar resize listeners
    document.removeEventListener('mousemove', this.onBarResizeMove.bind(this));
    document.removeEventListener('mouseup', this.onBarResizeEnd.bind(this));
    
    // Cleanup drag scroll listeners
    document.removeEventListener('mousemove', this.onDragScrollMove.bind(this));
    document.removeEventListener('mouseup', this.onDragScrollEnd.bind(this));
  }

  // Bar resize functionality
  onBarResizeStart(event: MouseEvent, row: TimelineRow, side: 'left' | 'right'): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (!row.startDate || !row.endDate) return;
    
    this.resizingBar = {
      id: row.id,
      side: side,
      startX: event.clientX,
      originalStart: new Date(row.startDate),
      originalEnd: new Date(row.endDate)
    };
  }

  // Drag scrolling functionality
  private onDragScrollStart(event: MouseEvent): void {
    // Don't start drag scroll if clicking on a bar or resize handle
    const target = event.target as HTMLElement;
    if (target.classList.contains('timeline-bar') || 
        target.classList.contains('bar-resize-handle') ||
        target.closest('.timeline-bar')) {
      return;
    }
    
    this.isDraggingScroll = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    
    if (this.chartContent && this.chartContent.nativeElement) {
      this.scrollStartX = this.chartContent.nativeElement.scrollLeft;
      this.scrollStartY = this.chartContent.nativeElement.scrollTop;
      this.chartContent.nativeElement.style.cursor = 'grabbing';
    }
  }

  private onDragScrollMove(event: MouseEvent): void {
    if (!this.isDraggingScroll || !this.chartContent || !this.chartContent.nativeElement) return;
    
    event.preventDefault();
    
    const deltaX = this.dragStartX - event.clientX;
    const deltaY = this.dragStartY - event.clientY;
    
    this.chartContent.nativeElement.scrollLeft = this.scrollStartX + deltaX;
    this.chartContent.nativeElement.scrollTop = this.scrollStartY + deltaY;
  }

  private onDragScrollEnd(event: MouseEvent): void {
    if (this.isDraggingScroll && this.chartContent && this.chartContent.nativeElement) {
      this.chartContent.nativeElement.style.cursor = 'grab';
    }
    this.isDraggingScroll = false;
  }

  private onBarResizeMove(event: MouseEvent): void {
    if (!this.resizingBar) return;
    
    const deltaX = event.clientX - this.resizingBar.startX;
    const deltaDays = Math.round(deltaX / this.getPixelsPerDay());
    
    const row = this.timelineRows.find(r => r.id === this.resizingBar!.id);
    if (!row || !row.startDate || !row.endDate) return;
    
    if (this.resizingBar.side === 'left') {
      const newStart = new Date(this.resizingBar.originalStart);
      newStart.setDate(newStart.getDate() + deltaDays);
      
      // Ensure start doesn't go beyond end
      if (newStart < row.endDate) {
        row.startDate = newStart;
        // Update the underlying data
        this.updateUnderlyingData(row.id, newStart, row.endDate);
      }
    } else {
      const newEnd = new Date(this.resizingBar.originalEnd);
      newEnd.setDate(newEnd.getDate() + deltaDays);
      
      // Ensure end doesn't go before start
      if (newEnd > row.startDate) {
        row.endDate = newEnd;
        // Update the underlying data
        this.updateUnderlyingData(row.id, row.startDate, newEnd);
      }
    }
    
    this.cdr.detectChanges();
  }

  private onBarResizeEnd(event: MouseEvent): void {
    if (!this.resizingBar) return;
    this.resizingBar = null;
    this.cdr.detectChanges();
  }

  private updateUnderlyingData(rowId: string, startDate: Date, endDate: Date): void {
    // Update the actual data based on row type
    
    // Check if it's an epic
    const epic = this.epicsData.find(e => e.id === rowId);
    if (epic) {
      // Note: Epic model might not have startDate/endDate properties
      // This is a placeholder for future database update
      console.log(`Epic ${epic.name} dates updated:`, { startDate, endDate });
      // TODO: Call API service to update epic dates in database
      // this.epicService.updateEpicDates(epic.id, startDate, endDate).subscribe();
      return;
    }
    
    // Check if it's an issue
    for (const sprint of this.projectData) {
      if (sprint.issues) {
        const issue = sprint.issues.find(i => i.id === rowId);
        if (issue) {
          issue.createdAt = startDate;
          issue.updatedAt = endDate;
          console.log(`Issue ${issue.title} dates updated:`, { startDate, endDate });
          // TODO: Call API service to update issue dates in database
          // this.issueService.updateIssueDates(issue.id, startDate, endDate).subscribe();
          return;
        }
      }
    }
    
    // Check if it's a sprint
    const sprint = this.projectData.find(s => `sprint-${s.id}` === rowId);
    if (sprint) {
      sprint.startDate = startDate;
      sprint.endDate = endDate;
      console.log(`Sprint ${sprint.name} dates updated:`, { startDate, endDate });
      // TODO: Call API service to update sprint dates in database
      // this.sprintService.updateSprintDates(sprint.id, startDate, endDate).subscribe();
      return;
    }
  }

  private getPixelsPerDay(): number {
    const totalDays = Math.ceil((this.dateRange.end.getTime() - this.dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    return this.chartWidth / totalDays;
  }

  // Dynamic timeline preparation
  private prepareTimelineData(): void {
    this.timelineRows = [];
    
    // Check if we have any data at all
    const hasData = this.projectData.length > 0 || this.epicsData.length > 0 || this.allIssues.length > 0;
    
    if (!hasData) {
      // Still calculate date range and show empty timeline with today line
      this.calculateDynamicDateRange([]);
      return;
    }
    
    // If we have no sprints but have epics/issues, continue anyway
    if (this.projectData.length === 0) {
      // Continue with epics/issues
    }

    // 1. Add single "Sprints" overview row showing all sprints
    this.timelineRows.push({
      id: 'sprints-overview',
      type: 'sprints-overview',
      name: 'Sprints',
      status: '',
      sprints: this.projectData, // Pass all sprints to display multiple bars
      level: 0,
      visible: true
    });

    // 2. Add all epics directly (not grouped under sprints)
    const allIssues: Issue[] = [];
    this.projectData.forEach(sprint => {
      if (sprint.issues) {
        allIssues.push(...sprint.issues);
      }
    });

    // Group issues by epic
    const epicGroups = this.groupIssuesByEpicId(allIssues);
    
    Object.entries(epicGroups).forEach(([epicId, issues]) => {
      const epic = this.epicsData.find(e => e.id === epicId);
      if (!epic) return;
      
      // Apply epic filter if any
      if (this.selectedFilters.epics.length > 0 && 
          !this.selectedFilters.epics.includes(epic.name)) {
        return;
      }

      const epicStart = this.getEarliestDate(issues.map(i => i.createdAt));
      const epicEnd = this.getLatestDate(issues.map(i => i.updatedAt));
      
      // Calculate epic progress
      const epicProgress = this.calculateEpicProgress(issues);
      
      // Filter completed epics based on display options
      const isEpicCompleted = epicProgress === 100 || epic.status === 'DONE';
      if (!this.showCompleted && isEpicCompleted) {
        return;
      }
      
      // Filter epics by display range (only for completed epics)
      if (isEpicCompleted && !this.isEpicInDisplayRange(epic, epicEnd)) {
        return;
      }
      
      // Add epic row
      this.timelineRows.push({
        id: epic.id,
        type: 'epic',
        name: epic.name,
        status: epic.status || 'TODO',
        startDate: epicStart,
        endDate: epicEnd,
        progress: epicProgress,
        expanded: this.isRowExpanded(epic.id),
        level: 0, // Epics are now at root level, not nested
        visible: this.isItemInDateRange(epicStart, epicEnd)
      });

      // Add issue rows if epic is expanded
      if (this.isRowExpanded(epic.id)) {
        issues.forEach(issue => {
          if (this.isIssueTypeVisible(issue.type) && this.isIssueStatusVisible(issue.status)) {
            this.timelineRows.push({
              id: issue.id,
              type: 'issue',
              name: issue.title,
              status: issue.status,
              startDate: issue.createdAt,
              endDate: issue.updatedAt,
              progress: this.getIssueProgress(issue),
              issueType: issue.type,
              level: 1, // Issues are one level below epics
              visible: this.isItemInDateRange(issue.createdAt, issue.updatedAt)
            });
          }
        });
      }
    });

    this.updateDateHeaders();
    this.cdr.detectChanges();
  }

  private calculateDynamicDateRange(sprints: Sprint[]): void {
    if (sprints.length === 0) {
      const now = new Date();
      switch (this.currentView) {
        case 'day':
          this.dateRange.start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
          this.dateRange.end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
          break;
        case 'month':
          this.dateRange.start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          this.dateRange.end = new Date(now.getFullYear(), now.getMonth() + 4, 0);
          break;
        case 'year':
          this.dateRange.start = new Date(now.getFullYear() - 1, 0, 1);
          this.dateRange.end = new Date(now.getFullYear() + 1, 11, 31);
          break;
      }
      return;
    }

    const allDates: Date[] = [];
    
    sprints.forEach(sprint => {
      allDates.push(sprint.startDate);
      allDates.push(sprint.endDate);
    });

    sprints.forEach(sprint => {
      if (sprint.issues && this.isRowExpanded(`sprint-${sprint.id}`)) {
        sprint.issues.forEach(issue => {
          if (this.isIssueTypeVisible(issue.type) && this.isIssueStatusVisible(issue.status)) {
            allDates.push(issue.createdAt);
            allDates.push(issue.updatedAt);
          }
        });
      }
    });

    const earliestDate = this.getEarliestDate(allDates);
    const latestDate = this.getLatestDate(allDates);

    switch (this.currentView) {
      case 'day':
        const dayPadding = 7;
        this.dateRange.start = new Date(earliestDate);
        this.dateRange.start.setDate(this.dateRange.start.getDate() - dayPadding);
        this.dateRange.end = new Date(latestDate);
        this.dateRange.end.setDate(this.dateRange.end.getDate() + dayPadding);
        break;

      case 'month':
        const monthPadding = 1;
        this.dateRange.start = new Date(earliestDate.getFullYear(), earliestDate.getMonth() - monthPadding, 1);
        this.dateRange.end = new Date(latestDate.getFullYear(), latestDate.getMonth() + monthPadding + 1, 0);
        break;

      case 'year':
        this.dateRange.start = new Date(earliestDate.getFullYear(), 0, 1);
        this.dateRange.end = new Date(latestDate.getFullYear(), 11, 31);
        break;
    }
  }

  private isItemInDateRange(startDate: Date, endDate: Date): boolean {
    if (!startDate || !endDate) return true;
    
    const itemStart = startDate.getTime();
    const itemEnd = endDate.getTime();
    const rangeStart = this.dateRange.start.getTime();
    const rangeEnd = this.dateRange.end.getTime();

    return itemStart <= rangeEnd && itemEnd >= rangeStart;
  }

  private isIssueTypeVisible(issueType: string): boolean {
    if (this.selectedFilters.types.length === 0) return true;
    return this.selectedFilters.types.includes(issueType.toLowerCase());
  }

  private isIssueStatusVisible(issueStatus: string): boolean {
    if (this.selectedFilters.status.length === 0) return true;
    const statusMap: { [key: string]: string } = {
      'TODO': 'todo',
      'IN_PROGRESS': 'progress',
      'DONE': 'done',
      'IN_REVIEW': 'progress'
    };
    const filterStatus = statusMap[issueStatus] || issueStatus.toLowerCase();
    return this.selectedFilters.status.includes(filterStatus);
  }

  private isEpicInDisplayRange(epic: Epic, epicEndDate: Date): boolean {
    // Only filter if the epic has a due date
    if (epic.dueDate) {
      const today = new Date();
      const monthsAgo = new Date(today);
      monthsAgo.setMonth(monthsAgo.getMonth() - this.displayRangeMonths);
      
      // Check if epic's due date is within the display range
      const dueDate = new Date(epic.dueDate);
      return dueDate >= monthsAgo;
    }
    
    // For epics without due dates, always show them
    return true;
  }

  // Date header management
  private updateDateHeaders(): void {
    this.calculateChartWidth();
    this.updateYearHeaders();
    this.updateMonthHeaders();
    this.updateWeekHeaders();
    this.updateDayHeaders();
  }

  private calculateChartWidth(): void {
    const totalDays = Math.ceil((this.dateRange.end.getTime() - this.dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (this.currentView) {
      case 'day':
        this.chartWidth = Math.max(totalDays * 50, 2000); // Reduced from 100 to 50
        break;
      case 'month':
        this.chartWidth = Math.max(totalDays * 5, 1500); // Reduced from 10 to 5
        break;
      case 'year':
        this.chartWidth = Math.max(totalDays * 1.5, 1200); // Reduced from 2 to 1.5
        break;
    }
  }

  private updateYearHeaders(): void {
    this.yearHeaders = [];
    if (!this.dateRange.start || !this.dateRange.end || this.currentView !== 'year') return;
    
    const start = new Date(this.dateRange.start);
    const end = new Date(this.dateRange.end);
    
    let currentYear = start.getFullYear();
    
    while (currentYear <= end.getFullYear()) {
      const yearStart = new Date(Math.max(
        new Date(currentYear, 0, 1).getTime(),
        start.getTime()
      ));
      const yearEnd = new Date(Math.min(
        new Date(currentYear, 11, 31, 23, 59, 59).getTime(),
        end.getTime()
      ));
      
      const left = this.getDatePositionInPixels(yearStart);
      const width = this.getDatePositionInPixels(yearEnd) - left;
      
      if (width > 30) {
        this.yearHeaders.push({
          name: currentYear.toString(),
          left: left,
          width: width
        });
      }
      
      currentYear++;
    }
  }

  private updateMonthHeaders(): void {
    this.monthHeaders = [];
    if (!this.dateRange.start || !this.dateRange.end) return;
    
    const start = new Date(this.dateRange.start);
    const end = new Date(this.dateRange.end);
    
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    
    while (current <= end) {
      const monthName = this.currentView === 'year' 
        ? current.toLocaleDateString('en-US', { month: 'short' })
        : current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthStart = new Date(Math.max(current.getTime(), start.getTime()));
      const monthEnd = new Date(Math.min(
        new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59).getTime(),
        end.getTime()
      ));
      
      const left = this.getDatePositionInPixels(monthStart);
      const width = this.getDatePositionInPixels(monthEnd) - left;
      
      if (width > 30) {
        this.monthHeaders.push({
          name: monthName,
          left: left,
          width: width
        });
      }
      
      current.setMonth(current.getMonth() + 1);
    }
  }

  private updateWeekHeaders(): void {
    this.weekHeaders = [];
    if (!this.dateRange.start || !this.dateRange.end || this.currentView === 'year') return;
    
    const start = new Date(this.dateRange.start);
    const end = new Date(this.dateRange.end);
    
    let current = new Date(start);
    current.setDate(current.getDate() - current.getDay());
    
    while (current < end) {
      const weekStart = new Date(Math.max(current.getTime(), start.getTime()));
      const weekEnd = new Date(Math.min(
        new Date(current.getFullYear(), current.getMonth(), current.getDate() + 6, 23, 59, 59).getTime(),
        end.getTime()
      ));
      
      const left = this.getDatePositionInPixels(weekStart);
      const width = this.getDatePositionInPixels(weekEnd) - left;
      
      if (width > 20) {
        this.weekHeaders.push({
          name: `W${this.getWeekNumber(current)}`,
          left: left,
          width: width
        });
      }
      
      current.setDate(current.getDate() + 7);
    }
  }

  private updateDayHeaders(): void {
    this.dayHeaders = [];
    if (!this.dateRange.start || !this.dateRange.end || this.currentView !== 'day') return;
    
    const start = new Date(this.dateRange.start);
    const end = new Date(this.dateRange.end);
    
    let current = new Date(start);
    
    while (current <= end) {
      const dayStart = new Date(current);
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);
      
      const left = this.getDatePositionInPixels(dayStart);
      const width = this.getDatePositionInPixels(dayEnd) - left;
      
      if (width > 10) {
        this.dayHeaders.push({
          name: current.getDate().toString(),
          left: left,
          width: width,
          date: new Date(current)
        });
      }
      
      current.setDate(current.getDate() + 1);
    }
  }

  private getDatePositionInPixels(date: Date): number {
    if (!this.dateRange.start || !this.dateRange.end) return 0;
    const totalDuration = this.dateRange.end.getTime() - this.dateRange.start.getTime();
    const position = date.getTime() - this.dateRange.start.getTime();
    const percentage = totalDuration > 0 ? Math.max(0, Math.min(1, position / totalDuration)) : 0;
    return percentage * this.chartWidth;
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Template methods
  toggleRow(rowId: string): void {
    if (this.expandedRows.has(rowId)) {
      this.expandedRows.delete(rowId);
    } else {
      this.expandedRows.add(rowId);
    }
    this.prepareTimelineData();
  }

  // Epic click handler - opens epic detail side panel
  onEpicClick(event: Event, epicId: string): void {
    event.stopPropagation(); // Prevent toggle from firing
    
    // Epic ID already has the correct format (e.g., 'epic-1')
    const epic = this.epicsData.find(e => e.id === epicId);
    
    if (epic) {
      this.selectedEpicForModal = { ...epic };
      this.isEpicModalOpen = true;
      this.cdr.detectChanges(); // Trigger change detection
    }
  }

  // Issue click handler - opens issue detail modal
  onIssueClick(event: Event, issueId: string): void {
    event.stopPropagation(); // Prevent any parent clicks
    
    // Find the issue from all sprints
    let foundIssue: Issue | null = null;
    for (const sprint of this.projectData) {
      if (sprint.issues) {
        foundIssue = sprint.issues.find(i => i.id === issueId) || null;
        if (foundIssue) break;
      }
    }
    
    if (foundIssue) {
      this.selectedIssueForModal = { ...foundIssue };
      this.isIssueModalOpen = true;
      this.cdr.detectChanges(); // Trigger change detection
    }
  }

  // Close epic modal
  closeEpicModal(): void {
    this.isEpicModalOpen = false;
    setTimeout(() => {
      this.selectedEpicForModal = null;
    }, 300); // Wait for animation
  }

  // Close issue modal
  closeIssueModal(): void {
    this.isIssueModalOpen = false;
    setTimeout(() => {
      this.selectedIssueForModal = null;
    }, 300); // Wait for animation
  }

  // Handle epic updates from the modal
  onEpicUpdated(updatedEpic: Epic): void {
    // Find and update the epic in the data
    const index = this.epicsData.findIndex(e => e.id === updatedEpic.id);
    if (index !== -1) {
      this.epicsData[index] = { ...updatedEpic };
    }
    // Update the modal state
    this.selectedEpicForModal = { ...updatedEpic };
    this.prepareTimelineData(); // Refresh timeline display
  }

  // Handle issue deletion from the modal
  onIssueDeleted(issueId: string): void {
    // Remove the issue from sprint data
    for (const sprint of this.projectData) {
      if (sprint.issues) {
        sprint.issues = sprint.issues.filter(i => i.id !== issueId);
      }
    }
    this.closeIssueModal();
    this.prepareTimelineData(); // Refresh timeline display
  }

  isRowExpanded(rowId: string): boolean {
    return this.expandedRows.has(rowId);
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'COMPLETED': 'bg-green-500',
      'ACTIVE': 'bg-blue-500',
      'PLANNED': 'bg-yellow-500',
      'DONE': 'bg-green-500',
      'IN_PROGRESS': 'bg-blue-500',
      'TODO': 'bg-gray-500',
      'IN_REVIEW': 'bg-orange-500'
    };
    return statusMap[status] || 'bg-gray-500';
  }

  getStatusLabel(status: string): string {
    const statusLabelMap: { [key: string]: string } = {
      'COMPLETED': 'Done',
      'ACTIVE': 'In Progress',
      'PLANNED': 'To Do',
      'DONE': 'Done',
      'IN_PROGRESS': 'In Progress',
      'TODO': 'To Do',
      'IN_REVIEW': 'In Progress'
    };
    return statusLabelMap[status] || 'To Do';
  }

  getTypeIcon(issueType?: string): string {
    // Method kept for backward compatibility but no longer used in template
    return '';
  }

  getBarPosition(startDate?: Date): number {
    if (!startDate) return 0;
    return this.getDatePositionInPixels(startDate);
  }

  getBarWidth(startDate?: Date, endDate?: Date): number {
    if (!startDate || !endDate) return 0;
    const startPos = this.getDatePositionInPixels(startDate);
    const endPos = this.getDatePositionInPixels(endDate);
    return Math.max(endPos - startPos, 20);
  }

  getTooltipText(name: string, startDate?: Date, endDate?: Date): string {
    if (!startDate || !endDate) return name;
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    };
    
    return `${name}\nStart: ${formatDate(startDate)}\nEnd: ${formatDate(endDate)}`;
  }

  getTodayPosition(): number {
    return this.getDatePositionInPixels(new Date());
  }

  getChartWidth(): number {
    return this.chartWidth;
  }

  getHeaderHeight(): number {
    switch (this.currentView) {
      case 'day':
        return 68; // Month + Day (no week)
      case 'month':
        return 40; // Month only (no week)
      case 'year':
        return 68; // Year + Month
      default:
        return 40;
    }
  }

  // Get dynamic container height based on visible rows
  getContainerHeight(): number {
    const visibleRows = this.getVisibleRowCount();
    const headerHeight = this.getHeaderHeight();
    const baseHeight = 300;
    const maxHeight = 700;
    
    let calculatedHeight = headerHeight + (visibleRows * 48) + 50;
    
    return Math.max(baseHeight, Math.min(calculatedHeight, maxHeight));
  }

  // Get count of visible rows
  getVisibleRowCount(): number {
    return this.timelineRows.filter(row => row.visible !== false).length;
  }

  // FIXED: Scroll synchronization methods with header sync
  onSidebarScroll(event: Event): void {
    if (this.isScrollingChart) {
      return;
    }
    
    this.isScrollingSidebar = true;
    const sidebar = event.target as HTMLElement;
    const scrollTop = sidebar.scrollTop;
    
    if (this.chartContent && this.chartContent.nativeElement) {
      this.chartContent.nativeElement.scrollTop = scrollTop;
    }
    
    setTimeout(() => {
      this.isScrollingSidebar = false;
    }, 10);
  }

  onChartScroll(event: Event): void {
    if (this.isScrollingSidebar || this.isScrollingHeader || this.isScrollingFixedBar) {
      return;
    }
    
    this.isScrollingChart = true;
    const chart = event.target as HTMLElement;
    const scrollTop = chart.scrollTop;
    const scrollLeft = chart.scrollLeft;
    
    // Sync vertical scroll with sidebar
    if (this.sidebarContent && this.sidebarContent.nativeElement) {
      this.sidebarContent.nativeElement.scrollTop = scrollTop;
    }
    
    // FIXED: Sync horizontal scroll with header
    if (this.headerScroll && this.headerScroll.nativeElement) {
      this.headerScroll.nativeElement.scrollLeft = scrollLeft;
    }
    
    // Sync horizontal scroll with fixed bottom scrollbar
    if (this.fixedScrollbar && this.fixedScrollbar.nativeElement) {
      this.fixedScrollbar.nativeElement.scrollLeft = scrollLeft;
    }
    
    setTimeout(() => {
      this.isScrollingChart = false;
    }, 10);
  }

  // FIXED: Add header scroll handler to sync with chart content
  onHeaderScroll(event: Event): void {
    if (this.isScrollingChart || this.isScrollingFixedBar) {
      return;
    }
    
    this.isScrollingHeader = true;
    const header = event.target as HTMLElement;
    const scrollLeft = header.scrollLeft;
    
    // Sync horizontal scroll with chart content
    if (this.chartContent && this.chartContent.nativeElement) {
      this.chartContent.nativeElement.scrollLeft = scrollLeft;
    }
    
    // Sync horizontal scroll with fixed bottom scrollbar
    if (this.fixedScrollbar && this.fixedScrollbar.nativeElement) {
      this.fixedScrollbar.nativeElement.scrollLeft = scrollLeft;
    }
    
    setTimeout(() => {
      this.isScrollingHeader = false;
    }, 10);
  }

  // Fixed bottom scrollbar handler
  onFixedScrollbarScroll(event: Event): void {
    if (this.isScrollingChart || this.isScrollingHeader) {
      return;
    }
    
    this.isScrollingFixedBar = true;
    const scrollbar = event.target as HTMLElement;
    const scrollLeft = scrollbar.scrollLeft;
    
    // Sync horizontal scroll with chart content
    if (this.chartContent && this.chartContent.nativeElement) {
      this.chartContent.nativeElement.scrollLeft = scrollLeft;
    }
    
    // Sync horizontal scroll with header
    if (this.headerScroll && this.headerScroll.nativeElement) {
      this.headerScroll.nativeElement.scrollLeft = scrollLeft;
    }
    
    setTimeout(() => {
      this.isScrollingFixedBar = false;
    }, 10);
  }

  // Scroll to center the timeline on today's date
  scrollToTodayCenter(): void {
    if (!this.chartContent || !this.chartContent.nativeElement) {
      return;
    }

    const todayPosition = this.getTodayPosition();
    const chartElement = this.chartContent.nativeElement;
    const chartVisibleWidth = chartElement.clientWidth;
    
    // Calculate scroll position to center today's line in the viewport
    const scrollLeft = todayPosition - (chartVisibleWidth / 2);
    
    // Apply the scroll position to both chart content and header
    chartElement.scrollLeft = Math.max(0, scrollLeft);
    
    if (this.headerScroll && this.headerScroll.nativeElement) {
      this.headerScroll.nativeElement.scrollLeft = Math.max(0, scrollLeft);
    }
  }

  // Event handlers
  onViewChanged(view: 'day' | 'month' | 'year') {
    this.currentView = view;
    this.prepareTimelineData();
    setTimeout(() => {
      this.updateDateHeaders();
      this.scrollToTodayCenter();
      this.cdr.detectChanges();
    }, 100);
  }

  onFilterToggled(event: { type: string; value: string; checked: boolean }) {
    const filterArray = (this.selectedFilters as any)[event.type] as string[];
    
    if (event.checked) {
      if (!filterArray.includes(event.value)) {
        filterArray.push(event.value);
      }
    } else {
      const index = filterArray.indexOf(event.value);
      if (index > -1) {
        filterArray.splice(index, 1);
      }
    }
    
    this.applyFilters();
  }

  onFiltersCleared() {
    this.selectedFilters = {
      epics: [],
      types: [],
      status: []
    };
    
    this.availableEpics = this.getUniqueEpics();
    this.applyFilters();
  }

  onBackToEpics() {
    this.displayMode = 'epics';
    this.selectedEpic = null;
    this.selectedFilters.epics = [];
    this.availableEpics = this.getUniqueEpics();
    this.prepareTimelineData();
  }

  // Display options handlers
  onDisplayRangeChanged(months: number) {
    this.displayRangeMonths = months;
    this.applyFilters();
  }

  onShowCompletedChanged(show: boolean) {
    this.showCompleted = show;
    this.applyFilters();
  }

  onExpandAllEpics() {
    // Expand all epic rows
    this.timelineRows.forEach(row => {
      if (row.type === 'epic') {
        this.expandedRows.add(row.id);
      }
    });
    this.prepareTimelineData();
    this.cdr.detectChanges();
  }

  onCollapseAllEpics() {
    // Collapse all epic rows (but keep sprints expanded)
    this.timelineRows.forEach(row => {
      if (row.type === 'epic') {
        this.expandedRows.delete(row.id);
      }
    });
    this.prepareTimelineData();
    this.cdr.detectChanges();
  }

  // Existing private methods
  private initializeFilters() {
    // No sprint filtering needed anymore
  }

  private getUniqueEpics(): string[] {
    const epicSet = new Set<string>();
    
    // Get epics from all sprints (no filtering)
    this.projectData.forEach(sprint => {
      if (sprint.issues && sprint.issues.length > 0) {
        sprint.issues.forEach((issue: Issue) => {
          if (issue.epicId) {
            const epic = this.epicsData.find(e => e.id === issue.epicId);
            if (epic) {
              epicSet.add(epic.name);
            }
          }
        });
      }
    });
    return Array.from(epicSet);
  }

  private groupIssuesByEpicId(issues: Issue[]): Record<string, Issue[]> {
    const groups: Record<string, Issue[]> = {};
    
    issues.forEach(issue => {
      if (issue.epicId) {
        if (!groups[issue.epicId]) {
          groups[issue.epicId] = [];
        }
        groups[issue.epicId].push(issue);
      }
    });
    
    return groups;
  }

  private calculateSprintProgress(sprint: Sprint): number {
    if (!sprint.issues || sprint.issues.length === 0) return 0;
    const doneIssues = sprint.issues.filter((i: Issue) => i.status === 'DONE').length;
    return Math.round((doneIssues / sprint.issues.length) * 100);
  }

  private calculateEpicProgress(issues: Issue[]): number {
    if (issues.length === 0) return 0;
    const doneIssues = issues.filter((i: Issue) => i.status === 'DONE').length;
    return Math.round((doneIssues / issues.length) * 100);
  }

  private getIssueProgress(issue: Issue): number {
    switch (issue.status) {
      case 'DONE': return 100;
      case 'IN_PROGRESS': 
      case 'IN_REVIEW': return 50;
      case 'TODO': return 0;
      default: return 0;
    }
  }

  private getEarliestDate(dates: Date[]): Date {
    return new Date(Math.min(...dates.map(d => new Date(d).getTime())));
  }

  private getLatestDate(dates: Date[]): Date {
    return new Date(Math.max(...dates.map(d => new Date(d).getTime())));
  }

  private applyFilters() {
    this.prepareTimelineData();
  }
}