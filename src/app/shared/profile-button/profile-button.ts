import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';

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

  private authService = inject(AuthService);

  get initials(): string {
    if (!this.userName) return '';
    return this.userName
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  logout(): void {
    this.authService.logout();
  }
}
