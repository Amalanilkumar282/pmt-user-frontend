import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Permission {
  id: number;
  name: string;
  description: string;
}

export interface PermissionFlags {
  canCreateProject: boolean;
  canReadProject: boolean;
  canUpdateProject: boolean;
  canDeleteProject: boolean;
  canManageTeams: boolean;
  canManageUsers: boolean;
}

export interface UserPermissions {
  userId: number;
  userName: string;
  userEmail: string;
  projectId: string;
  projectName: string;
  roleId: number;
  roleName: string;
  isOwner: boolean;
  addedAt: string;
  permissions: Permission[];
  permissionFlags: PermissionFlags;
}

export interface PermissionResponse {
  status: number;
  data: UserPermissions;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  private apiUrl = environment.apiUrl;

  // BehaviorSubject to hold current user permissions
  private currentPermissionsSubject = new BehaviorSubject<UserPermissions | null>(null);
  public currentPermissions$ = this.currentPermissionsSubject.asObservable();

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    // Try to load permissions from session storage on init
    this.loadPermissionsFromStorage();
  }

  /**
   * Load permissions from session storage
   */
  private loadPermissionsFromStorage(): void {
    if (this.isBrowser) {
      const storedPermissions = sessionStorage.getItem('userPermissions');
      if (storedPermissions) {
        try {
          const permissions = JSON.parse(storedPermissions);
          this.currentPermissionsSubject.next(permissions);
          console.log('✅ Loaded permissions from session storage:', permissions);
        } catch (error) {
          console.error('❌ Error parsing stored permissions:', error);
          sessionStorage.removeItem('userPermissions');
        }
      }
    }
  }

  /**
   * Fetch user permissions for a specific project
   * @param projectId The project ID to fetch permissions for
   */
  getUserPermissions(projectId: string): Observable<UserPermissions> {
    const url = `${this.apiUrl}/api/Permission/me/project/${projectId}`;
    
    return this.http.get<PermissionResponse>(url).pipe(
      map(response => {
        if (response.status === 200 && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch permissions');
      }),
      tap(permissions => {
        // Store permissions in memory and session storage
        this.currentPermissionsSubject.next(permissions);
        if (this.isBrowser) {
          sessionStorage.setItem('userPermissions', JSON.stringify(permissions));
          console.log('✅ Fetched and stored permissions:', permissions);
        }
      }),
      catchError(error => {
        console.error('❌ Error fetching user permissions:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current permissions synchronously
   */
  getCurrentPermissions(): UserPermissions | null {
    return this.currentPermissionsSubject.value;
  }

  /**
   * Clear stored permissions (useful on logout or project change)
   */
  clearPermissions(): void {
    this.currentPermissionsSubject.next(null);
    if (this.isBrowser) {
      sessionStorage.removeItem('userPermissions');
      console.log('✅ Cleared permissions');
    }
  }

  /**
   * Check if user has a specific permission flag
   */
  hasPermission(permission: keyof PermissionFlags): boolean {
    const permissions = this.getCurrentPermissions();
    if (!permissions) {
      return false;
    }
    return permissions.permissionFlags[permission] === true;
  }

  /**
   * Check if user can read project (normal developer privileges)
   */
  canReadProject(): boolean {
    return this.hasPermission('canReadProject');
  }

  /**
   * Check if user can update project status
   */
  canUpdateProject(): boolean {
    return this.hasPermission('canUpdateProject');
  }

  /**
   * Check if user can manage teams (includes sprint management)
   */
  canManageTeams(): boolean {
    return this.hasPermission('canManageTeams');
  }

  /**
   * Check if user can manage users
   */
  canManageUsers(): boolean {
    return this.hasPermission('canManageUsers');
  }

  /**
   * Check if user is a Customer
   */
  isCustomer(): boolean {
    const permissions = this.getCurrentPermissions();
    if (!permissions) {
      return false;
    }
    return permissions.roleName.toLowerCase() === 'customer';
  }

  /**
   * Check if user is project owner
   */
  isOwner(): boolean {
    const permissions = this.getCurrentPermissions();
    if (!permissions) {
      return false;
    }
    return permissions.isOwner === true;
  }

  /**
   * Get user's role name
   */
  getUserRole(): string | null {
    const permissions = this.getCurrentPermissions();
    return permissions ? permissions.roleName : null;
  }

  /**
   * Check if issue should be visible to current user
   * Private issues are hidden from Customer users
   */
  canViewIssue(issueLabels: string[]): boolean {
    // If user is not a customer, they can view all issues
    if (!this.isCustomer()) {
      return true;
    }

    // If user is a customer, check if issue has 'private' label
    const hasPrivateLabel = issueLabels.some(label => 
      label.toLowerCase() === 'private'
    );

    // Customer cannot view private issues
    return !hasPrivateLabel;
  }

  /**
   * Check if user can perform sprint management actions
   * (create, start, edit, delete, complete sprints)
   */
  canManageSprints(): boolean {
    return this.canManageTeams();
  }

  /**
   * Get a user-friendly message about missing permissions
   */
  getPermissionDeniedMessage(action: string): string {
    const role = this.getUserRole() || 'your current role';
    return `You don't have permission to ${action}. This action requires additional privileges. Your current role is: ${role}`;
  }
}
