import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ProjectContextService {
  private _currentProjectId = signal<string | null>(null);
  
  readonly currentProjectId = this._currentProjectId.asReadonly();

  setCurrentProjectId(projectId: string) {
    this._currentProjectId.set(projectId);
  }

  clearCurrentProjectId() {
    this._currentProjectId.set(null);
  }
}
