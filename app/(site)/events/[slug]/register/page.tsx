import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RegisterForm } from "@/components/RegisterForm";
import { getEvent } from "@/lib/content";
import { countGuests } from "@/lib/db";
import { formatWhen } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Register",
  description: "Register for a gathering around Anticipate Hues that Heal 2.0.",
};

export default async function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
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
  const maxGuests = remaining == null ? 5 : Math.min(5, remaining);

  return (
    <div className="mx-auto max-w-xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-sm font-semibold text-accent">
        <Link href={`/events/${event.slug}`} className="underline-offset-4 hover:underline">
          {event.title}
        </Link>
      </p>
      <h1 className="mt-3 text-4xl">Register</h1>
      <p className="mt-3 text-muted">{formatWhen(event)}</p>
      {remaining != null && <p className="mt-2 text-sm text-muted">{remaining} {remaining === 1 ? "space" : "spaces"} left.</p>}

      {!event.registrationOpen || full || maxGuests < 1 ? (
        <p className="mt-8 border border-line bg-paper p-5" role="status">
          {full ? "This event is full." : "Registration is not open yet."}{" "}
          <Link href={`/events/${event.slug}`} className="text-accent underline-offset-4 hover:underline">
            Back to the event
          </Link>
        </p>
      ) : (
        <>
          <p className="mt-6 leading-relaxed text-muted">
            We ask for your name, email, and how many people are coming. Phone, how you heard about the event, and access needs are optional. We use this only to hold your place and send a confirmation. We do not sell it.
          </p>
          <div className="mt-8">
            <RegisterForm eventSlug={event.slug} maxGuests={maxGuests} />
          </div>
        </>
      )}
    </div>
  );
}
