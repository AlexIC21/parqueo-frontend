import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ParkingSpaceStatus = 'LIBRE' | 'OCUPADO' | 'MANTENIMIENTO' | string;
export type VehicleType = 'AUTO' | 'MOTO' | string;

export interface ParkingSpaceStatusItem {
  spaceCode: string;
  svgElementId: string;
  vehicleType: VehicleType;
  status: ParkingSpaceStatus;
}

export interface ParkingMapStatusResponse {
  spaces: ParkingSpaceStatusItem[];
}

@Injectable({ providedIn: 'root' })
export class ParkingMapService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMapStatus(): Observable<ParkingMapStatusResponse> {
    return this.http.get<ParkingMapStatusResponse>(`${this.baseUrl}/parking/map/status`);
  }
}
