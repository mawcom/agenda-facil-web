export type AppointmentStatus = "scheduled" | "cancelled" | "completed";
export type UserRole = "barber" | "client";

export interface SessionUser {
  id: number;
  email: string;
  role: UserRole;
  clientId: number | null;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
}

export interface Service {
  id: number;
  name: string;
  priceCents: number;
  durationMinutes: number;
  active: boolean;
}

export interface Appointment {
  id: number;
  clientId: number;
  clientName: string;
  clientPhone: string;
  serviceId: number;
  serviceName: string;
  startAt: string;
  endAt: string;
  priceCents: number;
  durationMinutes: number;
  status: AppointmentStatus;
}

export interface CreateClientInput {
  name: string;
  phone: string;
  email: string;
}

export interface CreateServiceInput {
  name: string;
  priceCents: number;
  durationMinutes: number;
}

export interface CreateAppointmentInput {
  clientId: number;
  serviceId: number;
  startAt: string;
}
