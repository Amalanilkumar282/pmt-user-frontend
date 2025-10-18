import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.html',
  styleUrls: ['./notification.css']
})
export class Notification {
  @Input() unreadCount: number = 0;
  @Input() showNotificationModal: boolean = false;
  @Input() notifications: Array<{ title: string; message: string; time: string; unread?: boolean }> = [];
  @Output() notificationClick = new EventEmitter<void>();
  @Output() closeNotificationModal = new EventEmitter<void>();
}
