import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AlertPreferencesResponse,
  UpdateAlertPreferencesRequest
} from '../models/alert-preferences.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AlertPreferencesService {
  private readonly apiBase = environment.apiUrl.replace(/\/$/, '');

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  getMyAlertPreferences(): Observable<AlertPreferencesResponse> {
    return this.http.get<AlertPreferencesResponse>(
      `${this.apiBase}/users/me/alert-preferences`,
      { headers: this.getHeaders() }
    );
  }

  updateMyAlertPreferences(
    payload: UpdateAlertPreferencesRequest
  ): Observable<AlertPreferencesResponse> {
    return this.http.put<AlertPreferencesResponse>(
      `${this.apiBase}/users/me/alert-preferences`,
      payload,
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
