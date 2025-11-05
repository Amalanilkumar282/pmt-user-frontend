import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { tap, share, finalize } from 'rxjs/operators';

interface CacheEntry {
  response: HttpResponse<any>;
  timestamp: number;
}

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, CacheEntry>();
  private inFlightRequests = new Map<string, Subject<HttpEvent<any>>>();
  
  // Cache configuration
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 200;
  
  // Cacheable endpoints patterns
  private readonly CACHEABLE_PATTERNS = [
    /\/api\/User\//,
    /\/api\/Project\//,
    /\/api\/Label/,
    /\/api\/Status/,
    /\/api\/Team\//,
    /\/api\/Board\//,
    /\/api\/Epic\/project\//,
    /\/api\/Sprint\/project\//,
    /\/api\/Issue\/project\/.+\/issues$/,
    /\/api\/Issue\/project\/.+\/type-count/,
    /\/api\/Issue\/project\/.+\/statuses/,
  ];
  
  // Long cache TTL for rarely changing data
  private readonly LONG_CACHE_PATTERNS = [
    { pattern: /\/api\/User\//, ttl: 10 * 60 * 1000 }, // 10 minutes
    { pattern: /\/api\/Label/, ttl: 15 * 60 * 1000 },  // 15 minutes
    { pattern: /\/api\/Status/, ttl: 15 * 60 * 1000 }, // 15 minutes
  ];
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only cache GET requests
    if (req.method !== 'GET') {
      // For mutations, invalidate related cache entries
      this.invalidateRelatedCache(req.url);
      return next.handle(req);
    }
    
    // Check if this endpoint should be cached
    if (!this.isCacheable(req.url)) {
      return next.handle(req);
    }
    
    const cacheKey = this.getCacheKey(req);
    
    // Check cache
    const cached = this.getCached(cacheKey);
    if (cached) {
      console.log(`🚀 [CacheInterceptor] Cache HIT: ${req.url}`);
      return of(cached);
    }
    
    // Check if request is already in-flight (request deduplication)
    const inFlight = this.inFlightRequests.get(cacheKey);
    if (inFlight) {
      console.log(`⏳ [CacheInterceptor] Request IN-FLIGHT: ${req.url}`);
      return inFlight.asObservable();
    }
    
    // Make new request
    console.log(`📡 [CacheInterceptor] Cache MISS: ${req.url}`);
    const subject = new Subject<HttpEvent<any>>();
    this.inFlightRequests.set(cacheKey, subject);
    
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          // Cache successful responses
          if (event.status === 200) {
            this.setCached(cacheKey, event, req.url);
          }
          subject.next(event);
          subject.complete();
        }
      }),
      finalize(() => {
        this.inFlightRequests.delete(cacheKey);
      }),
      share() // Share the same observable with multiple subscribers
    );
  }
  
  private getCacheKey(req: HttpRequest<any>): string {
    // Include URL and query params in cache key
    return `${req.method}:${req.urlWithParams}`;
  }
  
  private isCacheable(url: string): boolean {
    return this.CACHEABLE_PATTERNS.some(pattern => pattern.test(url));
  }
  
  private getCacheTTL(url: string): number {
    const longCacheConfig = this.LONG_CACHE_PATTERNS.find(config => config.pattern.test(url));
    return longCacheConfig ? longCacheConfig.ttl : this.DEFAULT_CACHE_TTL;
  }
  
  private getCached(key: string): HttpResponse<any> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > this.DEFAULT_CACHE_TTL) {
      // Expired
      this.cache.delete(key);
      return null;
    }
    
    return entry.response;
  }
  
  private setCached(key: string, response: HttpResponse<any>, url: string): void {
    const ttl = this.getCacheTTL(url);
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
    
    // Enforce cache size limit
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
  }
  
  /**
   * Invalidate cache entries related to a mutation
   */
  private invalidateRelatedCache(url: string): void {
    const keysToDelete: string[] = [];
    
    // Extract resource type from URL
    let resourceType: string | null = null;
    if (url.includes('/Issue')) resourceType = 'Issue';
    else if (url.includes('/Sprint')) resourceType = 'Sprint';
    else if (url.includes('/Epic')) resourceType = 'Epic';
    else if (url.includes('/Board')) resourceType = 'Board';
    else if (url.includes('/Project')) resourceType = 'Project';
    else if (url.includes('/Team')) resourceType = 'Team';
    
    if (resourceType) {
      this.cache.forEach((_, key) => {
        if (key.includes(resourceType!)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => this.cache.delete(key));
      
      if (keysToDelete.length > 0) {
        console.log(`🗑️ [CacheInterceptor] Invalidated ${keysToDelete.length} cache entries for ${resourceType}`);
      }
    }
  }
  
  /**
   * Manually clear all cache
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('🗑️ [CacheInterceptor] Cache cleared');
  }
  
  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number, entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}
