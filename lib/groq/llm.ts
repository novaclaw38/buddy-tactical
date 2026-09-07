import { z } from "zod";
import { getGroqClient } from "./client";
import { buildMissionPrompt, MissionContext } from "../mission/prompt";

const missionBeatSchema = z.object({
  orb_text: z.string().min(1),
  rank_delta: z.number().int().min(0).max(1),
  mission_complete: z.boolean(),
});

export type MissionBeat = z.infer<typeof missionBeatSchema>;

export async function generateMissionBeat(context: MissionContext): Promise<MissionBeat> {
  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [{ role: "user", content: buildMissionPrompt(context) }],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq LLM returned no content");
  }

  const parsed: unknown = JSON.parse(content);
  return missionBeatSchema.parse(parsed);
}
