import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const databasePath = resolve(process.env.DATABASE_PATH ?? "database/agenda-facil.sqlite");
mkdirSync(dirname(databasePath), { recursive: true });

export const database = new DatabaseSync(databasePath);
database.exec("PRAGMA foreign_keys = ON;");
database.exec("PRAGMA journal_mode = WAL;");

database.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    service_id INTEGER NOT NULL REFERENCES services(id),
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    service_name TEXT NOT NULL,
    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    status TEXT NOT NULL DEFAULT 'scheduled'
      CHECK (status IN ('scheduled', 'cancelled', 'completed'))
  );

  CREATE INDEX IF NOT EXISTS appointments_by_start ON appointments(start_at);
`);

const clientColumns = database.prepare("PRAGMA table_info(clients)").all() as Array<{ name: string }>;
if (!clientColumns.some((column) => column.name === "email")) {
  database.exec("ALTER TABLE clients ADD COLUMN email TEXT;");
}

database.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS clients_email_unique
    ON clients(email) WHERE email IS NOT NULL AND email <> '';

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('barber', 'client')),
    client_id INTEGER UNIQUE REFERENCES clients(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK ((role = 'barber' AND client_id IS NULL) OR (role = 'client' AND client_id IS NOT NULL))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS sessions_expiration ON sessions(expires_at);
`);

database.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
