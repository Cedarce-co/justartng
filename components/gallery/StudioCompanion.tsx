"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { galleryBus } from "@/components/gallery/bus";
import type { HungWork } from "@/components/gallery/Scene";
import { GLASS } from "@/components/gallery/StudioGuide";
import type { Room } from "@/lib/content";
import { DOOR, hangWork } from "@/lib/gallery";

/*
 * The studio companion: a friendly guide that stays with the visitor the whole time.
 * It pops in with short, animated notes as they walk: welcomes, nudges when they are
 * near a painting or the door, little questions with tap-to-answer replies, progress
 * through the room, and a goodbye when they leave.
 */

type Action = { label: string; run: () => void };
/** One line of the chat so far: something the guide said, or the visitor's reply. */
type Line = { from: "guide" | "you"; text: string };
type Note = { key: string; text: string; actions?: Action[]; ttl?: number; spot?: string; history?: Line[] };

/*
 * Where a note can appear. Each note takes a different spot from the last, so the guide
 * pops up around the room. The avatar (bottom centre) and the menu bar are always left clear.
 * Centred spots use margins, not translate, because the pop-in animation owns the transform.
 */
const SPOTS = {
  // Desktop, nothing else open: almost anywhere.
  wide: ["left-5 top-24", "right-5 top-24", "inset-x-0 mx-auto top-[22%]", "left-5 top-[42%]", "right-5 top-[38%]", "left-5 bottom-5", "right-5 bottom-20"],
  // Desktop, the details card fills the bottom right: stay left and up.
  wideCard: ["left-5 top-24", "left-5 top-[42%]", "left-5 bottom-5", "inset-x-0 mx-auto top-24"],
  // Phones, nothing else open: up and down the screen, nudged left or right.
  narrow: ["left-3 right-3 top-[4.6rem]", "left-3 right-10 top-[28%]", "left-10 right-3 top-[44%]", "left-3 right-10 top-[16%]", "left-10 right-3 bottom-[22%]"],
  // Phones, the details card sits bottom left: stay in the top half.
  narrowCard: ["left-3 right-3 top-[4.6rem]", "left-10 right-3 top-[22%]", "left-3 right-10 top-[34%]"],
};

function spotsFor(viewing: boolean) {
  if (galleryBus.wide) return viewing ? SPOTS.wideCard : SPOTS.wide;
  return viewing ? SPOTS.narrowCard : SPOTS.narrow;
}

/** A spot from the right set, never the same as the last one. */
function pickSpot(viewing: boolean, last: string | undefined) {
  const options = spotsFor(viewing).filter((spot) => spot !== last);
  return options[Math.floor(Math.random() * options.length)];
}

/** Seconds between notes: contextual nudges can come sooner than general chatter. */
const GAP_CONTEXT = 7;
const GAP_GENERAL = 16;
const IDLE_SECONDS = 25;
const TYPING_MS = 750;

function GuideIcon() {
  const reduced = useReducedMotion();
  return (
    <motion.span
      className="grid size-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#f97316,#facc15_50%,#38bdf8)] text-[#12110f] shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
      aria-hidden="true"
      animate={reduced ? undefined : { y: [0, -3, 0], rotate: [0, -6, 0] }}
      transition={reduced ? undefined : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M12 3C7 3 3 6.6 3 11.1c0 4.2 3.5 7.9 7.9 7.9 1.2 0 1.8-.7 1.8-1.6 0-1-.9-1.3-.9-2.3 0-.9.7-1.6 1.8-1.6h2.4C19.7 13.5 21 11.8 21 9.4 21 5.9 17 3 12 3Z" />
        <circle cx="7.8" cy="10.4" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="10.4" cy="6.9" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="14.8" cy="6.9" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    </motion.span>
  );
}

function TypingDots() {
  return (
    <span className="flex h-5 items-center gap-1" aria-label="The guide is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-white/70"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

export function StudioCompanion({
  room,
  nextRoom,
  works,
  viewed,
  active,
  viewing,
  eventDate,
  farewell,
  onVisit,
}: {
  room: Room;
  nextRoom: Room | null;
  works: HungWork[];
  /** Slugs the visitor has stood in front of, in this room. */
  viewed: string[];
  /** True once the avatar is chosen and the first-visit guide is out of the way. */
  active: boolean;
  /** True while a painting's story is open. */
  viewing: boolean;
  eventDate: string | null;
  /** When set, the guide says goodbye with this and stays until the page changes. */
  farewell: string | null;
  onVisit: (index: number) => void;
}) {
  const reduced = useReducedMotion();
  const [note, setNote] = useState<Note | null>(null);
  const [typing, setTyping] = useState(false);
  const shownAt = useRef(0);
  const lastHidden = useRef(0);
  const lastMoveAt = useRef(0);
  const said = useRef(new Set<string>());
  const pool = useRef(0);
  const pendingProgress = useRef<Note | null>(null);
  const state = useRef({ works, viewed, viewing, nextRoom, room, onVisit });
  state.current = { works, viewed, viewing, nextRoom, room, onVisit };
  const noteRef = useRef(note);
  noteRef.current = note;

  const lastSpot = useRef<string | undefined>(undefined);
  // Set when the visitor taps a reply, so the guide's answer continues the same chat in the same spot.
  const replying = useRef<Line[] | null>(null);

  const show = useCallback(
    (next: Note) => {
      said.current.add(next.key);
      const history = replying.current;
      replying.current = null;
      const spot = history && lastSpot.current ? lastSpot.current : pickSpot(state.current.viewing, lastSpot.current);
      lastSpot.current = spot;
      setNote({ ...next, spot, history: history ?? undefined });
      setTyping(!reduced);
      shownAt.current = performance.now();
    },
    [reduced],
  );

  /** The visitor taps a quick reply: it joins the chat as their message, then the guide answers. */
  const answer = useCallback((current: Note, action: Action) => {
    const lines: Line[] = [...(current.history ?? []), { from: "guide", text: current.text }, { from: "you", text: action.label }];
    replying.current = lines.slice(-3);
    action.run();
    replying.current = null;
  }, []);

  const hide = useCallback(() => {
    setNote(null);
    setTyping(false);
    lastHidden.current = performance.now();
  }, []);

  useEffect(() => {
    if (!typing) return;
    const timer = window.setTimeout(() => setTyping(false), TYPING_MS);
    return () => window.clearTimeout(timer);
  }, [typing, note]);

  // Walk to a painting the visitor hasn't seen yet (or any, once they've seen them all).
  const surprise = useCallback(() => {
    const { works: list, viewed: seen, onVisit: visit } = state.current;
    const unseen = list.map((work, index) => ({ work, index })).filter(({ work }) => !seen.includes(work.slug));
    const pick = (unseen.length ? unseen : list.map((work, index) => ({ work, index })))[Math.floor(Math.random() * (unseen.length || list.length))];
    if (pick) visit(pick.index);
    hide();
  }, [hide]);

  const visitSlug = useCallback(
    (slug: string) => {
      const index = state.current.works.findIndex((work) => work.slug === slug);
      if (index >= 0) state.current.onVisit(index);
      else surprise();
      hide();
    },
    [hide, surprise],
  );

  /** General chatter, taken in turn. Some ask a question and answer back. */
  const generalNote = useCallback((): Note => {
    const { room: here } = state.current;
    const notes: (() => Note)[] = [
      () => ({ key: "real-size", text: "Fun fact: every painting in here hangs at its real size." }),
      () => ({
        key: "colour",
        text: "Quick question: which colour keeps catching your eye?",
        ttl: 14000,
        actions: [
          { label: "Orange", run: () => show({ key: "colour-orange", text: "Then The Lion and the Lamb is calling you. Shall we?", actions: [{ label: "Take me there", run: () => visitSlug("the-lion-and-the-lamb") }] }) },
          { label: "Blue", run: () => show({ key: "colour-blue", text: "Blue it is. The Good Fight of Faith has plenty. Want to see?", actions: [{ label: "Take me there", run: () => visitSlug("the-good-fight-of-faith") }] }) },
          { label: "Gold", run: () => show({ key: "colour-gold", text: "Gold lovers usually fall for the Syrophoenician Woman.", actions: [{ label: "Show me", run: () => visitSlug("syrophoenician-woman") }] }) },
        ],
      }),
      () => ({ key: "slow", text: "Take your time. Good art likes a slow look." }),
      () => ({ key: "surprise", text: "Feeling adventurous? I can pick a painting for you.", ttl: 12000, actions: [{ label: "Surprise me", run: surprise }] }),
      () => ({ key: "texture", text: "Walk right up to a painting, then step back. The thick paint changes as you move." }),
      () => ({
        key: "visit",
        text: eventDate ? `Hues That Heal 2.0 opens on ${eventDate}. Will we see you there?` : "Will we see you at the exhibition in person?",
        ttl: 14000,
        actions: [
          { label: "I'll be there!", run: () => show({ key: "visit-yes", text: "Wonderful! Remember to reserve your place on the home page." }) },
          { label: "Maybe", run: () => show({ key: "visit-maybe", text: "No pressure. The studio is open whenever you are." }) },
        ],
      }),
      () => ({ key: "shift", text: "Tip: hold Shift while you walk to move faster." }),
      () => ({ key: "stories", text: `Every painting in ${here.name} has a story. Tap one and read it while you stand there.` }),
    ];
    const next = notes[pool.current % notes.length]();
    pool.current += 1;
    return next;
  }, [eventDate, show, surprise, visitSlug]);

  // Welcome on arrival in each room, once the first-visit guide is out of the way.
  useEffect(() => {
    if (!active || farewell) return;
    const key = `welcome-${room.id}`;
    if (said.current.has(key)) return;
    const timer = window.setTimeout(() => {
      const first = said.current.size === 0;
      show({
        key,
        text: first
          ? `Hi! I'm your studio guide. Welcome to ${room.name}. I'll pop in now and then while you look around.`
          : `You made it to ${room.name}. ${room.subtitle}. Enjoy!`,
      });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [active, farewell, room, show]);

  // Cheer on progress through the room.
  useEffect(() => {
    const total = works.length;
    const count = viewed.length;
    if (!count) return;
    if (count === total) {
      pendingProgress.current = {
        key: `all-${room.id}`,
        text: nextRoom ? `You've seen every painting in ${room.name}! The door behind you leads to ${nextRoom.name}.` : `You've seen every painting in ${room.name}!`,
      };
    } else if (count === 3 || count === Math.ceil(total / 2) || count === total - 1) {
      pendingProgress.current = { key: `progress-${room.id}-${count}`, text: `That's ${count} of ${total} paintings. Keep going!` };
    }
  }, [viewed, works.length, room, nextRoom]);

  // The guide's heartbeat: decide once a second whether to say something.
  useEffect(() => {
    if (!active || farewell) return;
    lastMoveAt.current = performance.now();
    lastHidden.current = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      if (galleryBus.moving) lastMoveAt.current = now;

      const current = noteRef.current;
      if (current) {
        const ttl = current.ttl ?? (current.actions ? 12000 : 6500);
        if (now - shownAt.current > ttl + TYPING_MS) hide();
        return;
      }

      const quiet = (now - lastHidden.current) / 1000;
      const { works: list, viewed: seen, viewing: open, nextRoom: next, room: here } = state.current;
      if (quiet < GAP_CONTEXT) return;

      if (pendingProgress.current && !said.current.has(pendingProgress.current.key)) {
        show(pendingProgress.current);
        pendingProgress.current = null;
        return;
      }
      if (open) return;

      // Near the door
      const doorDistance = Math.hypot(galleryBus.x, galleryBus.z - DOOR.z);
      if (next && doorDistance < 2.6 && !said.current.has(`door-${here.id}`)) {
        show({ key: `door-${here.id}`, text: `This door leads to ${next.name}. Tap it to step through.` });
        return;
      }

      // Standing near a painting they haven't opened yet
      let nearest = -1;
      let best = 2.6;
      list.forEach((work, index) => {
        const place = hangWork(work);
        const distance = Math.hypot(galleryBus.x - place.x, galleryBus.z - place.z);
        if (distance < best && !seen.includes(work.slug) && !said.current.has(`near-${here.id}-${work.slug}`)) {
          best = distance;
          nearest = index;
        }
      });
      if (nearest >= 0) {
        const work = list[nearest];
        show({
          key: `near-${here.id}-${work.slug}`,
          text: `You're standing by “${work.title}”. Want to read its story?`,
          ttl: 10000,
          actions: [{ label: "Read it", run: () => { state.current.onVisit(nearest); hide(); } }],
        });
        return;
      }

      // Standing still for a while
      if ((now - lastMoveAt.current) / 1000 > IDLE_SECONDS && !said.current.has(`idle-${Math.floor(now / 120000)}`)) {
        show({ key: `idle-${Math.floor(now / 120000)}`, text: "Still with me? Tap any painting and I'll walk you over.", ttl: 12000, actions: [{ label: "Surprise me", run: surprise }] });
        return;
      }

      if (quiet >= GAP_GENERAL) show(generalNote());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active, farewell, show, hide, surprise, generalNote]);

  // If a painting's card opens while a note sits where the card goes, glide the note somewhere clear.
  useEffect(() => {
    setNote((current) => {
      if (!current?.spot || spotsFor(viewing).includes(current.spot)) return current;
      const spot = pickSpot(viewing, current.spot);
      lastSpot.current = spot;
      return { ...current, spot };
    });
  }, [viewing]);

  // Say goodbye when the visitor leaves.
  useEffect(() => {
    if (farewell) show({ key: "farewell", text: farewell, ttl: 60000 });
  }, [farewell, show]);

  // The guide talks towards the avatar, who stands at the bottom centre of the screen:
  // a chat on the left of the screen keeps the guide on its right (nearer the avatar), and vice versa.
  const spot = note?.spot ?? "left-3 right-3 top-[4.6rem]";
  const guideOnRight = /^left-5|right-10/.test(spot);

  return (
    <AnimatePresence>
      {(active || farewell) && note && (
        <motion.aside
          key={note.key}
          layout={!reduced}
          aria-live="polite"
          aria-label="Studio guide"
          className={`group absolute z-20 flex flex-col gap-1.5 sm:w-[340px] ${spot}`}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.94, transition: { duration: 0.2 } }}
          transition={reduced ? { duration: 0.01 } : { type: "spring", stiffness: 320, damping: 24 }}
        >
          {/* Earlier lines of this chat: what the guide asked and what the visitor replied */}
          {note.history?.map((line, index) => (
            <Bubble key={index} from={line.from} guideOnRight={guideOnRight} faded>
              {line.text}
            </Bubble>
          ))}

          <Bubble from="guide" guideOnRight={guideOnRight} tail>
            {typing ? (
              <TypingDots />
            ) : (
              <motion.p className="text-sm leading-snug" initial={reduced ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                {note.text}
              </motion.p>
            )}
          </Bubble>

          {/* Quick replies, like suggested answers in a chat app */}
          {!typing && note.actions && (
            <motion.div
              className={`flex flex-wrap gap-2 ${guideOnRight ? "justify-end pr-11" : "pl-11"}`}
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: reduced ? 0 : 0.1 }}
            >
              {note.actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="min-h-9 rounded-full border border-white/40 bg-black/40 px-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black"
                  onClick={() => answer(note, action)}
                >
                  {action.label}
                </button>
              ))}
            </motion.div>
          )}

          {!farewell && (
            <button
              type="button"
              aria-label="Hide this message"
              className={`absolute -top-2 grid size-6 place-items-center rounded-full bg-black/70 text-sm leading-none text-white/70 opacity-100 transition-opacity hover:text-white sm:opacity-0 sm:group-hover:opacity-100 ${guideOnRight ? "left-0" : "right-0"}`}
              onClick={hide}
            >
              &times;
            </button>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/**
 * One chat bubble. The guide's bubbles carry its avatar and a tail; the visitor's sit on the
 * other side in a light bubble, like messages you've sent.
 */
function Bubble({ from, guideOnRight, tail = false, faded = false, children }: { from: "guide" | "you"; guideOnRight: boolean; tail?: boolean; faded?: boolean; children: ReactNode }) {
  const guide = from === "guide";
  // The guide sits on one side, the visitor on the other.
  const onRight = guide ? guideOnRight : !guideOnRight;
  return (
    <div className={`flex items-end gap-2 ${onRight ? "flex-row-reverse" : ""} ${faded ? "opacity-70" : ""}`}>
      {guide ? <span className={tail ? "" : "invisible"}><GuideIcon /></span> : <span className="w-9 shrink-0" aria-hidden="true" />}
      <div className={`flex max-w-[85%] flex-col ${onRight ? "items-end" : "items-start"}`}>
        {/* Who's speaking: shown on the guide's latest message and on each of the visitor's replies */}
        {(tail || !guide) && (
          <span className="mb-0.5 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60 [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
            {guide ? "Studio guide" : "You"}
          </span>
        )}
        <div
          className={`relative rounded-2xl px-3.5 py-2.5 ${
            guide ? `${GLASS} ${onRight ? "rounded-br-md" : "rounded-bl-md"}` : `bg-[#f5d08a] text-[#1a140c] shadow-[0_10px_30px_rgba(0,0,0,0.35)] ${onRight ? "rounded-br-md" : "rounded-bl-md"}`
          }`}
        >
          {children}
          {/* A small tail pointing back towards the speaker's avatar */}
          {tail && guide && (
            <span
              className={`absolute -bottom-1 size-3 rotate-45 bg-black/65 ${onRight ? "-right-0.5 border-b border-r" : "-left-0.5 border-b border-l"} border-white/10`}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  );
}
