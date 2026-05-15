export interface NotificationResponse {
  success: boolean;
  message: string;
  data: UserNotification[];
}

export interface NotificationReadResponse {
  success: boolean;
  message: string;
  data?: UserNotification;
}

export interface UserNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: ClassScheduleAlertData | Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface ClassScheduleAlertData {
  class?: {
    subject?: string;
    startTime?: string;
    classroom?: string;
  };
  vehicleType?: 'AUTO' | 'MOTO' | string;
  availability?: {
    cars?: {
      available?: number;
      totalCapacity?: number;
    };
    motorcycles?: {
      available?: number;
      totalCapacity?: number;
    };
  };
}
