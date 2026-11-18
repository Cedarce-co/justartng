import { Resend } from "resend";
import type { GalleryEvent } from "@/lib/content";
import { formatWhen, publicText } from "@/lib/format";
import type { CollectorInterest } from "@/lib/interests";

/** Tells the artist's team that a visitor wants to collect a painting. Needs COLLECT_NOTIFY_EMAIL. */
export async function sendCollectorAlert(interest: CollectorInterest) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.COLLECT_NOTIFY_EMAIL;
  if (!apiKey || !from || !to) return false;

  const lines = [
    `${interest.fullName} would like to collect “${interest.workTitle}”.`,
    "",
    `WhatsApp / phone: ${interest.phone}`,
    `Payment: ${interest.payment}`,
    `Deliver to: ${interest.address}`,
    `Delivery: ${interest.delivery}`,
    `Room: ${interest.room}`,
    "",
    `Sent from the 3D studio on ${new Date(interest.createdAt).toUTCString()}.`,
  ];

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to,
      subject: `Collector interest: ${interest.workTitle}`,
      text: lines.join("\n"),
    });
    return !result.error;
  } catch {
    return false;
  }
}

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
