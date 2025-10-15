import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineHeaderComponent, FilterState } from '../timeline-header/timeline-header';
import { sprints as sharedSprints, epics as sharedEpics } from '../../shared/data/dummy-backlog-data';
import { Issue } from '../../shared/models/issue.model';
import { Epic } from '../../shared/models/epic.model';

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
  type: 'sprint' | 'epic' | 'issue';
  name: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  progress?: number;
  issueType?: string;
  expanded?: boolean;
  level?: number;
  visible?: boolean;
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

@Component({
  selector: 'app-timeline-chart',
  standalone: true,
  imports: [CommonModule, TimelineHeaderComponent],
  templateUrl: './timeline-chart.html',
  styleUrls: ['./timeline-chart.css']
})
export class TimelineChart implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;
  @ViewChild('sidebarContent', { static: false }) sidebarContent!: ElementRef;
  @ViewChild('chartContent', { static: false }) chartContent!: ElementRef;
  @ViewChild('headerScroll', { static: false }) headerScroll!: ElementRef;
  
  currentView: 'day' | 'month' | 'year' = 'month';
  selectedFilters: FilterState = {
    sprints: [],
    epics: [],
    types: [],
    status: []
  };
  
  projectData: Sprint[] = sharedSprints;
  epicsData: Epic[] = sharedEpics;
  displayMode: 'epics' | 'issues' = 'epics';
  selectedEpic: string | null = null;
  availableSprints: string[] = [];
  availableEpics: string[] = [];

  // Timeline properties
  timelineRows: TimelineRow[] = [];
  monthHeaders: MonthHeader[] = [];
  weekHeaders: WeekHeader[] = [];
  dayHeaders: DayHeader[] = [];
  expandedRows: Set<string> = new Set();
  dateRange: { start: Date; end: Date } = { start: new Date(), end: new Date() };
  chartWidth: number = 0;
  
  // Display options
  showCompleted: boolean = true;
  displayRangeMonths: number = 12;
  
  // Scroll synchronization flags
  private isScrollingSidebar = false;
  private isScrollingChart = false;
  private isScrollingHeader = false;

  // Bar resize properties
  resizingBar: { id: string; side: 'left' | 'right'; startX: number; originalStart: Date; originalEnd: Date } | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.initializeFilters();
    this.setLatestSprintAsDefault();
    this.availableEpics = this.getUniqueEpics();
    
    // FIXED: Only expand sprints by default, NOT epics
    this.expandSprintsOnly();
    
    this.prepareTimelineData();
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
  }

  ngOnDestroy() {
    // Cleanup bar resize listeners
    document.removeEventListener('mousemove', this.onBarResizeMove.bind(this));
    document.removeEventListener('mouseup', this.onBarResizeEnd.bind(this));
  }

  // FIXED: Only expand sprints, keep epics collapsed by default
  private expandSprintsOnly(): void {
    const filteredSprints = this.getFilteredSprints();
    
    filteredSprints.forEach(sprint => {
      const sprintId = `sprint-${sprint.id}`;
      this.expandedRows.add(sprintId);
      // Do NOT expand epics by default
    });
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
      }
    } else {
      const newEnd = new Date(this.resizingBar.originalEnd);
      newEnd.setDate(newEnd.getDate() + deltaDays);
      
      // Ensure end doesn't go before start
      if (newEnd > row.startDate) {
        row.endDate = newEnd;
      }
    }
    
    this.cdr.detectChanges();
  }

  private onBarResizeEnd(event: MouseEvent): void {
    if (!this.resizingBar) return;
    this.resizingBar = null;
    this.cdr.detectChanges();
  }

  private getPixelsPerDay(): number {
    const totalDays = Math.ceil((this.dateRange.end.getTime() - this.dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    return this.chartWidth / totalDays;
  }

  // Dynamic timeline preparation
  private prepareTimelineData(): void {
    this.timelineRows = [];
    const filteredSprints = this.getFilteredSprints();

    // Calculate date range based on current view and filters
    this.calculateDynamicDateRange(filteredSprints);

    filteredSprints.forEach(sprint => {
      // Add sprint row
      this.timelineRows.push({
        id: `sprint-${sprint.id}`,
        type: 'sprint',
        name: sprint.name,
        status: sprint.status,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        progress: this.calculateSprintProgress(sprint),
        expanded: this.isRowExpanded(`sprint-${sprint.id}`),
        level: 0,
        visible: this.isItemInDateRange(sprint.startDate, sprint.endDate)
      });

      // Add epic rows if sprint is expanded
      if (this.isRowExpanded(`sprint-${sprint.id}`) && sprint.issues) {
        const epicGroups = this.groupIssuesByEpicId(sprint.issues);
        
        Object.entries(epicGroups).forEach(([epicId, issues]) => {
          const epic = this.epicsData.find(e => e.id === epicId);
          if (!epic) return;
          
          if (this.selectedFilters.epics.length > 0 && 
              !this.selectedFilters.epics.includes(epic.name)) {
            return;
          }

          const epicStart = this.getEarliestDate(issues.map(i => i.createdAt));
          const epicEnd = this.getLatestDate(issues.map(i => i.updatedAt));
          
          // Calculate epic progress
          const epicProgress = this.calculateEpicProgress(issues);
          
          // Filter completed epics based on display options
          // An epic is considered completed if it has 100% progress OR status is 'DONE'
          const isEpicCompleted = epicProgress === 100 || epic.status === 'DONE';
          if (!this.showCompleted && isEpicCompleted) {
            return;
          }
          
          // Filter epics by display range (only for completed epics)
          if (isEpicCompleted && !this.isEpicInDisplayRange(epic, epicEnd)) {
            return;
          }
          
          this.timelineRows.push({
            id: `epic-${epic.id}`,
            type: 'epic',
            name: epic.name,
            status: epic.status || 'TODO',
            startDate: epicStart,
            endDate: epicEnd,
            progress: epicProgress,
            expanded: this.isRowExpanded(`epic-${epic.id}`),
            level: 1,
            visible: this.isItemInDateRange(epicStart, epicEnd)
          });

          // Add issue rows if epic is expanded
          if (this.isRowExpanded(`epic-${epic.id}`)) {
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
                  level: 2,
                  visible: this.isItemInDateRange(issue.createdAt, issue.updatedAt)
                });
              }
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
    this.updateMonthHeaders();
    this.updateWeekHeaders();
    this.updateDayHeaders();
  }

  private calculateChartWidth(): void {
    const totalDays = Math.ceil((this.dateRange.end.getTime() - this.dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (this.currentView) {
      case 'day':
        this.chartWidth = Math.max(totalDays * 100, 3000);
        break;
      case 'month':
        this.chartWidth = Math.max(totalDays * 20, 2500);
        break;
      case 'year':
        this.chartWidth = Math.max(totalDays * 4, 2000);
        break;
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

  getTodayPosition(): number {
    return this.getDatePositionInPixels(new Date());
  }

  getChartWidth(): number {
    return this.chartWidth;
  }

  getHeaderHeight(): number {
    switch (this.currentView) {
      case 'day':
        return 96;
      case 'month':
        return 68;
      case 'year':
        return 40;
      default:
        return 68;
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
    if (this.isScrollingSidebar || this.isScrollingHeader) {
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
    
    setTimeout(() => {
      this.isScrollingChart = false;
    }, 10);
  }

  // FIXED: Add header scroll handler to sync with chart content
  onHeaderScroll(event: Event): void {
    if (this.isScrollingChart) {
      return;
    }
    
    this.isScrollingHeader = true;
    const header = event.target as HTMLElement;
    const scrollLeft = header.scrollLeft;
    
    // Sync horizontal scroll with chart content
    if (this.chartContent && this.chartContent.nativeElement) {
      this.chartContent.nativeElement.scrollLeft = scrollLeft;
    }
    
    setTimeout(() => {
      this.isScrollingHeader = false;
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
      this.cdr.detectChanges();
    }, 0);
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
    
    if (event.type === 'sprints') {
      this.availableEpics = this.getUniqueEpics();
      
      if (this.selectedFilters.epics.length > 0) {
        this.selectedFilters.epics = this.selectedFilters.epics.filter(epic => 
          this.availableEpics.includes(epic)
        );
      }
    }
    
    this.applyFilters();
  }

  onFiltersCleared() {
    this.selectedFilters = {
      sprints: [],
      epics: [],
      types: [],
      status: []
    };
    
    this.setLatestSprintAsDefault();
    this.expandSprintsOnly();
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
    this.availableSprints = this.projectData.map(s => s.name);
  }

  private getUniqueEpics(): string[] {
    const epicSet = new Set<string>();
    const filteredSprints = this.selectedFilters.sprints.length > 0 
      ? this.getFilteredSprints() 
      : this.projectData;
    
    filteredSprints.forEach(sprint => {
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

  private setLatestSprintAsDefault() {
    const activeSprint = this.projectData.find(s => s.status === 'ACTIVE');
    const latestSprint = activeSprint || this.projectData[this.projectData.length - 1];
    
    if (latestSprint) {
      this.selectedFilters.sprints = [latestSprint.name];
    }
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

  private getFilteredSprints(): Sprint[] {
    if (this.selectedFilters.sprints.length === 0) {
      return this.projectData;
    }
    return this.projectData.filter(s => 
      this.selectedFilters.sprints.includes(s.name)
    );
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