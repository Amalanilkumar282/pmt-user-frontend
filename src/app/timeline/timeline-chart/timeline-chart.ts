import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineHeaderComponent, FilterState } from '../timeline-header/timeline-header';
import { sprints as sharedSprints, epics as sharedEpics } from '../../shared/data/dummy-backlog-data';
import { Issue } from '../../shared/models/issue.model';
import { Epic } from '../../shared/models/epic.model';
import { EpicDetailedView } from '../../epic/epic-detailed-view/epic-detailed-view';
import { IssueDetailedView } from '../../backlog/issue-detailed-view/issue-detailed-view';
import * as gantt from 'dhtmlx-gantt';

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
  imports: [CommonModule, TimelineHeaderComponent, EpicDetailedView, IssueDetailedView],
  templateUrl: './timeline-chart.html',
  styleUrls: ['./timeline-chart.css']
})
export class TimelineChart implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;
  @ViewChild('sidebarContent', { static: false }) sidebarContent!: ElementRef;
  @ViewChild('ganttContainer', { static: false }) ganttContainer!: ElementRef;
  
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
  
  // Modal state for epic and issue details
  selectedEpicForModal: Epic | null = null;
  selectedIssueForModal: Issue | null = null;
  isEpicModalOpen: boolean = false;
  isIssueModalOpen: boolean = false;
  
  // Scroll synchronization flags
  private isScrollingSidebar = false;
  private isScrollingGantt = false;
  
  // Debounce timer for Gantt updates
  private ganttUpdateTimer: any = null;

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
    // Use microtask queue to defer Gantt initialization without blocking parent rendering
    // This ensures navbar/sidebar render first without a noticeable delay
    Promise.resolve().then(() => {
      setTimeout(() => {
        if (this.ganttContainer && this.ganttContainer.nativeElement) {
          try {
            this.initializeGantt();
          } catch (error) {
            console.error('Failed to initialize Gantt:', error);
          }
          this.cdr.detectChanges();
        }
      }, 100); // Minimal delay just to ensure sidebar effect completes
    });
  }

  ngOnDestroy() {
    if (gantt.gantt) {
      gantt.gantt.clearAll();
    }
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

  // Initialize DHTMLX Gantt
  private initializeGantt(): void {
    if (!this.ganttContainer || !this.ganttContainer.nativeElement) {
      return;
    }

    // Configure Gantt BEFORE init
    gantt.gantt.config['date_format'] = '%Y-%m-%d %H:%i';
    gantt.gantt.config['xml_date'] = '%Y-%m-%d %H:%i';
    
    // Enable smart rendering for better performance with many tasks
    gantt.gantt.config['smart_rendering'] = true;
    gantt.gantt.config['static_background'] = true;
    
    // Fix snapping issue - disable rounding to allow precise positioning
    gantt.gantt.config['round_dnd_dates'] = false;
    gantt.gantt.config['duration_unit'] = 'day';
    gantt.gantt.config['duration_step'] = 1;
    
    // Enable drag and drop
    gantt.gantt.config['drag_move'] = true;
    gantt.gantt.config['drag_progress'] = false;
    gantt.gantt.config['drag_resize'] = true;
    
    // Enable double-click to enable dragging
    gantt.gantt.config['details_on_dblclick'] = false;
    
    // Hide the left grid (we're using our custom left panel)
    gantt.gantt.config['show_grid'] = false;
    
    // Set row height to match our left panel
    gantt.gantt.config['row_height'] = 48;
    gantt.gantt.config['bar_height'] = 28;
    
    // Configure appearance
    gantt.gantt.config['readonly'] = false;
    gantt.gantt.config['show_errors'] = false;
    
    // Enable "Today" marker
    gantt.gantt.config['show_markers'] = true;
    
    // Fit all tasks into view
    gantt.gantt.config['fit_tasks'] = false;
    
    // Enable tooltip and marker plugins
    gantt.gantt.plugins({
      tooltip: true,
      marker: true
    });
    
    // Configure tooltip template to show start and end dates
    gantt.gantt.templates.tooltip_text = (start: Date, end: Date, task: any) => {
      const formatDate = (date: Date) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
      };
      
      return `<b>${task.text}</b><br/>` +
             `<b>Start:</b> ${formatDate(start)}<br/>` +
             `<b>End:</b> ${formatDate(end)}`;
    };

    // Only show task name inside the bar, no percentage
    gantt.gantt.templates.task_text = (start: Date, end: Date, task: any) => {
      return task.text;
    };
    
    // Set scale based on current view (simplified - single level)
    this.updateGanttScale();
    
    // Set explicit date range for the chart
    gantt.gantt.config.start_date = this.dateRange.start;
    gantt.gantt.config.end_date = this.dateRange.end;
    
    // Initialize gantt
    gantt.gantt.init(this.ganttContainer.nativeElement);
    
    // Load data AFTER init
    this.loadGanttData();
    
    // Sync scroll with sidebar
    this.setupGanttScrollSync();
    
    // Handle task updates
    gantt.gantt.attachEvent('onAfterTaskDrag', (id: any, mode: any) => {
      this.onTaskUpdated(id);
      return true;
    });
    
    gantt.gantt.attachEvent('onTaskDblClick', (id: any) => {
      const task = gantt.gantt.getTask(id);
      if (task['type'] === 'epic') {
        this.onEpicClickById(task['originalId']);
      } else if (task['type'] === 'issue') {
        this.onIssueClickById(task['originalId']);
      }
      return false; // Prevent default behavior
    });
  }

  private updateGanttScale(): void {
    // Use the new scales configuration API instead of obsolete scale_unit/subscales
    switch (this.currentView) {
      case 'day':
        // Day view: Show Month as main header, Day as sub-header
        gantt.gantt.config['scales'] = [
          { unit: 'month', step: 1, format: '%M %Y' },
          { unit: 'day', step: 1, format: '%d' }
        ];
        gantt.gantt.config['scale_height'] = 60;
        break;
      case 'month':
        // Month view: Show only Month (no subscales)
        gantt.gantt.config['scales'] = [
          { unit: 'month', step: 1, format: '%M %Y' }
        ];
        gantt.gantt.config['scale_height'] = 60;
        break;
      case 'year':
        // Year view: Show only Year (no subscales)
        gantt.gantt.config['scales'] = [
          { unit: 'year', step: 1, format: '%Y' }
        ];
        gantt.gantt.config['scale_height'] = 60;
        break;
    }
  }

  private loadGanttData(): void {
    try {
      const tasks: any[] = [];
      let taskId = 1;

      this.timelineRows.forEach(row => {
        if (row.visible === false) return;
        
        if (row.startDate && row.endDate) {
          // Use Date objects directly instead of formatted strings
          const task: any = {
            id: taskId++,
            text: row.name,
            start_date: new Date(row.startDate),
            end_date: new Date(row.endDate),
            type: row.type,
            originalId: row.id
          };

          // Set colors based on type
          if (row.type === 'sprint') {
            task.color = '#3b82f6';
          } else if (row.type === 'epic') {
            task.color = '#a855f7';
          } else if (row.type === 'issue') {
            task.color = '#10b981';
          }

          tasks.push(task);
        }
      });

      gantt.gantt.clearAll();
      if (tasks.length > 0) {
        gantt.gantt.parse({ data: tasks });
      }
      this.drawTodayMarker();
    } catch (error) {
      console.error('Error loading Gantt data:', error);
      // Don't crash the component - just skip Gantt rendering
    }
  }

  private drawTodayMarker(): void {
    const today = new Date();
    gantt.gantt.addMarker({
        start_date: today,
        css: "today-marker",
        text: "Today",
        title: "Today: " + today.toDateString()
    });
  }

  private updateGanttData(): void {
    try {
      // More efficient update - only rebuild visible tasks without full reload
      const tasks: any[] = [];
      let taskId = 1;

      this.timelineRows.forEach(row => {
        if (row.visible === false) return;
        
        if (row.startDate && row.endDate) {
          const task: any = {
            id: taskId++,
            text: row.name,
            start_date: new Date(row.startDate),
            end_date: new Date(row.endDate),
            type: row.type,
            originalId: row.id
          };

          if (row.type === 'sprint') {
            task.color = '#3b82f6';
          } else if (row.type === 'epic') {
            task.color = '#a855f7';
          } else if (row.type === 'issue') {
            task.color = '#10b981';
          }

          tasks.push(task);
        }
      });

      // Clear and parse without full re-initialization
      gantt.gantt.clearAll();
      if (tasks.length > 0) {
        gantt.gantt.parse({ data: tasks });
      }
      this.drawTodayMarker();
    } catch (error) {
      console.error('Error updating Gantt data:', error);
    }
  }

  private formatDateForGantt(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} 00:00`;
  }

  private setupGanttScrollSync(): void {
    const ganttElement = this.ganttContainer.nativeElement;
    const taskArea = ganttElement.querySelector('.gantt_task');
    const dataArea = ganttElement.querySelector('.gantt_data_area');
    
    if (dataArea && this.sidebarContent && this.sidebarContent.nativeElement) {
      // Use passive listener for better scroll performance
      dataArea.addEventListener('scroll', (event: any) => {
        if (this.sidebarContent && this.sidebarContent.nativeElement) {
          // Prevent circular updates
          if (!this.isScrollingSidebar) {
            this.isScrollingGantt = true;
            // Use requestAnimationFrame for smoother scrolling
            requestAnimationFrame(() => {
              if (this.sidebarContent && this.sidebarContent.nativeElement) {
                this.sidebarContent.nativeElement.scrollTop = event.target.scrollTop;
              }
            });
            setTimeout(() => {
              this.isScrollingGantt = false;
            }, 50);
          }
        }
      }, { passive: true });
    }
  }

  // Sidebar scroll sync - optimized with requestAnimationFrame
  onSidebarScroll(event: Event): void {
    const sidebar = event.target as HTMLElement;
    const scrollTop = sidebar.scrollTop;
    
    const ganttElement = this.ganttContainer?.nativeElement;
    const dataArea = ganttElement?.querySelector('.gantt_data_area');
    
    if (dataArea && !this.isScrollingGantt) {
      this.isScrollingSidebar = true;
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        if (dataArea) {
          dataArea.scrollTop = scrollTop;
        }
      });
      setTimeout(() => {
        this.isScrollingSidebar = false;
      }, 50);
    }
  }

  private onTaskUpdated(taskId: any): void {
    const task = gantt.gantt.getTask(taskId);
    const row = this.timelineRows.find(r => r.id === task['originalId']);
    
    if (row && task['start_date'] && task['end_date']) {
      row.startDate = new Date(task['start_date']);
      row.endDate = new Date(task['end_date']);
      this.cdr.detectChanges();
    }
  }

  private onEpicClickById(epicId: string): void {
    const epic = this.epicsData.find(e => e.id === epicId);
    if (epic) {
      this.selectedEpicForModal = { ...epic };
      this.isEpicModalOpen = true;
      this.cdr.detectChanges();
    }
  }

  private onIssueClickById(issueId: string): void {
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
      this.cdr.detectChanges();
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
            id: epic.id,  // Epic ID already has 'epic-' prefix (e.g., 'epic-1')
            type: 'epic',
            name: epic.name,
            status: epic.status || 'TODO',
            startDate: epicStart,
            endDate: epicEnd,
            progress: epicProgress,
            expanded: this.isRowExpanded(epic.id),
            level: 1,
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
                  level: 2,
                  visible: this.isItemInDateRange(issue.createdAt, issue.updatedAt)
                });
              }
            });
          }
        });
      }
    });

    this.cdr.detectChanges();
    
    // Refresh Gantt chart with new data - only if Gantt is already initialized
    // Use debouncing to prevent multiple rapid updates
    if (this.ganttContainer && this.ganttContainer.nativeElement && gantt.gantt.$root) {
      if (this.ganttUpdateTimer) {
        clearTimeout(this.ganttUpdateTimer);
      }
      
      this.ganttUpdateTimer = setTimeout(() => {
        try {
          this.updateGanttData();
        } catch (error) {
          console.error('Error refreshing Gantt:', error);
        }
      }, 150); // Debounce by 150ms
    }
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

  // Get dynamic container height based on visible rows
  getContainerHeight(): number {
    const visibleRows = this.getVisibleRowCount();
    const baseHeight = 400;
    const maxHeight = 700;
    
    let calculatedHeight = (visibleRows * 48) + 50;
    
    return Math.max(baseHeight, Math.min(calculatedHeight, maxHeight));
  }

  // Get count of visible rows
  getVisibleRowCount(): number {
    return this.timelineRows.filter(row => row.visible !== false).length;
  }

  // Event handlers
  onViewChanged(view: 'day' | 'month' | 'year') {
    this.currentView = view;
    this.updateGanttScale();
    if (gantt.gantt) {
      gantt.gantt.render();
    }
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

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'STORY': 'fa-solid fa-book',
      'TASK': 'fa-solid fa-check-circle',
      'BUG': 'fa-solid fa-bug',
      'EPIC': 'fa-solid fa-bolt'
    };
    return icons[type] || 'fa-solid fa-file';
  }
}