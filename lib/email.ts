import { Resend } from "resend";
import type { GalleryEvent } from "@/lib/content";
import { formatWhen, publicText } from "@/lib/format";

export async function sendConfirmation(options: {
  to: string;
  name: string;
  event: GalleryEvent;
  guests: number;
  calendarUrl: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;

  const venue = publicText(options.event.venue);
  const address = publicText(options.event.address);
  const lines = [
    `Hello ${options.name},`,
    "",
    `You are registered for ${options.event.title}.`,
    `Guests, including you: ${options.guests}`,
    formatWhen(options.event),
    venue ? `Venue: ${venue}` : "",
    address ?? "",
    options.calendarUrl ? `Add to calendar: ${options.calendarUrl}` : "",
    "",
    "We use these details only to manage your place at the event.",
  ].filter((line) => line !== "");

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: options.to,
      subject: `Registration confirmed: ${options.event.title}`,
      text: lines.join("\n"),
    });
    return !result.error;
  } catch {
    return false;
  }
}
