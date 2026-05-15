import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateIncidentRequest,
  IncidentResponse,
  SingleIncidentResponse,
  UserIncidentResponse
} from '../models/incident.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class IncidentService {
  private readonly apiBase = environment.apiUrl.replace(/\/$/, '');

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  getIncidents(): Observable<IncidentResponse> {
    return this.http.get<IncidentResponse>(
      `${this.apiBase}/incidents`,
      { headers: this.getHeaders() }
    );
  }

  createIncident(payload: CreateIncidentRequest): Observable<SingleIncidentResponse> {
    return this.http.post<SingleIncidentResponse>(
      `${this.apiBase}/incidents`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  resolveIncident(incidentId: number): Observable<SingleIncidentResponse> {
    return this.http.patch<SingleIncidentResponse>(
      `${this.apiBase}/incidents/${incidentId}/resolve`,
      {},
      { headers: this.getHeaders() }
    );
  }

  cancelIncident(incidentId: number): Observable<SingleIncidentResponse> {
    return this.http.patch<SingleIncidentResponse>(
      `${this.apiBase}/incidents/${incidentId}/cancel`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getMyIncidents(): Observable<UserIncidentResponse> {
    return this.http.get<UserIncidentResponse>(
      `${this.apiBase}/users/me/incidents`,
      { headers: this.getHeaders() }
    );
  }

  markMyIncidentAsRead(incidentId: number): Observable<SingleIncidentResponse> {
    return this.http.patch<SingleIncidentResponse>(
      `${this.apiBase}/users/me/incidents/${incidentId}/read`,
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
