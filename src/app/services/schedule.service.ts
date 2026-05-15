import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { CreateScheduleRequest, MyScheduleResponse } from '../models/schedule.model';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  getMySchedule(): Observable<MyScheduleResponse> {
    const token = this.auth.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http.get<MyScheduleResponse>(
      `${environment.apiUrl}/users/me/schedule`,
      { headers }
    );
  }

  createMySchedule(payload: CreateScheduleRequest): Observable<MyScheduleResponse> {
    const token = this.auth.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http.post<MyScheduleResponse>(
      `${environment.apiUrl}/users/me/schedule`,
      payload,
      { headers }
    );
  }
}
