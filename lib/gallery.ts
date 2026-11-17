import type { Wall } from "@/lib/content";

export const ROOM = { w: 16, d: 10, h: 4.5 } as const;

export const LABEL_WIDTH: Record<Wall, number> = { back: 6, left: 4, right: 3 };

const NORMAL: Record<Wall, { x: number; y: number; z: number }> = {
  back: { x: 0, y: 0, z: 1 },
  left: { x: 1, y: 0, z: 0 },
  right: { x: -1, y: 0, z: 0 },
};

export function asWall(wall: string): Wall {
  if (wall === "left" || wall === "right" || wall === "back") return wall;
  return "back";
}

export function hangWork(work: { wall: string; position: number; widthM: number; heightM: number }) {
  const wall = asWall(work.wall);
  const normal = NORMAL[wall];
  const position =
    wall === "back"
      ? { x: work.position, y: 1.65, z: -ROOM.d / 2 + 0.04 }
      : wall === "left"
        ? { x: -ROOM.w / 2 + 0.04, y: 1.65, z: work.position }
        : { x: ROOM.w / 2 - 0.04, y: 1.65, z: work.position };
  const distance = 2.05 + Math.max(work.widthM, work.heightM) * 0.45;
  const faceYaw = Math.atan2(normal.x, normal.z);
  return {
    wall,
    x: position.x,
    y: position.y,
    z: position.z,
    rotY: faceYaw,
    view: {
      x: position.x + normal.x * distance,
      y: 0,
      z: position.z + normal.z * distance,
      faceYaw,
      focusX: position.x,
      focusY: position.y,
      focusZ: position.z,
      span: Math.max(work.widthM, work.heightM),
    },
  };
}

export function labelPose(wall: Wall) {
  if (wall === "back") {
    return { position: [0, 3.7, -ROOM.d / 2 + 0.03] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] };
  }
  if (wall === "left") {
    return { position: [-ROOM.w / 2 + 0.03, 3.7, 0] as [number, number, number], rotation: [0, Math.PI / 2, 0] as [number, number, number] };
  }
  return { position: [ROOM.w / 2 - 0.03, 3.7, 0] as [number, number, number], rotation: [0, -Math.PI / 2, 0] as [number, number, number] };
}
