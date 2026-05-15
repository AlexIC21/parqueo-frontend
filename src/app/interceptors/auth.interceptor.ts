import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  const publicEndpoints = ['/auth/login', '/auth/register', '/parking/availability'];
  const isPublicRequest = publicEndpoints.some((endpoint) => req.url.includes(endpoint));
  const authRequest = token && !isPublicRequest
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isPublicRequest) {
        authService.logout();
      } else if (error.status === 403 && !isPublicRequest) {
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
