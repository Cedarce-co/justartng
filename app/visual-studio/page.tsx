import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GalleryLoader } from "@/components/gallery/GalleryLoader";
import { isStudioOpen } from "@/lib/content";

export const metadata: Metadata = {
  title: "Visual Studio",
  description: "Walk the rooms of the 3D studio: Faith Alive (Hues That Heal 2.0), Melody Osagie, and Hues That Heal 1.0.",
};

// The studio opens on the day of the exhibition, so check the time on every visit.
export const dynamic = "force-dynamic";

export default async function VisualStudioPage({ searchParams }: { searchParams: Promise<{ work?: string; room?: string }> }) {
  // Until then, the home page announces it instead.
  if (!isStudioOpen()) redirect("/#studio");

  const { work, room } = await searchParams;
  return (
    <>
      <GalleryLoader initialSlug={work ?? null} initialRoom={room ?? null} />
      <noscript>
        <div className="mx-auto max-w-xl px-5 py-16">
          <h1 className="text-4xl">Visual Studio</h1>
          <p className="mt-4 leading-relaxed">
            The visual studio needs JavaScript. You can still{" "}
            <a className="text-accent underline-offset-4 hover:underline" href="/works">
              browse the collection of works
            </a>
            .
          </p>
        </div>
      </noscript>
    </>
  );
}
