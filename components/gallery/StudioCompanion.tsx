"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { galleryBus } from "@/components/gallery/bus";
import type { HungWork } from "@/components/gallery/Scene";
import { GLASS } from "@/components/gallery/StudioGuide";
import { site, type Room } from "@/lib/content";
import { PAYMENT_METHODS } from "@/lib/validation";
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
/** The guide asks the visitor to type an answer, like a chat composer. */
type Ask = { placeholder: string; type?: "text" | "tel"; submit: (value: string) => void };
type Note = {
  key: string;
  text: string;
  actions?: Action[];
  ask?: Ask;
  /** Stays until the conversation moves on, instead of timing out. */
  sticky?: boolean;
  ttl?: number;
  spot?: string;
  history?: Line[];
};

/** The first sentence of a painting's story: Lekan's message in it, in a line. */
function messageOf(writeup: string) {
  const first = writeup.split(/\n\n+/)[0]?.trim() ?? "";
  const sentence = first.match(/^.*?[.!?](\s|$)/)?.[0]?.trim() ?? first;
  return sentence.length > 4 ? sentence : null;
}

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
  current,
  eventDate,
  farewell,
  onVisit,
  onFocusChat,
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
  /** The painting the visitor is standing in front of, if any. */
  current: HungWork | null;
  eventDate: string | null;
  /** When set, the guide says goodbye with this and stays until the page changes. */
  farewell: string | null;
  onVisit: (index: number) => void;
  /** Called when a longer conversation starts, so the studio can clear space for it. */
  onFocusChat?: () => void;
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
      // Replies and the collecting chat ("c-" messages) carry on in the same spot, like one conversation.
      const continuing = Boolean(history) || next.key.startsWith("c-");
      const spot = continuing && lastSpot.current ? lastSpot.current : pickSpot(state.current.viewing, lastSpot.current);
      lastSpot.current = spot;
      setNote({ ...next, spot, history: history ?? undefined });
      setTyping(!reduced);
      shownAt.current = performance.now();
    },
    [reduced],
  );

  /** The visitor replies, by tapping a quick reply or typing: it joins the chat as their message, then the guide answers. */
  const reply = useCallback((asked: Note, words: string, then: () => void) => {
    const lines: Line[] = [...(asked.history ?? []), { from: "guide", text: asked.text }, { from: "you", text: words }];
    replying.current = lines.slice(-3);
    then();
    replying.current = null;
  }, []);
  const answer = useCallback((asked: Note, action: Action) => reply(asked, action.label, action.run), [reply]);

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

  /** General chatter, taken in turn: facts, Lekan's voice, quizzes and questions that answer back. */
  const generalNote = useCallback((): Note => {
    const { room: here } = state.current;
    const goTo = (label: string, slug: string): Action => ({ label, run: () => visitSlug(slug) });
    const notes: (() => Note)[] = [
      () => ({
        key: "why-here",
        text: "So, what brings you to the studio today?",
        ttl: 15000,
        actions: [
          { label: "Faith", run: () => show({ key: "why-faith", text: "Then you're in the right room. Every painting here is a sermon in colour. Start with Hope: it's where the story begins.", actions: [goTo("Show me Hope", "hope")] }) },
          { label: "Love of art", run: () => show({ key: "why-art", text: "A fellow art lover! Look closely at the knife-work: Lekan builds the paint up thick, so it catches light like sculpture." }) },
          { label: "Just curious", run: () => show({ key: "why-curious", text: "Curiosity is the best way in. Let me pick something for you.", actions: [{ label: "Surprise me", run: surprise }] }) },
        ],
      }),
      () => ({ key: "real-size", text: "Fun fact: every painting in here hangs at its real size. Some are taller than you!" }),
      () => ({
        key: "colour",
        text: "Quick question: which colour keeps catching your eye?",
        ttl: 14000,
        actions: [
          { label: "Orange", run: () => show({ key: "colour-orange", text: "Then The Lion and the Lamb is calling you. Shall we?", actions: [goTo("Take me there", "the-lion-and-the-lamb")] }) },
          { label: "Blue", run: () => show({ key: "colour-blue", text: "Blue it is. The Good Fight of Faith has plenty. Want to see?", actions: [goTo("Take me there", "the-good-fight-of-faith")] }) },
          { label: "Gold", run: () => show({ key: "colour-gold", text: "Gold lovers usually fall for the Syrophoenician Woman.", actions: [goTo("Show me", "syrophoenician-woman")] }) },
        ],
      }),
      () => ({ key: "lekan-words", text: `Lekan says: “${site.artistWord}”` }),
      () => ({
        key: "quiz-dove",
        text: "Quiz time! In which painting does a dove come down from heaven?",
        ttl: 16000,
        actions: [
          { label: "The Promise", run: () => show({ key: "quiz-dove-right", text: "Spot on! The dove is the Holy Spirit, the promise Jesus made. Want to see it up close?", actions: [goTo("Take me there", "the-promise")] }) },
          { label: "Hope", run: () => show({ key: "quiz-dove-wrong", text: "Good guess, but it's The Promise. Hope shows the cross and the empty tomb. Want to see the dove?", actions: [goTo("Show me", "the-promise")] }) },
          { label: "Bond", run: () => show({ key: "quiz-dove-wrong2", text: "Not quite: Bond is a mother carrying her baby. The dove is in The Promise.", actions: [goTo("Show me", "the-promise")] }) },
        ],
      }),
      () => ({ key: "slow", text: "Take your time. Good art likes a slow look." }),
      () => ({
        key: "nollywood",
        text: "Did you know? Before these paintings, Lekan designed film sets for Nollywood, like A Tribe Called Judah and Everybody Loves Jenifa.",
        ttl: 14000,
        actions: [
          { label: "No way!", run: () => show({ key: "nollywood-wow", text: "True! That's why his paintings feel like scenes from a story. Every one has a beginning, a middle and a message." }) },
          { label: "I knew that", run: () => show({ key: "nollywood-knew", text: "A true fan! Then you'll spot the set designer's eye in how he frames each moment." }) },
        ],
      }),
      () => ({ key: "surprise", text: "Feeling adventurous? I can pick a painting for you.", ttl: 12000, actions: [{ label: "Surprise me", run: surprise }] }),
      () => ({
        key: "owned",
        text: "Have you ever owned an original painting?",
        ttl: 14000,
        actions: [
          { label: "Yes", run: () => show({ key: "owned-yes", text: "Then you know the feeling. Every painting here is an original you can collect. Tell me when one speaks to you." }) },
          { label: "Not yet", run: () => show({ key: "owned-no", text: "Every collection starts with one. When a painting stops you in your tracks, I'll help you make it yours." }) },
        ],
      }),
      () => ({ key: "theme", text: "This year's theme is Faith Alive: faith that moves beyond words into action. See if you can feel it in each painting." }),
      () => ({
        key: "mood",
        text: "Pick one word for how you feel right now.",
        ttl: 14000,
        actions: [
          { label: "Peaceful", run: () => show({ key: "mood-peace", text: "That's what Lekan hoped for. Stand with Open Gates: The Journey for a minute.", actions: [goTo("Take me there", "open-gates-the-journey")] }) },
          { label: "Inspired", run: () => show({ key: "mood-inspired", text: "Love that! The Good Fight of Faith is pure energy. Go and feel the run.", actions: [goTo("Take me there", "the-good-fight-of-faith")] }) },
          { label: "Curious", run: () => show({ key: "mood-curious", text: "Then Symphonia is your painting: four people, one prayer. What are they praying for?", actions: [goTo("Take me there", "symphonia")] }) },
        ],
      }),
      () => ({ key: "texture", text: "Walk right up to a painting, then step back. The thick paint changes as you move." }),
      () => ({
        key: "soundtrack",
        text: "If this studio had a soundtrack, what would it be?",
        ttl: 14000,
        actions: [
          { label: "Gospel", run: () => show({ key: "sound-gospel", text: "Amen to that! Hope would be the choir's big finish." }) },
          { label: "Afrobeats", run: () => show({ key: "sound-afro", text: "Ha! The Good Fight of Faith would definitely be dancing." }) },
          { label: "Soft piano", run: () => show({ key: "sound-piano", text: "Beautiful. That's the music I hear in Unwavering." }) },
        ],
      }),
      () => ({
        key: "visit",
        text: eventDate ? `Hues That Heal 2.0 opens on ${eventDate}. Will we see you there?` : "Will we see you at the exhibition in person?",
        ttl: 14000,
        actions: [
          { label: "I'll be there!", run: () => show({ key: "visit-yes", text: "Wonderful! Remember to reserve your place on the home page. Seeing them in person is something else." }) },
          { label: "Maybe", run: () => show({ key: "visit-maybe", text: "No pressure. The studio is open whenever you are." }) },
        ],
      }),
      () => ({ key: "challenge", text: "Mini challenge: visit three paintings you haven't seen yet. I'll cheer you on!", ttl: 10000, actions: [{ label: "I'm in!", run: surprise }] }),
      () => ({ key: "shift", text: "Tip: hold Shift while you walk to move faster." }),
      () => ({ key: "stories", text: `Every painting in ${here.name} has a story. Tap one and read it while you stand there.` }),
      () => ({ key: "collect-hint", text: "Psst: every painting here is an original you can collect. Stand in front of one you love and I'll help you." }),
    ];
    const next = notes[pool.current % notes.length]();
    pool.current += 1;
    return next;
  }, [eventDate, show, surprise, visitSlug]);

  /* ---------------------------------------------------------------- */
  /* Collecting a painting: the guide gathers the details in a chat.   */
  /* ---------------------------------------------------------------- */

  type Collecting = { work: HungWork; name: string; phone: string; payment: string; address: string; delivery: string };
  type Step = "name" | "phone" | "payment" | "address" | "delivery" | "date" | "confirm";
  const collecting = useRef<Collecting | null>(null);
  const collected = useRef(new Set<string>());
  const step = useRef<(next: Step, hint?: string) => void>(() => {});
  const stamp = () => Date.now().toString(36);

  const stopCollecting = useCallback(
    (text = "No problem, I've cleared that. Enjoy the rest of the studio!") => {
      collecting.current = null;
      show({ key: `c-cancel-${stamp()}`, text });
    },
    [show],
  );
  const cancel: Action = { label: "Cancel", run: () => stopCollecting() };

  const send = useCallback(async () => {
    const order = collecting.current;
    if (!order) return;
    const first = order.name.split(/\s+/)[0];
    show({ key: `c-sending-${stamp()}`, sticky: true, text: "Sending this to Lekan's team…" });
    try {
      const response = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workSlug: order.work.slug,
          room: state.current.room.id,
          fullName: order.name,
          phone: order.phone,
          payment: order.payment,
          address: order.address,
          delivery: order.delivery,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "Something went wrong.");
      collected.current.add(order.work.slug);
      collecting.current = null;
      show({
        key: `c-done-${stamp()}`,
        ttl: 16000,
        text: `Done! Thank you, ${first}. Lekan's team will reach you on WhatsApp soon to confirm the price and delivery of “${order.work.title}”.`,
        actions: [{ label: "Keep exploring", run: surprise }],
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Something went wrong.";
      show({
        key: `c-failed-${stamp()}`,
        sticky: true,
        text: `I couldn't send that just now. ${reason}`,
        actions: [{ label: "Try again", run: () => void send() }, { label: "Cancel", run: () => stopCollecting() }],
      });
    }
  }, [show, surprise, stopCollecting]);

  // One question at a time. Each answer is checked kindly before moving on.
  step.current = (next, hint) => {
    const order = collecting.current;
    if (!order) return;
    const lead = hint ? `${hint} ` : "";
    const key = `c-${next}-${stamp()}`;
    switch (next) {
      case "name":
        show({
          key,
          sticky: true,
          text: `${lead}${hint ? "" : `Wonderful choice! Let's make “${order.work.title}” yours. `}What's your full name?`,
          ask: {
            placeholder: "Your full name",
            submit: (value) => {
              if (value.trim().length < 2) return step.current("name", "I didn't quite catch that.");
              order.name = value.trim();
              step.current("phone");
            },
          },
          actions: [cancel],
        });
        return;
      case "phone":
        show({
          key,
          sticky: true,
          text: `${lead}${hint ? "" : `Lovely to meet you, ${order.name.split(/\s+/)[0]}! `}What's your WhatsApp or phone number?`,
          ask: {
            placeholder: "+234 …",
            type: "tel",
            submit: (value) => {
              const digits = value.replace(/\D/g, "");
              if (digits.length < 7 || !/^[+\d\s()-]+$/.test(value.trim())) return step.current("phone", "Hmm, that doesn't look like a full number.");
              order.phone = value.trim();
              step.current("payment");
            },
          },
          actions: [cancel],
        });
        return;
      case "payment":
        show({
          key,
          sticky: true,
          text: "How would you like to pay?",
          actions: [
            ...PAYMENT_METHODS.map((method) => ({
              label: method,
              run: () => {
                order.payment = method;
                step.current("address");
              },
            })),
            cancel,
          ],
        });
        return;
      case "address":
        show({
          key,
          sticky: true,
          text: `${lead}${hint ? "" : "Great. "}Where should we deliver it? Please type the full address.`,
          ask: {
            placeholder: "House number, street, city",
            submit: (value) => {
              if (value.trim().length < 8) return step.current("address", "Could you add a little more detail?");
              order.address = value.trim();
              step.current("delivery");
            },
          },
          actions: [cancel],
        });
        return;
      case "delivery":
        show({
          key,
          sticky: true,
          text: "And when would you like it delivered?",
          actions: [
            ...["As soon as possible", "After the exhibition"].map((when) => ({
              label: when,
              run: () => {
                order.delivery = when;
                step.current("confirm");
              },
            })),
            { label: "I'll pick a date", run: () => step.current("date") },
            cancel,
          ],
        });
        return;
      case "date":
        show({
          key,
          sticky: true,
          text: `${lead}Sure! Type the date or time that works best for you.`,
          ask: {
            placeholder: "e.g. 5 December, afternoon",
            submit: (value) => {
              if (value.trim().length < 2) return step.current("date", "I didn't catch a date.");
              order.delivery = value.trim();
              step.current("confirm");
            },
          },
          actions: [cancel],
        });
        return;
      case "confirm":
        show({
          key,
          sticky: true,
          text: [
            "Here's what I have:",
            "",
            `Painting: ${order.work.title}`,
            `Name: ${order.name}`,
            `WhatsApp: ${order.phone}`,
            `Payment: ${order.payment}`,
            `Deliver to: ${order.address}`,
            `When: ${order.delivery}`,
            "",
            "Shall I send this to Lekan's team? They'll only use it to arrange your painting.",
          ].join("\n"),
          actions: [{ label: "Yes, send it", run: () => void send() }, { label: "Start over", run: () => step.current("name") }, cancel],
        });
        return;
    }
  };

  const startCollecting = useCallback(
    (work: HungWork) => {
      collecting.current = { work, name: "", phone: "", payment: "", address: "", delivery: "" };
      // Give the conversation room: the painting list folds away while they answer.
      onFocusChat?.();
      step.current("name");
    },
    [onFocusChat],
  );

  // Not ready to collect: no pressure, and a moment with the painting's message instead.
  const notNow = useCallback(
    (work: HungWork) => {
      const message = messageOf(work.writeup);
      show({
        key: `c-notnow-${stamp()}`,
        ttl: 18000,
        text: message
          ? `That's perfectly fine! Stay with it a little longer. Lekan's message in it: “${message}”`
          : "That's perfectly fine! Stay with it a little longer. Lekan paints faith you can feel, beyond the colours.",
        actions: [
          { label: "Show me another", run: surprise },
          { label: "I'll stay here", run: () => show({ key: `c-stay-${stamp()}`, text: "Take all the time you need. I'll be around if you need me." }) },
        ],
      });
    },
    [show, surprise],
  );

  /** A friendly question about the painting itself, with no selling, asked while the visitor looks. */
  const reflectOn = useCallback(
    (work: HungWork): Note => {
      const message = messageOf(work.writeup);
      const lekan = message ? `Lekan's message in it: “${message}”` : "Lekan paints faith you can feel, beyond the colours.";
      return {
        key: `reflect-${work.slug}`,
        ttl: 16000,
        text: `What stands out to you first in “${work.title}”?`,
        actions: [
          { label: "The colours", run: () => show({ key: `reflect-c-${work.slug}`, ttl: 12000, text: `Lekan builds his colour up thick, so it catches the light like sculpture. ${lekan}` }) },
          { label: "The people", run: () => show({ key: `reflect-p-${work.slug}`, ttl: 12000, text: `Look at their hands and faces: that's where Lekan puts the feeling. ${lekan}` }) },
          { label: "The story", run: () => show({ key: `reflect-s-${work.slug}`, ttl: 12000, text: `Every painting here starts from a story of faith. ${lekan}` }) },
        ],
      };
    },
    [show],
  );

  /*
   * At a painting, in two steps:
   * 1. About 8 seconds in, a friendly question about the painting itself.
   * 2. Only after they've had time to read its story (based on its length, 20–45 seconds),
   *    and once no other chat bubble is showing, ask whether they'd like to collect it.
   * Walking away before then skips both; each is asked once per painting.
   */
  useEffect(() => {
    if (!active || farewell || !current) return;
    const askKey = `ask-collect-${room.id}-${current.slug}`;
    const reflectKey = `reflect-${current.slug}`;
    const words = current.writeup.split(/\s+/).filter(Boolean).length;
    const readSeconds = Math.min(45, Math.max(20, 8 + words / 3.5));
    const arrived = performance.now();

    const timer = window.setInterval(() => {
      if (collecting.current) return;
      const seconds = (performance.now() - arrived) / 1000;
      const showing = noteRef.current;
      // Wait for any other conversation to finish first.
      if (showing && (showing.sticky || showing.ask || showing.actions)) return;

      if (seconds >= 8 && !said.current.has(reflectKey) && !said.current.has(askKey)) {
        show(reflectOn(current));
        return;
      }
      if (seconds >= readSeconds && !said.current.has(askKey) && !collected.current.has(current.slug)) {
        onFocusChat?.();
        show({
          key: askKey,
          ttl: 20000,
          text: `You've spent a while with “${current.title}”. Do you love it enough to make it yours? It's an original, available to collect.`,
          actions: [
            { label: "Yes, I'm interested", run: () => startCollecting(current) },
            { label: "Not right now", run: () => notNow(current) },
          ],
        });
        window.clearInterval(timer);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active, farewell, current, room.id, show, reflectOn, startCollecting, notNow, onFocusChat]);

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

      // Never interrupt a visitor who is giving their details.
      if (collecting.current) return;
      const showing = noteRef.current;
      if (showing) {
        if (showing.sticky || showing.ask) return;
        const ttl = showing.ttl ?? (showing.actions ? 12000 : 6500);
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
          // Above the menu bar (z-30), so an open painting list never blocks the chat's buttons.
          className={`group absolute z-[35] flex flex-col gap-1.5 sm:w-[340px] ${spot}`}
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
              <motion.p className="whitespace-pre-line text-sm leading-snug" initial={reduced ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                {note.text}
              </motion.p>
            )}
          </Bubble>

          {/* Typing box when the guide asks for an answer, like a chat app's message bar */}
          {!typing && note.ask && (
            <Composer key={note.key} ask={note.ask} onSend={(value) => reply(note, value, () => note.ask?.submit(value))} />
          )}

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
              onClick={() => {
                // Closing mid-way through collecting abandons it quietly.
                collecting.current = null;
                hide();
              }}
            >
              &times;
            </button>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/** The chat's message bar: type an answer and send it with the arrow or Enter. */
function Composer({ ask, onSend }: { ask: Ask; onSend: (value: string) => void }) {
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus({ preventScroll: true }), []);
  const send = () => {
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
  };
  return (
    <form
      className={`ml-11 flex items-center gap-2 rounded-full p-1 pl-4 ${GLASS}`}
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <input
        ref={input}
        type={ask.type ?? "text"}
        inputMode={ask.type === "tel" ? "tel" : "text"}
        autoComplete={ask.type === "tel" ? "tel" : "off"}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={ask.placeholder}
        aria-label={ask.placeholder}
        maxLength={400}
        className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Send"
        disabled={!value.trim()}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f5d08a] text-[#1a140c] transition-opacity disabled:opacity-40"
      >
        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 10h11M11 5l5 5-5 5" />
        </svg>
      </button>
    </form>
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
