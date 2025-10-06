import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SprintContainer, Sprint } from '../../sprint/sprint-container/sprint-container';
import { BacklogContainer } from '../backlog-container/backlog-container';
import { Issue } from '../../shared/models/issue.model';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Navbar } from '../../shared/navbar/navbar';
import { Filters, FilterCriteria } from '../../shared/filters/filters';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { EpicContainer } from '../../epic/epic-container/epic-container';
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
  imports: [CommonModule, SprintContainer, BacklogContainer, Sidebar, Navbar, Filters, EpicContainer],
  templateUrl: './backlog-page.html',
  styleUrl: './backlog-page.css'
})
export class BacklogPage {
  constructor(private modalService: ModalService) {}
  
  private sidebarStateService = inject(SidebarStateService);
  isSidebarCollapsed = this.sidebarStateService.isCollapsed;
  
  // Epic panel state
  isEpicPanelOpen = false;
  selectedEpicFilter: string | null = null;
  epics: Epic[] = [...sharedEpics];
  // Use shared dummy data from shared/data/dummy-backlog-data.ts
  private completedSprint1Issues: Issue[] = completedSprint1Issues;
  private completedSprint2Issues: Issue[] = completedSprint2Issues;
  private activeSprintIssues: Issue[] = activeSprintIssues;
  private plannedSprintIssues: Issue[] = plannedSprintIssues;

  // Backlog issues (not assigned to any sprint)
  backlogIssues: Issue[] = sharedBacklogIssues;

  // All sprints
  sprints: Sprint[] = sharedSprints;

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
          fields: sprintFields,
          data: { shareWith: '', message: '' }  //optional prefilled
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
    { label: 'Sprint Name', type: 'text', model: 'sprintName', colSpan: 2 },
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
    fields: sprintFields,
    data: {
      sprintName: sprint.name || '',
      sprintGoal,
      startDate: sprint.startDate ? sprint.startDate.toISOString().split('T')[0] : '',
      dueDate: sprint.endDate ? sprint.endDate.toISOString().split('T')[0] : '',
      status: sprint.status || 'Planned',
      storyPoint: totalStoryPoints,
    },
    showLabels: false
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
    // Implement filter logic here
    // You can filter sprints and backlog issues based on the criteria
    // For now, just logging the criteria
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

  // Handle moving issue between sprints/backlog
  handleMoveIssue(issueId: string, destinationSprintId: string | null): void {
    console.log(`Moving issue ${issueId} to sprint ${destinationSprintId || 'backlog'}`);
    
    // Find the issue in all sprints and backlog
    let movedIssue: Issue | undefined;
    let sourceSprintId: string | null = null;

    // Search in backlog
    const backlogIndex = this.backlogIssues.findIndex(i => i.id === issueId);
    if (backlogIndex !== -1) {
      movedIssue = this.backlogIssues[backlogIndex];
      this.backlogIssues = this.backlogIssues.filter(i => i.id !== issueId);
    }

    // Search in sprints
    if (!movedIssue) {
      for (const sprint of this.sprints) {
        if (sprint.issues) {
          const issueIndex = sprint.issues.findIndex(i => i.id === issueId);
          if (issueIndex !== -1) {
            movedIssue = sprint.issues[issueIndex];
            sourceSprintId = sprint.id;
            sprint.issues = sprint.issues.filter(i => i.id !== issueId);
            break;
          }
        }
      }
    }

    if (movedIssue) {
      // Update the issue's sprintId
      movedIssue.sprintId = destinationSprintId || undefined;
      movedIssue.updatedAt = new Date();

      // Add to destination
      if (destinationSprintId) {
        const targetSprint = this.sprints.find(s => s.id === destinationSprintId);
        if (targetSprint) {
          if (!targetSprint.issues) {
            targetSprint.issues = [];
          }
          targetSprint.issues.push(movedIssue);
        }
      } else {
        // Move to backlog
        this.backlogIssues.push(movedIssue);
      }

      console.log(`Issue ${issueId} moved successfully`);
    } else {
      console.error(`Issue ${issueId} not found`);
    }
  }

  onToggleSidebar(): void {
    this.sidebarStateService.toggleCollapse();
  }

  toggleEpicPanel(): void {
    this.isEpicPanelOpen = !this.isEpicPanelOpen;
  }

  closeEpicPanel(): void {
    this.isEpicPanelOpen = false;
  }

  onEpicFilterChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedEpicFilter = selectElement.value || null;
    console.log('Selected epic filter:', this.selectedEpicFilter);
    // Implement filter logic here to filter backlog issues by epic
  }

  get epicFilterOptions(): Array<{ id: string | null, name: string }> {
    return [
      { id: null, name: 'All epics' },
      ...this.epics.map(epic => ({ id: epic.id, name: epic.name }))
    ];
  }
}
