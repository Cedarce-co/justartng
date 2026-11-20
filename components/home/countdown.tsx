"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export type Remaining = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

function remaining(target: number): Remaining {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
    done: diff === 0,
  };
}

/** Time left until `startsAt`, ticking every second. Null until mounted so the server and client render the same markup. */
export function useCountdown(startsAt: string | null) {
  const target = startsAt ? Date.parse(startsAt) : Number.NaN;
  const [left, setLeft] = useState<Remaining | null>(null);

  useEffect(() => {
    if (Number.isNaN(target)) return;
    const tick = () => setLeft(remaining(target));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return left;
}

/** One digit that rolls down to its new value, like a flip clock. */
export function Digit({ value, reduced }: { value: string; reduced: boolean | null }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden text-center">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          className="absolute inset-0"
          initial={reduced ? false : { y: "-100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={reduced ? undefined : { y: "100%", opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.45, ease }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** A two-digit number made of rolling digits; "--" before the countdown has started. */
export function Digits({ value, reduced }: { value: number | null; reduced: boolean | null }) {
  const text = value === null ? "--" : String(value).padStart(2, "0");
  return (
    <>
      {text.split("").map((char, i) => (
        <Digit key={i} value={char} reduced={reduced} />
      ))}
    </>
  );
}
