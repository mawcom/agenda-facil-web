import { AppError } from "./errors";
import type { CreateAppointmentInput, CreateClientInput, CreateServiceInput, UserRole } from "./types";

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AppError("Envie os dados em formato JSON.");
  }
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`Informe ${label}.`);
  }
  const cleaned = value.trim();
  if (cleaned.length > maxLength) throw new AppError(`${label} deve ter até ${maxLength} caracteres.`);
  return cleaned;
}

function positiveInteger(value: unknown, label: string): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new AppError(`${label} deve ser um número inteiro maior que zero.`);
  return number;
}

export function parseClient(value: unknown): CreateClientInput {
  const body = asObject(value);
  const name = requiredText(body.name, "o nome do cliente", 100);
  const phone = parsePhone(body.phone);
  const email = parseEmail(body.email);
  return { name, phone, email };
}

function parsePhone(value: unknown): string {
  const phone = requiredText(value, "o telefone", 30);
  if (!/^\+?[0-9\s().-]+$/.test(phone)) throw new AppError("O telefone deve conter somente números e formatação de telefone.");
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) digits = digits.slice(2);
  if (!/^[1-9][0-9]{9,10}$/.test(digits)) throw new AppError("Informe um telefone brasileiro com DDD e 8 ou 9 números.");
  return digits;
}

function parseEmail(value: unknown): string {
  const email = requiredText(value, "o e-mail", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError("Informe um e-mail válido.");
  return email;
}

function parsePassword(value: unknown): string {
  if (typeof value !== "string" || value.length < 5 || value.length > 200) {
    throw new AppError("A senha precisa ter de 5 a 200 caracteres.");
  }
  return value;
}

export function parseBarberSetup(value: unknown) {
  const body = asObject(value);
  return { email: parseEmail(body.email), password: parsePassword(body.password) };
}

export function parseLogin(value: unknown): { email: string; password: string; role: UserRole } {
  const body = asObject(value);
  if (body.role !== "barber" && body.role !== "client") throw new AppError("Selecione a área de cliente ou barbeiro.");
  return { email: parseEmail(body.email), password: parsePassword(body.password), role: body.role };
}

export function parseClientRegistration(value: unknown) {
  const body = asObject(value);
  return {
    ...parseClient(body),
    password: parsePassword(body.password),
  };
}

export function parseService(value: unknown): CreateServiceInput {
  const body = asObject(value);
  const name = requiredText(body.name, "o nome do serviço", 100);
  const priceCents = Number(body.priceCents);
  if (!Number.isSafeInteger(priceCents) || priceCents < 0) throw new AppError("O preço deve ser zero ou maior, em centavos.");
  const durationMinutes = positiveInteger(body.durationMinutes, "A duração");
  return { name, priceCents, durationMinutes };
}

export function parseAppointment(value: unknown): CreateAppointmentInput {
  const body = asObject(value);
  const clientId = positiveInteger(body.clientId, "O cliente");
  const serviceId = positiveInteger(body.serviceId, "O serviço");
  const startAt = requiredText(body.startAt, "a data e hora", 16);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startAt)) {
    throw new AppError("Escolha uma data e hora válidas.");
  }
  const [datePart, timePart] = startAt.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute) {
    throw new AppError("A data e hora não são válidas.");
  }
  if (date.getTime() <= Date.now()) throw new AppError("O agendamento precisa ser em um horário futuro.");
  return { clientId, serviceId, startAt };
}

export function parseAppointmentDate(value: string | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new AppError("Informe a data no formato AAAA-MM-DD.");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) throw new AppError("A data informada não é válida.");
  return value;
}
