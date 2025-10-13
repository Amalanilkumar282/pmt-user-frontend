import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-summary-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-modal.html',
  styleUrls: ['./summary-modal.css']
})
export class SummaryModal {
  @Input() show: boolean = false;
  @Input() summary: string = '';
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
