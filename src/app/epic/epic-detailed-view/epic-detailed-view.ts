import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Epic } from '../../shared/models/epic.model';
import { Issue } from '../../shared/models/issue.model';
import { EpicHeader } from './components/epic-header/epic-header';
import { EpicDescription } from './components/epic-description/epic-description';
import { WorkItemsTable } from './components/work-items-table/work-items-table';
import { WorkItemForm } from './components/work-item-form/work-item-form';
import { EpicDetails } from './components/epic-details/epic-details';
import { EpicService } from '../../shared/services/epic.service';
import { IssueService } from '../../shared/services/issue.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-epic-detailed-view',
  standalone: true,
  imports: [CommonModule, EpicHeader, EpicDescription, WorkItemsTable, WorkItemForm, EpicDetails],
  templateUrl: './epic-detailed-view.html',
  styleUrl: './epic-detailed-view.css'
})
export class EpicDetailedView implements OnInit, OnChanges {
  // provide a safe default so unit tests that instantiate the component without inputs
  // don't run into `Cannot read properties of undefined` when accessing epic fields
  @Input() epic: Epic = {
    id: '',
    name: '',
    description: '',
    startDate: null,
    dueDate: null,
    progress: 0,
    issueCount: 0,
    isExpanded: false,
    assignee: 'Unassigned',
    labels: [],
    parent: 'None',
    team: 'None',
    sprint: 'None',
    storyPoints: 0,
    reporter: 'Unassigned',
    childWorkItems: [],
    status: 'TODO'
  };
  @Output() close = new EventEmitter<void>();
  @Output() epicUpdated = new EventEmitter<Epic>();
  @Output() epicDeleted = new EventEmitter<string>();

  workItems: Issue[] = [];
  isLoadingWorkItems = false;
  isLoadingEpicDetails = false;

  private epicService = inject(EpicService);
  private issueService = inject(IssueService);
  private toastService = inject(ToastService);

  ngOnInit() {
    // ensure defaults are set before any code reads epic properties
    this.initializeEpicDefaults();
    this.loadEpicDetails();
    this.loadWorkItems();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload epic details and work items when epic ID changes
    if (changes['epic'] && !changes['epic'].firstChange) {
      if (changes['epic'].currentValue?.id !== changes['epic'].previousValue?.id) {
        this.initializeEpicDefaults();
        this.loadEpicDetails();
        this.loadWorkItems();
      }
    }
  }

  private initializeEpicDefaults() {
    if (!this.epic.assignee) this.epic.assignee = 'Unassigned';
    if (!this.epic.reporter) this.epic.reporter = 'Unassigned';
    if (!this.epic.parent) this.epic.parent = 'None';
    if (!this.epic.team) this.epic.team = 'None';
    if (!this.epic.sprint) this.epic.sprint = 'None';
    if (!this.epic.labels) this.epic.labels = [];
    if (!this.epic.childWorkItems) this.epic.childWorkItems = [];
    if (!this.epic.status) this.epic.status = 'TODO';
    if (this.epic.storyPoints === undefined) this.epic.storyPoints = 0;
    if (!this.epic.description) this.epic.description = '';
  }

  /**
   * Load epic details from backend
   */
  private loadEpicDetails() {
    if (!this.epic.id) {
      console.warn('⚠️ [EpicDetailedView] No epic ID available');
      return;
    }

    this.isLoadingEpicDetails = true;
    this.epicService.getEpicById(this.epic.id).subscribe({
      next: (epicDetails) => {
        // Update epic with fresh data from backend
        this.epic = {
          ...this.epic,
          ...epicDetails,
          name: epicDetails.title || epicDetails.name,
          isExpanded: this.epic.isExpanded // Preserve UI state
        };
        this.isLoadingEpicDetails = false;
        console.log('✅ [EpicDetailedView] Epic details loaded:', this.epic);
      },
      error: (error) => {
        console.error('❌ [EpicDetailedView] Error loading epic details:', error);
        this.isLoadingEpicDetails = false;
        this.toastService.error('Failed to load epic details');
      }
    });
  }

  /**
   * Load child work items from backend
   */
  private loadWorkItems() {
    if (!this.epic.id) {
      console.warn('⚠️ [EpicDetailedView] No epic ID available');
      this.workItems = [];
      return;
    }

    this.isLoadingWorkItems = true;
    this.epicService.getChildWorkItemsByEpicId(this.epic.id).subscribe({
      next: (workItems) => {
        this.workItems = workItems;
        this.epic.childWorkItems = workItems.map(item => item.id);
        this.epic.issueCount = workItems.length;
        
        // Calculate progress based on completed work items
        const completedItems = workItems.filter(item => item.status === 'DONE').length;
        this.epic.progress = workItems.length > 0 ? Math.round((completedItems / workItems.length) * 100) : 0;
        
        this.isLoadingWorkItems = false;
        console.log('✅ [EpicDetailedView] Work items loaded:', this.workItems);
      },
      error: (error) => {
        console.error('❌ [EpicDetailedView] Error loading work items:', error);
        this.isLoadingWorkItems = false;
        this.workItems = [];
        this.toastService.error('Failed to load work items');
      }
    });
  }

  onClose() {
    this.close.emit();
  }

  /**
   * Handle epic updates from child components
   */
  onEpicUpdated(updatedEpic: Epic) {
    this.epic = updatedEpic;
    this.epicUpdated.emit(this.epic);
    // Reload data from backend to ensure consistency
    this.loadEpicDetails();
  }

  /**
   * Handle epic deletion
   */
  onEpicDeleted(epicId: string) {
    this.epicDeleted.emit(epicId);
    this.close.emit();
  }

  /**
   * Handle work items changes
   */
  onWorkItemsChanged(updatedWorkItems: Issue[]) {
    this.workItems = updatedWorkItems;
    this.epic.childWorkItems = updatedWorkItems.map(item => item.id);
    this.epic.issueCount = updatedWorkItems.length;
    
    // Recalculate progress
    const completedItems = updatedWorkItems.filter(item => item.status === 'DONE').length;
    this.epic.progress = updatedWorkItems.length > 0 ? Math.round((completedItems / updatedWorkItems.length) * 100) : 0;
    
    this.epicUpdated.emit(this.epic);
  }

  /**
   * Handle work item creation
   */
  onWorkItemCreated(newWorkItem: Partial<Issue>) {
    // Get project ID from sessionStorage or epic context
    const projectId = sessionStorage.getItem('projectId');
    
    if (!projectId) {
      this.toastService.error('Project ID not found');
      return;
    }

    if (!this.epic.id) {
      this.toastService.error('Epic ID not found');
      return;
    }

    // Prepare issue creation request with epic ID
    const issueRequest = {
      projectId: projectId,
      issueType: newWorkItem.type || 'TASK',
      title: newWorkItem.title || 'Untitled',
      description: newWorkItem.description || '',
      priority: newWorkItem.priority || 'MEDIUM',
      assigneeId: null,
      startDate: undefined,
      dueDate: undefined,
      sprintId: null,
      storyPoints: newWorkItem.storyPoints || 0,
      epicId: this.epic.id, // Link to current epic
      reporterId: null,
      attachmentUrl: null,
      statusId: 1, // TODO status
      labels: undefined
    };

    this.toastService.info('Creating work item...');
    
    this.issueService.createIssue(issueRequest).subscribe({
      next: (response: any) => {
        console.log('✅ Work item created successfully:', response);
        this.toastService.success('Work item created successfully!');
        // Reload work items to show the new item
        this.loadWorkItems();
        // Also reload epic details to update counts
        this.loadEpicDetails();
      },
      error: (error: any) => {
        console.error('❌ Error creating work item:', error);
        this.toastService.error(error.error?.message || 'Failed to create work item');
      }
    });
  }

  /**
   * Refresh epic data and work items
   */
  refreshEpicData() {
    this.loadEpicDetails();
    this.loadWorkItems();
  }
}
