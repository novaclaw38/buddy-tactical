"use client";

import { createChildProfile } from "@/app/profiles/actions";
import { SubmitButton } from "@/components/SubmitButton";

const AVATARS = ["🤖", "🚀", "🦾", "🛰️"];

export function ChildProfileForm() {
  return (
    <form action={createChildProfile} className="flex flex-col gap-3 w-full max-w-sm">
      <label htmlFor="cadet-name" className="sr-only">Cadet&apos;s name</label>
      <input
        id="cadet-name"
        name="name"
        placeholder="Cadet's name"
        required
        className="hud-frame border-[color:var(--tactical-teal)] bg-[color:var(--command-black-raised)] p-3 text-[color:var(--tactical-teal)] placeholder:text-[color:var(--tactical-teal)]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)]"
      />
      <label htmlFor="cadet-avatar" className="sr-only">Cadet&apos;s avatar</label>
      <select
        id="cadet-avatar"
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
      <label htmlFor="cadet-pin" className="sr-only">Set a 4-6 digit PIN</label>
      <input
        id="cadet-pin"
        name="pin"
        type="password"
        inputMode="numeric"
        minLength={4}
        maxLength={6}
        placeholder="Set a 4-6 digit PIN"
        required
        className="hud-frame border-[color:var(--tactical-teal)] bg-[color:var(--command-black-raised)] p-3 text-[color:var(--tactical-teal)] placeholder:text-[color:var(--tactical-teal)]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)]"
      />
      <SubmitButton
        pendingLabel="Creating Profile…"
        className="hud-frame border-[color:var(--alert-orange)] p-3 text-[color:var(--alert-orange)] hover:bg-[color:var(--command-black-raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--tactical-teal)] transition-colors"
      >
        Create Profile
      </SubmitButton>
    </form>
  );
}
