import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay, map } from 'rxjs';
import { UserApiService, User } from './user-api.service';

/**
 * Centralized cache for project members to prevent duplicate API calls
 * when multiple components need the same project's user list.
 */
@Injectable({ providedIn: 'root' })
export class ProjectMembersCacheService {
  private userApiService = inject(UserApiService);
  private cache = new Map<string, Observable<User[]>>();

  /**
   * Get project members with automatic caching.
   * Multiple subscribers to the same projectId will share a single HTTP request.
   */
  getProjectMembers(projectId: string): Observable<User[]> {
    if (!this.cache.has(projectId)) {
      // Create a shared observable that caches the result
      const shared$ = this.userApiService.getUsersByProject(projectId).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.cache.set(projectId, shared$);
      
      console.log('[ProjectMembersCache] Created new cache entry for project:', projectId);
    } else {
      console.log('[ProjectMembersCache] Using cached members for project:', projectId);
    }
    
    return this.cache.get(projectId)!;
  }

  /**
   * Clear cache for a specific project (call after project members change)
   */
  invalidate(projectId: string): void {
    this.cache.delete(projectId);
    console.log('[ProjectMembersCache] Invalidated cache for project:', projectId);
  }

  /**
   * Clear all cached project members
   */
  invalidateAll(): void {
    this.cache.clear();
    console.log('[ProjectMembersCache] Cleared all cached project members');
  }
}
