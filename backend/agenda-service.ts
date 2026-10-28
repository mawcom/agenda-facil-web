import { database } from "./database";
import { AppError } from "./errors";
import type { Appointment, AppointmentStatus, CreateAppointmentInput, CreateClientInput, CreateServiceInput } from "./types";

const openingMinute = 8 * 60;
const closingMinute = 18 * 60;
const appointmentBufferMinutes = 10;

export function listClients() {
  return database.prepare(`SELECT id, name, phone, email, created_at AS createdAt FROM clients ORDER BY name COLLATE NOCASE`).all();
}

export function createClient(input: CreateClientInput) {
  try {
    const result = database.prepare("INSERT INTO clients (name, phone, email) VALUES (?, ?, ?)")
      .run(input.name, input.phone, input.email);
    return database.prepare("SELECT id, name, phone, email, created_at AS createdAt FROM clients WHERE id = ?")
      .get(result.lastInsertRowid);
  } catch (error) {
    if (String(error).includes("UNIQUE constraint failed")) throw new AppError("Já existe um cliente com esse e-mail.", 409);
    throw error;
  }
}

export function listServices() {
  return database.prepare(`
    SELECT id, name, price_cents AS priceCents, duration_minutes AS durationMinutes, active
    FROM services WHERE active = 1 ORDER BY name COLLATE NOCASE
  `).all();
}

export function createService(input: CreateServiceInput) {
  const result = database.prepare(`
    INSERT INTO services (name, price_cents, duration_minutes) VALUES (?, ?, ?)
  `).run(input.name, input.priceCents, input.durationMinutes);
  return database.prepare(`
    SELECT id, name, price_cents AS priceCents, duration_minutes AS durationMinutes, active
    FROM services WHERE id = ?
  `).get(result.lastInsertRowid);
}

export function listAppointments(date: string): Appointment[] {
  return database.prepare(`
    SELECT id, client_id AS clientId, client_name AS clientName, client_phone AS clientPhone,
      service_id AS serviceId, service_name AS serviceName, start_at AS startAt, end_at AS endAt,
      price_cents AS priceCents, duration_minutes AS durationMinutes, status
    FROM appointments
    WHERE substr(start_at, 1, 10) = ?
    ORDER BY start_at
  `).all(date) as unknown as Appointment[];
}

export function listClientAppointments(clientId: number): Appointment[] {
  return database.prepare(`
    SELECT id, client_id AS clientId, client_name AS clientName, client_phone AS clientPhone,
      service_id AS serviceId, service_name AS serviceName, start_at AS startAt, end_at AS endAt,
      price_cents AS priceCents, duration_minutes AS durationMinutes, status
    FROM appointments WHERE client_id = ? ORDER BY start_at DESC
  `).all(clientId) as unknown as Appointment[];
}

export function availableAppointmentTimes(date: string, serviceId: number): string[] {
  const service = database.prepare(`
    SELECT duration_minutes AS durationMinutes FROM services WHERE id = ? AND active = 1
  `).get(serviceId) as { durationMinutes: number } | undefined;
  if (!service) throw new AppError("O serviço selecionado não existe ou está inativo.", 404);

  const booked = database.prepare(`
    SELECT start_at AS startAt, end_at AS endAt FROM appointments
    WHERE status = 'scheduled' AND substr(start_at, 1, 10) = ?
  `).all(date) as Array<{ startAt: string; endAt: string }>;
  const [year, month, day] = date.split("-").map(Number);
  const times: string[] = [];
  const two = (number: number) => String(number).padStart(2, "0");

  for (let startMinute = openingMinute; startMinute + service.durationMinutes <= closingMinute; startMinute += appointmentBufferMinutes) {
    const startHour = Math.floor(startMinute / 60);
    const minute = startMinute % 60;
    if (new Date(year, month - 1, day, startHour, minute).getTime() <= Date.now()) continue;

    const endMinute = startMinute + service.durationMinutes;
    const conflicts = booked.some((appointment) => {
      const existingStartMinute = Number(appointment.startAt.slice(11, 13)) * 60 + Number(appointment.startAt.slice(14, 16));
      const existingEndMinute = Number(appointment.endAt.slice(11, 13)) * 60 + Number(appointment.endAt.slice(14, 16));
      return startMinute < existingEndMinute + appointmentBufferMinutes
        && endMinute + appointmentBufferMinutes > existingStartMinute;
    });

    if (!conflicts) times.push(`${two(startHour)}:${two(minute)}`);
  }
  return times;
}

export function createAppointment(input: CreateAppointmentInput): Appointment {
  database.exec("BEGIN IMMEDIATE");
  try {
    const client = database.prepare("SELECT id, name, phone FROM clients WHERE id = ?").get(input.clientId) as
      | { id: number; name: string; phone: string }
      | undefined;
    if (!client) throw new AppError("O cliente selecionado não existe.", 404);

    const service = database.prepare(`
      SELECT id, name, price_cents AS priceCents, duration_minutes AS durationMinutes
      FROM services WHERE id = ? AND active = 1
    `).get(input.serviceId) as { id: number; name: string; priceCents: number; durationMinutes: number } | undefined;
    if (!service) throw new AppError("O serviço selecionado não existe ou está inativo.", 404);

    const [datePart, timePart] = input.startAt.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);
    const startMinute = hour * 60 + minute;
    if (startMinute < openingMinute || startMinute >= closingMinute
      || !availableAppointmentTimes(datePart, service.id).includes(timePart)) {
      throw new AppError("Escolha um horário disponível entre 08:00 e 18:00, com 10 minutos entre atendimentos.", 409);
    }
    const end = new Date(year, month - 1, day, hour, minute + service.durationMinutes);
    const two = (number: number) => String(number).padStart(2, "0");
    const endAt = `${end.getFullYear()}-${two(end.getMonth() + 1)}-${two(end.getDate())}T${two(end.getHours())}:${two(end.getMinutes())}`;
    const conflict = database.prepare(`
      SELECT id FROM appointments
      WHERE status = 'scheduled' AND start_at < ? AND end_at > ?
      LIMIT 1
    `).get(endAt, input.startAt);
    if (conflict) throw new AppError("Esse horário conflita com outro atendimento. Escolha outro horário.", 409);

    const result = database.prepare(`
      INSERT INTO appointments (
        client_id, service_id, client_name, client_phone, service_name,
        start_at, end_at, price_cents, duration_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(client.id, service.id, client.name, client.phone, service.name,
      input.startAt, endAt, service.priceCents, service.durationMinutes);

    database.exec("COMMIT");
    return database.prepare(`
      SELECT id, client_id AS clientId, client_name AS clientName, client_phone AS clientPhone,
        service_id AS serviceId, service_name AS serviceName, start_at AS startAt, end_at AS endAt,
        price_cents AS priceCents, duration_minutes AS durationMinutes, status
      FROM appointments WHERE id = ?
    `).get(result.lastInsertRowid) as unknown as Appointment;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function changeAppointmentStatus(id: number, status: Exclude<AppointmentStatus, "scheduled">) {
  const result = database.prepare(`
    UPDATE appointments SET status = ? WHERE id = ? AND status = 'scheduled'
  `).run(status, id);
  if (result.changes === 0) {
    const exists = database.prepare("SELECT id FROM appointments WHERE id = ?").get(id);
    if (!exists) throw new AppError("Agendamento não encontrado.", 404);
    throw new AppError("Somente um agendamento ativo pode ser cancelado ou concluído.", 409);
  }
}

export function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError("Identificador inválido.");
  return id;
}
