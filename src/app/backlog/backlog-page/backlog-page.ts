import { Component, inject, HostListener, OnInit, ChangeDetectorRef, NgZone, ViewChild } from '@angular/core';
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
import { AiSprintModal } from '../ai-sprint-modal/ai-sprint-modal';
import { AiSprintPlanningService, AISuggestionResponse } from '../../shared/services/ai-sprint-planning.service';
import { ToastService } from '../../shared/services/toast.service';
import { SprintService, SprintRequest } from '../../sprint/sprint.service';

@Component({
  selector: 'app-backlog-page',
  imports: [CommonModule, SprintContainer, BacklogContainer, AllIssuesList, Sidebar, Navbar, Filters, EpicContainer, EpicDetailedView, AiSprintModal],
  templateUrl: './backlog-page.html',
  styleUrl: './backlog-page.css'
})
export class BacklogPage implements OnInit {
  // Dummy team names for dropdown
  teamOptions: string[] = ['Frontend Team', 'Backend Team', 'QA Team', 'DevOps Team', 'Design Team'];
  constructor(private modalService: ModalService, private sprintService: SprintService) {}
  
  private route = inject(ActivatedRoute);
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  
  // ViewChild to access the filters component
  @ViewChild(Filters) filtersComponent?: Filters;
  
  private aiSprintPlanningService = inject(AiSprintPlanningService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  
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
  
  // AI Sprint Planning state
  isAIModalOpen = false;
  aiSuggestions: AISuggestionResponse | null = null;
  isLoadingAISuggestions = false;
  
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

    // Scroll to completed sprints section when enabled
    if (this.showCompletedSprints) {
      this.scrollToCompletedSprints();
    }
  }

  /**
   * Scroll helper used by both the toggle button and the filters component
   * Ensures DOM is rendered and then scrolls the completed sprints section into view
   */
  private scrollToCompletedSprints(): void {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      setTimeout(() => {
        const completedSprintsSection = document.querySelector('.completed-sprints-section');
        if (completedSprintsSection) {
          const navbarHeight = 60; // Approximate navbar height
          const offsetTop = completedSprintsSection.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        } else {
          console.warn('Completed sprints section not found in DOM');
        }
      }, 350); // Increased delay to ensure Angular rendering is complete
    });
  }

  

  handleCreateSprint() {
      const sprintFields: FormField[] = [
        { label: 'Sprint Name', type: 'text', model: 'sprintName', required:true, colSpan: 2 },
        { label: 'Sprint Goal', type: 'textarea', model: 'sprintGoal', colSpan: 2 },
        { label: 'Team Assigned', type: 'select', model: 'teamAssigned', options: this.teamOptions, colSpan: 2, required: false },
        { label: 'Start Date', type: 'date', model: 'startDate', colSpan: 1 },
        { label: 'Due Date', type: 'date', model: 'dueDate', colSpan: 1 },
        { label: 'Status', type: 'select', model: 'status', options: ['PLANNED','ACTIVE','COMPLETED'], colSpan: 1 },
        { label: 'Story Point', type: 'number', model: 'storyPoint', colSpan: 1 },
      ];    this.modalService.open({
      id: 'sprintModal',
      title: 'Create Sprint',
      projectName: 'Project Alpha',
      modalDesc : 'Create a new sprint in your project',
      fields: sprintFields,
      data: {},
      submitText: 'Create Sprint',
      // Add onSubmit handler for modal
      // This will be called from the modal component when the form is submitted
      onSubmit: (formData: any) => {
        // Prepare request body for API
        const sprintReq: SprintRequest = {
          projectId: '2373d1ec-dc5b-4a9a-b174-7ad870d5918f',
          sprintName: formData.sprintName,
          sprintGoal: formData.sprintGoal,
          teamAssigned: formData.teamAssigned ? Number(formData.teamAssigned) : null,
          startDate: formData.startDate,
          dueDate: formData.dueDate,
          status: formData.status,
          storyPoint: Number(formData.storyPoint) || 0
        };
        console.log('Sending sprint request:', sprintReq);
        this.sprintService.createSprint(sprintReq).subscribe({
          next: (res) => {
            console.log('Sprint created successfully:', res);
            alert('Sprint created successfully!');
            this.modalService.close();
          },
          error: (err) => {
            console.error('Failed to create sprint:', err);
            console.error('Validation errors:', err.error?.errors);
            const errorMsg = err.error?.errors ? 
              JSON.stringify(err.error.errors, null, 2) : 
              err.message;
            alert(`Failed to create sprint:\n${errorMsg}`);
          }
        });
      }
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
    { label: 'Team Assigned', type: 'select', model: 'teamAssigned', options: this.teamOptions, colSpan: 2, required: false },
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
      teamAssigned: sprint.teamAssigned || '',
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
    // detect transition from hidden -> shown so we can scroll into view
    const prevShowCompleted = this.showCompletedSprints;
    this.showCompletedSprints = criteria.showCompletedSprints;
    if (this.showCompletedSprints && !prevShowCompleted) {
      // ensure we scroll to the newly revealed section
      this.scrollToCompletedSprints();
    }
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
    // Directly update the filters component's epic panel state
    if (this.filtersComponent) {
      this.filtersComponent.showEpicPanel.set(false);
    }
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
      const deltaX = event.clientX - this.startX;
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

  // AI Sprint Planning Methods
  handleAISprintSuggestion(): void {
    this.isAIModalOpen = true;
    this.isLoadingAISuggestions = true;
    this.aiSuggestions = null;

    // Run async operation inside NgZone to ensure change detection
    this.ngZone.run(async () => {
      try {
        this.aiSuggestions = await this.aiSprintPlanningService.generateSprintSuggestions();
        this.toastService.success('AI suggestions generated successfully!');
      } catch (error) {
        console.error('Failed to generate AI suggestions:', error);
        // Toast already shown by service
      } finally {
        this.isLoadingAISuggestions = false;
      }
    });
  }

  closeAIModal(): void {
    this.isAIModalOpen = false;
    this.aiSuggestions = null;
  }

  handleCommitAISuggestions(): void {
    // Placeholder for future implementation
    this.toastService.info('Commit functionality coming soon!');
    console.log('Commit AI suggestions:', this.aiSuggestions);
  }

  ngOnInit(): void {
    // Set project context from route params
    const projectId = this.route.parent?.snapshot.paramMap.get('projectId');
    if (projectId) {
      this.projectContextService.setCurrentProjectId(projectId);
    }
  }
}
