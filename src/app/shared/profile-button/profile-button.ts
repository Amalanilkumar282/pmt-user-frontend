import { Component, Input, Output, EventEmitter, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-profile-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-button.html',
  styleUrls: ['./profile-button.css'],
})
export class ProfileButton implements OnInit {
  @Input() showProfileModal: boolean = false;
  @Input() userName: string = 'Nadim Naisam';
  @Input() userEmail: string = 'nadim.naisam@experionglobal.com';
  @Output() profileClick = new EventEmitter<void>();
  @Output() closeProfileModal = new EventEmitter<void>();

  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;

  userRole: string = '';

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    // Only access sessionStorage in browser
    if (!this.isBrowser) {
      return;
    }

    const token = sessionStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userName = payload.name || this.userName;
        this.userEmail = payload.email || this.userEmail;
        this.userRole =
          payload.role ||
          payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
          '';
      } catch (e) {
          // Failed to parse JWT for profile info
      }
    }
  }

  get initials(): string {
    if (!this.userName) return '';
    return this.userName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  logout(): void {
    this.authService.logout();
  }
}
