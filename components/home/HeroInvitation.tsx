"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Cinzel, Great_Vibes } from "next/font/google";
import { Breathe, Pill } from "@/components/home/motion";
import { InteractiveImage } from "@/components/InteractiveImage";

const script = Great_Vibes({ subsets: ["latin"], weight: "400", display: "swap" });
const roman = Cinzel({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });

const ease = [0.22, 1, 0.36, 1] as const;

export type HeroDetails = {
  edition: string;
  date: string | null;
  time: string | null;
  venue: string | null;
  address: string | null;
  map: string | null;
  credit: string;
};

function TicketIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="size-8">
      <path d="M4 9a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v3.5a3.5 3.5 0 0 0 0 7V23a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3.5a3.5 3.5 0 0 0 0-7V9Z" />
      <path d="M10 13h12M10 19h8" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-8">
      <circle cx="16" cy="16" r="12" />
      <path d="M16 9v7l-4 3" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="size-8">
      <path d="M16 29s-9-8.4-9-15a9 9 0 0 1 18 0c0 6.6-9 15-9 15Z" />
      <circle cx="16" cy="14" r="3.5" />
    </svg>
  );
}

function Detail({ icon, href, children }: { icon: ReactNode; href?: string | null; children: ReactNode }) {
  const body = (
    <>
      <span className="mt-0.5 shrink-0 text-[#7dd3fc]" aria-hidden="true">
        {icon}
      </span>
      <span className="text-[15px] leading-snug text-white/85 [text-shadow:0_1px_10px_rgba(18,6,32,0.9)] sm:text-base">{children}</span>
    </>
  );
  const className = "flex items-start gap-3 text-left";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${className} group rounded-lg transition-colors hover:text-white [&>span:last-child]:hover:text-white`}>
        {body}
      </a>
    );
  }
  return <div className={className}>{body}</div>;
}

export function HeroInvitation({ details, registerUrl }: { details: HeroDetails; registerUrl: string }) {
  const reduced = useReducedMotion();
  const rise = (delay: number, y = 20) => ({
    initial: reduced ? false : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0 : 0.8, delay: reduced ? 0 : delay, ease },
  });

  return (
    <section className="relative isolate flex flex-col overflow-hidden bg-[linear-gradient(180deg,#120620_0%,#1d0d33_42%,#3a2a63_78%,#4b3b78_100%)] px-5 pb-12 pt-28 sm:px-10 sm:pt-32 lg:min-h-[100svh]">
      {/* Floor: a soft horizon that the artwork sits on */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[45%] bg-[radial-gradient(ellipse_80%_100%_at_50%_100%,rgba(196,181,253,0.2),transparent_75%)]"
        aria-hidden="true"
      />

      <div className="mx-auto flex w-full max-w-6xl lg:w-[90%] lg:max-w-none flex-1 flex-col items-center text-center">
        <motion.h1 className="relative z-10 flex flex-col items-center text-white" {...rise(0.05, 28)}>
          <span className={`${script.className} -mb-[0.35em] text-[clamp(2.2rem,5.6vw,3.8rem)] font-normal leading-none text-[#f5d08a]`}>
            Faith
          </span>
          <span className={`${roman.className} pl-[0.2em] text-[clamp(2.2rem,7vw,5rem)] font-semibold uppercase leading-none tracking-[0.2em]`}>
            Art
          </span>
        </motion.h1>

        <motion.p className={`${roman.className} relative z-10 mt-3 flex items-baseline gap-3 text-[clamp(1.2rem,3vw,2.1rem)] uppercase leading-none tracking-[0.12em] text-white sm:mt-4`} {...rise(0.2)}>
          <span className="font-normal">Exhibition</span>
          <span className="bg-gradient-to-r from-[#f97316] via-[#facc15] to-[#38bdf8] bg-clip-text font-semibold text-transparent">
            {details.edition}
          </span>
        </motion.p>

        <motion.div
          className="relative z-10 mt-8 grid w-full max-w-4xl lg:max-w-6xl gap-6 sm:mt-10 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/30"
          {...rise(0.35)}
        >
          <div className="flex justify-start sm:justify-center sm:px-6">
            <Detail icon={<TicketIcon />} href={registerUrl}>
              Free entry with registration
              <br />
              <span className="inline-flex items-center gap-2 font-semibold text-white"><span className="underline-offset-4 decoration-1 group-hover:underline">Reserve your place</span><span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span></span>
            </Detail>
          </div>
          <div className="flex justify-start sm:justify-center sm:px-6">
            <Detail icon={<ClockIcon />}>
              {details.date ?? "Date to be announced"}
              {details.time && (
                <>
                  <br />
                  {details.time}
                </>
              )}
            </Detail>
          </div>
          <div className="flex justify-start sm:justify-center sm:px-6">
            <Detail icon={<PinIcon />} href={details.map}>
              {details.address ?? details.venue ?? "Venue to be announced"}
            </Detail>
          </div>
        </motion.div>

        <div className="relative z-0 -mt-8 flex w-full flex-1 flex-col items-center justify-start sm:-mt-14 lg:-mt-6">
          <div
            className="pointer-events-none absolute bottom-[18%] left-1/2 h-[60%] w-[min(90%,48rem)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(249,115,22,0.28),rgba(56,189,248,0.16)_55%,transparent)] blur-2xl"
            aria-hidden="true"
          />
          <motion.div
            className="relative w-full max-w-[50rem]"
            initial={reduced ? false : { opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : 0.5, ease }}
          >
            <Breathe scale={1.08} duration={3.6}>
              <InteractiveImage pop={1.2} tilt={14}>
                <Image
                  src="/imgbg/heusnobg.png"
                  alt="Hues That Heal"
                  width={707}
                  height={353}
                  priority
                  sizes="(min-width: 768px) 50rem, 92vw"
                  className="h-auto w-full drop-shadow-[0_24px_40px_rgba(0,0,0,0.45)]"
                />
              </InteractiveImage>
            </Breathe>
            {/* Reflection on the floor */}
            <div
              className="pointer-events-none -mt-[4%] aspect-[707/150] overflow-hidden opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
              aria-hidden="true"
            >
              <Image src="/imgbg/heusnobg.png" alt="" width={707} height={353} sizes="(min-width: 768px) 50rem, 92vw" className="h-auto w-full -scale-y-100 blur-[1.5px]" />
            </div>
          </motion.div>
        </div>

        <motion.div className="mt-4 flex flex-col items-center gap-6" {...rise(0.8, 16)}>
          <Pill href={registerUrl} external>
            Register
          </Pill>
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-semibold uppercase tracking-[0.2em] text-white/90">
            {details.credit}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
