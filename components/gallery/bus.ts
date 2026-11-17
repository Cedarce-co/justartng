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
} = {
  glideTo: null,
  reduced: false,
  moving: false,
  pace: 1,
  chime: false,
  viewing: false,
  wide: true,
};
