import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ParkingAvailabilityResponse,
  ParkingCounterResponse
} from '../models/parking.model';

@Injectable({ providedIn: 'root' })
export class ParkingAvailabilityService {
  constructor(private http: HttpClient) {}

  getAvailability(): Observable<ParkingAvailabilityResponse> {
    const endpoint = `${environment.apiUrl}/parking/availability`;
    console.log('[AVAILABILITY] apiUrl:', environment.apiUrl);
    console.log('[AVAILABILITY] endpoint:', endpoint);

    return this.http.get<ParkingAvailabilityResponse>(endpoint);
  }

  getCounter(): Observable<ParkingCounterResponse> {
    const endpoint = `${environment.apiUrl}/contador`;

    return this.http.get<ParkingCounterResponse>(endpoint);
  }
}
