"use client";

import { useEffect, useState } from "react";

/**
 * Whether the 3D studio is open yet. Starts from the server's answer (so the first paint matches),
 * then keeps checking the visitor's clock, so the studio appears on the day without a reload.
 */
export function useStudioOpen(opensAt: number, initial: boolean) {
  const [open, setOpen] = useState(initial);
  useEffect(() => {
    if (open) return;
    const check = () => {
      if (Date.now() >= opensAt) setOpen(true);
    };
    check();
    const timer = window.setInterval(check, 30_000);
    return () => window.clearInterval(timer);
  }, [open, opensAt]);
  return open;
}
