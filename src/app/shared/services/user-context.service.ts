import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Service to provide user context information from session storage
 * Used for create/update/delete operations that require user identification
 */
@Injectable({
  providedIn: 'root'
})
export class UserContextService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * Get current user ID from session storage
   * Returns numeric ID as stored by auth service
   */
  getCurrentUserId(): number | null {
    if (!this.isBrowser) {
      return null;
    }

    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      console.warn('[UserContextService] No userId found in sessionStorage');
      return null;
    }

    const numericId = parseInt(userId, 10);
    if (isNaN(numericId)) {
      console.error('[UserContextService] Invalid userId format:', userId);
      return null;
    }

    return numericId;
  }

  /**
   * Get current user ID as string
   */
  getCurrentUserIdString(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    return sessionStorage.getItem('userId');
  }

  /**
   * Get current user email from session storage
   */
  getCurrentUserEmail(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    const userJson = sessionStorage.getItem('currentUser');
    if (!userJson) {
      return null;
    }

    try {
      const user = JSON.parse(userJson);
      return user?.email || null;
    } catch (error) {
      console.error('[UserContextService] Error parsing currentUser:', error);
      return null;
    }
  }

  /**
   * Get full current user object from session storage
   */
  getCurrentUser(): any | null {
    if (!this.isBrowser) {
      return null;
    }

    const userJson = sessionStorage.getItem('currentUser');
    if (!userJson) {
      return null;
    }

    try {
      return JSON.parse(userJson);
    } catch (error) {
      console.error('[UserContextService] Error parsing currentUser:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    const token = sessionStorage.getItem('accessToken');
    const userId = sessionStorage.getItem('userId');
    return !!(token && userId);
  }
}
