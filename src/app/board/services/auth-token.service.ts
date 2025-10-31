import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';

/**
 * Centralized service for managing auth tokens
 * All API services should use this instead of directly accessing sessionStorage
 */
@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  /**
   * Get the current access token
   * Returns null if not authenticated or running on server
   */
  getAccessToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return sessionStorage.getItem('accessToken');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Get HTTP headers with authorization token
   * @param additionalHeaders - Additional headers to include
   */
  getAuthHeaders(additionalHeaders: Record<string, string> = {}): HttpHeaders {
    const token = this.getAccessToken();
    
    const headers: Record<string, string> = {
      ...additionalHeaders
    };

    // Only add Authorization header if we have a token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headers);
  }

  /**
   * Log auth status for debugging
   */
  logAuthStatus(): void {
    if (!this.isBrowser) {
      console.log('🔒 Auth: Running on server (SSR)');
      return;
    }

    const token = this.getAccessToken();
    const user = sessionStorage.getItem('currentUser');
    
    console.log('🔒 Auth Status:', {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
      user: user ? JSON.parse(user) : null
    });
  }
}
