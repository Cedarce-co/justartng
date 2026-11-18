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

/** The door between rooms: centred on the front wall, behind visitors as they enter. */
export const DOOR = { w: 1.3, h: 2.4, z: ROOM.d / 2 } as const;

/** Where the visitor stops to open the door: a few steps in front of it, facing it. */
export const DOOR_VIEW = {
  x: 0,
  y: 0,
  z: DOOR.z - 1.7,
  faceYaw: Math.PI,
  focusX: 0,
  focusY: DOOR.h / 2,
  focusZ: DOOR.z,
  span: DOOR.h,
};

/** Usable length of each wall, keeping paintings clear of the corners. */
const SPAN = { back: 13, side: 7.2 } as const;

/**
 * Hangs a room's paintings in order as a clockwise tour: the left wall from the
 * entrance to the back, across the back wall, then the right wall back to the entrance.
 * Each wall's paintings are spaced evenly along it.
 */
export function layoutRoom<T>(list: T[]): (T & { wall: Wall; position: number })[] {
  const back = Math.round(list.length * 0.45);
  const left = Math.ceil((list.length - back) / 2);
  const right = list.length - back - left;
  const spread = (count: number, span: number) => Array.from({ length: count }, (_, i) => -span / 2 + (span * (i + 0.5)) / count);

  const leftZ = spread(left, SPAN.side).reverse();
  const backX = spread(back, SPAN.back);
  const rightZ = spread(right, SPAN.side);

  return list.map((item, i) => {
    if (i < left) return { ...item, wall: "left" as const, position: leftZ[i] };
    if (i < left + back) return { ...item, wall: "back" as const, position: backX[i - left] };
    return { ...item, wall: "right" as const, position: rightZ[i - left - back] };
  });
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
