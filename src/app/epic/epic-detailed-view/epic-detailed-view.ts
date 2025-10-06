import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Epic, EpicStatus } from '../../shared/models/epic.model';
import { Issue, IssueType, IssuePriority, IssueStatus } from '../../shared/models/issue.model';
import { epic1WorkItems, epic2WorkItems, users, User, sprints, epics as allEpics } from '../../shared/data/dummy-backlog-data';

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
  availableUsers: User[] = users;
  availableSprints = sprints;
  availableEpics: Epic[] = [];
  
  editingDescription = false;
  editingAssignee = false;
  editingReporter = false;
  editingParent = false;
  editingTeam = false;
  editingDueDate = false;
  editingStartDate = false;
  editingSprint = false;
  editingStoryPoints = false;
  editingStatus = false;
  addingLabel = false;

  tempDescription = '';
  tempAssignee = '';
  tempReporter = '';
  tempParent = '';
  tempTeam = '';
  tempDueDate = '';
  tempStartDate = '';
  tempSprint = '';
  tempStoryPoints: number | undefined;
  tempStatus: EpicStatus = 'TODO';
  newLabelInput = '';

  newWorkItemTitle = '';
  newWorkItemType: IssueType = 'TASK';
  showWorkItemTypeDropdown = false;

  editingWorkItems: { [key: string]: { [field: string]: boolean } } = {};
  tempWorkItemValues: { [key: string]: any } = {};

  issueTypes: IssueType[] = ['TASK', 'STORY', 'BUG', 'EPIC', 'SUBTASK'];
  priorities: IssuePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  statuses: IssueStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];
  epicStatuses: EpicStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];

  ngOnInit() {
    this.loadWorkItems();
    this.availableEpics = allEpics.filter(e => e.id !== this.epic.id);
    if (!this.epic.assignee) this.epic.assignee = 'Unassigned';
    if (!this.epic.reporter) this.epic.reporter = 'Unassigned';
    if (!this.epic.parent) this.epic.parent = 'None';
    if (!this.epic.team) this.epic.team = 'None';
    if (!this.epic.sprint) this.epic.sprint = 'None';
    if (!this.epic.labels) this.epic.labels = [];
    if (!this.epic.childWorkItems) this.epic.childWorkItems = [];
    if (!this.epic.status) this.epic.status = 'TODO';
    if (this.epic.storyPoints === undefined) this.epic.storyPoints = 0;
    if (!this.epic.description) this.epic.description = '';
  }

  loadWorkItems() {
    if (this.epic.id === 'epic-1') {
      this.workItems = [...epic1WorkItems];
    } else if (this.epic.id === 'epic-2') {
      this.workItems = [...epic2WorkItems];
    } else {
      this.workItems = [];
    }
  }

  onClose() {
    this.close.emit();
  }

  startEditingDescription() {
    this.editingDescription = true;
    this.tempDescription = this.epic.description || '';
  }

  saveDescription() {
    this.epic.description = this.tempDescription;
    this.editingDescription = false;
    this.emitUpdate();
  }

  cancelDescription() {
    this.editingDescription = false;
  }

  startEditingAssignee() {
    this.editingAssignee = true;
    this.tempAssignee = this.epic.assignee || 'Unassigned';
  }

  saveAssignee() {
    this.epic.assignee = this.tempAssignee;
    this.editingAssignee = false;
    this.emitUpdate();
  }

  cancelAssignee() {
    this.editingAssignee = false;
  }

  startEditingReporter() {
    this.editingReporter = true;
    this.tempReporter = this.epic.reporter || 'Unassigned';
  }

  saveReporter() {
    this.epic.reporter = this.tempReporter;
    this.editingReporter = false;
    this.emitUpdate();
  }

  cancelReporter() {
    this.editingReporter = false;
  }

  startEditingParent() {
    this.editingParent = true;
    this.tempParent = this.epic.parent || 'None';
  }

  saveParent() {
    this.epic.parent = this.tempParent;
    this.editingParent = false;
    this.emitUpdate();
  }

  cancelParent() {
    this.editingParent = false;
  }

  startEditingTeam() {
    this.editingTeam = true;
    this.tempTeam = this.epic.team || 'None';
  }

  saveTeam() {
    this.epic.team = this.tempTeam;
    this.editingTeam = false;
    this.emitUpdate();
  }

  cancelTeam() {
    this.editingTeam = false;
  }

  startEditingDueDate() {
    this.editingDueDate = true;
    this.tempDueDate = this.epic.dueDate ? this.formatDateForInput(this.epic.dueDate) : '';
  }

  saveDueDate() {
    this.epic.dueDate = this.tempDueDate ? new Date(this.tempDueDate) : null;
    this.editingDueDate = false;
    this.emitUpdate();
  }

  cancelDueDate() {
    this.editingDueDate = false;
  }

  startEditingStartDate() {
    this.editingStartDate = true;
    this.tempStartDate = this.epic.startDate ? this.formatDateForInput(this.epic.startDate) : '';
  }

  saveStartDate() {
    this.epic.startDate = this.tempStartDate ? new Date(this.tempStartDate) : null;
    this.editingStartDate = false;
    this.emitUpdate();
  }

  cancelStartDate() {
    this.editingStartDate = false;
  }

  startEditingSprint() {
    this.editingSprint = true;
    this.tempSprint = this.epic.sprint || 'None';
  }

  saveSprint() {
    this.epic.sprint = this.tempSprint;
    this.editingSprint = false;
    this.emitUpdate();
  }

  cancelSprint() {
    this.editingSprint = false;
  }

  startEditingStoryPoints() {
    this.editingStoryPoints = true;
    this.tempStoryPoints = this.epic.storyPoints;
  }

  saveStoryPoints() {
    this.epic.storyPoints = this.tempStoryPoints;
    this.editingStoryPoints = false;
    this.emitUpdate();
  }

  cancelStoryPoints() {
    this.editingStoryPoints = false;
  }

  startEditingStatus() {
    this.editingStatus = true;
    this.tempStatus = this.epic.status || 'TODO';
  }

  saveStatus() {
    this.epic.status = this.tempStatus;
    this.editingStatus = false;
    this.emitUpdate();
  }

  cancelStatus() {
    this.editingStatus = false;
  }

  startAddingLabel() {
    this.addingLabel = true;
    this.newLabelInput = '';
  }

  addLabel() {
    if (this.newLabelInput.trim() && this.epic.labels) {
      if (!this.epic.labels.includes(this.newLabelInput.trim())) {
        this.epic.labels.push(this.newLabelInput.trim());
        this.emitUpdate();
      }
      this.newLabelInput = '';
      this.addingLabel = false;
    }
  }

  cancelAddLabel() {
    this.addingLabel = false;
    this.newLabelInput = '';
  }

  removeLabel(label: string) {
    if (this.epic.labels) {
      this.epic.labels = this.epic.labels.filter(l => l !== label);
      this.emitUpdate();
    }
  }

  startEditingWorkItem(itemId: string, field: string) {
    if (!this.editingWorkItems[itemId]) {
      this.editingWorkItems[itemId] = {};
    }
    this.editingWorkItems[itemId][field] = true;
    const item = this.workItems.find(i => i.id === itemId);
    if (item) {
      if (!this.tempWorkItemValues[itemId]) {
        this.tempWorkItemValues[itemId] = {};
      }
      this.tempWorkItemValues[itemId][field] = (item as any)[field];
    }
  }

  saveWorkItem(itemId: string, field: string) {
    const item = this.workItems.find(i => i.id === itemId);
    if (item && this.tempWorkItemValues[itemId]) {
      (item as any)[field] = this.tempWorkItemValues[itemId][field];
      item.updatedAt = new Date();
    }
    if (this.editingWorkItems[itemId]) {
      this.editingWorkItems[itemId][field] = false;
    }
    this.emitUpdate();
  }

  cancelWorkItemEdit(itemId: string, field: string) {
    if (this.editingWorkItems[itemId]) {
      this.editingWorkItems[itemId][field] = false;
    }
  }

  isEditingWorkItem(itemId: string, field: string): boolean {
    return this.editingWorkItems[itemId]?.[field] || false;
  }

  deleteWorkItem(itemId: string) {
    if (confirm('Are you sure you want to delete this work item?')) {
      this.workItems = this.workItems.filter(i => i.id !== itemId);
      if (this.epic.childWorkItems) {
        this.epic.childWorkItems = this.epic.childWorkItems.filter(id => id !== itemId);
      }
      this.emitUpdate();
    }
  }

  addNewWorkItem() {
    if (this.newWorkItemTitle.trim()) {
      const newId = `SCRUM-${Date.now()}`;
      const newWorkItem: Issue = {
        id: newId,
        title: this.newWorkItemTitle.trim(),
        description: '',
        type: this.newWorkItemType,
        priority: 'MEDIUM',
        status: 'TODO',
        assignee: 'Unassigned',
        storyPoints: 0,
        epicId: this.epic.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.workItems.push(newWorkItem);
      if (!this.epic.childWorkItems) {
        this.epic.childWorkItems = [];
      }
      this.epic.childWorkItems.push(newId);
      this.epic.issueCount = this.workItems.length;
      this.newWorkItemTitle = '';
      this.showWorkItemTypeDropdown = false;
      this.emitUpdate();
    }
  }

  toggleWorkItemTypeDropdown() {
    this.showWorkItemTypeDropdown = !this.showWorkItemTypeDropdown;
  }

  selectWorkItemType(type: IssueType) {
    this.newWorkItemType = type;
    this.showWorkItemTypeDropdown = false;
  }

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

  getTypeIcon(type: IssueType): string {
    const iconMap: { [key: string]: string } = {
      'TASK': '',
      'STORY': '',
      'BUG': '',
      'EPIC': '',
      'SUBTASK': ''
    };
    return iconMap[type] || '';
  }

  private emitUpdate() {
    this.epicUpdated.emit(this.epic);
  }
}
