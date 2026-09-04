import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RankState } from "./rank";

export async function getChildIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("child_id")?.value ?? null;
}

export async function getMissionProgress(childId: string, course: string): Promise<RankState> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("mission_progress")
    .select("rank, turns_completed")
    .eq("child_id", childId)
    .eq("course", course)
    .maybeSingle();

  if (!data) {
    return { rank: 1, turnsCompleted: 0 };
  }
  return { rank: data.rank, turnsCompleted: data.turns_completed };
}

export async function saveMissionProgress(childId: string, course: string, state: RankState): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase
    .from("mission_progress")
    .upsert(
      { child_id: childId, course, rank: state.rank, turns_completed: state.turnsCompleted, updated_at: new Date().toISOString() },
      { onConflict: "child_id,course" }
    );
}
