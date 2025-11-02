import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-modal.html',
  styleUrl: './confirmation-modal.css'
})
export class ConfirmationModal {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() type: 'danger' | 'warning' | 'info' = 'warning';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }

  getIconColor() {
    switch (this.type) {
      case 'danger':
        return 'text-red-500';
      case 'warning':
        return 'text-blue-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-blue-500';
    }
  }

  getIconBgColor() {
    switch (this.type) {
      case 'danger':
        return 'bg-red-50';
      case 'warning':
        return 'bg-blue-50';
      case 'info':
        return 'bg-blue-50';
      default:
        return 'bg-blue-50';
    }
  }

  getConfirmButtonColor() {
    switch (this.type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning':
        return 'bg-[#3D62A8] hover:bg-[#2F4D8C] focus:ring-[#3D62A8]';
      case 'info':
        return 'bg-[#3D62A8] hover:bg-[#2F4D8C] focus:ring-[#3D62A8]';
      default:
        return 'bg-[#3D62A8] hover:bg-[#2F4D8C] focus:ring-[#3D62A8]';
    }
  }
}
