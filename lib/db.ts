import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import postgres from "postgres";

export type Registration = {
  id: string;
  eventSlug: string;
  fullName: string;
  email: string;
  phone: string | null;
  guests: number;
  heardAbout: string | null;
  accessibility: string | null;
  createdAt: string;
};

export type NewRegistration = {
  eventSlug: string;
  fullName: string;
  email: string;
  phone: string | null;
  guests: number;
  heardAbout: string | null;
  accessibility: string | null;
  capacity: number;
};

export class RegistrationError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "RegistrationError";
    this.status = status;
  }
}

export class StorageError extends Error {
  constructor() {
    super("Registrations need a DATABASE_URL on this server.");
    this.name = "StorageError";
  }
}

type Sql = ReturnType<typeof postgres>;

let client: Sql | null = null;
let schema: Promise<void> | null = null;

function pg() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!client) {
    const ssl = url.includes("sslmode=")
      ? undefined
      : /localhost|127\.0\.0\.1/.test(url)
        ? false
        : ("require" as const);
    client = postgres(url, { max: 1, ...(ssl === undefined ? {} : { ssl }) });
  }
  return client;
}

async function database() {
  const db = pg();
  if (!db) return null;
  if (!schema) {
    schema = db`
      create table if not exists registrations (
        id text primary key,
        event_slug text not null,
        full_name text not null,
        email text not null,
        phone text,
        guests integer not null,
        heard_about text,
        accessibility text,
        created_at timestamptz not null default now(),
        unique (event_slug, email)
      )
    `
      .then(() => undefined)
      .catch((error: unknown) => {
        schema = null;
        throw error;
      });
  }
  await schema;
  return db;
}

const filePath = path.join(process.cwd(), "data", "registrations.json");
let queue: Promise<unknown> = Promise.resolve();

function locked<T>(task: () => Promise<T>) {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function mapRow(row: Record<string, unknown>): Registration {
  const created = row.created_at;
  return {
    id: String(row.id),
    eventSlug: String(row.event_slug),
    fullName: String(row.full_name),
    email: String(row.email),
    phone: row.phone ? String(row.phone) : null,
    guests: Number(row.guests),
    heardAbout: row.heard_about ? String(row.heard_about) : null,
    accessibility: row.accessibility ? String(row.accessibility) : null,
    createdAt: created instanceof Date ? created.toISOString() : String(created),
  };
}

async function readFileStore() {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Registration[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

function assertCapacity(existing: { email: string; guests: number }[], input: NewRegistration) {
  if (existing.some((row) => row.email === input.email)) {
    throw new RegistrationError("This email is already registered for the event.", 409);
  }
  if (input.capacity > 0) {
    const used = existing.reduce((sum, row) => sum + row.guests, 0);
    const left = Math.max(0, input.capacity - used);
    if (used + input.guests > input.capacity) {
      throw new RegistrationError(
        left === 0 ? "This event is full." : `Only ${left} ${left === 1 ? "space is" : "spaces are"} left.`,
        409,
      );
    }
  }
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export async function countGuests(eventSlug: string) {
  const db = await database();
  if (!db) {
    const rows = await readFileStore();
    return rows.filter((row) => row.eventSlug === eventSlug).reduce((sum, row) => sum + row.guests, 0);
  }
  const rows = await db<{ total: number }[]>`
    select coalesce(sum(guests), 0) as total from registrations where event_slug = ${eventSlug}
  `;
  return Number(rows[0]?.total ?? 0);
}

export async function listRegistrations() {
  const db = await database();
  if (!db) {
    const rows = await readFileStore();
    return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const rows = await db<Record<string, unknown>[]>`
    select id, event_slug, full_name, email, phone, guests, heard_about, accessibility, created_at
    from registrations
    order by created_at desc
  `;
  return rows.map((row) => mapRow(row));
}

export async function saveRegistration(input: NewRegistration) {
  const db = await database();
  if (!db) return locked(() => saveToFile(input));
  try {
    return await db.begin(async (tx) => {
      const existing = await tx<{ email: string; guests: number }[]>`
        select email, guests from registrations where event_slug = ${input.eventSlug}
      `;
      assertCapacity(existing, input);
      const id = randomUUID();
      const rows = await tx<Record<string, unknown>[]>`
        insert into registrations (id, event_slug, full_name, email, phone, guests, heard_about, accessibility)
        values (
          ${id},
          ${input.eventSlug},
          ${input.fullName},
          ${input.email},
          ${input.phone},
          ${input.guests},
          ${input.heardAbout},
          ${input.accessibility}
        )
        returning id, event_slug, full_name, email, phone, guests, heard_about, accessibility, created_at
      `;
      return mapRow(rows[0]);
    });
  } catch (error) {
    if (error instanceof RegistrationError) throw error;
    if (isUniqueViolation(error)) {
      throw new RegistrationError("This email is already registered for the event.", 409);
    }
    throw error;
  }
}

async function saveToFile(input: NewRegistration) {
  const existing = await readFileStore();
  const forEvent = existing.filter((row) => row.eventSlug === input.eventSlug);
  assertCapacity(forEvent, input);
  const registration: Registration = {
    id: randomUUID(),
    eventSlug: input.eventSlug,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    guests: input.guests,
    heardAbout: input.heardAbout,
    accessibility: input.accessibility,
    createdAt: new Date().toISOString(),
  };
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify([registration, ...existing], null, 2));
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "EROFS" || code === "EPERM" || code === "EACCES") throw new StorageError();
    throw error;
  }
  return registration;
}
