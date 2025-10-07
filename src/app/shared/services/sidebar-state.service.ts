import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarStateService {
  private readonly STORAGE_KEY = 'sidebar-collapsed-state';

  // Global sidebar collapsed state - initialize from localStorage
  private _isCollapsed = signal(this.loadFromStorage());

  // Expose as readonly signal
  readonly isCollapsed = this._isCollapsed.asReadonly();

  private loadFromStorage(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored === 'true';
    }
    return false;
  }

  private saveToStorage(value: boolean): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEY, value.toString());
    }
  }

  toggleCollapse(): void {
    const newValue = !this._isCollapsed();
    this._isCollapsed.set(newValue);
    this.saveToStorage(newValue);
  }

  setCollapsed(collapsed: boolean): void {
    this._isCollapsed.set(collapsed);
    this.saveToStorage(collapsed);
  }

  getCollapsed(): boolean {
    return this._isCollapsed();
  }
}
