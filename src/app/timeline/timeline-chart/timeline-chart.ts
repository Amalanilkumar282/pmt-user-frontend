import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var Gantt: any; // frappe-gantt library

interface Issue {
  id: string;
  key: string;
  text: string;
  type: 'story' | 'task' | 'bug';
  status: 'todo' | 'progress' | 'done';
  start: string;
  end: string;
  epicId?: string;
  assignee?: string;
  priority?: string;
}

interface Epic {
  id: string;
  key: string;
  text: string;
  start: string;
  end: string;
  sprintId?: string;
  color?: string;
  issues: Issue[];
}

interface Sprint {
  id: string;
  text: string;
  start: string;
  end: string;
  epics: Epic[];
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
  
  // Sample data - replace with database later
  projectData: Sprint[] = [
    {
      id: 'sprint-3',
      text: 'Sprint 3',
      start: '2025-09-01',
      end: '2025-09-14',
      epics: [
        {
          id: 'epic-1',
          key: 'EPIC-1',
          text: 'Implement Login Page',
          start: '2025-09-01',
          end: '2025-09-07',
          sprintId: 'sprint-3',
          color: '#7e57c2',
          issues: [
            {
              id: 'issue-1',
              key: 'DEV-1',
              text: 'Frontend Login Page',
              type: 'story',
              status: 'done',
              start: '2025-09-01',
              end: '2025-09-03',
              epicId: 'epic-1'
            },
            {
              id: 'issue-2',
              key: 'DEV-2',
              text: 'Backend Auth Logic',
              type: 'task',
              status: 'progress',
              start: '2025-09-03',
              end: '2025-09-05',
              epicId: 'epic-1'
            }
          ]
        },
        {
          id: 'epic-2',
          key: 'EPIC-2',
          text: 'Deploy to Staging',
          start: '2025-09-08',
          end: '2025-09-14',
          sprintId: 'sprint-3',
          color: '#42a5f5',
          issues: [
            {
              id: 'issue-3',
              key: 'OPS-1',
              text: 'Setup CI/CD',
              type: 'task',
              status: 'todo',
              start: '2025-09-08',
              end: '2025-09-10',
              epicId: 'epic-2'
            }
          ]
        }
      ]
    },
    {
      id: 'sprint-4',
      text: 'Sprint 4',
      start: '2025-09-15',
      end: '2025-09-28',
      epics: [
        {
          id: 'epic-3',
          key: 'EPIC-3',
          text: 'Epic Sharath',
          start: '2025-09-15',
          end: '2025-09-25',
          sprintId: 'sprint-4',
          color: '#66bb6a',
          issues: [
            {
              id: 'issue-4',
              key: 'UI-1',
              text: 'UI_limit',
              type: 'story',
              status: 'todo',
              start: '2025-09-15',
              end: '2025-09-20',
              epicId: 'epic-3'
            },
            {
              id: 'issue-5',
              key: 'BUG-1',
              text: 'Fix Navigation Bug',
              type: 'bug',
              status: 'todo',
              start: '2025-09-20',
              end: '2025-09-22',
              epicId: 'epic-3'
            }
          ]
        }
      ]
    }
  ];

  currentTasks: any[] = [];
  displayMode: 'epics' | 'issues' = 'epics';
  selectedEpic: Epic | null = null;
  selectedEpics: Epic[] = []; // Changed to array to support multiple epics
  availableSprints: string[] = [];
  availableEpics: string[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.initializeFilters();
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
    this.availableSprints = this.projectData.map(s => s.text);
    this.availableEpics = [];
    this.projectData.forEach(sprint => {
      sprint.epics.forEach(epic => {
        this.availableEpics.push(epic.text);
      });
    });
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
      // Clear the gantt chart reference
      this.ganttChart = null;
      return;
    }

    // Create new gantt instance
    this.ganttChart = new Gantt(this.ganttEl.nativeElement, this.currentTasks, {
      view_mode: this.getViewMode(),
      date_format: 'YYYY-MM-DD',
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
        if (this.displayMode === 'epics') {
          this.drillDownToIssues(task.id);
        }
      },
      on_date_change: (task: any, start: Date, end: Date) => {
        console.log('Task date changed:', task, start, end);
        // Handle date change - update your data model
      },
      on_progress_change: (task: any, progress: number) => {
        console.log('Task progress changed:', task, progress);
        // Handle progress change
      }
    });
  }

  private prepareTasksData() {
    const tasks: any[] = [];
    
    if (this.displayMode === 'epics') {
      // Show epics with sprint filter
      this.projectData.forEach(sprint => {
        // Check sprint filter first
        if (this.selectedFilters.sprints.length > 0 && 
            !this.selectedFilters.sprints.includes(sprint.text)) {
          return; // Skip this sprint
        }
        
        const filteredEpics = this.filterEpics(sprint.epics);
        filteredEpics.forEach(epic => {
          tasks.push({
            id: epic.id,
            name: `${epic.key} - ${epic.text}`,
            start: epic.start,
            end: epic.end,
            progress: this.calculateEpicProgress(epic),
            custom_class: this.getEpicClass(epic)
          });
        });
      });
    } else if (this.displayMode === 'issues') {
      // Show issues from selected epics or all epics based on filter
      const epicsToShow: Epic[] = [];
      
      this.projectData.forEach(sprint => {
        // Check sprint filter
        if (this.selectedFilters.sprints.length > 0 && 
            !this.selectedFilters.sprints.includes(sprint.text)) {
          return;
        }
        
        sprint.epics.forEach(epic => {
          // If epic filter is active, only show issues from filtered epics
          if (this.selectedFilters.epics.length > 0) {
            if (this.selectedFilters.epics.includes(epic.text)) {
              epicsToShow.push(epic);
            }
          } else {
            // No epic filter, show all epics
            epicsToShow.push(epic);
          }
        });
      });
      
      // Collect all issues from selected epics
      epicsToShow.forEach(epic => {
        const filteredIssues = this.filterIssues(epic.issues);
        filteredIssues.forEach(issue => {
          tasks.push({
            id: issue.id,
            name: `${issue.key} - ${issue.text} [${epic.key}]`, // Added epic reference
            start: issue.start,
            end: issue.end,
            progress: this.getIssueProgress(issue),
            custom_class: this.getIssueClass(issue),
            epicName: epic.text // Store epic name for reference
          });
        });
      });
    }

    this.currentTasks = tasks;
  }

  private filterEpics(epics: Epic[]): Epic[] {
    return epics.filter(epic => {
      let pass = true;
      
      if (this.selectedFilters.epics.length > 0) {
        pass = pass && this.selectedFilters.epics.includes(epic.text);
      }
      
      // Note: Sprint filtering would need to be handled at a higher level
      // since epics don't have direct sprint reference in the filter
      
      return pass;
    });
  }

  private filterIssues(issues: Issue[]): Issue[] {
    return issues.filter(issue => {
      let pass = true;
      
      if (this.selectedFilters.types.length > 0) {
        pass = pass && this.selectedFilters.types.includes(issue.type);
      }
      
      if (this.selectedFilters.status.length > 0) {
        pass = pass && this.selectedFilters.status.includes(issue.status);
      }
      
      return pass;
    });
  }

  private calculateEpicProgress(epic: Epic): number {
    if (epic.issues.length === 0) return 0;
    const doneIssues = epic.issues.filter(i => i.status === 'done').length;
    return Math.round((doneIssues / epic.issues.length) * 100);
  }

  private getIssueProgress(issue: Issue): number {
    switch (issue.status) {
      case 'done': return 100;
      case 'progress': return 50;
      case 'todo': return 0;
      default: return 0;
    }
  }

  private getEpicClass(epic: Epic): string {
    return 'bar-epic';
  }

  private getIssueClass(issue: Issue): string {
    return `bar-${issue.type}`;
  }

  private getViewMode(): string {
    switch (this.currentView) {
      case 'day': return 'Day';
      case 'month': return 'Month';
      case 'year': return 'Year';
      default: return 'Month';
    }
  }

  // Public methods for template
  changeTimeScale(scale: 'day' | 'month' | 'year') {
    this.currentView = scale;
    if (this.ganttChart) {
      this.ganttChart.change_view_mode(this.getViewMode());
    }
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
    
    // Apply filters immediately
    this.applyFilters();
  }

  applyFilters() {
    // Reinitialize the gantt chart with new filters
    this.initializeGantt();
  }

  clearFilters() {
    this.selectedFilters = {
      sprints: [],
      epics: [],
      types: [],
      status: []
    };
    
    // Uncheck all checkboxes
    const checkboxes = document.querySelectorAll('.filter-dropdown input[type="checkbox"]');
    checkboxes.forEach(cb => {
      (cb as HTMLInputElement).checked = false;
    });
    
    this.applyFilters();
  }

  drillDownToIssues(epicId: string) {
    // Find the epic and add its filter
    for (const sprint of this.projectData) {
      const epic = sprint.epics.find(e => e.id === epicId);
      if (epic) {
        this.selectedEpic = epic;
        // Automatically set the epic filter to show this epic's issues
        this.selectedFilters.epics = [epic.text];
        this.displayMode = 'issues';
        // Force change detection
        this.cdr.detectChanges();
        // Check the epic checkbox
        setTimeout(() => {
          const epicCheckbox = document.getElementById(`epic-${epic.text}`) as HTMLInputElement;
          if (epicCheckbox) {
            epicCheckbox.checked = true;
          }
          this.initializeGantt();
        }, 0);
        break;
      }
    }
  }

  backToEpics() {
    this.displayMode = 'epics';
    this.selectedEpic = null;
    // Clear epic filters when going back
    this.selectedFilters.epics = [];
    // Uncheck epic filter checkboxes
    const epicCheckboxes = document.querySelectorAll('.filter-dropdown input[id^="epic-"]');
    epicCheckboxes.forEach(cb => {
      (cb as HTMLInputElement).checked = false;
    });
    // Force change detection
    this.cdr.detectChanges();
    this.initializeGantt();
  }

  getFilterCount(type: string): number {
    return (this.selectedFilters as any)[type].length;
  }

  toggleDropdown(event: Event) {
    const button = event.currentTarget as HTMLElement;
    const dropdown = button.nextElementSibling as HTMLElement;
    
    // Close all other dropdowns
    document.querySelectorAll('.filter-dropdown').forEach(dd => {
      if (dd !== dropdown) {
        dd.classList.remove('show');
      }
    });
    
    dropdown.classList.toggle('show');
    event.stopPropagation();
  }
}