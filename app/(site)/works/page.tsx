import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { workMeta, worksByBody } from "@/lib/content";

export const metadata: Metadata = {
  title: "Collection of works",
  description: "Paintings in Anticipate Hues that Heal 2.0, grouped by body of work.",
};

export default async function WorksPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const groups = worksByBody();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="text-4xl sm:text-5xl">Collection of works</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        Six paintings, in three bodies of work. Open one to read it, or walk to it in the visual studio.
      </p>
      {notice === "webgl" && (
        <p role="status" className="mt-6 max-w-2xl border border-line bg-paper px-4 py-3">
          This browser can&apos;t open the visual studio, so the collection is shown here instead.
        </p>
      )}
      {groups.map((group) => (
        <section key={group.body} className="mt-12">
          <h2 className="text-2xl">{group.body}</h2>
          <ul className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {group.works.map((work) => {
              const meta = workMeta(work);
              return (
                <li key={work.slug}>
                  <Link href={`/works/${work.slug}`} className="group block">
                    <Image
                      src={work.image}
                      alt={work.alt}
                      width={work.imageWidth}
                      height={work.imageHeight}
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                      className="h-auto w-full bg-paper"
                    />
                    <h3 className="mt-3 text-xl group-hover:text-accent">{work.title}</h3>
                    {meta && <p className="mt-1 text-sm text-muted">{meta}</p>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
