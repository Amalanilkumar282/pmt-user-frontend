import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { sprints as sharedSprints, epics as sharedEpics } from '../../shared/data/dummy-backlog-data';
import { Issue } from '../../shared/models/issue.model';
import { Epic } from '../../shared/models/epic.model';

declare var Gantt: any; // frappe-gantt library

// Sprint interface (matching the structure from dummy-backlog-data)
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

@Component({
  selector: 'app-timeline-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline-chart.html',
  styleUrls: ['./timeline-chart.css']
})
export class TimelineChart implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('ganttTarget', { static: false }) ganttEl!: ElementRef;
  
  ganttChart: any;
  currentView: 'day' | 'month' | 'year' = 'month';
  selectedFilters = {
    sprints: [] as string[],
    epics: [] as string[],
    types: [] as string[],
    status: [] as string[]
  };
  
  // Data from dummy-backlog-data
  projectData: Sprint[] = sharedSprints;
  epicsData: Epic[] = sharedEpics;
  currentTasks: GanttTask[] = [];
  displayMode: 'epics' | 'issues' = 'epics';
  selectedEpic: string | null = null;
  availableSprints: string[] = [];
  availableEpics: string[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Check if click is outside dropdown
    if (!target.closest('.relative')) {
      this.closeAllDropdowns();
    }
  }

  ngOnInit() {
    this.initializeFilters();
    this.setLatestSprintAsDefault();
  }

  ngAfterViewInit() {
    // Load frappe-gantt library
    this.loadGanttLibrary().then(() => {
      setTimeout(() => {
        this.initializeGantt();
      }, 100);
    });
  }

  ngOnDestroy() {
    if (this.ganttChart) {
      this.ganttChart = null;
    }
  }

  private loadGanttLibrary(): Promise<void> {
    return new Promise((resolve) => {
      // Check if already loaded
      if (typeof Gantt !== 'undefined') {
        resolve();
        return;
      }

      // Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/frappe-gantt/0.6.1/frappe-gantt.min.css';
      document.head.appendChild(link);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/frappe-gantt/0.6.1/frappe-gantt.min.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  private initializeFilters() {
    // Extract unique sprints and epics
    this.availableSprints = this.projectData.map(s => s.name);
    this.availableEpics = this.getUniqueEpics();
  }

  private getUniqueEpics(): string[] {
    const epicSet = new Set<string>();
    const filteredSprints = this.selectedFilters.sprints.length > 0 
      ? this.getFilteredSprints() 
      : this.projectData;
    
    filteredSprints.forEach(sprint => {
      if (sprint.issues && sprint.issues.length > 0) {
        sprint.issues.forEach((issue: Issue) => {
          // Get epic by epicId
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
    // Find the active or latest sprint
    const activeSprint = this.projectData.find(s => s.status === 'ACTIVE');
    const latestSprint = activeSprint || this.projectData[this.projectData.length - 1];
    
    if (latestSprint) {
      this.selectedFilters.sprints = [latestSprint.name];
      
      // Check the checkbox after a brief delay to ensure DOM is ready
      setTimeout(() => {
        const checkbox = document.getElementById(`sprint-${latestSprint.name}`) as HTMLInputElement;
        if (checkbox) {
          checkbox.checked = true;
        }
      }, 100);
    }
  }

  private initializeGantt() {
    if (!this.ganttEl || !this.ganttEl.nativeElement) {
      console.error('Gantt element not found');
      return;
    }

    // Clear previous chart
    this.ganttEl.nativeElement.innerHTML = '';

    // Prepare tasks based on current mode
    this.prepareTasksData();

    if (this.currentTasks.length === 0) {
      this.ganttEl.nativeElement.innerHTML = '<div class="no-data">No data to display</div>';
      this.ganttChart = null;
      return;
    }

    // Create new gantt instance
    this.ganttChart = new Gantt(this.ganttEl.nativeElement, this.currentTasks, {
      view_mode: this.getViewMode(),
      date_format: 'YYYY-MM-DD',
      header_height: 50,
      column_width: 30,
      step: 24,
      bar_height: 30,
      bar_corner_radius: 3,
      arrow_curve: 5,
      padding: 18,
      view_modes: ['Day', 'Week', 'Month', 'Year'],
      popup_trigger: 'click',
      custom_popup_html: (task: any) => {
        return `
          <div class="gantt-popup">
            <h5>${task.name}</h5>
            <p>Start: ${task.start}</p>
            <p>End: ${task.end}</p>
            <p>Progress: ${task.progress}%</p>
          </div>
        `;
      },
      on_click: (task: any) => {
        if (this.displayMode === 'epics' && task.id.startsWith('epic-')) {
          const epicId = task.id.replace('epic-', '');
          const epic = this.epicsData.find(e => e.id === epicId);
          if (epic) {
            this.drillDownToIssues(epic.name);
          }
        }
      },
      on_date_change: (task: any, start: Date, end: Date) => {
        console.log('Task date changed:', task, start, end);
      },
      on_progress_change: (task: any, progress: number) => {
        console.log('Task progress changed:', task, progress);
      }
    });

    // Scroll to current date after chart is rendered
    setTimeout(() => {
      this.scrollToCurrentDate();
    }, 500);
  }

  private prepareTasksData() {
    const tasks: GanttTask[] = [];
    
    if (this.displayMode === 'epics') {
      // Get filtered sprints
      const filteredSprints = this.getFilteredSprints();
      
      filteredSprints.forEach(sprint => {
        // Add sprint row first
        tasks.push({
          id: `sprint-${sprint.id}`,
          name: `📅 ${sprint.name}`,
          start: this.formatDate(sprint.startDate),
          end: this.formatDate(sprint.endDate),
          progress: this.calculateSprintProgress(sprint),
          custom_class: 'bar-sprint'
        });

        // Only process epics if sprint has issues
        if (!sprint.issues || sprint.issues.length === 0) {
          return;
        }

        // Group issues by epicId
        const epicGroups = this.groupIssuesByEpicId(sprint.issues);
        
        Object.entries(epicGroups).forEach(([epicId, issues]) => {
          const epic = this.epicsData.find(e => e.id === epicId);
          if (!epic) return;
          
          // Apply epic filter if active
          if (this.selectedFilters.epics.length > 0 && 
              !this.selectedFilters.epics.includes(epic.name)) {
            return;
          }

          const epicStart = this.getEarliestDate(issues.map(i => i.createdAt));
          const epicEnd = this.getLatestDate(issues.map(i => i.updatedAt));
          
          tasks.push({
            id: `epic-${epic.id}`,
            name: `📦 ${epic.name}`,
            start: this.formatDate(epicStart),
            end: this.formatDate(epicEnd),
            progress: this.calculateEpicProgress(issues),
            custom_class: 'bar-epic'
          });
        });
      });
    } else if (this.displayMode === 'issues') {
      const allFiltersCleared = this.areAllFiltersCleared();
      
      if (allFiltersCleared) {
        // Show all issues from all sprints when filters are cleared
        this.projectData.forEach(sprint => {
          if (!sprint.issues || sprint.issues.length === 0) {
            return;
          }
          
          sprint.issues.forEach(issue => {
            tasks.push({
              id: issue.id,
              name: `${issue.id} - ${issue.title}`,
              start: this.formatDate(issue.createdAt),
              end: this.formatDate(issue.updatedAt),
              progress: this.getIssueProgress(issue),
              custom_class: this.getIssueClass(issue)
            });
          });
        });
      } else {
        // Show only issues from selected sprints and epics with type/status filters
        const filteredSprints = this.getFilteredSprints();
        
        filteredSprints.forEach(sprint => {
          if (!sprint.issues || sprint.issues.length === 0) {
            return;
          }
          
          sprint.issues.forEach(issue => {
            // Apply epic filter if active
            if (this.selectedFilters.epics.length > 0 && issue.epicId) {
              const epic = this.epicsData.find(e => e.id === issue.epicId);
              if (!epic || !this.selectedFilters.epics.includes(epic.name)) {
                return;
              }
            } else if (this.selectedFilters.epics.length > 0 && !issue.epicId) {
              // Skip issues without epicId if epic filter is active
              return;
            }
            
            // Apply type filter
            if (this.selectedFilters.types.length > 0 && 
                !this.selectedFilters.types.includes(issue.type.toLowerCase())) {
              return;
            }
            
            // Apply status filter
            if (this.selectedFilters.status.length > 0) {
              const statusMap: Record<string, string> = {
                'TODO': 'todo',
                'IN_PROGRESS': 'progress',
                'IN_REVIEW': 'progress',
                'DONE': 'done'
              };
              const mappedStatus = statusMap[issue.status] || 'todo';
              if (!this.selectedFilters.status.includes(mappedStatus)) {
                return;
              }
            }
            
            tasks.push({
              id: issue.id,
              name: `${issue.id} - ${issue.title}`,
              start: this.formatDate(issue.createdAt),
              end: this.formatDate(issue.updatedAt),
              progress: this.getIssueProgress(issue),
              custom_class: this.getIssueClass(issue)
            });
          });
        });
      }
    }

    this.currentTasks = tasks;
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

  private areAllFiltersCleared(): boolean {
    return this.selectedFilters.sprints.length === 0 &&
           this.selectedFilters.epics.length === 0 &&
           this.selectedFilters.types.length === 0 &&
           this.selectedFilters.status.length === 0;
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

  private getIssueClass(issue: Issue): string {
    return `bar-${issue.type.toLowerCase()}`;
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getEarliestDate(dates: Date[]): Date {
    return new Date(Math.min(...dates.map(d => new Date(d).getTime())));
  }

  private getLatestDate(dates: Date[]): Date {
    return new Date(Math.max(...dates.map(d => new Date(d).getTime())));
  }

  private getViewMode(): string {
    switch (this.currentView) {
      case 'day': return 'Day';
      case 'month': return 'Month';
      case 'year': return 'Year';
      default: return 'Month';
    }
  }

  changeTimeScale(scale: 'day' | 'month' | 'year') {
    this.currentView = scale;
    if (this.ganttChart) {
      this.ganttChart.change_view_mode(this.getViewMode());
      setTimeout(() => {
        this.scrollToCurrentDate();
      }, 500);
    }
  }

  private scrollToCurrentDate() {
    try {
      const container = this.ganttEl.nativeElement;
      const today = new Date();
      
      const ganttSvg = container.querySelector('svg');
      if (!ganttSvg) {
        console.log('Gantt SVG not found yet');
        return;
      }

      const gridHeaders = ganttSvg.querySelectorAll('.grid-header');
      if (gridHeaders.length === 0) {
        console.log('No grid headers found');
        return;
      }

      let targetHeader: Element | null = null;
      const todayStr = today.toISOString().split('T')[0];
      
      gridHeaders.forEach((header: Element) => {
        const textElement = header.querySelector('text');
        if (textElement) {
          const headerText = textElement.textContent;
          if (headerText && this.isDateMatch(headerText, today)) {
            targetHeader = header;
          }
        }
      });

      if (targetHeader) {
        const headerElement = targetHeader as HTMLElement;
        const headerRect = headerElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const scrollLeft = headerRect.left - containerRect.left + container.scrollLeft - (container.clientWidth / 2) + (headerRect.width / 2);
        
        container.scrollLeft = Math.max(0, scrollLeft);
      } else {
        console.log('Today header not found, using fallback scroll');
        container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
      }
    } catch (error) {
      console.log('Could not scroll to current date:', error);
      const container = this.ganttEl.nativeElement;
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
    }
  }

  private isDateMatch(headerText: string, targetDate: Date): boolean {
    const targetStr = targetDate.toISOString().split('T')[0];
    const targetDay = targetDate.getDate().toString();
    const targetMonth = (targetDate.getMonth() + 1).toString();
    const targetYear = targetDate.getFullYear().toString();
    
    return headerText.includes(targetDay) || 
           headerText.includes(targetMonth) || 
           headerText.includes(targetYear) ||
           headerText.includes(targetStr);
  }

  toggleFilter(type: string, value: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const filterArray = (this.selectedFilters as any)[type] as string[];
    
    if (checkbox.checked) {
      if (!filterArray.includes(value)) {
        filterArray.push(value);
      }
    } else {
      const index = filterArray.indexOf(value);
      if (index > -1) {
        filterArray.splice(index, 1);
      }
    }
    
    // Update available epics when sprint filter changes
    if (type === 'sprints') {
      this.availableEpics = this.getUniqueEpics();
      
      // Clear epic filter if selected epics are no longer available
      if (this.selectedFilters.epics.length > 0) {
        this.selectedFilters.epics = this.selectedFilters.epics.filter(epic => 
          this.availableEpics.includes(epic)
        );
        
        // Update epic checkboxes
        setTimeout(() => {
          const epicCheckboxes = document.querySelectorAll('.filter-dropdown input[id^="epic-"]');
          epicCheckboxes.forEach(cb => {
            const epicCheckbox = cb as HTMLInputElement;
            const epicValue = epicCheckbox.value;
            epicCheckbox.checked = this.selectedFilters.epics.includes(epicValue);
          });
        }, 0);
      }
    }
    
    this.applyFilters();
  }

  applyFilters() {
    this.initializeGantt();
  }

  clearFilters() {
    this.selectedFilters = {
      sprints: [],
      epics: [],
      types: [],
      status: []
    };
    
    const checkboxes = document.querySelectorAll('.filter-dropdown input[type="checkbox"]');
    checkboxes.forEach(cb => {
      (cb as HTMLInputElement).checked = false;
    });
    
    // Update available epics
    this.availableEpics = this.getUniqueEpics();
    
    // Only reset to default sprint if in epics view
    if (this.displayMode === 'epics') {
      this.setLatestSprintAsDefault();
    } else {
      // In issues view, apply filters to show all
      this.applyFilters();
    }
  }

  drillDownToIssues(epicName: string) {
    console.log('Drilling down to epic:', epicName);
    
    this.selectedEpic = epicName;
    this.selectedFilters.epics = [epicName];
    this.displayMode = 'issues';
    
    this.cdr.detectChanges();
    
    setTimeout(() => {
      const epicCheckbox = document.getElementById(`epic-${epicName}`) as HTMLInputElement;
      if (epicCheckbox) {
        epicCheckbox.checked = true;
      }
      console.log('Calling initializeGantt for issues view');
      this.initializeGantt();
    }, 0);
  }

  backToEpics() {
    this.displayMode = 'epics';
    this.selectedEpic = null;
    this.selectedFilters.epics = [];
    
    const epicCheckboxes = document.querySelectorAll('.filter-dropdown input[id^="epic-"]');
    epicCheckboxes.forEach(cb => {
      (cb as HTMLInputElement).checked = false;
    });
    
    // Update available epics based on selected sprints
    this.availableEpics = this.getUniqueEpics();
    
    this.cdr.detectChanges();
    this.initializeGantt();
  }

  getFilterCount(type: string): number {
    return (this.selectedFilters as any)[type].length;
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    const dropdown = button.nextElementSibling as HTMLElement;
    
    // Close all other dropdowns
    document.querySelectorAll('.filter-dropdown').forEach(dd => {
      if (dd !== dropdown) {
        dd.classList.remove('show');
      }
    });
    
    dropdown.classList.toggle('show');
  }

  private closeAllDropdowns() {
    document.querySelectorAll('.filter-dropdown').forEach(dd => {
      dd.classList.remove('show');
    });
  }
}