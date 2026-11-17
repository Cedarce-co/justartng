"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const films = [
  {
    src: "/videos/hues-that-heal.mp4",
    poster: "/event/hues-poster.webp",
    label: "Hues That Heal 2.0, a faith-based exhibition by Olalekan Isiaka.",
  },
  {
    src: "/videos/art-exhibition.mp4",
    poster: "/event/exhibition-poster.webp",
    label: "Art Exhibition, 28 November 2026.",
  },
];

export function EventReel() {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const film = films[index];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancel = false;
    const play = () => {
      if (cancel || reduced) return;
      void video.play().catch(() => {});
    };
    video.src = film.src;
    video.poster = film.poster;
    video.addEventListener("loadeddata", play, { once: true });
    return () => {
      cancel = true;
      video.removeEventListener("loadeddata", play);
    };
  }, [film, reduced]);

  return (
    <figure className="w-full">
      <motion.div
        className="overflow-hidden rounded-2xl border border-white/15 bg-black/40 shadow-[0_16px_50px_rgba(88,28,135,0.35)] backdrop-blur-md"
        key={film.src}
        initial={reduced ? false : { opacity: 0.35 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.45 }}
      >
        <video
          ref={videoRef}
          className="mx-auto aspect-[4/5] max-h-[70vh] w-full bg-black object-contain lg:aspect-[5/4] lg:max-h-[560px] lg:min-h-[460px]"
          poster={film.poster}
          controls
          playsInline
          muted
          preload={reduced ? "none" : "metadata"}
          aria-label={film.label}
          onEnded={() => setIndex((current) => (current + 1) % films.length)}
        />
      </motion.div>
      <figcaption className="mt-3 flex items-center justify-between gap-4 text-sm text-white/55">
        <p aria-live="polite">{film.label}</p>
        <p>
          {index + 1} / {films.length}
        </p>
      </figcaption>
    </figure>
  );
}
