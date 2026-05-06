import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./Pages/dashboard-usuario/dashboard-usuario.component').then(m => m.DashboardUsuarioComponent)
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
    loadComponent: () =>
      import('./Pages/dashboard-usuario/dashboard-usuario.component').then(m => m.DashboardUsuarioComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard-usuario'
  }
];
