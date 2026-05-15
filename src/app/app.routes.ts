import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

const publicAvailabilityRoute = () =>
  import('./Pages/dashboard-usuario/dashboard-usuario.component').then(m => m.DashboardUsuarioComponent);

export const routes: Routes = [
  {
    path: '',
    loadComponent: publicAvailabilityRoute
  },
  {
    path: 'home',
    loadComponent: publicAvailabilityRoute
  },
  {
    path: 'dashboard',
    loadComponent: publicAvailabilityRoute
  },
  {
    path: 'inicio',
    loadComponent: publicAvailabilityRoute
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./Pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./Pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard-usuario',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['USUARIO', 'ADMINISTRADOR'] },
    loadComponent: () =>
      import('./Pages/dashboard-usuario/dashboard-usuario.component').then(m => m.DashboardUsuarioComponent)
  },
  {
    path: 'dashboard-guardia',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['GUARDIA'] },
    loadComponent: () =>
      import('./Pages/dashboard-guardia/dashboard-guardia.component').then(m => m.DashboardGuardiaComponent)
  },
  {
    path: 'mapa',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['USUARIO', 'GUARDIA', 'ADMINISTRADOR'] },
    loadComponent: () =>
      import('./Pages/mapa/mapa.component').then(m => m.MapaComponent)
  },
  {
    path: 'mi-horario',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['USUARIO'] },
    loadComponent: () =>
      import('./Pages/mi-horario/mi-horario.component').then(m => m.MiHorarioComponent)
  },
  {
    path: 'alertas',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['USUARIO'] },
    loadComponent: () =>
      import('./Pages/alertas/alertas.component').then(m => m.AlertasComponent)
  },
  {
    path: 'horario',
    redirectTo: 'mi-horario',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
