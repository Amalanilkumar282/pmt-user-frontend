import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Epic } from '../../shared/models/epic.model';
import { Issue } from '../../shared/models/issue.model';
import { epic1WorkItems, epic2WorkItems } from '../../shared/data/dummy-backlog-data';

@Component({
  selector: 'app-epic-detailed-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './epic-detailed-view.html',
  styleUrl: './epic-detailed-view.css'
})
export class EpicDetailedView implements OnInit {
  @Input() epic!: Epic;
  @Output() close = new EventEmitter<void>();
  @Output() epicUpdated = new EventEmitter<Epic>();

  workItems: Issue[] = [];
  
  // Edit states
  editingDescription = false;
  editingAssignee = false;
  editingParent = false;
  editingTeam = false;
  editingDueDate = false;
  editingStartDate = false;
  editingSprint = false;
  editingStoryPoints = false;

  // Temp values for editing
  tempDescription = '';
  tempAssignee = '';
  tempParent = '';
  tempTeam = '';
  tempDueDate = '';
  tempStartDate = '';
  tempSprint = '';
  tempStoryPoints: number | undefined;

  ngOnInit() {
    this.loadWorkItems();
  }

  loadWorkItems() {
    // Load work items based on epic ID
    if (this.epic.id === 'epic-1') {
      this.workItems = [...epic1WorkItems];
    } else if (this.epic.id === 'epic-2') {
      this.workItems = [...epic2WorkItems];
    }
  }

  onClose() {
    this.close.emit();
  }

  // Description editing
  startEditingDescription() {
    this.editingDescription = true;
    this.tempDescription = this.epic.description;
  }

  saveDescription() {
    this.epic.description = this.tempDescription;
    this.editingDescription = false;
    this.epicUpdated.emit(this.epic);
  }

  cancelDescription() {
    this.editingDescription = false;
  }

  // Assignee editing
  startEditingAssignee() {
    this.editingAssignee = true;
    this.tempAssignee = this.epic.assignee || 'Unassigned';
  }

  saveAssignee() {
    this.epic.assignee = this.tempAssignee;
    this.editingAssignee = false;
    this.epicUpdated.emit(this.epic);
  }

  cancelAssignee() {
    this.editingAssignee = false;
  }

  // Parent editing
  startEditingParent() {
    this.editingParent = true;
    this.tempParent = this.epic.parent || 'None';
  }

  saveParent() {
    this.epic.parent = this.tempParent;
    this.editingParent = false;
    this.epicUpdated.emit(this.epic);
  }

  cancelParent() {
    this.editingParent = false;
  }

  // Team editing
  startEditingTeam() {
    this.editingTeam = true;
    this.tempTeam = this.epic.team || 'None';
  }

  saveTeam() {
    this.epic.team = this.tempTeam;
    this.editingTeam = false;
    this.epicUpdated.emit(this.epic);
  }

  cancelTeam() {
    this.editingTeam = false;
  }

  // Due Date editing
  startEditingDueDate() {
    this.editingDueDate = true;
    this.tempDueDate = this.epic.dueDate ? this.formatDateForInput(this.epic.dueDate) : '';
  }

  saveDueDate() {
    this.epic.dueDate = this.tempDueDate ? new Date(this.tempDueDate) : null;
    this.editingDueDate = false;
    this.epicUpdated.emit(this.epic);
  }

  cancelDueDate() {
    this.editingDueDate = false;
  }

  // Start Date editing
  startEditingStartDate() {
    this.editingStartDate = true;
    this.tempStartDate = this.epic.startDate ? this.formatDateForInput(this.epic.startDate) : '';
  }

  saveStartDate() {
    this.epic.startDate = this.tempStartDate ? new Date(this.tempStartDate) : null;
    this.editingStartDate = false;
    this.epicUpdated.emit(this.epic);
  }

  cancelStartDate() {
    this.editingStartDate = false;
  }

  // Sprint editing
  startEditingSprint() {
    this.editingSprint = true;
    this.tempSprint = this.epic.sprint || 'None';
  }

  saveSprint() {
    this.epic.sprint = this.tempSprint;
    this.editingSprint = false;
    this.epicUpdated.emit(this.epic);
  }

  cancelSprint() {
    this.editingSprint = false;
  }

  // Story Points editing
  startEditingStoryPoints() {
    this.editingStoryPoints = true;
    this.tempStoryPoints = this.epic.storyPoints;
  }

  saveStoryPoints() {
    this.epic.storyPoints = this.tempStoryPoints;
    this.editingStoryPoints = false;
    this.epicUpdated.emit(this.epic);
  }

  cancelStoryPoints() {
    this.editingStoryPoints = false;
  }

  // Label management
  removeLabel(label: string) {
    if (this.epic.labels) {
      this.epic.labels = this.epic.labels.filter(l => l !== label);
      this.epicUpdated.emit(this.epic);
    }
  }

  // Utility methods
  formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatDateForInput(date: Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  getProgressPercentage(): string {
    const completed = this.workItems.filter(item => item.status === 'DONE').length;
    const total = this.workItems.length;
    return total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%';
  }

  getPriorityClass(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      'LOW': 'priority-low',
      'MEDIUM': 'priority-medium',
      'HIGH': 'priority-high',
      'CRITICAL': 'priority-critical'
    };
    return priorityMap[priority] || '';
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'TODO': 'status-todo',
      'IN_PROGRESS': 'status-in-progress',
      'IN_REVIEW': 'status-in-review',
      'DONE': 'status-done',
      'BLOCKED': 'status-blocked'
    };
    return statusMap[status] || '';
  }

  getStatusLabel(status: string): string {
    return status.replace('_', ' ');
  }
}
