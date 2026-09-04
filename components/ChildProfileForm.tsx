"use client";

import { createChildProfile } from "@/app/profiles/actions";

const AVATARS = ["🤖", "🚀", "🦾", "🛰️"];

export function ChildProfileForm() {
  return (
    <form action={createChildProfile} className="flex flex-col gap-3 max-w-sm">
      <input name="name" placeholder="Cadet's name" required className="p-2 bg-black border border-[color:var(--tactical-teal)]" />
      <select name="avatar" required className="p-2 bg-black border border-[color:var(--tactical-teal)]">
        {AVATARS.map((avatar) => (
          <option key={avatar} value={avatar}>{avatar}</option>
        ))}
      </select>
      <input name="pin" type="password" inputMode="numeric" minLength={4} maxLength={6} placeholder="Set a 4-6 digit PIN" required className="p-2 bg-black border border-[color:var(--tactical-teal)]" />
      <button type="submit" className="p-2 border border-[color:var(--alert-orange)]">Create Profile</button>
    </form>
  );
}
