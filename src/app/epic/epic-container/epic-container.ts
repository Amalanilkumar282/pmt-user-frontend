import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EpicList } from '../epic-list/epic-list';
import { Epic } from '../../shared/models/epic.model';
import { epics as initialEpics } from '../../shared/data/dummy-backlog-data';

@Component({
  selector: 'app-epic-container',
  standalone: true,
  imports: [CommonModule, FormsModule, EpicList],
  templateUrl: './epic-container.html',
  styleUrl: './epic-container.css'
})
export class EpicContainer {
  epics: Epic[] = [...initialEpics];
  isCreating = false;
  newEpicName = '';

  @Output() epicSelected = new EventEmitter<string>();
  @Output() closeEpicPanel = new EventEmitter<void>();
  @Output() viewDetails = new EventEmitter<string>();

  onToggleExpand(epicId: string): void {
    this.epics = this.epics.map(epic => 
      epic.id === epicId 
        ? { ...epic, isExpanded: !epic.isExpanded }
        : epic
    );
  }

  onViewDetails(epicId: string): void {
    this.viewDetails.emit(epicId);
  }

  startCreatingEpic(): void {
    this.isCreating = true;
    this.newEpicName = '';
    // Focus on input after a brief delay to ensure it's rendered
    setTimeout(() => {
      const input = document.querySelector('.epic-name-input') as HTMLInputElement;
      if (input) input.focus();
    }, 0);
  }

  cancelCreatingEpic(): void {
    if (!this.newEpicName.trim()) {
      this.isCreating = false;
      this.newEpicName = '';
    }
  }

  createEpic(): void {
    if (this.newEpicName.trim()) {
      const newEpic: Epic = {
        id: `epic-${Date.now()}`,
        name: this.newEpicName.trim(),
        description: '',
        startDate: null,
        dueDate: null,
        progress: 0,
        issueCount: 0,
        isExpanded: true,
        assignee: 'Unassigned',
        labels: [],
        parent: 'None',
        team: 'None',
        sprint: 'None',
        storyPoints: 0,
        reporter: 'Unknown',
        childWorkItems: []
      };
      this.epics.push(newEpic);
      this.isCreating = false;
      this.newEpicName = '';
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.createEpic();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.isCreating = false;
      this.newEpicName = '';
    }
  }

  onInputBlur(): void {
    // Delay to allow click events to fire first
    setTimeout(() => {
      this.cancelCreatingEpic();
    }, 200);
  }

  onClose(): void {
    this.closeEpicPanel.emit();
  }
}
