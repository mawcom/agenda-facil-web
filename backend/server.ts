import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";
import { AppError } from "./errors";
import { barberSetupRequired, currentUser, login, logout, registerClient, requireRole, setupBarber } from "./auth-service";
import {
  availableAppointmentTimes,
  changeAppointmentStatus,
  createAppointment,
  createClient,
  createService,
  listAppointments,
  listClientAppointments,
  listClients,
  listServices,
  parseId,
} from "./agenda-service";
import {
  parseAppointment,
  parseAppointmentDate,
  parseBarberSetup,
  parseClient,
  parseClientRegistration,
  parseLogin,
  parseService,
} from "./validators";

const port = Number(process.env.PORT ?? 3000);
const projectRoot = resolve(__dirname, "../..");
const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) throw new AppError("A solicitação é muito grande.", 413);
    chunks.push(Buffer.from(chunk));
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AppError("O corpo da solicitação não contém JSON válido.");
  }
}

function sendJson(response: ServerResponse, status: number, data: unknown) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

async function serveStatic(pathname: string, response: ServerResponse) {
  const file = pathname === "/" ? "index.html" : pathname.slice(1);
  const baseDir = file === "client.js" ? resolve(projectRoot, "dist/frontend") : resolve(projectRoot, "frontend");
  const filePath = resolve(baseDir, file === "client.js" ? "client.js" : file);
  const relativePath = relative(baseDir, filePath);
  if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || relativePath.startsWith(sep)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const contents = await readFile(filePath);
    response.writeHead(200, { "content-type": contentTypes[extname(filePath)] ?? "application/octet-stream" });
    response.end(contents);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Arquivo não encontrado.");
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const method = request.method ?? "GET";
  try {
    if (url.pathname === "/api/auth/setup-status" && method === "GET") {
      return sendJson(response, 200, { barberSetupRequired: barberSetupRequired() });
    }
    if (url.pathname === "/api/auth/setup-barber" && method === "POST") {
      const user = setupBarber(parseBarberSetup(await readJson(request)), response);
      return sendJson(response, 201, { user });
    }
    if (url.pathname === "/api/auth/register-client" && method === "POST") {
      const user = registerClient(parseClientRegistration(await readJson(request)), response);
      return sendJson(response, 201, { user });
    }
    if (url.pathname === "/api/auth/login" && method === "POST") {
      const user = login(parseLogin(await readJson(request)), response);
      return sendJson(response, 200, { user });
    }
    if (url.pathname === "/api/auth/me" && method === "GET") {
      return sendJson(response, 200, { user: currentUser(request) });
    }
    if (url.pathname === "/api/auth/logout" && method === "POST") {
      logout(request, response);
      return sendJson(response, 200, { message: "Sessão encerrada." });
    }
    if (url.pathname === "/api/clients" && method === "GET") {
      requireRole(request, "barber");
      return sendJson(response, 200, listClients());
    }
    if (url.pathname === "/api/clients" && method === "POST") {
      requireRole(request, "barber");
      return sendJson(response, 201, createClient(parseClient(await readJson(request))));
    }
    if (url.pathname === "/api/services" && method === "GET") {
      requireRole(request, "barber");
      return sendJson(response, 200, listServices());
    }
    if (url.pathname === "/api/services" && method === "POST") {
      requireRole(request, "barber");
      return sendJson(response, 201, createService(parseService(await readJson(request))));
    }
    if (url.pathname === "/api/client/appointments" && method === "GET") {
      const user = requireRole(request, "client");
      if (!user.clientId) throw new AppError("Essa conta não está ligada a um cadastro de cliente.", 403);
      return sendJson(response, 200, listClientAppointments(user.clientId));
    }
    if (url.pathname === "/api/appointments" && method === "GET") {
      requireRole(request, "barber");
      return sendJson(response, 200, listAppointments(parseAppointmentDate(url.searchParams.get("date") ?? undefined)));
    }
    if (url.pathname === "/api/appointments/available-times" && method === "GET") {
      requireRole(request, "barber");
      const date = parseAppointmentDate(url.searchParams.get("date") ?? undefined);
      const serviceId = parseId(url.searchParams.get("serviceId") ?? undefined);
      return sendJson(response, 200, { times: availableAppointmentTimes(date, serviceId) });
    }
    if (url.pathname === "/api/appointments" && method === "POST") {
      requireRole(request, "barber");
      return sendJson(response, 201, createAppointment(parseAppointment(await readJson(request))));
    }
    const statusMatch = url.pathname.match(/^\/api\/appointments\/(\d+)\/(cancel|complete)$/);
    if (statusMatch && method === "POST") {
      requireRole(request, "barber");
      changeAppointmentStatus(parseId(statusMatch[1]), statusMatch[2] === "cancel" ? "cancelled" : "completed");
      return sendJson(response, 200, { message: "Status do agendamento atualizado." });
    }
    if (url.pathname.startsWith("/api/")) return sendJson(response, 404, { error: "Rota da API não encontrada." });
    const route = decodeURIComponent(url.pathname).replace(/\/+$/, "") || "/";
    if (["/", "/login", "/cliente", "/barbeiro"].includes(route)) {
      return await serveStatic("/", response);
    }
    return await serveStatic(route, response);
  } catch (error) {
    const status = error instanceof AppError ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    if (status >= 500) console.error(error);
    return sendJson(response, status, { error: status === 500 ? "Erro interno. Tente novamente." : message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Agenda Fácil disponível em http://localhost:${port}`);
});

function stop() {
  server.close(() => process.exit(0));
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
