"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { site } from "@/lib/content";
import { publicText } from "@/lib/format";

export function SiteFooter() {
  const home = usePathname() === "/";
  const reduced = useReducedMotion();
  const email = publicText(site.email);
  return (
    <motion.footer
      className={home ? "mt-auto border-t border-white/15 bg-[#12061c]/80 text-white/60 backdrop-blur-xl" : "mt-auto border-t border-line"}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: reduced ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={`mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm sm:px-8 ${home ? "" : "text-muted"}`}>
        <p>
          <span className="font-display font-semibold uppercase tracking-[-0.05em] text-current">JUST ART</span>
          <span className="mx-2">·</span>
          Paintings by {site.artist}.
        </p>
        {email ? (
          <a className="underline-offset-4 hover:underline" href={`mailto:${email}`}>
            {email}
          </a>
        ) : (
          <a className="underline-offset-4 hover:underline" href="https://www.instagram.com/lekanswanky?utm_source=ig_web_button_share_sheet&vrfl=ZDNlZDc0MzIxNw==">Follow us on Instagram</a>
        )}
      </div>
    </motion.footer>
  );
}
