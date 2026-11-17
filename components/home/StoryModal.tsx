"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { InteractiveImage } from "@/components/InteractiveImage";

const ease = [0.22, 1, 0.36, 1] as const;

type NuggetData = { label: string; value: string; icon: "pin" | "cap" | "film" | "brush"; position: string };

const NUGGETS: NuggetData[] = [
  { label: "Based", value: "Lagos, Nigeria", icon: "pin", position: "left-0 top-[4%]" },
  { label: "Trained", value: "Painting · Poly Ibadan", icon: "cap", position: "right-0 top-[38%]" },
  { label: "Practice", value: "Visual art & production design", icon: "film", position: "left-0 top-[28%]" },
  { label: "Medium", value: "Mixed media · Acrylic", icon: "brush", position: "right-0 bottom-[18%]" },
];

function NuggetIcon({ icon }: { icon: NuggetData["icon"] }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: "size-4" };
  if (icon === "pin")
    return (
      <svg {...common}>
        <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" />
        <circle cx="12" cy="10" r="2.3" />
      </svg>
    );
  if (icon === "cap")
    return (
      <svg {...common}>
        <path d="m2 9 10-5 10 5-10 5L2 9Z" />
        <path d="M6 11v4.5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V11M22 9v5" />
      </svg>
    );
  if (icon === "film")
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M14.5 4.5 19.5 9.5 11 18l-5 1 1-5 7.5-9.5Z" />
      <path d="m13 6 5 5" />
    </svg>
  );
}

function Nugget({ nugget, index, reduced, className }: { nugget: NuggetData; index: number; reduced: boolean; className: string }) {
  return (
    <motion.div
      className={`${className} z-10 items-center gap-2.5 rounded-2xl border border-white/20 bg-[#0a1f5c]/70 py-2 pl-2 pr-4 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-md`}
      initial={reduced ? false : { opacity: 0, scale: 0.6, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 18, delay: 0.8 + index * 0.15 }}
    >
      <motion.span
        className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#f97316] via-[#f5b82e] to-[#38bdf8] text-white"
        animate={reduced ? undefined : { y: [0, -3, 0] }}
        transition={reduced ? undefined : { duration: 3 + index * 0.6, repeat: Infinity, ease: "easeInOut", delay: 1.5 + index * 0.3 }}
      >
        <NuggetIcon icon={nugget.icon} />
      </motion.span>
      <span className="text-left leading-tight">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">{nugget.label}</span>
        <span className="block text-sm text-white/90">{nugget.value}</span>
      </span>
    </motion.div>
  );
}

const FILMS = ["A Tribe Called Judah", "Shanty Town", "Ginger", "The Party", "Everybody Loves Jenifa", "Tokunbo"];

/** Splits the bio into a short lead sentence and the remaining paragraphs. */
function splitBio(bio: string[]) {
  const [first = "", ...others] = bio;
  const match = first.match(/^(.+?[.!?])\s+([\s\S]*)$/);
  if (!match) return { lead: first, rest: others };
  return { lead: match[1], rest: [match[2], ...others] };
}

export function StoryModal({
  open,
  onClose,
  bio,
}: {
  open: boolean;
  onClose: () => void;
  bio: string[];
}) {
  const reduced = useReducedMotion();
  const { lead, rest } = splitBio(bio);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, onClose]);

  const body: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : 0.08, delayChildren: reduced ? 0 : 0.3 } },
  };
  const line: Variants = {
    hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.6, ease } },
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close his story"
            tabIndex={-1}
            className="absolute inset-0 cursor-default bg-[#030a1f]/70 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.35 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="story-title"
            className="relative flex max-h-[92svh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[2rem] border border-white/15 bg-[linear-gradient(160deg,#0f2a73_0%,#0a1f5c_45%,#06102e_100%)] text-white shadow-[0_40px_120px_rgba(3,10,31,0.8)] sm:rounded-[2rem]"
            initial={reduced ? { opacity: 0 } : { y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { y: "100%", opacity: 0 }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 210, damping: 28 }}
          >
            {/* Colour wash echoing the Hues That Heal palette */}
            <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-[#f97316]/25 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-28 right-10 size-80 rounded-full bg-[#38bdf8]/20 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute right-1/3 top-10 size-64 rounded-full bg-[#2f7bf0]/30 blur-3xl" aria-hidden="true" />

            {/* Grab handle on phones */}
            <div className="relative mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-white/25 sm:hidden" aria-hidden="true" />

            <motion.button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-20 grid size-11 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-colors hover:border-white hover:bg-white hover:text-[#0a1f5c] sm:right-5 sm:top-5"
              initial={reduced ? false : { opacity: 0, rotate: -90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : 0.25, ease }}
              whileHover={reduced ? undefined : { rotate: 90 }}
              whileTap={reduced ? undefined : { scale: 0.9 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </motion.button>

            <motion.div
              className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain"
              variants={body}
              initial="hidden"
              animate="show"
            >
              <div className="grid gap-8 px-5 pb-10 pt-5 sm:px-10 sm:pt-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-12 md:pb-12 md:pt-12">
                {/* Portrait with floating fact nuggets: right column on desktop, first on phones */}
                <div className="md:sticky md:top-0 md:order-2 md:self-start md:pt-2">
                  <div className="relative">
                    <InteractiveImage pop={1.12} tilt={10}>
                    <div className="relative mx-auto aspect-square w-[min(100%,20rem)] overflow-hidden [mask-image:linear-gradient(to_bottom,black_80%,transparent)] md:aspect-auto md:h-[min(60svh,34rem)] md:w-full">
                      <motion.div
                        className="absolute inset-0 origin-bottom"
                        initial={reduced ? false : { y: "70%", rotate: -8, scale: 0.9, opacity: 0, filter: "blur(12px)" }}
                        animate={{ y: "0%", rotate: 0, scale: 1, opacity: 1, filter: "blur(0px)" }}
                        transition={
                          reduced
                            ? { duration: 0 }
                            : {
                                y: { type: "spring", stiffness: 120, damping: 14, delay: 0.35 },
                                rotate: { type: "spring", stiffness: 120, damping: 10, delay: 0.35 },
                                scale: { duration: 0.9, ease, delay: 0.35 },
                                opacity: { duration: 0.5, delay: 0.35 },
                                filter: { duration: 0.8, delay: 0.35 },
                              }
                        }
                      >
                        <motion.div
                          className="absolute inset-0 origin-bottom"
                          animate={reduced ? undefined : { rotate: [0, 1.5, 0, -1.5, 0], y: [0, -4, 0] }}
                          transition={reduced ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
                        >
                          {/* Sized by height so the crop always ends at his chest, whatever the box width */}
                          <div className="absolute left-1/2 top-0 aspect-[484/785] h-[150%] -translate-x-1/2">
                            <Image
                              src="/imgbg/lekan-palette.png"
                              alt="Olalekan Isiaka holding a paint palette above his head"
                              fill
                              sizes="(min-width: 768px) 36rem, 90vw"
                              className="object-contain object-top drop-shadow-[0_20px_30px_rgba(0,0,0,0.45)]"
                            />
                          </div>
                        </motion.div>
                      </motion.div>
                    </div>
                    </InteractiveImage>

                    {/* Desktop: nuggets float around the portrait */}
                    {NUGGETS.map((nugget, index) => (
                      <Nugget key={nugget.label} nugget={nugget} index={index} reduced={!!reduced} className={`absolute hidden md:flex ${nugget.position}`} />
                    ))}
                  </div>

                  <motion.h3
                    id="story-title"
                    className="font-display relative z-20 -mt-6 text-center text-[clamp(2.2rem,4.4vw,3.6rem)] font-normal leading-[0.98] tracking-[-0.03em] md:-mt-10"
                    initial={reduced ? false : { opacity: 0, y: 24, letterSpacing: "0.04em" }}
                    animate={{ opacity: 1, y: 0, letterSpacing: "-0.03em" }}
                    transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.7, ease }}
                  >
                    <span className="block">Olalekan</span>
                    <span className="block">
                      <span className="bg-gradient-to-r from-[#f97316] via-[#facc15] to-[#38bdf8] bg-clip-text text-transparent">&ldquo;Swanky&rdquo;</span> Isiaka
                    </span>
                  </motion.h3>

                  {/* Phones: the same nuggets as a tidy wrap under the portrait */}
                  <div className="mt-6 grid grid-cols-2 gap-2 md:hidden">
                    {NUGGETS.map((nugget, index) => (
                      <Nugget key={nugget.label} nugget={nugget} index={index} reduced={!!reduced} className="relative flex min-w-0" />
                    ))}
                  </div>
                </div>

                {/* Story: left column on desktop */}
                <div className="md:order-1 md:pl-2">
                  <motion.p variants={line} className="text-xs font-semibold uppercase tracking-[0.35em] text-[#f5d08a]">
                    His story
                  </motion.p>
                  <motion.span
                    variants={{
                      hidden: reduced ? { scaleX: 1 } : { scaleX: 0 },
                      show: { scaleX: 1, transition: { duration: reduced ? 0 : 0.7, ease } },
                    }}
                    className="mt-5 block h-[3px] w-20 origin-left rounded-full bg-gradient-to-r from-[#f97316] via-[#facc15] to-[#38bdf8]"
                    aria-hidden="true"
                  />

                  {lead && (
                    <motion.p variants={line} className="mt-6 text-xl leading-snug text-white sm:text-2xl">
                      {lead}
                    </motion.p>
                  )}
                  <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-white/70 sm:text-base">
                    {rest.map((paragraph) => (
                      <motion.p key={paragraph.slice(0, 24)} variants={line}>
                        {paragraph}
                      </motion.p>
                    ))}
                  </div>

                  <motion.div variants={line} className="mt-8 border-t border-white/10 pt-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Production design for film</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {FILMS.map((film) => (
                        <li key={film} className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-sm text-white/80">
                          {film}
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
