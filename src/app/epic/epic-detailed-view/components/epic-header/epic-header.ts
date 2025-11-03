import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Epic } from '../../../../shared/models/epic.model';
import { EpicService } from '../../../../shared/services/epic.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-epic-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './epic-header.html',
  styleUrl: './epic-header.css'
})
export class EpicHeader {
  @Input() epic!: Epic;
  @Output() close = new EventEmitter<void>();
  @Output() epicDeleted = new EventEmitter<string>();

  showDeleteConfirm = false;
  isDeleting = false;

  private epicService = inject(EpicService);
  private toastService = inject(ToastService);

  onClose() {
    this.close.emit();
  }

  /**
   * Show delete confirmation
   */
  confirmDelete() {
    if (confirm(`Are you sure you want to delete "${this.epic.name || this.epic.title}"? This action cannot be undone.`)) {
      this.deleteEpic();
    }
  }

  /**
   * Delete epic from backend
   */
  private deleteEpic() {
    if (this.isDeleting) return;

    this.isDeleting = true;
    console.log('🗑️ [EpicHeader] Deleting epic:', this.epic.id);

    this.epicService.deleteEpic(this.epic.id).subscribe({
      next: (epicId) => {
        console.log('✅ [EpicHeader] Epic deleted successfully:', epicId);
        this.isDeleting = false;
        this.toastService.success('Epic deleted successfully');
        this.epicDeleted.emit(this.epic.id);
        this.close.emit();
      },
      error: (error) => {
        console.error('❌ [EpicHeader] Error deleting epic:', error);
        this.isDeleting = false;
        this.toastService.error('Failed to delete epic');
      }
    });
  }
}
