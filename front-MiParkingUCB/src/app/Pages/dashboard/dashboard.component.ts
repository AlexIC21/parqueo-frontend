import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;font-family:var(--font-family)">
      <h1 style="color:var(--color-primary)">MiParking UCB</h1>
      <p>Dashboard en construcción...</p>
      <button (click)="logout()" style="padding:0.5rem 1.5rem;background:var(--color-primary);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.95rem">
        Cerrar sesión
      </button>
    </div>
  `
})
export class DashboardComponent {
  constructor(private auth: AuthService, private router: Router) {}

  logout(): void {
    this.auth.logout();
  }
}
