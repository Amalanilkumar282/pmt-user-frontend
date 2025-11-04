import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

export interface ActivityModel {
  id: string;
  userId: number;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
}

@Component({
  selector: 'app-activity-item',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  templateUrl: './activity-item.html',
  styleUrls: ['./activity-item.css'],
})
export class ActivityItem {
  @Input() activity!: ActivityModel;

  /**
   * Get user initials from username
   */
  get userInitials(): string {
    if (!this.activity?.userName) return 'U';

    const parts = this.activity.userName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return this.activity.userName.substring(0, 2).toUpperCase();
  }

  /**
   * Get activity type for styling
   */
  get activityType(): 'completed' | 'commented' | 'assigned' | 'default' {
    const action = this.activity?.action?.toUpperCase();

    if (action === 'COMPLETE' || action === 'DONE') return 'completed';
    if (action === 'COMMENT' || (action === 'CREATE' && this.activity.entityType === 'Comment'))
      return 'commented';
    if (action === 'ASSIGN') return 'assigned';

    return 'default';
  }

  /**
   * Format activity into a readable sentence
   */
  get activitySentence(): string {
    const { action, entityType, description } = this.activity;

    // Use description if available, otherwise construct from action and entity type
    if (description && description !== '') {
      return description;
    }

    // Fallback to constructed sentence with better formatting
    const actionText = this.formatAction(action);
    const entityText = this.formatEntityType(entityType);

    return `${actionText} ${entityText}`;
  }

  /**
   * Format action text for display
   */
  private formatAction(action: string): string {
    if (!action) return '';

    const actionMap: { [key: string]: string } = {
      CREATE: 'created',
      UPDATE: 'updated',
      DELETE: 'deleted',
      ASSIGN: 'assigned',
      COMPLETE: 'completed',
      COMMENT: 'commented on',
      ARCHIVE: 'archived',
      RESTORE: 'restored',
      LOGIN: 'logged in to',
      LOGOUT: 'logged out from',
    };

    return actionMap[action.toUpperCase()] || action.toLowerCase();
  }

  /**
   * Format entity type for display
   */
  private formatEntityType(entityType: string): string {
    if (!entityType) return '';

    const entityMap: { [key: string]: string } = {
      PROJECT: 'a project',
      ISSUE: 'an issue',
      SPRINT: 'a sprint',
      COMMENT: 'a comment',
      TEAM: 'a team',
      USER: 'user profile',
      CHANNEL: 'a channel',
      MESSAGE: 'a message',
    };

    return entityMap[entityType.toUpperCase()] || `a ${entityType.toLowerCase()}`;
  }
}
