import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, shareReplay, timer, Subject } from 'rxjs';
import { tap, catchError, switchMap, finalize } from 'rxjs/operators';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  hits: number; // Track cache hits for LRU/LFU eviction
  size?: number; // Approximate size in bytes
}

export interface CacheConfig {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  maxSize?: number; // Maximum number of cache entries (default: 200)
  refreshInterval?: number; // Auto-refresh interval in milliseconds (optional)
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh data
  maxMemoryMB?: number; // Maximum memory usage in MB (default: 50MB)
}

interface RequestCoalescence {
  observable: Observable<any>;
  subscribers: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlightRequests = new Map<string, RequestCoalescence>();
  private cacheSubjects = new Map<string, BehaviorSubject<any>>();
  private pendingInvalidations = new Set<string>();
  
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private defaultMaxSize = 200; // Increased from 100
  private maxMemoryBytes = 50 * 1024 * 1024; // 50MB
  private currentMemoryUsage = 0;

  /**
   * Get data from cache or execute the data fetcher
   * OPTIMIZED with request coalescing, stale-while-revalidate, and memory management
   */
  get<T>(
    key: string,
    dataFetcher: () => Observable<T>,
    config?: CacheConfig
  ): Observable<T> {
    const ttl = config?.ttl ?? this.defaultTTL;
    const now = Date.now();

    // Check if data is in cache and still valid
    const cachedEntry = this.cache.get(key);
    if (cachedEntry && cachedEntry.expiresAt > now) {
      cachedEntry.hits++; // Increment hit counter for LFU
      console.log(`✅ Cache HIT: ${key} (hits: ${cachedEntry.hits})`);
      return of(cachedEntry.data as T);
    }

    // Stale-while-revalidate: Return stale data immediately while fetching fresh data
    if (config?.staleWhileRevalidate && cachedEntry) {
      console.log(`⚡ Stale-while-revalidate: ${key}`);
      // Return stale data immediately
      const staleData = of(cachedEntry.data as T);
      
      // Fetch fresh data in background
      this.fetchAndCache(key, dataFetcher, ttl, config);
      
      return staleData;
    }

    // Check if request is already in-flight (request coalescing)
    const inFlight = this.inFlightRequests.get(key);
    if (inFlight) {
      inFlight.subscribers++;
      console.log(`🔄 Request IN-FLIGHT (coalesced): ${key} (subscribers: ${inFlight.subscribers})`);
      return inFlight.observable as Observable<T>;
    }

    // Make new request
    console.log(`❌ Cache MISS: ${key} - Fetching data...`);
    return this.fetchAndCache(key, dataFetcher, ttl, config);
  }

  /**
   * Fetch data and store in cache
   */
  private fetchAndCache<T>(
    key: string,
    dataFetcher: () => Observable<T>,
    ttl: number,
    config?: CacheConfig
  ): Observable<T> {
    const now = Date.now();
    
    const request$ = dataFetcher().pipe(
      tap(data => {
        // Calculate approximate size
        const size = this.estimateSize(data);
        
        // Store in cache
        this.cache.set(key, {
          data,
          timestamp: now,
          expiresAt: now + ttl,
          hits: 1,
          size
        });

        this.currentMemoryUsage += size;

        // Clean up old entries if cache is too large
        this.enforceMaxSize(config?.maxSize);
        this.enforceMemoryLimit(config?.maxMemoryMB);

        // Update subject if exists
        const subject = this.cacheSubjects.get(key);
        if (subject) {
          subject.next(data);
        }
      }),
      catchError(error => {
        console.error(`❌ Error fetching data for key: ${key}`, error);
        throw error;
      }),
      finalize(() => {
        this.inFlightRequests.delete(key);
      }),
      shareReplay(1) // Share the result with multiple subscribers
    );

    this.inFlightRequests.set(key, {
      observable: request$,
      subscribers: 1
    });
    
    return request$;
  }

  /**
   * Estimate size of data in bytes
   */
  private estimateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      // Fallback: rough estimate
      return 1024; // 1KB default
    }
  }

  /**
   * Get data with auto-refresh capability
   */
  getWithRefresh<T>(
    key: string,
    dataFetcher: () => Observable<T>,
    config?: CacheConfig
  ): Observable<T> {
    let subject = this.cacheSubjects.get(key);
    
    if (!subject) {
      subject = new BehaviorSubject<T | null>(null);
      this.cacheSubjects.set(key, subject);

      // Initial fetch
      this.get(key, dataFetcher, config).subscribe(data => {
        subject!.next(data);
      });

      // Setup auto-refresh if interval is specified
      if (config?.refreshInterval) {
        timer(config.refreshInterval, config.refreshInterval).pipe(
          switchMap(() => dataFetcher())
        ).subscribe(data => {
          const size = this.estimateSize(data);
          this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + (config.ttl ?? this.defaultTTL),
            hits: 1,
            size
          });
          subject!.next(data);
        });
      }
    }

    return subject.asObservable() as Observable<T>;
  }

  /**
   * Invalidate cache for a specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.inFlightRequests.delete(key);
    console.log(`🗑️ Cache invalidated: ${key}`);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.inFlightRequests.delete(key);
    });

    console.log(`🗑️ Cache invalidated for pattern ${pattern}: ${keysToDelete.length} entries`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.inFlightRequests.clear();
    this.cacheSubjects.clear();
    console.log('🗑️ Cache cleared completely');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
    inFlightCount: number;
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      inFlightCount: this.inFlightRequests.size
    };
  }

  /**
   * Enforce maximum cache size by removing least frequently used entries (LFU)
   */
  private enforceMaxSize(maxSize?: number): void {
    const limit = maxSize ?? this.defaultMaxSize;
    
    if (this.cache.size > limit) {
      // Use LFU (Least Frequently Used) eviction strategy
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => {
          // First by hits (ascending), then by timestamp (ascending)
          if (a[1].hits !== b[1].hits) {
            return a[1].hits - b[1].hits;
          }
          return a[1].timestamp - b[1].timestamp;
        });
      
      const toRemove = sortedEntries.slice(0, this.cache.size - limit);
      toRemove.forEach(([key, entry]) => {
        this.currentMemoryUsage -= (entry.size || 0);
        this.cache.delete(key);
        console.log(`🗑️ Cache entry removed (LFU): ${key} (hits: ${entry.hits})`);
      });
    }
  }

  /**
   * Enforce memory limit by removing entries
   */
  private enforceMemoryLimit(maxMemoryMB?: number): void {
    const limitBytes = (maxMemoryMB ?? 50) * 1024 * 1024;
    
    if (this.currentMemoryUsage > limitBytes) {
      console.log(`⚠️ Memory limit exceeded: ${(this.currentMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
      
      // Remove least valuable entries until under limit
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].hits - b[1].hits);
      
      for (const [key, entry] of sortedEntries) {
        if (this.currentMemoryUsage <= limitBytes) break;
        
        this.currentMemoryUsage -= (entry.size || 0);
        this.cache.delete(key);
        console.log(`🗑️ Cache entry removed (memory): ${key}`);
      }
    }
  }

  /**
   * Preload data into cache (cache warming)
   */
  preload<T>(
    key: string,
    dataFetcher: () => Observable<T>,
    config?: CacheConfig
  ): void {
    this.get(key, dataFetcher, config).subscribe({
      next: () => console.log(`🔥 Cache warmed: ${key}`),
      error: (err) => console.error(`❌ Cache warming failed for ${key}:`, err)
    });
  }

  /**
   * Preload multiple keys in parallel (bulk cache warming)
   */
  preloadBulk<T>(
    items: Array<{ key: string; dataFetcher: () => Observable<T>; config?: CacheConfig }>
  ): void {
    console.log(`🔥 Warming cache for ${items.length} items...`);
    items.forEach(item => this.preload(item.key, item.dataFetcher, item.config));
  }

  /**
   * Check if a key exists in cache and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && entry.expiresAt > Date.now();
  }
}
