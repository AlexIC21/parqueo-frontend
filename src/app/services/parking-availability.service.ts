import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

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

const STATIC_DATA: ParkingAvailability = {
  parkingLotId: 1,
  parkingLotName: 'Parqueo UCB Tupuraya',
  autosCapacity: 71,
  autosOccupied: 18,
  autosAvailable: 53,
  motosCapacity: 30,
  motosOccupied: 12,
  motosAvailable: 18,
  totalCapacity: 101,
  totalOccupied: 30,
  totalOccupancyPercent: 30,
  status: 'DISPONIBLE'
};

@Injectable({ providedIn: 'root' })
export class ParkingAvailabilityService {
  // TODO: reemplazar of(STATIC_DATA) con la llamada real cuando el backend esté listo:
  // constructor(private http: HttpClient) {}
  // getAvailability(): Observable<ParkingAvailability> {
  //   return this.http.get<ParkingAvailability>(`${environment.apiUrl}/parking/availability`);
  // }

  getAvailability(): Observable<ParkingAvailability> {
    return of(STATIC_DATA);
  }
}
