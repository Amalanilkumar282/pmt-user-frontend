import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// You can define this interface in a shared model file if used elsewhere
export interface Sprint {
  id: string;
  name: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PLANNED';
}

@Component({
  selector: 'app-sprint-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sprint-filter.html',
  styleUrls: ['./sprint-filter.css'],
})
export class SprintFilterComponent {
  /** ✅ List of sprints to display */
  @Input() sprints: Sprint[] = [];

  /** ✅ Currently selected sprint ID */
  @Input() selectedSprint: string = 'all';

  /** ✅ Emits whenever sprint selection changes */
  @Output() sprintChange = new EventEmitter<string>();

  /** Called whenever the dropdown value changes */
  onSprintChange(sprintId: string): void {
    this.sprintChange.emit(sprintId);
  }
}
