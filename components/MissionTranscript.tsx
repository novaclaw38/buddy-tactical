import { useRef } from "react";

interface Turn {
  role: "child" | "orb";
  content: string;
}

export function MissionTranscript({ turns }: { turns: Turn[] }) {
  const mountedTurnCountRef = useRef(turns.length);

  return (
    <div className="flex flex-col gap-2 max-w-xl w-full">
      {turns.map((turn, index) => {
        const isNewestTurn = index === turns.length - 1;
        const wasPresentOnMount = index < mountedTurnCountRef.current;
        const shouldAnimate = isNewestTurn && !wasPresentOnMount;
        const text = `${turn.role === "orb" ? "COMMANDER" : "CADET"}: ${turn.content}`;

        return (
          <p
            key={index}
            style={shouldAnimate ? { animationDuration: `${Math.min(text.length * 18, 2400)}ms` } : undefined}
            className={`overflow-hidden whitespace-pre-wrap ${
              shouldAnimate ? "animate-terminal-reveal" : ""
            } ${turn.role === "orb" ? "text-[color:var(--tactical-teal)]" : "text-[color:var(--alert-orange)]"}`}
          >
            {text}
          </p>
        );
      })}
    </div>
  );
}
