"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { DragToEnter } from "@/components/home/DragToEnter";

/** Set by the studio when it opens, so the invitation isn't shown to someone who has just been inside. */
export const STUDIO_VISITED_KEY = "hth-studio-visited";
/** Set when the visitor closes the invitation. */
const DISMISSED_KEY = "hth-invite-dismissed";

const PAINTINGS = [
  { src: "/art/the-lion-and-the-lamb-std.webp", rotate: -12, x: -12 },
  { src: "/art/symphonia-std.webp", rotate: 10, x: 12 },
  { src: "/art/hope-std.webp", rotate: -1, x: 0 },
];

function readFlag(key: string) {
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string) {
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Storage blocked: the invitation simply closes for this page view.
  }
}

/**
 * A small invitation that rises into the bottom-right corner of the home page and stays until closed.
 * It isn't shown to visitors who are coming back from the studio, or who closed it earlier this visit.
 */
export function StudioInvite() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (readFlag(STUDIO_VISITED_KEY) || readFlag(DISMISSED_KEY)) return;
    const timer = window.setTimeout(() => setOpen(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => {
    writeFlag(DISMISSED_KEY);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          aria-labelledby="studio-invite-title"
          className="fixed bottom-3 right-3 z-40 w-[min(360px,calc(100vw-1.5rem))] sm:bottom-6 sm:right-6"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 80, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 60, scale: 0.95 }}
          transition={reduced ? { duration: 0.01 } : { type: "spring", stiffness: 220, damping: 24 }}
        >
          {/* Soft gold-and-blue halo that breathes behind the card */}
          <motion.div
            className="pointer-events-none absolute -inset-3 -z-10 rounded-[2.25rem] bg-[radial-gradient(closest-side,rgba(245,184,46,0.35),rgba(47,123,240,0.25)_60%,transparent)] blur-xl"
            aria-hidden="true"
            animate={reduced ? undefined : { opacity: [0.5, 0.9, 0.5] }}
            transition={reduced ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-[linear-gradient(160deg,#0b1a4d_0%,#08143d_55%,#040b24_100%)] p-5 text-white shadow-[0_30px_80px_rgba(2,8,30,0.6)]">
            {/* Thin rainbow rule in the 2.0 colours */}
            <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#f97316,#facc15,#38bdf8)]" aria-hidden="true" />

            <button
              type="button"
              aria-label="Close the invitation"
              className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-white/10 text-lg leading-none text-white/80 transition-colors hover:bg-white hover:text-[#0a1f5c]"
              onClick={close}
            >
              &times;
            </button>

            <div className="flex items-start gap-4">
              {/* A little fan of paintings from the show */}
              <div className="relative mt-1 h-20 w-24 shrink-0" aria-hidden="true">
                {PAINTINGS.map((painting, i) => (
                  <motion.div
                    key={painting.src}
                    className="absolute inset-y-0 left-1/2 -ml-7 w-14 overflow-hidden rounded-md border-2 border-[#f5f0d1] shadow-[0_8px_20px_rgba(0,0,0,0.45)]"
                    initial={reduced ? false : { rotate: 0, x: 0, opacity: 0 }}
                    animate={{ rotate: painting.rotate, x: painting.x, opacity: 1 }}
                    transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 16, delay: 0.5 + i * 0.12 }}
                  >
                    <Image src={painting.src} alt="" fill sizes="80px" className="object-cover" />
                  </motion.div>
                ))}
              </div>

              <div className="min-w-0 self-center pr-6">
                <h2 id="studio-invite-title" className="font-display">
                  <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-[#f5d08a]">
                    <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
                      {!reduced && <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#f5b82e] opacity-75" />}
                      <span className="relative inline-flex size-2.5 rounded-full bg-[#f5b82e]" />
                    </span>
                    Now open in
                  </span>
                  <span className="text-hues mt-1 block pb-1 text-7xl font-black leading-none tracking-[-0.04em]"> 3D</span>
                </h2>
              </div>
            </div>

            <p className="mt-4 text-[13px] leading-relaxed text-white/80 sm:text-sm">
              New paintings on love, faith and hope by Olalekan &ldquo;Swanky&rdquo; Isiaka, with featured artist Melody Osagie and the first collection, Hues That Heal 1.0, hung at full size in a studio you can walk through from wherever you are.
            </p>

            <div className="mt-4">
              <DragToEnter size="sm" href="/visual-studio" hint="Drag to enter" label="the 3D exhibition studio" />
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
