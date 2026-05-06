import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ScheduleItem {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
  classroom: string;
  isActive: boolean;
}

export interface ScheduleListResponse {
  schedules: ScheduleItem[];
}

export interface ScheduleCreatePayload {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
  classroom: string;
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getSchedules(): Observable<ScheduleListResponse> {
    return this.http.get<ScheduleListResponse>(`${this.baseUrl}/schedules`);
  }

  createSchedule(payload: ScheduleCreatePayload): Observable<ScheduleItem> {
    return this.http.post<ScheduleItem>(`${this.baseUrl}/schedules`, payload);
  }
}
