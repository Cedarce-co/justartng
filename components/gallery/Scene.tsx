"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Room, Wall, Work } from "@/lib/content";
import { DOOR, LABEL_WIDTH, ROOM, hangWork, labelPose } from "@/lib/gallery";

export type HungWork = Work & { wall: Wall; position: number };
import { galleryBus } from "@/components/gallery/bus";
import type { Ambience } from "@/components/gallery/ambience";
import { Visitor, type Gender, type Pose } from "@/components/gallery/Visitor";

const LIGHTS: [number, number, number][] = [
  [-4, 3.8, -1],
  [4, 3.8, -1],
  [0, 3.8, 2.5],
  [-5, 3.8, 2],
  [5, 3.8, 2],
];

function shortestAngle(from: number, to: number) {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function workIndex(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (typeof current.userData.workIndex === "number") return current.userData.workIndex as number;
    current = current.parent;
  }
  return null;
}

function isFormField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function useFloorTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 640;
    const context = canvas.getContext("2d");
    if (!context) return null;
    let seed = 5;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let row = 0; row < 16; row += 1) {
      context.fillStyle = `hsl(28 ${32 + random() * 10}% ${38 + random() * 10}%)`;
      context.fillRect(0, row * 40, 1024, 40);
      context.fillStyle = "rgba(0,0,0,.25)";
      context.fillRect(0, row * 40, 1024, 2);
      for (let mark = 0; mark < 5; mark += 1) context.fillRect(random() * 1024, row * 40, 2, 40);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return map;
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

function WallLabel({ text, width, position, rotation }: { text: string; width: number; position: [number, number, number]; rotation: [number, number, number] }) {
  const texture = useMemo(() => {
    const height = 0.4;
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * 160);
    canvas.height = Math.ceil(height * 160);
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "#2a2723";
    context.font = `600 ${height * 100}px Newsreader, Georgia, serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [text, width]);

  useEffect(() => () => texture?.dispose(), [texture]);
  if (!texture) return null;

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, 0.4]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
}

/** Text height of a painting's title on the wall, in metres. */
const TITLE_HEIGHT = 0.085;

/** The painting's title, painted on the wall just above its frame. */
function FrameTitle({ text, y, index }: { text: string; y: number; index: number }) {
  const label = useMemo(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return null;
    const px = 96;
    const font = `italic 500 ${px}px Newsreader, Georgia, serif`;
    context.font = font;
    canvas.width = Math.ceil(context.measureText(text).width + px * 0.6);
    canvas.height = Math.ceil(px * 1.4);
    context.font = font; // resizing the canvas resets its state
    context.fillStyle = "#2a2723";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    const height = TITLE_HEIGHT * 1.4;
    return { map, width: (height * canvas.width) / canvas.height, height };
  }, [text]);

  useEffect(() => () => label?.map.dispose(), [label]);
  if (!label) return null;

  return (
    <mesh position={[0, y, 0.01]} userData={{ workIndex: index }}>
      <planeGeometry args={[label.width, label.height]} />
      <meshBasicMaterial map={label.map} transparent toneMapped={false} />
    </mesh>
  );
}

function Artwork({ work, index, texture }: { work: HungWork; index: number; texture: THREE.Texture | null }) {
  const place = hangWork(work);
  return (
    <group position={[place.x, place.y, place.z]} rotation={[0, place.rotY, 0]} userData={{ workIndex: index }}>
      <FrameTitle text={work.title} y={work.heightM / 2 + 0.04 + TITLE_HEIGHT * 1.1} index={index} />
      <mesh position={[0, 0, 0.025]} userData={{ workIndex: index }}>
        <boxGeometry args={[work.widthM + 0.08, work.heightM + 0.08, 0.05]} />
        <meshStandardMaterial color="#1d1a17" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.055]} userData={{ workIndex: index }}>
        <planeGeometry args={[work.widthM, work.heightM]} />
        <meshBasicMaterial map={texture ?? undefined} color={texture ? "#ffffff" : "#cfcac0"} toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * The door to the next room, on the front wall. Behind it glows the next room, named on the light.
 * When `open`, the leaf swings into the room on its hinge.
 */
function Door({ next, open, doorRef }: { next: Room; open: boolean; doorRef: RefObject<THREE.Group | null> }) {
  const leaf = useRef<THREE.Group>(null);
  const post = 0.09;

  useFrame((_, dt) => {
    if (!leaf.current) return;
    const target = open ? -1.75 : 0;
    const blend = galleryBus.reduced ? 1 : 1 - Math.exp(-5 * dt);
    leaf.current.rotation.y += (target - leaf.current.rotation.y) * blend;
  });

  return (
    // Turned to face into the room from the front wall.
    <group ref={doorRef} position={[0, 0, DOOR.z - 0.02]} rotation={[0, Math.PI, 0]} userData={{ door: true }}>
      {/* The next room, glowing through the doorway */}
      <mesh position={[0, DOOR.h / 2, -0.01]} userData={{ door: true }}>
        <planeGeometry args={[DOOR.w, DOOR.h]} />
        <meshBasicMaterial color={next.wallColor} toneMapped={false} />
      </mesh>
      <WallLabel text={next.name} width={DOOR.w} position={[0, DOOR.h * 0.62, -0.005]} rotation={[0, 0, 0]} />

      {/* Frame */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (DOOR.w / 2 + post / 2), DOOR.h / 2, 0.03]} userData={{ door: true }}>
          <boxGeometry args={[post, DOOR.h + post, 0.08]} />
          <meshStandardMaterial color="#1d1a17" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, DOOR.h + post / 2, 0.03]} userData={{ door: true }}>
        <boxGeometry args={[DOOR.w + post * 2, post, 0.08]} />
        <meshStandardMaterial color="#1d1a17" roughness={0.6} />
      </mesh>

      {/* Leaf, hinged on its left edge */}
      <group ref={leaf} position={[-DOOR.w / 2, 0, 0.02]}>
        <mesh position={[DOOR.w / 2, DOOR.h / 2, 0]} userData={{ door: true }}>
          <boxGeometry args={[DOOR.w, DOOR.h, 0.05]} />
          <meshStandardMaterial color="#5a3d28" roughness={0.55} />
        </mesh>
        {/* Panels and handle */}
        {[0.3, 0.72].map((height) => (
          <mesh key={height} position={[DOOR.w / 2, DOOR.h * height, 0.03]} userData={{ door: true }}>
            <boxGeometry args={[DOOR.w * 0.7, DOOR.h * 0.32, 0.01]} />
            <meshStandardMaterial color="#4a3120" roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[DOOR.w - 0.14, DOOR.h * 0.47, 0.06]} userData={{ door: true }}>
          <sphereGeometry args={[0.04, 16, 12]} />
          <meshStandardMaterial color="#d8b25a" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>

      {/* Sign above the door */}
      <WallLabel text={`To ${next.name}`} width={3} position={[0, DOOR.h + 0.42, 0.01]} rotation={[0, 0, 0]} />
      <pointLight position={[0, DOOR.h + 0.6, 0.8]} color="#fff1dc" intensity={2.5} distance={4} decay={2} />
    </group>
  );
}

function isDoor(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.userData.door) return true;
    current = current.parent;
  }
  return false;
}

function turnToward(current: number, target: number, dt: number) {
  return current + shortestAngle(current, target) * (1 - Math.exp(-8 * dt));
}

function Walker({
  art,
  door,
  floor,
  pose,
  onSelect,
  onDoor,
  onInterrupt,
  onArrive,
}: {
  art: RefObject<THREE.Group | null>;
  door: RefObject<THREE.Group | null>;
  floor: RefObject<THREE.Mesh | null>;
  pose: RefObject<Pose>;
  onSelect: (index: number) => void;
  onDoor: () => void;
  onInterrupt: () => void;
  onArrive: () => void;
}) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const pos = useRef(new THREE.Vector3(1.5, 0, 2.2));
  const avatarYaw = useRef(0);
  const walk = useRef<THREE.Vector3 | null>(null);
  const glide = useRef<{
    from: THREE.Vector3;
    to: THREE.Vector3;
    fromLook: number;
    toLook: number;
    t: number;
  } | null>(null);
  const shot = useRef<{ focus: THREE.Vector3; span: number; yaw: number } | null>(null);
  const keys = useRef<Record<string, boolean>>({});
  const nudge = useRef({ x: 0, z: 0 });
  const interruptRef = useRef(onInterrupt);
  const arriveRef = useRef(onArrive);
  interruptRef.current = onInterrupt;
  arriveRef.current = onArrive;
  const desired = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const element = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let down: { x: number; y: number; moved: number } | null = null;

    const cast = (clientX: number, clientY: number, objects: THREE.Object3D[]) => {
      const rect = element.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      return raycaster.intersectObjects(objects, true);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isFormField(event.target)) return;
      keys.current[event.code] = true;
      if (event.code.startsWith("Arrow")) event.preventDefault();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keys.current[event.code] = false;
    };
    const clearKeys = () => {
      keys.current = {};
    };
    const onPointerDown = (event: PointerEvent) => {
      down = { x: event.clientX, y: event.clientY, moved: 0 };
      element.setPointerCapture(event.pointerId);
      element.style.cursor = "grabbing";
    };
    const onPointerMove = (event: PointerEvent) => {
      if (down) {
        const dx = event.clientX - down.x;
        const dy = event.clientY - down.y;
        down.moved += Math.abs(dx) + Math.abs(dy);
        down.x = event.clientX;
        down.y = event.clientY;
        yaw.current -= dx * 0.004;
        pitch.current = Math.max(-1.1, Math.min(1.1, pitch.current - dy * 0.004));
        if (shot.current) shot.current = null;
        if (glide.current || walk.current) {
          glide.current = null;
          walk.current = null;
          shot.current = null;
          galleryBus.glideTo = null;
          interruptRef.current();
        }
        return;
      }
      if (event.pointerType !== "mouse" || !art.current) return;
      const targets = door.current ? [art.current, door.current] : [art.current];
      const hits = cast(event.clientX, event.clientY, targets);
      element.style.cursor = hits.some((hit) => workIndex(hit.object) != null || isDoor(hit.object)) ? "pointer" : "grab";
    };
    const onPointerUp = (event: PointerEvent) => {
      const moved = down?.moved ?? 0;
      down = null;
      element.style.cursor = "grab";
      if (moved >= 6 || event.detail >= 2 || !art.current) return;
      const hits = cast(event.clientX, event.clientY, [art.current]);
      for (const hit of hits) {
        const index = workIndex(hit.object);
        if (index != null) {
          onSelect(index);
          return;
        }
      }
      if (door.current && cast(event.clientX, event.clientY, [door.current]).length > 0) {
        onDoor();
        return;
      }
      if (!floor.current) return;
      const floorHit = cast(event.clientX, event.clientY, [floor.current])[0];
      if (floorHit) sendTo(floorHit.point.clone());
    };
    const sendTo = (point: THREE.Vector3) => {
      point.x = Math.max(-7.1, Math.min(7.1, point.x));
      point.z = Math.max(-4.15, Math.min(4.15, point.z));
      point.y = 0;
      walk.current = point;
      glide.current = null;
      shot.current = null;
      galleryBus.glideTo = null;
      interruptRef.current();
    };
    const onPointerCancel = () => {
      down = null;
      element.style.cursor = "grab";
    };
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? 140 : 1;
      nudge.current.z += -event.deltaY * unit * 0.012;
      nudge.current.x += event.deltaX * unit * 0.012;
    };
    const onDoubleClick = (event: MouseEvent) => {
      if (!floor.current) return;
      const hit = cast(event.clientX, event.clientY, [floor.current])[0];
      if (!hit) return;
      sendTo(hit.point.clone());
    };

    element.style.cursor = "grab";
    element.style.touchAction = "none";
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearKeys);
    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerCancel);
    element.addEventListener("dblclick", onDoubleClick);
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerCancel);
      element.removeEventListener("dblclick", onDoubleClick);
      element.removeEventListener("wheel", onWheel);
    };
  }, [art, camera, door, floor, gl, onSelect, onDoor]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const request = galleryBus.glideTo;
    if (request) {
      galleryBus.glideTo = null;
      shot.current = {
        focus: new THREE.Vector3(request.focusX, request.focusY, request.focusZ),
        span: request.span,
        yaw: request.faceYaw,
      };
      if (galleryBus.reduced) {
        pos.current.set(request.x, 0, request.z);
        yaw.current = request.faceYaw;
        avatarYaw.current = request.faceYaw;
        pitch.current = 0;
        glide.current = null;
        walk.current = null;
        arriveRef.current();
      } else {
        glide.current = {
          from: pos.current.clone(),
          to: new THREE.Vector3(request.x, 0, request.z),
          fromLook: yaw.current,
          toLook: request.faceYaw,
          t: 0,
        };
        walk.current = null;
      }
    }

    const pressed = keys.current;
    const pace = pressed.ShiftLeft || pressed.ShiftRight ? 1.6 : 1;
    const step = (pace > 1 ? 4 : 2) * dt;
    let forward = 0;
    let strafe = 0;
    if (pressed.KeyW) forward += 1;
    if (pressed.KeyS) forward -= 1;
    if (pressed.KeyD) strafe += 1;
    if (pressed.KeyA) strafe -= 1;
    if (pressed.ArrowLeft) yaw.current += 1.6 * dt;
    if (pressed.ArrowRight) yaw.current -= 1.6 * dt;
    if (pressed.ArrowUp) pitch.current = Math.min(1.1, pitch.current + dt);
    if (pressed.ArrowDown) pitch.current = Math.max(-1.1, pitch.current - dt);
    const trackForward = Math.max(-0.45, Math.min(0.45, nudge.current.z));
    const trackStrafe = Math.max(-0.45, Math.min(0.45, nudge.current.x));
    nudge.current.x = 0;
    nudge.current.z = 0;

    let moving = false;
    if (forward || strafe || trackForward || trackStrafe) {
      const guided = Boolean(glide.current || walk.current || shot.current);
      glide.current = null;
      walk.current = null;
      shot.current = null;
      galleryBus.glideTo = null;
      if (guided || galleryBus.viewing) interruptRef.current();
      const ahead = forward * step + trackForward;
      const side = strafe * step + trackStrafe;
      pos.current.x += -Math.sin(yaw.current) * ahead + Math.cos(yaw.current) * side;
      pos.current.z += -Math.cos(yaw.current) * ahead - Math.sin(yaw.current) * side;
      avatarYaw.current = turnToward(avatarYaw.current, yaw.current, dt);
      moving = true;
    } else if (walk.current) {
      const dx = walk.current.x - pos.current.x;
      const dz = walk.current.z - pos.current.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 0.08) walk.current = null;
      else {
        const paceStep = Math.min(distance, 2.4 * dt);
        pos.current.x += (dx / distance) * paceStep;
        pos.current.z += (dz / distance) * paceStep;
        avatarYaw.current = turnToward(avatarYaw.current, Math.atan2(-dx, -dz), dt);
        moving = true;
      }
    } else if (glide.current) {
      const current = glide.current;
      current.t = Math.min(1, current.t + dt / 1.35);
      const eased = current.t * current.t * (3 - 2 * current.t);
      pos.current.lerpVectors(current.from, current.to, eased);
      const dx = current.to.x - pos.current.x;
      const dz = current.to.z - pos.current.z;
      const remaining = Math.hypot(dx, dz);
      const face = remaining > 0.4 ? Math.atan2(-dx, -dz) : current.toLook;
      avatarYaw.current = turnToward(avatarYaw.current, face, dt);
      yaw.current = current.fromLook + shortestAngle(current.fromLook, current.toLook) * eased;
      pitch.current *= 1 - eased;
      moving = current.t < 1;
      if (current.t >= 1) {
        pos.current.copy(current.to);
        avatarYaw.current = current.toLook;
        yaw.current = current.toLook;
        glide.current = null;
        arriveRef.current();
      }
    }

    pos.current.x = Math.max(-7.1, Math.min(7.1, pos.current.x));
    pos.current.z = Math.max(-4.15, Math.min(4.15, pos.current.z));
    galleryBus.moving = moving;
    galleryBus.pace = pace;
    const body = pose.current;
    body.x = pos.current.x;
    body.z = pos.current.z;
    body.yaw = avatarYaw.current;
    body.moving = moving;
    body.phase += dt * (moving ? (pace > 1 ? 11 : 8) : 1.4);

    const viewing = galleryBus.viewing && shot.current;
    let targetFov = 52;
    if (viewing && shot.current) {
      const { focus, span, yaw: face } = shot.current;
      const half = THREE.MathUtils.degToRad(18);
      const aspect = (camera as THREE.PerspectiveCamera).aspect || 1;
      const halfAcross = Math.tan(half) * aspect;
      // Desktop: the painting fills most of the height beside the details card.
      // Phones: it sits in the top half of the screen, clear of the card, and fits the narrow width too.
      const fill = galleryBus.wide ? 0.74 : 0.34;
      const fitHeight = span / (2 * Math.tan(half) * fill);
      const fitWidth = span / (2 * halfAcross * 0.86);
      const dist = THREE.MathUtils.clamp(Math.max(fitHeight, fitWidth), 1.7, galleryBus.wide ? 3.3 : 7);
      const nx = Math.sin(face);
      const nz = Math.cos(face);
      desired.set(focus.x + nx * dist, focus.y + span * 0.06, focus.z + nz * dist);
      const slide = galleryBus.wide ? dist * 0.2 : 0;
      // Aim below the painting so it rises to the upper part of a phone screen.
      const lift = galleryBus.wide ? 0 : 0.2 * 2 * dist * Math.tan(half);
      look.set(focus.x + Math.cos(face) * slide, focus.y - lift, focus.z - Math.sin(face) * slide);
      targetFov = 36;
    } else {
      desired.set(pos.current.x + Math.sin(yaw.current) * 2.6, 1.7 + pitch.current * 0.35, pos.current.z + Math.cos(yaw.current) * 2.6);
      desired.y = Math.max(0.7, Math.min(3.2, desired.y));
      look.set(pos.current.x - Math.sin(yaw.current) * 1.8, 1.05, pos.current.z - Math.cos(yaw.current) * 1.8);
    }
    desired.x = Math.max(-7.6, Math.min(7.6, desired.x));
    desired.z = Math.max(-4.7, Math.min(4.7, desired.z));
    const blend = galleryBus.reduced ? 1 : 1 - Math.exp((viewing ? -2.6 : -8) * dt);
    if (galleryBus.reduced) camera.position.copy(desired);
    else camera.position.lerp(desired, blend);
    camera.lookAt(look);
    const persp = camera as THREE.PerspectiveCamera;
    if (persp.isPerspectiveCamera) {
      const next = THREE.MathUtils.lerp(persp.fov, targetFov, blend);
      if (Math.abs(next - persp.fov) > 0.04) {
        persp.fov = next;
        persp.updateProjectionMatrix();
      }
    }
  });

  return null;
}

/** Keeps the studio music playing and rings the chime on arrival. There are no footstep sounds. */
function Soundscape({ ambience }: { ambience: RefObject<Ambience | null> }) {
  useFrame((_, dt) => {
    const sound = ambience.current;
    if (!sound) return;
    sound.update(dt);
    if (galleryBus.chime) {
      galleryBus.chime = false;
      sound.chime();
    }
  });
  return null;
}

export function Scene({
  room,
  works,
  textures,
  gender,
  ambience,
  nextRoom,
  doorOpen,
  onSelect,
  onDoor,
  onInterrupt,
  onArrive,
}: {
  room: Room;
  works: HungWork[];
  textures: Record<string, THREE.Texture | undefined>;
  gender: Gender | null;
  ambience: RefObject<Ambience | null>;
  /** The room on the other side of the door, if there is one. */
  nextRoom: Room | null;
  doorOpen: boolean;
  onSelect: (index: number) => void;
  onDoor: () => void;
  onInterrupt: () => void;
  onArrive: () => void;
}) {
  const floorTexture = useFloorTexture();
  const art = useRef<THREE.Group>(null);
  const door = useRef<THREE.Group>(null);
  const floor = useRef<THREE.Mesh>(null);
  const pose = useRef<Pose>({ x: 1.5, z: 2.2, yaw: 0, moving: false, phase: 0 });
  const backLabel = labelPose("back");

  return (
    <>
      <color attach="background" args={["#dedad2"]} />
      <ambientLight intensity={0.55} color="#fff8f2" />
      <hemisphereLight args={["#ffffff", "#b7a894", 0.28]} />
      {LIGHTS.map((position) => (
        <pointLight key={position.join(",")} position={position} color="#fff1dc" intensity={6} distance={16} decay={2} />
      ))}
      <mesh position={[0, ROOM.h / 2, 0]}>
        <boxGeometry args={[ROOM.w, ROOM.h, ROOM.d]} />
        <meshStandardMaterial color={room.wallColor} side={THREE.BackSide} roughness={1} />
      </mesh>
      <mesh ref={floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial map={floorTexture ?? undefined} color={floorTexture ? "#ffffff" : "#8a6244"} roughness={0.7} />
      </mesh>
      <mesh position={[0, ROOM.h - 0.03, -1]}>
        <boxGeometry args={[10, 0.04, 0.3]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.225, -1.2]}>
        <boxGeometry args={[2.4, 0.45, 0.7]} />
        <meshStandardMaterial color="#2a2723" roughness={0.8} />
      </mesh>
      <group ref={art}>
        {works.map((work, index) => (
          <Artwork key={work.slug} work={work} index={index} texture={textures[work.slug] ?? null} />
        ))}
      </group>
      {/* The room's name, painted high on the back wall */}
      <WallLabel text={room.name} width={LABEL_WIDTH.back} position={backLabel.position} rotation={backLabel.rotation} />
      {nextRoom && <Door next={nextRoom} open={doorOpen} doorRef={door} />}
      {gender && <Visitor gender={gender} pose={pose} />}
      <Walker art={art} door={door} floor={floor} pose={pose} onSelect={onSelect} onDoor={onDoor} onInterrupt={onInterrupt} onArrive={onArrive} />
      <Soundscape ambience={ambience} />
    </>
  );
}
