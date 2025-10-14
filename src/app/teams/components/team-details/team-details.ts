import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team, TeamStats, TeamMember } from '../../models/team.model';

@Component({
  selector: 'app-team-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-details.html',
  styleUrls: ['./team-details.css'],
})
export class TeamDetailsComponent implements OnInit {
  @Input() team!: Team;
  @Input() stats!: TeamStats;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<string>();

  ngOnInit(): void {
    if (!this.team) {
      console.error('Team is required for TeamDetailsComponent');
    }
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      'Team Lead': '#667eea',
      'Developer': '#10b981',
      'Designer': '#f59e0b',
      'Tester': '#ec4899',
      'Product Owner': '#8b5cf6',
      'Scrum Master': '#06b6d4',
    };
    return colors[role] || '#64748b';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getCompletionPercentage(): number {
    if (this.stats.totalIssues === 0) return 0;
    return Math.round((this.stats.completedIssues / this.stats.totalIssues) * 100);
  }

  onClose(): void {
    this.close.emit();
  }

  onEdit(): void {
    this.edit.emit(this.team.id);
  }
}
