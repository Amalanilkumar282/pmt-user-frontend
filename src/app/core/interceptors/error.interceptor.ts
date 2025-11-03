import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * HTTP Interceptor for global error handling
 *
 * Features:
 * - Provides user-friendly error messages
 * - Logs errors to console
 * - Can be extended to log to external services (Sentry, LogRocket, etc.)
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error (network issue, etc.)
        errorMessage = `Client Error: ${error.error.message}`;
        console.error('🔴 Client-side error:', error.error.message);
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage = 'Cannot connect to server. Please check if the backend is running.';
            console.error('🔴 Network error - Backend may be offline');
            break;
          case 400:
            errorMessage = error.error?.message || 'Invalid request';
            console.error('🔴 Bad Request (400):', errorMessage);
            break;
          case 401:
            errorMessage = 'Unauthorized - Please login';
            console.error('🔴 Unauthorized (401)');
            break;
          case 403:
            errorMessage = 'Forbidden - Insufficient permissions';
            console.error('🔴 Forbidden (403):', errorMessage);
            break;
          case 404:
            errorMessage = 'Resource not found';
            console.error('🔴 Not Found (404):', req.url);
            break;
          case 409:
            errorMessage = error.error?.message || 'Conflict - Resource already exists';
            console.error('🔴 Conflict (409):', errorMessage);
            break;
          case 422:
            errorMessage = error.error?.message || 'Validation error';
            console.error('🔴 Unprocessable Entity (422):', error.error);
            break;
          case 500:
            errorMessage = 'Internal server error - Please try again later';
            console.error('🔴 Internal Server Error (500)');
            break;
          case 502:
            errorMessage = 'Bad Gateway - Server is temporarily unavailable';
            console.error('🔴 Bad Gateway (502)');
            break;
          case 503:
            errorMessage = 'Service Unavailable - Please try again later';
            console.error('🔴 Service Unavailable (503)');
            break;
          default:
            errorMessage = error.error?.message || `Error Code: ${error.status}`;
            console.error(`🔴 HTTP Error (${error.status}):`, errorMessage);
        }
      }

      // Log full error details in development
      console.error('📋 Full error details:', {
        url: req.url,
        method: req.method,
        status: error.status,
        statusText: error.statusText,
        error: error.error,
        message: errorMessage,
      });

      // Return error with user-friendly message
      return throwError(() => ({
        message: errorMessage,
        originalError: error,
        status: error.status,
      }));
    })
  );
};
