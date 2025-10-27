import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Issue } from '../../shared/models/issue.model';
import { FormField, ModalService } from '../../modal/modal-service';
import { users } from '../../shared/data/dummy-backlog-data';

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
  constructor(private modalService: ModalService) {} 
  
  @Input() set issue(value: Issue | null) {
    this._issue.set(value);
  }
  
  @Input() set isOpen(value: boolean) {
    this._isOpen.set(value);
  }
  
  @Input() isReadOnly: boolean = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() updateIssue = new EventEmitter<Partial<Issue>>();
  @Output() deleteIssue = new EventEmitter<string>();
  @Output() moveIssue = new EventEmitter<{ issueId: string, destinationSprintId: string | null }>();

  protected _issue = signal<Issue | null>(null);
  protected _isOpen = signal(false);
  protected showMoveDropdown = signal(false);

  // Available sprints for moving (will be passed as input)
  @Input() availableSprints: Array<{ id: string, name: string, status: string }> = [];

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

    const userOptions = users.map(u => u.name);
    const fields: FormField[] = [
      { label: 'Issue Type', type: 'select', model: 'issueType', options: ['Epic','Task','Story','Bug'], colSpan: 2, required: true },
      { label: 'Title', type: 'text', model: 'title', colSpan: 2, required: true },
      { label: 'Description', type: 'textarea', model: 'description', colSpan: 2 },
      { label: 'Priority', type: 'select', model: 'priority', options: ['Critical','High','Medium','Low'], colSpan: 1 },
      { label: 'Assignee', type: 'select', model: 'assignee', options: userOptions, colSpan: 1 },
      { label: 'Start Date', type: 'date', model: 'startDate', colSpan: 1 },
      { label: 'Due Date', type: 'date', model: 'dueDate', colSpan: 1 },
      { label: 'Sprint', type: 'select', model: 'sprint', options: ['Sprint 1','Sprint 2','Sprint 3'], colSpan: 1 },
      { label: 'Story Point', type: 'number', model: 'storyPoint', colSpan: 1 },
      { label: 'Parent Epic', type: 'select', model: 'parentEpic', options: ['Epic 1','Epic 2','Epic 3'], colSpan: 2 },
      { label: 'Attachments', type: 'file', model: 'attachments', colSpan: 2 }
    ];

    // Map priority to modal field options
    let priority = '';
    switch ((issue.priority || '').toUpperCase()) {
      case 'CRITICAL': priority = 'Critical'; break;
      case 'HIGH': priority = 'High'; break;
      case 'MEDIUM': priority = 'Medium'; break;
      case 'LOW': priority = 'Low'; break;
      default: priority = ''; break;
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

    this.modalService.open({
      id: 'editIssueModal',
      title: `Edit Issue`,
      projectName: 'Project Alpha',
      modalDesc: 'Edit an existing issue in your project',
      fields,
      data: {
        issueType: issue.type || '',
        title: issue.title || '',
        description: issue.description || '',
        priority,
        assignee: issue.assignee || '',
        startDate: formatDateForInput(issue.startDate),
        dueDate: formatDateForInput(issue.dueDate),
        sprint: issue.sprintId || '',
        storyPoint: issue.storyPoints || '',
        parentEpic: issue.epicId || '',
        attachments: issue.attachments || [],
        labels: issue.labels || []
      },
      showLabels: true,
      submitText: 'Save Changes'
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
    if (issue && confirm(`Are you sure you want to delete issue ${issue.id}?`)) {
      this.deleteIssue.emit(issue.id);
      this.onClose();
    }
  }

  protected toggleMoveDropdown(): void {
    if (this.isReadOnly) return;
    this.showMoveDropdown.set(!this.showMoveDropdown());
  }

  protected onMove(destinationSprintId: string | null, destinationName: string): void {
    if (this.isReadOnly) return;
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
