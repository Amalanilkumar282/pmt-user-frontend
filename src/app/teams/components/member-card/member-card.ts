import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectMember } from '../../models/project-member.model';
import { PermissionService } from '../../../auth/permission.service';
import { HasPermissionDirective } from '../../../auth/has-permission.directive';

@Component({
  selector: 'app-member-card',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  templateUrl: './member-card.html',
  styleUrls: ['./member-card.css'],
})
export class MemberCard {
  @Input({ required: true }) member!: ProjectMember;
  @Input() showActions = true;
  
  permissionService = inject(PermissionService);
  
  @Output() changeRole = new EventEmitter<string>();
  @Output() removeMember = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<string>();

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      'Project Manager': '#8b5cf6',
      'Developer': '#3b82f6',
      'Designer': '#ec4899',
      'QA Tester': '#f59e0b',
      'DevOps': '#10b981',
      'Business Analyst': '#06b6d4',
    };
    return colors[role] || '#6b7280';
  }

  getStatusColor(status: string): string {
    return status === 'Active' ? '#10b981' : '#ef4444';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  onChangeRole(): void {
    this.changeRole.emit(this.member.id);
  }

  onRemove(): void {
    this.removeMember.emit(this.member.id);
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.member.id);
  }
}
