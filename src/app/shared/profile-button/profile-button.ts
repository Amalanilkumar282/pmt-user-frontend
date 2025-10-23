import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-button.html',
  styleUrls: ['./profile-button.css']
})
export class ProfileButton {
  @Input() showProfileModal: boolean = false;
  @Input() userName: string = 'Nadim Naisam';
  @Input() userEmail: string = 'nadim.naisam@experionglobal.com';
  @Output() profileClick = new EventEmitter<void>();
  @Output() closeProfileModal = new EventEmitter<void>();

  get initials(): string {
    if (!this.userName) return '';
    return this.userName
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  }
}
