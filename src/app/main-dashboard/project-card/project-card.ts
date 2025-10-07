import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface ProjectCardModel {
  id: string;
  name: string;
  type: string;
  status: 'Active' | 'Completed';
  sprint: string;
  tasks: { toDo: number; inProgress: number; done: number };
  teamMembers: string[];
  deadline: string;
  updated: string;
  starred?: boolean;
}

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './project-card.html',
  styleUrls: ['./project-card.css'],
})
export class ProjectCard {
  @Input() project!: ProjectCardModel;
  // emit a small payload so parent owns state and child doesn't mutate inputs
  @Output() starToggled = new EventEmitter<{ id: string; starred: boolean }>();

  toggleStar(): void {
    if (!this.project) return;
    const newState = !this.project.starred;
    this.starToggled.emit({ id: this.project.id, starred: newState });
  }
}
