import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

/**
 * HTTP Interceptor for global loading state management
 *
 * Features:
 * - Automatically shows/hides loading indicator for HTTP requests
 * - Tracks multiple concurrent requests
 * - Can be used with a global loading spinner component
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Skip loading indicator for certain requests (optional)
  const skipLoadingUrls = ['/api/Auth/refresh'];
  const shouldSkipLoading = skipLoadingUrls.some((url) => req.url.includes(url));

  if (!shouldSkipLoading) {
    loadingService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (!shouldSkipLoading) {
        loadingService.hide();
      }
    })
  );
};
