import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_TEST_URL;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;

const describeIfConfigured = url && anonKey ? describe : describe.skip;

describeIfConfigured("RLS: cross-parent isolation", () => {
  // No generated Database type exists in this project (app code queries
  // untyped tables too), so table calls fall back to `never` for writes
  // without an explicit cast here.
  let parentAClient: SupabaseClient<any, any, any>;
  let parentBClient: SupabaseClient<any, any, any>;
  let parentAChildId: string;

  beforeAll(async () => {
    parentAClient = createClient(url!, anonKey!);
    parentBClient = createClient(url!, anonKey!);

    const emailA = `rls-test-a-${Date.now()}@example.com`;
    const emailB = `rls-test-b-${Date.now()}@example.com`;

    await parentAClient.auth.signUp({ email: emailA, password: "test-password-123" });
    await parentAClient.auth.signInWithPassword({ email: emailA, password: "test-password-123" });
    await parentBClient.auth.signUp({ email: emailB, password: "test-password-123" });
    await parentBClient.auth.signInWithPassword({ email: emailB, password: "test-password-123" });

    const { data: childRow } = await parentAClient
      .from("children")
      .insert({ name: "Test Cadet A", avatar: "🤖", pin_hash: "irrelevant-for-this-test", rank: 1 })
      .select("id")
      .single();
    parentAChildId = childRow!.id;
  });

  afterAll(async () => {
    await parentAClient.from("children").delete().eq("id", parentAChildId);
    await parentAClient.auth.signOut();
    await parentBClient.auth.signOut();
  });

  it("blocks Parent B from reading Parent A's child profile", async () => {
    const { data, error } = await parentBClient.from("children").select("*").eq("id", parentAChildId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("blocks Parent B from updating Parent A's child profile", async () => {
    const { data } = await parentBClient
      .from("children")
      .update({ rank: 99 })
      .eq("id", parentAChildId)
      .select();
    expect(data).toEqual([]);

    const { data: unchanged } = await parentAClient.from("children").select("rank").eq("id", parentAChildId).single();
    expect(unchanged?.rank).toBe(1);
  });

  it("blocks Parent B from inserting mission_progress for Parent A's child", async () => {
    const { error } = await parentBClient
      .from("mission_progress")
      .insert({ child_id: parentAChildId, course: "robotics", rank: 1, turns_completed: 0 });
    expect(error).not.toBeNull();
  });
});
