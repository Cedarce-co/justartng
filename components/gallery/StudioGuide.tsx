"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Studio surfaces: smoked glass over the room, never the website's blue. */
export const GLASS = "border border-white/10 bg-black/65 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md";

const spring = { type: "spring" as const, stiffness: 240, damping: 30 };
const linkButton = "min-h-11 text-sm font-semibold text-white underline-offset-4 decoration-white/60 hover:underline";

/**
 * Where a guide box sits.
 * - "look": the middle of the room.
 * - "walk": beside the visitor's avatar, near the bottom of the screen.
 * - an element id: beside (or, on narrow screens, below) that element.
 */
export type GuideAnchor = "look" | "walk" | { id: string };

export type GuideStep = { title: string; body: string; anchor: GuideAnchor; needsMenu?: boolean };

const WIDTH = 300;
const GAP = 14;
const EDGE = 12;

type Spot = { left: number; top: number; arrow: "left" | "up" | null; arrowAt: number };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function locate(anchor: GuideAnchor, height: number): Spot {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(WIDTH, vw - EDGE * 2);
  const centred = (vw - width) / 2;

  if (anchor === "look") return { left: centred, top: vh * 0.3, arrow: null, arrowAt: 0 };
  if (anchor === "walk") {
    // The avatar stands at the bottom centre; sit to its right where there's room.
    if (vw >= 700) return { left: vw / 2 + 90, top: clamp(vh * 0.6, EDGE, vh - height - EDGE), arrow: "left", arrowAt: height / 2 };
    return { left: centred, top: vh * 0.28, arrow: null, arrowAt: 0 };
  }

  const element = document.getElementById(anchor.id);
  if (!element) return { left: centred, top: vh * 0.3, arrow: null, arrowAt: 0 };
  const rect = element.getBoundingClientRect();

  if (rect.right + GAP + width <= vw - EDGE) {
    const top = clamp(rect.top + rect.height / 2 - height / 2, EDGE, vh - height - EDGE);
    return { left: rect.right + GAP, top, arrow: "left", arrowAt: clamp(rect.top + rect.height / 2 - top, 18, height - 18) };
  }
  const left = clamp(rect.left + rect.width / 2 - width / 2, EDGE, vw - width - EDGE);
  return { left, top: clamp(rect.bottom + GAP, EDGE, vh - height - EDGE), arrow: "up", arrowAt: clamp(rect.left + rect.width / 2 - left, 18, width - 18) };
}

function Key({ children }: { children: ReactNode }) {
  return <kbd className="inline-grid min-w-6 place-items-center rounded-md border border-white/25 bg-white/10 px-1.5 py-0.5 font-sans text-[11px] font-semibold leading-none text-white">{children}</kbd>;
}

/** A small, always-there reminder of the keyboard controls, shown on desktop only. */
export function KeyHints() {
  const reduced = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-5 right-5 z-20 hidden items-center gap-4 rounded-full px-4 py-2 text-xs text-white/75 lg:flex ${GLASS}`}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      transition={reduced ? { duration: 0.01 } : spring}
    >
      <span className="flex items-center gap-1.5">
        <Key>&larr;</Key>
        <Key>&rarr;</Key>
        Turn around
      </span>
      <span className="flex items-center gap-1.5">
        <Key>W</Key>
        <Key>A</Key>
        <Key>S</Key>
        <Key>D</Key>
        Walk
      </span>
      <span>Tap a painting or the door to go to it</span>
    </motion.div>
  );
}

/** The first question after entering: take the tour, or explore alone. */
export function GuideOffer({ onTour, onDecline }: { onTour: () => void; onDecline: () => void }) {
  const reduced = useReducedMotion();
  return (
    <motion.aside
      aria-label="Studio guide"
      // Centred with margins rather than a translate, which the slide-in animation would override.
      className={`absolute inset-x-0 bottom-6 z-30 mx-auto w-[min(360px,calc(100vw-1.5rem))] rounded-2xl p-5 ${GLASS}`}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0, transition: { duration: 0.01 } } : { opacity: 0, y: 40, transition: { duration: 0.25 } }}
      transition={reduced ? { duration: 0.01 } : { ...spring, delay: 0.4 }}
    >
      <p className="text-sm leading-relaxed text-white/85">First time in the studio? We can show you how to move around and visit the paintings.</p>
      <div className="mt-3 flex items-center gap-6">
        <button type="button" className={linkButton} onClick={onTour}>
          Show me around
        </button>
        <button type="button" className={`${linkButton} text-white/70`} onClick={onDecline}>
          I&rsquo;ll figure it out
        </button>
      </div>
    </motion.aside>
  );
}

/** One instruction at a time. The box glides to whatever it's describing. */
export function GuideTip({ steps, index, onNext, onSkip }: { steps: GuideStep[]; index: number; onNext: () => void; onSkip: () => void }) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLElement>(null);
  const step = steps[index];
  const last = index === steps.length - 1;
  const [spot, setSpot] = useState<Spot | null>(null);

  useLayoutEffect(() => {
    const update = () => setSpot(locate(step.anchor, box.current?.offsetHeight ?? 140));
    // Wait a frame so a menu opened for this step has laid out before we measure it.
    const frame = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
    };
  }, [step]);

  return (
    <motion.aside
      ref={box}
      aria-live="polite"
      aria-label="Studio guide"
      className={`fixed z-40 rounded-2xl p-5 ${GLASS}`}
      style={{ width: `min(${WIDTH}px, calc(100vw - ${EDGE * 2}px))` }}
      initial={false}
      animate={spot ? { left: spot.left, top: spot.top, opacity: 1 } : { opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={reduced ? { duration: 0.01 } : spring}
    >
      {spot?.arrow === "left" && (
        <span className="absolute -left-1.5 size-3 rotate-45 border-b border-l border-white/10 bg-black/65" style={{ top: spot.arrowAt - 6 }} aria-hidden="true" />
      )}
      {spot?.arrow === "up" && (
        <span className="absolute -top-1.5 size-3 rotate-45 border-l border-t border-white/10 bg-black/65" style={{ left: spot.arrowAt - 6 }} aria-hidden="true" />
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
        >
          <h2 className="font-display text-lg font-semibold">{step.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-white/80">{step.body}</p>
        </motion.div>
      </AnimatePresence>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs tabular-nums text-white/50">
          {index + 1} / {steps.length}
        </span>
        <div className="flex items-center gap-5">
          {!last && (
            <button type="button" className={`${linkButton} font-normal text-white/60`} onClick={onSkip}>
              Skip
            </button>
          )}
          <button type="button" className={linkButton} onClick={onNext}>
            {last ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
