export const APPOINTMENT_STATUSES = ['scheduled', 'cancelled', 'completed'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  service: string;
  startsAt: Date;
  endsAt: Date;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentData {
  clientName: string;
  clientEmail: string;
  service: string;
  startsAt: Date;
  endsAt: Date;
  notes?: string | null;
}

export type UpdateAppointmentData = Partial<CreateAppointmentData> & {
  status?: AppointmentStatus;
};

export interface AppointmentFilters {
  status?: AppointmentStatus;
  from?: Date;
  to?: Date;
}
