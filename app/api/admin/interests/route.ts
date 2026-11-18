import { NextResponse } from "next/server";
import { isAdminCookie } from "@/lib/admin";
import { listInterests } from "@/lib/interests";

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** Collector interests from the 3D studio, as a CSV download for signed-in admins. */
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

  const rows = await listInterests();
  const header = ["createdAt", "painting", "room", "fullName", "phone", "payment", "address", "delivery"];
  const lines = [
    header.join(","),
    ...rows.map((row) => [row.createdAt, row.workTitle, row.room, row.fullName, row.phone, row.payment, row.address, row.delivery].map(csvCell).join(",")),
  ];
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=collector-interests.csv",
    },
  });
}
