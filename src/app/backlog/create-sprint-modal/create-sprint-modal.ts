import { Component, EventEmitter, Input, Output, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  SprintService, 
  Team, 
  AISprintPlanRequest, 
  AISprintPlanIssue,
  SprintRequest
} from '../../sprint/sprint.service';
import { ToastService } from '../../shared/services/toast.service';

/**
 * Modal state enum
 */
enum ModalState {
  FORM = 'form',
  AI_LOADING = 'ai_loading',
  AI_RESULTS = 'ai_results'
}

/**
 * Form data interface
 */
interface SprintFormData {
  sprintName: string;
  sprintGoal: string;
  startDate: string;
  endDate: string;
  targetStoryPoints: number;
  teamId: string;
  status: string;
}

@Component({
  selector: 'app-create-sprint-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-sprint-modal.html',
  styleUrls: ['./create-sprint-modal.css']
})
export class CreateSprintModal implements OnInit {
  @Input() isOpen = false;
  
  /**
   * TODO: IMPORTANT - Currently hardcoded projectId
   * This should be fetched from URL route parameters in the future:
   * Example: /projects/:projectId/backlog
   * 
   * Implementation steps:
   * 1. Inject ActivatedRoute in constructor
   * 2. Get projectId from route params: this.route.parent?.snapshot.paramMap.get('projectId')
   * 3. Pass projectId from BacklogPage component via @Input
   * 
   * Current hardcoded value: f3a2b1c4-9f6d-4e1a-9b89-7b2f3c8d9a01
   */
  @Input() projectId = 'f3a2b1c4-9f6d-4e1a-9b89-7b2f3c8d9a01';
  
  @Output() close = new EventEmitter<void>();
  @Output() sprintCreated = new EventEmitter<any>();

  // Modal state management
  currentState = signal<ModalState>(ModalState.FORM);
  ModalState = ModalState; // Expose enum to template

  // Form data
  formData: SprintFormData = {
    sprintName: '',
    sprintGoal: '',
    startDate: '',
    endDate: '',
    targetStoryPoints: 40,
    teamId: '',
    status: 'PLANNED'
  };

  // Teams data
  teams: Team[] = [];
  isLoadingTeams = false;

  // AI suggestions
  aiSuggestions: AISprintPlanIssue[] = [];
  aiSummary = '';
  createdSprintId: string | null = null;

  // Status options
  statusOptions = ['PLANNED', 'ACTIVE', 'COMPLETED'];

  constructor(
    private sprintService: SprintService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.isOpen) {
      this.loadTeams();
    }
  }

  /**
   * Watch for modal open changes
   */
  ngOnChanges(): void {
    if (this.isOpen && this.teams.length === 0) {
      this.loadTeams();
    }
  }

  /**
   * Load teams for the project
   * 
   * TODO: projectId is currently hardcoded (see class property above)
   */
  private loadTeams(): void {
    this.isLoadingTeams = true;
    console.log('🔍 [LoadTeams] Starting to load teams for projectId:', this.projectId);
    
    this.sprintService.getTeamsByProject(this.projectId).subscribe({
      next: (response) => {
        console.log('✅ [LoadTeams] API Response received:', response);
        
        // Handle both response formats:
        // 1. Array directly: [{teamName: 'Frontend Squad', ...}, ...]
        // 2. Wrapped in object: {succeeded: true, data: [...]}
        let teamsData: any[] = [];
        
        if (Array.isArray(response)) {
          // Backend returned array directly
          teamsData = response;
          console.log('✅ [LoadTeams] Received direct array response');
        } else if (response && response.data && Array.isArray(response.data)) {
          // Backend returned wrapped response
          teamsData = response.data;
          console.log('✅ [LoadTeams] Received wrapped response');
        } else {
          console.error('❌ [LoadTeams] Unexpected response format:', response);
          this.toastService.error('Unexpected teams data format');
          this.isLoadingTeams = false;
          this.cdr.detectChanges(); // Trigger change detection
          return;
        }
        
        // Map backend team format to frontend format
        this.teams = teamsData.map((team: any) => ({
          id: team.teamId || team.id || '',
          name: team.teamName || team.name || 'Unnamed Team',
          members: team.members || []
        }));
        
        console.log(`✅ [LoadTeams] Successfully loaded ${this.teams.length} teams:`, this.teams);
        this.isLoadingTeams = false;
        
        // Manually trigger change detection to update the dropdown
        this.cdr.detectChanges();
        console.log('🔄 [LoadTeams] Change detection triggered');
      },
      error: (error) => {
        console.error('❌ [LoadTeams] Error loading teams:', error);
        console.error('❌ [LoadTeams] Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        this.toastService.error(`Failed to load teams: ${error.status} ${error.statusText}`);
        this.isLoadingTeams = false;
        this.cdr.detectChanges(); // Trigger change detection even on error
      }
    });
  }

  /**
   * Validate form data
   */
  private validateForm(): boolean {
    if (!this.formData.sprintName.trim()) {
      this.toastService.error('Sprint name is required');
      return false;
    }

    if (!this.formData.startDate) {
      this.toastService.error('Start date is required');
      return false;
    }

    if (!this.formData.endDate) {
      this.toastService.error('End date is required');
      return false;
    }

    // Validate date range
    const startDate = new Date(this.formData.startDate);
    const endDate = new Date(this.formData.endDate);

    if (endDate <= startDate) {
      this.toastService.error('End date must be after start date');
      return false;
    }

    if (!this.formData.teamId) {
      this.toastService.error('Please select a team');
      return false;
    }

    return true;
  }

  /**
   * Handle form submission - Create Sprint and trigger AI
   */
  onSubmitForm(): void {
    if (!this.validateForm()) {
      return;
    }

    // Create the sprint first
    this.createSprint();
  }

  /**
   * Create sprint via API
   * 
   * TODO: projectId is currently hardcoded as 'f3a2b1c4-9f6d-4e1a-9b89-7b2f3c8d9a01'
   * In the future, fetch it from URL parameters
   */
  private createSprint(): void {
    const sprintRequest: SprintRequest = {
      projectId: this.projectId, // TODO: Get from URL params instead of hardcoded value
      sprintName: this.formData.sprintName,
      sprintGoal: this.formData.sprintGoal || null,
      teamAssigned: parseInt(this.formData.teamId), // Backend expects number
      startDate: this.formData.startDate,
      dueDate: this.formData.endDate,
      status: this.formData.status,
      storyPoint: this.formData.targetStoryPoints
    };

    this.currentState.set(ModalState.AI_LOADING);

    this.sprintService.createSprint(sprintRequest).subscribe({
      next: (response) => {
        console.log('Sprint created:', response);
        this.createdSprintId = response.data.id;
        this.toastService.success('Sprint created successfully!');
        
        // Now trigger AI planning
        this.generateAIPlan();
      },
      error: (error) => {
        console.error('Error creating sprint:', error);
        this.toastService.error('Failed to create sprint');
        this.currentState.set(ModalState.FORM);
      }
    });
  }

  /**
   * Generate AI sprint plan
   * 
   * TODO: projectId is currently hardcoded as 'f3a2b1c4-9f6d-4e1a-9b89-7b2f3c8d9a01'
   * In the future, fetch it from URL parameters
   */
  private generateAIPlan(): void {
    const aiRequest: AISprintPlanRequest = {
      sprintName: this.formData.sprintName,
      sprintGoal: this.formData.sprintGoal,
      startDate: this.formData.startDate,
      endDate: this.formData.endDate,
      targetStoryPoints: this.formData.targetStoryPoints,
      teamId: this.formData.teamId
    };

    // TODO: this.projectId is hardcoded, should come from URL params
    this.sprintService.generateAISprintPlan(this.projectId, aiRequest).subscribe({
      next: (response) => {
        if (response.succeeded && response.data.sprintPlan) {
          this.aiSuggestions = response.data.sprintPlan.selectedIssues;
          this.aiSummary = response.data.sprintPlan.summary;
          this.currentState.set(ModalState.AI_RESULTS);
          console.log('AI suggestions received:', this.aiSuggestions);
        } else {
          this.toastService.error('Failed to generate AI suggestions');
          this.skipAI();
        }
      },
      error: (error) => {
        console.error('Error generating AI plan:', error);
        this.toastService.error('AI planning failed. Sprint created without suggestions.');
        this.skipAI();
      }
    });
  }

  /**
   * Skip AI suggestions (during loading or results)
   */
  skipAI(): void {
    this.toastService.info('Sprint created without AI suggestions');
    this.sprintCreated.emit({ sprintId: this.createdSprintId });
    this.closeModal();
  }

  /**
   * Remove an issue from AI suggestions
   */
  removeIssue(index: number): void {
    this.aiSuggestions.splice(index, 1);
  }

  /**
   * Calculate total story points
   */
  getTotalStoryPoints(): number {
    return this.aiSuggestions.reduce((sum, issue) => sum + issue.storyPoints, 0);
  }

  /**
   * Discard AI suggestions and close modal
   */
  discardSuggestions(): void {
    this.toastService.info('Sprint created without adding suggested issues');
    this.sprintCreated.emit({ sprintId: this.createdSprintId });
    this.closeModal();
  }

  /**
   * Add all suggested issues to the sprint
   * 
   * TODO: projectId is currently hardcoded as 'f3a2b1c4-9f6d-4e1a-9b89-7b2f3c8d9a01'
   * In the future, fetch it from URL parameters
   */
  addSuggestedIssues(): void {
    if (this.aiSuggestions.length === 0) {
      this.toastService.warning('No issues to add');
      return;
    }

    // Prepare issue creation requests
    // TODO: this.projectId is hardcoded, should come from URL params
    const issueRequests = this.aiSuggestions.map(issue => ({
      title: issue.issueKey, // Use issueKey as title
      description: issue.rationale, // Use rationale as description
      issueType: 'Story', // Default to Story (can be enhanced)
      priority: 'MEDIUM', // Default priority (can be enhanced)
      storyPoints: issue.storyPoints,
      assigneeId: issue.suggestedAssigneeId.toString(),
      projectId: this.projectId, // TODO: Get from URL params instead of hardcoded value
      labels: ['AI-Suggested', this.formData.sprintName]
    }));

    // Create issues in bulk
    this.sprintService.createBulkIssues(issueRequests).subscribe({
      next: (responses) => {
        console.log('Issues created:', responses);
        this.toastService.success(`${responses.length} issues added to sprint successfully!`);
        this.sprintCreated.emit({ 
          sprintId: this.createdSprintId, 
          issuesCreated: responses 
        });
        this.closeModal();
      },
      error: (error) => {
        console.error('Error creating issues:', error);
        this.toastService.error('Failed to add some issues. Please try again.');
      }
    });
  }

  /**
   * Close modal and reset state
   */
  closeModal(): void {
    this.currentState.set(ModalState.FORM);
    this.formData = {
      sprintName: '',
      sprintGoal: '',
      startDate: '',
      endDate: '',
      targetStoryPoints: 40,
      teamId: '',
      status: 'PLANNED'
    };
    this.aiSuggestions = [];
    this.aiSummary = '';
    this.createdSprintId = null;
    this.close.emit();
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
}
