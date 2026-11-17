import type { Metadata } from "next";
import Link from "next/link";
import { splitEvents } from "@/lib/content";
import { formatWhen, publicText } from "@/lib/format";

export const metadata: Metadata = {
  title: "Events",
  description: "Gatherings around Anticipate Hues that Heal 2.0.",
};

export default function EventsPage() {
  const { upcoming, past } = splitEvents();
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="text-4xl sm:text-5xl">Events</h1>
      <section className="mt-10">
        <h2 className="text-2xl">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="mt-4 text-muted">No upcoming events.</p>
        ) : (
          <ul className="mt-6 grid gap-4">
            {upcoming.map((event) => (
              <li key={event.slug}>
                <EventRow event={event} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-12">
        <h2 className="text-2xl">Past</h2>
        {past.length === 0 ? (
          <p className="mt-4 text-muted">No past events yet.</p>
        ) : (
          <ul className="mt-6 grid gap-4">
            {past.map((event) => (
              <li key={event.slug}>
                <EventRow event={event} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EventRow({ event }: { event: ReturnType<typeof splitEvents>["upcoming"][number] }) {
  const venue = publicText(event.venue);
  return (
    <article className="border border-line bg-paper p-5">
      <h3 className="text-2xl">
        <Link href={`/events/${event.slug}`} className="hover:text-accent">
          {event.title}
        </Link>
      </h3>
      <p className="mt-2 text-muted">{formatWhen(event)}</p>
      {venue && <p className="mt-1">{venue}</p>}
      <p className="mt-3 text-sm text-muted">{event.registrationOpen ? "Registration is open" : "Registration is closed"}</p>
    </article>
  );
}
