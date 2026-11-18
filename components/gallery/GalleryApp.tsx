"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { WorkWriteup } from "@/components/WorkWriteup";
import { createAmbience, type Ambience } from "@/components/gallery/ambience";
import { galleryBus } from "@/components/gallery/bus";
import { GalleryFallback } from "@/components/gallery/GalleryFallback";
import { Scene } from "@/components/gallery/Scene";
import { GLASS, GuideOffer, GuideTip, KeyHints, type GuideStep } from "@/components/gallery/StudioGuide";
import { StudioMenu } from "@/components/gallery/StudioMenu";
import { STUDIO_VISITED_KEY } from "@/components/home/StudioInvite";
import type { Gender } from "@/components/gallery/Visitor";
import { getRoom, mainRoom, roomWorks, rooms, roomsFor, studioHref, textureUrl, workMeta, works, type Room } from "@/lib/content";
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
      body: `Turn around with the ← → arrow keys (or drag): the door behind you leads to the next room. Tap it and you’ll walk over, open it and step through. ${rooms.map((room) => room.name).join(" and ")} are joined this way.`,
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

function useGalleryTextures() {
  const [textures, setTextures] = useState<Record<string, THREE.Texture>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const kept = useRef<THREE.Texture[]>([]);

  useEffect(() => {
    let cancel = false;
    const loader = new THREE.TextureLoader();
    works.forEach((work) => {
      const key = work.slug;
      loader.load(
        textureUrl(work.image, "high"),
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
  }, []);

  useEffect(
    () => () => {
      kept.current.forEach((texture) => texture.dispose());
      kept.current = [];
    },
    [],
  );

  const ready = works.every((work) => textures[work.slug] || failed[work.slug]);
  const loaded = works.filter((work) => textures[work.slug] || failed[work.slug]).length;
  return { textures, ready, progress: (loaded / works.length) * 100 };
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
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#12110f]/80 px-5 backdrop-blur-sm">
      <div className="w-full max-w-xl text-center text-[#f6f3ee]">
        <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Choose an avatar</h2>
        <div className="mt-10 flex items-end justify-center gap-16 sm:gap-24">
          <GenderChoice label="Man" gender="man" onChoose={onChoose} />
          <GenderChoice label="Woman" gender="woman" onChoose={onChoose} />
        </div>
      </div>
    </div>
  );
}

function GenderChoice({ label, gender, onChoose }: { label: string; gender: Gender; onChoose: (gender: Gender) => void }) {
  const woman = gender === "woman";
  return (
    <motion.button
      type="button"
      className="bg-transparent p-0"
      aria-label={label}
      whileHover={{ y: -8, scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={() => onChoose(gender)}
    >
      <svg viewBox="0 0 120 168" className="h-44 w-auto sm:h-52" aria-hidden="true">
        {woman ? (
          <>
            <path d="M34 52c-4 22-2 48 8 62 4-22 8-40 12-52 2 16 6 34 12 50 8-20 10-42 6-62-6-22-14-34-20-34s-14 12-18 36z" fill="#1c1410" />
            <circle cx="60" cy="46" r="16" fill="#e4b48e" />
            <path d="M38 74c8-12 36-12 44 0l16 54H22z" fill="#c4624e" />
            <path d="M38 78c-10 6-16 20-14 34 7 1 12-4 13-10 2-8 4-16 9-20z" fill="#c4624e" />
            <path d="M82 78c10 6 16 20 14 34-7 1-12-4-13-10-2-8-4-16-9-20z" fill="#c4624e" />
            <circle cx="24" cy="114" r="5" fill="#e4b48e" />
            <circle cx="96" cy="114" r="5" fill="#e4b48e" />
            <path d="M50 126h8l-1 22h-9zM64 126h8l2 22h-9z" fill="#3a2a28" />
            <ellipse cx="52" cy="152" rx="8" ry="3.5" fill="#141210" />
            <ellipse cx="72" cy="152" rx="8" ry="3.5" fill="#141210" />
          </>
        ) : (
          <>
            <path d="M40 34c1-14 8-22 20-22s19 8 20 22c7 2 12 8 12 16v2H28v-2c0-8 5-14 12-16z" fill="#1c1410" />
            <circle cx="60" cy="48" r="15" fill="#d7a679" />
            <path d="M54 62h12v10H54z" fill="#d7a679" />
            <path d="M32 76c10-10 46-10 56 0l8 48c-10 8-22 10-36 10s-26-2-36-10z" fill="#243e46" />
            <path d="M52 74h16l-8 18z" fill="#f4ecdf" />
            <path d="M32 80c-10 4-16 18-14 32 7 2 13-2 14-8 2-10 4-16 10-20z" fill="#243e46" />
            <path d="M88 80c10 4 16 18 14 32-7 2-13-2-14-8-2-10-4-16-10-20z" fill="#243e46" />
            <circle cx="20" cy="114" r="5.5" fill="#d7a679" />
            <circle cx="100" cy="114" r="5.5" fill="#d7a679" />
            <path d="M46 128h12l-2 24h-12zM64 128h12l2 24H66z" fill="#2a2622" />
            <ellipse cx="50" cy="156" rx="9" ry="4" fill="#141210" />
            <ellipse cx="76" cy="156" rx="9" ry="4" fill="#141210" />
          </>
        )}
      </svg>
    </motion.button>
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
  const nextRoom = rooms.find((item) => item.id !== room.id) ?? null;
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
  const { textures, ready, progress } = useGalleryTextures();
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
            // A glass card that rises into the bottom-right corner: at most half the screen tall, scrolling inside.
            className={`absolute inset-x-3 bottom-3 z-20 flex max-h-[55svh] flex-col overflow-hidden rounded-2xl outline-none sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-h-[50svh] sm:w-[min(400px,calc(100vw-2.5rem))] ${GLASS}`}
            initial={reduced ? { opacity: 0 } : { y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0, transition: { duration: 0.01 } } : { y: 80, opacity: 0, transition: { duration: 0.25 } }}
            transition={reduced ? { duration: 0.01 } : { type: "spring", stiffness: 280, damping: 30 }}
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute left-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white/10 text-lg leading-none text-white/80 transition-colors hover:bg-white hover:text-black"
              onClick={close}
            >
              &times;
            </button>
            <motion.div
              aria-live="polite"
              className="overflow-y-auto px-6 pb-6 pt-14"
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
              <motion.h2 id="work-title" className="mt-1.5 font-serif text-2xl leading-tight sm:text-[1.7rem]" variants={detailItem}>
                {work.title}
              </motion.h2>
              <motion.p className="mt-1.5 text-sm text-white/70" variants={detailItem}>
                {work.artist}
                {work.year ? `, ${work.year}` : ""}
              </motion.p>
              {meta && (
                <motion.p className="mt-0.5 border-b border-white/10 pb-4 text-sm text-white/50" variants={detailItem}>
                  {meta}
                </motion.p>
              )}
              <motion.div variants={detailItem}>
                <WorkWriteup text={work.writeup} className="mt-4 !text-base text-white/85" />
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
      <AnimatePresence>
        {support === "ok" && booted && gender && !offer && tour === null && !work && <KeyHints key="keys" />}
      </AnimatePresence>

      {support === "no" && <GalleryFallback message="This browser can't open the visual studio. Taking you to the collection of works." />}
      {support !== "no" && !booted && <GalleryFallback progress={progress} />}
    </div>
  );
}
