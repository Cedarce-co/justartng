import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { events, getEvent } from "@/lib/content";
import { countGuests } from "@/lib/db";
import { formatWhen, publicText, safeHttpUrl } from "@/lib/format";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return events.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return { title: "Event" };
  const description = publicText(event.description) ?? "Gathering details are still being confirmed.";
  return { title: event.title, description };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  let used = 0;
  try {
    used = await countGuests(event.slug);
  } catch {
    used = 0;
  }
  const remaining = event.capacity > 0 ? Math.max(0, event.capacity - used) : null;
  const full = remaining === 0;
  const venue = publicText(event.venue);
  const address = publicText(event.address);
  const description = publicText(event.description);
  const map = safeHttpUrl(event.mapUrl);
  const jsonLd = event.startsAt
    ? {
        "@context": "https://schema.org",
        "@type": "Event",
        name: event.title,
        startDate: event.startsAt,
        endDate: event.endsAt || event.startsAt,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        description: description ?? event.title,
        location: {
          "@type": "Place",
          name: venue ?? "Venue to be announced",
          address: address ?? undefined,
        },
        organizer: { "@type": "Person", name: "Olalekan Isiaka" },
      }
    : null;

  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Event</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">{event.title}</h1>
      <dl className="mt-8 grid gap-3">
        <div>
          <dt className="text-sm text-muted">When</dt>
          <dd className="text-lg">{formatWhen(event)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Venue</dt>
          <dd className="text-lg">{venue ?? "Venue to be announced"}</dd>
        </div>
        {address && (
          <div>
            <dt className="text-sm text-muted">Address</dt>
            <dd>{address}</dd>
          </div>
        )}
      </dl>
      {map && (
        <a className="mt-4 inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline" href={map} target="_blank" rel="noopener noreferrer">
          Open a map
        </a>
      )}
      <p className="mt-8 max-w-2xl text-lg leading-relaxed">{description ?? "Details for this gathering are still being confirmed."}</p>
      {remaining != null && (
        <p className="mt-6 text-sm text-muted">
          {remaining === 0 ? "No spaces left." : `${remaining} ${remaining === 1 ? "space" : "spaces"} left.`}
        </p>
      )}
      {event.registrationOpen && !full ? (
        <Link href={`/events/${event.slug}/register`} className="mt-8 inline-flex min-h-11 items-center rounded-md bg-accent px-5 text-on">
          Register
        </Link>
      ) : (
        <p className="mt-8 text-muted">{full ? "Registration is full." : "Registration is not open yet."}</p>
      )}
    </article>
  );
}
