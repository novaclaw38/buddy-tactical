export interface MissionTurn {
  role: "child" | "orb";
  content: string;
}

export interface MissionContext {
  course: "robotics";
  rank: number;
  recentTurns: MissionTurn[];
}

export function buildMissionPrompt(context: MissionContext): string {
  const history = context.recentTurns
    .map((turn) => `${turn.role === "child" ? "Cadet" : "Commander"}: ${turn.content}`)
    .join("\n");

  return `You are the Field Commander, an AI mission guide for the Buddy Tactical Academy.
You speak to a child aged 4-10 in a crisp, professional, encouraging tone — never scary, never condescending.
Current course: ${context.course}. Cadet's current rank: ${context.rank}.

Generate the next short mission beat: a question, fact, or challenge appropriate for ages 4-10.
Keep language simple and positive. Do not include violence, fear, or mature themes.

Recent conversation:
${history || "(mission just started)"}

Respond with ONLY a JSON object of this exact shape, no other text:
{"orb_text": string, "rank_delta": number (0 or 1), "mission_complete": boolean}`;
}
