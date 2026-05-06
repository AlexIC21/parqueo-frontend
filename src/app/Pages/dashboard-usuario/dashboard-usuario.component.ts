import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, AuthUser } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard-usuario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-usuario.component.html',
  styleUrls: ['./dashboard-usuario.component.scss']
})
export class DashboardUsuarioComponent implements OnInit {
  user: AuthUser | null = null;
  showGuestModal = false;

  readonly stats = {
    autos: { disponibles: 53, total: 71 },
    motos: { disponibles: 18, total: 30 }
  };

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser;
  }

  get isGuest(): boolean {
    return this.auth.isGuest;
  }

  get ocupacionTotal(): number {
    const totalEspacios = this.stats.autos.total + this.stats.motos.total;
    const ocupados =
      (this.stats.autos.total - this.stats.autos.disponibles) +
      (this.stats.motos.total - this.stats.motos.disponibles);
    return Math.round((ocupados / totalEspacios) * 100);
  }

  get hayDisponibles(): boolean {
    return this.stats.autos.disponibles > 0 || this.stats.motos.disponibles > 0;
  }

  get porcentajeAutos(): number {
    return Math.round((this.stats.autos.disponibles / this.stats.autos.total) * 100);
  }

  get porcentajeMotos(): number {
    return Math.round((this.stats.motos.disponibles / this.stats.motos.total) * 100);
  }

  onRestrictedAction(): void {
    if (this.isGuest) {
      this.showGuestModal = true;
    }
  }

  goToLogin(): void {
    this.showGuestModal = false;
    this.router.navigate(['/login']);
  }

  closeModal(): void {
    this.showGuestModal = false;
  }

  logout(): void {
    this.auth.logout();
  }
}
