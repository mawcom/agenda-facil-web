interface User {
  id: number;
  email: string;
  role: "barber" | "client";
  clientId: number | null;
}

type UserRole = User["role"];

interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
}

interface Service {
  id: number;
  name: string;
  priceCents: number;
  durationMinutes: number;
}

interface Appointment {
  id: number;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  startAt: string;
  endAt: string;
  priceCents: number;
  status: "scheduled" | "cancelled" | "completed";
}

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const dateInput = byId<HTMLInputElement>("agenda-date");
const bookingDateInput = byId<HTMLInputElement>("booking-date");
const bookingTimeInput = byId<HTMLInputElement>("booking-time");
const bookingTimes = byId<HTMLDivElement>("booking-times");
const bookingTimeMessage = byId<HTMLParagraphElement>("booking-time-message");
const notice = byId<HTMLDivElement>("notice");
let clients: Client[] = [];
let services: Service[] = [];
let noticeTimer: number | undefined;
let selectedAuthRole: UserRole = "client";

function pathForRole(role: UserRole): string {
  return role === "barber" ? "/barbeiro" : "/cliente";
}

function loginPathForRole(role: UserRole): string {
  return `/login?tipo=${role === "barber" ? "barbeiro" : "cliente"}`;
}

function roleFromPath(): UserRole {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/barbeiro" || (path !== "/cliente" && new URLSearchParams(window.location.search).get("tipo") === "barbeiro")) {
    return "barber";
  }
  return "client";
}

function selectAuthRole(role: UserRole, updateRoute = true) {
  selectedAuthRole = role;
  byId("client-auth-view").hidden = role !== "client";
  byId("barber-auth-view").hidden = role !== "barber";
  byId("client-tab").classList.toggle("active", role === "client");
  byId("barber-tab").classList.toggle("active", role === "barber");
  byId("client-tab").setAttribute("aria-selected", String(role === "client"));
  byId("barber-tab").setAttribute("aria-selected", String(role === "barber"));
  if (updateRoute) {
    window.history.pushState({}, "", loginPathForRole(role));
  }
}

function localDateTime(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function showNotice(message: string, isError = false) {
  notice.textContent = message;
  notice.hidden = false;
  notice.classList.toggle("error", isError);
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => { notice.hidden = true; }, 5000);
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: "same-origin",
    headers: { "content-type": "application/json", ...options.headers },
  });
  const body = await response.json() as T | { error: string };
  if (!response.ok) {
    const errorBody = body as { error?: string };
    throw new Error(errorBody.error ?? "Não foi possível concluir a solicitação.");
  }
  return body as T;
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function moneyInputValue(cents: number): string {
  return `R$ ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)}`;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function formatPhone(value: string): string {
  let digits = digitsOnly(value);
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  const areaCode = digits.slice(0, 2);
  const number = digits.slice(2);
  if (number.length <= 4) return `(${areaCode}) ${number}`;
  const splitAt = digits.length > 10 ? 5 : 4;
  return `(${areaCode}) ${number.slice(0, splitAt)}-${number.slice(splitAt)}`;
}

function formatTime(value: string): string {
  return new Date(`${value}:00`).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day, 12).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

function formatDuration(startAt: string, endAt: string): string {
  const minutes = (new Date(`${endAt}:00`).getTime() - new Date(`${startAt}:00`).getTime()) / 60_000;
  return `${minutes} min`;
}

function showView(view: "auth" | "barber" | "client", user?: User) {
  byId("auth-screen").hidden = view !== "auth";
  byId("barber-screen").hidden = view !== "barber";
  byId("client-screen").hidden = view !== "client";
  const logout = byId<HTMLButtonElement>("logout-button");
  const accountEmail = byId<HTMLSpanElement>("account-email");
  logout.hidden = view === "auth";
  accountEmail.hidden = view === "auth";
  if (user) {
    selectedAuthRole = user.role;
    window.history.replaceState({}, "", pathForRole(user.role));
    accountEmail.textContent = user.email;
    if (user.role === "barber") void loadBarberData();
    else {
      byId("client-email-label").textContent = user.email;
      void loadClientAppointments();
    }
  }
}

function refreshClientOptions() {
  const select = byId<HTMLSelectElement>("booking-client");
  select.replaceChildren(new Option("Selecione um cliente", ""));
  clients.forEach((client) => select.add(new Option(`${client.name} · ${formatPhone(client.phone)}`, String(client.id))));
  const list = byId<HTMLUListElement>("client-list");
  list.replaceChildren();
  if (!clients.length) list.append(makeEmptyListItem("Nenhum cliente cadastrado."));
  clients.slice(0, 5).forEach((client) => {
    const item = document.createElement("li");
    item.textContent = client.name;
    const detail = document.createElement("small");
    detail.textContent = formatPhone(client.phone);
    item.append(detail);
    list.append(item);
  });
  byId("summary-clients").textContent = String(clients.length);
}

function refreshServiceOptions() {
  const select = byId<HTMLSelectElement>("booking-service");
  const selectedServiceId = select.value;
  select.replaceChildren(new Option("Selecione um serviço", ""));
  services.forEach((service) => select.add(new Option(`${service.name} · ${formatMoney(service.priceCents)}`, String(service.id))));
  if (services.some((service) => String(service.id) === selectedServiceId)) select.value = selectedServiceId;
  const list = byId<HTMLUListElement>("service-list");
  list.replaceChildren();
  if (!services.length) list.append(makeEmptyListItem("Nenhum serviço cadastrado."));
  services.forEach((service) => {
    const item = document.createElement("li");
    item.textContent = service.name;
    const detail = document.createElement("small");
    detail.textContent = `${formatMoney(service.priceCents)} · ${service.durationMinutes} min`;
    item.append(detail);
    list.append(item);
  });
  updateBookingSummary();
}

function makeEmptyListItem(message: string): HTMLLIElement {
  const item = document.createElement("li");
  item.className = "list-empty";
  item.textContent = message;
  return item;
}

function updateBookingSummary() {
  const service = services.find((item) => item.id === Number(byId<HTMLSelectElement>("booking-service").value));
  byId("booking-summary").textContent = service
    ? `${service.durationMinutes} minutos · ${formatMoney(service.priceCents)}. O valor fica salvo no histórico.`
    : "Escolha um serviço para ver a duração e o preço.";
}

function statusLabel(status: Appointment["status"]): string {
  return status === "completed" ? "Concluído" : status === "cancelled" ? "Cancelado" : "Agendado";
}

function appointmentCard(appointment: Appointment, allowActions: boolean): HTMLLIElement {
  const item = document.createElement("li");
  item.className = "appointment-item";
  const time = document.createElement("div");
  time.className = "appointment-time";
  time.textContent = formatTime(appointment.startAt);
  const duration = document.createElement("small");
  duration.textContent = formatDuration(appointment.startAt, appointment.endAt);
  time.append(duration);

  const person = document.createElement("div");
  person.className = "appointment-person";
  const name = document.createElement("strong");
  name.textContent = appointment.clientName;
  const detail = document.createElement("span");
  detail.textContent = `${appointment.serviceName} · ${formatPhone(appointment.clientPhone)}`;
  person.append(name, detail);

  const side = document.createElement("div");
  side.className = "appointment-side";
  const price = document.createElement("span");
  price.className = "appointment-price";
  price.textContent = formatMoney(appointment.priceCents);
  const status = document.createElement("span");
  status.className = `status-pill ${appointment.status === "completed" ? "completed" : appointment.status === "cancelled" ? "cancelled" : ""}`;
  status.textContent = statusLabel(appointment.status);
  side.append(price, status);

  if (allowActions && appointment.status === "scheduled") {
    const actions = document.createElement("div");
    actions.className = "appointment-actions";
    const complete = document.createElement("button");
    complete.className = "text-button";
    complete.type = "button";
    complete.textContent = "Concluir";
    complete.addEventListener("click", () => updateAppointment(appointment.id, "complete"));
    const cancel = document.createElement("button");
    cancel.className = "text-button cancel";
    cancel.type = "button";
    cancel.textContent = "Cancelar";
    cancel.addEventListener("click", () => updateAppointment(appointment.id, "cancel"));
    actions.append(complete, cancel);
    side.append(actions);
  }
  item.append(time, person, side);
  return item;
}

async function loadBarberData() {
  try {
    const [clientRows, serviceRows, appointmentRows] = await Promise.all([
      api<Client[]>("/api/clients"),
      api<Service[]>("/api/services"),
      api<Appointment[]>(`/api/appointments?date=${encodeURIComponent(dateInput.value)}`),
    ]);
    clients = clientRows;
    services = serviceRows;
    refreshClientOptions();
    refreshServiceOptions();
    renderBarberAppointments(appointmentRows);
    await loadAvailableTimes();
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "Falha ao carregar dados.", true);
  }
}

async function loadAvailableTimes() {
  const serviceId = byId<HTMLSelectElement>("booking-service").value;
  const date = bookingDateInput.value;
  const service = services.find((item) => item.id === Number(serviceId));
  bookingTimes.replaceChildren();
  bookingTimeInput.value = "";
  if (!serviceId || !date) {
    bookingTimeMessage.textContent = !date
      ? "Escolha um dia no calendário."
      : "Escolha um serviço para ver os horários disponíveis.";
    return;
  }

  if (!service) {
    bookingTimeMessage.textContent = "O serviço selecionado não está disponível. Atualize a lista de serviços.";
    return;
  }

  bookingTimeMessage.textContent = "Buscando horários disponíveis...";
  try {
    const appointments = await api<Appointment[]>(`/api/appointments?date=${encodeURIComponent(date)}`);
    const times = calculateAvailableTimes(date, service.durationMinutes, appointments);
    bookingTimeMessage.textContent = times.length
      ? "Toque em um horário para selecioná-lo."
      : "Não há horários disponíveis neste dia para este serviço.";
    times.forEach((time) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "booking-time-option";
      button.textContent = time;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        bookingTimeInput.value = time;
        bookingTimes.querySelectorAll<HTMLButtonElement>(".booking-time-option").forEach((option) => {
          const selected = option === button;
          option.classList.toggle("selected", selected);
          option.setAttribute("aria-pressed", String(selected));
        });
        bookingTimeMessage.textContent = `Horário selecionado: ${time}.`;
      });
      bookingTimes.append(button);
    });
  } catch (error) {
    bookingTimeMessage.textContent = "Não foi possível consultar a agenda deste dia. Confira sua conexão e tente novamente.";
    showNotice(error instanceof Error ? error.message : "Não foi possível carregar os horários.", true);
  }
}

function calculateAvailableTimes(date: string, durationMinutes: number, appointments: Appointment[]): string[] {
  const [year, month, day] = date.split("-").map(Number);
  const now = Date.now();
  const openingMinute = 8 * 60;
  const closingMinute = 18 * 60;
  const bufferMilliseconds = 10 * 60_000;
  const activeAppointments = appointments
    .filter((appointment) => appointment.status === "scheduled")
    .map((appointment) => ({
      start: new Date(`${appointment.startAt}:00`).getTime(),
      end: new Date(`${appointment.endAt}:00`).getTime(),
    }));
  const times: string[] = [];

  for (let startMinute = openingMinute; startMinute + durationMinutes <= closingMinute; startMinute += 10) {
    const hour = Math.floor(startMinute / 60);
    const minute = startMinute % 60;
    const start = new Date(year, month - 1, day, hour, minute).getTime();
    if (start <= now) continue;
    const end = start + durationMinutes * 60_000;
    const conflicts = activeAppointments.some((appointment) =>
      start < appointment.end + bufferMilliseconds && end + bufferMilliseconds > appointment.start,
    );
    if (!conflicts) times.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  }
  return times;
}

function renderBarberAppointments(appointments: Appointment[]) {
  const list = byId<HTMLOListElement>("appointment-list");
  list.replaceChildren();
  byId("empty-agenda").hidden = appointments.length > 0;
  byId("summary-count").textContent = String(appointments.filter((item) => item.status === "scheduled").length);
  byId("summary-completed").textContent = String(appointments.filter((item) => item.status === "completed").length);
  appointments.forEach((appointment) => list.append(appointmentCard(appointment, true)));
}

async function loadClientAppointments() {
  try {
    const appointments = await api<Appointment[]>("/api/client/appointments");
    const list = byId<HTMLOListElement>("client-appointment-list");
    list.replaceChildren();
    byId("empty-client-agenda").hidden = appointments.length > 0;
    appointments.forEach((appointment) => {
      const card = appointmentCard(appointment, false);
      const date = document.createElement("span");
      date.className = "client-appointment-date";
      date.textContent = formatDate(appointment.startAt);
      card.querySelector(".appointment-person")?.prepend(date);
      list.append(card);
    });
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "Não foi possível carregar seus horários.", true);
  }
}

async function loadSession() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const redirectToLogin = () => {
    const role = roleFromPath();
    showView("auth");
    selectAuthRole(role, false);
    if (path !== "/login") window.history.replaceState({}, "", loginPathForRole(role));
  };
  try {
    const response = await api<{ user: User | null }>("/api/auth/me");
    if (response.user) showView(response.user.role, response.user);
    else redirectToLogin();
  } catch {
    redirectToLogin();
  }
}

function formObject(form: HTMLFormElement): Record<string, FormDataEntryValue> {
  return Object.fromEntries(new FormData(form).entries());
}

async function submitAccount(form: HTMLFormElement, path: string, extra: Record<string, unknown> = {}) {
  try {
    const userResult = await api<{ user: User }>(path, {
      method: "POST",
      body: JSON.stringify({ ...formObject(form), ...extra }),
    });
    form.reset();
    showNotice("Acesso realizado.");
    showView(userResult.user.role, userResult.user);
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "Não foi possível entrar.", true);
  }
}

byId<HTMLButtonElement>("client-tab").addEventListener("click", () => selectAuthRole("client"));
byId<HTMLButtonElement>("barber-tab").addEventListener("click", () => selectAuthRole("barber"));

byId<HTMLFormElement>("client-login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  void submitAccount(event.currentTarget as HTMLFormElement, "/api/auth/login", { role: "client" });
});
byId<HTMLFormElement>("barber-login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  void submitAccount(event.currentTarget as HTMLFormElement, "/api/auth/login", { role: "barber" });
});
byId<HTMLFormElement>("client-register-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const phone = form.querySelector<HTMLInputElement>("[data-phone]");
  if (phone) phone.value = digitsOnly(phone.value);
  void submitAccount(form, "/api/auth/register-client");
});
byId<HTMLFormElement>("barber-setup-form").addEventListener("submit", (event) => {
  event.preventDefault();
  void submitAccount(event.currentTarget as HTMLFormElement, "/api/auth/setup-barber");
});

byId<HTMLButtonElement>("logout-button").addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", { method: "POST" });
    showView("auth");
    selectAuthRole(selectedAuthRole, false);
    window.history.replaceState({}, "", loginPathForRole(selectedAuthRole));
    showNotice("Você saiu da sua conta.");
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "Não foi possível sair.", true);
  }
});

byId<HTMLFormElement>("client-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = formObject(form);
  const phone = form.querySelector<HTMLInputElement>("[data-phone]");
  try {
    await api<Client>("/api/clients", {
      method: "POST",
      body: JSON.stringify({ ...data, phone: phone ? digitsOnly(phone.value) : "" }),
    });
    form.reset();
    showNotice("Cliente cadastrado.");
    await loadBarberData();
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "Não foi possível salvar o cliente.", true);
  }
});

byId<HTMLFormElement>("service-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = formObject(form);
  const moneyInput = form.querySelector<HTMLInputElement>("[data-money]");
  const priceCents = moneyInput ? Number(digitsOnly(moneyInput.value) || "0") : 0;
  try {
    await api<Service>("/api/services", {
      method: "POST",
      body: JSON.stringify({ name: data.name, priceCents, durationMinutes: Number(data.durationMinutes) }),
    });
    form.reset();
    if (moneyInput) moneyInput.value = moneyInputValue(0);
    showNotice("Serviço cadastrado.");
    await loadBarberData();
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "Não foi possível salvar o serviço.", true);
  }
});

byId<HTMLFormElement>("booking-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = formObject(form);
  const appointmentDate = bookingDateInput.value;
  const appointmentTime = bookingTimeInput.value;
  if (!appointmentDate || !appointmentTime) {
    showNotice("Selecione o dia e um horário disponível.", true);
    return;
  }
  const startAt = `${appointmentDate}T${appointmentTime}`;
  try {
    await api<Appointment>("/api/appointments", {
      method: "POST",
      body: JSON.stringify({ clientId: Number(data.clientId), serviceId: Number(data.serviceId), startAt }),
    });
    dateInput.value = appointmentDate;
    form.reset();
    bookingDateInput.min = localDateTime().slice(0, 10);
    bookingDateInput.value = appointmentDate;
    bookingTimes.replaceChildren();
    bookingTimeInput.value = "";
    showNotice("Agendamento criado. O cliente poderá vê-lo na área dele.");
    await loadBarberData();
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "Não foi possível criar o agendamento.", true);
  }
});

async function updateAppointment(id: number, action: "cancel" | "complete") {
  const message = action === "cancel" ? "Confirma o cancelamento deste horário?" : "Marcar este atendimento como concluído?";
  if (!window.confirm(message)) return;
  try {
    await api(`/api/appointments/${id}/${action}`, { method: "POST" });
    showNotice(action === "cancel" ? "Agendamento cancelado; o horário foi liberado." : "Atendimento concluído.");
    await loadBarberData();
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "Não foi possível atualizar o agendamento.", true);
  }
}

dateInput.addEventListener("change", () => { void loadBarberData(); });
bookingDateInput.addEventListener("change", () => { void loadAvailableTimes(); });
byId<HTMLSelectElement>("booking-service").addEventListener("change", () => {
  updateBookingSummary();
  void loadAvailableTimes();
});
byId<HTMLButtonElement>("open-booking").addEventListener("click", () => {
  byId("booking-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  byId<HTMLSelectElement>("booking-client").focus({ preventScroll: true });
});

document.querySelectorAll<HTMLInputElement>("[data-phone]").forEach((input) => {
  input.addEventListener("input", () => {
    const formatted = formatPhone(input.value);
    input.value = formatted;
    input.setSelectionRange(formatted.length, formatted.length);
  });
});

document.querySelectorAll<HTMLInputElement>("[data-money]").forEach((input) => {
  input.value = moneyInputValue(0);
  input.addEventListener("input", () => {
    const cents = Number(digitsOnly(input.value) || "0");
    input.value = moneyInputValue(cents);
    input.setSelectionRange(input.value.length, input.value.length);
  });
});

dateInput.value = localDateTime().slice(0, 10);
bookingDateInput.min = localDateTime().slice(0, 10);
bookingDateInput.value = localDateTime().slice(0, 10);
window.addEventListener("popstate", () => { void loadSession(); });
byId("client-email-label").textContent = "";
void loadSession();
