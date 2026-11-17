import { NextResponse } from "next/server";
import { getEvent } from "@/lib/content";
import { eventToIcs } from "@/lib/ics";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const event = getEvent(slug);
  const ics = event ? eventToIcs(event) : null;
  if (!ics) return NextResponse.json({ ok: false, error: "This event has no date yet." }, { status: 404 });
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
    },
  });
}
