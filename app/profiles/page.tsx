import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfilePicker } from "@/components/ProfilePicker";
import { ChildProfileForm } from "@/components/ChildProfileForm";

export default async function ProfilesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: children } = await supabase
    .from("children")
    .select("id, name, avatar")
    .eq("parent_id", user.id);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl">Select Your Cadet</h1>
      <ProfilePicker children={children ?? []} />
      <h2 className="text-lg">Add a New Cadet</h2>
      <ChildProfileForm />
    </main>
  );
}
