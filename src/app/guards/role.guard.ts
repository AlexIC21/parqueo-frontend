import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = (route.data?.['roles'] as string[] | undefined)
    ?.map((role) => role.trim().toUpperCase()) ?? [];

  if (!allowedRoles.length) {
    return true;
  }

  const role = auth.getUserRole();

  if (!role) {
    return router.createUrlTree(['/login']);
  }

  if (allowedRoles.includes(role)) {
    return true;
  }

  if (role === 'GUARDIA') {
    return router.createUrlTree(['/dashboard-guardia']);
  }

  if (role === 'USUARIO' || role === 'ADMINISTRADOR') {
    return router.createUrlTree(['/dashboard-usuario']);
  }

  return router.createUrlTree(['/login']);
};
