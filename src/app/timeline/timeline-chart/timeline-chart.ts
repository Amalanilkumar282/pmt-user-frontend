import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineHeaderComponent, FilterState } from '../timeline-header/timeline-header';
import { sprints as sharedSprints, epics as sharedEpics } from '../../shared/data/dummy-backlog-data';
import { Issue } from '../../shared/models/issue.model';
import { Epic } from '../../shared/models/epic.model';

declare var Gantt: any;

interface Sprint {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'COMPLETED' | 'ACTIVE' | 'PLANNED';
  issues?: Issue[];
}

interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  custom_class: string;
  dependencies?: string;
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
  @ViewChild('timelineHeader', { static: false }) timelineHeader!: ElementRef;
  
  ganttChart: any;
  currentView: 'day' | 'month' | 'year' = 'month';
  selectedFilters: FilterState = {
    sprints: [],
    epics: [],
    types: [],
    status: []
  };
  
  projectData: Sprint[] = sharedSprints;
  epicsData: Epic[] = sharedEpics;
  currentTasks: GanttTask[] = [];
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

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.initializeFilters();
    this.setLatestSprintAsDefault();
    this.availableEpics = this.getUniqueEpics();
    this.prepareTimelineData();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.updateDateHeaders();
    }, 100);
  }

  ngOnDestroy() {
    if (this.ganttChart) {
      this.ganttChart = null;
    }
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
          
          this.timelineRows.push({
            id: `epic-${epic.id}`,
            type: 'epic',
            name: epic.name,
            status: epic.status || 'TODO',
            startDate: epicStart,
            endDate: epicEnd,
            progress: this.calculateEpicProgress(issues),
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
      // Default range if no sprints
      const now = new Date();
      switch (this.currentView) {
        case 'day':
          this.dateRange.start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          this.dateRange.end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
          break;
        case 'month':
          this.dateRange.start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          this.dateRange.end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
          break;
        case 'year':
          this.dateRange.start = new Date(now.getFullYear(), 0, 1);
          this.dateRange.end = new Date(now.getFullYear(), 11, 31);
          break;
      }
      return;
    }

    const allDates: Date[] = [];
    
    // Include sprint dates
    sprints.forEach(sprint => {
      allDates.push(sprint.startDate);
      allDates.push(sprint.endDate);
    });

    // Include epic and issue dates for expanded rows
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

    // Apply view-based date range
    switch (this.currentView) {
      case 'day':
        // For day view, show 2 weeks centered around the data
        const dayRange = 14; // 2 weeks
        const dayCenter = new Date((earliestDate.getTime() + latestDate.getTime()) / 2);
        this.dateRange.start = new Date(dayCenter.getTime() - (dayRange / 2) * 24 * 60 * 60 * 1000);
        this.dateRange.end = new Date(dayCenter.getTime() + (dayRange / 2) * 24 * 60 * 60 * 1000);
        break;

      case 'month':
        // For month view, show 3 months centered around the data
        const monthRange = 3; // 3 months
        const monthCenter = new Date((earliestDate.getTime() + latestDate.getTime()) / 2);
        this.dateRange.start = new Date(monthCenter.getFullYear(), monthCenter.getMonth() - 1, 1);
        this.dateRange.end = new Date(monthCenter.getFullYear(), monthCenter.getMonth() + 2, 0);
        break;

      case 'year':
        // For year view, show the entire year of the data
        this.dateRange.start = new Date(earliestDate.getFullYear(), 0, 1);
        this.dateRange.end = new Date(earliestDate.getFullYear(), 11, 31);
        // If data spans multiple years, show the range
        if (earliestDate.getFullYear() !== latestDate.getFullYear()) {
          this.dateRange.end = new Date(latestDate.getFullYear(), 11, 31);
        }
        break;
    }
  }

  private isItemInDateRange(startDate: Date, endDate: Date): boolean {
    if (!startDate || !endDate) return true;
    
    const itemStart = startDate.getTime();
    const itemEnd = endDate.getTime();
    const rangeStart = this.dateRange.start.getTime();
    const rangeEnd = this.dateRange.end.getTime();

    // Item is visible if it overlaps with the current date range
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

  // Date header management
  private updateDateHeaders(): void {
    this.updateMonthHeaders();
    this.updateWeekHeaders();
    this.updateDayHeaders();
  }

  private updateMonthHeaders(): void {
    this.monthHeaders = [];
    if (!this.dateRange.start || !this.dateRange.end) return;
    
    const start = new Date(this.dateRange.start);
    const end = new Date(this.dateRange.end);
    
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    
    while (current <= end) {
      const monthName = current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const monthStart = new Date(Math.max(current.getTime(), start.getTime()));
      const monthEnd = new Date(Math.min(
        new Date(current.getFullYear(), current.getMonth() + 1, 0).getTime(),
        end.getTime()
      ));
      
      const left = this.getDatePosition(monthStart);
      const right = this.getDatePosition(monthEnd);
      const width = Math.max((right - left) * 100, 5);
      
      if (width > 3 && left < 100) {
        this.monthHeaders.push({
          name: monthName,
          left: left * 100,
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
    current.setDate(current.getDate() - current.getDay()); // Start from Sunday
    
    while (current < end) {
      const weekStart = new Date(Math.max(current.getTime(), start.getTime()));
      const weekEnd = new Date(Math.min(
        new Date(current.getFullYear(), current.getMonth(), current.getDate() + 6).getTime(),
        end.getTime()
      ));
      
      const left = this.getDatePosition(weekStart);
      const right = this.getDatePosition(weekEnd);
      const width = Math.max((right - left) * 100, 2);
      
      if (width > 1 && left < 100) {
        this.weekHeaders.push({
          name: `W${this.getWeekNumber(current)}`,
          left: left * 100,
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
      
      const left = this.getDatePosition(dayStart);
      const right = this.getDatePosition(dayEnd);
      const width = Math.max((right - left) * 100, 1);
      
      if (width > 0.5) {
        this.dayHeaders.push({
          name: current.getDate().toString(),
          left: left * 100,
          width: width,
          date: new Date(current)
        });
      }
      
      current.setDate(current.getDate() + 1);
    }
  }

  getWeekHeaders(): WeekHeader[] {
    return this.weekHeaders;
  }

  getDayHeaders(): DayHeader[] {
    return this.dayHeaders;
  }

  // Helper methods
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private getDatePosition(date: Date): number {
    if (!this.dateRange.start || !this.dateRange.end) return 0;
    const totalDuration = this.dateRange.end.getTime() - this.dateRange.start.getTime();
    const position = date.getTime() - this.dateRange.start.getTime();
    return totalDuration > 0 ? Math.max(0, Math.min(1, position / totalDuration)) : 0;
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

  getTypeIcon(issueType?: string): string {
    const iconMap: { [key: string]: string } = {
      'STORY': '📖',
      'TASK': '✓',
      'BUG': '🐛',
      'EPIC': '⚡'
    };
    return issueType ? iconMap[issueType] || '○' : '○';
  }

  getBarPosition(startDate?: Date): number {
    if (!startDate) return 0;
    return this.getDatePosition(startDate) * 100;
  }

  getBarWidth(startDate?: Date, endDate?: Date): number {
    if (!startDate || !endDate) return 0;
    const startPos = this.getDatePosition(startDate);
    const endPos = this.getDatePosition(endDate);
    return Math.max((endPos - startPos) * 100, 1);
  }

  getTodayPosition(): number {
    return this.getDatePosition(new Date()) * 100;
  }

  // Event handlers
  onViewChanged(view: 'day' | 'month' | 'year') {
    this.currentView = view;
    this.prepareTimelineData();
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