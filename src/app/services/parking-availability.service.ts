import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ParkingAvailabilityResponse } from '../models/parking.model';

@Injectable({ providedIn: 'root' })
export class ParkingAvailabilityService {
  constructor(private http: HttpClient) {}

  getAvailability(): Observable<ParkingAvailabilityResponse> {
    return this.http.get<ParkingAvailabilityResponse>(
      `${environment.apiUrl}/parking/availability`
    );
  }
}
