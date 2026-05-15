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
  data?: DailyFirstClassAlertData | Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface DailyFirstClassAlertData {
  class?: {
    subject?: string;
    startTime?: string;
    classroom?: string;
  };
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
