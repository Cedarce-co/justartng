"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Room } from "@/lib/content";
import { GLASS } from "@/components/gallery/StudioGuide";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * The studio's menu: a small glass pill with the room's name that opens into
 * a numbered list of the paintings in this room. Rooms are changed through the door, not here.
 */
export function StudioMenu({
  room,
  titles,
  sold = [],
  current,
  open,
  onToggle,
  onPick,
}: {
  room: Room;
  titles: string[];
  /** Per painting, in the same order: true when the original is sold (shown with a red dot). */
  sold?: boolean[];
  current: number;
  open: boolean;
  onToggle: () => void;
  onPick: (index: number) => void;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.nav
      id="tour-menu"
      aria-label="Rooms and paintings"
      className={`pointer-events-auto w-[min(300px,calc(100vw-7rem))] overflow-hidden rounded-2xl ${GLASS}`}
      initial={reduced ? false : { opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28, delay: 0.15 }}
    >
      <button type="button" className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left" aria-expanded={open} onClick={onToggle}>
        <span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">{room.subtitle}</span>
          <span className="block font-display text-base font-semibold leading-tight">{room.name}</span>
        </span>
        <motion.svg
          viewBox="0 0 20 20"
          className="size-4 shrink-0 text-white/70"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduced ? 0 : 0.3, ease }}
        >
          <path d="m5 8 5 5 5-5" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="menu"
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.35, ease }}
          >
            <ol id="tour-list" className="max-h-[min(60vh,28rem)] overflow-auto border-t border-white/10 px-2 pb-3 pt-2">
              {titles.map((title, index) => {
                const here = current === index;
                return (
                  <li key={`${title}-${index}`}>
                    <button
                      type="button"
                      aria-current={here ? "true" : undefined}
                      className={`group flex min-h-10 w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm leading-snug transition-colors hover:bg-white/[0.07] ${here ? "text-white" : "text-white/70 hover:text-white"}`}
                      onClick={() => onPick(index)}
                    >
                      <span className={`w-5 shrink-0 text-[11px] tabular-nums ${here ? "text-white" : "text-white/40"}`}>{String(index + 1).padStart(2, "0")}</span>
                      <span className="flex-1">
                        {title}
                        {sold[index] && (
                          <>
                            <span className="ml-1.5 inline-block size-1.5 -translate-y-px rounded-full bg-[#e5484d] align-middle" aria-hidden="true" />
                            <span className="sr-only"> (sold)</span>
                          </>
                        )}
                      </span>
                      {here && <span className="size-1.5 rounded-full bg-white" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
