import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  NotificationReadResponse,
  NotificationResponse
} from '../models/notification.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly apiBase = environment.apiUrl.replace(/\/$/, '');

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  getMyNotifications(): Observable<NotificationResponse> {
    console.log('[HU22-FE][NOTIFICATIONS] consultando notificaciones');

    return this.http.get<NotificationResponse>(
      `${this.apiBase}/users/me/notifications`,
      { headers: this.getHeaders() }
    );
  }

  markAsRead(notificationId: number): Observable<NotificationReadResponse> {
    console.log(`[HU22-FE][READ] marcando como leída notificationId=${notificationId}`);

    return this.http.patch<NotificationReadResponse>(
      `${this.apiBase}/users/me/notifications/${notificationId}/read`,
      {},
      { headers: this.getHeaders() }
    );
  }

  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }
}
