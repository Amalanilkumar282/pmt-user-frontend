import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface ProjectInfo {
  id: string;
  name: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectContextService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  private _currentProjectId = signal<string | null>(null);
  private _currentProjectInfo = signal<ProjectInfo | null>(null);
  
  readonly currentProjectId = this._currentProjectId.asReadonly();
  readonly currentProjectInfo = this._currentProjectInfo.asReadonly();

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Load project ID and info from session storage on initialization
    if (this.isBrowser) {
      const storedProjectId = sessionStorage.getItem('currentProjectId');
      if (storedProjectId) {
        this._currentProjectId.set(storedProjectId);
      }
      
      const storedProjectInfo = sessionStorage.getItem('currentProjectInfo');
      if (storedProjectInfo) {
        this._currentProjectInfo.set(JSON.parse(storedProjectInfo));
      }
    }
  }

  setCurrentProjectId(projectId: string, projectName?: string) {
    this._currentProjectId.set(projectId);
    
    // Store in session storage for persistence
    if (this.isBrowser) {
      sessionStorage.setItem('currentProjectId', projectId);
      console.log('✅ Current project ID set in session storage:', projectId);
      
      // If project name is provided, store it as well
      if (projectName) {
        const projectInfo: ProjectInfo = {
          id: projectId,
          name: projectName,
          icon: this.generateProjectIcon(projectName)
        };
        this._currentProjectInfo.set(projectInfo);
        sessionStorage.setItem('currentProjectInfo', JSON.stringify(projectInfo));
        console.log('✅ Current project info set:', projectInfo);
      }
    }
  }

  setCurrentProjectInfo(projectInfo: ProjectInfo) {
    this._currentProjectInfo.set(projectInfo);
    this._currentProjectId.set(projectInfo.id);
    
    if (this.isBrowser) {
      sessionStorage.setItem('currentProjectInfo', JSON.stringify(projectInfo));
      sessionStorage.setItem('currentProjectId', projectInfo.id);
      console.log('✅ Current project info set:', projectInfo);
    }
  }

  private generateProjectIcon(projectName: string): string {
    // Generate a 2-letter icon from project name
    const words = projectName.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return projectName.substring(0, 2).toUpperCase();
  }

  clearCurrentProjectId() {
    this._currentProjectId.set(null);
    this._currentProjectInfo.set(null);
    
    // Remove from session storage
    if (this.isBrowser) {
      sessionStorage.removeItem('currentProjectId');
      sessionStorage.removeItem('currentProjectInfo');
      console.log('✅ Current project ID and info cleared from session storage');
    }
  }

  getCurrentProjectId(): string | null {
    return this._currentProjectId();
  }

  getCurrentProjectInfo(): ProjectInfo | null {
    return this._currentProjectInfo();
  }
}
