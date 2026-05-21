export type ParkingGeneralStatus =
  | 'DISPONIBLE'
  | 'DEMANDA_MODERADA'
  | 'CASI_LLENO'
  | 'LLENO'
  | string;

export interface ParkingAvailabilityResponse {
  success: boolean;
  message: string;
  data: ParkingAvailabilityData;
}

export interface ParkingCounterResponse {
  success: boolean;
  message: string;
  data: ParkingCounterData;
}

export interface ParkingCounterData {
  availableSpaces: number;
  occupiedSpaces: number;
  totalCapacity: number;
  updatedAt: string;
}

export interface ParkingAvailabilityData {
  cars: VehicleAvailability;
  motorcycles: VehicleAvailability;
  total: TotalAvailability;
  generalStatus: ParkingGeneralStatus;
  lastMapUpdateAt?: string | null;
  updatedAt: string;
}

export interface VehicleAvailability {
  available: number;
  occupied: number;
  maintenance?: number;
  totalCapacity: number;
}

export interface TotalAvailability {
  available: number;
  occupied: number;
  maintenance?: number;
  totalCapacity: number;
  occupancyPercentage: number;
}

export interface ParkingMapResponse {
  success: boolean;
  message: string;
  data: ParkingMapData;
}

export interface ParkingSpaceStatusResponse {
  success: boolean;
  message: string;
  data: ParkingSpace;
}

export interface ParkingMapData {
  map: {
    name: string;
    version: string;
  };
  areas: ParkingArea[];
  spaces: ParkingSpace[];
  lastUpdate?: ParkingMapLastUpdate | null;
  updatedAt: string;
}

export interface ParkingMapLastUpdate {
  lastMapUpdateAt?: string | null;
  minutesSinceLastUpdate?: number | null;
  isStale?: boolean;
  staleThresholdMinutes?: number;
}

export interface ParkingArea {
  id: number;
  name: string;
  vehicleType: 'CAR' | 'MOTORCYCLE' | string;
  totalSpaces: number;
  availableSpaces: number;
  occupiedSpaces: number;
}

export interface ParkingSpace {
  id: number;
  code: string;
  vehicleType: 'CAR' | 'MOTORCYCLE' | string;
  status:
    | 'AVAILABLE'
    | 'LIBRE'
    | 'OCCUPIED'
    | 'OCUPADO'
    | 'MAINTENANCE'
    | 'MANTENIMIENTO'
    | string;
  svgElementId: string;
  lastMapUpdateAt?: string | null;
  updatedAt?: string | null;
}

export type EditableParkingSpaceStatus = 'LIBRE' | 'OCUPADO' | 'MANTENIMIENTO';
