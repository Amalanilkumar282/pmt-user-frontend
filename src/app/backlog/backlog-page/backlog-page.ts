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
import { IssueService } from '../../shared/services/issue.service';

@Component({
  selector: 'app-backlog-page',
  imports: [CommonModule, SprintContainer, BacklogContainer, AllIssuesList, Sidebar, Navbar, Filters, EpicContainer, EpicDetailedView, AiSprintModal],
  templateUrl: './backlog-page.html',
  styleUrl: './backlog-page.css'
})
export class BacklogPage implements OnInit {
  // Dummy team names for dropdown
  teamOptions: string[] = ['Frontend Team', 'Backend Team', 'QA Team', 'DevOps Team', 'Design Team'];
  constructor(
    private modalService: ModalService, 
    private sprintService: SprintService,
    private issueService: IssueService
  ) {}
  
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

  // All issues from backend
  private allIssuesFromBackend: Issue[] = [];
  
  // Loading state
  isLoadingIssues = false;

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

  // Get all issues from backend (replaces dummy data when loaded)
  get allIssues(): Issue[] {
    if (this.allIssuesFromBackend.length > 0) {
      return this.allIssuesFromBackend;
    }
    // Fallback to dummy data if backend data not loaded
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

  

  /**
   * Open Create Sprint Modal using reusable ModalService
   */
  handleCreateSprint() {
    const projectId = this.projectContextService.getCurrentProjectId() || sessionStorage.getItem('projectId') || '';
    
    // Fetch teams for the project
    this.sprintService.getTeamsByProject(projectId).subscribe({
      next: (response) => {
        let teamsData: any[] = [];
        
        if (Array.isArray(response)) {
          teamsData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          teamsData = response.data;
        }
        
        const teamOptions = teamsData.map((team: any) => 
          `${team.teamName || team.name || 'Unnamed Team'}${team.members && team.members.length > 0 ? ' (' + team.members.length + ' members)' : ''}`
        );
        const teamIds = teamsData.map((team: any) => team.teamId || team.id || '');
        
        const fields: FormField[] = [
          { 
            label: 'Sprint Name', 
            type: 'text', 
            model: 'sprintName', 
            colSpan: 2, 
            required: true 
          },
          { 
            label: 'Sprint Goal', 
            type: 'textarea', 
            model: 'sprintGoal', 
            colSpan: 2 
          },
          { 
            label: 'Start Date', 
            type: 'date', 
            model: 'startDate', 
            colSpan: 1
          },
          { 
            label: 'End Date', 
            type: 'date', 
            model: 'endDate', 
            colSpan: 1
          },
          { 
            label: 'Status', 
            type: 'select', 
            model: 'status', 
            options: ['PLANNED', 'ACTIVE', 'COMPLETED'], 
            colSpan: 1 
          },
          { 
            label: 'Target Story Points', 
            type: 'number', 
            model: 'targetStoryPoints', 
            colSpan: 1 
          },
          { 
            label: 'Team', 
            type: 'select', 
            model: 'teamId', 
            options: teamOptions, 
            colSpan: 2
          }
        ];

        this.modalService.open({
          id: 'createSprint',
          title: 'Create Sprint',
          projectName: '',
          modalDesc: 'Plan your next sprint with AI-powered suggestions',
          fields,
          data: { 
            status: 'PLANNED',
            targetStoryPoints: 40
          },
          showLabels: false,
          submitText: 'Create Sprint & Get AI Suggestions',
          onSubmit: (formData: any) => {
            console.log('Create sprint formData:', formData);
            
            // Validate required field: Sprint Name
            if (!formData.sprintName) {
              this.toastService.error('Sprint Name is required');
              return;
            }

            // Find the selected team index to get the actual teamId (optional)
            let actualTeamId = null;
            if (formData.teamId) {
              const selectedTeamIndex = teamOptions.indexOf(formData.teamId);
              actualTeamId = selectedTeamIndex >= 0 ? teamIds[selectedTeamIndex] : null;
            }
            
            const sprintRequest: SprintRequest = {
              projectId: projectId,
              sprintName: formData.sprintName,
              sprintGoal: formData.sprintGoal || null,
              teamAssigned: actualTeamId ? parseInt(actualTeamId) : null,
              startDate: formData.startDate || undefined,
              dueDate: formData.endDate || undefined,
              status: formData.status || 'PLANNED',
              storyPoint: formData.targetStoryPoints ? parseInt(formData.targetStoryPoints) : 40
            };

            console.log('Sprint request payload:', sprintRequest);
            console.log('Sprint request JSON:', JSON.stringify(sprintRequest, null, 2));

            this.modalService.close();
            
            // Create sprint
            this.sprintService.createSprint(sprintRequest).subscribe({
              next: (response) => {
                console.log('Sprint created:', response);
                const createdSprintId = response.data.id;
                
                // Reload sprints
                this.loadSprints(projectId);
                
                // Trigger AI planning if form has sufficient data
                if (formData.sprintGoal && formData.startDate && formData.endDate && formData.teamId) {
                  this.generateAIPlanForSprint(createdSprintId, formData, actualTeamId);
                } else {
                  this.toastService.success('Sprint created successfully!');
                }
              },
              error: (error) => {
                console.error('Error creating sprint:', error);
                console.error('Error status:', error.status);
                console.error('Error message:', error.message);
                
                // Log validation errors if available
                if (error.error && error.error.errors) {
                  console.error('Validation errors:', error.error.errors);
                  const errorMessages = Object.entries(error.error.errors)
                    .map(([field, messages]: [string, any]) => {
                      const msgArray = Array.isArray(messages) ? messages : [messages];
                      return `${field}: ${msgArray.join(', ')}`;
                    })
                    .join('; ');
                  this.toastService.error(`Validation failed: ${errorMessages}`);
                } else if (error.error && error.error.title) {
                  this.toastService.error(`Failed to create sprint: ${error.error.title}`);
                } else {
                  this.toastService.error('Failed to create sprint');
                }
              }
            });
          }
        });
      },
      error: (error) => {
        console.error('Error loading teams:', error);
        this.toastService.error('Failed to load teams');
      }
    });
  }

  /**
   * Handle Create Sprint Modal Close (no longer needed - using ModalService)
   */
  onCloseCreateSprintModal() {
    // Method kept for backwards compatibility but does nothing
  }

  /**
   * Generate AI Sprint Plan after sprint creation
   */
  private generateAIPlanForSprint(sprintId: string, formData: any, teamId: string): void {
    const projectId = this.projectContextService.getCurrentProjectId() || sessionStorage.getItem('projectId') || '';
    
    const aiRequest = {
      sprintName: formData.sprintName,
      sprintGoal: formData.sprintGoal,
      startDate: formData.startDate,
      endDate: formData.endDate,
      targetStoryPoints: formData.targetStoryPoints || 40,
      teamId: teamId
    };

    console.log('Generating AI plan for sprint:', sprintId, aiRequest);

    this.toastService.info('Generating AI suggestions for sprint...');

    this.sprintService.generateAISprintPlan(projectId, aiRequest).subscribe({
      next: (response) => {
        console.log('AI plan response:', response);
        
        if (response.succeeded && response.data.sprintPlan) {
          const suggestions = response.data.sprintPlan.selectedIssues;
          const summary = response.data.sprintPlan.summary;
          
          this.toastService.success('Sprint created! AI suggestions generated.');
          
          // Show AI suggestions in a modal or notification
          this.showAISuggestionsModal(sprintId, suggestions, summary);
        } else {
          this.toastService.warning('Sprint created, but AI suggestions unavailable');
        }
      },
      error: (error) => {
        console.error('Error generating AI plan:', error);
        this.toastService.warning('Sprint created successfully, but AI planning failed');
      }
    });
  }

  /**
   * Show AI suggestions in a modal
   */
  private showAISuggestionsModal(sprintId: string, suggestions: any[], summary: string): void {
    // Convert backend suggestions to AISuggestionResponse format
    this.aiSuggestions = {
      recommended_issues: suggestions.map((issue: any) => ({
        key: issue.issueKey || issue.key || '',
        summary: issue.rationale || issue.summary || '',
        story_points: issue.storyPoints || 0
      })),
      summary: summary
    };
    
    this.isAIModalOpen = true;
    this.cdr.detectChanges();
  }

  /**
   * Handle Sprint Created Event
   * Refresh the sprint list and show success message
   */
  onSprintCreated(event: any) {
    console.log('Sprint created:', event);
    
    // Reload sprints from backend to get the newly created sprint
    const projectId = this.projectContextService.getCurrentProjectId();
    if (projectId) {
      this.loadSprints(projectId);
    } else {
      // Fallback to session storage
      const storedProjectId = sessionStorage.getItem('projectId');
      if (storedProjectId) {
        this.loadSprints(storedProjectId);
      }
    }
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
      { label: 'Sprint Name', type: 'text', model: 'sprintName', colSpan: 2, required: true },
      { label: 'Sprint Goal', type: 'textarea', model: 'sprintGoal', colSpan: 2 },
      { label: 'Team Assigned', type: 'select', model: 'teamAssigned', options: this.teamOptions, colSpan: 2, required: false },
      { label: 'Start Date', type: 'date', model: 'startDate', colSpan: 1 },
      { label: 'Due Date', type: 'date', model: 'dueDate', colSpan: 1 },
      { label: 'Status', type: 'select', model: 'status', options: ['PLANNED', 'ACTIVE', 'COMPLETED'], colSpan: 1 },
      { label: 'Story Point (Total)', type: 'number', model: 'storyPoint', colSpan: 1 },
    ];

    this.modalService.open({
      id: 'editSprintModal',
      title: 'Edit Sprint',
      projectName: 'Project Alpha',
      modalDesc: 'Edit an existing sprint in your project',
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
      submitText: 'Save Changes',
      onSubmit: (formData: any) => {
        this.updateSprintApi(sprintId, formData);
      }
    });
  }

  /**
   * Update sprint via API
   */
  private updateSprintApi(sprintId: string, formData: any): void {
    const projectId = this.projectContextService.getCurrentProjectId() || sessionStorage.getItem('projectId');
    
    if (!projectId) {
      this.toastService.error('Project ID not found');
      return;
    }

    // Convert date strings to ISO 8601 UTC format for PostgreSQL
    const formatDateToUTC = (dateString: string): string => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString(); // Returns format: "2024-11-03T00:00:00.000Z"
    };

    const sprintRequest: SprintRequest = {
      id: sprintId, // Include sprint ID in the request body
      projectId: projectId,
      sprintName: formData.sprintName,
      sprintGoal: formData.sprintGoal || null,
      teamAssigned: formData.teamAssigned ? Number(formData.teamAssigned) : null,
      startDate: formData.startDate ? formatDateToUTC(formData.startDate) : undefined,
      dueDate: formData.dueDate ? formatDateToUTC(formData.dueDate) : undefined,
      status: formData.status || 'PLANNED',
      storyPoint: formData.storyPoint || 0
    };

    console.log('🔧 Update Sprint Request Details:', {
      sprintId,
      projectId,
      formData,
      sprintRequest,
      rawFormData: JSON.stringify(formData, null, 2),
      requestPayload: JSON.stringify(sprintRequest, null, 2)
    });
    this.toastService.info('Updating sprint...');

    this.sprintService.updateSprint(sprintId, sprintRequest).subscribe({
      next: (response) => {
        console.log('Sprint updated successfully:', response);
        this.toastService.success('Sprint updated successfully!');
        
        // Close the modal first
        this.modalService.close();
        
        // Reload sprints to get updated data from backend
        this.ngZone.run(() => {
          if (projectId) {
            this.loadSprints(projectId);
          }
          // Trigger change detection
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('❌ Error updating sprint:', {
          error,
          status: error.status,
          statusText: error.statusText,
          message: error.error?.message || error.message,
          fullError: error.error,
          sprintId,
          sentRequest: sprintRequest
        });
        this.toastService.error(error.error?.message || 'Failed to update sprint. Please try again.');
      }
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
    if (!this.aiSuggestions?.recommended_issues || this.aiSuggestions.recommended_issues.length === 0) {
      this.toastService.warning('No issues to add');
      return;
    }

    const projectId = this.projectContextService.getCurrentProjectId() || sessionStorage.getItem('projectId') || '';
    
    // Prepare issue creation requests from AI suggestions
    const issueRequests = this.aiSuggestions.recommended_issues.map(issue => ({
      title: issue.key,
      description: issue.summary,
      issueType: 'Story',
      priority: 'MEDIUM',
      storyPoints: issue.story_points,
      assigneeId: '', // AI suggestions don't have assigneeId in this format
      projectId: projectId,
      labels: ['AI-Suggested']
    }));

    console.log('Creating bulk issues from AI suggestions:', issueRequests);
    this.toastService.info('Adding AI-suggested issues to backlog...');

    // Create issues in bulk
    this.sprintService.createBulkIssues(issueRequests).subscribe({
      next: (responses) => {
        console.log('Issues created:', responses);
        this.toastService.success(`${responses.length} issues added to backlog successfully!`);
        
        // Reload issues to show newly created ones
        this.loadProjectIssues(projectId);
        
        // Close the AI modal
        this.closeAIModal();
      },
      error: (error) => {
        console.error('Error creating issues:', error);
        this.toastService.error('Failed to add some issues. Please try again.');
      }
    });
  }

  ngOnInit(): void {
    // Set project context from route params
    const projectId = this.route.parent?.snapshot.paramMap.get('projectId');
    if (projectId) {
      this.projectContextService.setCurrentProjectId(projectId);
      // Load sprints and issues from backend
      this.loadSprints(projectId);
      this.loadProjectIssues(projectId);
    } else {
      // Try to get projectId from session storage as fallback
      const storedProjectId = sessionStorage.getItem('projectId');
      if (storedProjectId) {
        this.projectContextService.setCurrentProjectId(storedProjectId);
        this.loadSprints(storedProjectId);
        this.loadProjectIssues(storedProjectId);
      } else {
        console.warn('No project ID found in route or session storage');
        this.toastService.warning('No project selected');
      }
    }
  }

  /**
   * Load all sprints for the current project from backend
   */
  private loadSprints(projectId: string): void {
    this.sprintService.getSprintsByProject(projectId).subscribe({
      next: (response) => {
        console.log('Loaded sprints from backend:', response);
        if (response.status === 200 && response.data) {
          // Transform API response to Sprint interface
          this.sprints = response.data.map(sprintData => ({
            id: sprintData.id,
            projectId: sprintData.projectId,
            name: sprintData.name,
            sprintGoal: sprintData.sprintGoal,
            startDate: new Date(sprintData.startDate),
            endDate: new Date(sprintData.dueDate),
            status: sprintData.status,
            storyPoint: sprintData.storyPoint,
            teamId: sprintData.teamId,
            issues: [], // Will be populated by organizeSprints
            createdAt: new Date(sprintData.createdAt),
            updatedAt: sprintData.updatedAt ? new Date(sprintData.updatedAt) : null
          }));
          
          this.toastService.success(`Loaded ${this.sprints.length} sprints successfully`);
          console.log('Transformed sprints:', this.sprints);
          
          // Reorganize issues into sprints after loading
          if (this.allIssuesFromBackend.length > 0) {
            this.organizeSprints(this.allIssuesFromBackend);
          }
          
          // Trigger change detection
          this.cdr.detectChanges();
        } else {
          console.warn('Unexpected response format:', response);
          this.toastService.warning('Received unexpected sprint data format');
        }
      },
      error: (error) => {
        console.error('Failed to load sprints:', error);
        this.toastService.error('Failed to load sprints from backend');
        // Keep using dummy data on error (sprints already initialized with dummy data)
      }
    });
  }

  /**
   * Load all issues for the current project from backend
   */
  private loadProjectIssues(projectId: string): void {
    this.isLoadingIssues = true;
    this.issueService.getProjectIssues(projectId).subscribe({
      next: (issues) => {
        console.log('Loaded issues from backend:', issues);
        this.allIssuesFromBackend = issues;
        this.organizeSprints(issues);
        this.toastService.success(`Loaded ${issues.length} issues successfully`);
        this.isLoadingIssues = false;
      },
      error: (error) => {
        console.error('Failed to load issues:', error);
        this.toastService.error('Failed to load issues from backend');
        this.isLoadingIssues = false;
        // Keep using dummy data on error
      }
    });
  }

  /**
   * Organize issues into sprints based on sprintId
   * This method updates the sprints with their respective issues
   * Issues without sprintId are added to backlog
   */
  private organizeSprints(issues: Issue[]): void {
    // Group issues by sprintId
    const issuesBySprintId = new Map<string, Issue[]>();
    const backlogIssues: Issue[] = [];

    issues.forEach(issue => {
      if (issue.sprintId) {
        // Issue belongs to a sprint
        if (!issuesBySprintId.has(issue.sprintId)) {
          issuesBySprintId.set(issue.sprintId, []);
        }
        issuesBySprintId.get(issue.sprintId)!.push(issue);
      } else {
        // Issue has no sprintId, add to backlog
        backlogIssues.push(issue);
      }
    });

    // Update sprints with their respective issues
    this.sprints.forEach(sprint => {
      const sprintIssues = issuesBySprintId.get(sprint.id) || [];
      sprint.issues = sprintIssues;
    });

    // Update backlog issues (issues without sprintId)
    this.backlogIssues = backlogIssues;

    console.log('✅ Organized sprints with issues:');
    this.sprints.forEach(sprint => {
      console.log(`  - ${sprint.name} (${sprint.status}): ${sprint.issues?.length || 0} issues`);
    });
    console.log(`✅ Backlog issues: ${this.backlogIssues.length}`);
  }
}
