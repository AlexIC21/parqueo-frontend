export interface MyScheduleResponse {
  success: boolean;
  message: string;
  data: MyScheduleData;
}

export interface MyScheduleData {
  userId: number;
  classes: UserClass[];
}

export interface UserClass {
  id: number;
  subject: string;
  teacher?: string;
  dayOfWeek: string | number;
  startTime: string;
  endTime: string;
  classroom?: string;
  reminderMinutesBefore?: number;
  isActive: boolean;
}

export interface CreateScheduleRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
  classroom: string;
}
