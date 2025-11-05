import { Component, inject, HostListener, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SprintContainer, Sprint } from '../../sprint/sprint-container/sprint-container';
import { BacklogContainer } from '../backlog-container/backlog-container';
import { AllIssuesList } from '../all-issues-list/all-issues-list';
import { Issue } from '../../shared/models/issue.model';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Navbar } from '../../shared/navbar/navbar';
import { Filters, FilterCriteria } from '../../shared/filters/filters';
import { SidebarStateService } from '../../shared/services/sidebar-state.service';
import { ProjectContextService } from '../../shared/services/project-context.service';
import { EpicContainer } from '../../epic/epic-container/epic-container';
import { EpicDetailedView } from '../../epic/epic-detailed-view/epic-detailed-view';
import { Epic } from '../../shared/models/epic.model';
import { FormField, ModalService } from '../../modal/modal-service';
import { ToastService } from '../../shared/services/toast.service';
import { SprintService, SprintRequest } from '../../sprint/sprint.service';
import { IssueService, UpdateIssueRequest } from '../../shared/services/issue.service';
import { EpicService } from '../../shared/services/epic.service';
import { InlineEditService } from '../../shared/services/inline-edit.service';
import { forkJoin } from 'rxjs';
import { AiSprintModal } from '../ai-sprint-modal/ai-sprint-modal';
import { AISprintPlanRequest, AISprintPlanResponse } from '../../sprint/sprint.service';
import { PermissionService } from '../../auth/permission.service';
import { HasPermissionDirective } from '../../auth/has-permission.directive';

@Component({
  selector: 'app-backlog-page',
  imports: [CommonModule, SprintContainer, BacklogContainer, AllIssuesList, Sidebar, Navbar, Filters, EpicContainer, EpicDetailedView, AiSprintModal, HasPermissionDirective],
  templateUrl: './backlog-page.html',
  styleUrl: './backlog-page.css'
})
export class BacklogPage implements OnInit {
  // AI Sprint Planning state
  isAIModalOpen = false;
  aiSuggestions: any = null;
  isLoadingAISuggestions = false;
  currentSprintData: any = null; // Store sprint data for AI modal
  
  constructor(
    private modalService: ModalService, 
    private sprintService: SprintService,
    private issueService: IssueService,
    private epicService: EpicService,
    private inlineEditService: InlineEditService
  ) {}
  
  private route = inject(ActivatedRoute);
  private sidebarStateService = inject(SidebarStateService);
  private projectContextService = inject(ProjectContextService);
  
  // ViewChild to access the filters component
  @ViewChild(Filters) filtersComponent?: Filters;
  
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  
  // Inject permission service
  permissionService = inject(PermissionService);
  
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
  epics: Epic[] = [];
  isLoadingEpics = false;
  
  // Project members for filter dropdown
  projectMembers: Array<{ id: number; name: string }> = [];
  isLoadingMembers = false;
  
  // Epic detail view state
  selectedEpic: Epic | null = null;
  epicDetailPanelWidth = 600; // Default width in pixels
  private isResizing = false;
  private startX = 0;
  private startWidth = 0;
  
  // Get current project ID
  get currentProjectId(): string {
    return this.projectContextService.getCurrentProjectId() || sessionStorage.getItem('projectId') || '';
  }
  
  // Backlog issues (not assigned to any sprint) - loaded from backend
  backlogIssues: Issue[] = [];

  // All sprints - loaded from backend
  sprints: Sprint[] = [];

  // All issues from backend
  private allIssuesFromBackend: Issue[] = [];
  
  // Loading state
  isLoadingIssues = false;

  // View state managed by filters component
  currentView: 'sprints' | 'all-issues' = 'sprints';
  showCompletedSprints = false;
  selectedEpicFilter: string | null = null;

  // Helper to get sprints by status (with private issue filtering)
  get activeSprints(): Sprint[] {
    return this.sprints
      .filter(s => s.status === 'ACTIVE')
      .map(sprint => ({
        ...sprint,
        issues: this.filterPrivateIssues(sprint.issues || [])
      }));
  }

  get plannedSprints(): Sprint[] {
    return this.sprints
      .filter(s => s.status === 'PLANNED')
      .map(sprint => ({
        ...sprint,
        issues: this.filterPrivateIssues(sprint.issues || [])
      }));
  }

  get completedSprints(): Sprint[] {
    return this.sprints
      .filter(s => s.status === 'COMPLETED')
      .map(sprint => ({
        ...sprint,
        issues: this.filterPrivateIssues(sprint.issues || [])
      }));
  }

  // Get backlog issues excluding completed ones (with filters applied)
  get filteredBacklogIssues(): Issue[] {
    let issues = this.backlogIssues.filter(issue => issue.status !== 'DONE');
    
    // Filter private issues for customer users
    issues = this.filterPrivateIssues(issues);
    
    // Apply current filters if they exist
    if (this.currentFilterCriteria) {
      issues = this.filterIssues(issues, this.currentFilterCriteria);
      issues = this.sortIssues(issues, this.currentFilterCriteria.sort);
    }
    
    return issues;
  }

  // Get all issues from backend with filters applied
  get allIssues(): Issue[] {
    let issues: Issue[] = [];
    
    // Use backend data only - no fallback to dummy data
    if (this.allIssuesFromBackend.length > 0) {
      issues = this.allIssuesFromBackend;
    }
    
    // Filter private issues for customer users
    issues = this.filterPrivateIssues(issues);
    
    // Apply current filters if they exist
    if (this.currentFilterCriteria) {
      issues = this.filterIssues(issues, this.currentFilterCriteria);
      issues = this.sortIssues(issues, this.currentFilterCriteria.sort);
    }
    
    return issues;
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
    
    // Prepare initial fields with loading state for teams
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
        options: ['Planned', 'Active', 'Completed'], 
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
        options: ['Loading teams...'], // Initial loading state
        colSpan: 2
      }
    ];

    let teamIds: string[] = [];

    // Open modal immediately (don't wait for API)
    this.modalService.open({
      id: 'createSprint',
      title: 'Create Sprint',
      projectName: '',
      modalDesc: 'Plan your next sprint with AI-powered suggestions',
      fields,
      data: { 
        status: 'Planned',
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
        if (formData.teamId && formData.teamId !== 'Loading teams...' && formData.teamId !== 'No teams found') {
          const teamField = fields.find(f => f.model === 'teamId');
          if (teamField && teamField.options) {
            const selectedTeamIndex = teamField.options.indexOf(formData.teamId);
            actualTeamId = selectedTeamIndex >= 0 ? teamIds[selectedTeamIndex] : null;
          }
        }
        
        // Helper function to convert date to UTC ISO string
        const formatDateToUTC = (date: any): string | undefined => {
          if (!date) return undefined;
          const dateObj = typeof date === 'string' ? new Date(date) : date;
          return dateObj.toISOString();
        };
        
        // Store sprint data for later use - matching exact backend API structure
        this.currentSprintData = {
          projectId: projectId,
          sprintName: formData.sprintName,
          sprintGoal: formData.sprintGoal || null,
          teamAssigned: actualTeamId ? parseInt(actualTeamId) : null,
          startDate: formatDateToUTC(formData.startDate),
          dueDate: formatDateToUTC(formData.endDate),
          status: formData.status ? formData.status.toUpperCase() : 'PLANNED', // Backend expects UPPERCASE
          storyPoint: formData.targetStoryPoints ? parseInt(formData.targetStoryPoints) : 40
        };

        console.log('Sprint request payload:', this.currentSprintData);
        console.log('Sprint request JSON:', JSON.stringify(this.currentSprintData, null, 2));

        // Close the create sprint modal
        this.modalService.close();
        
        // Open AI modal and start loading
        this.isLoadingAISuggestions = true;
        this.isAIModalOpen = true;
        
        // Create the sprint first
        this.sprintService.createSprint(this.currentSprintData).subscribe({
          next: (sprintResponse) => {
            console.log('✅ Sprint created:', sprintResponse);
            console.log('✅ Sprint response structure:', JSON.stringify(sprintResponse, null, 2));
            const createdSprintId = sprintResponse.data.id;
            console.log('✅ Extracted Sprint ID:', createdSprintId);
            
            // Store the created sprint ID for later use
            this.currentSprintData.createdSprintId = createdSprintId;
            console.log('✅ Stored in currentSprintData:', this.currentSprintData);
            
            // Now call AI Planning API
            const aiRequest: AISprintPlanRequest = {
              sprintGoal: formData.sprintGoal || null,
              startDate: formatDateToUTC(formData.startDate),
              endDate: formatDateToUTC(formData.endDate),
              status: formData.status || 'PLANNED',
              targetStoryPoints: formData.targetStoryPoints ? parseInt(formData.targetStoryPoints) : 40,
              teamId: actualTeamId ? parseInt(actualTeamId) : null
            };

            this.sprintService.generateAISprintPlan(projectId, aiRequest).subscribe({
              next: (response) => {
                console.log('✅ AI Sprint Plan Response:', response);
                this.aiSuggestions = response.data.sprintPlan;
                this.isLoadingAISuggestions = false;
                this.cdr.detectChanges();
              },
              error: (error) => {
                console.error('❌ Error generating AI plan:', error);
                this.isLoadingAISuggestions = false;
                this.isAIModalOpen = false;
                this.toastService.error('Failed to generate AI sprint suggestions');
                this.cdr.detectChanges();
              }
            });
          },
          error: (error) => {
            console.error('❌ Error creating sprint:', error);
            this.isLoadingAISuggestions = false;
            this.isAIModalOpen = false;
            this.toastService.error('Failed to create sprint');
            this.cdr.detectChanges();
          }
        });
      }
    });

    // Fetch teams in background and update modal when ready
    this.sprintService.getTeamsByProject(projectId).subscribe({
      next: (response) => {
        console.log('📦 Teams V2 API Response:', response);
        
        let teamsData: any[] = [];
        
        // V2 API returns wrapped response: {succeeded: true, statusCode: 200, data: [...]}
        if (response && response.succeeded && Array.isArray(response.data)) {
          teamsData = response.data;
        } else if (Array.isArray(response)) {
          // Fallback for direct array response (legacy)
          teamsData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          // Alternative wrapped format
          teamsData = response.data;
        }
        
        console.log('👥 Processed teams data:', teamsData);
        
        // Handle empty teams case
        if (teamsData.length === 0) {
          console.warn('⚠️ No teams found for project');
        }
        
        const teamOptions = teamsData.length > 0 
          ? teamsData.map((team: any) => 
              `${team.name || team.teamName || 'Unnamed Team'}${team.members && team.members.length > 0 ? ' (' + team.members.length + ' members)' : ''}`
            )
          : ['No teams found'];
        
        teamIds = teamsData.map((team: any) => team.id || team.teamId || '');
        
        // Only update field options if modal is still open
        // Check if the modal hasn't been closed yet (sprint creation in progress)
        const teamField = fields.find(f => f.model === 'teamId');
        if (teamField && !this.isAIModalOpen) {
          // Modal is still open (AI modal hasn't opened yet), update the options
          teamField.options = teamOptions;
        }
      },
      error: (error) => {
        console.error('Error loading teams:', error);
        // Update the team field to show error state
        const teamField = fields.find(f => f.model === 'teamId');
        if (teamField) {
          teamField.options = ['Failed to load teams'];
        }
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
   * Close AI Sprint Modal
   */
  closeAIModal() {
    this.isAIModalOpen = false;
    this.aiSuggestions = null;
    // Delay clearing currentSprintData to allow commit event to process
    setTimeout(() => {
      this.currentSprintData = null;
    }, 100);
    this.cdr.detectChanges();
  }

  /**
   * Handle committing AI suggestions - assigns issues to the already-created sprint
   */
  handleCommitAISuggestions(commitData: { 
    sprintId: string; 
    issues: Array<{ issueId: string; assigneeId: number }> 
  }) {
    console.log('💾 Committing AI suggestions:', commitData);
    console.log('💾 currentSprintData:', this.currentSprintData);
    
    const { sprintId, issues } = commitData;
    
    if (!sprintId) {
      console.error('❌ Sprint ID not found in commit data');
      this.toastService.error('Sprint ID not found');
      return;
    }

    const projectId = this.currentProjectId;
    
    console.log('💾 Using Sprint ID:', sprintId);
    console.log('💾 Project ID:', projectId);
    console.log('💾 Number of issues to update:', issues.length);
    
    // Update selected issues to assign them to the sprint and update assignee in background
    if (issues.length > 0) {
      // Use V2 endpoint to update sprintId and assigneeId fields
      const updateRequests = issues.map(issue => {
        const updatePayload: any = { 
          sprintId: sprintId
        };
        
        // Only add assigneeId if it's a valid number
        if (issue.assigneeId && issue.assigneeId > 0) {
          updatePayload.assigneeId = issue.assigneeId;
        }
        
        console.log(`📝 Creating update request for issue ${issue.issueId}:`, updatePayload);
        return this.issueService.updateIssueV2(issue.issueId, updatePayload);
      });
      
      console.log('📤 Sending', updateRequests.length, 'update requests...');
      
      forkJoin(updateRequests).subscribe({
        next: (responses) => {
          console.log('✅ All issues assigned to sprint. Responses:', responses);
          this.toastService.success('Issue(s) successfully added to the sprint');
          this.loadSprints(projectId);
          this.loadProjectIssues(projectId);
        },
        error: (error) => {
          console.error('❌ Error assigning issues:', error);
          console.error('❌ Error details:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            error: error.error
          });
          this.toastService.error('Failed to add issues to the sprint');
          this.loadSprints(projectId);
          this.loadProjectIssues(projectId);
        }
      });
    } else {
      console.warn('⚠️ No issues were selected');
      this.toastService.info('No issues were selected');
      this.loadSprints(projectId);
      this.loadProjectIssues(projectId);
    }
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
    const sprint = this.sprints.find(s => s.id === sprintId);
    if (!sprint) {
      console.error(`Sprint not found: ${sprintId}`);
      return;
    }

    // Show custom confirmation modal
    this.modalService.open({
      id: 'confirmStartSprint',
      title: 'Start Sprint',
      modalDesc: `Are you sure you want to start "${sprint.name}"? This will move the sprint to Active status.`,
      fields: [],
      submitText: 'Start',
      showLabels: false,
      onSubmit: () => {
        const projectId = this.projectContextService.getCurrentProjectId() || sessionStorage.getItem('projectId');
        if (!projectId) {
          this.toastService.error('Project ID not found');
          return;
        }

        // Prepare update request with ACTIVE status
        const formatDateToUTC = (date: Date | undefined): string | undefined => {
          if (!date) return undefined;
          return new Date(date).toISOString();
        };

        // Match exact backend API structure
        const sprintRequest: any = {
          id: sprintId, // Backend expects "id" not "sprintId"
          projectId: projectId,
          sprintName: sprint.name,
          sprintGoal: sprint.sprintGoal || null,
          teamAssigned: sprint.teamId ? parseInt(String(sprint.teamId)) : null,
          startDate: formatDateToUTC(sprint.startDate),
          dueDate: formatDateToUTC(sprint.endDate),
          status: 'ACTIVE', // Backend expects UPPERCASE
          storyPoint: sprint.storyPoint || 0
        };

        console.log('Starting sprint:', sprintId, sprintRequest);
        this.toastService.info('Starting sprint...');

        this.sprintService.updateSprint(sprintId, sprintRequest).subscribe({
          next: (response) => {
            console.log('Sprint started successfully:', response);
            this.toastService.success(`Sprint "${sprint.name}" started successfully!`);
            this.modalService.close();
            // Reload sprints to get updated data from backend and reorganize
            if (projectId) {
              this.loadSprints(projectId);
            }
            // Trigger change detection
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error starting sprint:', error);
            this.toastService.error(error.error?.message || 'Failed to start sprint. Please try again.');
          }
        });
      }
    });
  }

  handleComplete(sprintId: string): void {
    const sprint = this.sprints.find(s => s.id === sprintId);
    if (!sprint) {
      console.error(`Sprint not found: ${sprintId}`);
      return;
    }

    const projectId = this.projectContextService.getCurrentProjectId() || sessionStorage.getItem('projectId');
    if (!projectId) {
      this.toastService.error('Project ID not found');
      return;
    }

    // Check for unfinished issues (status !== 'DONE')
    const unfinishedIssues = sprint.issues?.filter(issue => issue.status !== 'DONE') || [];
    const hasUnfinishedIssues = unfinishedIssues.length > 0;

    if (hasUnfinishedIssues) {
      // Get list of planned sprints for the dropdown
      const plannedSprintsList = this.sprints
        .filter(s => s.status === 'PLANNED' && s.id !== sprintId)
        .map(s => s.name);

      // Show modal to let user choose where to move unfinished issues
      this.modalService.open({
        id: 'confirmCompleteSprint',
        title: 'Unfinished Issues Detected',
        modalDesc: `Sprint "${sprint.name}" has ${unfinishedIssues.length} unfinished issue(s). Where would you like to move them?`,
        fields: [
          {
            label: 'Move Issues To',
            model: 'destination',
            type: 'select',
            required: true,
            options: [
              'Backlog',
              ...(plannedSprintsList.length > 0 ? plannedSprintsList : ['No planned sprints available'])
            ]
          }
        ],
        data: {
          destination: 'Backlog'
        },
        submitText: 'Complete Sprint',
        showLabels: true,
        onSubmit: (formData: any) => {
          const destination = formData.destination;
          
          if (destination === 'Backlog') {
            // Move to backlog (set sprintId to null)
            this.moveUnfinishedIssuesAndComplete(sprintId, projectId, sprint, unfinishedIssues, null, 'Backlog');
          } else if (destination !== 'No planned sprints available') {
            // Move to selected planned sprint
            const targetSprint = this.sprints.find(s => s.name === destination && s.status === 'PLANNED');
            if (targetSprint) {
              this.moveUnfinishedIssuesAndComplete(sprintId, projectId, sprint, unfinishedIssues, targetSprint.id, targetSprint.name);
            } else {
              this.toastService.error('Selected sprint not found');
            }
          } else {
            this.toastService.error('Please select a valid destination');
          }
        }
      });
    } else {
      // No unfinished issues, directly complete the sprint
      this.completeSprintDirectly(sprintId, projectId, sprint);
    }
  }

  /**
   * Move unfinished issues to a destination (backlog or another sprint) and then complete the sprint
   */
  private moveUnfinishedIssuesAndComplete(
    sprintId: string, 
    projectId: string, 
    sprint: Sprint, 
    unfinishedIssues: Issue[], 
    destinationSprintId: string | null,
    destinationName: string
  ): void {
    this.toastService.info(`Moving ${unfinishedIssues.length} unfinished issue(s) to ${destinationName}...`);

    // Update sprint ID for all unfinished issues using the v2 API
    const updateObservables = unfinishedIssues.map(issue => {
      return this.issueService.updateIssueV2(issue.id, {
        sprintId: destinationSprintId // null for backlog, or target sprint ID
      });
    });

    // Use forkJoin to wait for all issue updates to complete
    forkJoin(updateObservables).subscribe({
      next: (responses) => {
        console.log(`✅ All unfinished issues moved to ${destinationName}:`, responses);
        this.toastService.success(`${unfinishedIssues.length} issue(s) moved to ${destinationName}`);
        
        // Now complete the sprint
        this.completeSprintDirectly(sprintId, projectId, sprint);
      },
      error: (error) => {
        console.error('❌ Error moving issues:', error);
        this.toastService.error('Failed to move some issues. Please try again.');
      }
    });
  }

  /**
   * Move unfinished issues to a destination and then update sprint with new data (used during edit)
   */
  private moveUnfinishedIssuesAndUpdateSprint(
    sprintId: string, 
    projectId: string, 
    sprint: Sprint, 
    unfinishedIssues: Issue[], 
    destinationSprintId: string | null,
    destinationName: string,
    formData: any,
    teamsDataMap?: Map<string, number>
  ): void {
    this.toastService.info(`Moving ${unfinishedIssues.length} unfinished issue(s) to ${destinationName}...`);

    // Update sprint ID for all unfinished issues using the v2 API
    const updateObservables = unfinishedIssues.map(issue => {
      return this.issueService.updateIssueV2(issue.id, {
        sprintId: destinationSprintId // null for backlog, or target sprint ID
      });
    });

    // Use forkJoin to wait for all issue updates to complete
    forkJoin(updateObservables).subscribe({
      next: (responses) => {
        console.log(`✅ All unfinished issues moved to ${destinationName}:`, responses);
        this.toastService.success(`${unfinishedIssues.length} issue(s) moved to ${destinationName}`);
        
        // Now update the sprint with the form data (which includes status change to COMPLETED)
        this.performSprintUpdate(sprintId, projectId, formData, teamsDataMap);
      },
      error: (error) => {
        console.error('❌ Error moving issues:', error);
        this.toastService.error('Failed to move some issues. Please try again.');
      }
    });
  }

  /**
   * Perform the actual sprint update API call (extracted for reuse)
   */
  private performSprintUpdate(sprintId: string, projectId: string, formData: any, teamsDataMap?: Map<string, number>): void {
    // Convert date strings to ISO 8601 UTC format for PostgreSQL
    const formatDateToUTC = (dateString: string): string => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString();
    };

    // Convert team name to team ID using the map
    let teamId: number | null = null;
    if (formData.teamAssigned && teamsDataMap) {
      teamId = teamsDataMap.get(formData.teamAssigned) || null;
    }

    // Convert status to UPPERCASE
    let statusUpperCase = 'PLANNED';
    if (formData.status) {
      statusUpperCase = formData.status.toUpperCase();
    }

    const sprintRequest: any = {
      id: sprintId,
      projectId: projectId,
      sprintName: formData.sprintName,
      sprintGoal: formData.sprintGoal || null,
      teamAssigned: teamId,
      startDate: formData.startDate ? formatDateToUTC(formData.startDate) : undefined,
      dueDate: formData.dueDate ? formatDateToUTC(formData.dueDate) : undefined,
      status: statusUpperCase,
      storyPoint: formData.storyPoint || 0
    };

    console.log('🔧 Update Sprint Request:', sprintRequest);
    this.toastService.info('Updating sprint...');

    this.sprintService.updateSprint(sprintId, sprintRequest).subscribe({
      next: (response) => {
        console.log('Sprint updated successfully:', response);
        this.toastService.success('Sprint updated successfully!');
        
        // Close the modal
        this.modalService.close();
        
        // Reload sprints to get updated data from backend
        if (projectId) {
          this.loadSprints(projectId);
        }
        // Trigger change detection
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error updating sprint:', error);
        this.toastService.error(error.error?.message || 'Failed to update sprint. Please try again.');
      }
    });
  }

  private completeSprintDirectly(sprintId: string, projectId: string, sprint: Sprint): void {
    const formatDateToUTC = (date: Date | undefined): string | undefined => {
      if (!date) return undefined;
      return new Date(date).toISOString();
    };

    // Match exact backend API structure
    const sprintRequest: any = {
      id: sprintId, // Backend expects "id" not "sprintId"
      projectId: projectId,
      sprintName: sprint.name,
      sprintGoal: sprint.sprintGoal || null,
      teamAssigned: sprint.teamId ? parseInt(String(sprint.teamId)) : null,
      startDate: formatDateToUTC(sprint.startDate),
      dueDate: formatDateToUTC(sprint.endDate),
      status: 'COMPLETED', // Backend expects UPPERCASE
      storyPoint: sprint.storyPoint || 0
    };

    console.log('Completing sprint:', sprintId, sprintRequest);
    this.toastService.info('Completing sprint...');

    this.sprintService.updateSprint(sprintId, sprintRequest).subscribe({
      next: (response) => {
        console.log('Sprint completed successfully:', response);
        this.toastService.success(`Sprint "${sprint.name}" completed successfully!`);
        this.modalService.close();
        
        // Reload sprints to get updated data from backend and reorganize
        if (projectId) {
          this.loadSprints(projectId);
        }
        // Trigger change detection
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error completing sprint:', error);
        this.toastService.error(error.error?.message || 'Failed to complete sprint. Please try again.');
      }
    });
  }

  handleEdit(sprintId: string): void {
    // Look for sprint in both active/planned sprints and completed sprints
    let sprint = this.sprints.find(s => s.id === sprintId);
    if (!sprint) {
      sprint = this.completedSprints.find(s => s.id === sprintId);
    }
    if (!sprint) {
      console.error(`Sprint not found: ${sprintId}`);
      return;
    }

    const projectId = this.currentProjectId;
    
    // Derive extra info dynamically (goal, story points, etc.)
    const totalStoryPoints = sprint.issues?.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0) || 0;
    const sprintGoal = sprint.sprintGoal || 'Refine sprint goals and deliver planned issues';

    const sprintFields: FormField[] = [
      { label: 'Sprint Name', type: 'text', model: 'sprintName', colSpan: 2, required: true },
      { label: 'Sprint Goal', type: 'textarea', model: 'sprintGoal', colSpan: 2 },
      { label: 'Team Assigned', type: 'select', model: 'teamAssigned', options: ['Loading teams...'], colSpan: 2, required: false },
      { label: 'Start Date', type: 'date', model: 'startDate', colSpan: 1 },
      { label: 'Due Date', type: 'date', model: 'dueDate', colSpan: 1 },
      { label: 'Status', type: 'select', model: 'status', options: ['Planned', 'Active', 'Completed'], colSpan: 1 },
      { label: 'Story Point (Total)', type: 'number', model: 'storyPoint', colSpan: 1 },
    ];

    // Map internal status format (UPPERCASE) to display format (Title Case) for the modal
    let statusDisplay = 'Planned';
    switch (sprint.status) {
      case 'PLANNED': statusDisplay = 'Planned'; break;
      case 'ACTIVE': statusDisplay = 'Active'; break;
      case 'COMPLETED': statusDisplay = 'Completed'; break;
      default: statusDisplay = 'Planned'; break;
    }

    // Store teams data for later lookup
    const teamsDataMap: Map<string, number> = new Map(); // team name -> team id

    // First, fetch teams to get the current team name
    this.sprintService.getTeamsByProject(projectId).subscribe({
      next: (response) => {
        let teamsData: any[] = [];
        if (response && response.succeeded && Array.isArray(response.data)) {
          teamsData = response.data;
        } else if (Array.isArray(response)) {
          teamsData = response;
        }
        
        // Build team name to ID map
        teamsData.forEach((team: any) => {
          const teamName = team.name || team.teamName || 'Unnamed Team';
          const teamId = team.id || team.teamId;
          teamsDataMap.set(teamName, teamId);
        });

        // Find current team name
        let currentTeamName = '';
        if (sprint.teamId) {
          const currentTeam = teamsData.find((team: any) => (team.id || team.teamId) === sprint.teamId);
          currentTeamName = currentTeam ? (currentTeam.name || currentTeam.teamName || '') : '';
        }
        
        const teamOptions = teamsData.length > 0 
          ? teamsData.map((team: any) => team.name || team.teamName || 'Unnamed Team')
          : ['No teams found'];
        
        // Update team field options
        const teamField = sprintFields.find(f => f.model === 'teamAssigned');
        if (teamField) {
          teamField.options = teamOptions;
        }

        // Now open modal with correct team name
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
            status: statusDisplay,
            storyPoint: totalStoryPoints,
            teamAssigned: currentTeamName,
          },
          showLabels: false,
          submitText: 'Save Changes',
          onSubmit: (formData: any) => {
            this.updateSprintApi(sprintId, formData, teamsDataMap);
          }
        });
      },
      error: (error) => {
        console.error('Error loading teams:', error);
        const teamField = sprintFields.find(f => f.model === 'teamAssigned');
        if (teamField) {
          teamField.options = ['Failed to load teams'];
        }
      }
    });
  }

  /**
   * Update sprint via API
   */
  private updateSprintApi(sprintId: string, formData: any, teamsDataMap?: Map<string, number>): void {
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

    // Convert team name to team ID using the map
    let teamId: number | null = null;
    if (formData.teamAssigned && teamsDataMap) {
      teamId = teamsDataMap.get(formData.teamAssigned) || null;
      console.log('🔍 Team lookup:', { 
        teamName: formData.teamAssigned, 
        teamId, 
        availableTeams: Array.from(teamsDataMap.keys()) 
      });
    }

    // Match exact backend API structure
    // Convert status from Title Case (Planned) to UPPERCASE (PLANNED)
    let statusUpperCase = 'PLANNED';
    if (formData.status) {
      statusUpperCase = formData.status.toUpperCase();
    }

    // Check if status is being changed to COMPLETED
    const sprint = this.sprints.find(s => s.id === sprintId);
    if (statusUpperCase === 'COMPLETED' && sprint) {
      // Check for unfinished issues (status !== 'DONE')
      const unfinishedIssues = sprint.issues?.filter(issue => issue.status !== 'DONE') || [];
      
      if (unfinishedIssues.length > 0) {
        // Close the edit modal first
        this.modalService.close();
        
        // Get list of planned sprints for the dropdown
        const plannedSprintsList = this.sprints
          .filter(s => s.status === 'PLANNED' && s.id !== sprintId)
          .map(s => s.name);

        // Show modal to let user choose where to move unfinished issues
        this.modalService.open({
          id: 'confirmCompleteSprintViaEdit',
          title: 'Unfinished Issues Detected',
          modalDesc: `Sprint "${sprint.name}" has ${unfinishedIssues.length} unfinished issue(s). Where would you like to move them before completing?`,
          fields: [
            {
              label: 'Move Issues To',
              model: 'destination',
              type: 'select',
              required: true,
              options: [
                'Backlog',
                ...(plannedSprintsList.length > 0 ? plannedSprintsList : ['No planned sprints available'])
              ]
            }
          ],
          data: {
            destination: 'Backlog'
          },
          submitText: 'Complete Sprint',
          showLabels: true,
          onSubmit: (moveData: any) => {
            const destination = moveData.destination;
            
            if (destination === 'Backlog') {
              // Move to backlog (set sprintId to null) and then update sprint status
              this.moveUnfinishedIssuesAndUpdateSprint(sprintId, projectId, sprint, unfinishedIssues, null, 'Backlog', formData, teamsDataMap);
            } else if (destination !== 'No planned sprints available') {
              // Move to selected planned sprint and then update sprint status
              const targetSprint = this.sprints.find(s => s.name === destination && s.status === 'PLANNED');
              if (targetSprint) {
                this.moveUnfinishedIssuesAndUpdateSprint(sprintId, projectId, sprint, unfinishedIssues, targetSprint.id, targetSprint.name, formData, teamsDataMap);
              } else {
                this.toastService.error('Selected sprint not found');
              }
            } else {
              this.toastService.error('Please select a valid destination');
            }
          }
        });
        return; // Stop the normal update flow
      }
    }

    // No unfinished issues or status is not COMPLETED, proceed with normal update
    this.performSprintUpdate(sprintId, projectId, formData, teamsDataMap);
  }



  handleDelete(sprintId: string): void {
    console.log('Delete sprint:', sprintId);
    
    // Find the sprint to show its name in the confirmation
    const sprint = [...this.sprints, ...this.completedSprints].find(s => s.id === sprintId);
    const sprintName = sprint ? sprint.name : 'this sprint';
    
    // Show custom confirmation modal
    this.modalService.open({
      id: 'confirmDeleteSprint',
      title: 'Delete Sprint',
      modalDesc: `Are you sure you want to delete sprint "${sprintName}"? This action cannot be undone.`,
      fields: [],
      submitText: 'Delete',
      showLabels: false,
      onSubmit: () => {
        console.log('[BacklogPage] Deleting sprint:', sprintId);
        this.toastService.info('Deleting sprint...');

        this.sprintService.deleteSprint(sprintId).subscribe({
          next: (response) => {
            console.log('[BacklogPage] Sprint deleted successfully:', response);
            this.toastService.success('Sprint deleted successfully!');
            this.modalService.close();
            
            // Remove sprint from local state (completedSprints getter will auto-update)
            this.sprints = this.sprints.filter(s => s.id !== sprintId);
            
            // Trigger change detection
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('[BacklogPage] Failed to delete sprint:', error);
            this.toastService.error(error.error?.message || 'Failed to delete sprint. Please try again.');
          }
        });
      }
    });
  }

  // Store current filter criteria
  private currentFilterCriteria: FilterCriteria | null = null;

  onFiltersChanged(criteria: FilterCriteria): void {
    console.log('Filters changed:', criteria);
    
    // Store filter criteria for use in filtering methods
    this.currentFilterCriteria = criteria;
    
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
    
    // Apply filters and sorting to issues
    this.applyFiltersAndSorting();
  }
  
  /**
   * Apply all filter criteria and sorting to issues
   */
  private applyFiltersAndSorting(): void {
    if (!this.currentFilterCriteria) return;
    
    const criteria = this.currentFilterCriteria;
    
    // Re-organize sprints with filtered and sorted issues
    if (this.allIssuesFromBackend.length > 0) {
      // Filter issues first
      let filteredIssues = this.filterIssues(this.allIssuesFromBackend, criteria);
      
      // Sort issues
      filteredIssues = this.sortIssues(filteredIssues, criteria.sort);
      
      // Re-organize sprints with filtered issues
      this.organizeSprints(filteredIssues);
    }
    
    // Trigger change detection
    this.cdr.detectChanges();
  }
  
  /**
   * Filter private issues for customer users
   * Private issues are those with a 'private' label and should be hidden from customers
   */
  private filterPrivateIssues(issues: Issue[]): Issue[] {
    // If user is not a customer, return all issues
    if (!this.permissionService.isCustomer()) {
      return issues;
    }

    // Filter out issues with 'private' label for customer users
    return issues.filter(issue => {
      // Get labels array (could be string array or Label objects)
      const labels = issue.labels || [];
      
      // Check if issue has 'private' label
      const hasPrivateLabel = labels.some(label => {
        if (typeof label === 'string') {
          return label.toLowerCase() === 'private';
        } else if (label && typeof label === 'object' && 'name' in label) {
          // Label object with name property
          return (label as any).name?.toLowerCase() === 'private';
        }
        return false;
      });

      // Return true (include issue) if it doesn't have private label
      return !hasPrivateLabel;
    });
  }

  /**
   * Filter issues based on filter criteria
   */
  private filterIssues(issues: Issue[], criteria: FilterCriteria): Issue[] {
    let filtered = [...issues];
    
    // Search text filter - searches in title, description, key
    if (criteria.searchText && criteria.searchText.trim()) {
      const searchLower = criteria.searchText.toLowerCase().trim();
      filtered = filtered.filter(issue => 
        (issue.title?.toLowerCase().includes(searchLower)) ||
        (issue.description?.toLowerCase().includes(searchLower)) ||
        (issue.key?.toLowerCase().includes(searchLower))
      );
    }
    
    // Quick filters
    if (criteria.quickFilter) {
      switch (criteria.quickFilter) {
        case 'assigned-to-me':
          // Filter issues assigned to current user
          filtered = filtered.filter(issue => 
            issue.assigneeName === criteria.currentUserName ||
            issue.assignee === criteria.currentUserName ||
            (criteria.currentUserId && issue.assigneeId?.toString() === criteria.currentUserId)
          );
          break;
          
        case 'recent':
          // Filter issues updated in last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          filtered = filtered.filter(issue => {
            const updatedDate = issue.updatedAt ? new Date(issue.updatedAt) : null;
            return updatedDate && updatedDate >= sevenDaysAgo;
          });
          break;
          
        case 'my-open':
          // Filter issues assigned to current user that are not done
          filtered = filtered.filter(issue => {
            const isAssignedToMe = issue.assigneeName === criteria.currentUserName ||
              issue.assignee === criteria.currentUserName ||
              (criteria.currentUserId && issue.assigneeId?.toString() === criteria.currentUserId);
            const isNotDone = issue.status !== 'DONE' && issue.statusId !== 4;
            return isAssignedToMe && isNotDone;
          });
          break;
          
        case 'unassigned':
          // Filter unassigned issues
          filtered = filtered.filter(issue => 
            !issue.assignee && !issue.assigneeName && !issue.assigneeId
          );
          break;
      }
    }
    
    // Type filter
    if (criteria.type) {
      filtered = filtered.filter(issue => 
        issue.type === criteria.type || issue.issueType === criteria.type
      );
    }
    
    // Priority filter
    if (criteria.priority) {
      filtered = filtered.filter(issue => issue.priority === criteria.priority);
    }
    
    // Status filter
    if (criteria.status) {
      filtered = filtered.filter(issue => issue.status === criteria.status);
    }
    
    // Assignee filter (multi-select)
    if (criteria.assignees && criteria.assignees.length > 0) {
      filtered = filtered.filter(issue => 
        criteria.assignees.includes(issue.assignee || '') ||
        criteria.assignees.includes(issue.assigneeName || '')
      );
    }
    
    // Epic filter
    if (criteria.epicId) {
      filtered = filtered.filter(issue => issue.epicId === criteria.epicId);
    }
    
    return filtered;
  }
  
  /**
   * Sort issues based on sort criteria
   */
  private sortIssues(issues: Issue[], sortBy: string): Issue[] {
    const sorted = [...issues];
    
    switch (sortBy) {
      case 'Recently Updated':
        sorted.sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA; // Most recent first
        });
        break;
        
      case 'Recently Created':
        sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Most recent first
        });
        break;
        
      case 'Issue Key (A-Z)':
        sorted.sort((a, b) => {
          const keyA = a.key || '';
          const keyB = b.key || '';
          return keyA.localeCompare(keyB);
        });
        break;
        
      case 'Issue Key (Z-A)':
        sorted.sort((a, b) => {
          const keyA = a.key || '';
          const keyB = b.key || '';
          return keyB.localeCompare(keyA);
        });
        break;
        
      case 'Story Points':
        sorted.sort((a, b) => {
          const pointsA = a.storyPoints || 0;
          const pointsB = b.storyPoints || 0;
          return pointsB - pointsA; // Highest first
        });
        break;
    }
    
    return sorted;
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
      movedIssue = { ...this.backlogIssues[backlogIndex] };
      sourceSprintId = null; // Coming from backlog
    }

    // Search in sprints if not found in backlog
    if (!movedIssue) {
      for (const sprint of this.sprints) {
        if (sprint.issues) {
          const issueIndex = sprint.issues.findIndex(i => i.id === issueId);
          if (issueIndex !== -1) {
            movedIssue = { ...sprint.issues[issueIndex] };
            sourceSprintId = sprint.id;
            break;
          }
        }
      }
    }

    if (!movedIssue) {
      console.error(`Issue ${issueId} not found`);
      this.toastService.error('Issue not found');
      return;
    }

    // Don't move if source and destination are the same
    if (sourceSprintId === destinationSprintId) {
      console.log('Issue is already in the target location');
      return;
    }

    // Show loading toast
    const sourceName = sourceSprintId ? this.sprints.find(s => s.id === sourceSprintId)?.name : 'Backlog';
    const destName = destinationSprintId ? this.sprints.find(s => s.id === destinationSprintId)?.name : 'Backlog';
    this.toastService.info(`Moving issue from ${sourceName} to ${destName}...`);

    // Call backend API to update the issue's sprintId using V2 endpoint
    const updatePayload: any = {
      sprintId: destinationSprintId || null // null for backlog, sprintId for sprint
    };

    console.log('🔄 Updating issue sprintId via API:', { issueId, updatePayload });

    this.issueService.updateIssueV2(issueId, updatePayload).subscribe({
      next: (response) => {
        console.log('✅ Issue sprintId updated successfully in backend:', response);
        
        // Update local state after successful backend update
        // Remove from source
        if (sourceSprintId) {
          const sourceSprint = this.sprints.find(s => s.id === sourceSprintId);
          if (sourceSprint && sourceSprint.issues) {
            sourceSprint.issues = sourceSprint.issues.filter(i => i.id !== issueId);
          }
        } else {
          this.backlogIssues = this.backlogIssues.filter(i => i.id !== issueId);
        }

        // Update the issue's sprintId and timestamp
        movedIssue!.sprintId = destinationSprintId || undefined;
        movedIssue!.updatedAt = new Date();

        // Add to destination
        if (destinationSprintId) {
          const targetSprint = this.sprints.find(s => s.id === destinationSprintId);
          if (targetSprint) {
            if (!targetSprint.issues) {
              targetSprint.issues = [];
            }
            targetSprint.issues = [...targetSprint.issues, movedIssue!];
          }
        } else {
          this.backlogIssues = [...this.backlogIssues, movedIssue!];
        }

        this.toastService.success(`Issue moved to ${destName} successfully!`);
        console.log(`✅ Issue ${issueId} moved successfully from ${sourceName} to ${destName}`);
        
        // Trigger change detection
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error updating issue sprintId:', error);
        this.toastService.error('Failed to move issue. Please try again.');
        
        // Local state remains unchanged on error, so no need to revert
      }
    });
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
    console.log('✅ [BacklogPage] Epic created and detail view opened:', newEpic);
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
    console.log('✅ [BacklogPage] Epic updated:', updatedEpic);
  }

  /**
   * Handle epic deletion
   */
  onEpicDeleted(epicId: string): void {
    // Remove epic from the list
    this.epics = this.epics.filter(e => e.id !== epicId);
    // Close the detail view
    this.selectedEpic = null;
    // Show success message
    this.toastService.success('Epic deleted successfully');
    console.log('✅ [BacklogPage] Epic deleted:', epicId);
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

  ngOnInit(): void {
    // Set project context from route params
    const projectId = this.route.parent?.snapshot.paramMap.get('projectId');
    if (projectId) {
      this.projectContextService.setCurrentProjectId(projectId);
      // Load sprints, issues, epics, and members from backend
      this.loadSprints(projectId);
      this.loadProjectIssues(projectId);
      this.loadEpics(projectId);
      this.loadProjectMembers(projectId);
    } else {
      // Try to get projectId from session storage as fallback
      const storedProjectId = sessionStorage.getItem('projectId');
      if (storedProjectId) {
        this.projectContextService.setCurrentProjectId(storedProjectId);
        this.loadSprints(storedProjectId);
        this.loadProjectIssues(storedProjectId);
        this.loadEpics(storedProjectId);
        this.loadProjectMembers(storedProjectId);
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
          // Normalize status to uppercase for consistency
          this.sprints = response.data.map(sprintData => ({
            id: sprintData.id,
            projectId: sprintData.projectId,
            name: sprintData.name,
            sprintGoal: sprintData.sprintGoal,
            startDate: new Date(sprintData.startDate),
            endDate: new Date(sprintData.dueDate),
            status: (sprintData.status || 'PLANNED').toUpperCase() as 'ACTIVE' | 'COMPLETED' | 'PLANNED',
            storyPoint: sprintData.storyPoint,
            teamId: sprintData.teamId,
            issues: [], // Will be populated by organizeSprints
            createdAt: new Date(sprintData.createdAt),
            updatedAt: sprintData.updatedAt ? new Date(sprintData.updatedAt) : null
          }));
          
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
        // Sprints remain empty on error
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
        this.isLoadingIssues = false;
      },
      error: (error) => {
        console.error('Failed to load issues:', error);
        this.toastService.error('Failed to load issues from backend');
        this.isLoadingIssues = false;
        // Issues remain empty on error
      }
    });
  }

  /**
   * Load all epics for the current project from backend
   */
  private loadEpics(projectId: string): void {
    this.isLoadingEpics = true;
    this.epicService.getAllEpicsByProject(projectId).subscribe({
      next: (epics) => {
        console.log('✅ [BacklogPage] Loaded epics from backend:', epics);
        this.epics = epics.map(epic => ({
          ...epic,
          isExpanded: false
        }));
        this.isLoadingEpics = false;
      },
      error: (error) => {
        console.error('❌ [BacklogPage] Failed to load epics:', error);
        this.toastService.error('Failed to load epics from backend');
        this.isLoadingEpics = false;
        this.epics = []; // Clear epics on error
      }
    });
  }
  
  /**
   * Load all project members for filter dropdown
   */
  private loadProjectMembers(projectId: string): void {
    this.isLoadingMembers = true;
    this.inlineEditService.getProjectMembers(projectId).subscribe({
      next: (members) => {
        console.log('✅ [BacklogPage] Loaded project members:', members);
        this.projectMembers = members;
        this.isLoadingMembers = false;
      },
      error: (error) => {
        console.error('❌ [BacklogPage] Failed to load project members:', error);
        this.isLoadingMembers = false;
        this.projectMembers = []; // Clear members on error
      }
    });
  }

  /**
   * Organize issues into sprints based on sprintId
   * This method updates the sprints with their respective issues
   * Issues without sprintId are added to backlog
   * Note: This method now receives already filtered issues
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
      // Fix ExpressionChangedAfterItHasBeenCheckedError
      this.cdr.detectChanges();
  }
}
