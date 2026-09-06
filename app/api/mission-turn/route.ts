import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/groq/stt";
import { generateMissionBeat } from "@/lib/groq/llm";
import { synthesizeSpeech } from "@/lib/groq/tts";
import { applyRankDelta } from "@/lib/mission/rank";
import { getChildIdFromCookies, getMissionProgress, saveMissionProgress } from "@/lib/mission/progress";
import type { MissionTurn } from "@/lib/mission/prompt";

const FALLBACK_TEXT = "Comms are glitchy, Cadet — say that again?";

async function withOneRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return await fn();
  }
}

export async function POST(request: Request) {
  const childId = await getChildIdFromCookies();
  if (!childId) {
    return NextResponse.json({ error: "No active Cadet profile" }, { status: 401 });
  }

  const form = await request.formData();
  const audioFile = form.get("audio") as File;
  const course = String(form.get("course"));
  const tapAnswer = form.get("tapAnswer") as string | null;
  const recentTurns = JSON.parse(String(form.get("recentTurns"))) as MissionTurn[];

  const currentProgress = await getMissionProgress(childId, course);

  let orbText: string;
  let transcript = tapAnswer ?? "";
  let rankDelta = 0;
  let missionComplete = false;
  let audioBase64: string | null = null;
  let succeeded = false;

  try {
    if (!tapAnswer) {
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      transcript = await withOneRetry(() => transcribeAudio(audioBuffer));
    }
    const beat = await withOneRetry(() =>
      generateMissionBeat({
        course: course as "robotics",
        rank: currentProgress.rank,
        recentTurns: [...recentTurns, { role: "child", content: transcript }],
      })
    );
    orbText = beat.orb_text;
    rankDelta = beat.rank_delta;
    missionComplete = beat.mission_complete;

    const speech = await withOneRetry(() => synthesizeSpeech(orbText));
    audioBase64 = speech.toString("base64");
    succeeded = true;
  } catch {
    orbText = FALLBACK_TEXT;
    rankDelta = 0;
    missionComplete = false;
    audioBase64 = null;
  }

  const progress = succeeded
    ? applyRankDelta(currentProgress, rankDelta)
    : { ...currentProgress, rankedUp: false };

  if (succeeded) {
    await saveMissionProgress(childId, course, { rank: progress.rank, turnsCompleted: progress.turnsCompleted });
  }

  return NextResponse.json({
    transcript: succeeded ? transcript : null,
    orb_text: orbText,
    audio_base64: audioBase64,
    rank: progress.rank,
    ranked_up: progress.rankedUp,
    mission_complete: missionComplete,
  });
}
