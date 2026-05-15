import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { UserNotification } from '../models/notification.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationSocketService {
  private socket?: Socket;
  private readonly socketUrl = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
  private readonly eventName = 'user.notification.created';

  constructor(private auth: AuthService) {}

  connect(): void {
    if (this.socket?.connected || this.socket?.active) {
      console.log(`[HU22-FE][SOCKET] connected=${!!this.socket.connected} socketId=${this.socket.id ?? 'pending'}`);
      return;
    }

    const token = this.auth.getToken();
    console.log(`[HU22-FE][SOCKET] conectando a socketUrl=${this.socketUrl}`);
    console.log(`[HU22-FE][SOCKET] authTokenPresent=${!!token} event=${this.eventName}`);

    this.socket = io(this.socketUrl, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log(`[HU22-FE][SOCKET] connected=${!!this.socket?.connected} socketId=${this.socket?.id ?? ''}`);
    });

    this.socket.on('connect_error', (error) => {
      console.log(`[HU22-FE][SOCKET][ERROR] message=${error.message}`);
    });
  }

  disconnect(): void {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = undefined;
  }

  onNotificationCreated(): Observable<UserNotification> {
    return new Observable((observer) => {
      this.connect();

      const handler = (payload: UserNotification) => {
        console.log(`[HU22-FE][SOCKET] evento recibido ${this.eventName}`);
        console.log('[HU22-FE][SOCKET] payload=', payload);
        observer.next(payload);
      };

      this.socket?.off(this.eventName, handler);
      this.socket?.on(this.eventName, handler);

      return () => {
        this.socket?.off(this.eventName, handler);
      };
    });
  }
}
