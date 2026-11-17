"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArtistSection, type ArtistDetails } from "@/components/home/ArtistSection";
import { EventReel } from "@/components/home/EventReel";
import { HeroInvitation, type HeroDetails } from "@/components/home/HeroInvitation";
import { Breathe, Pill, Reveal, Words } from "@/components/home/motion";

const REGISTER_URL = "https://docs.google.com/forms/d/e/1FAIpQLScJrtDPSeN8l8QRCyX8wmvbngY8xdzHA-HAkkO5bKeULOs5SA/viewform";

const ease = [0.22, 1, 0.36, 1] as const;

export type HomeEvent = {
  title: string;
  when: string;
  venue: string | null;
  address: string | null;
  description: string | null;
  map: string | null;
};

export function HomeExperience({
  hero,
  artist,
  event,
  studio,
}: {
  hero: HeroDetails;
  artist: ArtistDetails;
  event: HomeEvent | null;
  studio: { count: number; bodies: string[] };
}) {
  const reduced = useReducedMotion();
  const bodies = new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(studio.bodies);

  return (
    <div className="bg-[#14071c] text-[#f7f2fb]">
      <HeroInvitation details={hero} registerUrl={REGISTER_URL} />

      <ArtistSection artist={artist} />

      {event && (
        <section id="gathering" className="relative scroll-mt-24 overflow-hidden border-t border-white/10 bg-[#1b0a2a] px-5 py-16 sm:px-10 sm:py-24 lg:flex lg:min-h-[100svh] lg:items-center lg:py-16">
          <div className="pointer-events-none absolute -right-16 top-0 size-72 rounded-full bg-[#a855f7]/25 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 rounded-[2rem] border border-white/15 bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(88,28,135,0.28)] backdrop-blur-xl sm:p-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-stretch lg:gap-x-16 lg:p-12">
            <Reveal className="lg:col-start-1 lg:row-start-1" delay={0.08}>
              <Breathe scale={1.015} duration={8}>
                <EventReel />
              </Breathe>
            </Reveal>
            <div className="flex flex-col justify-between gap-10 lg:col-start-2 lg:row-start-1 lg:py-4">
            <Reveal>
              <Breathe className="origin-left" scale={1.02} duration={5.8}>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#f0abfc]">The day</p>
                <Words as="h2" text="Register a place if you are coming." className="font-display mt-3 max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl" />
              </Breathe>
            </Reveal>
            <Reveal delay={0.14}>
              <div className="grid gap-4 border-t border-white/15 pt-6 sm:grid-cols-2">
                <Breathe scale={1.025} duration={5.5}>
                  <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f0abfc]/80">When</p>
                    <p className="mt-2 text-lg">{event.when}</p>
                  </div>
                </Breathe>
                <Breathe scale={1.025} duration={6.1} delay={0.6}>
                <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f0abfc]/80">Where</p>
                  <p className="mt-2 text-lg">{event.venue ?? "Venue to be announced"}</p>
                  {event.address && <p className="mt-1 text-white/65">{event.address}</p>}
                </div>
                </Breathe>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Breathe scale={1.045} duration={3.8} delay={0.3}>
                  <Pill href={REGISTER_URL} external>
                    Register
                  </Pill>
                </Breathe>
                {event.map && (
                  <motion.a
                    href={event.map}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center text-sm font-semibold uppercase tracking-[0.16em] text-white/70 hover:text-white"
                    whileHover={reduced ? undefined : { x: 4 }}
                    whileTap={reduced ? undefined : { scale: 0.97 }}
                  >
                    Map
                  </motion.a>
                )}
              </div>
            </Reveal>
            </div>
          </div>
        </section>
      )}

      <section className="relative isolate min-h-[92svh] overflow-hidden border-t border-white/10">
        <motion.div
          className="absolute -inset-[8%]"
          aria-hidden="true"
          initial={false}
          animate={reduced ? undefined : { scale: [1, 1.08, 1], x: ["-1.5%", "1.5%", "-1.5%"] }}
          transition={reduced ? undefined : { duration: 28, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image src="/imgbg/meta3d.jpg" alt="" fill sizes="100vw" className="object-cover object-[68%_center]" />
        </motion.div>
        <div className="absolute inset-0 bg-[#120818]/30" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#120818]/75 via-transparent to-[#120818]/35" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-[92svh] max-w-3xl flex-col items-center justify-center px-6 py-28 text-center">
          <motion.p
            className="text-xs font-semibold uppercase tracking-[0.42em] text-[#f3c9ff]"
            initial={reduced ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: reduced ? 0 : 0.6, ease }}
          >
            Visual studio
          </motion.p>
          <Breathe scale={1.02} duration={6.4}>
          <motion.h2
            className="font-display mt-5 text-5xl font-semibold leading-[0.9] tracking-[-0.045em] sm:text-7xl"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.6 }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: reduced ? 0 : 0.12, delayChildren: reduced ? 0 : 0.08 } },
            }}
          >
            {["Walk the", "collection"].map((line) => (
              <motion.span
                key={line}
                className="block"
                variants={{
                  hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 28 },
                  show: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.7, ease } },
                }}
              >
                {line}
              </motion.span>
            ))}
          </motion.h2>
          </Breathe>
          <motion.span
            className="mt-6 h-px w-16 origin-center bg-white/70"
            aria-hidden="true"
            initial={reduced ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.25, ease }}
          />
          <motion.p
            className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-white/80"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.3, ease }}
          >
            {/* {studio.count} paintings */}
          </motion.p>
          <Breathe className="mt-3" scale={1.02} duration={6.6} delay={0.4}>
            <Words text={bodies} className="max-w-lg text-lg leading-relaxed text-white/85 sm:text-xl" />
          </Breathe>
          <motion.p
            className="mt-4 max-w-md text-base leading-relaxed text-white/70"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.45, ease }}
          >
            The room is built to their scale, so you can stand in front of each one.
          </motion.p>
          <motion.div
            className="mt-10"
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.55, ease }}
          >
            <Breathe scale={1.045} duration={3.6}>
              <Pill href="/visual-studio">Enter the visual studio</Pill>
            </Breathe>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
