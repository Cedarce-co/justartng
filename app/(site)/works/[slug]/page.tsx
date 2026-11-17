import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkWriteup } from "@/components/WorkWriteup";
import { getWork, neighbors, works, workMeta } from "@/lib/content";

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
  const { slug } = await params;
  const work = getWork(slug);
  if (!work) notFound();
  const { previous, next } = neighbors(work.slug);
  const meta = workMeta(work);
  const details = [
    ["Artist", work.artist],
    ["Year", work.year],
    ["Medium", work.medium],
    ["Size", work.size],
    ["Body of work", work.body],
  ].filter(([, value]) => Boolean(value));

  return (
    <article className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:py-16">
      <Image
        src={work.image}
        alt={work.alt}
        width={work.imageWidth}
        height={work.imageHeight}
        priority
        sizes="(min-width: 1024px) 56vw, 100vw"
        className="h-auto w-full bg-paper"
      />
      <div>
        <p className="text-sm font-semibold text-accent">{work.body}</p>
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
        <Link href={`/visual-studio?work=${work.slug}`} className="mt-8 inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-on">
          View in the visual studio
        </Link>
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
