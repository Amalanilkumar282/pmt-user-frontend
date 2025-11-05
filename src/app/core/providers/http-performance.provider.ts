import { Injectable, Provider } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CacheInterceptor } from '../interceptors/cache.interceptor';

/**
 * Performance interceptor that adds compression headers
 * and optimizes HTTP requests
 */
@Injectable()
export class PerformanceInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add compression headers
    const optimizedReq = req.clone({
      setHeaders: {
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': req.headers.get('Accept') || 'application/json, text/plain, */*',
        'Cache-Control': req.method === 'GET' ? 'max-age=300' : 'no-cache'
      }
    });
    
    return next.handle(optimizedReq);
  }
}

/**
 * Providers for HTTP optimizations
 */
export const HTTP_PERFORMANCE_PROVIDERS: Provider[] = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: CacheInterceptor,
    multi: true
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: PerformanceInterceptor,
    multi: true
  }
];
