import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Incident } from '../models/incident.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class IncidentSocketService {
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

  onIncidentCreated(): Observable<Incident> {
    return this.listen('incident.created');
  }

  onIncidentResolved(): Observable<Incident> {
    return this.listen('incident.resolved');
  }

  onIncidentCancelled(): Observable<Incident> {
    return this.listen('incident.cancelled');
  }

  private listen(eventName: string): Observable<Incident> {
    return new Observable((observer) => {
      this.connect();

      const handler = (incident: Incident) => observer.next(incident);
      this.socket?.off(eventName, handler);
      this.socket?.on(eventName, handler);

      return () => {
        this.socket?.off(eventName, handler);
      };
    });
  }
}
