interface Turn {
  role: "child" | "orb";
  content: string;
}

export function MissionTranscript({ turns }: { turns: Turn[] }) {
  return (
    <div className="flex flex-col gap-2 max-w-xl w-full">
      {turns.map((turn, index) => (
        <p
          key={index}
          className={turn.role === "orb" ? "text-[color:var(--tactical-teal)]" : "text-[color:var(--alert-orange)]"}
        >
          {`${turn.role === "orb" ? "COMMANDER" : "CADET"}: ${turn.content}`}
        </p>
      ))}
    </div>
  );
}
