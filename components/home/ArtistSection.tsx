"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useCallback, useState } from "react";
import { ArtistLines } from "@/components/home/Blueprint";
import { StoryModal } from "@/components/home/StoryModal";
import { InteractiveImage } from "@/components/InteractiveImage";

const ease = [0.22, 1, 0.36, 1] as const;

export type ArtistDetails = {
  bio: string[];
  instagram: { handle: string; url: string } | null;
};

function PaletteIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="size-8">
      <path d="M16 4C9.4 4 4 9 4 15.2 4 21 8.8 26 14.6 26c1.6 0 2.4-1 2.4-2.2 0-1.4-1.2-1.8-1.2-3.2 0-1.3 1-2.2 2.4-2.2h3.2C25 18.4 28 16 28 12.6 28 7.8 22.6 4 16 4Z" />
      <circle cx="10.5" cy="14" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="14" cy="9.2" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="20" cy="9.2" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="size-7">
      <path d="M16 3v26M3 16h26M6.8 6.8l18.4 18.4M25.2 6.8 6.8 25.2" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ArtistSection({ artist }: { artist: ArtistDetails }) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const stack: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : 0.12, delayChildren: reduced ? 0 : 0.1 } },
  };
  const item: Variants = {
    hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.75, ease } },
  };
  const pop: Variants = {
    hidden: reduced ? { opacity: 1 } : { opacity: 0, scale: 0.4, rotate: -18 },
    show: { opacity: 1, scale: 1, rotate: 0, transition: reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 16 } },
  };
  const slideIn: Variants = {
    hidden: reduced ? { opacity: 1 } : { opacity: 0, x: -40 },
    show: { opacity: 1, x: 0, transition: { duration: reduced ? 0 : 0.8, ease } },
  };

  return (
    <section
      id="artist"
      className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#0f2a73_0%,#0a1f5c_35%,#06102e_100%)] text-white lg:min-h-[100svh]"
    >
      {/* Glow behind the portrait */}
      <motion.div
        className="pointer-events-none absolute -z-10 aspect-square w-[42rem] rounded-full bg-[radial-gradient(closest-side,rgba(47,123,240,0.55),rgba(23,72,196,0.25)_55%,transparent)] blur-2xl max-lg:left-1/2 max-lg:top-[46%] max-lg:w-[34rem] max-lg:-translate-x-1/2 lg:right-[-6rem] lg:top-[12%]"
        aria-hidden="true"
        animate={reduced ? undefined : { scale: [1, 1.12, 1], opacity: [0.75, 1, 0.75] }}
        transition={reduced ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <ArtistLines />

      <div className="mx-auto grid w-full max-w-6xl px-5 pt-24 sm:px-8 sm:pt-28 lg:min-h-[100svh] lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
        {/* Text column */}
        <motion.div
          className="relative z-10 flex flex-col justify-center lg:pb-36 lg:pt-24"
          variants={stack}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <motion.div variants={pop} className="w-fit">
            <motion.div
              className="grid size-16 place-items-center rounded-2xl border border-white/30 bg-[#1748c4] text-white shadow-[0_10px_40px_rgba(23,72,196,0.55)] sm:size-[4.5rem]"
              animate={reduced ? undefined : { y: [0, -6, 0], rotate: [0, -4, 0] }}
              transition={reduced ? undefined : { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <PaletteIcon />
            </motion.div>
          </motion.div>

          <h2 className="font-display mt-8 text-[clamp(2.5rem,5.4vw,4.75rem)] font-normal leading-[1.02] tracking-[-0.02em]">
            <motion.span variants={item} className="block">
              Meet Olalekan
            </motion.span>
            <motion.span variants={item} className="block">
              <span className="text-hues">&ldquo;Swanky&rdquo;</span> Isiaka
            </motion.span>
          </h2>

          <motion.p variants={item} className="mt-7 max-w-md text-lg leading-snug text-white/85 sm:text-xl">
            Nigerian visual artist and production designer, painting the living power of faith in mixed media and acrylic.{" "}
            <span className="relative ml-1 inline-block h-4 w-24 translate-y-0.5 overflow-hidden rounded-full border border-white/70 align-middle" aria-hidden="true">
              <motion.span
                className="absolute inset-y-[3px] left-[3px] rounded-full bg-[#f5b82e]"
                initial={{ width: "10%" }}
                animate={reduced ? { width: "62%" } : { width: ["10%", "88%", "10%"] }}
                transition={reduced ? { duration: 0 } : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
          </motion.p>

          <motion.div variants={item} className="mt-4">
            <motion.button
              type="button"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              className="group relative inline-flex rounded-full focus-visible:outline-offset-4"
              animate={
                reduced
                  ? undefined
                  : { rotate: [0, 0, -2.5, 2.5, -1.5, 0, 0], y: [0, 0, -3, 0, -1, 0, 0] }
              }
              transition={
                reduced
                  ? undefined
                  : {
                      rotate: { duration: 1.2, repeat: Infinity, repeatDelay: 3.2, ease: "easeInOut" },
                      y: { duration: 1.2, repeat: Infinity, repeatDelay: 3.2, ease: "easeInOut" },
                    }
              }
              whileHover={reduced ? undefined : { scale: 1.06 }}
              whileTap={reduced ? undefined : { scale: 0.95 }}
            >
              <span className="relative inline-flex min-h-11 items-center gap-3 overflow-hidden rounded-full py-1.5 pr-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-white">
                <motion.span
                  className="relative bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(100deg,#ffffff 40%,#f5d08a 50%,#ffffff 60%)", backgroundSize: "250% 100%" }}
                  animate={reduced ? undefined : { backgroundPosition: ["100% 0%", "-50% 0%"] }}
                  transition={reduced ? undefined : { duration: 1.6, repeat: Infinity, repeatDelay: 2.2, ease: "easeInOut" }}
                >
                  Read his story
                </motion.span>
                {/* Icon with ripple rings */}
                <span className="relative grid size-8 place-items-center" aria-hidden="true">
                  {!reduced &&
                    [0, 0.9].map((delay) => (
                      <motion.span
                        key={delay}
                        className="absolute inset-0 rounded-full border border-[#f5d08a]"
                        initial={{ scale: 1, opacity: 0.7 }}
                        animate={{ scale: 1.9, opacity: 0 }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay }}
                      />
                    ))}
                  <span className="relative grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#f97316] via-[#f5b82e] to-[#38bdf8] text-lg leading-none transition-transform duration-300 group-hover:rotate-90">
                    +
                  </span>
                </span>
              </span>
            </motion.button>
          </motion.div>

          <motion.div variants={slideIn} className="mt-8 max-w-lg">
            <Link
              href="/visual-studio"
              className="group flex items-center gap-5 rounded-full border border-white/35 bg-white/[0.03] p-2 pr-8 backdrop-blur-sm transition-colors hover:border-white/70 hover:bg-white/[0.07]"
            >
              <motion.span
                className="grid size-16 shrink-0 place-items-center rounded-full border border-white/40 bg-[#1748c4] text-2xl sm:size-20"
                aria-hidden="true"
                animate={reduced ? undefined : { scale: [1, 1.08, 1] }}
                transition={reduced ? undefined : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="inline-block transition-transform duration-300 group-hover:-rotate-90">&#8600;</span>
              </motion.span>
              <span className="text-base leading-snug text-white/90 sm:text-lg">
                Step into his visual studio and walk the collection.
              </span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Portrait column */}
        <div className="relative -mt-2 flex items-end justify-center lg:mt-0 lg:justify-end">
          <motion.div
            className="relative w-[min(88%,24rem)] sm:w-[min(70%,26rem)] lg:absolute lg:bottom-0 lg:right-0 lg:w-auto lg:h-[88%]"
            initial={reduced ? false : { opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: reduced ? 0 : 1.1, ease, delay: reduced ? 0 : 0.2 }}
          >
            <motion.div
              className="h-full"
              animate={reduced ? undefined : { y: [0, -10, 0] }}
              transition={reduced ? undefined : { duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            >
              <InteractiveImage className="lg:h-full" pop={1.14} tilt={8}>
                <Image
                  src="/imgbg/lekan-portrait.png"
                  alt="Olalekan Isiaka in a black hat, resting his chin on his hand"
                  width={436}
                  height={629}
                  sizes="(min-width: 1024px) 40vw, 88vw"
                  className="h-auto w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)] lg:h-full lg:w-auto"
                />
              </InteractiveImage>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <StoryModal open={open} onClose={close} bio={artist.bio} />

      {/* Bottom bar */}
      <motion.div
        className="relative z-20 mx-auto -mt-16 w-full max-w-6xl px-5 pb-16 sm:px-8 lg:absolute lg:inset-x-0 lg:bottom-16 lg:mt-0 lg:pb-0"
        initial={reduced ? false : { opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: reduced ? 0 : 0.8, ease, delay: reduced ? 0 : 0.35 }}
      >
        <div className="flex flex-col items-stretch gap-3 rounded-[2rem] border border-white/30 bg-[#06102e]/55 p-2 backdrop-blur-md sm:flex-row sm:items-center sm:rounded-full">
          <div className="flex items-center gap-3 rounded-full border border-white/30 px-6 py-3 sm:min-w-[16rem]">
            <motion.span
              className="text-[#f5b82e]"
              aria-hidden="true"
              animate={reduced ? undefined : { rotate: 360 }}
              transition={reduced ? undefined : { duration: 14, repeat: Infinity, ease: "linear" }}
            >
              <SparkIcon />
            </motion.span>
            <span className="text-sm leading-tight text-white/90">
              Olalekan Isiaka
              <br />
              <span className="text-white/60">Art director &amp; visual artist</span>
            </span>
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 pb-3 text-sm text-white/85 sm:pb-0">
            {artist.instagram && (
              <a
                href={artist.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 hover:text-white hover:underline hover:underline-offset-4"
              >
                <InstagramIcon />
                {artist.instagram.handle}
              </a>
            )}
            <span className="inline-flex min-h-11 items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#f5b82e]" aria-hidden="true" />
              Lagos, Nigeria
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
