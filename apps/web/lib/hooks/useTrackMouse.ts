import { useCallback } from "react";

/**
 * Returns an onMouseMove handler that sets --mx and --my CSS variables
 * on the target element based on mouse position (as percentage).
 * Used for card hover glow effect that follows the cursor.
 */
export function useTrackMouse() {
  return useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 100;
    const my = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--mx", `${mx.toFixed(1)}%`);
    el.style.setProperty("--my", `${my.toFixed(1)}%`);
  }, []);
}
