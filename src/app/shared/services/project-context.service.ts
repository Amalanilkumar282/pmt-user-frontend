import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ProjectContextService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  private _currentProjectId = signal<string | null>(null);
  
  readonly currentProjectId = this._currentProjectId.asReadonly();

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Load project ID from session storage on initialization
    if (this.isBrowser) {
      const storedProjectId = sessionStorage.getItem('currentProjectId');
      if (storedProjectId) {
        this._currentProjectId.set(storedProjectId);
      }
    }
  }

  setCurrentProjectId(projectId: string) {
    this._currentProjectId.set(projectId);
    
    // Store in session storage for persistence
    if (this.isBrowser) {
      sessionStorage.setItem('currentProjectId', projectId);
      console.log('✅ Current project ID set in session storage:', projectId);
    }
  }

  clearCurrentProjectId() {
    this._currentProjectId.set(null);
    
    // Remove from session storage
    if (this.isBrowser) {
      sessionStorage.removeItem('currentProjectId');
      console.log('✅ Current project ID cleared from session storage');
    }
  }

  getCurrentProjectId(): string | null {
    return this._currentProjectId();
  }
}
