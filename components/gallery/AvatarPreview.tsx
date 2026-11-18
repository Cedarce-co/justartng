"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Visitor, type Gender, type Pose } from "@/components/gallery/Visitor";

/** Where each figure stands, how far off to the side it starts, and how long the walk-in takes. */
const SPOT = 0.42;
const WALK_FROM = 1.15;
const WALK_SECONDS = 1.7;

function shortestAngle(from: number, to: number) {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

/**
 * Walks a figure in from one side to its spot, turns it to face the viewer,
 * then sways it gently so its face and outfit both show.
 */
function Showcase({ gender, reduced, from, delay }: { gender: Gender; reduced: boolean; from: -1 | 1; delay: number }) {
  // Front is -z: a yaw of π faces the camera, -π/2 walks towards +x, π/2 towards -x.
  const walkYaw = from < 0 ? -Math.PI / 2 : Math.PI / 2;
  const home = from * SPOT;
  const start = from * (SPOT + WALK_FROM);
  const pose = useRef<Pose>({ x: reduced ? home : start, z: 0, yaw: reduced ? Math.PI : walkYaw, moving: false, phase: 0 });
  const clock = useRef(0);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const body = pose.current;
    clock.current += dt;
    const t = clock.current - delay;

    if (reduced) {
      body.phase += dt * 1.4;
      return;
    }
    if (t < 0) return; // waiting off to the side

    if (t < WALK_SECONDS) {
      // Walking in, easing to a stop.
      const k = t / WALK_SECONDS;
      const eased = 1 - Math.pow(1 - k, 2);
      body.x = start + (home - start) * eased;
      body.yaw = walkYaw;
      body.moving = k < 0.92;
      body.phase += dt * (body.moving ? 8 : 1.4);
      return;
    }

    // Arrived: turn to face the viewer, then sway gently.
    body.x = home;
    body.moving = false;
    body.phase += dt * 1.4;
    const settle = Math.min(1, (t - WALK_SECONDS) / 0.6);
    const sway = Math.sin((t - WALK_SECONDS) * 0.5) * 0.5 * settle;
    body.yaw += shortestAngle(body.yaw, Math.PI + sway) * (1 - Math.exp(-6 * dt));
  });

  return <Visitor gender={gender} pose={pose} />;
}

/**
 * Both visitors in one small 3D view: he walks in from the left, she from the right.
 * One view rather than two keeps phones well inside their limit on 3D views,
 * so the studio itself never loses its paintings.
 */
export function AvatarStage({ reduced }: { reduced: boolean }) {
  return (
    <Canvas
      className="pointer-events-none"
      camera={{ fov: 30, position: [0, 0.56, 2.5], near: 0.1, far: 10 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl, camera }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        camera.lookAt(0, 0.48, 0);
      }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[1.5, 2.5, 2.5]} intensity={2.2} color="#fff4e6" />
      <directionalLight position={[-2, 1.5, -1]} intensity={1.2} color="#9ab8ff" />
      <Showcase gender="man" reduced={reduced} from={-1} delay={0.5} />
      <Showcase gender="woman" reduced={reduced} from={1} delay={0.75} />
    </Canvas>
  );
}
