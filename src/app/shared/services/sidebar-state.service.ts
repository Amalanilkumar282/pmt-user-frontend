import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  // Global sidebar collapsed state
  private _isCollapsed = signal(false);
  
  // Expose as readonly signal
  readonly isCollapsed = this._isCollapsed.asReadonly();

  toggleCollapse(): void {
    this._isCollapsed.set(!this._isCollapsed());
  }

  setCollapsed(collapsed: boolean): void {
    this._isCollapsed.set(collapsed);
  }

  getCollapsed(): boolean {
    return this._isCollapsed();
  }
}
