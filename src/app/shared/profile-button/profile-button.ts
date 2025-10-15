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
  @Output() profileClick = new EventEmitter<void>();
  @Output() closeProfileModal = new EventEmitter<void>();
}
