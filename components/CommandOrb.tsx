"use client";

import { useEffect, useState } from "react";

export function CommandOrb({ amplitude }: { amplitude: number }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(query.matches);
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  const clamped = Math.min(Math.max(amplitude, 0), 1);
  const coreScale = prefersReducedMotion ? 1 : 1 + clamped * 0.25;
  const ringScale = prefersReducedMotion ? 1 : 1 + clamped * 0.12;
  const ringRotation = prefersReducedMotion ? 0 : clamped * 25;
  // Reduced motion keeps the Orb reacting to voice amplitude — just via
  // glow/opacity intensity instead of scale/rotate, per the animate
  // skill's "reduce spatial movement, preserve meaningful feedback" rule.
  const reactiveOpacity = prefersReducedMotion ? 0.6 + clamped * 0.4 : 1;

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <div
        style={{ transform: `scale(${ringScale}) rotate(${ringRotation}deg)`, opacity: reactiveOpacity }}
        className="absolute inset-0 rounded-full border border-[color:var(--tactical-teal)]/40 transition-transform transition-opacity duration-150 ease-out"
      />
      <div
        style={{
          transform: `scale(${prefersReducedMotion ? 1 : ringScale * 0.85}) rotate(${prefersReducedMotion ? 0 : clamped * -18}deg)`,
          opacity: reactiveOpacity,
        }}
        className="absolute inset-3 rounded-full border border-[color:var(--tactical-teal)]/25 transition-transform transition-opacity duration-150 ease-out"
      />
      <div
        style={{
          transform: `scale(${coreScale})`,
          boxShadow: prefersReducedMotion
            ? `0 6px ${24 + clamped * 20}px -4px var(--tactical-teal)`
            : undefined,
        }}
        className="w-16 h-16 rounded-full bg-[color:var(--tactical-teal)] shadow-[0_6px_24px_-4px_var(--tactical-teal)] transition-transform duration-100 ease-out"
      />
    </div>
  );
}
