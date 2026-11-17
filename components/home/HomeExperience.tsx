"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { EventReel } from "@/components/home/EventReel";
import { Breathe, HeroTitle, Pill, Reveal, Words } from "@/components/home/motion";

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
  art,
  event,
  studio,
}: {
  art: { src: string; alt: string; width: number; height: number };
  event: HomeEvent | null;
  studio: { count: number; bodies: string[] };
}) {
  const reduced = useReducedMotion();
  const description = event?.description ?? "A faith-based art exhibition by Olalekan Isiaka.";
  const bodies = new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(studio.bodies);

  return (
    <div className="bg-[#14071c] text-[#f7f2fb]">
      <section className="relative overflow-hidden px-5 pb-16 pt-28 sm:px-10 sm:pt-32 lg:min-h-[100svh] lg:pb-20">
        <motion.div
          className="pointer-events-none absolute -left-24 top-10 size-80 rounded-full bg-[#7c3aed]/30 blur-3xl"
          aria-hidden="true"
          animate={reduced ? undefined : { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={reduced ? undefined : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute bottom-0 right-0 size-96 rounded-full bg-[#e879f9]/20 blur-3xl"
          aria-hidden="true"
          animate={reduced ? undefined : { scale: [1, 1.16, 1], opacity: [0.55, 1, 0.55] }}
          transition={reduced ? undefined : { duration: 9.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />
        <div className="mx-auto grid max-w-6xl items-end gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <motion.p
              className="text-xs font-semibold uppercase tracking-[0.35em] text-[#f0abfc]"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.6, ease }}
            >
              The gathering
            </motion.p>
            <HeroTitle />
            <Breathe className="mt-8 max-w-md origin-left" scale={1.015} duration={6.2} delay={0.4}>
              <Words text={description} play="load" className="text-base leading-relaxed text-white/65 sm:text-lg" />
            </Breathe>
            <motion.div
              className="mt-10"
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.7, ease }}
            >
              <Breathe className="origin-left" scale={1.045} duration={3.6}>
                <Pill href={REGISTER_URL} external>
                  Register
                </Pill>
              </Breathe>
            </motion.div>
          </div>

          <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
            <motion.div
              className="absolute right-[8%] top-[6%]"
              aria-hidden="true"
              initial={reduced ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduced ? 0 : 0.9, delay: 0.25, ease }}
            >
              <motion.div
                className="size-40 rounded-full border-[14px] border-white/40 bg-white/5 shadow-[0_0_40px_rgba(232,121,249,0.35)] backdrop-blur-md sm:size-52 sm:border-[18px]"
                animate={reduced ? undefined : { y: [0, -10, 0] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
              />
            </motion.div>
            <motion.div
              className="absolute bottom-[8%] right-0"
              aria-hidden="true"
              initial={reduced ? false : { opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: reduced ? 0 : 0.8, delay: 0.35, ease }}
            >
              <Breathe scale={1.06} duration={5.4}>
                <div className="h-36 w-32 border border-white/25 bg-[#d946ef]/30 shadow-[0_0_50px_rgba(217,70,239,0.35)] backdrop-blur-md sm:h-44 sm:w-40" />
              </Breathe>
            </motion.div>
            <motion.div
              className="absolute left-[10%] top-[28%] h-3 w-24 origin-left bg-white"
              aria-hidden="true"
              initial={reduced ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: reduced ? 0 : 0.55, delay: 0.55, ease }}
            />
            <motion.div
              className="absolute bottom-[12%] left-[6%] z-10 w-[78%]"
              initial={reduced ? false : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.9, delay: 0.4, ease }}
            >
              <Breathe scale={1.03} duration={7.2}>
                <Image
                  src={art.src}
                  alt={art.alt}
                  width={art.width}
                  height={art.height}
                  priority
                  sizes="(min-width: 1024px) 36vw, 90vw"
                  className="h-auto w-full shadow-2xl"
                />
              </Breathe>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="artist" className="relative isolate overflow-hidden border-t border-white/10 bg-[#14071c] lg:min-h-[100svh]">
        <motion.div
          className="pointer-events-none absolute inset-y-0 left-0 z-0 hidden lg:block"
          initial={reduced ? false : { opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: reduced ? 0 : 0.9, ease }}
        >
          <motion.div
            className="relative h-[100svh] w-[62vw]"
            animate={reduced ? undefined : { y: [0, -8, 0] }}
            transition={reduced ? undefined : { duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/imgbg/lekanis.png"
              alt="Lekan Isiaka"
              width={428}
              height={582}
              sizes="62vw"
              className="absolute bottom-0 left-[-4vw] !h-[126%] !w-auto !max-w-none"
            />
          </motion.div>
        </motion.div>
        <div className="relative z-10 px-5 py-16 sm:px-10 lg:ml-auto lg:flex lg:min-h-[100svh] lg:w-[44%] lg:flex-col lg:justify-center lg:px-0 lg:py-16 lg:pr-[max(2.5rem,calc((100vw-72rem)/2))]">
          <motion.div
            className="relative mx-auto h-[78svh] w-full max-w-lg lg:hidden"
            initial={reduced ? false : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: reduced ? 0 : 0.9, ease }}
          >
            <Image
              src="/imgbg/lekanis.png"
              alt="Lekan Isiaka"
              fill
              sizes="90vw"
              className="object-contain object-bottom"
            />
          </motion.div>
          <div className="mt-10 max-w-xl text-right lg:ml-auto lg:mt-0">
            <Reveal>
              <h2 className="font-display text-[clamp(3.6rem,6.2vw,6.4rem)] font-semibold leading-[0.86] tracking-[-0.045em] text-white">
                <span className="block text-transparent" style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.95)" }}>
                  Meet
                </span>
                <span className="mt-1 block">Lekan</span>
                <span className="block">Isiaka</span>
              </h2>
              <span className="ml-auto mt-6 block h-[3px] w-16 bg-[#f0abfc]" aria-hidden="true" />
            </Reveal>
            <Reveal delay={0.08}>
              <Breathe className="mt-6 origin-right" scale={1.012} duration={6.4}>
                <p className="ml-auto max-w-md text-base leading-relaxed text-white/80 sm:text-lg">
                  In a world where art is often created for display, Olalekan “Swanky” Isiaka creates for something deeper — healing. His colours are not chosen for beauty alone but for the quiet prayers they carry. In Hues That Heal, his debut exhibition, each stroke feels like scripture; each canvas a whisper between the soul and the divine.
                </p>
              </Breathe>
            </Reveal>
          </div>
        </div>
        <div className="relative z-10 px-5 pb-12 sm:px-10 lg:absolute lg:bottom-10 lg:left-[max(2.5rem,calc((100vw-72rem)/2))] lg:max-w-xs lg:px-0 lg:pb-0">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white">Olalekan Isiaka</p>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white">Olalekan Isiaka</p>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            Artist
            <br />
            Anticipate Hues that Heal 2.0
          </p>
        </div>
      </section>

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
