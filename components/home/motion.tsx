"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export function Breathe({
  children,
  className,
  delay = 0,
  scale = 1.03,
  duration = 5.2,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  scale?: number;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      animate={reduced ? undefined : { scale: [1, scale, 1] }}
      transition={reduced ? undefined : { duration, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {children}
    </motion.div>
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: reduced ? 0 : 0.75, delay: reduced ? 0 : delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function Words({
  text,
  className,
  as: Tag = "p",
  play = "view",
}: {
  text: string;
  className?: string;
  as?: "p" | "h2";
  play?: "load" | "view";
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  const MotionTag = Tag === "h2" ? motion.h2 : motion.p;
  return (
    <MotionTag
      className={className}
      initial="hidden"
      animate={play === "load" ? "show" : undefined}
      whileInView={play === "view" ? "show" : undefined}
      viewport={{ once: true, amount: 0.5 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduced ? 0 : 0.04, delayChildren: reduced ? 0 : 0.05 } },
      }}
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="inline-block"
          variants={{
            hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 16 },
            show: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.5, ease } },
          }}
        >
          {word}
          {index < words.length - 1 ? "\u00a0" : ""}
        </motion.span>
      ))}
    </MotionTag>
  );
}

const lineVariants: Variants = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

export function HeroTitle() {
  const reduced = useReducedMotion();
  return (
    <Breathe className="origin-left" scale={1.018} duration={6.8}>
    <motion.h1
      className="font-display mt-6 text-[clamp(3.4rem,11vw,7.4rem)] font-semibold leading-[0.88] tracking-[-0.04em] text-white"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduced ? 0 : 0.12, delayChildren: reduced ? 0 : 0.15 } },
      }}
    >
      <motion.span className="block" variants={reduced ? undefined : lineVariants}>
        Anticipate
      </motion.span>
      <motion.span className="mt-1 flex items-center gap-4 sm:gap-6" variants={reduced ? undefined : lineVariants}>
        <motion.span
          className="hidden h-[3px] w-16 shrink-0 origin-left overflow-hidden sm:block"
          aria-hidden="true"
          initial={reduced ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.45, ease }}
        >
          <motion.span
            className="block h-full w-full bg-white"
            animate={reduced ? undefined : { opacity: [0.45, 1, 0.45] }}
            transition={reduced ? undefined : { duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
        </motion.span>
        hues that
      </motion.span>
      <motion.span className="block" variants={reduced ? undefined : lineVariants}>
        heal
      </motion.span>
    </motion.h1>
    </Breathe>
  );
}

const MotionLink = motion.create(Link);
const MotionAnchor = motion.create("a");

export function Pill({
  href,
  children,
  external = false,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  const reduced = useReducedMotion();
  const className =
    "group inline-flex min-h-12 items-center gap-4 rounded-full border border-white/25 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:border-white hover:bg-white hover:text-[#12110f]";
  const motionProps = {
    className,
    whileHover: reduced ? undefined : { scale: 1.045 },
    whileTap: reduced ? undefined : { scale: 0.96 },
    transition: { type: "spring" as const, stiffness: 420, damping: 22 },
  };
  const arrow = (
    <span className="grid size-7 place-items-center rounded-full border border-current transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
      →
    </span>
  );
  if (external) {
    return (
      <MotionAnchor href={href} target="_blank" rel="noopener noreferrer" {...motionProps}>
        {children}
        {arrow}
      </MotionAnchor>
    );
  }
  return (
    <MotionLink href={href} {...motionProps}>
      {children}
      {arrow}
    </MotionLink>
  );
}
