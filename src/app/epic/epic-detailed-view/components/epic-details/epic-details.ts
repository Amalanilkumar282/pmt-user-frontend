import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Epic, EpicStatus } from '../../../../shared/models/epic.model';
import { users, User, sprints, epics as allEpics } from '../../../../shared/data/dummy-backlog-data';

@Component({
  selector: 'app-epic-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './epic-details.html',
  styleUrl: './epic-details.css'
})
export class EpicDetails implements OnInit {
  @Input() epic!: Epic;
  @Output() epicUpdated = new EventEmitter<Epic>();

  availableUsers: User[] = users;
  availableSprints = sprints;
  availableEpics: Epic[] = [];
  epicStatuses: EpicStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];

  editing: { [key: string]: boolean } = {};
  temp: { [key: string]: any } = {};

  ngOnInit() {
    this.availableEpics = allEpics.filter(e => e.id !== this.epic.id);
  }

  startEdit(field: string, value: any) {
    this.editing[field] = true;
    this.temp[field] = value;
  }

  save(field: string) {
    (this.epic as any)[field] = this.temp[field];
    this.editing[field] = false;
    this.epicUpdated.emit(this.epic);
  }

  saveDueDate() {
    this.epic.dueDate = this.temp['dueDate'] ? new Date(this.temp['dueDate']) : null;
    this.editing['dueDate'] = false;
    this.epicUpdated.emit(this.epic);
  }

  saveStartDate() {
    this.epic.startDate = this.temp['startDate'] ? new Date(this.temp['startDate']) : null;
    this.editing['startDate'] = false;
    this.epicUpdated.emit(this.epic);
  }

  cancel(field: string) {
    this.editing[field] = false;
  }

  addLabel() {
    const label = this.temp['newLabel'];
    if (label?.trim() && this.epic.labels) {
      if (!this.epic.labels.includes(label.trim())) {
        this.epic.labels.push(label.trim());
        this.epicUpdated.emit(this.epic);
      }
      this.temp['newLabel'] = '';
      this.editing['labels'] = false;
    }
  }

  removeLabel(label: string) {
    if (this.epic.labels) {
      this.epic.labels = this.epic.labels.filter(l => l !== label);
      this.epicUpdated.emit(this.epic);
    }
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

  getStatusClass(status: string): string {
    const map: { [key: string]: string } = {
      'TODO': 'status-todo',
      'IN_PROGRESS': 'status-in-progress',
      'IN_REVIEW': 'status-in-review',
      'DONE': 'status-done',
      'BLOCKED': 'status-blocked'
    };
    return map[status] || '';
  }

  getStatusLabel(status: string): string {
    return status.replace('_', ' ');
  }
}
