import { Component, Input, Output, EventEmitter, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Issue } from '../../shared/models/issue.model';
import { FormField, ModalService } from '../../modal/modal-service';
import { users } from '../../shared/data/dummy-backlog-data';
import { UserApiService, User } from '../../shared/services/user-api.service';
import { ProjectContextService } from '../../shared/services/project-context.service';
import { IssueService, UpdateIssueRequest } from '../../shared/services/issue.service';
import { ToastService } from '../../shared/services/toast.service';
import { SprintService } from '../../sprint/sprint.service';
import { StatusApiService, Status } from '../../board/services/status-api.service';

export interface Comment {
  id: string;
  author: string;
  authorId: string;
  content: string;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-issue-detailed-view',
  imports: [CommonModule, FormsModule],
  templateUrl: './issue-detailed-view.html',
  styleUrl: './issue-detailed-view.css'
})
export class IssueDetailedView {
  private modalService = inject(ModalService);
  private userApiService = inject(UserApiService);
  private projectContextService = inject(ProjectContextService);
  private issueService = inject(IssueService);
  private toastService = inject(ToastService);
  private sprintService = inject(SprintService);
  private statusApiService = inject(StatusApiService);
  
  @Input() set issue(value: Issue | null) {
    this._issue.set(value);
  }
  
  @Input() set isOpen(value: boolean) {
    this._isOpen.set(value);
  }
  
  @Input() isReadOnly: boolean = false;
  @Input() showMove: boolean = true; // allow parent to hide move controls (e.g., board view)
  
  @Output() close = new EventEmitter<void>();
  @Output() updateIssue = new EventEmitter<Partial<Issue>>();
  @Output() deleteIssue = new EventEmitter<string>();
  @Output() moveIssue = new EventEmitter<{ issueId: string, destinationSprintId: string | null }>();

  protected _issue = signal<Issue | null>(null);
  protected _isOpen = signal(false);
  protected showMoveDropdown = signal(false);
  
  // Project members for assignee dropdown
  protected projectMembers = signal<User[]>([]);

  // Available sprints for moving (will be passed as input)
  @Input() availableSprints: Array<{ id: string, name: string, status: string }> = [];

  constructor() {
    // Load project members when component initializes or project changes
    effect(() => {
      const projectId = this.projectContextService.currentProjectId();
      if (projectId) {
        this.loadProjectMembers(projectId);
      }
    });
  }
  
  private loadProjectMembers(projectId: string): void {
    this.userApiService.getUsersByProject(projectId).subscribe({
      next: (members) => {
        console.log('[IssueDetailedView] Loaded project members:', members);
        this.projectMembers.set(members);
      },
      error: (error) => {
        console.error('[IssueDetailedView] Error loading project members:', error);
        this.projectMembers.set([]);
      }
    });
  }

  // Comment functionality
  protected comments = signal<Comment[]>([]);
  protected newCommentText = signal('');
  protected showMentionDropdown = signal(false);
  protected mentionSearchQuery = signal('');
  protected cursorPosition = signal(0);
  
  protected availableUsers = signal(users);
  protected filteredUsers = computed(() => {
    const query = this.mentionSearchQuery().toLowerCase();
    if (!query) return this.availableUsers();
    return this.availableUsers().filter(user => 
      user.name.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query)
    );
  });

  protected onEditIssue(): void {
    if (this.isReadOnly) return;
    const issue = this._issue();
    if (!issue) return;

    // Get project ID to fetch sprints and statuses
    const projectId = issue.projectId || this.projectContextService.getCurrentProjectId() || sessionStorage.getItem('projectId');
    if (!projectId) {
      console.error('No project ID found for fetching sprints and statuses');
      this.openEditModal(issue, ['Sprint 1', 'Sprint 2', 'Sprint 3'], [], [], []); // Fallback
      return;
    }

    // Fetch sprints and try to fetch statuses (fallback to defaults if API fails)
    this.sprintService.getSprintsByProject(projectId).subscribe({
      next: (sprintResponse) => {
        const sprints = sprintResponse?.data || [];
        const sprintOptions = sprints.length > 0
          ? sprints.map(sprint => sprint.name)
          : ['No sprints available'];
        
        // Try to fetch statuses, but use defaults if API doesn't exist
        this.statusApiService.getAllStatuses().subscribe({
          next: (statuses) => {
            const statusesData = statuses || [];
            console.log('Fetched sprint options for edit:', sprintOptions);
            console.log('Fetched status options for edit:', statusesData);
            this.openEditModal(issue, sprintOptions, sprints, statusesData, statusesData);
          },
          error: (statusErr) => {
            console.warn('Status API not available, using default statuses:', statusErr);
            // Use default hardcoded statuses
            const defaultStatuses: Status[] = [
              { id: 1, statusName: 'TODO' },
              { id: 2, statusName: 'IN_PROGRESS' },
              { id: 3, statusName: 'IN_REVIEW' },
              { id: 4, statusName: 'DONE' },
              { id: 5, statusName: 'BLOCKED' }
            ];
            this.openEditModal(issue, sprintOptions, sprints, defaultStatuses, defaultStatuses);
          }
        });
      },
      error: (err) => {
        console.error('Failed to fetch sprints for edit modal:', err);
        // Use default statuses as fallback
        const defaultStatuses: Status[] = [
          { id: 1, statusName: 'TODO' },
          { id: 2, statusName: 'IN_PROGRESS' },
          { id: 3, statusName: 'IN_REVIEW' },
          { id: 4, statusName: 'DONE' },
          { id: 5, statusName: 'BLOCKED' }
        ];
        this.openEditModal(issue, ['Sprint 1', 'Sprint 2', 'Sprint 3'], [], defaultStatuses, defaultStatuses);
      }
    });
  }

  private openEditModal(issue: Issue, sprintOptions: string[], sprintsData: any[], statusOptions: Status[], statusesData: Status[]): void {

    // Use project members loaded from API
    const members = this.projectMembers();
    let userOptions = members.length > 0 
      ? members.map(m => ({ id: m.id.toString(), name: m.name }))
      : users.map(u => ({ id: u.id, name: u.name })); // Fallback to dummy data

    // If the issue has an assignee that's not in the project members, add them to the options
    if (issue.assigneeName && !userOptions.find(u => u.name === issue.assigneeName)) {
      console.log(`[Edit Issue] Adding missing assignee to options: ${issue.assigneeName} (ID: ${issue.assigneeId})`);
      userOptions = [
        { id: issue.assigneeId?.toString() || '', name: issue.assigneeName },
        ...userOptions
      ];
    }

    // Prepare status dropdown options
    const statusDropdownOptions = statusOptions.length > 0
      ? statusOptions.map(s => s.statusName)
      : ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];

    const fields: FormField[] = [
      { label: 'Issue Type', type: 'select', model: 'issueType', options: ['Epic','Task','Story','Bug'], colSpan: 2, required: true },
      { label: 'Title', type: 'text', model: 'title', colSpan: 2, required: true },
      { label: 'Description', type: 'textarea', model: 'description', colSpan: 2 },
      { label: 'Priority', type: 'select', model: 'priority', options: ['Critical','High','Medium','Low'], colSpan: 1 },
      { label: 'Assignee', type: 'select', model: 'assignee', options: userOptions.map(u => u.name), colSpan: 1 },
      { label: 'Start Date', type: 'date', model: 'startDate', colSpan: 1 },
      { label: 'Due Date', type: 'date', model: 'dueDate', colSpan: 1 },
      { label: 'Sprint', type: 'select', model: 'sprint', options: sprintOptions, colSpan: 1 },
      { label: 'Story Point', type: 'number', model: 'storyPoint', colSpan: 1 },
      { label: 'Parent Epic', type: 'select', model: 'parentEpic', options: ['Epic 1','Epic 2','Epic 3'], colSpan: 1 },
      { label: 'Status', type: 'select', model: 'status', options: statusDropdownOptions, colSpan: 1 },
      { label: 'Attachments', type: 'file', model: 'attachments', colSpan: 2 }
    ];

    console.log('🔍 [Edit Issue] Field options:', {
      assigneeOptions: userOptions.map(u => u.name),
      sprintOptions,
      statusOptions: statusDropdownOptions,
      members
    });

    // Map priority to modal field options
    let priority = '';
    switch ((issue.priority || '').toUpperCase()) {
      case 'CRITICAL': priority = 'Critical'; break;
      case 'HIGH': priority = 'High'; break;
      case 'MEDIUM': priority = 'Medium'; break;
      case 'LOW': priority = 'Low'; break;
      default: priority = ''; break;
    }

    // Find assignee name from ID
    let assigneeName = '';
    if (issue.assigneeName) {
      // Use assigneeName from backend if available
      assigneeName = issue.assigneeName;
    } else if (issue.assigneeId) {
      // Fallback: find by assigneeId
      const assigneeUser = members.find(m => m.id === issue.assigneeId);
      assigneeName = assigneeUser?.name || '';
    } else if (issue.assignee) {
      // Fallback: find by assignee string
      const assigneeUser = members.find(m => m.id.toString() === issue.assignee);
      assigneeName = assigneeUser?.name || '';
    }

    // Helper function to convert Date to YYYY-MM-DD format for date inputs
    const formatDateForInput = (date: Date | string | undefined): string => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Find sprint name from sprintId
    let sprintName = '';
    if (issue.sprintName) {
      sprintName = issue.sprintName;
    } else if (issue.sprintId && sprintsData.length > 0) {
      const sprint = sprintsData.find(s => s.id === issue.sprintId);
      sprintName = sprint?.name || '';
    }

    // Find status name from statusId
    let statusName = '';
    if (issue.statusName) {
      statusName = issue.statusName;
    } else if (issue.statusId && statusesData.length > 0) {
      const status = statusesData.find(s => s.id === issue.statusId);
      statusName = status?.statusName || '';
    } else if (issue.status) {
      // Fallback to status string
      statusName = issue.status;
    }

    // Prepare the data object
    const modalData = {
      issueType: issue.type || '',
      title: issue.title || '',
      description: issue.description || '',
      priority,
      status: statusName,
      assignee: assigneeName,
      startDate: formatDateForInput(issue.startDate),
      dueDate: formatDateForInput(issue.dueDate),
      sprint: sprintName,
      storyPoint: issue.storyPoints || '',
      parentEpic: issue.epicName || issue.epicId || '',
      attachments: issue.attachmentUrl || '',
      labels: issue.labels || []
    };

    console.log('🔍 [Edit Issue] Issue data:', {
      issue,
      assigneeName,
      sprintName: issue.sprintName,
      sprintId: issue.sprintId,
      foundSprintName: sprintName,
      statusName: issue.statusName,
      statusId: issue.statusId,
      foundStatusName: statusName,
      epicName: issue.epicName,
      epicId: issue.epicId,
      attachmentUrl: issue.attachmentUrl,
      modalData
    });

    this.modalService.open({
      id: 'editIssueModal',
      title: `Edit Issue`,
      projectName: 'Project Alpha',
      modalDesc: 'Edit an existing issue in your project',
      fields,
      data: modalData,
      showLabels: true,
      submitText: 'Save Changes',
      onSubmit: (formData: any) => {
        console.log('[IssueDetailedView] onSubmit called with formData:', formData);
        console.log('[IssueDetailedView] Current issue:', issue);
        console.log('[IssueDetailedView] statusesData:', statusesData);
        
        // Convert form data back to Issue partial updates
        const updates: Partial<Issue> = {};
        
        if (formData.issueType) {
          updates.type = formData.issueType.toUpperCase();
        }
        if (formData.title) {
          updates.title = formData.title;
        }
        if (formData.description !== undefined) {
          updates.description = formData.description;
        }
        if (formData.priority) {
          updates.priority = formData.priority.toUpperCase();
        }
        
        // Always process status if provided in formData
        if (formData.status !== undefined && formData.status !== null && formData.status !== '') {
          console.log('[IssueDetailedView] Processing status:', formData.status);
          // Convert status name back to statusId
          const selectedStatus = statusesData.find(s => s.statusName === formData.status);
          console.log('[IssueDetailedView] Found status:', selectedStatus);
          if (selectedStatus) {
            updates.statusId = selectedStatus.id;
            updates.status = formData.status.toUpperCase().replace(/ /g, '_');
            console.log('[IssueDetailedView] Set statusId:', updates.statusId, 'status:', updates.status);
          } else {
            console.warn('[IssueDetailedView] Could not find status in statusesData:', formData.status);
          }
        }
        
        if (formData.assignee) {
          // Convert assignee name back to ID
          const assigneeUser = members.find(m => m.name === formData.assignee);
          updates.assignee = assigneeUser ? assigneeUser.id.toString() : undefined;
        }
        if (formData.startDate) {
          updates.startDate = new Date(formData.startDate);
        }
        if (formData.dueDate) {
          updates.dueDate = new Date(formData.dueDate);
        }
        if (formData.sprint) {
          // Convert sprint name back to ID
          const selectedSprint = sprintsData.find(s => s.name === formData.sprint);
          updates.sprintId = selectedSprint ? selectedSprint.id : formData.sprint;
        }
        if (formData.storyPoint) {
          updates.storyPoints = Number(formData.storyPoint);
        }
        if (formData.parentEpic) {
          updates.epicId = formData.parentEpic;
        }
        if (formData.labels) {
          updates.labels = formData.labels;
        }
        
        console.log('[IssueDetailedView] Emitting issue updates:', updates);
        
        // Call the API to update the issue
        this.updateIssueApi(issue, updates, statusesData);
      }
    });
  }

  private updateIssueApi(issue: Issue, updates: Partial<Issue>, statusesData: Status[] = []): void {
    console.log('🚀 [IssueDetailedView] updateIssueApi CALLED!');
    console.log('[IssueDetailedView] Updating issue:', issue.id, updates);
    console.log('[IssueDetailedView] Current issue statusId:', issue.statusId);
    console.log('[IssueDetailedView] Updates statusId:', updates.statusId);

    // Helper to format dates to UTC ISO string
    const formatDateToUTC = (date: Date | string | undefined): string | null => {
      if (!date) return null;
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      return d.toISOString();
    };

    // Determine the statusId to send to the backend
    let statusId = issue.statusId || 1;
    if (updates.statusId !== undefined) {
      statusId = updates.statusId;
      console.log('[IssueDetailedView] Using updated statusId:', statusId);
    } else {
      console.log('[IssueDetailedView] Using current statusId:', statusId);
    }

    // Build the update request matching the backend API format
    const updateReq: UpdateIssueRequest = {
      projectId: issue.projectId || '',
      issueType: (updates.type || issue.type || 'TASK').toUpperCase(),
      title: updates.title || issue.title,
      description: updates.description !== undefined ? updates.description : (issue.description || ''),
      priority: (updates.priority || issue.priority || 'MEDIUM').toUpperCase(),
      assigneeId: updates.assignee ? parseInt(updates.assignee) : (issue.assigneeId || null),
      startDate: formatDateToUTC(updates.startDate !== undefined ? updates.startDate : issue.startDate),
      dueDate: formatDateToUTC(updates.dueDate !== undefined ? updates.dueDate : issue.dueDate),
      sprintId: updates.sprintId !== undefined ? (updates.sprintId || null) : (issue.sprintId || null),
      storyPoints: updates.storyPoints !== undefined ? updates.storyPoints : (issue.storyPoints || 0),
      epicId: updates.epicId !== undefined ? (updates.epicId || null) : (issue.epicId || null),
      reporterId: issue.reporterId || null,
      attachmentUrl: updates.attachmentUrl !== undefined ? (updates.attachmentUrl || null) : (issue.attachmentUrl || null),
      statusId: statusId,
      labels: updates.labels ? JSON.stringify(updates.labels) : (issue.labels ? JSON.stringify(issue.labels) : null)
    };

    console.log('[IssueDetailedView] Sending update request:', updateReq);
    console.log('[IssueDetailedView] Request JSON:', JSON.stringify(updateReq, null, 2));

    // Call the API
    this.issueService.updateIssue(issue.id, updateReq).subscribe({
      next: (response) => {
        console.log('[IssueDetailedView] Issue updated successfully:', response);
        
        // Emit the update event for parent components to update their local state
        this.updateIssue.emit(updates);
        
        // Update the local issue signal
        const updatedIssue: Issue = { ...issue, ...updates };
        this._issue.set(updatedIssue);
        
        this.toastService.success('Issue updated successfully!');
        this.modalService.close();
      },
      error: (error) => {
        console.error('[IssueDetailedView] Failed to update issue:', error);
        
        // Access the original error from the interceptor wrapper
        const originalError = error.originalError || error;
        
        console.error('[IssueDetailedView] Error details:', {
          status: error.status,
          statusText: originalError.statusText,
          error: originalError.error,
          validationErrors: originalError.error?.errors
        });
        
        // Handle validation errors from the original error
        if (originalError.error && originalError.error.errors) {
          const errorMessages = Object.entries(originalError.error.errors)
            .map(([field, messages]: [string, any]) => {
              const msgArray = Array.isArray(messages) ? messages : [messages];
              return `${field}: ${msgArray.join(', ')}`;
            })
            .join('; ');
          console.error('[IssueDetailedView] Validation errors:', errorMessages);
          this.toastService.error(`Validation failed: ${errorMessages}`);
        } else if (error.message) {
          this.toastService.error(`Failed to update issue: ${error.message}`);
        } else {
          this.toastService.error('Failed to update issue. Please try again.');
        }
      }
    });
  }



  protected getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'STORY': 'fa-solid fa-book',
      'TASK': 'fa-solid fa-check-circle',
      'BUG': 'fa-solid fa-bug',
      'EPIC': 'fa-solid fa-bolt'
    };
    return icons[type] || 'fa-solid fa-file';
  }

  protected getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      'LOW': 'bg-gray-100 text-gray-700 border-gray-300',
      'MEDIUM': 'bg-blue-100 text-blue-700 border-blue-300',
      'HIGH': 'bg-orange-100 text-orange-700 border-orange-300',
      'CRITICAL': 'bg-red-100 text-red-700 border-red-300'
    };
    return classes[priority] || 'bg-gray-100 text-gray-700 border-gray-300';
  }

  protected getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'TODO': 'bg-gray-100 text-gray-700 border-gray-300',
      'IN_PROGRESS': 'bg-blue-100 text-blue-700 border-blue-300',
      'IN_REVIEW': 'bg-purple-100 text-purple-700 border-purple-300',
      'DONE': 'bg-green-100 text-green-700 border-green-300'
    };
    return classes[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  }

  protected formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected formatShortDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  protected onClose(): void {
    this.close.emit();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  protected onDelete(): void {
    if (this.isReadOnly) return;
    const issue = this._issue();
    if (!issue) return;

    // Show custom confirmation modal
    this.modalService.open({
      id: 'confirmDeleteIssue',
      title: 'Delete Issue',
      modalDesc: `Are you sure you want to delete issue "${issue.title}"? This action cannot be undone.`,
      fields: [],
      submitText: 'Delete',
      showLabels: false,
      onSubmit: () => {
        console.log('[IssueDetailedView] Deleting issue:', issue.id);
        this.toastService.info('Deleting issue...');

        this.issueService.deleteIssue(issue.id).subscribe({
          next: (response) => {
            console.log('[IssueDetailedView] Issue deleted successfully:', response);
            this.toastService.success('Issue deleted successfully!');
            this.modalService.close();
            
            // Emit delete event for parent components to update their local state
            this.deleteIssue.emit(issue.id);
            
            // Close the detailed view
            this.onClose();
          },
          error: (error) => {
            console.error('[IssueDetailedView] Failed to delete issue:', error);
            this.toastService.error(error.message || 'Failed to delete issue. Please try again.');
          }
        });
      }
    });
  }

  protected toggleMoveDropdown(): void {
    if (this.isReadOnly || !this.showMove) return;
    this.showMoveDropdown.set(!this.showMoveDropdown());
  }

  protected onMove(destinationSprintId: string | null, destinationName: string): void {
    if (this.isReadOnly || !this.showMove) return;
    const issue = this._issue();
    if (issue) {
      if (confirm(`Move issue ${issue.id} to ${destinationName}?`)) {
        this.moveIssue.emit({ 
          issueId: issue.id, 
          destinationSprintId 
        });
        this.showMoveDropdown.set(false);
        this.onClose();
      }
    }
  }

  protected closeMoveDropdown(event: MouseEvent): void {
    event.stopPropagation();
  }

  // Comment functionality methods
  protected onCommentInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    
    this.newCommentText.set(text);
    this.cursorPosition.set(cursorPos);
    
    // Check if @ symbol is typed
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      // Check if there's no space after @ (valid mention trigger)
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        this.mentionSearchQuery.set(textAfterAt);
        this.showMentionDropdown.set(true);
      } else {
        this.showMentionDropdown.set(false);
      }
    } else {
      this.showMentionDropdown.set(false);
    }
  }

  protected selectMention(user: any): void {
    const text = this.newCommentText();
    const cursorPos = this.cursorPosition();
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const beforeAt = text.substring(0, lastAtSymbol);
      const afterCursor = text.substring(cursorPos);
      const newText = `${beforeAt}@${user.name} ${afterCursor}`;
      
      this.newCommentText.set(newText);
      this.showMentionDropdown.set(false);
      this.mentionSearchQuery.set('');
    }
  }

  protected extractMentions(text: string): string[] {
    const mentionPattern = /@(\w+(?:\s+\w+)*)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionPattern.exec(text)) !== null) {
      const mentionedName = match[1];
      // Verify it's a valid user
      const user = this.availableUsers().find(u => u.name === mentionedName);
      if (user) {
        mentions.push(user.id);
      }
    }
    
    return mentions;
  }

  protected addComment(): void {
    if (this.isReadOnly) return;
    const text = this.newCommentText().trim();
    if (!text) return;
    
    const mentions = this.extractMentions(text);
    const currentUser = users[0]; // Assuming first user is the current user
    
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: currentUser.name,
      authorId: currentUser.id,
      content: text,
      mentions: mentions,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.comments.update(comments => [...comments, newComment]);
    this.newCommentText.set('');
    this.showMentionDropdown.set(false);
    
    // Notify mentioned users (you can emit an event here for parent component to handle)
    if (mentions.length > 0) {
      console.log('Mentioned users:', mentions);
      // this.mentionNotification.emit({ issueId: this._issue()!.id, mentions });
    }
  }

  protected deleteComment(commentId: string): void {
    if (this.isReadOnly) return;
    if (confirm('Are you sure you want to delete this comment?')) {
      this.comments.update(comments => 
        comments.filter(c => c.id !== commentId)
      );
    }
  }

  protected formatCommentDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  protected getCommentInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  protected highlightMentions(text: string): string {
    return text.replace(/@(\w+(?:\s+\w+)*)/g, '<span class="mention">@$1</span>');
  }
}
