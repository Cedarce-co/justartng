"use client";

import { motion, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Wraps an image so it pops forward on hover and tilts toward the cursor,
 * then springs back when the pointer leaves. Touch screens get a tap pop.
 */
export function InteractiveImage({
  children,
  className = "",
  pop = 1.15,
  tilt = 12,
}: {
  children: ReactNode;
  className?: string;
  /** Scale while hovered. */
  pop?: number;
  /** Maximum tilt in degrees while hovered. */
  tilt?: number;
}) {
  const reduced = useReducedMotion();
  const [finePointer, setFinePointer] = useState(false);
  const [active, setActive] = useState(false);
  const rotateX = useSpring(0, { stiffness: 220, damping: 18 });
  const rotateY = useSpring(0, { stiffness: 220, damping: 18 });

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFinePointer(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (reduced) return <div className={className}>{children}</div>;

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!finePointer) return;
    const rect = event.currentTarget.getBoundingClientRect();
    rotateY.set(((event.clientX - rect.left) / rect.width - 0.5) * tilt * 2);
    rotateX.set(-((event.clientY - rect.top) / rect.height - 0.5) * tilt * 2);
  };

  return (
    <motion.div
      className={`relative ${className}`}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
        zIndex: active ? 40 : undefined,
        filter: "drop-shadow(0 0 0 rgba(0,0,0,0)) brightness(1)",
      }}
      whileHover={finePointer ? { scale: pop, filter: "drop-shadow(0 30px 45px rgba(0,0,0,0.45)) brightness(1.06)" } : undefined}
      whileTap={finePointer ? undefined : { scale: pop }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
      onHoverStart={() => setActive(true)}
      onHoverEnd={() => {
        setActive(false);
        rotateX.set(0);
        rotateY.set(0);
      }}
      onPointerMove={onPointerMove}
    >
      {children}
    </motion.div>
  );
}
