"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { WorkWriteup } from "@/components/WorkWriteup";
import { createAmbience, type Ambience } from "@/components/gallery/ambience";
import { galleryBus } from "@/components/gallery/bus";
import { GalleryFallback } from "@/components/gallery/GalleryFallback";
import { Scene } from "@/components/gallery/Scene";
import type { Gender } from "@/components/gallery/Visitor";
import { bodies, textureUrl, workMeta, works } from "@/lib/content";
import { hangWork } from "@/lib/gallery";

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

export default function GalleryApp({ initialSlug }: { initialSlug: string | null }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [support, setSupport] = useState<"checking" | "ok" | "no">("checking");
  const [menuOpen, setMenuOpen] = useState(false);
  const [current, setCurrent] = useState(-1);
  const [booted, setBooted] = useState(false);
  const [gender, setGender] = useState<Gender | null>(null);
  const [muted, setMuted] = useState(false);
  const [wide, setWide] = useState(true);
  const { textures, ready, progress } = useGalleryTextures();
  const panelRef = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const openedFromLink = useRef(false);
  const wasOpen = useRef(false);
  const heading = useRef(-1);
  const ambience = useRef<Ambience | null>(null);

  useEffect(() => {
    setSupport(hasWebGL() ? "ok" : "no");
    setMenuOpen(window.innerWidth >= 640);
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wideQuery = window.matchMedia("(min-width: 640px)");
    const applyMotion = () => {
      galleryBus.reduced = motionQuery.matches;
    };
    const applyWide = () => {
      galleryBus.wide = wideQuery.matches;
      setWide(wideQuery.matches);
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
    galleryBus.glideTo = hangWork(works[index]).view;
    if (currentRef.current >= 0) {
      galleryBus.viewing = false;
      currentRef.current = -1;
      setCurrent(-1);
    }
  }, []);

  const arrive = useCallback(() => {
    const index = heading.current;
    if (index < 0) return;
    heading.current = -1;
    currentRef.current = index;
    galleryBus.viewing = true;
    galleryBus.chime = true;
    setCurrent(index);
  }, []);

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

  useEffect(() => {
    if (!booted || !gender || openedFromLink.current || !initialSlug) return;
    const index = works.findIndex((work) => work.slug === initialSlug);
    if (index >= 0) {
      openedFromLink.current = true;
      approach(index);
    }
  }, [booted, gender, initialSlug, approach]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  useEffect(() => {
    if (current >= 0 && !wasOpen.current) panelRef.current?.focus();
    wasOpen.current = current >= 0;
  }, [current]);

  const work = current >= 0 ? works[current] : null;
  const meta = work ? workMeta(work) : "";

  return (
    <div className="fixed inset-0 bg-bg text-ink">
      <p className="sr-only">
        Two fingers on the trackpad walk your visitor in that direction. Drag to look around. Use W, A, S, and D to walk, and hold Shift to move faster. Arrow keys look around. Tap the floor to walk there. Tap a painting and your visitor walks over to stand and view it.
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
          <Scene textures={textures} gender={gender} ambience={ambience} onSelect={approach} onInterrupt={close} onArrive={arrive} />
        </Canvas>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <nav aria-label="Bodies of work" className="pointer-events-auto w-[min(280px,74vw)] rounded-lg border border-line bg-paper text-sm shadow-sm">
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-between gap-3 px-3.5 text-left font-semibold"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            Anticipate Hues that Heal 2.0
            <span aria-hidden="true">{menuOpen ? "–" : "+"}</span>
          </button>
          {menuOpen && (
            <div className="max-h-[70vh] overflow-auto px-3.5 pb-3">
              {bodies().map((body) => (
                <section key={body}>
                  <h2 className="mb-1 mt-3 text-base">{body}</h2>
                  <ul>
                    {works.map((item, index) =>
                      item.body === body ? (
                        <li key={item.slug}>
                          <button
                            type="button"
                            className={`block w-full py-1.5 text-left ${current === index ? "text-accent" : "text-muted"} hover:text-accent`}
                            aria-current={current === index ? "true" : undefined}
                            onClick={() => approach(index)}
                          >
                            {item.title}
                          </button>
                        </li>
                      ) : null,
                    )}
                  </ul>
                </section>
              ))}
              <p className="mt-3 text-muted sm:hidden">Choose a work to walk over to it.</p>
              <div className="mt-3 flex gap-4">
                <Link href="/" className="inline-flex min-h-11 items-center">
                  Home
                </Link>
              </div>
            </div>
          )}
        </nav>
        <div className="pointer-events-auto flex items-center gap-2">
          {gender && (
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line bg-paper"
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
          <Link href="/" className="inline-flex min-h-11 items-center rounded-md border border-line bg-paper px-3 text-sm">
            Leave Studio
          </Link>
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-20 hidden max-w-[92vw] -translate-x-1/2 truncate rounded-full border border-line bg-paper px-4 py-2 text-sm text-muted sm:block">
        Two fingers walk. Drag to look. W A S D walks your visitor. Tap a painting and they walk over to view it.
      </p>

      <AnimatePresence>
        {work && (
          <motion.aside
            key={work.slug}
            ref={panelRef}
            tabIndex={-1}
            aria-labelledby="work-title"
            className="absolute z-20 overflow-auto border-line bg-paper p-7 outline-none max-sm:inset-x-0 max-sm:bottom-0 max-sm:h-[58%] max-sm:border-t sm:bottom-0 sm:right-0 sm:top-0 sm:w-[min(400px,100%)] sm:border-l sm:pt-20"
            custom={wide}
            initial={reduced ? { opacity: 0 } : wide ? { x: 110, opacity: 0, scale: 0.96 } : { y: 160, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0 } : wide ? { x: 140, opacity: 0, scale: 0.98 } : { y: 200, opacity: 0 }}
            transition={reduced ? { duration: 0.01 } : { type: "spring", stiffness: 280, damping: 28 }}
          >
            <motion.div
              aria-live="polite"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: reduced ? 0 : 0.06, delayChildren: reduced ? 0 : 0.05 } },
              }}
            >
              <motion.p className="text-sm font-semibold text-accent" variants={detailItem}>
                {work.body}
              </motion.p>
              <motion.h2 id="work-title" className="mt-2 text-3xl leading-tight" variants={detailItem}>
                {work.title}
              </motion.h2>
              <motion.p className="mt-2 text-muted" variants={detailItem}>
                {work.artist}
                {work.year ? `, ${work.year}` : ""}
              </motion.p>
              {meta && (
                <motion.p className="mt-1 border-b border-line pb-4 text-sm text-muted" variants={detailItem}>
                  {meta}
                </motion.p>
              )}
              <motion.div variants={detailItem}>
                <WorkWriteup text={work.writeup} className="mt-4" />
              </motion.div>
              <motion.div className="mt-6 flex gap-2" variants={detailItem}>
                <button type="button" className="min-h-11 flex-1 rounded-md border border-line" onClick={() => approach((current + works.length - 1) % works.length)}>
                  Previous
                </button>
                <button type="button" className="min-h-11 flex-1 rounded-md bg-accent text-on" onClick={() => approach((current + 1) % works.length)}>
                  Next work
                </button>
              </motion.div>
              <motion.button type="button" className="mt-2 min-h-11 w-full rounded-md border border-line" onClick={close} variants={detailItem}>
                Close
              </motion.button>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>

      {support === "ok" && booted && !gender && <GenderGate onChoose={chooseGender} />}

      {support === "no" && <GalleryFallback message="This browser can't open the visual studio. Taking you to the collection of works." />}
      {support !== "no" && !booted && <GalleryFallback progress={progress} />}
    </div>
  );
}
