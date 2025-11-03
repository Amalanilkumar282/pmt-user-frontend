import { Injectable, signal } from '@angular/core';

/**
 * Service for managing global loading state
 *
 * Usage:
 * - LoadingInterceptor automatically manages this
 * - Components can also manually control loading state
 * - Use isLoading() signal in components to show/hide spinner
 */
@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingCount = 0;
  private _isLoading = signal(false);

  // Public readonly signal
  isLoading = this._isLoading.asReadonly();

  /**
   * Increment loading counter and show loading indicator
   */
  show(): void {
    this.loadingCount++;
    this._isLoading.set(true);
  }

  /**
   * Decrement loading counter and hide loading indicator if no more requests
   */
  hide(): void {
    this.loadingCount--;
    if (this.loadingCount <= 0) {
      this.loadingCount = 0;
      this._isLoading.set(false);
    }
  }

  /**
   * Force hide loading indicator (useful for error recovery)
   */
  forceHide(): void {
    this.loadingCount = 0;
    this._isLoading.set(false);
  }
}
