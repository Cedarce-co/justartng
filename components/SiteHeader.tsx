"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [{ href: "/visual-studio", label: "Visual Studio" }];
const MotionLink = motion.create(Link);

export function SiteHeader() {
  const home = usePathname() === "/";
  const reduced = useReducedMotion();

  return (
    <motion.header
      className={home ? "absolute inset-x-0 top-0 z-30 border-b border-white/10 bg-[#16081f]/40 text-white backdrop-blur-md" : "border-b border-line"}
      initial={reduced ? false : { opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 sm:px-8">
        <MotionLink
          href="/"
          className="font-display inline-flex min-h-11 items-center text-xl font-semibold lowercase tracking-[-0.06em]"
          whileHover={reduced ? undefined : { scale: 1.04 }}
          whileTap={reduced ? undefined : { scale: 0.96 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          just art
        </MotionLink>
        <nav aria-label="Primary" className="flex flex-wrap items-center">
          {links.map((link) => (
            <MotionLink
              key={link.href}
              href={link.href}
              className={`inline-flex min-h-11 items-center px-2.5 text-sm ${home ? "text-white/80 hover:text-white" : "hover:text-accent"}`}
              whileHover={reduced ? undefined : { y: -2 }}
              whileTap={reduced ? undefined : { scale: 0.96 }}
            >
              {link.label}
            </MotionLink>
          ))}
        </nav>
      </div>
    </motion.header>
  );
}
