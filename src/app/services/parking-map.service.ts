import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import {
  EditableParkingSpaceStatus,
  ParkingMapResponse,
  ParkingSpaceStatusResponse
} from '../models/parking.model';

@Injectable({ providedIn: 'root' })
export class ParkingMapService {
  private cachedMapResponse: ParkingMapResponse | null = null;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  getCachedParkingMap(): ParkingMapResponse | null {
    return this.cachedMapResponse;
  }

  getParkingMap(): Observable<ParkingMapResponse> {
    const token = this.auth.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http.get<ParkingMapResponse>(
      `${environment.apiUrl}/parking/map`,
      { headers }
    ).pipe(
      tap((response) => {
        this.cachedMapResponse = response;
      })
    );
  }

  updateSpaceStatus(
    spaceId: number,
    status: EditableParkingSpaceStatus
  ): Observable<ParkingSpaceStatusResponse> {
    const token = this.auth.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http.patch<ParkingSpaceStatusResponse>(
      `${environment.apiUrl}/parking/spaces/${spaceId}/status`,
      { status: this.toBackendStatus(status) },
      { headers }
    ).pipe(
      tap((response) => this.updateCachedSpace(response.data))
    );
  }

  private updateCachedSpace(updatedSpace: ParkingSpaceStatusResponse['data']): void {
    if (!this.cachedMapResponse?.data?.spaces) {
      return;
    }

    const spaces = this.cachedMapResponse.data.spaces;
    const index = spaces.findIndex((space) => space.id === updatedSpace.id);

    if (index >= 0) {
      spaces[index] = { ...spaces[index], ...updatedSpace };
    }
  }

  private toBackendStatus(status: EditableParkingSpaceStatus | string): EditableParkingSpaceStatus {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
      case 'LIBRE':
        return 'LIBRE';
      case 'OCCUPIED':
      case 'OCUPADO':
        return 'OCUPADO';
      case 'MAINTENANCE':
      case 'MANTENIMIENTO':
        return 'MANTENIMIENTO';
      default:
        throw new Error(`Estado de parqueo no soportado: ${status}`);
    }
  }
}
