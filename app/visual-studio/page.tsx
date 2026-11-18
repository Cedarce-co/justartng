import type { Metadata } from "next";
import { GalleryLoader } from "@/components/gallery/GalleryLoader";

export const metadata: Metadata = {
  title: "Visual Studio",
  description: "Walk the two rooms of the visual studio: Faith Alive, the Hues That Heal 2.0 exhibition, and The Portfolio.",
};

export default async function VisualStudioPage({ searchParams }: { searchParams: Promise<{ work?: string; room?: string }> }) {
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
