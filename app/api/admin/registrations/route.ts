import { NextResponse } from "next/server";
import { isAdminCookie } from "@/lib/admin";
import { listRegistrations } from "@/lib/db";

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("admin_session="))
    ?.slice("admin_session=".length);
  if (!isAdminCookie(token ? decodeURIComponent(token) : undefined)) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  const rows = await listRegistrations();
  const header = ["createdAt", "event", "fullName", "email", "phone", "guests", "heardAbout", "accessibility"];
  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [row.createdAt, row.eventSlug, row.fullName, row.email, row.phone ?? "", String(row.guests), row.heardAbout ?? "", row.accessibility ?? ""]
        .map(csvCell)
        .join(","),
    ),
  ];
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=registrations.csv",
    },
  });
}
