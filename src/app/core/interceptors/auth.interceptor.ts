import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

/**
 * HTTP Interceptor for automatic JWT token management
 *
 * Features:
 * - Automatically attaches Authorization header to all API requests
 * - Skips auth header for login and refresh endpoints
 * - Handles 401 errors by attempting token refresh
 * - Auto-logout on refresh failure
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip auth header for these endpoints
  const skipAuthUrls = ['/api/Auth/login', '/api/Auth/refresh', '/api/Auth/register'];
  const shouldSkipAuth = skipAuthUrls.some((url) => req.url.includes(url));

  if (shouldSkipAuth) {
    console.log('🔓 Skipping auth for:', req.url);
    return next(req);
  }

  // Get access token from AuthService
  const token = authService.getAccessToken();

  // Clone request and add Authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('🔒 Added auth token to request:', req.url);
  } else {
    console.warn('⚠️ No access token available for request:', req.url);
  }

  // Handle the request
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized - Token expired or invalid
      if (error.status === 401 && !shouldSkipAuth) {
        console.warn('⚠️ 401 Unauthorized - Attempting token refresh for:', req.url);

        // Try to refresh the token
        return authService.refreshAccessToken().pipe(
          switchMap((newToken) => {
            console.log('✅ Token refreshed successfully - Retrying request');

            // Retry original request with new token
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Refresh failed - logout user
            console.error('❌ Token refresh failed - Logging out user');
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }

      // Handle 403 Forbidden - Insufficient permissions
      if (error.status === 403) {
        console.error('❌ 403 Forbidden - Insufficient permissions for:', req.url);
      }

      // Handle 0 - Network error (backend not running)
      if (error.status === 0) {
        console.error('❌ Network Error - Backend may not be running');
      }

      // Pass through other errors
      return throwError(() => error);
    })
  );
};
