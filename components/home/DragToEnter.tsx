"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useRef, useState } from "react";

const MotionLink = motion.create(Link);

/** How far along the track (0–1) the knob must be dragged to enter. */
const ENTER_AT = 0.7;

/**
 * A pill with a round knob that visitors drag to the right to enter the 3D studio.
 * The knob is also a normal link, so a tap, a click or the keyboard still gets there.
 */
const SIZES = {
  md: { track: "h-20 max-w-lg sm:h-24", text: "pl-24 pr-12 sm:pl-28", hint: "text-[11px] sm:text-xs", label: "text-base sm:text-lg", knob: "text-2xl" },
  sm: { track: "h-16", text: "pl-[4.5rem] pr-10", hint: "text-[10px]", label: "text-sm", knob: "text-xl" },
} as const;

export function DragToEnter({ href, label, hint = "Drag to enter", size = "md" }: { href: string; label: string; hint?: string; size?: keyof typeof SIZES }) {
  const s = SIZES[size];
  const router = useRouter();
  const reduced = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLAnchorElement>(null);
  const dragged = useRef(false);
  const [entering, setEntering] = useState(false);
  const x = useMotionValue(0);

  const reach = () => {
    const trackWidth = track.current?.offsetWidth ?? 0;
    const knobWidth = knob.current?.offsetWidth ?? 0;
    return Math.max(1, trackWidth - knobWidth - 16);
  };
  // The trail behind the knob and the fading text follow the drag.
  const fill = useTransform(x, (value) => value + (knob.current?.offsetWidth ?? 64) + 8);
  const textFade = useTransform(x, (value) => 1 - Math.min(1, value / (reach() * 0.6)));

  const onDragEnd = () => {
    const max = reach();
    if (x.get() >= max * ENTER_AT) {
      setEntering(true);
      animate(x, max, { duration: reduced ? 0 : 0.25 });
      router.push(href);
    } else {
      animate(x, 0, reduced ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 30 });
    }
  };

  return (
    <div
      ref={track}
      className={`relative flex w-full select-none items-center overflow-hidden rounded-full border border-white/35 bg-white/[0.04] p-2 backdrop-blur-sm ${s.track}`}
    >
      {/* Trail that fills as the knob moves */}
      <motion.span className="absolute inset-y-2 left-2 rounded-full bg-gradient-to-r from-[#1748c4]/70 to-[#2f7bf0]/40" style={{ width: fill }} aria-hidden="true" />

      <motion.span className={`pointer-events-none relative flex flex-1 flex-col text-left ${s.text}`} style={{ opacity: textFade }} aria-hidden="true">
        <span className={`font-semibold uppercase tracking-[0.24em] text-[#f5d08a] ${s.hint}`}>{entering ? "Opening the studio…" : hint}</span>
        <span className={`mt-1 leading-snug text-white/90 ${s.label}`}>{label}</span>
      </motion.span>

      {/* Chevrons pointing the way */}
      <span className="pointer-events-none absolute right-5 flex gap-0.5 text-white/60" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={reduced ? undefined : { opacity: [0.2, 1, 0.2], x: [0, 3, 0] }}
            transition={reduced ? undefined : { duration: 1.4, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
          >
            &rsaquo;
          </motion.span>
        ))}
      </span>

      <MotionLink
        ref={knob}
        href={href}
        aria-label={`${label}. Drag right or press to enter.`}
        className={`absolute left-2 top-2 grid aspect-square h-[calc(100%-1rem)] cursor-grab touch-none place-items-center rounded-full border border-white/40 bg-[#1748c4] ${s.knob} text-white shadow-[0_10px_30px_rgba(23,72,196,0.6)] active:cursor-grabbing`}
        style={{ x }}
        drag="x"
        dragConstraints={track}
        dragElastic={0.04}
        dragMomentum={false}
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={onDragEnd}
        onClick={(event) => {
          // A finished drag decides on its own; only a plain tap or click follows the link.
          if (dragged.current) {
            event.preventDefault();
            dragged.current = false;
          }
        }}
        animate={reduced || entering ? undefined : { scale: [1, 1.07, 1] }}
        transition={reduced ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <span aria-hidden="true">&rarr;</span>
      </MotionLink>
    </div>
  );
}
