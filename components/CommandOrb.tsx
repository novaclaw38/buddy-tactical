export function CommandOrb({ amplitude }: { amplitude: number }) {
  const clamped = Math.min(Math.max(amplitude, 0), 1);
  const coreScale = 1 + clamped * 0.25;
  const ringScale = 1 + clamped * 0.12;

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <div
        style={{ transform: `scale(${ringScale}) rotate(${clamped * 25}deg)` }}
        className="absolute inset-0 rounded-full border border-[color:var(--tactical-teal)]/40 transition-transform duration-150 ease-out"
      />
      <div
        style={{ transform: `scale(${ringScale * 0.85}) rotate(${clamped * -18}deg)` }}
        className="absolute inset-3 rounded-full border border-[color:var(--tactical-teal)]/25 transition-transform duration-150 ease-out"
      />
      <div
        style={{ transform: `scale(${coreScale})` }}
        className="w-16 h-16 rounded-full bg-[color:var(--tactical-teal)] shadow-[0_6px_24px_-4px_var(--tactical-teal)] transition-transform duration-100 ease-out"
      />
    </div>
  );
}
