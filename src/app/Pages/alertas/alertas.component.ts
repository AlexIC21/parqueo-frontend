import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { AlertPreferences, UpdateAlertPreferencesRequest } from '../../models/alert-preferences.model';
import { AlertPreferencesService } from '../../services/alert-preferences.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alertas.component.html',
  styleUrls: ['./alertas.component.scss']
})
export class AlertasComponent implements OnInit {
  alertPreferences: UpdateAlertPreferencesRequest = {
    enabled: true,
    minutesBefore: 10,
    vehicleType: 'AUTO',
    onlyFirstClassPerDay: false,
    selectedScheduleAlerts: []
  };

  isLoadingPreferences = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private alertPreferencesService: AlertPreferencesService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) {
      this.errorMessage = 'Debes iniciar sesi\u00f3n para configurar alertas.';
      this.router.navigate(['/login']);
      return;
    }

    this.loadAlertPreferences();
  }

  goBack(): void {
    this.router.navigate(['/dashboard-usuario']);
  }

  saveAlertPreferences(): void {
    this.successMessage = '';

    if (!this.validateAlertPreferences()) {
      return;
    }

    this.isSaving = true;
    this.alertPreferencesService
      .updateMyAlertPreferences(this.buildPayload())
      .pipe(
        take(1),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.applyAlertPreferences(response.data);
          this.errorMessage = '';
          this.successMessage = 'Configuraci\u00f3n de alertas guardada correctamente';
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.handleUnauthorized();
            return;
          }

          this.errorMessage = 'No se pudo guardar la configuraci\u00f3n de alertas';
        }
      });
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private loadAlertPreferences(): void {
    this.isLoadingPreferences = true;
    this.errorMessage = '';

    this.alertPreferencesService
      .getMyAlertPreferences()
      .pipe(
        take(1),
        finalize(() => {
          this.isLoadingPreferences = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.applyAlertPreferences(response.data);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.handleUnauthorized();
            return;
          }

          this.errorMessage = 'No se pudo cargar la configuraci\u00f3n de alertas.';
        }
      });
  }

  private validateAlertPreferences(): boolean {
    const minutesBefore = Number(this.alertPreferences.minutesBefore);
    const isValidMinutes = Number.isInteger(minutesBefore) && minutesBefore >= 1 && minutesBefore <= 180;
    const isValidVehicle = this.alertPreferences.vehicleType === 'AUTO' || this.alertPreferences.vehicleType === 'MOTO';

    if (!isValidMinutes || !isValidVehicle) {
      this.errorMessage = 'Ingresa un tiempo v\u00e1lido entre 1 y 180 minutos.';
      return false;
    }

    this.errorMessage = '';
    return true;
  }

  private applyAlertPreferences(preferences: AlertPreferences): void {
    this.alertPreferences = {
      enabled: preferences.enabled,
      minutesBefore: preferences.minutesBefore,
      vehicleType: preferences.vehicleType,
      onlyFirstClassPerDay: false,
      selectedScheduleAlerts: []
    };
  }

  private buildPayload(): UpdateAlertPreferencesRequest {
    return {
      enabled: this.alertPreferences.enabled,
      minutesBefore: Number(this.alertPreferences.minutesBefore),
      vehicleType: this.alertPreferences.vehicleType,
      onlyFirstClassPerDay: false,
      selectedScheduleAlerts: []
    };
  }

  private handleUnauthorized(): void {
    this.errorMessage = 'Tu sesi\u00f3n expir\u00f3. Inicia sesi\u00f3n nuevamente.';
    this.auth.logout();
  }
}
