export type GlideTarget = {
  x: number;
  y: number;
  z: number;
  faceYaw: number;
  focusX: number;
  focusY: number;
  focusZ: number;
  span: number;
};

export const galleryBus: {
  glideTo: GlideTarget | null;
  reduced: boolean;
  moving: boolean;
  pace: number;
  chime: boolean;
  viewing: boolean;
  wide: boolean;
  /** Where the visitor stands, so the studio companion can comment on what's nearby. */
  x: number;
  z: number;
} = {
  glideTo: null,
  reduced: false,
  moving: false,
  pace: 1,
  chime: false,
  viewing: false,
  wide: true,
  x: 1.5,
  z: 2.2,
};
