import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../../models/team.model';

@Component({
  selector: 'app-team-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-card.html',
  styleUrls: ['./team-card.css'],
})
export class TeamCard {
  @Input() team!: Team;
  @Output() viewDetails = new EventEmitter<string>();
  @Output() editTeam = new EventEmitter<string>();
  @Output() deleteTeam = new EventEmitter<string>();

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.team.id);
  }

  onEdit(): void {
    this.editTeam.emit(this.team.id);
  }

  onDelete(): void {
    this.deleteTeam.emit(this.team.id);
  }
}
