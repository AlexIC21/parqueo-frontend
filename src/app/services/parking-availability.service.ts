import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ParkingStatus = 'DISPONIBLE' | 'DEMANDA_MODERADA' | 'CASI_LLENO' | 'LLENO';

export interface ParkingAvailability {
  parkingLotId: number;
  parkingLotName: string;
  autosCapacity: number;
  autosOccupied: number;
  autosAvailable: number;
  motosCapacity: number;
  motosOccupied: number;
  motosAvailable: number;
  totalCapacity: number;
  totalOccupied: number;
  totalOccupancyPercent: number;
  status: ParkingStatus;
}

@Injectable({ providedIn: 'root' })
export class ParkingAvailabilityService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAvailability(): Observable<ParkingAvailability> {
    return this.http.get<ParkingAvailability>(`${this.baseUrl}/parking/availability`);
  }
}
