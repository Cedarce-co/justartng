"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Great_Vibes } from "next/font/google";
import { Blueprint, Mark, Ring } from "@/components/home/Blueprint";

const script = Great_Vibes({ subsets: ["latin"], weight: "400", display: "swap" });
const ease = [0.22, 1, 0.36, 1] as const;

/** The cream of the flyer paper, which every logo image still carries as its background. */
const PAPER = "#f5f0d1";

type Partner = { name: string; file: string; width: number; height: number };

/* Logos live in public/partnerImages, cut from the Hues That Heal 2.0 flyer. */
const PARTNERS: Partner[] = [
  { name: "Foursquare Gospel Church, Oniru, Lagos", file: "foursquare-gospel-church.png", width: 648, height: 210 },
  { name: "Whytecleon HR Consulting and Outsourcing", file: "whytecleon.png", width: 348, height: 156 },
  { name: "Wanni Fuga", file: "wanni-fuga.png", width: 198, height: 222 },
  { name: "FAAN, Funke Akindele Network", file: "faan.png", width: 396, height: 126 },
  { name: "Elysian Womens", file: "elysian-womens.png", width: 300, height: 192 },
  { name: "Garm & Paper", file: "garm-and-paper.png", width: 354, height: 138 },
  { name: "Orchid Tree", file: "orchid-tree.png", width: 354, height: 132 },
  { name: "Peace, Progress and Unity Global Initiative", file: "pvp-global.png", width: 216, height: 210 },
  { name: "One House", file: "one-house.png", width: 342, height: 174 },
  { name: "PIK Entertainment", file: "pik-entertainment.png", width: 528, height: 90 },
  { name: "Wazobia TV", file: "wazobia-tv.png", width: 378, height: 186 },
  { name: "Wazobia Max TV", file: "wazobia-max-tv.png", width: 360, height: 168 },
  { name: "News Central", file: "news-central.png", width: 228, height: 180 },
  { name: "Upgrade TV", file: "upgrade-tv.png", width: 234, height: 168 },
  { name: "Spark Frame", file: "spark-frame.png", width: 378, height: 156 },
  { name: "Mediaboss Africa", file: "mediaboss-africa.png", width: 312, height: 120 },
];

/** Seconds per logo in the line; sets the medium glide speed. */
const SECONDS_PER_LOGO = 4.5;

function LogoItem({ partner, hidden }: { partner: Partner; hidden: boolean }) {
  return (
    <li className={`flex shrink-0 items-center px-5 sm:px-7 ${hidden ? "motion-reduce:hidden" : ""}`} aria-hidden={hidden || undefined}>
      <Image
        src={`/partnerImages/${partner.file}`}
        alt={hidden ? "" : partner.name}
        width={partner.width}
        height={partner.height}
        sizes="(min-width: 640px) 288px, 224px"
        className="h-12 w-auto max-w-[14rem] object-contain transition-transform duration-500 ease-out hover:scale-110 sm:h-20 sm:max-w-[18rem]"
      />
    </li>
  );
}

export function PartnersSection() {
  const reduced = useReducedMotion();
  const rise = (delay: number, y = 24) => ({
    initial: reduced ? false : { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.5 },
    transition: { duration: reduced ? 0 : 0.8, delay: reduced ? 0 : delay, ease },
  });

  return (
    <section
      id="partners"
      aria-labelledby="partners-title"
      className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#040b24_0%,#08143d_50%,#040b24_100%)] py-24 text-white sm:py-32"
    >
      {/* Warm gold glow: a thank-you light behind the band */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[62%] -z-10 h-[30rem] w-[64rem] max-w-[150vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(245,184,46,0.18),rgba(23,72,196,0.18)_55%,transparent)] blur-2xl"
        aria-hidden="true"
        animate={reduced ? undefined : { opacity: [0.7, 1, 0.7], scale: [1, 1.06, 1] }}
        transition={reduced ? undefined : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <Blueprint>
        <Ring cx="50%" cy="22%" r={180} dashed opacity={0.18} />
        <Mark x="8%" y="18%" shape="diamond" size={14} filled gold />
        <Mark x="92%" y="14%" shape="hex" size={20} spin={24} opacity={0.6} />
        <Mark x="14%" y="90%" shape="plus" size={16} spin={18} opacity={0.5} desktopOnly />
        <Mark x="88%" y="92%" shape="triangle" size={16} spin={26} opacity={0.5} desktopOnly />
      </Blueprint>

      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <motion.p className="text-xs font-semibold uppercase tracking-[0.42em] text-[#f5d08a]" {...rise(0, 14)}>
          {/* With gratitude */}
        </motion.p>
        <motion.h2 id="partners-title" className="font-display mt-4 text-[clamp(2.8rem,8vw,5.5rem)] font-bold leading-none tracking-[-0.035em]" {...rise(0.1, 30)}>
          Supported <span className={`${script.className} text-hues inline-block px-[0.15em] pb-[0.15em] font-normal tracking-normal`}>by</span>
        </motion.h2>
      </div>

      {/* The band runs the full page width; its content sits in the middle 90%.
          Logos glide in from the right and disappear into the divider on the left. */}
      <motion.div
        className="mt-14 w-full border-y border-[#f5b82e]/50 text-[#0a1f5c] shadow-[0_30px_80px_rgba(2,8,30,0.55)] sm:mt-16"
        style={{ backgroundColor: PAPER }}
        {...rise(0.3, 40)}
      >
        <div className="mx-auto flex w-[90%] flex-col lg:flex-row lg:items-stretch">
          <div className="flex shrink-0 flex-col justify-center gap-1 px-6 pb-2 pt-7 text-center lg:w-56 lg:px-0 lg:py-10 lg:pr-8 lg:text-left">
            <p className="text-lg font-semibold leading-snug sm:text-xl">Standing with us,</p>
            <p className="text-lg font-semibold leading-snug sm:text-xl">
              <span className="bg-[linear-gradient(transparent_62%,rgba(245,184,46,0.75)_62%,rgba(245,184,46,0.75)_92%,transparent_92%)] px-0.5">
                all our partners
              </span>
            </p>
          </div>

          <span className="mx-6 h-px bg-[#0a1f5c]/15 lg:mx-0 lg:my-8 lg:h-auto lg:w-px" aria-hidden="true" />

          <div className="group/row relative min-w-0 flex-1 overflow-hidden py-6 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] sm:py-8">
            <ul
              className="flex w-max animate-[partners-marquee_var(--duration)_linear_infinite] group-hover/row:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-6"
              style={{ ["--duration" as string]: `${PARTNERS.length * SECONDS_PER_LOGO}s` }}
              aria-label="Partners"
            >
              {/* Two identical copies; the track slides by exactly one, so the loop is seamless. */}
              {[0, 1].map((copy) =>
                PARTNERS.map((partner, i) => <LogoItem key={`${copy}-${i}`} partner={partner} hidden={copy === 1} />),
              )}
            </ul>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
