import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-profile-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-button.html',
  styleUrls: ['./profile-button.css']
})
export class ProfileButton implements OnInit {
  @Input() showProfileModal: boolean = false;
  @Input() userName: string = 'Nadim Naisam';
  @Input() userEmail: string = 'nadim.naisam@experionglobal.com';
  @Output() profileClick = new EventEmitter<void>();
  @Output() closeProfileModal = new EventEmitter<void>();

  private authService = inject(AuthService);
  userRole: string = '';

  ngOnInit() {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userName = payload.name || '';
        this.userEmail = payload.email || '';
        this.userRole = payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || '';
      } catch (e) {
        console.error('Failed to parse JWT for profile info:', e);
      }
    }
  }

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
