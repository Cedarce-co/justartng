import { NextResponse } from "next/server";
import { getEvent } from "@/lib/content";
import { RegistrationError, StorageError, saveRegistration } from "@/lib/db";
import { sendConfirmation } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { registerRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!rateLimit(`register:${clientIp(request)}`)) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = registerRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ ok: false, error: "Please check the form.", fieldErrors }, { status: 400 });
  }

  if (parsed.data.company.trim()) {
    return NextResponse.json({ ok: true, emailSent: false, calendarUrl: null });
  }

  const event = getEvent(parsed.data.eventSlug);
  if (!event) return NextResponse.json({ ok: false, error: "That event could not be found." }, { status: 404 });
  if (!event.registrationOpen) {
    return NextResponse.json({ ok: false, error: "Registration for this event is closed." }, { status: 403 });
  }

  const calendarUrl = event.startsAt ? `/api/events/${event.slug}/ics` : null;

  try {
    await saveRegistration({
      eventSlug: event.slug,
      fullName: parsed.data.fullName,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone || null,
      guests: parsed.data.guests,
      heardAbout: parsed.data.heardAbout || null,
      accessibility: parsed.data.accessibility || null,
      capacity: event.capacity,
    });
  } catch (error) {
    if (error instanceof RegistrationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof StorageError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: "We couldn't save your registration. Please try again." }, { status: 500 });
  }

  const emailSent = await sendConfirmation({
    to: parsed.data.email.toLowerCase(),
    name: parsed.data.fullName,
    event,
    guests: parsed.data.guests,
    calendarUrl: calendarUrl ? new URL(calendarUrl, request.url).toString() : null,
  });

  return NextResponse.json({ ok: true, emailSent, calendarUrl }, { status: 201 });
}
