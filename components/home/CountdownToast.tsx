"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Digits, useCountdown } from "@/components/home/countdown";

const ease = [0.22, 1, 0.36, 1] as const;

/** Remembered in the browser once the visitor has clicked through to register. */
const REGISTERED_KEY = "hth-registered";

function readRegistered() {
  try {
    return window.localStorage.getItem(REGISTERED_KEY) === "1";
  } catch {
    return false;
  }
}

function saveRegistered() {
  try {
    window.localStorage.setItem(REGISTERED_KEY, "1");
  } catch {
    // Storage blocked: the box still changes for this visit.
  }
}

/**
 * A countdown to the exhibition, always in the bottom-left corner of the home page.
 * Until the visitor clicks a register link (this one, or any other on the page), it also
 * offers "Register now"; afterwards it's just the countdown.
 */
export function CountdownToast({ startsAt, registerUrl }: { startsAt: string | null; registerUrl: string }) {
  const reduced = useReducedMotion();
  const left = useCountdown(startsAt);
  const [shown, setShown] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    setRegistered(readRegistered());
    const timer = window.setTimeout(() => setShown(true), 1200);

    // Any register link on the page counts: the hero, the registration section, or this box.
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (link && link.href === registerUrl) {
        saveRegistered();
        setRegistered(true);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", onClick, true);
    };
  }, [registerUrl]);

  if (!startsAt) return null;

  const units: [number | null, string][] = [
    [left?.days ?? null, "Days"],
    [left?.hours ?? null, "Hrs"],
    [left?.minutes ?? null, "Min"],
    [left?.seconds ?? null, "Sec"],
  ];

  return (
    <AnimatePresence>
      {shown && (
        <motion.aside
          aria-label="Countdown to Hues That Heal 2.0"
          className="fixed bottom-3 left-3 z-30 w-[min(14.5rem,calc(100vw-1.5rem))] sm:bottom-6 sm:left-6 sm:w-[19rem]"
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: -60, y: 40, scale: 0.9, rotate: -4 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
          exit={{ opacity: 0 }}
          transition={reduced ? { duration: 0.01 } : { type: "spring", stiffness: 210, damping: 20 }}
        >
          {/* Gold-and-blue halo that breathes behind the box */}
          <motion.div
            className="pointer-events-none absolute -inset-3 -z-10 rounded-[2rem] bg-[radial-gradient(closest-side,rgba(245,184,46,0.3),rgba(47,123,240,0.22)_60%,transparent)] blur-xl"
            aria-hidden="true"
            animate={reduced ? undefined : { opacity: [0.45, 0.9, 0.45], scale: [0.98, 1.04, 0.98] }}
            transition={reduced ? undefined : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* `layout` lets the box glide to its new size when the button goes. */}
          <motion.div
            layout={!reduced}
            transition={{ layout: { type: "spring", stiffness: 300, damping: 30 } }}
            className="relative overflow-hidden rounded-[1.2rem] border border-white/15 bg-[linear-gradient(160deg,#0b1a4d_0%,#08143d_55%,#040b24_100%)] p-3 text-white shadow-[0_24px_70px_rgba(2,8,30,0.6)] sm:rounded-[1.4rem] sm:p-4"
          >
            <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#f97316,#facc15,#38bdf8)]" aria-hidden="true" />

            <motion.p layout="position" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f5d08a] sm:text-[11px] sm:tracking-[0.24em]">
              <span className="relative flex size-2 shrink-0" aria-hidden="true">
                {!reduced && <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#f5b82e] opacity-75" />}
                <span className="relative inline-flex size-2 rounded-full bg-[#f5b82e]" />
              </span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={registered ? "see-you" : "counting"}
                  initial={reduced ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  {left?.done ? "We are live today" : registered ? "See you there!" : "Hues That Heal 2.0 in"}
                </motion.span>
              </AnimatePresence>
            </motion.p>

            {!left?.done && (
              <motion.div layout="position" className="mt-2 flex items-start justify-between gap-1.5 sm:mt-3" role="timer" aria-live="off" aria-label="Time until the exhibition opens">
                {units.map(([value, label], i) => (
                  <motion.div
                    key={label}
                    className="flex flex-1 flex-col items-center"
                    initial={reduced ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.35 + i * 0.08, ease }}
                  >
                    <span className="flex w-full justify-center rounded-lg bg-white/[0.07] py-1 text-lg font-bold leading-none tabular-nums ring-1 ring-white/10 sm:py-1.5 sm:text-[1.7rem]">
                      <Digits value={value} reduced={reduced} />
                    </span>
                    <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/55">{label}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {!registered && (
                <motion.div
                  key="register"
                  initial={reduced ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0, scale: 0.9 }}
                  transition={{ duration: reduced ? 0 : 0.35, ease }}
                  className="overflow-hidden"
                >
                  <motion.a
                    href={registerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative mt-3 flex min-h-10 items-center justify-center gap-2 overflow-hidden rounded-full bg-[linear-gradient(90deg,#f5b82e,#f5d08a)] px-4 text-sm font-bold text-[#0a1f5c] ring-1 ring-[#f5d08a]/60 sm:mt-3.5 sm:min-h-11"
                    whileHover={reduced ? undefined : { scale: 1.04 }}
                    whileTap={reduced ? undefined : { scale: 0.96 }}
                    animate={reduced ? undefined : { y: [0, -2, 0] }}
                    transition={reduced ? undefined : { y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" }, scale: { type: "spring", stiffness: 400, damping: 18 } }}
                  >
                    {/* A light sweep across the button now and then */}
                    {!reduced && (
                      <motion.span
                        className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                        aria-hidden="true"
                        initial={{ left: "-40%" }}
                        animate={{ left: ["-40%", "140%"] }}
                        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.6, ease: "easeInOut" }}
                      />
                    )}
                    <span className="relative">Register now</span>
                    <motion.span
                      className="relative"
                      aria-hidden="true"
                      animate={reduced ? undefined : { x: [0, 4, 0] }}
                      transition={reduced ? undefined : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      &rarr;
                    </motion.span>
                    <span className="sr-only"> (free, opens a form in a new tab)</span>
                  </motion.a>
                  <p className="mt-2 hidden text-center text-[11px] text-white/55 sm:block">Free entry with registration</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
