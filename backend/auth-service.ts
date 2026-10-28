import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { AppError } from "./errors";
import { database } from "./database";
import type { SessionUser, UserRole } from "./types";

const sessionCookie = "agenda_session";
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;

export interface AccountInput {
  email: string;
  password: string;
}

export interface ClientAccountInput extends AccountInput {
  name: string;
  phone: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function sessionDigest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions(maxAge: number): string {
  return `${sessionCookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

function issueSession(userId: number, response: ServerResponse) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + sessionLifetimeMs;
  database.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(sessionDigest(token), userId, expiresAt);
  response.setHeader("Set-Cookie", `${sessionCookie}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(sessionLifetimeMs / 1000)}`);
}

function userForId(userId: number): SessionUser {
  const user = database.prepare("SELECT id, email, role, client_id AS clientId FROM users WHERE id = ?")
    .get(userId) as SessionUser | undefined;
  if (!user) throw new AppError("A conta não foi encontrada.", 404);
  return user;
}

function validateAccount(input: AccountInput) {
  const email = normalizeEmail(input.email);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError("Informe um e-mail válido.");
  }
  if (typeof input.password !== "string" || input.password.length < 5 || input.password.length > 200) {
    throw new AppError("A senha precisa ter de 5 a 200 caracteres.");
  }
  return { email, password: input.password };
}

export function barberSetupRequired(): boolean {
  return Number((database.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'barber'").get() as { count: number }).count) === 0;
}

export function setupBarber(input: AccountInput, response: ServerResponse): SessionUser {
  const account = validateAccount(input);
  database.exec("BEGIN IMMEDIATE");
  try {
    if (!barberSetupRequired()) throw new AppError("A conta do barbeiro já foi configurada.", 409);
    const result = database.prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'barber')")
      .run(account.email, hashPassword(account.password));
    database.exec("COMMIT");
    issueSession(Number(result.lastInsertRowid), response);
    return userForId(Number(result.lastInsertRowid));
  } catch (error) {
    database.exec("ROLLBACK");
    if (String(error).includes("UNIQUE constraint failed")) throw new AppError("Este e-mail já está em uso.", 409);
    throw error;
  }
}

export function registerClient(input: ClientAccountInput, response: ServerResponse): SessionUser {
  const account = validateAccount(input);
  database.exec("BEGIN IMMEDIATE");
  try {
    const existingUser = database.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE").get(account.email);
    if (existingUser) throw new AppError("Já existe uma conta com esse e-mail.", 409);

    let client = database.prepare("SELECT id, phone FROM clients WHERE email = ? COLLATE NOCASE").get(account.email) as
      | { id: number; phone: string }
      | undefined;
    if (client && client.phone.replace(/\D/g, "") !== input.phone) {
      throw new AppError("Não foi possível associar esse cadastro. Confira o telefone com a barbearia.", 409);
    }
    if (!client) {
      const created = database.prepare("INSERT INTO clients (name, phone, email) VALUES (?, ?, ?)")
        .run(input.name, input.phone, account.email);
      client = { id: Number(created.lastInsertRowid), phone: input.phone };
    }

    const result = database.prepare("INSERT INTO users (email, password_hash, role, client_id) VALUES (?, ?, 'client', ?)")
      .run(account.email, hashPassword(account.password), client.id);
    database.exec("COMMIT");
    issueSession(Number(result.lastInsertRowid), response);
    return userForId(Number(result.lastInsertRowid));
  } catch (error) {
    database.exec("ROLLBACK");
    if (String(error).includes("UNIQUE constraint failed")) throw new AppError("Esse e-mail ou cliente já possui uma conta.", 409);
    throw error;
  }
}

export function login(input: AccountInput & { role: UserRole }, response: ServerResponse): SessionUser {
  const account = validateAccount(input);
  const row = database.prepare("SELECT id, password_hash, role FROM users WHERE email = ? COLLATE NOCASE")
    .get(account.email) as { id: number; password_hash: string; role: UserRole } | undefined;
  if (!row || row.role !== input.role || !verifyPassword(account.password, row.password_hash)) {
    throw new AppError("E-mail ou senha incorretos.", 401);
  }
  issueSession(row.id, response);
  return userForId(row.id);
}

export function currentUser(request: IncomingMessage): SessionUser | null {
  const cookieHeader = request.headers.cookie ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${sessionCookie}=([A-Za-z0-9_-]{40,})`));
  if (!match) return null;
  const digest = sessionDigest(match[1]);
  const session = database.prepare(`
    SELECT u.id, u.email, u.role, u.client_id AS clientId, s.expires_at AS expiresAt
    FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?
  `).get(digest) as (SessionUser & { expiresAt: number }) | undefined;
  if (!session || session.expiresAt <= Date.now()) {
    if (session) database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(digest);
    return null;
  }
  return { id: session.id, email: session.email, role: session.role, clientId: session.clientId };
}

export function requireRole(request: IncomingMessage, role: UserRole): SessionUser {
  const user = currentUser(request);
  if (!user) throw new AppError("Entre na sua conta para continuar.", 401);
  if (user.role !== role) throw new AppError("Sua conta não tem acesso a esta área.", 403);
  return user;
}

export function logout(request: IncomingMessage, response: ServerResponse) {
  const user = currentUser(request);
  if (user) {
    const token = request.headers.cookie?.match(new RegExp(`(?:^|;\\s*)${sessionCookie}=([A-Za-z0-9_-]{40,})`))?.[1];
    if (token) database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sessionDigest(token));
  }
  response.setHeader("Set-Cookie", cookieOptions(0));
}
