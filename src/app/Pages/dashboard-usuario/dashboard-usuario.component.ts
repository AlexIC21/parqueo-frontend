import { Component, DoCheck, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, Subscription, take } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { AlertPreferencesService } from '../../services/alert-preferences.service';
import { NotificationSocketService } from '../../services/notification-socket.service';
import { NotificationService } from '../../services/notification.service';
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
import {
  DailyFirstClassAlertData,
  UserNotification
} from '../../models/notification.model';

@Component({
  selector: 'app-dashboard-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-usuario.component.html',
  styleUrls: ['./dashboard-usuario.component.scss']
})
export class DashboardUsuarioComponent implements OnInit, DoCheck, OnDestroy {
  private alertPreferencesMessageTimer: ReturnType<typeof setTimeout> | null = null;
  private hasRequestedAlertPreferences = false;
  private hasRequestedNotifications = false;
  private notificationSocketSubscription?: Subscription;
  private shownAvailabilityNotificationIds = new Set<number>();
  private readonly dailyFirstClassAlertType = 'DAILY_FIRST_CLASS_ALERT';

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
  dailyFirstClassAlert: UserNotification | null = null;
  isLoadingNotifications = false;
  isMarkingNotificationRead = false;
  notificationError = '';

  constructor(
    private availabilityService: ParkingAvailabilityService,
    private alertPreferencesService: AlertPreferencesService,
    private notificationSocketService: NotificationSocketService,
    private notificationService: NotificationService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userRole = this.auth.getUserRole();
    console.log('[HU22-FE][DASHBOARD] cargando dashboard usuario');
    console.log(`[HU22-FE][DASHBOARD] userRole=${userRole ?? 'null'}`);
    console.log(`[HU22-FE][DASHBOARD] tokenExists=${!!this.auth.getToken()}`);

    if (this.auth.isAuthenticated() && this.auth.currentUser?.role?.trim().toUpperCase() === 'GUARDIA') {
      this.router.navigate(['/dashboard-guardia']);
      return;
    }

    this.loadAvailability();
    this.tryLoadAlertPreferences();
    this.tryLoadNotifications();
    this.connectNotificationSocket();
  }

  ngDoCheck(): void {
    this.tryLoadAlertPreferences();
    this.tryLoadNotifications();
  }

  ngOnDestroy(): void {
    this.notificationSocketSubscription?.unsubscribe();
    this.notificationSocketService.disconnect();
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

  get dailyAlertData(): DailyFirstClassAlertData | null {
    return this.isDailyFirstClassAlertData(this.dailyFirstClassAlert?.data)
      ? this.dailyFirstClassAlert.data
      : null;
  }

  get dailyAlertSubject(): string {
    return this.dailyAlertData?.class?.subject ?? 'tu primera materia';
  }

  get dailyAlertStartTime(): string {
    return this.dailyAlertData?.class?.startTime ?? '';
  }

  get dailyAlertCarsAvailability(): string {
    const cars = this.dailyAlertData?.availability?.cars;
    return `${cars?.available ?? 0}/${cars?.totalCapacity ?? 0}`;
  }

  get dailyAlertMotorcyclesAvailability(): string {
    const motorcycles = this.dailyAlertData?.availability?.motorcycles;
    return `${motorcycles?.available ?? 0}/${motorcycles?.totalCapacity ?? 0}`;
  }

  getAvailabilityAlertMessage(notification: UserNotification): string {
    const available = this.getAvailableSpaces(notification);
    return available > 0
      ? `Quedan ${available} espacios disponibles.`
      : 'Ya no quedan espacios disponibles.';
  }

  hasAvailableSpaces(notification: UserNotification): boolean {
    return this.getAvailableSpaces(notification) > 0;
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

  acknowledgeAvailabilityAlert(): void {
    if (!this.dailyFirstClassAlert || this.isMarkingNotificationRead) {
      return;
    }

    const notificationId = this.dailyFirstClassAlert.id;
    this.dailyFirstClassAlert = null;
    this.markNotificationAsRead(notificationId);
  }

  markDailyAlertAsRead(): void {
    this.acknowledgeAvailabilityAlert();
  }

  private markNotificationAsRead(notificationId: number): void {
    this.isMarkingNotificationRead = true;
    this.notificationError = '';

    this.notificationService
      .markAsRead(notificationId)
      .pipe(
        take(1),
        finalize(() => {
          this.isMarkingNotificationRead = false;
        })
      )
      .subscribe({
        next: () => {
          console.log('[HU22-FE][READ] notificación marcada como leída');
        },
        error: (error: HttpErrorResponse) => {
          console.log(`[HU22-FE][READ][ERROR] status=${error.status} message=${this.getHttpErrorLogMessage(error)}`);
          this.notificationError = 'No se pudo marcar la notificación como leída.';
        }
      });
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

  private tryLoadNotifications(): void {
    if (
      this.hasRequestedNotifications ||
      this.isLoadingNotifications ||
      !this.canShowAlertPreferences
    ) {
      return;
    }

    this.loadNotifications();
  }

  private loadNotifications(): void {
    this.hasRequestedNotifications = true;
    this.isLoadingNotifications = true;
    this.notificationError = '';

    this.notificationService
      .getMyNotifications()
      .pipe(
        take(1),
        finalize(() => {
          this.isLoadingNotifications = false;
        })
      )
      .subscribe({
        next: (response) => {
          const notifications = response.data ?? [];
          const unreadDailyFirstClassAlerts = notifications.filter((notification) =>
            notification.type === this.dailyFirstClassAlertType &&
            !notification.readAt
          ).length;
          console.log(`[HU22-FE][NOTIFICATIONS] total=${notifications.length}`);
          console.log(`[HU22-FE][NOTIFICATIONS] unreadDailyFirstClassAlerts=${unreadDailyFirstClassAlerts}`);
          const notification = this.findUnreadDailyFirstClassAlert(notifications);
          if (notification) {
            this.showAvailabilityAlertModal(notification);
          }
        },
        error: (error: HttpErrorResponse) => {
          console.log(`[HU22-FE][NOTIFICATIONS][ERROR] status=${error.status} message=${this.getHttpErrorLogMessage(error)}`);
          if (error.status === 401) {
            this.router.navigate(['/login']);
          }
        }
      });
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

  private findUnreadDailyFirstClassAlert(notifications: UserNotification[]): UserNotification | null {
    return notifications
      .filter((notification) => this.shouldShowDailyFirstClassAlert(notification))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
  }

  private shouldShowDailyFirstClassAlert(notification: UserNotification): boolean {
    const show =
      notification.type === this.dailyFirstClassAlertType &&
      !notification.readAt &&
      !this.shownAvailabilityNotificationIds.has(notification.id);
    console.log(`[HU22-FE][FILTER] notificationId=${notification.id} type=${notification.type} readAt=${notification.readAt ?? 'null'} show=${show}`);
    return show;
  }

  private connectNotificationSocket(): void {
    if (!this.canShowAlertPreferences || this.notificationSocketSubscription) {
      return;
    }

    this.notificationSocketSubscription = this.notificationSocketService
      .onNotificationCreated()
      .subscribe((notification) => {
        if (this.shouldShowDailyFirstClassAlert(notification)) {
          console.log('[HU22-FE][SOCKET] alerta HU22 recibida. Mostrando alerta.');
          this.showAvailabilityAlertModal(notification);
        }
      });
  }

  private showAvailabilityAlertModal(notification: UserNotification): void {
    if (this.dailyFirstClassAlert?.id === notification.id) {
      return;
    }

    this.shownAvailabilityNotificationIds.add(notification.id);
    this.dailyFirstClassAlert = notification;
    this.logShowAlert(notification);
  }

  private logShowAlert(notification: UserNotification): void {
    console.log(`[HU22-FE][SHOW] mostrando alerta notificationId=${notification.id} title=${notification.title}`);
  }

  private getAvailableSpaces(notification: UserNotification): number {
    const data = this.isDailyFirstClassAlertData(notification.data)
      ? notification.data
      : null;
    const available = data?.availability?.cars?.available ?? 0;
    return Number.isFinite(Number(available)) ? Number(available) : 0;
  }

  private getHttpErrorLogMessage(error: HttpErrorResponse): string {
    const message = error.error?.message;
    return Array.isArray(message)
      ? message.join(', ')
      : message || error.message || 'Sin mensaje';
  }

  private isDailyFirstClassAlertData(data: UserNotification['data']): data is DailyFirstClassAlertData {
    return !!data && typeof data === 'object';
  }
}
