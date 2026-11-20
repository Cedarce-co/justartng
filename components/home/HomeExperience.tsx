"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArtistSection, type ArtistDetails } from "@/components/home/ArtistSection";
import { CountdownToast } from "@/components/home/CountdownToast";
import { DragToEnter } from "@/components/home/DragToEnter";
import { StudioInvite } from "@/components/home/StudioInvite";
import { StudioLines } from "@/components/home/Blueprint";
import { HeroInvitation, type HeroDetails } from "@/components/home/HeroInvitation";
import { PartnersSection } from "@/components/home/PartnersSection";
import { RegistrationSection } from "@/components/home/RegistrationSection";
import { Breathe, Words } from "@/components/home/motion";
import { useStudioOpen } from "@/components/home/useStudioOpen";

const REGISTER_URL = "https://docs.google.com/forms/d/e/1FAIpQLScJrtDPSeN8l8QRCyX8wmvbngY8xdzHA-HAkkO5bKeULOs5SA/viewform";

const ease = [0.22, 1, 0.36, 1] as const;

/** "Sunday 29 November", in Lagos time. */
const openingDay = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lagos" });

export type StudioDetails = {
  count: number;
  room: string;
  subtitle: string;
  /** Whether the studio was open when the page was made; the page keeps checking after that. */
  open: boolean;
  opensAt: number;
  rooms: { id: string; name: string; subtitle: string; href: string }[];
};

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
  studio: StudioDetails;
}) {
  const reduced = useReducedMotion();
  const roomLine = `${studio.room}: the paintings of ${studio.subtitle}, in 3D.`;
  // Before the opening day the studio is only announced: no ways in. On the day, everything below switches on.
  const open = useStudioOpen(studio.opensAt, studio.open);
  const [main, ...others] = studio.rooms;
  const roomNames = studio.rooms.map((room) => room.name);
  const roomList = `${roomNames.slice(0, -1).join(", ")} and ${roomNames.at(-1)}`;

  return (
    <div className="bg-[#06102e] text-[#f3f7ff]">
      <HeroInvitation details={hero} registerUrl={REGISTER_URL} />

      {open && <StudioInvite />}

      {/* Always in the corner: the countdown, plus "Register now" until they've clicked through. */}
      {event && <CountdownToast startsAt={event.startsAt} registerUrl={REGISTER_URL} />}

      <ArtistSection artist={artist} studioOpen={open} />

      <PartnersSection />

      {event && <RegistrationSection event={event} registerUrl={REGISTER_URL} />}

      <section id="studio" className="relative isolate min-h-[92svh] overflow-hidden border-t border-white/10">
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
            3D Exhibition Studio
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
            {[open ? "Walk the" : "Anticipate the", "collection"].map((line) => (
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
          {!open ? (
            <>
              <Breathe className="mt-3" scale={1.02} duration={6.6} delay={0.4}>
                <Words text="A 3D studio for exploring the art collection." className="max-w-lg text-lg leading-relaxed text-white/85 sm:text-xl" />
              </Breathe>
              <motion.p
                className="mt-4 max-w-md text-base leading-relaxed text-white/70"
                initial={reduced ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.45, ease }}
              >
                Walk the rooms of {roomList}, and stand in front of each work at its real size, from wherever you are.
              </motion.p>
              {/* The date, as a badge rather than a button: there's nothing to open yet. */}
              <motion.p
                className="mt-10 inline-flex items-center gap-2.5 rounded-full border border-[#f5b82e]/40 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#f5d08a] backdrop-blur-sm sm:text-sm"
                initial={reduced ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.55, ease }}
              >
                <span className="size-2 rounded-full bg-[#f5b82e]" aria-hidden="true" />
                Opens {openingDay.format(studio.opensAt)}
              </motion.p>
            </>
          ) : (
            <>
          <Breathe className="mt-3" scale={1.02} duration={6.6} delay={0.4}>
            <Words text={roomLine} className="max-w-lg text-lg leading-relaxed text-white/85 sm:text-xl" />
          </Breathe>
          <motion.p
            className="mt-4 max-w-md text-base leading-relaxed text-white/70"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.45, ease }}
          >
            The art collection is hung in a 3D studio. Choose an avatar, walk the room and stand in front of each painting, at its real size.
            {others.length > 0 && <> Through the door: {others.map((room) => room.name).join(" and ")}.</>}
          </motion.p>
          <motion.div
            className="mt-10 flex w-full flex-col items-center gap-3"
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.55, ease }}
          >
            {main && <DragToEnter href={main.href} hint="Drag to enter the 3D studio" label="Walk the Hues That Heal 2.0 collection" />}
            {/* The other rooms, each with its own way in */}
            {others.length > 0 && (
              <div className="grid w-full max-w-lg gap-3 sm:grid-cols-2">
                {others.map((room) => (
                  <DragToEnter key={room.id} size="sm" href={room.href} hint="Drag to enter" label={room.name} />
                ))}
              </div>
            )}
          </motion.div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
