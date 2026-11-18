"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type Gender = "man" | "woman";

export type Pose = {
  x: number;
  z: number;
  yaw: number;
  moving: boolean;
  phase: number;
};

/*
 * Two Nigerian visitors in hoodies, built from smooth lathed and rounded shapes.
 * - He is styled after the artist: glasses and a grey goatee, a low-cut hairline,
 *   a black hoodie with orange-striped trim, light jeans and brown shoes.
 * - She has natural hair in an afro puff and gold earrings, an Ankara-print hoodie
 *   with orange trim, dark joggers and white sneakers.
 * Front is -z. Units are metres before the figure is scaled down to fit the studio.
 */

const SCALE = 0.62;

/** A repeating Ankara-style print, drawn once on a canvas. */
function ankaraTexture(palette: { ground: string; ring: string[]; accent: string; dot: string }, repeat: [number, number]) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, 0, size, size);
  const cell = size / 4;
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const cx = col * cell + cell / 2 + (row % 2 ? cell / 2 : 0);
      const cy = row * cell + cell / 2;
      palette.ring.forEach((color, i) => {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(cx % size, cy, cell * (0.42 - i * 0.1), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = palette.accent;
      const dx = (cx + cell / 2) % size;
      const dy = cy + cell / 2;
      ctx.beginPath();
      ctx.moveTo(dx, dy - cell * 0.16);
      ctx.lineTo(dx + cell * 0.1, dy);
      ctx.lineTo(dx, dy + cell * 0.16);
      ctx.lineTo(dx - cell * 0.1, dy);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.fillStyle = palette.dot;
  for (let y = 4; y < size; y += 16) {
    for (let x = 4 + ((y / 16) % 2) * 8; x < size; x += 16) {
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(...repeat);
  map.anisotropy = 4;
  return map;
}

/** Smooth turned shape from a side profile of [radius, height] points. */
function useLathe(profile: [number, number][], segments = 40) {
  return useMemo(() => new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments), [profile, segments]);
}

type Mats = Record<string, THREE.Material>;

function useMaterials(woman: boolean) {
  const mats = useMemo(() => {
    // Cloth gets a soft sheen in its own colour, so dark fabric stays dark instead of turning grey.
    const cloth = (color: string, map?: THREE.Texture | null) =>
      new THREE.MeshPhysicalMaterial({
        color: map ? "#ffffff" : color,
        map: map ?? undefined,
        roughness: 0.82,
        sheen: 0.35,
        sheenRoughness: 0.7,
        sheenColor: new THREE.Color(map ? "#f3e6c8" : color).lerp(new THREE.Color("#ffffff"), 0.15),
      });
    const print = woman ? ankaraTexture({ ground: "#1f2a6b", ring: ["#e46a1f", "#f5b82e", "#1f2a6b", "#2fa39a"], accent: "#f5b82e", dot: "#f3e6c8" }, [7, 3]) : null;
    // Sleeves are thin tubes, so they need fewer repeats of the print to keep it from smearing.
    const sleevePrint = print ? print.clone() : null;
    sleevePrint?.repeat.set(2, 1.5);
    if (sleevePrint) sleevePrint.needsUpdate = true;
    const all: Mats = {
      skin: new THREE.MeshPhysicalMaterial({ color: woman ? "#8a5634" : "#7a4a2c", roughness: 0.5, clearcoat: 0.15, clearcoatRoughness: 0.6, sheen: 0.3, sheenColor: new THREE.Color("#c48a63") }),
      hair: new THREE.MeshStandardMaterial({ color: "#16100c", roughness: 0.92 }),
      hoodie: woman ? cloth("#ffffff", print) : cloth("#1b1714"),
      sleeve: woman ? cloth("#ffffff", sleevePrint) : cloth("#1b1714"),
      trim: cloth("#c2562b"),
      strings: cloth(woman ? "#f3e6c8" : "#f4f1ea"),
      bottoms: woman ? cloth("#262838") : cloth("#7f97b0"),
      shoe: woman
        ? new THREE.MeshPhysicalMaterial({ color: "#f4f1ea", roughness: 0.4, clearcoat: 0.5 })
        : new THREE.MeshPhysicalMaterial({ color: "#3b2a1e", roughness: 0.45, clearcoat: 0.6 }),
      gold: new THREE.MeshStandardMaterial({ color: "#e0b04a", roughness: 0.25, metalness: 0.9 }),
      beard: new THREE.MeshStandardMaterial({ color: "#6f6a63", roughness: 0.95 }),
      frame: new THREE.MeshStandardMaterial({ color: "#0d0b0a", roughness: 0.35 }),
      lens: new THREE.MeshStandardMaterial({ color: "#1d2733", roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.55 }),
    };
    return { all, textures: [print, sleevePrint].filter(Boolean) as THREE.Texture[] };
  }, [woman]);

  useEffect(
    () => () => {
      Object.values(mats.all).forEach((material) => material.dispose());
      mats.textures.forEach((texture) => texture.dispose());
    },
    [mats],
  );
  return mats.all;
}

/** A leg in two parts so the knee can bend. The thigh hangs from `pivot`; the shin from `knee`. */
function Leg({ pivot, knee, x, y, thigh, shin, radius, mats }: { pivot: RefObject<THREE.Group | null>; knee: RefObject<THREE.Group | null>; x: number; y: number; thigh: number; shin: number; radius: number; mats: Mats }) {
  return (
    <group ref={pivot} position={[x, y, 0]}>
      <mesh position={[0, -thigh / 2, 0]} material={mats.bottoms}>
        <capsuleGeometry args={[radius, thigh - radius, 6, 16]} />
      </mesh>
      <group ref={knee} position={[0, -thigh, 0]}>
        <mesh position={[0, -shin / 2, 0]} material={mats.bottoms}>
          <capsuleGeometry args={[radius * 0.85, shin - radius, 6, 16]} />
        </mesh>
        <mesh position={[0, -shin - 0.02, -0.045]} scale={[0.66, 0.42, 1.28]} material={mats.shoe}>
          <sphereGeometry args={[0.085, 20, 14]} />
        </mesh>
      </group>
    </group>
  );
}

/** A full hoodie sleeve in two parts so the elbow bends, with a trimmed cuff and a hand. */
function Arm({ pivot, elbow, x, y, side, mats }: { pivot: RefObject<THREE.Group | null>; elbow: RefObject<THREE.Group | null>; x: number; y: number; side: 1 | -1; mats: Mats }) {
  const upper = 0.27;
  const fore = 0.25;
  return (
    <group ref={pivot} position={[x, y, 0]} rotation={[0, 0, side * 0.1]}>
      <mesh position={[0, 0.005, 0]} scale={[1, 0.85, 1]} material={mats.sleeve}>
        <sphereGeometry args={[0.064, 20, 14]} />
      </mesh>
      <mesh position={[0, -upper / 2, 0]} material={mats.sleeve}>
        <capsuleGeometry args={[0.058, upper - 0.05, 6, 16]} />
      </mesh>
      <group ref={elbow} position={[0, -upper, 0]}>
        <mesh position={[0, -fore / 2, 0]} material={mats.sleeve}>
          <capsuleGeometry args={[0.05, fore - 0.05, 6, 16]} />
        </mesh>
        {/* Orange-striped cuff */}
        <mesh position={[0, -fore + 0.01, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.trim}>
          <torusGeometry args={[0.046, 0.009, 8, 24]} />
        </mesh>
        <mesh position={[0, -fore - 0.025, -0.005]} scale={[0.8, 1.15, 0.6]} material={mats.skin}>
          <sphereGeometry args={[0.04, 14, 12]} />
        </mesh>
      </group>
    </group>
  );
}

const HOODIE: [number, number][] = [
  [0.001, 0], [0.162, 0], [0.172, 0.06], [0.18, 0.22], [0.195, 0.38], [0.2, 0.46], [0.172, 0.53], [0.09, 0.57], [0.055, 0.585], [0.001, 0.585],
];
const HIPS: [number, number][] = [
  [0.001, 0], [0.15, 0], [0.165, 0.06], [0.165, 0.14], [0.155, 0.18], [0.001, 0.18],
];

/** The hoodie: ribbed hem, kangaroo pocket, hood lying back, drawstrings. `depth` is the body's front-to-back scale. */
function Hoodie({ mats, width, depth }: { mats: Mats; width: number; depth: number }) {
  const body = useLathe(HOODIE);
  return (
    <group>
      <mesh geometry={body} scale={[width, 1, depth]} material={mats.hoodie} />
      {/* Ribbed hem with an orange stripe */}
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[width, depth, 1]} material={mats.hoodie}>
        <torusGeometry args={[0.165, 0.018, 10, 40]} />
      </mesh>
      <mesh position={[0, 0.045, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[width, depth, 1]} material={mats.trim}>
        <torusGeometry args={[0.17, 0.006, 8, 40]} />
      </mesh>
      {/* Kangaroo pocket */}
      <mesh position={[0, 0.16, -0.175 * depth]} scale={[1, 0.6, 0.24]} material={mats.hoodie}>
        <sphereGeometry args={[0.11, 24, 14]} />
      </mesh>
      {/* Hood lying back over the shoulders, and the collar */}
      <mesh position={[0, 0.55, 0.085]} rotation={[-0.3, 0, 0]} scale={[1.2, 0.72, 0.82]} material={mats.hoodie}>
        <sphereGeometry args={[0.12, 24, 16]} />
      </mesh>
      <mesh position={[0, 0.578, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.hoodie}>
        <torusGeometry args={[0.064, 0.022, 10, 28]} />
      </mesh>
      {/* Drawstrings */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.034, 0.55, -0.11]} rotation={[0.35, 0, side * 0.05]}>
          <mesh position={[0, -0.065, 0]} material={mats.strings}>
            <capsuleGeometry args={[0.006, 0.12, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.135, 0]} material={mats.strings}>
            <cylinderGeometry args={[0.009, 0.009, 0.024, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Face, ears and neck shared by both. Front is -z. */
function HeadBase({ mats, radius }: { mats: Mats; radius: number }) {
  return (
    <>
      <mesh position={[0, -0.09, 0]} material={mats.skin}>
        <cylinderGeometry args={[0.045, 0.052, 0.1, 16]} />
      </mesh>
      <mesh scale={[0.9, 1.06, 0.97]} material={mats.skin}>
        <sphereGeometry args={[radius, 32, 24]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * radius * 0.9, -0.005, 0.01]} scale={[0.4, 0.75, 0.55]} material={mats.skin}>
          <sphereGeometry args={[0.032, 12, 10]} />
        </mesh>
      ))}
      <mesh position={[0, -0.018, -radius * 0.94]} scale={[0.85, 1, 0.9]} material={mats.skin}>
        <sphereGeometry args={[0.02, 12, 10]} />
      </mesh>
    </>
  );
}

function ManHead({ mats }: { mats: Mats }) {
  const r = 0.106;
  return (
    <group>
      <HeadBase mats={mats} radius={r} />
      {/* Low-cut hair, tilted back so the hairline sits high on the forehead */}
      <mesh rotation={[0.3, 0, 0]} scale={[0.93, 1.08, 1]} material={mats.hair}>
        <sphereGeometry args={[r * 1.03, 32, 20, 0, Math.PI * 2, 0, 1.15]} />
      </mesh>
      {/* Grey goatee, hugging the chin */}
      <mesh position={[0, -0.078, -0.066]} scale={[0.85, 0.75, 0.6]} material={mats.beard}>
        <sphereGeometry args={[0.045, 16, 12]} />
      </mesh>
      {/* Glasses */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.039, 0.016, -0.1]}>
          <mesh material={mats.frame}>
            <torusGeometry args={[0.027, 0.0055, 8, 24]} />
          </mesh>
          <mesh material={mats.lens}>
            <circleGeometry args={[0.025, 20]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.02, -0.102]} material={mats.frame}>
        <boxGeometry args={[0.024, 0.006, 0.006]} />
      </mesh>
    </group>
  );
}

function WomanHead({ mats }: { mats: Mats }) {
  const r = 0.1;
  return (
    <group>
      <HeadBase mats={mats} radius={r} />
      {/* Natural hair pulled back into an afro puff */}
      <mesh rotation={[0.32, 0, 0]} scale={[0.93, 1.08, 1]} material={mats.hair}>
        <sphereGeometry args={[r * 1.05, 32, 20, 0, Math.PI * 2, 0, 1.3]} />
      </mesh>
      <mesh position={[0, 0.085, 0.075]} scale={[1.05, 0.95, 1]} material={mats.hair}>
        <sphereGeometry args={[0.078, 24, 18]} />
      </mesh>
      {/* Gold hoop earrings */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.088, -0.045, 0.005]} material={mats.gold}>
          <torusGeometry args={[0.016, 0.004, 8, 16]} />
        </mesh>
      ))}
    </group>
  );
}

export function Visitor({ gender, pose }: { gender: Gender; pose: RefObject<Pose> }) {
  const woman = gender === "woman";
  const mats = useMaterials(woman);
  const hips = useLathe(HIPS);
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftKnee = useRef<THREE.Group>(null);
  const rightKnee = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftElbow = useRef<THREE.Group>(null);
  const rightElbow = useRef<THREE.Group>(null);

  // Proportions: he is a little taller and broader.
  // Legs are kept fairly short so the figures read as friendly, not lanky.
  const fit = woman
    ? { hip: 0.69, thigh: 0.33, shin: 0.32, leg: 0.058, torsoY: 0.79, width: 1.0, depth: 0.76, shoulderY: 1.27, shoulderX: 0.205, headY: 0.66 }
    : { hip: 0.74, thigh: 0.36, shin: 0.34, leg: 0.066, torsoY: 0.82, width: 1.12, depth: 0.78, shoulderY: 1.3, shoulderX: 0.215, headY: 0.69 };

  useFrame(() => {
    const current = pose.current;
    if (!root.current || !body.current || !current) return;
    root.current.position.set(current.x, 0, current.z);
    root.current.rotation.y = current.yaw;

    const p = current.phase;
    const walk = current.moving;
    const s = Math.sin(p);
    const stride = walk ? 0.5 : 0;

    // Legs swing from the hip; each knee bends as its foot comes through.
    leftLeg.current?.rotation.set(s * stride, 0, 0);
    rightLeg.current?.rotation.set(-s * stride, 0, 0);
    leftKnee.current?.rotation.set(walk ? -Math.max(0, -Math.cos(p)) * 0.75 : 0, 0, 0);
    rightKnee.current?.rotation.set(walk ? -Math.max(0, Math.cos(p)) * 0.75 : 0, 0, 0);

    // Arms swing against the legs with a relaxed bend at the elbow; at rest they breathe slightly.
    const armSwing = walk ? s * 0.42 : Math.sin(p * 0.6) * 0.025;
    leftArm.current?.rotation.set(-armSwing, 0, -0.1);
    rightArm.current?.rotation.set(armSwing, 0, 0.1);
    leftElbow.current?.rotation.set(0.22 + Math.max(0, -armSwing) * 0.5, 0, 0);
    rightElbow.current?.rotation.set(0.22 + Math.max(0, armSwing) * 0.5, 0, 0);

    // The body rises twice a stride, the shoulders counter-turn against the hips, and it breathes when still.
    body.current.position.y = walk ? Math.abs(Math.cos(p)) * 0.022 : 0;
    body.current.rotation.y = walk ? s * 0.07 : 0;
    if (torso.current) {
      torso.current.rotation.y = walk ? -s * 0.12 : 0;
      torso.current.rotation.z = walk ? s * 0.025 : 0;
      torso.current.scale.y = walk ? 1 : 1 + Math.sin(p * 0.6) * 0.006;
    }
  });

  return (
    <group ref={root}>
      {/* Soft contact shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} />
      </mesh>
      <group scale={SCALE}>
        <group ref={body}>
          <Leg pivot={leftLeg} knee={leftKnee} x={-0.085} y={fit.hip} thigh={fit.thigh} shin={fit.shin} radius={fit.leg} mats={mats} />
          <Leg pivot={rightLeg} knee={rightKnee} x={0.085} y={fit.hip} thigh={fit.thigh} shin={fit.shin} radius={fit.leg} mats={mats} />
          {/* Jeans or joggers at the hips */}
          <mesh geometry={hips} position={[0, fit.hip - 0.06, 0]} scale={[fit.width * 0.94, 1, 0.8]} material={mats.bottoms} />
          <group ref={torso} position={[0, fit.torsoY, 0]}>
            <Hoodie mats={mats} width={fit.width} depth={fit.depth} />
            <group position={[0, fit.headY, 0]}>{woman ? <WomanHead mats={mats} /> : <ManHead mats={mats} />}</group>
          </group>
          <Arm pivot={leftArm} elbow={leftElbow} x={-fit.shoulderX} y={fit.shoulderY} side={-1} mats={mats} />
          <Arm pivot={rightArm} elbow={rightElbow} x={fit.shoulderX} y={fit.shoulderY} side={1} mats={mats} />
        </group>
      </group>
    </group>
  );
}
