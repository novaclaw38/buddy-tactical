export function CommandOrb({ amplitude }: { amplitude: number }) {
  const scale = 1 + Math.min(Math.max(amplitude, 0), 1) * 0.4;

  return (
    <div
      style={{ transform: `scale(${scale})` }}
      className="w-32 h-32 rounded-full bg-[color:var(--tactical-teal)] shadow-[0_0_40px_var(--tactical-teal)] transition-transform duration-100"
    />
  );
}
