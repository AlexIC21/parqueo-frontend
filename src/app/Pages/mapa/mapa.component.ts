import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, Subscription, take } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ParkingMapService } from '../../services/parking-map.service';
import { ParkingSocketService } from '../../services/parking-socket.service';
import {
  EditableParkingSpaceStatus,
  ParkingMapData,
  ParkingMapResponse,
  ParkingSpace
} from '../../models/parking.model';

type NormalizedSpaceStatus = 'LIBRE' | 'OCUPADO' | 'MANTENIMIENTO' | 'UNKNOWN';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss']
})
export class MapaComponent implements OnInit, OnDestroy {
  @ViewChild('parkingSvg') parkingSvg?: ElementRef<HTMLObjectElement>;

  mapData: ParkingMapData | null = null;
  selectedSpace: ParkingSpace | null = null;
  freeCount = 0;
  occupiedCount = 0;
  maintenanceCount = 0;
  isLoading = true;
  errorMessage = '';
  infoMessage = '';
  realtimeMessage = '';
  spaceUpdateMessage = '';
  spaceUpdateError = '';
  isUpdatingSpace = false;
  isPaintingMap = false;
  private svgReady = false;
  private svgDoc: Document | null = null;
  private svgElementsById = new Map<string, SVGElement>();
  private svgPaintTargetsById = new Map<string, SVGElement>();
  private paintFrameId: number | null = null;
  private socketSubscription?: Subscription;
  private socketErrorSubscription?: Subscription;

  constructor(
    private mapService: ParkingMapService,
    private parkingSocket: ParkingSocketService,
    private auth: AuthService,
    private router: Router,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadMap();
    this.connectRealtimeUpdates();
  }

  ngOnDestroy(): void {
    this.socketSubscription?.unsubscribe();
    this.socketErrorSubscription?.unsubscribe();
    if (this.paintFrameId !== null) {
      cancelAnimationFrame(this.paintFrameId);
    }
    this.parkingSocket.disconnect();
  }

  onSvgLoaded(): void {
    this.svgReady = true;
    this.svgDoc = this.parkingSvg?.nativeElement.contentDocument ?? null;
    this.cacheSvgElements();
    this.paintSpaces();
  }

  get updatedAt(): string {
    return this.mapData?.updatedAt ?? '';
  }

  get isGuardia(): boolean {
    return this.auth.currentUser?.role?.trim().toUpperCase() === 'GUARDIA';
  }

  goBack(): void {
    this.router.navigate([this.isGuardia ? '/dashboard-guardia' : '/dashboard-usuario']);
  }

  updateSpaceColor(space: ParkingSpace): void {
    const element = this.getCachedSvgElement(space);
    const target = this.getCachedSvgPaintTarget(space, element);
    if (target) {
      target.style.fill = this.getColorByStatus(space.status);
      target.style.stroke = '#111827';
      target.style.transition = 'fill 0.2s ease';
    }

    if (element) {
      element.style.cursor = 'pointer';
      element.style.pointerEvents = 'all';
      element.style.touchAction = 'manipulation';
      element.querySelectorAll('text').forEach((text) => {
        (text as SVGElement).style.pointerEvents = 'none';
      });
      element.onclick = null;
      element.onpointerup = (event: PointerEvent) => {
        event.preventDefault();
        event.stopPropagation();
        this.zone.run(() => this.handleSpaceClick(space));
      };
    }
  }

  handleSpaceClick(space: ParkingSpace): void {
    this.spaceUpdateError = '';
    this.spaceUpdateMessage = '';
    this.selectedSpace = space;

    if (!this.isGuardia) {
      return;
    }

    this.changeSpaceStatus(space, this.getNextStatus(space));
  }

  cancelSpaceSelection(): void {
    this.clearSelectedSpace();
  }

  clearSelectedSpace(): void {
    this.selectedSpace = null;
    this.spaceUpdateError = '';
    this.spaceUpdateMessage = '';
  }

  getNextStatus(space: ParkingSpace): EditableParkingSpaceStatus {
    switch (this.normalizeStatus(space.status)) {
      case 'LIBRE':
        return 'OCUPADO';
      case 'OCUPADO':
        return 'MANTENIMIENTO';
      case 'MANTENIMIENTO':
      default:
        return 'LIBRE';
    }
  }

  changeSpaceStatus(space: ParkingSpace, status: EditableParkingSpaceStatus): void {
    if (!this.isGuardia || this.isUpdatingSpace) {
      return;
    }

    this.selectedSpace = space;
    this.isUpdatingSpace = true;
    this.spaceUpdateError = '';
    this.spaceUpdateMessage = '';

    this.mapService
      .updateSpaceStatus(space.id, status)
      .pipe(
        take(1),
        finalize(() => {
          this.isUpdatingSpace = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.handleSpaceUpdated(response.data);
          this.spaceUpdateMessage = 'Estado actualizado';
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 403) {
            this.spaceUpdateError = 'No tienes permisos para actualizar espacios.';
            return;
          }

          this.spaceUpdateError = 'No se pudo actualizar el estado del espacio.';
        }
      });
  }

  getColorByStatus(status: string): string {
    switch (this.normalizeStatus(status)) {
      case 'LIBRE':
        return '#22c55e';
      case 'OCUPADO':
        return '#ef4444';
      case 'MANTENIMIENTO':
        return '#f59e0b';
      default:
        return '#cbd5e1';
    }
  }

  getStatusLabel(status: string): string {
    switch (this.normalizeStatus(status)) {
      case 'LIBRE':
        return 'Libre';
      case 'OCUPADO':
        return 'Ocupado';
      case 'MANTENIMIENTO':
        return 'Mantenimiento';
      default:
        return 'Sin estado';
    }
  }

  getVehicleTypeLabel(vehicleType: string): string {
    switch (vehicleType?.toUpperCase()) {
      case 'CAR':
      case 'AUTO':
        return 'Auto';
      case 'MOTORCYCLE':
      case 'MOTO':
        return 'Moto';
      default:
        return vehicleType;
    }
  }

  private loadMap(): void {
    if (!this.auth.getToken()) {
      window.alert('Debes iniciar sesi\u00f3n para ver el mapa');
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.infoMessage = '';

    const cachedResponse = this.mapService.getCachedParkingMap();
    if (cachedResponse) {
      this.applyMapResponse(cachedResponse);
      this.isLoading = false;
    }

    this.mapService
      .getParkingMap()
      .pipe(
        take(1),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response: ParkingMapResponse) => {
          this.applyMapResponse(response);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            window.alert('Tu sesi\u00f3n expir\u00f3. Inicia sesi\u00f3n nuevamente');
            this.router.navigate(['/login']);
            return;
          }

          if (error.status === 403) {
            this.errorMessage = 'No tienes permisos para ver el mapa';
            return;
          }

          this.errorMessage = 'No se pudo cargar el mapa del parqueo';
        }
      });
  }

  private connectRealtimeUpdates(): void {
    if (!this.auth.getToken()) {
      return;
    }

    this.socketSubscription?.unsubscribe();
    this.socketErrorSubscription?.unsubscribe();
    this.parkingSocket.connect();
    this.socketSubscription = this.parkingSocket.onSpaceUpdated().subscribe({
      next: (space) => {
        this.zone.run(() => this.handleSpaceUpdated(space));
      }
    });
    this.socketErrorSubscription = this.parkingSocket.onConnectionError().subscribe(() => {
      this.zone.run(() => {
        this.realtimeMessage = 'Actualizaci\u00f3n en tiempo real no disponible.';
      });
    });
  }

  private handleSpaceUpdated(updatedSpace: Partial<ParkingSpace>): void {
    if (!updatedSpace.id || !this.mapData?.spaces) {
      return;
    }

    const index = this.mapData.spaces.findIndex((space) => space.id === updatedSpace.id);
    const mergedSpace = index >= 0
      ? { ...this.mapData.spaces[index], ...updatedSpace }
      : updatedSpace;

    if (!this.isCompleteParkingSpace(mergedSpace)) {
      return;
    }

    if (index >= 0) {
      this.mapData.spaces[index] = mergedSpace;
    } else {
      this.mapData.spaces.push(mergedSpace);
    }

    if (this.selectedSpace?.id === mergedSpace.id) {
      this.selectedSpace = mergedSpace;
    }

    this.updateCounters();
    this.updateSpaceColorInSvg(mergedSpace);
  }

  private paintSpaces(): void {
    if (!this.svgReady || !this.mapData?.spaces?.length) {
      return;
    }

    if (!this.svgDoc) {
      return;
    }

    this.cacheSvgElements();
    this.paintSpacesInBatches(this.mapData.spaces);
  }

  private updateSpaceColorInSvg(space: ParkingSpace): void {
    if (!this.svgDoc) {
      return;
    }

    this.updateSpaceColor(space);
  }

  private applyMapResponse(response: ParkingMapResponse): void {
    this.mapData = response.data;
    this.infoMessage = this.mapData.spaces?.length
      ? ''
      : 'A\u00fan no hay espacios configurados para pintar';
    this.updateCounters();
    this.paintSpaces();
  }

  private cacheSvgElements(): void {
    if (!this.svgDoc || !this.mapData?.spaces?.length) {
      return;
    }

    this.mapData.spaces.forEach((space) => {
      if (this.svgElementsById.has(space.svgElementId)) {
        return;
      }

      const element = this.svgDoc?.getElementById(space.svgElementId) as SVGElement | null;
      if (!element) {
        return;
      }

      this.svgElementsById.set(space.svgElementId, element);
      const target = this.getSvgPaintTarget(element);
      if (target) {
        this.svgPaintTargetsById.set(space.svgElementId, target);
      }
    });
  }

  private paintSpacesInBatches(spaces: ParkingSpace[]): void {
    if (this.paintFrameId !== null) {
      cancelAnimationFrame(this.paintFrameId);
    }

    const batchSize = 18;
    let index = 0;
    this.isPaintingMap = true;

    const paintNextBatch = () => {
      const end = Math.min(index + batchSize, spaces.length);

      for (; index < end; index += 1) {
        this.updateSpaceColor(spaces[index]);
      }

      if (index < spaces.length) {
        this.paintFrameId = requestAnimationFrame(paintNextBatch);
        return;
      }

      this.paintFrameId = null;
      this.isPaintingMap = false;
    };

    this.paintFrameId = requestAnimationFrame(paintNextBatch);
  }

  private getCachedSvgElement(space: ParkingSpace): SVGElement | null {
    const cachedElement = this.svgElementsById.get(space.svgElementId);
    if (cachedElement) {
      return cachedElement;
    }

    const element = this.svgDoc?.getElementById(space.svgElementId) as SVGElement | null;
    if (element) {
      this.svgElementsById.set(space.svgElementId, element);
    }

    return element;
  }

  private getCachedSvgPaintTarget(space: ParkingSpace, element: SVGElement | null): SVGElement | null {
    const cachedTarget = this.svgPaintTargetsById.get(space.svgElementId);
    if (cachedTarget) {
      return cachedTarget;
    }

    if (!element) {
      return null;
    }

    const target = this.getSvgPaintTarget(element);
    if (target) {
      this.svgPaintTargetsById.set(space.svgElementId, target);
    }

    return target;
  }

  private updateCounters(): void {
    const spaces = this.mapData?.spaces ?? [];
    this.freeCount = spaces.filter((space) => this.normalizeStatus(space.status) === 'LIBRE').length;
    this.occupiedCount = spaces.filter((space) => this.normalizeStatus(space.status) === 'OCUPADO').length;
    this.maintenanceCount = spaces.filter((space) => this.normalizeStatus(space.status) === 'MANTENIMIENTO').length;
  }

  private normalizeStatus(status: string): NormalizedSpaceStatus {
    switch (status?.toUpperCase()) {
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
        return 'UNKNOWN';
    }
  }

  private isCompleteParkingSpace(space: Partial<ParkingSpace>): space is ParkingSpace {
    return !!space.id && !!space.code && !!space.status && !!space.svgElementId;
  }

  private getSvgPaintTarget(element: SVGElement): SVGElement | null {
    if (element.tagName.toLowerCase() === 'g') {
      return element.querySelector('rect, path, polygon') as SVGElement | null;
    }

    return element;
  }
}
