"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArtistSection, type ArtistDetails } from "@/components/home/ArtistSection";
import { StudioLines } from "@/components/home/Blueprint";
import { HeroInvitation, type HeroDetails } from "@/components/home/HeroInvitation";
import { PartnersSection } from "@/components/home/PartnersSection";
import { RegistrationSection } from "@/components/home/RegistrationSection";
import { Breathe, Pill, Words } from "@/components/home/motion";

const REGISTER_URL = "https://docs.google.com/forms/d/e/1FAIpQLScJrtDPSeN8l8QRCyX8wmvbngY8xdzHA-HAkkO5bKeULOs5SA/viewform";

const ease = [0.22, 1, 0.36, 1] as const;

export type HomeEvent = {
  title: string;
  startsAt: string | null;
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
    <div className="bg-[#06102e] text-[#f3f7ff]">
      <HeroInvitation details={hero} registerUrl={REGISTER_URL} />

      <ArtistSection artist={artist} />

      <PartnersSection />

      {event && <RegistrationSection event={event} registerUrl={REGISTER_URL} />}

      <section className="relative isolate min-h-[92svh] overflow-hidden border-t border-white/10">
        <motion.div
          className="absolute -inset-[8%]"
          aria-hidden="true"
          initial={false}
          animate={reduced ? undefined : { scale: [1, 1.08, 1], x: ["-1.5%", "1.5%", "-1.5%"] }}
          transition={reduced ? undefined : { duration: 28, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image src="/imgbg/meta3d.jpg" alt="" fill sizes="100vw" className="object-cover object-[68%_center] [filter:hue-rotate(-55deg)_saturate(0.85)]" />
        </motion.div>
        <div className="absolute inset-0 bg-[#06102e]/30" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06102e]/75 via-transparent to-[#06102e]/35" aria-hidden="true" />
        <StudioLines />
        <div className="relative mx-auto flex min-h-[92svh] max-w-3xl flex-col items-center justify-center px-6 py-32 text-center sm:py-40">
          <motion.p
            className="text-xs font-semibold uppercase tracking-[0.42em] text-[#f5d08a]"
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
                {line === "collection" ? <span className="text-hues">{line}</span> : line}
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
