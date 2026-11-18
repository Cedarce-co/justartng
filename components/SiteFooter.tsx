"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { site } from "@/lib/content";
import { publicText } from "@/lib/format";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SiteFooter() {
  const home = usePathname() === "/";
  const reduced = useReducedMotion();
  const email = publicText(site.email);
  const instagram = site.socials.find((link) => link.label.toLowerCase() === "instagram")?.url ?? "https://www.instagram.com/lekanswanky/";
  return (
    <motion.footer
      className={home ? "mt-auto border-t border-white/15 bg-[#06102e]/80 text-white/60 backdrop-blur-xl" : "mt-auto border-t border-line"}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: reduced ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Three equal columns: the show on the left, follow in the middle, credit on the right. Stacked and centred on phones. */}
      <div className={`mx-auto grid max-w-6xl items-center gap-5 px-5 py-6 text-sm sm:grid-cols-3 sm:px-8 ${home ? "" : "text-muted"}`}>
        <p className="flex items-center justify-center gap-3 sm:justify-start">
          <Image src="/imgbg/heusnobg.png" alt="Hues That Heal" width={707} height={353} className="h-10 w-auto" />
          <span>Paintings by {site.artist}.</span>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {email && (
            <a className="underline-offset-4 hover:underline" href={`mailto:${email}`}>
              {email}
            </a>
          )}
          <p className="flex items-center gap-2">
            Follow us:
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="grid size-9 place-items-center rounded-full border border-current/30 transition-colors hover:bg-white hover:text-[#06102e]"
            >
              <InstagramIcon />
            </a>
          </p>
        </div>
        <p className="flex items-center justify-center gap-2 sm:justify-end">
          Design by
          <Image src="/imgbg/cedarce-logowhitetext-transparent.png" alt="Cedarce" width={1037} height={240} className="h-5 w-auto" />
        </p>
      </div>
    </motion.footer>
  );
}
