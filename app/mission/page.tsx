import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMissionProgress } from "@/lib/mission/progress";
import { MissionClient } from "./MissionClient";

const COURSE = "robotics";

export default async function MissionPage() {
  const cookieStore = await cookies();
  const childId = cookieStore.get("child_id")?.value;
  if (!childId) {
    redirect("/profiles");
  }

  const supabase = await createServerSupabaseClient();
  const { data: child } = await supabase.from("children").select("id, name").eq("id", childId).single();
  if (!child) {
    redirect("/profiles");
  }

  const progress = await getMissionProgress(childId, COURSE);

  return <MissionClient childName={child.name} course={COURSE} initialRank={progress.rank} />;
}
