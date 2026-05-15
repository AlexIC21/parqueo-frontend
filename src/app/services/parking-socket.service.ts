import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { ParkingSpace } from '../models/parking.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ParkingSocketService {
  private socket?: Socket;
  private readonly socketUrl = environment.apiUrl.replace(/\/api\/v1\/?$/, '');

  constructor(private auth: AuthService) {}

  connect(): void {
    if (this.socket?.connected || this.socket?.active) {
      return;
    }

    const token = this.auth.getToken();
    this.socket = io(this.socketUrl, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling']
    });
  }

  disconnect(): void {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = undefined;
  }

  onSpaceUpdated(): Observable<Partial<ParkingSpace>> {
    return new Observable((observer) => {
      this.connect();

      const handler = (space: Partial<ParkingSpace>) => observer.next(space);
      this.socket?.off('parking.space.updated', handler);
      this.socket?.on('parking.space.updated', handler);

      return () => {
        this.socket?.off('parking.space.updated', handler);
      };
    });
  }

  onConnectionError(): Observable<void> {
    return new Observable((observer) => {
      this.connect();

      const handler = () => observer.next();
      this.socket?.off('connect_error', handler);
      this.socket?.on('connect_error', handler);

      return () => {
        this.socket?.off('connect_error', handler);
      };
    });
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }
}
