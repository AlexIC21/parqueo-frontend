export interface AlertPreferencesResponse {
  success: boolean;
  message: string;
  data: AlertPreferences;
}

export interface AlertPreferences {
  userId: number;
  enabled: boolean;
  minutesBefore: number;
  vehicleType: 'AUTO' | 'MOTO';
  onlyFirstClassPerDay?: boolean;
  selectedScheduleAlerts?: SelectedScheduleAlert[];
}

export interface UpdateAlertPreferencesRequest {
  enabled: boolean;
  minutesBefore: number;
  vehicleType: 'AUTO' | 'MOTO';
  onlyFirstClassPerDay: boolean;
  selectedScheduleAlerts?: SelectedScheduleAlert[];
}

export interface SelectedScheduleAlert {
  scheduleId: number;
  enabled: boolean;
}
