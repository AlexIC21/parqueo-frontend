import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard-guardia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-guardia.component.html',
  styleUrls: ['./dashboard-guardia.component.scss']
})
export class DashboardGuardiaComponent {
  autosPorSalir = 0;
  motosPorSalir = 0;
  colaVehicular = 0;
  incidencias: string[] = [];

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  goToMap(): void {
    this.router.navigate(['/mapa']);
  }

  logout(): void {
    this.auth.logout();
  }

  registerIncident(): void {
    this.incidencias = ['Incidencia pendiente de detalle'];
  }

  incrementAutos(): void {
    this.autosPorSalir += 1;
  }

  decrementAutos(): void {
    this.autosPorSalir = Math.max(0, this.autosPorSalir - 1);
  }

  incrementMotos(): void {
    this.motosPorSalir += 1;
  }

  decrementMotos(): void {
    this.motosPorSalir = Math.max(0, this.motosPorSalir - 1);
  }

  incrementQueue(): void {
    this.colaVehicular += 1;
  }

  decrementQueue(): void {
    this.colaVehicular = Math.max(0, this.colaVehicular - 1);
  }
}
