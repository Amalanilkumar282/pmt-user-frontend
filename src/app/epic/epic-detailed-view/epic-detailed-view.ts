import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Epic } from '../../shared/models/epic.model';
import { Issue } from '../../shared/models/issue.model';
import { epic1WorkItems, epic2WorkItems } from '../../shared/data/dummy-backlog-data';
import { EpicHeader } from './components/epic-header/epic-header';
import { EpicDescription } from './components/epic-description/epic-description';
import { WorkItemsTable } from './components/work-items-table/work-items-table';
import { WorkItemForm } from './components/work-item-form/work-item-form';
import { EpicDetails } from './components/epic-details/epic-details';

@Component({
  selector: 'app-epic-detailed-view',
  standalone: true,
  imports: [CommonModule, EpicHeader, EpicDescription, WorkItemsTable, WorkItemForm, EpicDetails],
  templateUrl: './epic-detailed-view.html',
  styleUrl: './epic-detailed-view.css'
})
export class EpicDetailedView implements OnInit {
  @Input() epic!: Epic;
  @Output() close = new EventEmitter<void>();
  @Output() epicUpdated = new EventEmitter<Epic>();

  workItems: Issue[] = [];

  ngOnInit() {
    this.loadWorkItems();
    this.initializeEpicDefaults();
  }

  private initializeEpicDefaults() {
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

  private loadWorkItems() {
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

  onEpicUpdated(updatedEpic: Epic) {
    this.epic = updatedEpic;
    this.epicUpdated.emit(this.epic);
  }

  onWorkItemsChanged(updatedWorkItems: Issue[]) {
    this.workItems = updatedWorkItems;
    this.epic.childWorkItems = updatedWorkItems.map(item => item.id);
    this.epic.issueCount = updatedWorkItems.length;
    this.epicUpdated.emit(this.epic);
  }

  onWorkItemCreated(newWorkItem: Issue) {
    const newId = `SCRUM-${Date.now()}`;
    const workItem: Issue = {
      ...newWorkItem,
      id: newId,
      epicId: this.epic.id,
      priority: 'MEDIUM',
      status: 'TODO',
      assignee: 'Unassigned',
      storyPoints: 0,
      description: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.workItems.push(workItem);
    if (!this.epic.childWorkItems) {
      this.epic.childWorkItems = [];
    }
    this.epic.childWorkItems.push(newId);
    this.epic.issueCount = this.workItems.length;
    this.epicUpdated.emit(this.epic);
  }
}
