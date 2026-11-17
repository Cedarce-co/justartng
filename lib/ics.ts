import type { GalleryEvent } from "@/lib/content";
import { isPlaceholder } from "@/lib/format";

function stamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function clean(value: string) {
  return isPlaceholder(value) ? "" : value.trim();
}

export function eventToIcs(event: GalleryEvent) {
  const start = new Date(event.startsAt);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(event.endsAt);
  const endDate = Number.isNaN(end.getTime()) ? new Date(start.getTime() + 2 * 60 * 60 * 1000) : end;
  const location = [clean(event.venue), clean(event.address)].filter(Boolean).join(", ");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Anticipate Hues that Heal//Visual Studio//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.slug}@anticipate-hues`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(endDate)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(clean(event.description))}`,
    `LOCATION:${escapeIcs(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ];
  return lines.join("\r\n");
}
