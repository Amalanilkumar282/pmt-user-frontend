import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, tap, distinctUntilChanged } from 'rxjs/operators';
import { IssueService } from './issue.service';
import { DataCacheService } from './data-cache.service';
import { Issue } from '../models/issue.model';

/**
 * Optimized Issue Service with caching, pagination, and performance optimizations
 * Use this service instead of IssueService directly for better performance
 */
@Injectable({
  providedIn: 'root'
})
export class OptimizedIssueService {
  private issueService = inject(IssueService);
  private cacheService = inject(DataCacheService);

  // State management for paginated loading
  private issuesState = new Map<string, BehaviorSubject<Issue[]>>();
  private loadingState = new Map<string, BehaviorSubject<boolean>>();
  private currentPage = new Map<string, number>();
  private hasMore = new Map<string, boolean>();

  private readonly PAGE_SIZE = 50;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get issues for a project with caching
   */
  getProjectIssues(projectId: string, forceRefresh: boolean = false): Observable<Issue[]> {
    const cacheKey = `issues:project:${projectId}`;

    if (forceRefresh) {
      this.cacheService.invalidate(cacheKey);
    }

    return this.cacheService.get(
      cacheKey,
      () => this.issueService.getProjectIssues(projectId),
      { ttl: this.CACHE_TTL }
    );
  }

  /**
   * Get issues with infinite scroll support
   */
  getProjectIssuesInfinite(projectId: string): {
    issues$: Observable<Issue[]>,
    loading$: Observable<boolean>,
    loadMore: () => void,
    refresh: () => void
  } {
    // Initialize state if not exists
    if (!this.issuesState.has(projectId)) {
      this.issuesState.set(projectId, new BehaviorSubject<Issue[]>([]));
      this.loadingState.set(projectId, new BehaviorSubject<boolean>(false));
      this.currentPage.set(projectId, 1);
      this.hasMore.set(projectId, true);
    }

    const issues$ = this.issuesState.get(projectId)!.asObservable();
    const loading$ = this.loadingState.get(projectId)!.asObservable();

    const loadMore = () => {
      if (this.loadingState.get(projectId)!.value || !this.hasMore.get(projectId)) {
        return; // Already loading or no more data
      }

      const page = this.currentPage.get(projectId)!;
      this.loadingState.get(projectId)!.next(true);

      console.log(`📄 Loading page ${page} for project ${projectId}`);

      this.issueService.getProjectIssuesPaginated(projectId, page, this.PAGE_SIZE)
        .subscribe({
          next: (result) => {
            const currentIssues = this.issuesState.get(projectId)!.value;
            const newIssues = [...currentIssues, ...result.issues];
            
            this.issuesState.get(projectId)!.next(newIssues);
            this.currentPage.set(projectId, page + 1);
            this.hasMore.set(projectId, result.hasMore);
            this.loadingState.get(projectId)!.next(false);

            console.log(`✅ Loaded ${result.issues.length} issues. Total: ${newIssues.length}`);
          },
          error: (error) => {
            console.error('Error loading issues:', error);
            this.loadingState.get(projectId)!.next(false);
          }
        });
    };

    const refresh = () => {
      console.log(`🔄 Refreshing issues for project ${projectId}`);
      this.issuesState.get(projectId)!.next([]);
      this.currentPage.set(projectId, 1);
      this.hasMore.set(projectId, true);
      this.cacheService.invalidatePattern(new RegExp(`issues:project:${projectId}`));
      loadMore();
    };

    // Auto-load first page if empty
    if (this.issuesState.get(projectId)!.value.length === 0 && this.hasMore.get(projectId)) {
      loadMore();
    }

    return { issues$, loading$, loadMore, refresh };
  }

  /**
   * Get issues for a specific sprint with caching
   */
  getSprintIssues(projectId: string, sprintId: string, forceRefresh: boolean = false): Observable<Issue[]> {
    const cacheKey = `issues:sprint:${sprintId}`;

    if (forceRefresh) {
      this.cacheService.invalidate(cacheKey);
    }

    return this.cacheService.get(
      cacheKey,
      () => this.getProjectIssues(projectId).pipe(
        map(issues => issues.filter(issue => issue.sprintId === sprintId))
      ),
      { ttl: this.CACHE_TTL }
    );
  }

  /**
   * Get backlog issues (issues without sprint) with caching
   */
  getBacklogIssues(projectId: string, forceRefresh: boolean = false): Observable<Issue[]> {
    const cacheKey = `issues:backlog:${projectId}`;

    if (forceRefresh) {
      this.cacheService.invalidate(cacheKey);
    }

    return this.cacheService.get(
      cacheKey,
      () => this.getProjectIssues(projectId).pipe(
        map(issues => issues.filter(issue => !issue.sprintId))
      ),
      { ttl: this.CACHE_TTL }
    );
  }

  /**
   * Get issues by user with caching
   */
  getUserIssues(userId: string, forceRefresh: boolean = false): Observable<Issue[]> {
    const cacheKey = `issues:user:${userId}`;

    if (forceRefresh) {
      this.cacheService.invalidate(cacheKey);
    }

    return this.cacheService.get(
      cacheKey,
      () => this.issueService.getIssuesByUser(userId),
      { ttl: this.CACHE_TTL }
    );
  }

  /**
   * Create issue and invalidate cache
   */
  createIssue(issue: any): Observable<any> {
    return this.issueService.createIssue(issue).pipe(
      tap(() => {
        // Invalidate all project-related caches
        this.cacheService.invalidatePattern(new RegExp(`issues:project:${issue.projectId}`));
        this.cacheService.invalidatePattern(new RegExp(`issues:backlog:${issue.projectId}`));
        if (issue.sprintId) {
          this.cacheService.invalidate(`issues:sprint:${issue.sprintId}`);
        }
        console.log('✅ Issue created, cache invalidated');
      })
    );
  }

  /**
   * Update issue and invalidate cache
   */
  updateIssue(issueId: string, issue: any): Observable<any> {
    return this.issueService.updateIssue(issueId, issue).pipe(
      tap(() => {
        // Invalidate all project-related caches
        this.cacheService.invalidatePattern(new RegExp(`issues:project:${issue.projectId}`));
        this.cacheService.invalidatePattern(new RegExp(`issues:backlog:${issue.projectId}`));
        if (issue.sprintId) {
          this.cacheService.invalidate(`issues:sprint:${issue.sprintId}`);
        }
        console.log('✅ Issue updated, cache invalidated');
      })
    );
  }

  /**
   * Preload issues for faster navigation
   */
  preloadProjectIssues(projectId: string): void {
    const cacheKey = `issues:project:${projectId}`;
    this.cacheService.preload(
      cacheKey,
      () => this.issueService.getProjectIssues(projectId),
      { ttl: this.CACHE_TTL }
    );
  }

  /**
   * Clear all issue caches
   */
  clearCache(): void {
    this.cacheService.clear();
    this.issuesState.clear();
    this.loadingState.clear();
    this.currentPage.clear();
    this.hasMore.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cacheService.getStats();
  }
}
