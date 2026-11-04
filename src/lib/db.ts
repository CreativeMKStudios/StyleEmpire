import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

let db: DatabaseSync | undefined;

function databaseFile(): string {
  return process.env.BOOKINGS_DB || path.join(process.cwd(), "data", "bookings.sqlite");
}

export function getDb(): DatabaseSync {
  if (!db) {
    const file = databaseFile();
    if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
    db = new DatabaseSync(file);
    db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        service_id TEXT NOT NULL,
        service_name TEXT NOT NULL,
        start_ms INTEGER NOT NULL,
        end_ms INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        notes TEXT NOT NULL,
        payment_choice TEXT NOT NULL,
        payment_status TEXT NOT NULL,
        status TEXT NOT NULL,
        amount_pence INTEGER,
        stripe_session_id TEXT,
        emailed_at TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }
  return db;
}

export function resetDatabaseForTests(): void {
  db?.close();
  db = undefined;
}
