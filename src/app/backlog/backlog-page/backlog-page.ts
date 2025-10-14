import { Component, inject, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SprintContainer, Sprint } from '../../sprint/sprint-container/sprint-container';
import { BacklogContainer } from '../backlog-container/backlog-container';
import { AllIssuesList } from '../all-issues-list/all-issues-list';
import { Issue } from '../../shared/models/issue.model';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Navbar } from '../../shared/navbar/navbar';
import { users } from '../../shared/data/dummy-backlog-data';
import { Filters, FilterCriteria } from '../../shared/filters/filters';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ProjectContextService } from '../../shared/services/project-context.service';
import { EpicContainer } from '../../epic/epic-container/epic-container';
import { EpicDetailedView } from '../../epic/epic-detailed-view/epic-detailed-view';
import { Epic } from '../../shared/models/epic.model';
import {
  completedSprint1Issues,
  completedSprint2Issues,
  activeSprintIssues,
  plannedSprintIssues,
  backlogIssues as sharedBacklogIssues,
  sprints as sharedSprints,
  epics as sharedEpics
} from '../../shared/data/dummy-backlog-data';
import { FormField, ModalService } from '../../modal/modal-service';

@Component({
  selector: 'app-backlog-page',
  imports: [CommonModule, SprintContainer, BacklogContainer, AllIssuesList, Sidebar, Navbar, Filters, EpicContainer, EpicDetailedView],
  templateUrl: './backlog-page.html',
  styleUrl: './backlog-page.css'
})
export class BacklogPage implements OnInit {
  constructor(private modalService: ModalService) {}
  
  private route = inject(ActivatedRoute);
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  // Template calls isSidebarCollapsed() as a method; expose it here.
  isSidebarCollapsed(): boolean {
    const svc: any = this.sidebarStateService as any;
    if (typeof svc.isCollapsed === 'function') {
      return svc.isCollapsed();
    }
    return !!svc.isCollapsed;
  }
  
  // Epic panel state  
  isEpicPanelOpen = false;
  epics: Epic[] = [...sharedEpics];
  
  // Epic detail view state
  selectedEpic: Epic | null = null;
  epicDetailPanelWidth = 600; // Default width in pixels
  private isResizing = false;
  private startX = 0;
  private startWidth = 0;
  // Use shared dummy data from shared/data/dummy-backlog-data.ts
  private completedSprint1Issues: Issue[] = completedSprint1Issues;
  private completedSprint2Issues: Issue[] = completedSprint2Issues;
  private activeSprintIssues: Issue[] = activeSprintIssues;
  private plannedSprintIssues: Issue[] = plannedSprintIssues;

  // Backlog issues (not assigned to any sprint)
  backlogIssues: Issue[] = sharedBacklogIssues;

  // All sprints
  sprints: Sprint[] = sharedSprints;

  // View state managed by filters component
  currentView: 'sprints' | 'all-issues' = 'sprints';
  showCompletedSprints = false;
  selectedEpicFilter: string | null = null;

  // Helper to get sprints by status
  get activeSprints(): Sprint[] {
    return this.sprints.filter(s => s.status === 'ACTIVE');
  }

  get plannedSprints(): Sprint[] {
    return this.sprints.filter(s => s.status === 'PLANNED');
  }

  get completedSprints(): Sprint[] {
    return this.sprints.filter(s => s.status === 'COMPLETED');
  }

  // Get backlog issues excluding completed ones
  get filteredBacklogIssues(): Issue[] {
    return this.backlogIssues.filter(issue => issue.status !== 'DONE');
  }

  // Get all issues from all sprints and backlog
  get allIssues(): Issue[] {
    const sprintIssues = this.sprints.flatMap(sprint => sprint.issues || []);
    return [...sprintIssues, ...this.backlogIssues];
  }

  // Toggle view between sprints and all issues
  toggleView(view: 'sprints' | 'all-issues'): void {
    this.currentView = view;
  }

  // Toggle completed sprints visibility
  toggleCompletedSprints(): void {
    this.showCompletedSprints = !this.showCompletedSprints;
  }

  

  handleCreateSprint() {
      const sprintFields: FormField[] = [
        { label: 'Sprint Name', type: 'text', model: 'sprintName', colSpan: 2 },
        { label: 'Sprint Goal', type: 'textarea', model: 'sprintGoal', colSpan: 2 },
        { label: 'Start Date', type: 'date', model: 'startDate', colSpan: 1 },
        { label: 'Due Date', type: 'date', model: 'dueDate', colSpan: 1 },
        { label: 'Status', type: 'select', model: 'status', options: ['Planned','Active','Completed'], colSpan: 1 },
        { label: 'Story Point', type: 'number', model: 'storyPoint', colSpan: 1 },
      ];
  
      
        this.modalService.open({
          id: 'sprintModal',
          title: 'Create Sprint',
          projectName: 'Project Alpha',
          modalDesc : 'Create a new sprint in your project',
          fields: sprintFields,
          data: { shareWith: '', message: '' },  //optional prefilled,
          submitText: 'Create Sprint'
        });
    }

  handleStart(sprintId: string): void {
    console.log('Start sprint:', sprintId);
    // Add your start logic here
  }

  handleComplete(sprintId: string): void {
    console.log('Complete sprint:', sprintId);
    // Add your completion logic here
  }

  handleEdit(sprintId: string): void {
  const sprint = this.sprints.find(s => s.id === sprintId);
  if (!sprint) {
    console.error(`Sprint not found: ${sprintId}`);
    return;
  }
  

  // Derive extra info dynamically (goal, story points, etc.)
  const totalStoryPoints = sprint.issues?.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0) || 0;
  const sprintGoal = sprint.issues?.[0]?.description || 'Refine sprint goals and deliver planned issues';

  const sprintFields: FormField[] = [
    { label: 'Sprint Name', type: 'text', model: 'sprintName', colSpan: 2, required:true },
    { label: 'Sprint Goal', type: 'textarea', model: 'sprintGoal', colSpan: 2 },
    { label: 'Start Date', type: 'date', model: 'startDate', colSpan: 1 },
    { label: 'Due Date', type: 'date', model: 'dueDate', colSpan: 1 },
    { label: 'Status', type: 'select', model: 'status', options: ['PLANNED', 'ACTIVE', 'COMPLETED'], colSpan: 1 },
    { label: 'Story Point (Total)', type: 'number', model: 'storyPoint', colSpan: 1 },
  ];

  this.modalService.open({
    id: 'shareModal',
    title: 'Edit Sprint',
    projectName: 'Project Alpha',
    modalDesc : 'Edit an existing sprint in your project',
    fields: sprintFields,
    data: {
      sprintName: sprint.name || '',
      sprintGoal,
      startDate: sprint.startDate ? sprint.startDate.toISOString().split('T')[0] : '',
      dueDate: sprint.endDate ? sprint.endDate.toISOString().split('T')[0] : '',
      status: sprint.status || 'Planned',
      storyPoint: totalStoryPoints,
    },
    showLabels: false,
    submitText: 'Save Changes'
  });
}



  handleDelete(sprintId: string): void {
    console.log('Delete sprint:', sprintId);
    // Add your deletion logic here
    if (confirm(`Are you sure you want to delete this sprint?`)) {
      console.log('Sprint deleted');
    }
  }

  onFiltersChanged(criteria: FilterCriteria): void {
    console.log('Filters changed:', criteria);
    // Update view states from filter criteria
    this.currentView = criteria.view;
    this.showCompletedSprints = criteria.showCompletedSprints;
    this.isEpicPanelOpen = criteria.showEpicPanel;
    this.selectedEpicFilter = criteria.epicId;
    // Additional filter logic can be implemented here
    // Filter sprints and backlog issues based on other criteria
  }

  // Get list of all sprints for move dropdown
  get availableSprintsForMove(): Array<{ id: string, name: string, status: string }> {
    return this.sprints.map(s => ({
      id: s.id,
      name: s.name,
      status: s.status
    }));
  }

  // Get list of all drop list IDs for drag-drop connections
  get allDropListIds(): string[] {
    const sprintIds = this.sprints.map(s => `sprint-${s.id}`);
    return ['backlog-container', ...sprintIds];
  }

  // Get connected drop lists for a specific sprint (all except itself)
  getConnectedDropListsForSprint(sprintId: string): string[] {
    return this.allDropListIds.filter(id => id !== `sprint-${sprintId}`);
  }

  // Get connected drop lists for backlog (all sprints)
  get connectedDropListsForBacklog(): string[] {
    return this.allDropListIds.filter(id => id !== 'backlog-container');
  }

  // Get epic options for filter component
  get epicFilterOptions(): Array<{ id: string, name: string }> {
    return this.epics.map(epic => ({ id: epic.id, name: epic.name }));
  }

  // Handle moving issue between sprints/backlog
  handleMoveIssue(issueId: string, destinationSprintId: string | null): void {
    console.log(`Moving issue ${issueId} to sprint ${destinationSprintId || 'backlog'}`);
    
    // Find the issue in all sprints and backlog
    let movedIssue: Issue | undefined;
    let sourceSprintId: string | null = null;

    // Search in backlog
    const backlogIndex = this.backlogIssues.findIndex(i => i.id === issueId);
    if (backlogIndex !== -1) {
      // Create a copy to avoid reference issues
      movedIssue = { ...this.backlogIssues[backlogIndex] };
      // Remove from backlog by creating a new array
      this.backlogIssues = [...this.backlogIssues.filter(i => i.id !== issueId)];
    }

    // Search in sprints if not found in backlog
    if (!movedIssue) {
      for (const sprint of this.sprints) {
        if (sprint.issues) {
          const issueIndex = sprint.issues.findIndex(i => i.id === issueId);
          if (issueIndex !== -1) {
            // Create a copy to avoid reference issues
            movedIssue = { ...sprint.issues[issueIndex] };
            sourceSprintId = sprint.id;
            // Remove from sprint by creating a new array
            sprint.issues = [...sprint.issues.filter(i => i.id !== issueId)];
            break;
          }
        }
      }
    }

    if (movedIssue) {
      // Update the issue's sprintId and timestamp
      movedIssue.sprintId = destinationSprintId || undefined;
      movedIssue.updatedAt = new Date();

      // Add to destination
      if (destinationSprintId) {
        const targetSprint = this.sprints.find(s => s.id === destinationSprintId);
        if (targetSprint) {
          // Initialize issues array if it doesn't exist
          if (!targetSprint.issues) {
            targetSprint.issues = [];
          }
          // Add to sprint by creating a new array
          targetSprint.issues = [...targetSprint.issues, movedIssue];
        }
      } else {
        // Move to backlog by creating a new array
        this.backlogIssues = [...this.backlogIssues, movedIssue];
      }

      console.log(`Issue ${issueId} moved successfully from ${sourceSprintId || 'backlog'} to ${destinationSprintId || 'backlog'}`);
    } else {
      console.error(`Issue ${issueId} not found`);
    }
  }

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }

  closeEpicPanel(): void {
    this.isEpicPanelOpen = false;
  }

  // Epic detail view methods
  openEpicDetailView(epicId: string): void {
    const epic = this.epics.find(e => e.id === epicId);
    if (epic) {
      this.selectedEpic = { ...epic }; // Create a copy to avoid direct mutation
    }
  }

  onEpicCreated(newEpic: Epic): void {
    // Add the new epic to the list
    this.epics.push(newEpic);
    // Immediately open the detail view for the newly created epic
    this.selectedEpic = { ...newEpic };
  }

  closeEpicDetailView(): void {
    this.selectedEpic = null;
  }

  onEpicUpdated(updatedEpic: Epic): void {
    // Update the epic in the epics array
    const index = this.epics.findIndex(e => e.id === updatedEpic.id);
    if (index !== -1) {
      this.epics[index] = { ...updatedEpic };
    }
    // Update the selected epic reference
    this.selectedEpic = { ...updatedEpic };
  }

  // Resize methods
  startResize(event: MouseEvent): void {
    this.isResizing = true;
    this.startX = event.clientX;
    this.startWidth = this.epicDetailPanelWidth;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isResizing) {
      const deltaX = this.startX - event.clientX;
      const newWidth = this.startWidth + deltaX;
      
      // Set min and max width constraints
      if (newWidth >= 400 && newWidth <= 1200) {
        this.epicDetailPanelWidth = newWidth;
      }
    }
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (this.isResizing) {
      this.isResizing = false;
    }
  }

  ngOnInit(): void {
    // Set project context from route params
    const projectId = this.route.parent?.snapshot.paramMap.get('projectId');
    if (projectId) {
      this.projectContextService.setCurrentProjectId(projectId);
    }
  }
}
