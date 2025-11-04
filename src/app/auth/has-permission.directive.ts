import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy, inject } from '@angular/core';
import { PermissionService, PermissionFlags } from './permission.service';
import { Subject, takeUntil } from 'rxjs';

/**
 * Structural directive to show/hide elements based on user permissions
 * 
 * Usage:
 * <button *hasPermission="'canManageTeams'">Create Sprint</button>
 * <div *hasPermission="['canManageTeams', 'canManageUsers']" [requireAll]="false">...</div>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private permissionService = inject(PermissionService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private destroy$ = new Subject<void>();
  private hasView = false;

  @Input() hasPermission: keyof PermissionFlags | (keyof PermissionFlags)[] = 'canReadProject';
  @Input() requireAll = true; // If true, requires all permissions; if false, requires at least one

  ngOnInit(): void {
    // Subscribe to permission changes
    this.permissionService.currentPermissions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateView();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView(): void {
    const hasPermission = this.checkPermissions();

    if (hasPermission && !this.hasView) {
      // Show the element
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      // Hide the element
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private checkPermissions(): boolean {
    if (Array.isArray(this.hasPermission)) {
      // Multiple permissions
      if (this.requireAll) {
        // Require all permissions
        return this.hasPermission.every(perm => 
          this.permissionService.hasPermission(perm)
        );
      } else {
        // Require at least one permission
        return this.hasPermission.some(perm => 
          this.permissionService.hasPermission(perm)
        );
      }
    } else {
      // Single permission
      return this.permissionService.hasPermission(this.hasPermission);
    }
  }
}
