import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { sharedConnection } from "@/lib/db";

/**
 * Collector interest: a visitor in the 3D studio asked to collect (buy) a painting
 * and gave their details to the studio guide. Stored like registrations: in Postgres
 * when DATABASE_URL is set, otherwise in data/collector-interests.json on this machine.
 */
export type CollectorInterest = {
  id: string;
  workSlug: string;
  workTitle: string;
  room: string;
  fullName: string;
  phone: string;
  payment: string;
  address: string;
  delivery: string;
  createdAt: string;
};

export type NewCollectorInterest = Omit<CollectorInterest, "id" | "createdAt">;

export class InterestStorageError extends Error {
  constructor() {
    super("Collector interests need a DATABASE_URL on this server.");
    this.name = "InterestStorageError";
  }
}

let schema: Promise<void> | null = null;

async function database() {
  const db = sharedConnection();
  if (!db) return null;
  if (!schema) {
    schema = db`
      create table if not exists collector_interests (
        id text primary key,
        work_slug text not null,
        work_title text not null,
        room text not null,
        full_name text not null,
        phone text not null,
        payment text not null,
        address text not null,
        delivery text not null,
        created_at timestamptz not null default now()
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

const filePath = path.join(process.cwd(), "data", "collector-interests.json");
let queue: Promise<unknown> = Promise.resolve();

function locked<T>(task: () => Promise<T>) {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readFileStore() {
  try {
    const parsed = JSON.parse(await readFile(filePath, "utf8")) as CollectorInterest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

function mapRow(row: Record<string, unknown>): CollectorInterest {
  const created = row.created_at;
  return {
    id: String(row.id),
    workSlug: String(row.work_slug),
    workTitle: String(row.work_title),
    room: String(row.room),
    fullName: String(row.full_name),
    phone: String(row.phone),
    payment: String(row.payment),
    address: String(row.address),
    delivery: String(row.delivery),
    createdAt: created instanceof Date ? created.toISOString() : String(created),
  };
}

export async function saveInterest(input: NewCollectorInterest): Promise<CollectorInterest> {
  const db = await database();
  if (!db) return locked(() => saveToFile(input));
  const rows = await db<Record<string, unknown>[]>`
    insert into collector_interests (id, work_slug, work_title, room, full_name, phone, payment, address, delivery)
    values (${randomUUID()}, ${input.workSlug}, ${input.workTitle}, ${input.room}, ${input.fullName}, ${input.phone}, ${input.payment}, ${input.address}, ${input.delivery})
    returning id, work_slug, work_title, room, full_name, phone, payment, address, delivery, created_at
  `;
  return mapRow(rows[0]);
}

export async function listInterests() {
  const db = await database();
  if (!db) {
    const rows = await readFileStore();
    return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const rows = await db<Record<string, unknown>[]>`
    select id, work_slug, work_title, room, full_name, phone, payment, address, delivery, created_at
    from collector_interests
    order by created_at desc
  `;
  return rows.map((row) => mapRow(row));
}

async function saveToFile(input: NewCollectorInterest) {
  const existing = await readFileStore();
  const interest: CollectorInterest = { id: randomUUID(), ...input, createdAt: new Date().toISOString() };
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify([interest, ...existing], null, 2));
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "EROFS" || code === "EPERM" || code === "EACCES") throw new InterestStorageError();
    throw error;
  }
  return interest;
}
