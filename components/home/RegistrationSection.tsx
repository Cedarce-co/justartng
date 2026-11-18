"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useState } from "react";
import { Great_Vibes } from "next/font/google";
import { Pill } from "@/components/home/motion";

const script = Great_Vibes({ subsets: ["latin"], weight: "400", display: "swap" });

const ease = [0.22, 1, 0.36, 1] as const;
const FLYER = "/imgbg/huesflyer.jpeg";

export type RegistrationEvent = {
  startsAt: string | null;
  when: string;
  venue: string | null;
  address: string | null;
  map: string | null;
};

/* ------------------------------------------------------------------ */
/* Countdown                                                           */
/* ------------------------------------------------------------------ */

type Remaining = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

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

function useCountdown(startsAt: string | null) {
  const target = startsAt ? Date.parse(startsAt) : Number.NaN;
  // Null until mounted so the server and client render the same markup.
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

function Digit({ value, reduced }: { value: string; reduced: boolean | null }) {
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

function Unit({ value, label, reduced }: { value: number | null; label: string; reduced: boolean | null }) {
  const text = value === null ? "--" : String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <span className="flex rounded-lg bg-[#0b1a6b] px-1.5 py-1 text-[clamp(1.6rem,4.5vw,2.4rem)] font-bold leading-none tabular-nums text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)]">
        {text.split("").map((char, i) => (
          <Digit key={i} value={char} reduced={reduced} />
        ))}
      </span>
      <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0b1a6b]/70">{label}</span>
    </div>
  );
}

function CountdownCard({ startsAt, reduced }: { startsAt: string | null; reduced: boolean | null }) {
  const left = useCountdown(startsAt);
  const units: [number | null, string][] = [
    [left?.days ?? null, "Days"],
    [left?.hours ?? null, "Hrs"],
    [left?.minutes ?? null, "Min"],
    [left?.seconds ?? null, "Sec"],
  ];

  return (
    <div className="relative w-full max-w-[19rem] rounded-[1.4rem] bg-[#0a0d1f] p-3 shadow-[0_24px_60px_rgba(4,10,60,0.55)] ring-1 ring-white/10">
      <div className="relative rounded-2xl bg-white px-4 pb-4 pt-5">
        {/* Viewfinder corners, after the template's scan frame. */}
        {["left-2 top-2 border-l-2 border-t-2", "right-2 top-2 border-r-2 border-t-2", "bottom-2 left-2 border-b-2 border-l-2", "bottom-2 right-2 border-b-2 border-r-2"].map((pos) => (
          <span key={pos} className={`absolute size-4 rounded-[3px] border-[#0a0d1f] ${pos}`} aria-hidden="true" />
        ))}
        {left?.done ? (
          <p className="py-4 text-center text-2xl font-bold text-[#0b1a6b]">We are live today</p>
        ) : (
          <div className="flex items-start justify-center gap-2" role="timer" aria-live="off" aria-label="Time until the exhibition opens">
            {units.map(([value, label]) => (
              <Unit key={label} value={value} label={label} reduced={reduced} />
            ))}
          </div>
        )}
        {!reduced && (
          <motion.span
            className="pointer-events-none absolute inset-x-3 h-px bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent"
            aria-hidden="true"
            animate={{ top: ["12%", "88%", "12%"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {/* Speech-bubble notch */}
        <span className="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rotate-45 bg-white" aria-hidden="true" />
      </div>
      <p className="pt-3 text-center text-lg font-bold uppercase tracking-[0.12em] text-white">Counting down</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Decoration                                                          */
/* ------------------------------------------------------------------ */

function Gear({ className, reverse = false, duration = 26, reduced }: { className: string; reverse?: boolean; duration?: number; reduced: boolean | null }) {
  const teeth = Array.from({ length: 8 }, (_, i) => i * 45);
  const gradient = `gear-${useId().replace(/:/g, "")}`;
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className={`pointer-events-none absolute drop-shadow-[0_18px_30px_rgba(10,20,90,0.6)] ${className}`}
      aria-hidden="true"
      animate={reduced ? undefined : { rotate: reverse ? -360 : 360 }}
      transition={reduced ? undefined : { duration, repeat: Infinity, ease: "linear" }}
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9ad3ff" />
          <stop offset="55%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e3aaf" />
        </linearGradient>
      </defs>
      <g fill={`url(#${gradient})`}>
        {teeth.map((deg) => (
          <rect key={deg} x="41" y="2" width="18" height="22" rx="5" transform={`rotate(${deg} 50 50)`} />
        ))}
        <circle cx="50" cy="50" r="34" />
      </g>
      <circle cx="50" cy="50" r="13" fill="#1236c9" />
    </motion.svg>
  );
}

function Phone({ reduced }: { reduced: boolean | null }) {
  return (
    <div className="relative w-[min(17rem,72vw)] rounded-[2.6rem] bg-[#0b0b10] p-2.5 shadow-[0_40px_80px_rgba(3,8,50,0.65),inset_0_0_0_2px_rgba(255,255,255,0.08)]">
      <div className="relative overflow-hidden rounded-[2.1rem] bg-gradient-to-b from-[#1d4ed8] to-[#1e3a8a]">
        {/* Dynamic island */}
        <span className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />
        <div className="px-3 pb-2 pt-9">
          <p className="text-center text-sm font-semibold tracking-tight text-white/90">Hues That Heal</p>
          <div className="mt-2 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[11px] text-[#1e293b] shadow">
            <svg viewBox="0 0 20 20" className="size-3.5 shrink-0 text-[#475569]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="9" cy="9" r="6" />
              <path d="m14 14 4 4" strokeLinecap="round" />
            </svg>
            <motion.span
              className="truncate"
              initial={reduced ? false : { width: 0 }}
              whileInView={{ width: "auto" }}
              viewport={{ once: true }}
              transition={{ duration: reduced ? 0 : 1.4, delay: reduced ? 0 : 0.6, ease: "linear" }}
            >
              hues that heal 2.0 lagos
            </motion.span>
          </div>
          <div className="mt-2 flex gap-1.5 text-[9px] font-medium text-white/80">
            {["All", "Images", "News", "Maps"].map((tab) => (
              <span key={tab} className={`rounded-full border border-white/30 px-2 py-0.5 ${tab === "Images" ? "bg-white/25 text-white" : ""}`}>
                {tab}
              </span>
            ))}
          </div>
        </div>
        <div className="relative mx-2 overflow-hidden rounded-xl">
          <Image src={FLYER} alt="Hues That Heal 2.0 flyer: a faith-based art exhibition by Olalekan Isiaka" width={1333} height={1600} sizes="(min-width: 1024px) 272px, 72vw" className="h-auto w-full" />
          {!reduced && (
            <motion.span
              className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              aria-hidden="true"
              animate={{ left: ["-40%", "140%"] }}
              transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }}
            />
          )}
        </div>
        <div className="flex justify-around px-6 py-3 text-white/80" aria-hidden="true">
          <span className="text-sm">✳</span>
          <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="9" r="6" />
            <path d="m14 14 4 4" strokeLinecap="round" />
          </svg>
          <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="6" width="10" height="11" rx="2" />
            <path d="M7 3h8a2 2 0 0 1 2 2v9" />
          </svg>
        </div>
        <span className="mx-auto mb-2 block h-1 w-24 rounded-full bg-white/70" aria-hidden="true" />

        {/* Fingertip tap */}
        {!reduced && (
          <motion.span
            className="pointer-events-none absolute left-[62%] top-[58%] size-10 rounded-full border-2 border-white/90 bg-white/20"
            aria-hidden="true"
            animate={{ scale: [0.4, 1.6], opacity: [0.9, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.2, ease: "easeOut" }}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export function RegistrationSection({ event, registerUrl }: { event: RegistrationEvent; registerUrl: string }) {
  const reduced = useReducedMotion();
  const rise = (delay: number, y = 28) => ({
    initial: reduced ? false : { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: reduced ? 0 : 0.8, delay: reduced ? 0 : delay, ease },
  });
  const float = (distance: number, duration: number, delay = 0) =>
    reduced ? {} : { animate: { y: [0, -distance, 0] }, transition: { duration, repeat: Infinity, ease: "easeInOut" as const, delay } };

  return (
    <section
      id="gathering"
      className="relative isolate scroll-mt-24 overflow-hidden bg-[#06102e] pb-24 pt-24 text-white sm:pb-32 sm:pt-32 lg:min-h-[100svh]"
    >
      {/* Blueprint backdrop */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_38%,#0b1a4d_0%,#08143d_40%,#06102e_75%,#040b24_100%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-[#06102e] to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#06102e] to-transparent" aria-hidden="true" />
      <div
        className="absolute inset-0 -z-10 opacity-10 [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        aria-hidden="true"
      />
      {[
        "left-[12%] top-[18%] size-3",
        "left-[38%] top-[8%] size-4",
        "right-[22%] top-[14%] size-2.5",
        "left-[8%] top-[62%] size-2",
        "right-[10%] top-[48%] size-3.5",
        "left-[46%] bottom-[12%] size-2.5",
      ].map((pos, i) => (
        <motion.span
          key={pos}
          className={`absolute -z-10 rounded-full bg-[#7fb2ff] blur-[1px] ${pos}`}
          aria-hidden="true"
          animate={reduced ? undefined : { opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
          transition={reduced ? undefined : { duration: 3 + i * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
        />
      ))}
      <Gear className="-left-12 top-[26rem] size-24 opacity-80 sm:-left-10 sm:top-24 sm:size-40 sm:opacity-100" reduced={reduced} />
      <Gear className="-right-14 top-[46%] size-28 opacity-80 sm:-right-12 sm:top-[30%] sm:size-44 sm:opacity-100" reverse duration={32} reduced={reduced} />
      <Gear className="-bottom-10 left-[30%] hidden size-24 opacity-70 lg:block" duration={20} reduced={reduced} />

      {/* Same content width as the header and the other sections. */}
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        {/* Masthead */}
        <motion.div className="flex items-start justify-between gap-6" {...rise(0, 16)}>
          <p className="text-[11px] font-semibold uppercase leading-tight tracking-[0.08em] text-white/90 sm:text-sm">
            A faith-based
            <br />
            art exhibition
            <br />
            {event.startsAt ? new Date(event.startsAt).getFullYear() : "2026"}
          </p>
          <p className="text-right leading-none text-white">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80 sm:text-xs">Theme</span>
            <span className={`${script.className} block text-4xl sm:text-5xl`}>Faith Alive</span>
          </p>
        </motion.div>

        {/* Framed headline */}
        <div className="relative mt-6">
          <motion.span
            className="absolute inset-x-0 top-0 h-px origin-left bg-white/45"
            aria-hidden="true"
            initial={reduced ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: reduced ? 0 : 1, ease }}
          />
          <span className="absolute -top-2 left-0 size-4 bg-white" aria-hidden="true" />
          <span className="absolute -top-2 right-0 size-4 bg-white" aria-hidden="true" />
          <motion.span
            className="absolute left-[7px] top-0 hidden w-px origin-top bg-white/45 sm:block"
            aria-hidden="true"
            initial={reduced ? false : { scaleY: 0, height: "100%" }}
            whileInView={{ scaleY: 1, height: "100%" }}
            viewport={{ once: true }}
            transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : 0.3, ease }}
          />
          <motion.span
            className="absolute right-[7px] top-0 hidden h-1/2 w-px origin-top bg-white/45 sm:block"
            aria-hidden="true"
            initial={reduced ? false : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : 0.4, ease }}
          />

          <h2 className="font-display pt-8 text-center !font-extrabold leading-[0.95] tracking-[-0.035em] [text-shadow:0_8px_30px_rgba(5,15,80,0.45)]">
            <motion.span className="block text-[clamp(2.9rem,10vw,6.5rem)]" {...rise(0.1, 36)}>
              Registration
            </motion.span>
            <motion.span className="mt-1 flex items-end justify-center gap-3 sm:gap-5" {...rise(0.25, 36)}>
              <span className="relative inline-flex flex-col items-center pb-3 text-[clamp(1.8rem,5vw,3.4rem)] font-semibold italic tracking-normal">
                is
                <motion.span
                  className="absolute -left-4 bottom-1 h-2.5 w-[calc(100%+2rem)] origin-left rounded-sm bg-[#f5b82e]"
                  aria-hidden="true"
                  initial={reduced ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.7, ease }}
                />
                <motion.span
                  className="absolute -bottom-4 h-2 w-2/3 rounded-sm bg-white"
                  aria-hidden="true"
                  animate={reduced ? undefined : { opacity: [0.5, 1, 0.5] }}
                  transition={reduced ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </span>
              <span className="text-hues pb-[0.12em] text-[clamp(2.9rem,10vw,6.5rem)]">Ongoing</span>
            </motion.span>
          </h2>
        </div>

        {/* Stage: phone, countdown, printed flyer */}
        <div className="relative mt-14 grid items-center gap-12 lg:mt-10 lg:grid-cols-[auto_1fr] lg:gap-24">
          <motion.div className="flex justify-center lg:justify-start lg:pl-6" {...rise(0.2, 60)}>
            <motion.div style={{ rotate: -6 }} {...float(14, 6)}>
              <Phone reduced={reduced} />
            </motion.div>
          </motion.div>

          <div className="relative flex flex-col items-center gap-10 lg:items-start lg:pb-40">
            <motion.div className="flex w-full justify-center lg:justify-start" {...rise(0.35, 40)}>
              <motion.div className="w-full max-w-[19rem]" {...float(8, 4.8, 0.6)}>
                <CountdownCard startsAt={event.startsAt} reduced={reduced} />
              </motion.div>
            </motion.div>

            <motion.div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left" {...rise(0.45, 24)}>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">{event.when}</p>
              <p className="max-w-xs text-white/75">
                {event.venue ?? "Venue to be announced"}
                {event.address && <span className="block text-sm text-white/60">{event.address}</span>}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <motion.div
                  className="rounded-full bg-white/10 backdrop-blur"
                  animate={reduced ? undefined : { boxShadow: ["0 0 0 0 rgba(255,255,255,0.45)", "0 0 0 14px rgba(255,255,255,0)"] }}
                  transition={reduced ? undefined : { duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                >
                  <Pill href={registerUrl} external>
                    Register now
                  </Pill>
                </motion.div>
                {event.map && (
                  <a
                    href={event.map}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center text-sm font-semibold uppercase tracking-[0.16em] text-white/75 transition-colors hover:text-white"
                  >
                    Map
                  </a>
                )}
              </div>
            </motion.div>

            {/* Printed flyer */}
            <motion.div
              className="absolute bottom-0 right-0 hidden w-44 lg:block"
              initial={reduced ? false : { opacity: 0, x: 60, rotate: 18 }}
              whileInView={{ opacity: 1, x: 0, rotate: 8 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : 0.5, ease }}
            >
              <motion.div
                className="overflow-hidden rounded-md shadow-[0_24px_50px_rgba(3,8,50,0.6)] [transform:perspective(800px)_rotateY(-14deg)_rotateX(6deg)]"
                {...(reduced ? {} : { animate: { y: [0, -10, 0], rotate: [0, -2, 0] }, transition: { duration: 7, repeat: Infinity, ease: "easeInOut" } })}
              >
                <Image src={FLYER} alt="" width={1333} height={1600} sizes="176px" className="h-auto w-full" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
