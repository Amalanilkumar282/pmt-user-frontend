import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-header.html',
  styleUrl: './project-header.css',
})
export class ProjectHeader {
  @Output() createProject = new EventEmitter<void>();

  onCreateProject(): void {
    this.createProject.emit();
  }
}
