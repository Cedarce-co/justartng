"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { WorkWriteup } from "@/components/WorkWriteup";
import { createAmbience, type Ambience } from "@/components/gallery/ambience";
import { AvatarStage } from "@/components/gallery/AvatarPreview";
import { galleryBus } from "@/components/gallery/bus";
import { GalleryFallback } from "@/components/gallery/GalleryFallback";
import { Scene } from "@/components/gallery/Scene";
import { GLASS, GuideOffer, GuideTip, KeyHints, type GuideStep } from "@/components/gallery/StudioGuide";
import { StudioMenu } from "@/components/gallery/StudioMenu";
import { StudioCompanion } from "@/components/gallery/StudioCompanion";
import { STUDIO_VISITED_KEY } from "@/components/home/StudioInvite";
import type { Gender } from "@/components/gallery/Visitor";
import { buyLabel, getRoom, isSold, mainRoom, roomWorks, rooms, roomsFor, site, splitEvents, studioHref, textureUrl, workMeta, works, type Room } from "@/lib/content";

/** The next exhibition's date, e.g. "29 November", for the companion to mention. */
function upcomingDate() {
  const next = splitEvents().upcoming[0];
  const time = next ? Date.parse(next.startsAt) : Number.NaN;
  if (Number.isNaN(time)) return null;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "Africa/Lagos" }).format(time);
}
import { DOOR_VIEW, hangWork, layoutRoom } from "@/lib/gallery";

/** `heading` value while the visitor walks to the door rather than a painting. */
const TO_DOOR = -2;

/** Opens the room asked for; otherwise the room the linked painting hangs in; otherwise the main room. */
function startRoom(roomId: string | null, slug: string | null): Room {
  return getRoom(roomId) ?? (slug ? roomsFor(slug)[0] : null) ?? mainRoom;
}

/** The guided tour: one instruction per box, each pointing at the thing it describes. */
function guideSteps(rooms: Room[]): GuideStep[] {
  const steps: GuideStep[] = [
    { title: "Look around", body: "Drag anywhere in the room to look. On a keyboard, the ← → arrow keys turn you around, and ↑ ↓ look up and down.", anchor: "look" },
    { title: "Walk", body: "Use W A S D to walk, and hold Shift to go faster. You can also use two fingers on a trackpad, or tap a spot on the floor.", anchor: "walk" },
    { title: "Visit a painting", body: "Choose a painting here, or tap one on the wall. You’ll walk over to it and its story opens beside you.", anchor: { id: "tour-list" }, needsMenu: true },
  ];
  if (rooms.length > 1) {
    steps.push({
      title: "Another room",
      body: `Turn around with the ← → arrow keys (or drag): the door behind you leads to the next room. Tap it and you’ll walk over, open it and step through. There are ${rooms.length} rooms: ${rooms.map((room) => room.name).join(", ")}.`,
      anchor: "look",
    });
  }
  steps.push({ title: "Leave any time", body: "This takes you back to the home page. Enjoy the exhibition.", anchor: { id: "tour-leave" } });
  return steps;
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch {
    return false;
  }
}

/** Loads every painting, the starting room's first; the studio opens as soon as that room's are in. */
function useGalleryTextures(firstRoom: Room) {
  const [textures, setTextures] = useState<Record<string, THREE.Texture>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const kept = useRef<THREE.Texture[]>([]);
  const [first] = useState(() => roomWorks(firstRoom));

  useEffect(() => {
    let cancel = false;
    const loader = new THREE.TextureLoader();
    // Phones get the lighter images: they look the same at phone size and use far less graphics memory.
    const quality = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches ? "standard" : "high";
    const order = [...first, ...works.filter((work) => !first.some((item) => item.slug === work.slug))];
    order.forEach((work) => {
      const key = work.slug;
      loader.load(
        textureUrl(work.image, quality),
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = 8;
          if (cancel) {
            texture.dispose();
            return;
          }
          kept.current.push(texture);
          setTextures((current) => ({ ...current, [key]: texture }));
        },
        undefined,
        () => {
          if (!cancel) setFailed((current) => ({ ...current, [key]: true }));
        },
      );
    });
    return () => {
      cancel = true;
    };
  }, [first]);

  useEffect(
    () => () => {
      kept.current.forEach((texture) => texture.dispose());
      kept.current = [];
    },
    [],
  );

  const done = (work: { slug: string }) => Boolean(textures[work.slug] || failed[work.slug]);
  const ready = first.every(done);
  const loaded = first.filter(done).length;
  return { textures, kept, ready, progress: first.length ? (loaded / first.length) * 100 : 100 };
}

/** The Buy now / Buy prints button: opens the collector form in a new tab. Studio glass, not the site's blue. */
function BuyButton({ work }: { work: { status?: "available" | "sold" } }) {
  return (
    <a
      href={site.interestForm}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-white hover:text-black sm:min-h-10 sm:px-4 sm:text-sm"
    >
      {buyLabel(work)}
      <span aria-hidden="true">&rarr;</span>
      <span className="sr-only"> (opens a form in a new tab)</span>
    </a>
  );
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M4 9.5h3.2L11.5 6v12l-4.3-3.5H4z" fill="currentColor" />
      {muted ? (
        <path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <>
          <path d="M15.5 9.2a3.4 3.4 0 010 5.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M17.6 7a6.2 6.2 0 010 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

const detailItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

function GenderGate({ onChoose }: { onChoose: (gender: Gender) => void }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#12110f]/80 px-5 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.5 }}
    >
      <div className="w-full max-w-2xl text-center text-[#f6f3ee]">
        {/* The heading drops gently into place */}
        <motion.h2
          className="font-display text-2xl font-light italic tracking-tight sm:text-3xl"
          initial={reduced ? false : { opacity: 0, y: -28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 18, delay: 0.2 }}
        >
          Choose an avatar
        </motion.h2>
        {/* Both figures share one 3D view; he walks in from the left, she from the right.
            Two invisible buttons, one over each figure, make the choice. */}
        <div className="relative mx-auto mt-6 h-64 w-[min(520px,100%)] sm:h-80">
          <AvatarStage reduced={Boolean(reduced)} />
          <div className="absolute inset-0 grid grid-cols-2">
            {(["man", "woman"] as const).map((gender) => (
              <button
                key={gender}
                type="button"
                aria-label={gender === "man" ? "Man" : "Woman"}
                className="group relative rounded-3xl bg-transparent focus-visible:outline-2 focus-visible:outline-white"
                onClick={() => onChoose(gender)}
              >
                {/* A soft light pools under the figure you're about to choose */}
                <span className="pointer-events-none absolute inset-x-[20%] bottom-2 h-10 rounded-full bg-white/0 blur-xl transition-colors duration-300 group-hover:bg-white/25 group-focus-visible:bg-white/25" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}


export default function GalleryApp({ initialSlug, initialRoom }: { initialSlug: string | null; initialRoom: string | null }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [room, setRoom] = useState<Room>(() => startRoom(initialRoom, initialSlug));
  // The guide is offered once per visit to the studio: not again on changing rooms.
  const [offer, setOffer] = useState(true);
  const [tour, setTour] = useState<number | null>(null);
  const hung = useMemo(() => layoutRoom(roomWorks(room)), [room]);
  const hungRef = useRef(hung);
  hungRef.current = hung;
  const steps = useMemo(() => guideSteps(rooms), []);
  // Each room's door leads on to the next, and the last leads back to the first.
  const nextRoom = rooms.length > 1 ? rooms[(rooms.findIndex((item) => item.id === room.id) + 1) % rooms.length] : null;
  const nextRoomRef = useRef(nextRoom);
  nextRoomRef.current = nextRoom;
  const [doorOpen, setDoorOpen] = useState(false);
  // True while the screen dims as the visitor steps through the door.
  const [passing, setPassing] = useState(false);
  const doorTimers = useRef<number[]>([]);
  const openDoorRef = useRef<() => void>(() => {});
  const tourStep = tour !== null ? steps[tour] : null;
  const [support, setSupport] = useState<"checking" | "ok" | "no">("checking");
  const [menuOpen, setMenuOpen] = useState(false);
  const [current, setCurrent] = useState(-1);
  const [booted, setBooted] = useState(false);
  const [gender, setGender] = useState<Gender | null>(null);
  const [muted, setMuted] = useState(false);
  const { textures, kept: keptTextures, ready, progress } = useGalleryTextures(room);
  // The companion's state: which paintings have been seen in this room, and the goodbye when leaving.
  const [viewed, setViewed] = useState<string[]>([]);
  const [farewell, setFarewell] = useState<string | null>(null);
  const eventDate = useMemo(upcomingDate, []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const panelRef = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const openedFromLink = useRef(false);
  const wasOpen = useRef(false);
  const heading = useRef(-1);
  const ambience = useRef<Ambience | null>(null);

  useEffect(() => {
    // Tell the home page this visitor has been inside, so it skips the studio invitation on the way back.
    try {
      window.sessionStorage.setItem(STUDIO_VISITED_KEY, "1");
    } catch {
      // Storage blocked: the invitation may show again, which is harmless.
    }
    setSupport(hasWebGL() ? "ok" : "no");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wideQuery = window.matchMedia("(min-width: 640px)");
    const applyMotion = () => {
      galleryBus.reduced = motionQuery.matches;
    };
    const applyWide = () => {
      galleryBus.wide = wideQuery.matches;
    };
    applyMotion();
    applyWide();
    motionQuery.addEventListener("change", applyMotion);
    wideQuery.addEventListener("change", applyWide);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      motionQuery.removeEventListener("change", applyMotion);
      wideQuery.removeEventListener("change", applyWide);
      document.body.style.overflow = previousOverflow;
      ambience.current?.close();
      ambience.current = null;
    };
  }, []);

  useEffect(() => {
    if (support === "no") router.replace("/works?notice=webgl");
  }, [router, support]);

  useEffect(() => {
    if (ready) setBooted(true);
  }, [ready]);

  const currentRef = useRef(-1);
  const approach = useCallback((index: number) => {
    if (index === currentRef.current) return;
    if (currentRef.current < 0 && document.activeElement instanceof HTMLElement) opener.current = document.activeElement;
    heading.current = index;
    galleryBus.glideTo = hangWork(hungRef.current[index]).view;
    if (currentRef.current >= 0) {
      galleryBus.viewing = false;
      currentRef.current = -1;
      setCurrent(-1);
    }
  }, []);

  const arrive = useCallback(() => {
    const index = heading.current;
    if (index === TO_DOOR) {
      heading.current = -1;
      openDoorRef.current();
      return;
    }
    if (index < 0) return;
    heading.current = -1;
    currentRef.current = index;
    galleryBus.viewing = true;
    galleryBus.chime = true;
    setCurrent(index);
    const slug = hungRef.current[index]?.slug;
    if (slug) setViewed((seen) => (seen.includes(slug) ? seen : [...seen, slug]));
    // The painting's panel takes over; the guide is finished.
    setOffer(false);
    setTour(null);
  }, []);

  const startTour = useCallback(() => {
    setOffer(false);
    setTour(0);
  }, []);

  // "Next" moves on; on the last step it reads "Done" and ends the guide for this visit.
  const nextStep = useCallback(() => {
    setTour((step) => (step !== null && step + 1 < steps.length ? step + 1 : null));
  }, [steps.length]);

  // Steps about the menu open it so the visitor can see what's being described.
  useEffect(() => {
    if (tourStep?.needsMenu) setMenuOpen(true);
  }, [tourStep]);

  const close = useCallback(() => {
    heading.current = -1;
    if (currentRef.current < 0) return;
    galleryBus.viewing = false;
    currentRef.current = -1;
    setCurrent(-1);
    opener.current?.focus();
    opener.current = null;
  }, []);

  const chooseGender = useCallback((next: Gender) => {
    setGender(next);
    try {
      if (!ambience.current) ambience.current = createAmbience();
      void ambience.current.resume();
      ambience.current.select();
    } catch {
      ambience.current = null;
    }
  }, []);

  const switchRoom = useCallback((next: Room) => {
    heading.current = -1;
    currentRef.current = -1;
    galleryBus.viewing = false;
    galleryBus.glideTo = null;
    setCurrent(-1);
    setRoom(next);
    setViewed([]);
    // Keep the address shareable without reloading the studio.
    window.history.replaceState(null, "", studioHref(next));
  }, []);

  // Tapping the door walks the visitor to it; arriving opens it.
  const goToDoor = useCallback(() => {
    if (!nextRoomRef.current || doorTimers.current.length) return;
    close();
    heading.current = TO_DOOR;
    galleryBus.glideTo = DOOR_VIEW;
  }, [close]);

  // The door swings open, the screen dims, and the visitor is in the next room.
  openDoorRef.current = () => {
    const next = nextRoomRef.current;
    if (!next) return;
    const quick = galleryBus.reduced;
    setDoorOpen(true);
    galleryBus.chime = true;
    const later = (ms: number, run: () => void) => doorTimers.current.push(window.setTimeout(run, quick ? 0 : ms));
    later(900, () => setPassing(true));
    later(1350, () => {
      setDoorOpen(false);
      switchRoom(next);
    });
    later(1500, () => {
      setPassing(false);
      doorTimers.current = [];
    });
  };

  useEffect(() => () => doorTimers.current.forEach((timer) => window.clearTimeout(timer)), []);

  useEffect(() => {
    if (!booted || !gender || openedFromLink.current || !initialSlug) return;
    const index = hung.findIndex((work) => work.slug === initialSlug);
    if (index >= 0) {
      openedFromLink.current = true;
      approach(index);
    }
  }, [booted, gender, hung, initialSlug, approach]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        setOffer(false);
        setTour(null);
        close();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  useEffect(() => {
    if (current >= 0 && !wasOpen.current) panelRef.current?.focus();
    wasOpen.current = current >= 0;
  }, [current]);

  const work = current >= 0 ? hung[current] : null;
  const meta = work ? workMeta(work) : "";

  return (
    <div className="fixed inset-0 bg-bg text-ink">
      <p className="sr-only">
        Two fingers on the trackpad walk your visitor in that direction. Drag to look around. Use W, A, S, and D to walk, and hold Shift to move faster. The left and right arrow keys turn you around; up and down look up and down. Tap the floor to walk there. Tap a painting and your visitor walks over to stand and view it. Tap the door to go to the next room.
      </p>
      {support === "ok" && (
        <Canvas
          className="absolute inset-0"
          camera={{ fov: 52, near: 0.1, far: 60, position: [0, 2.1, 4.2] }}
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.NoToneMapping;
            // Phones can drop the 3D view under memory pressure; when it comes back, re-send the paintings.
            gl.domElement.addEventListener("webglcontextrestored", () => {
              keptTextures.current.forEach((texture) => {
                texture.needsUpdate = true;
              });
            });
          }}
        >
          {/* Keyed by room so the visitor starts fresh at the entrance of each room. */}
          <Scene
            key={room.id}
            room={room}
            works={hung}
            textures={textures}
            gender={gender}
            ambience={ambience}
            nextRoom={nextRoom}
            doorOpen={doorOpen}
            onSelect={approach}
            onDoor={goToDoor}
            onInterrupt={close}
            onArrive={arrive}
          />
        </Canvas>
      )}

      {/* Dims the room for a moment as the visitor steps through the door. */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20 bg-black"
        initial={false}
        animate={{ opacity: passing ? 1 : 0 }}
        transition={{ duration: reduced ? 0 : 0.4 }}
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <StudioMenu
          room={room}
          titles={hung.map((item) => item.title)}
          sold={hung.map((item) => isSold(item))}
          current={current}
          open={menuOpen}
          onToggle={() => setMenuOpen((open) => !open)}
          onPick={(index) => {
            // On phones the open list would cover the painting, so tuck it away.
            if (window.innerWidth < 640) setMenuOpen(false);
            approach(index);
          }}
        />
        <motion.div
          className="pointer-events-auto flex items-center gap-2"
          initial={reduced ? false : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28, delay: 0.2 }}
        >
          {gender && (
            <button
              type="button"
              className={`inline-flex size-11 items-center justify-center rounded-full ${GLASS}`}
              aria-pressed={!muted}
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={() => {
                const next = !muted;
                setMuted(next);
                ambience.current?.setMuted(next);
              }}
            >
              <SoundIcon muted={muted} />
            </button>
          )}
          <Link
            id="tour-leave"
            href="/"
            aria-label="Leave Studio"
            className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-4 text-sm transition-colors hover:bg-white hover:text-black ${GLASS}`}
            onClick={(event) => {
              // The guide says goodbye before the visitor goes back to the home page.
              if (farewell) return;
              event.preventDefault();
              const seen = viewed.length;
              setFarewell(
                seen > 1
                  ? `Thanks for walking with us! You saw ${seen} paintings today. See you at Hues That Heal 2.0.`
                  : "Thanks for stopping by! Come back any time. See you at Hues That Heal 2.0.",
              );
              window.setTimeout(() => router.push("/"), reduced ? 1200 : 2200);
            }}
          >
            Leave<span className="hidden sm:inline">&nbsp;Studio</span>
          </Link>
        </motion.div>
      </div>

      <AnimatePresence>
        {work && (
          <motion.aside
            key={work.slug}
            ref={panelRef}
            tabIndex={-1}
            aria-labelledby="work-title"
            // A glass card that rises into the bottom-right corner, scrolling inside. On phones it is half
            // the screen wide and short, so the painting and the visitor stay in view.
            className={`absolute bottom-3 right-3 z-20 flex max-h-[34svh] w-[calc(50vw-0.75rem)] flex-col overflow-hidden rounded-2xl outline-none sm:bottom-5 sm:right-5 sm:max-h-[50svh] sm:w-[min(400px,calc(100vw-2.5rem))] ${GLASS}`}
            initial={reduced ? { opacity: 0 } : { y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0, transition: { duration: 0.01 } } : { y: 80, opacity: 0, transition: { duration: 0.25 } }}
            transition={reduced ? { duration: 0.01 } : { type: "spring", stiffness: 280, damping: 30 }}
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute left-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-white/10 text-lg leading-none text-white/80 transition-colors hover:bg-white hover:text-black sm:left-3 sm:top-3 sm:size-9"
              onClick={close}
            >
              &times;
            </button>
            <motion.div
              aria-live="polite"
              className="overflow-y-auto px-3.5 pb-4 pt-11 sm:px-6 sm:pb-6 sm:pt-14"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: reduced ? 0 : 0.06, delayChildren: reduced ? 0 : 0.05 } },
              }}
            >
              <motion.p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50" variants={detailItem}>
                {room.name}
              </motion.p>
              <motion.h2 id="work-title" className="mt-1 font-serif text-base leading-tight sm:mt-1.5 sm:text-[1.7rem]" variants={detailItem}>
                {work.title}
              </motion.h2>
              <motion.p className="mt-1 text-xs text-white/70 sm:mt-1.5 sm:text-sm" variants={detailItem}>
                {work.artist}
                {work.year ? `, ${work.year}` : ""}
              </motion.p>
              {meta && (
                <motion.p className="mt-0.5 text-xs text-white/50 sm:text-sm" variants={detailItem}>
                  {meta}
                </motion.p>
              )}
              {/* Buy the original while it's available; once sold, prints. Both open the same short form. */}
              <motion.div className="mt-3 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3 sm:pb-4" variants={detailItem}>
                <BuyButton work={work} />
                <span className="inline-flex items-center gap-1.5 text-[11px] text-white/60 sm:text-xs">
                  <span className={`size-2 rounded-full ${isSold(work) ? "bg-[#e5484d]" : "bg-[#3dd68c]"}`} aria-hidden="true" />
                  {isSold(work) ? "Original sold" : "Original available"}
                </span>
              </motion.div>
              <motion.div variants={detailItem}>
                <WorkWriteup text={work.writeup} className="mt-3 !space-y-2.5 !text-[13px] !leading-snug text-white/85 sm:mt-4 sm:!space-y-4 sm:!text-base sm:!leading-relaxed" />
              </motion.div>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>

      {support === "ok" && booted && !gender && <GenderGate onChoose={chooseGender} />}

      {/* After choosing an avatar, offer the guide once. Neither the offer nor the guide blocks the room. */}
      <AnimatePresence mode="wait">
        {support === "ok" && booted && gender && offer && !work && (
          <GuideOffer key="offer" onTour={startTour} onDecline={() => setOffer(false)} />
        )}
        {support === "ok" && booted && gender && tour !== null && (
          <GuideTip key="tour" steps={steps} index={tour} onNext={nextStep} onSkip={() => setTour(null)} />
        )}
      </AnimatePresence>
      {/* The studio companion: stays with the visitor once the first-visit guide is out of the way. */}
      {support === "ok" && booted && gender && (
        <StudioCompanion
          room={room}
          nextRoom={nextRoom}
          works={hung}
          viewed={viewed}
          active={!offer && tour === null && !passing}
          viewing={Boolean(work)}
          current={work}
          eventDate={eventDate}
          farewell={farewell}
          onVisit={approach}
          onFocusChat={closeMenu}
        />
      )}
      <AnimatePresence>
        {support === "ok" && booted && gender && !offer && tour === null && !work && <KeyHints key="keys" />}
      </AnimatePresence>

      {support === "no" && <GalleryFallback message="This browser can't open the visual studio. Taking you to the collection of works." />}
      {support !== "no" && !booted && <GalleryFallback progress={progress} />}
    </div>
  );
}
