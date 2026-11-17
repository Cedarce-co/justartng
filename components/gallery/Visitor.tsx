"use client";

import { useRef, type RefObject } from "react";
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

const skin = "#d7a679";
const hair = "#1c1410";
const shoe = "#141210";

function Limb({
  pivot,
  x,
  y,
  length,
  radius,
  color,
  cap,
}: {
  pivot: RefObject<THREE.Group | null>;
  x: number;
  y: number;
  length: number;
  radius: number;
  color: string;
  cap?: string;
}) {
  const drop = length / 2 + radius;
  return (
    <group ref={pivot} position={[x, y, 0]}>
      <mesh position={[0, -drop, 0]} castShadow>
        <capsuleGeometry args={[radius, length, 4, 10]} />
        <meshStandardMaterial color={color} roughness={0.62} />
      </mesh>
      {cap && (
        <mesh position={[0, -(length + radius * 2) + radius * 0.15, 0.02]}>
          {cap === skin ? (
            <sphereGeometry args={[radius * 0.92, 12, 10]} />
          ) : (
            <boxGeometry args={[radius * 2.2, radius * 0.7, radius * 3.1]} />
          )}
          <meshStandardMaterial color={cap} roughness={0.5} />
        </mesh>
      )}
    </group>
  );
}

function Head({ woman }: { woman: boolean }) {
  return (
    <group position={[0, woman ? 1.58 : 1.64, 0]}>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.045, 0.052, 0.1, 10]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      <mesh scale={[0.92, 1.06, 0.96]}>
        <sphereGeometry args={[0.112, 24, 18]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.01, -0.1]}>
        <sphereGeometry args={[0.018, 10, 8]} />
        <meshStandardMaterial color={skin} roughness={0.45} />
      </mesh>
      {woman ? (
        <group>
          <mesh position={[0, 0.04, 0.01]} scale={[1.08, 0.72, 1.08]}>
            <sphereGeometry args={[0.122, 20, 14]} />
            <meshStandardMaterial color={hair} roughness={0.72} />
          </mesh>
          <mesh position={[0, -0.28, 0.055]} rotation={[0.12, 0, 0]}>
            <capsuleGeometry args={[0.062, 0.46, 4, 8]} />
            <meshStandardMaterial color={hair} roughness={0.75} />
          </mesh>
        </group>
      ) : (
        <mesh position={[0, 0.04, -0.006]} scale={[1.08, 0.72, 1.1]}>
          <sphereGeometry args={[0.124, 20, 14]} />
          <meshStandardMaterial color={hair} roughness={0.7} />
        </mesh>
      )}
    </group>
  );
}

function WomanBody() {
  return (
    <group>
      <mesh position={[0, 0.98, 0]}>
        <cylinderGeometry args={[0.15, 0.27, 0.52, 18]} />
        <meshStandardMaterial color="#c4624e" roughness={0.62} />
      </mesh>
      <mesh position={[0, 1.28, 0]}>
        <capsuleGeometry args={[0.125, 0.26, 4, 12]} />
        <meshStandardMaterial color="#c4624e" roughness={0.58} />
      </mesh>
      <mesh position={[0, 1.4, -0.09]} scale={[1.15, 0.35, 0.4]}>
        <sphereGeometry args={[0.13, 12, 8]} />
        <meshStandardMaterial color="#a84e3c" roughness={0.6} />
      </mesh>
      <Head woman />
    </group>
  );
}

function ManBody() {
  return (
    <group>
      <mesh position={[0, 1.22, 0]} scale={[1.12, 1, 0.92]}>
        <capsuleGeometry args={[0.15, 0.36, 4, 12]} />
        <meshStandardMaterial color="#243e46" roughness={0.58} />
      </mesh>
      <mesh position={[-0.16, 1.4, 0]}>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshStandardMaterial color="#243e46" roughness={0.58} />
      </mesh>
      <mesh position={[0.16, 1.4, 0]}>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshStandardMaterial color="#243e46" roughness={0.58} />
      </mesh>
      <mesh position={[0, 1.4, -0.11]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.07, 0.14, 0.02]} />
        <meshStandardMaterial color="#f4ecdf" roughness={0.7} />
      </mesh>
      <Head woman={false} />
    </group>
  );
}

export function Visitor({ gender, pose }: { gender: Gender; pose: React.RefObject<Pose> }) {
  const root = useRef<THREE.Group>(null);
  const bob = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const woman = gender === "woman";

  useFrame(() => {
    const current = pose.current;
    if (!root.current || !bob.current || !current) return;
    root.current.position.set(current.x, 0, current.z);
    root.current.rotation.y = current.yaw;
    const swing = current.moving ? Math.sin(current.phase) * 0.7 : Math.sin(current.phase * 0.6) * 0.03;
    bob.current.position.y = current.moving ? Math.abs(Math.sin(current.phase)) * 0.035 : (Math.sin(current.phase) + 1) * 0.004;
    if (leftLeg.current) leftLeg.current.rotation.set(swing, 0, 0);
    if (rightLeg.current) rightLeg.current.rotation.set(-swing, 0, 0);
    if (leftArm.current) leftArm.current.rotation.set(-swing * 0.65, 0, -0.16);
    if (rightArm.current) rightArm.current.rotation.set(swing * 0.65, 0, 0.16);
  });

  return (
    <group ref={root}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.22, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.18} />
      </mesh>
      <group ref={bob} scale={0.62}>
        <Limb pivot={leftLeg} x={woman ? -0.08 : -0.09} y={woman ? 0.84 : 0.92} length={woman ? 0.68 : 0.74} radius={woman ? 0.05 : 0.058} color={woman ? "#3a2a28" : "#2a2622"} cap={shoe} />
        <Limb pivot={rightLeg} x={woman ? 0.08 : 0.09} y={woman ? 0.84 : 0.92} length={woman ? 0.68 : 0.74} radius={woman ? 0.05 : 0.058} color={woman ? "#3a2a28" : "#2a2622"} cap={shoe} />
        {woman ? <WomanBody /> : <ManBody />}
        <Limb pivot={leftArm} x={woman ? -0.2 : -0.24} y={woman ? 1.36 : 1.4} length={0.34} radius={woman ? 0.04 : 0.046} color={woman ? "#c4624e" : "#243e46"} cap={skin} />
        <Limb pivot={rightArm} x={woman ? 0.2 : 0.24} y={woman ? 1.36 : 1.4} length={0.34} radius={woman ? 0.04 : 0.046} color={woman ? "#c4624e" : "#243e46"} cap={skin} />
      </group>
    </group>
  );
}
