import { Component, DoCheck, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { AlertPreferencesService } from '../../services/alert-preferences.service';
import { ParkingAvailabilityService } from '../../services/parking-availability.service';
import {
  AlertPreferences,
  UpdateAlertPreferencesRequest
} from '../../models/alert-preferences.model';
import {
  ParkingAvailabilityData,
  ParkingAvailabilityResponse,
  ParkingGeneralStatus
} from '../../models/parking.model';

@Component({
  selector: 'app-dashboard-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-usuario.component.html',
  styleUrls: ['./dashboard-usuario.component.scss']
})
export class DashboardUsuarioComponent implements OnInit, DoCheck {
  private alertPreferencesMessageTimer: ReturnType<typeof setTimeout> | null = null;
  private hasRequestedAlertPreferences = false;

  availability: ParkingAvailabilityData | null = null;
  isLoading = true;
  errorMessage = '';
  showGuestModal = false;
  alertPreferences: UpdateAlertPreferencesRequest = {
    enabled: true,
    minutesBefore: 30,
    vehicleType: 'AUTO',
    onlyFirstClassPerDay: true
  };
  isLoadingAlertPreferences = false;
  isSavingAlertPreferences = false;
  alertPreferencesError = '';
  alertPreferencesMessage = '';

  constructor(
    private availabilityService: ParkingAvailabilityService,
    private alertPreferencesService: AlertPreferencesService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.isAuthenticated() && this.auth.currentUser?.role?.trim().toUpperCase() === 'GUARDIA') {
      this.router.navigate(['/dashboard-guardia']);
      return;
    }

    this.loadAvailability();
    this.tryLoadAlertPreferences();
  }

  ngDoCheck(): void {
    this.tryLoadAlertPreferences();
  }

  get autosAvailable(): number {
    return this.availability?.cars.available ?? 0;
  }

  get autosCapacity(): number {
    return this.availability?.cars.totalCapacity ?? 0;
  }

  get motosAvailable(): number {
    return this.availability?.motorcycles.available ?? 0;
  }

  get motosCapacity(): number {
    return this.availability?.motorcycles.totalCapacity ?? 0;
  }

  get totalOccupancyPercent(): number {
    if (!this.availability) {
      return 0;
    }

    const percent = this.availability.total.occupancyPercentage;
    if (Number.isFinite(percent)) {
      return Math.round(percent);
    }

    if (!this.availability.total.totalCapacity) {
      return 0;
    }

    return Math.round(
      (this.availability.total.occupied / this.availability.total.totalCapacity) * 100
    );
  }

  get status(): ParkingGeneralStatus {
    if (this.availability?.generalStatus) {
      return this.availability.generalStatus;
    }

    const percent = this.totalOccupancyPercent;
    if (percent >= 100) {
      return 'LLENO';
    }
    if (percent >= 85) {
      return 'CASI_LLENO';
    }
    if (percent >= 60) {
      return 'DEMANDA_MODERADA';
    }
    return 'DISPONIBLE';
  }

  get statusMessage(): string {
    switch (this.status) {
      case 'DEMANDA_MODERADA':
        return 'Demanda moderada';
      case 'CASI_LLENO':
        return 'Casi lleno';
      case 'LLENO':
        return 'Lleno';
      default:
        return 'Disponible';
    }
  }

  get isAvailableStatus(): boolean {
    return this.status === 'DISPONIBLE';
  }

  get isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  get welcomeName(): string {
    if (!this.isAuthenticated) {
      return '';
    }

    const user = this.auth.currentUser;
    return (
      user?.nickname?.trim() ||
      user?.fullName?.trim() ||
      user?.name?.trim() ||
      ''
    );
  }

  get updatedAt(): string {
    return this.availability?.updatedAt ?? '';
  }

  getAlertSummary(): string {
    const vehicleLabel = this.alertPreferences.vehicleType === 'MOTO' ? 'moto' : 'auto';

    if (!this.alertPreferences.enabled) {
      return 'Alertas desactivadas. No recibir\u00e1s avisos de parqueo.';
    }

    if (!this.isAlertPreferencesValid(false)) {
      return 'Configura un tiempo v\u00e1lido para activar tus alertas.';
    }

    return `Alertas activadas. El sistema avisar\u00e1 ${this.alertPreferences.minutesBefore} minutos antes para veh\u00edculo tipo ${vehicleLabel}.`;
  }

  get canShowAlertPreferences(): boolean {
    if (!this.isAuthenticated) {
      return false;
    }

    const role = this.auth.currentUser?.role?.trim().toUpperCase();
    return !role || role === 'USUARIO';
  }

  onNavbarAction(): void {
    if (this.isAuthenticated) {
      this.auth.logout();
      return;
    }

    this.router.navigate(['/login']);
  }

  goToMap(): void {
    if (this.isAuthenticated) {
      this.router.navigate(['/mapa']);
      return;
    }

    this.router.navigate(['/login']);
  }

  goToSchedule(): void {
    if (this.isAuthenticated) {
      this.router.navigate(['/mi-horario']);
      return;
    }

    this.router.navigate(['/login']);
  }

  goToLogin(): void {
    this.showGuestModal = false;
    this.router.navigate(['/login']);
  }

  closeModal(): void {
    this.showGuestModal = false;
  }

  onAlertPreferencesChange(): void {
    this.alertPreferencesError = '';
    this.alertPreferencesMessage = '';
  }


  private loadAvailability(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.availabilityService
      .getAvailability()
      .pipe(
        take(1),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response: ParkingAvailabilityResponse) => {
          this.availability = response.data;
        },
        error: () => {
          this.availability = null;
          this.errorMessage = 'No se pudo cargar la disponibilidad';
        }
      });
  }

  private tryLoadAlertPreferences(): void {
    if (
      this.hasRequestedAlertPreferences ||
      this.isLoadingAlertPreferences ||
      !this.canShowAlertPreferences
    ) {
      return;
    }

    this.loadAlertPreferences();
  }

  private loadAlertPreferences(): void {
    this.hasRequestedAlertPreferences = true;
    this.isLoadingAlertPreferences = true;
    this.alertPreferencesError = '';

    this.alertPreferencesService
      .getMyAlertPreferences()
      .pipe(
        take(1),
        finalize(() => {
          this.isLoadingAlertPreferences = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.applyAlertPreferences(response.data);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.alertPreferencesError = 'Tu sesi\u00f3n expir\u00f3. Inicia sesi\u00f3n nuevamente.';
            this.router.navigate(['/login']);
            return;
          }

          this.alertPreferencesError = 'No se pudo cargar la configuraci\u00f3n de alertas.';
        }
      });
  }

  saveAlertPreferences(): void {
    this.alertPreferencesMessage = '';

    if (!this.isAlertPreferencesValid(true)) {
      return;
    }

    this.isSavingAlertPreferences = true;
    this.alertPreferencesService
      .updateMyAlertPreferences(this.buildAlertPreferencesPayload())
      .pipe(
        take(1),
        finalize(() => {
          this.isSavingAlertPreferences = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.applyAlertPreferences(response.data);
          this.alertPreferencesError = '';
          this.showAlertPreferencesMessage('Configuraci\u00f3n de alertas guardada');
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.alertPreferencesError = 'Tu sesi\u00f3n expir\u00f3. Inicia sesi\u00f3n nuevamente.';
            return;
          }

          this.alertPreferencesError = 'No se pudo guardar la configuraci\u00f3n de alertas.';
        }
      });
  }

  private isAlertPreferencesValid(showError: boolean): boolean {
    const minutesBefore = Number(this.alertPreferences.minutesBefore);
    const isValid =
      this.isValidReminderMinutes(minutesBefore) &&
      (this.alertPreferences.vehicleType === 'AUTO' || this.alertPreferences.vehicleType === 'MOTO') &&
      typeof this.alertPreferences.enabled === 'boolean' &&
      typeof this.alertPreferences.onlyFirstClassPerDay === 'boolean';

    if (showError) {
      this.alertPreferencesError = isValid
        ? ''
        : 'Ingresa un tiempo v\u00e1lido entre 1 y 180 minutos.';
    }

    return isValid;
  }

  private isValidReminderMinutes(value: number): boolean {
    return Number.isInteger(value) && value >= 1 && value <= 180;
  }

  private applyAlertPreferences(preferences: AlertPreferences): void {
    this.alertPreferences = {
      enabled: preferences.enabled,
      minutesBefore: preferences.minutesBefore,
      vehicleType: preferences.vehicleType,
      onlyFirstClassPerDay: preferences.onlyFirstClassPerDay
    };
  }

  private buildAlertPreferencesPayload(): UpdateAlertPreferencesRequest {
    return {
      enabled: this.alertPreferences.enabled,
      minutesBefore: Number(this.alertPreferences.minutesBefore),
      vehicleType: this.alertPreferences.vehicleType,
      onlyFirstClassPerDay: this.alertPreferences.onlyFirstClassPerDay
    };
  }

  private showAlertPreferencesMessage(message: string): void {
    this.alertPreferencesMessage = message;

    if (this.alertPreferencesMessageTimer) {
      clearTimeout(this.alertPreferencesMessageTimer);
    }

    this.alertPreferencesMessageTimer = setTimeout(() => {
      this.alertPreferencesMessage = '';
      this.alertPreferencesMessageTimer = null;
    }, 3500);
  }
}
