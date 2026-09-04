"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export async function createChildProfile(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const name = String(formData.get("name"));
  const avatar = String(formData.get("avatar"));
  const pin = String(formData.get("pin"));

  await supabase.from("children").insert({
    parent_id: user.id,
    name,
    avatar,
    pin_hash: await hashPin(pin),
    rank: 1,
  });

  redirect("/profiles");
}

export async function selectChildProfile(formData: FormData): Promise<{ error?: string } | void> {
  const supabase = await createServerSupabaseClient();
  const childId = String(formData.get("childId"));
  const pin = String(formData.get("pin"));

  const { data: child } = await supabase.from("children").select("pin_hash").eq("id", childId).single();

  if (!child || !(await verifyPin(pin, child.pin_hash))) {
    return { error: "Incorrect PIN. Try again, Cadet." };
  }

  const cookieStore = await cookies();
  cookieStore.set("child_id", childId, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/mission");
}
