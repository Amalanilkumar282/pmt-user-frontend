import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Import the Sprint interface from board models to ensure type consistency
export interface Sprint {
  id: string;
  name: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PLANNED';
  teamId?: number;
  startDate?: Date;
  endDate?: Date;
}

@Component({
  selector: 'app-sprint-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sprint-filter.html',
  styleUrls: ['./sprint-filter.css'],
})
export class SprintFilterComponent implements OnInit, OnChanges {
  /** ✅ List of sprints to display */
  @Input() sprints: Sprint[] = [];

  /** ✅ Currently selected sprint ID (sprint id string or null when none selected) */
  @Input() selectedSprint: string | null = null;

  /** Whether to show the BACKLOG option in the dropdown (default: true) */
  @Input() allowBacklog = true;

  /** ✅ Emits whenever sprint selection changes */
  @Output() sprintChange = new EventEmitter<string | null>();

  ngOnInit(): void {
    console.log('[SprintFilter] Component initialized');
    console.log('[SprintFilter] Sprints received:', this.sprints);
    console.log('[SprintFilter] Selected sprint:', this.selectedSprint);
  }

  ngOnChanges(): void {
    console.log('[SprintFilter] Sprints changed:', this.sprints);
    console.log('[SprintFilter] Selected sprint:', this.selectedSprint);
  }

  /** Called whenever the dropdown value changes */
  onSprintChange(sprintId: string | null): void {
    console.log('[SprintFilter] Sprint selection changed to:', sprintId);
    this.sprintChange.emit(sprintId);
  }
}
