export type IncidentStatus = 'ACTIVA' | 'RESUELTA' | 'CANCELADA' | string;

export interface Incident {
  id: number;
  type?: string;
  title?: string;
  description: string;
  parkingLotId?: number;
  status: IncidentStatus;
  readAt?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface IncidentResponse {
  success: boolean;
  message: string;
  data: Incident[];
}

export interface SingleIncidentResponse {
  success: boolean;
  message: string;
  data: Incident;
}

export interface UserIncidentResponse {
  success: boolean;
  message: string;
  data: Incident[];
  meta?: {
    unreadCount?: number;
  };
}

export interface CreateIncidentRequest {
  type: string;
  title: string;
  description: string;
  parkingLotId: number;
}
