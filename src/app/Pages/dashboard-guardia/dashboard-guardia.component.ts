import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { Incident } from '../../models/incident.model';
import { AuthService } from '../../services/auth.service';
import { IncidentService } from '../../services/incident.service';

@Component({
  selector: 'app-dashboard-guardia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-guardia.component.html',
  styleUrls: ['./dashboard-guardia.component.scss']
})
export class DashboardGuardiaComponent implements OnInit {
  autosPorSalir = 0;
  motosPorSalir = 0;
  colaVehicular = 0;
  incidencias: Incident[] = [];
  isLoadingIncidents = false;
  isSavingIncident = false;
  resolvingIncidentId: number | null = null;
  cancellingIncidentId: number | null = null;
  showIncidentModal = false;
  incidentDescription = '';
  private readonly defaultIncidentType = 'BLOQUEO';
  private readonly defaultIncidentTitle = 'Ingreso bloqueado';
  private readonly defaultParkingLotId = 1;
  incidentMessage = '';
  incidentError = '';

  constructor(
    private auth: AuthService,
    private incidentService: IncidentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadIncidents();
  }

  goToMap(): void {
    this.router.navigate(['/mapa']);
  }

  logout(): void {
    this.auth.logout();
  }

  registerIncident(): void {
    this.openIncidentModal();
  }

  openIncidentModal(): void {
    this.incidentDescription = '';
    this.incidentError = '';
    this.showIncidentModal = true;
  }

  closeIncidentModal(): void {
    if (this.isSavingIncident) {
      return;
    }

    this.showIncidentModal = false;
    this.incidentDescription = '';
    this.incidentError = '';
  }

  saveIncident(): void {
    const description = this.incidentDescription.trim();
    this.incidentError = '';
    this.incidentMessage = '';

    if (!description) {
      this.incidentError = 'La descripci\u00f3n es obligatoria.';
      return;
    }

    this.isSavingIncident = true;
    this.incidentService
      .createIncident({
        type: this.defaultIncidentType,
        title: this.defaultIncidentTitle,
        description,
        parkingLotId: this.defaultParkingLotId
      })
      .pipe(
        take(1),
        finalize(() => {
          this.isSavingIncident = false;
        })
      )
      .subscribe({
        next: () => {
          this.showIncidentModal = false;
          this.incidentDescription = '';
          this.incidentMessage = 'Incidencia registrada correctamente';
          this.loadIncidents();
        },
        error: () => {
          this.incidentError = 'No se pudo registrar la incidencia';
        }
      });
  }

  resolveIncident(incident: Incident): void {
    if (!this.isActiveIncident(incident) || this.resolvingIncidentId || this.cancellingIncidentId) {
      return;
    }

    this.resolvingIncidentId = incident.id;
    this.incidentError = '';
    this.incidentMessage = '';

    this.incidentService
      .resolveIncident(incident.id)
      .pipe(
        take(1),
        finalize(() => {
          this.resolvingIncidentId = null;
        })
      )
      .subscribe({
        next: (response) => {
          this.removeIncident(response.data?.id ?? incident.id);
          this.incidentMessage = 'Incidencia marcada como resuelta';
        },
        error: () => {
          this.incidentError = 'No se pudo marcar la incidencia como resuelta';
        }
      });
  }

  cancelIncident(incident: Incident): void {
    if (!this.isActiveIncident(incident) || this.resolvingIncidentId || this.cancellingIncidentId) {
      return;
    }

    this.cancellingIncidentId = incident.id;
    this.incidentError = '';
    this.incidentMessage = '';

    this.incidentService
      .cancelIncident(incident.id)
      .pipe(
        take(1),
        finalize(() => {
          this.cancellingIncidentId = null;
        })
      )
      .subscribe({
        next: (response) => {
          this.removeIncident(response.data?.id ?? incident.id);
          this.incidentMessage = 'Incidencia cancelada correctamente';
        },
        error: () => {
          this.incidentError = 'No se pudo cancelar la incidencia';
        }
      });
  }

  isActiveIncident(incident: Incident): boolean {
    return incident.status?.toUpperCase() === 'ACTIVA';
  }

  isResolvedIncident(incident: Incident): boolean {
    const status = incident.status?.toUpperCase();
    return status === 'RESUELTA' || status === 'RESUELTO' || status === 'RESOLVED';
  }

  isCancelledIncident(incident: Incident): boolean {
    return incident.status?.toUpperCase() === 'CANCELADA';
  }

  getIncidentStatusLabel(incident: Incident): string {
    if (this.isResolvedIncident(incident)) {
      return 'RESUELTA';
    }

    if (this.isCancelledIncident(incident)) {
      return 'CANCELADA';
    }

    return incident.status?.toUpperCase() || 'ACTIVA';
  }

  private loadIncidents(): void {
    this.isLoadingIncidents = true;
    this.incidentError = '';

    this.incidentService
      .getIncidents()
      .pipe(
        take(1),
        finalize(() => {
          this.isLoadingIncidents = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.incidencias = this.filterActiveIncidents(response.data ?? []);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.auth.logout();
            return;
          }

          this.incidentError = 'No se pudieron cargar las incidencias';
        }
      });
  }

  private upsertIncident(incident: Incident): void {
    if (!this.isActiveIncident(incident)) {
      this.removeIncident(incident.id);
      return;
    }

    const index = this.incidencias.findIndex((item) => item.id === incident.id);
    if (index >= 0) {
      this.incidencias[index] = incident;
      return;
    }

    this.incidencias = [incident, ...this.incidencias];
  }

  private removeIncident(incidentId: number): void {
    this.incidencias = this.incidencias.filter((item) => item.id !== incidentId);
  }

  private filterActiveIncidents(incidents: Incident[]): Incident[] {
    return incidents.filter((incident) => this.isActiveIncident(incident));
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
