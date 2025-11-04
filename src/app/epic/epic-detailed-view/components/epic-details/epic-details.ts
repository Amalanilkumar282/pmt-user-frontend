import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Epic, EpicStatus, UpdateEpicRequest } from '../../../../shared/models/epic.model';
import { users, User, sprints, epics as allEpics } from '../../../../shared/data/dummy-backlog-data';
import { EpicService } from '../../../../shared/services/epic.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { formatDisplayDate } from '../../../../shared/utils/date-formatter';

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
  isSaving = false;

  private epicService = inject(EpicService);
  private toastService = inject(ToastService);

  ngOnInit() {
    this.availableEpics = allEpics.filter(e => e.id !== this.epic.id);
  }

  startEdit(field: string, value: any) {
    this.editing[field] = true;
    this.temp[field] = value;
  }

  /**
   * Save epic field changes to backend
   */
  save(field: string) {
    (this.epic as any)[field] = this.temp[field];
    this.editing[field] = false;
    this.saveEpicToBackend();
  }

  saveDueDate() {
    this.epic.dueDate = this.temp['dueDate'] ? new Date(this.temp['dueDate']) : null;
    this.editing['dueDate'] = false;
    this.saveEpicToBackend();
  }

  saveStartDate() {
    this.epic.startDate = this.temp['startDate'] ? new Date(this.temp['startDate']) : null;
    this.editing['startDate'] = false;
    this.saveEpicToBackend();
  }

  /**
   * Save epic updates to backend
   */
  private saveEpicToBackend() {
    if (this.isSaving) return;

    // Get assigneeId and reporterId from the epic or default values
    const assigneeId = this.epic.assigneeId || this.epicService.getCurrentUserId() || 1;
    const reporterId = this.epic.reporterId || this.epicService.getCurrentUserId() || 1;

    const updateRequest: UpdateEpicRequest = {
      id: this.epic.id,
      title: this.epic.name || this.epic.title || '',
      description: this.epic.description || '',
      startDate: this.epicService.formatDateForBackend(this.epic.startDate),
      dueDate: this.epicService.formatDateForBackend(this.epic.dueDate),
      assigneeId: assigneeId,
      reporterId: reporterId,
      labels: this.epic.labels || []
    };

    this.isSaving = true;
    console.log('🔄 [EpicDetails] Saving epic:', updateRequest);

    this.epicService.updateEpic(updateRequest).subscribe({
      next: (epicId) => {
        console.log('✅ [EpicDetails] Epic updated successfully:', epicId);
        this.isSaving = false;
        this.toastService.success('Epic updated successfully');
        this.epicUpdated.emit(this.epic);
      },
      error: (error) => {
        console.error('❌ [EpicDetails] Error updating epic:', error);
        this.isSaving = false;
        this.toastService.error('Failed to update epic');
      }
    });
  }

  cancel(field: string) {
    this.editing[field] = false;
  }

  addLabel() {
    const label = this.temp['newLabel'];
    if (label?.trim() && this.epic.labels) {
      if (!this.epic.labels.includes(label.trim())) {
        this.epic.labels.push(label.trim());
        this.saveEpicToBackend();
      }
      this.temp['newLabel'] = '';
      this.editing['labels'] = false;
    }
  }

  removeLabel(label: string) {
    if (this.epic.labels) {
      this.epic.labels = this.epic.labels.filter(l => l !== label);
      this.saveEpicToBackend();
    }
  }

  formatDate(date: Date | null): string {
    return formatDisplayDate(date);
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
