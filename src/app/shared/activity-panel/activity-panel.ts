import { Component, EventEmitter, Output, Input, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService, ActivityLogDto } from '../services/activity.service';
import { UserContextService } from '../services/user-context.service';

@Component({
  selector: 'app-activity-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-panel.html',
  styleUrls: ['./activity-panel.css']
})
export class ActivityPanel implements OnInit {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  
  private activityService = inject(ActivityService);
  private userContextService = inject(UserContextService);
  
  activities = signal<ActivityLogDto[]>([]);
  isLoading = signal(false);
  error = signal<string | undefined>(undefined);

  ngOnInit(): void {
    this.loadActivities();
  }

  loadActivities(): void {
    const userId = this.userContextService.getCurrentUserId();
    
    if (!userId) {
      this.error.set('User not authenticated');
      return;
    }

    this.isLoading.set(true);
    this.error.set(undefined);

    this.activityService.getUserActivities(userId, 50).subscribe({
      next: (response) => {
        if (response.status === 200 && Array.isArray(response.data)) {
          this.activities.set(response.data);
        } else {
          this.error.set('Failed to load activities');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load activities:', err);
        this.error.set('Failed to load activities. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  closePanel(): void {
    this.close.emit();
  }

  getActivityIcon(entityType: string): string {
    switch (entityType.toLowerCase()) {
      case 'issue':
        return '📝';
      case 'sprint':
        return '🏃';
      case 'project':
        return '📁';
      case 'comment':
        return '💬';
      case 'board':
        return '📊';
      default:
        return '📌';
    }
  }

  getActivityColor(action: string): string {
    const lowerAction = action.toLowerCase();
    
    if (lowerAction.includes('create')) return 'bg-green-50 text-green-600 border-green-200';
    if (lowerAction.includes('update') || lowerAction.includes('edit')) return 'bg-blue-50 text-blue-600 border-blue-200';
    if (lowerAction.includes('delete')) return 'bg-red-50 text-red-600 border-red-200';
    if (lowerAction.includes('complete')) return 'bg-purple-50 text-purple-600 border-purple-200';
    if (lowerAction.includes('comment')) return 'bg-yellow-50 text-yellow-600 border-yellow-200';
    if (lowerAction.includes('assign')) return 'bg-indigo-50 text-indigo-600 border-indigo-200';
    
    return 'bg-gray-50 text-gray-600 border-gray-200';
  }

  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return activityTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getUserInitials(userName?: string): string {
    if (!userName) return 'U';
    
    const names = userName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  }

  refreshActivities(): void {
    this.loadActivities();
  }
}
