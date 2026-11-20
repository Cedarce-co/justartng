import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkWriteup } from "@/components/WorkWriteup";
import { buyLabel, getWork, isSold, isStudioOpen, neighbors, roomsFor, site, studioHref, works, workMeta } from "@/lib/content";
import { InteractiveImage } from "@/components/InteractiveImage";

// Re-check every few minutes, so the works appear on the opening day.
export const revalidate = 300;

export function generateStaticParams() {
  return works.map((work) => ({ slug: work.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const work = getWork(slug);
  if (!work) return { title: "Work" };
  return {
    title: work.title,
    description: work.writeup.slice(0, 160),
    openGraph: { images: [work.image] },
  };
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  // The collection is shown from the opening day, with the studio. Until then, the home page announces it.
  if (!isStudioOpen()) redirect("/#studio");
  const { slug } = await params;
  const work = getWork(slug);
  if (!work) notFound();
  const { previous, next } = neighbors(work.slug);
  const meta = workMeta(work);
  const workRooms = roomsFor(work.slug);
  const roomNames = workRooms.map((room) => room.name).join(", ");
  const details = [
    ["Artist", work.artist],
    ["Year", work.year],
    ["Medium", work.medium],
    ["Size", work.size],
    [workRooms.length > 1 ? "Rooms" : "Room", roomNames],
  ].filter(([, value]) => Boolean(value));

  return (
    <article className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:py-16">
      <InteractiveImage pop={1.08} tilt={8} className="self-start">
        <Image
          src={work.image}
          alt={work.alt}
          width={work.imageWidth}
          height={work.imageHeight}
          priority
          sizes="(min-width: 1024px) 56vw, 100vw"
          className="h-auto w-full bg-paper"
        />
      </InteractiveImage>
      <div>
        <p className="text-sm font-semibold text-accent">{roomNames}</p>
        <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">{work.title}</h1>
        <dl className="mt-6 grid gap-2 text-sm">
          {details.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[7rem_1fr] gap-3">
              <dt className="text-muted">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {meta && <p className="sr-only">{meta}</p>}
        <WorkWriteup text={work.writeup} className="mt-6" />
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {/* Buy the original while it's available; once sold, prints. Both open the same short form. */}
          <a
            href={site.interestForm}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-on"
          >
            {buyLabel(work)} &rarr;<span className="sr-only"> (opens a form in a new tab)</span>
          </a>
          <Link
            href={workRooms[0] ? studioHref(workRooms[0], work.slug) : `/visual-studio?work=${work.slug}`}
            className="inline-flex min-h-11 items-center rounded-md border border-line px-4"
          >
            View in the visual studio
          </Link>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
          <span className={`size-2 rounded-full ${isSold(work) ? "bg-[#e5484d]" : "bg-[#3dd68c]"}`} aria-hidden="true" />
          {isSold(work) ? "The original has found a home; prints are available." : "The original is available."}
        </p>
        {previous && next && (
          <nav aria-label="More works" className="mt-10 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
            <Link href={`/works/${previous.slug}`} className="text-accent underline-offset-4 hover:underline">
              Previous: {previous.title}
            </Link>
            <Link href={`/works/${next.slug}`} className="text-accent underline-offset-4 hover:underline sm:text-right">
              Next: {next.title}
            </Link>
          </nav>
        )}
      </div>
    </article>
  );
}
