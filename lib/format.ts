export function isPlaceholder(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 || trimmed === "TODO" || trimmed.startsWith("TODO:");
}

export function publicText(value: string) {
  return isPlaceholder(value) ? null : value.trim();
}

const whenFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Lagos",
  timeZoneName: "short",
});

export function formatWhen(event: { startsAt: string; endsAt: string }) {
  const start = Date.parse(event.startsAt);
  if (Number.isNaN(start)) return "Date and time to be announced";
  const startText = whenFormat.format(new Date(start));
  const end = Date.parse(event.endsAt);
  if (Number.isNaN(end)) return startText;
  return `${startText} to ${whenFormat.format(new Date(end))}`;
}

export function safeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    return null;
  }
  return null;
}

export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  // Netlify sets URL to the site's main address during its builds.
  if (process.env.URL) return process.env.URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
