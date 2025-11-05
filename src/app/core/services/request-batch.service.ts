import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, timer, forkJoin } from 'rxjs';
import { take, switchMap } from 'rxjs/operators';

interface BatchRequest<T> {
  url: string;
  subject: Subject<T>;
}

/**
 * Service to batch multiple HTTP requests together
 * Reduces network overhead by combining multiple API calls
 */
@Injectable({
  providedIn: 'root'
})
export class RequestBatchService {
  private batchQueue = new Map<string, BatchRequest<any>[]>();
  private batchDelay = 50; // milliseconds to wait before executing batch
  private batchTimers = new Map<string, any>();
  
  constructor(private http: HttpClient) {}
  
  /**
   * Add a request to the batch queue
   * Requests with similar patterns are batched together
   */
  public batchRequest<T>(url: string, headers?: any): Observable<T> {
    const batchKey = this.getBatchKey(url);
    const subject = new Subject<T>();
    
    // Add to queue
    if (!this.batchQueue.has(batchKey)) {
      this.batchQueue.set(batchKey, []);
    }
    
    this.batchQueue.get(batchKey)!.push({ url, subject });
    
    // Schedule batch execution
    this.scheduleBatchExecution(batchKey, headers);
    
    return subject.asObservable();
  }
  
  /**
   * Get batch key for grouping similar requests
   */
  private getBatchKey(url: string): string {
    // Group by resource type and parent ID
    if (url.includes('/project/') && url.includes('/issues')) {
      const match = url.match(/project\/([^/]+)/);
      return match ? `issues:${match[1]}` : 'issues:unknown';
    }
    
    if (url.includes('/User/')) {
      return 'users';
    }
    
    if (url.includes('/Sprint/project/')) {
      const match = url.match(/project\/([^/]+)/);
      return match ? `sprints:${match[1]}` : 'sprints:unknown';
    }
    
    if (url.includes('/Epic/project/')) {
      const match = url.match(/project\/([^/]+)/);
      return match ? `epics:${match[1]}` : 'epics:unknown';
    }
    
    return 'default';
  }
  
  /**
   * Schedule batch execution after a delay
   */
  private scheduleBatchExecution(batchKey: string, headers?: any): void {
    // Clear existing timer
    if (this.batchTimers.has(batchKey)) {
      clearTimeout(this.batchTimers.get(batchKey));
    }
    
    // Schedule new timer
    const timerId = setTimeout(() => {
      this.executeBatch(batchKey, headers);
      this.batchTimers.delete(batchKey);
    }, this.batchDelay);
    
    this.batchTimers.set(batchKey, timerId);
  }
  
  /**
   * Execute all requests in a batch
   */
  private executeBatch(batchKey: string, headers?: any): void {
    const requests = this.batchQueue.get(batchKey);
    if (!requests || requests.length === 0) return;
    
    console.log(`🚀 [RequestBatch] Executing batch: ${batchKey} with ${requests.length} requests`);
    
    // Execute all requests in parallel
    const observables = requests.map(req => this.http.get(req.url, { headers }));
    
    forkJoin(observables).subscribe({
      next: (responses) => {
        // Emit response to each subject
        responses.forEach((response, index) => {
          requests[index].subject.next(response);
          requests[index].subject.complete();
        });
      },
      error: (error) => {
        // Emit error to all subjects
        requests.forEach(req => {
          req.subject.error(error);
        });
      }
    });
    
    // Clear the batch
    this.batchQueue.delete(batchKey);
  }
  
  /**
   * Execute a batch immediately without waiting
   */
  public flushBatch(batchKey: string, headers?: any): void {
    if (this.batchTimers.has(batchKey)) {
      clearTimeout(this.batchTimers.get(batchKey));
      this.batchTimers.delete(batchKey);
    }
    this.executeBatch(batchKey, headers);
  }
  
  /**
   * Flush all pending batches
   */
  public flushAll(): void {
    this.batchTimers.forEach((_, key) => {
      this.flushBatch(key);
    });
  }
}
