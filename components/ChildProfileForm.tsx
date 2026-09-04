"use client";

import { createChildProfile } from "@/app/profiles/actions";

const AVATARS = ["🤖", "🚀", "🦾", "🛰️"];

export function ChildProfileForm() {
  return (
    <form action={createChildProfile} className="flex flex-col gap-3 w-full max-w-sm">
      <input
        name="name"
        placeholder="Cadet's name"
        required
        className="hud-frame border-[color:var(--tactical-teal)] bg-[color:var(--command-black-raised)] p-3 text-[color:var(--tactical-teal)] placeholder:text-[color:var(--tactical-teal)]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)]"
      />
      <select
        name="avatar"
        required
        className="hud-frame border-[color:var(--tactical-teal)] bg-[color:var(--command-black-raised)] p-3 text-[color:var(--tactical-teal)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)]"
      >
        {AVATARS.map((avatar) => (
          <option key={avatar} value={avatar}>
            {avatar}
          </option>
        ))}
      </select>
      <input
        name="pin"
        type="password"
        inputMode="numeric"
        minLength={4}
        maxLength={6}
        placeholder="Set a 4-6 digit PIN"
        required
        className="hud-frame border-[color:var(--tactical-teal)] bg-[color:var(--command-black-raised)] p-3 text-[color:var(--tactical-teal)] placeholder:text-[color:var(--tactical-teal)]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)]"
      />
      <button
        type="submit"
        className="hud-frame border-[color:var(--alert-orange)] p-3 text-[color:var(--alert-orange)] hover:bg-[color:var(--command-black-raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--tactical-teal)] transition-colors"
      >
        Create Profile
      </button>
    </form>
  );
}
