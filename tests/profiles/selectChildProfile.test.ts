import { describe, it, expect, vi, beforeEach } from "vitest";

const maybeSingle = vi.fn();
const from = vi.fn(() => ({
  select: () => ({ eq: () => ({ single: maybeSingle }) }),
}));
const cookieSet = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({ from }),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookieSet }),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("REDIRECT");
  }),
}));

import { selectChildProfile } from "@/app/profiles/actions";
import bcrypt from "bcryptjs";

beforeEach(() => {
  maybeSingle.mockReset();
  cookieSet.mockReset();
});

describe("selectChildProfile", () => {
  it("returns an error and sets no cookie when the PIN is wrong", async () => {
    maybeSingle.mockResolvedValue({ data: { pin_hash: await bcrypt.hash("1234", 10) } });

    const form = new FormData();
    form.set("childId", "child-1");
    form.set("pin", "9999");

    const result = await selectChildProfile(form);

    expect(result?.error).toBe("Incorrect PIN. Try again, Cadet.");
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it("sets the child_id cookie and redirects when the PIN is correct", async () => {
    maybeSingle.mockResolvedValue({ data: { pin_hash: await bcrypt.hash("1234", 10) } });

    const form = new FormData();
    form.set("childId", "child-1");
    form.set("pin", "1234");

    await expect(selectChildProfile(form)).rejects.toThrow("REDIRECT");
    expect(cookieSet).toHaveBeenCalledWith("child_id", "child-1", expect.objectContaining({ httpOnly: true }));
  });
});
