"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Thin "blueprint" linework that sits behind a section's content: lines that
 * draw themselves in and small marker shapes at their ends. Coordinates are
 * percentages of the section, so the drawing stretches with the layout while
 * the markers keep their shape.
 */

const ease = [0.22, 1, 0.36, 1] as const;
const INK = "#ffffff";
const GOLD = "#f5b82e";

type Pct = `${number}%`;
export type MarkShape = "square" | "circle" | "diamond" | "plus" | "triangle" | "hex";

export function Blueprint({ children, className = "-z-10" }: { children: ReactNode; className?: string }) {
  return (
    <svg className={`pointer-events-none absolute inset-0 size-full overflow-visible ${className}`} aria-hidden="true">
      {children}
    </svg>
  );
}

export function Line({
  x1,
  y1,
  x2,
  y2,
  delay = 0,
  dashed = false,
  opacity = 0.4,
  desktopOnly = false,
}: {
  x1: Pct;
  y1: Pct;
  x2: Pct;
  y2: Pct;
  delay?: number;
  dashed?: boolean;
  opacity?: number;
  /** Hide on phones, where the content fills the width and the line would cross text. */
  desktopOnly?: boolean;
}) {
  const reduced = useReducedMotion();
  const common = { className: desktopOnly ? "max-lg:hidden" : undefined, x1, y1, x2, y2, stroke: INK, strokeOpacity: opacity, strokeWidth: 1, vectorEffect: "non-scaling-stroke" as const };

  // Dashes and pathLength both use stroke-dasharray, so dashed lines fade in instead of drawing.
  if (dashed) {
    return (
      <motion.line
        {...common}
        strokeDasharray="4 7"
        initial={reduced ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: reduced ? 0 : 1.2, delay: reduced ? 0 : delay }}
      />
    );
  }
  return (
    <motion.line
      {...common}
      initial={reduced ? false : { pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true }}
      transition={{ duration: reduced ? 0 : 1.3, delay: reduced ? 0 : delay, ease }}
    />
  );
}

function shapeFor(shape: MarkShape, size: number) {
  const h = size / 2;
  switch (shape) {
    case "square":
      return <rect x={-h} y={-h} width={size} height={size} />;
    case "circle":
      return <circle r={h} />;
    case "diamond":
      return <polygon points={`0,${-h} ${h},0 0,${h} ${-h},0`} />;
    case "triangle":
      return <polygon points={`0,${-h} ${h},${h * 0.8} ${-h},${h * 0.8}`} />;
    case "hex": {
      const points = Array.from({ length: 6 }, (_, i) => {
        const a = ((60 * i - 30) * Math.PI) / 180;
        return `${(h * Math.cos(a)).toFixed(2)},${(h * Math.sin(a)).toFixed(2)}`;
      }).join(" ");
      return <polygon points={points} />;
    }
    case "plus":
      return <path d={`M${-h} 0H${h}M0 ${-h}V${h}`} />;
  }
}

export function Mark({
  x,
  y,
  shape,
  size = 14,
  filled = false,
  gold = false,
  spin = 0,
  delay = 0.6,
  opacity = 0.85,
  desktopOnly = false,
}: {
  x: Pct;
  y: Pct;
  shape: MarkShape;
  size?: number;
  filled?: boolean;
  gold?: boolean;
  /** Seconds per full turn; 0 keeps it still. */
  spin?: number;
  delay?: number;
  opacity?: number;
  /** Hide on phones, where the content fills the width and the mark would sit on text. */
  desktopOnly?: boolean;
}) {
  const reduced = useReducedMotion();
  const color = gold ? GOLD : INK;
  const solid = filled && shape !== "plus";

  return (
    <svg x={x} y={y} overflow="visible" className={desktopOnly ? "max-lg:hidden" : undefined}>
      <motion.g
        initial={reduced ? false : { scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity }}
        viewport={{ once: true }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 16, delay }}
      >
        <motion.g
          fill={solid ? color : "none"}
          stroke={solid ? "none" : color}
          strokeWidth={1.5}
          strokeLinecap="round"
          animate={reduced || !spin ? undefined : { rotate: 360 }}
          transition={reduced || !spin ? undefined : { duration: spin, repeat: Infinity, ease: "linear" }}
        >
          {shapeFor(shape, size)}
        </motion.g>
      </motion.g>
    </svg>
  );
}

export function Ring({
  cx,
  cy,
  r,
  dashed = false,
  opacity = 0.16,
  delay = 0.2,
}: {
  cx: Pct;
  cy: Pct;
  r: number;
  dashed?: boolean;
  opacity?: number;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const common = { cx, cy, r, fill: "none", stroke: INK, strokeOpacity: opacity, strokeWidth: 1, vectorEffect: "non-scaling-stroke" as const };

  if (dashed) {
    // Marching dashes: the ring appears to turn slowly.
    return (
      <motion.circle
        {...common}
        strokeDasharray="2 10"
        initial={reduced ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        animate={reduced ? undefined : { strokeDashoffset: [0, -240] }}
        transition={reduced ? { duration: 0 } : { opacity: { duration: 1.2, delay }, strokeDashoffset: { duration: 30, repeat: Infinity, ease: "linear" } }}
      />
    );
  }
  return (
    <motion.circle
      {...common}
      initial={reduced ? false : { pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true }}
      transition={{ duration: reduced ? 0 : 2, delay: reduced ? 0 : delay, ease }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* One drawing per section, each with its own shapes                   */
/* ------------------------------------------------------------------ */

/** Hero: a turning dashed halo behind the logo, with scattered plus and hex marks. */
export function HeroLines() {
  return (
    <Blueprint>
      <Ring cx="50%" cy="58%" r={330} dashed opacity={0.22} />
      <Ring cx="50%" cy="58%" r={250} opacity={0.08} delay={0.6} />
      <Mark x="13%" y="72%" shape="plus" size={18} spin={18} opacity={0.6} desktopOnly />
      <Mark x="87%" y="66%" shape="plus" size={14} spin={14} opacity={0.5} desktopOnly />
      <Mark x="84%" y="26%" shape="hex" size={22} spin={26} gold opacity={0.7} desktopOnly />
      <Mark x="16%" y="30%" shape="hex" size={12} opacity={0.5} desktopOnly />
    </Blueprint>
  );
}

/** Artist: a dashed margin rule with dot ends, and a few loose marks. */
export function ArtistLines() {
  return (
    <Blueprint>
      <Line x1="3.5%" y1="10%" x2="3.5%" y2="88%" dashed opacity={0.3} />
      <Mark x="3.5%" y="10%" shape="circle" size={8} filled delay={0.4} />
      <Mark x="3.5%" y="88%" shape="circle" size={8} filled delay={0.8} />

      <Mark x="47%" y="12%" shape="plus" size={16} spin={20} opacity={0.55} desktopOnly />
      <Mark x="50%" y="70%" shape="triangle" size={16} spin={24} opacity={0.45} desktopOnly />
    </Blueprint>
  );
}

/** Visual studio: a ring around the title and a dashed base line with hexagon ends. */
export function StudioLines() {
  return (
    <Blueprint className="">
      <Ring cx="50%" cy="50%" r={290} opacity={0.14} />
      <Line x1="28%" y1="88%" x2="72%" y2="88%" dashed opacity={0.35} />
      <Mark x="28%" y="88%" shape="hex" size={14} spin={22} />
      <Mark x="72%" y="88%" shape="hex" size={14} spin={22} />
      <Mark x="50%" y="88%" shape="square" size={7} filled gold delay={1} />

      <Mark x="18%" y="58%" shape="triangle" size={18} spin={28} opacity={0.5} desktopOnly />
      <Mark x="82%" y="46%" shape="plus" size={18} spin={16} opacity={0.55} desktopOnly />
    </Blueprint>
  );
}
