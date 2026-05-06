import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import {
  ParkingAvailability,
  ParkingAvailabilityService,
  ParkingStatus
} from '../../services/parking-availability.service';

@Component({
  selector: 'app-dashboard-usuario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-usuario.component.html',
  styleUrls: ['./dashboard-usuario.component.scss']
})
export class DashboardUsuarioComponent implements OnInit {
  availability: ParkingAvailability | null = null;
  isLoading = true;
  errorMessage = '';
  showGuestModal = false;

  constructor(
    private availabilityService: ParkingAvailabilityService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAvailability();
  }

  get autosAvailable(): number {
    return this.availability?.autosAvailable ?? 0;
  }

  get autosCapacity(): number {
    return this.availability?.autosCapacity ?? 0;
  }

  get motosAvailable(): number {
    return this.availability?.motosAvailable ?? 0;
  }

  get motosCapacity(): number {
    return this.availability?.motosCapacity ?? 0;
  }

  get totalOccupancyPercent(): number {
    if (!this.availability) {
      return 0;
    }

    const percent = this.availability.totalOccupancyPercent;
    if (Number.isFinite(percent)) {
      return Math.round(percent);
    }

    if (!this.availability.totalCapacity) {
      return 0;
    }

    return Math.round(
      (this.availability.totalOccupied / this.availability.totalCapacity) * 100
    );
  }

  get status(): ParkingStatus {
    if (this.availability?.status) {
      return this.availability.status;
    }

    const percent = this.totalOccupancyPercent;
    if (percent >= 100) {
      return 'LLENO';
    }
    if (percent >= 85) {
      return 'CASI_LLENO';
    }
    if (percent >= 60) {
      return 'DEMANDA_MODERADA';
    }
    return 'DISPONIBLE';
  }

  get statusMessage(): string {
    switch (this.status) {
      case 'DEMANDA_MODERADA':
        return 'Demanda moderada';
      case 'CASI_LLENO':
        return 'Parqueo casi lleno';
      case 'LLENO':
        return 'Parqueo lleno';
      default:
        return 'Hay espacios disponibles';
    }
  }

  get isAvailableStatus(): boolean {
    return this.status === 'DISPONIBLE';
  }

  onRestrictedAction(): void {
    this.showGuestModal = true;
  }

  goToLogin(): void {
    this.showGuestModal = false;
    this.router.navigate(['/login']);
  }

  closeModal(): void {
    this.showGuestModal = false;
  }


  private loadAvailability(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.availabilityService
      .getAvailability()
      .pipe(
        take(1),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: availability => {
          this.availability = availability;
        },
        error: () => {
          this.availability = null;
          this.errorMessage =
            'No se pudo cargar la disponibilidad del parqueo. Intente nuevamente.';
        }
      });
  }
}
