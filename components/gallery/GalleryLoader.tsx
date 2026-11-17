"use client";

import dynamic from "next/dynamic";
import { GalleryFallback } from "@/components/gallery/GalleryFallback";

const GalleryApp = dynamic(() => import("@/components/gallery/GalleryApp"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0">
      <GalleryFallback />
    </div>
  ),
});

export function GalleryLoader({ initialSlug }: { initialSlug: string | null }) {
  return <GalleryApp initialSlug={initialSlug} />;
}
