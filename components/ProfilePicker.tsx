"use client";

import { useState } from "react";
import { selectChildProfile } from "@/app/profiles/actions";

interface ChildSummary {
  id: string;
  name: string;
  avatar: string;
}

export function ProfilePicker({ children }: { children: ChildSummary[] }) {
  const [selected, setSelected] = useState<ChildSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!selected) {
    return (
      <div className="flex gap-4 flex-wrap">
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => setSelected(child)}
            className="flex flex-col items-center gap-2 p-4 border border-[color:var(--tactical-teal)]"
          >
            <span className="text-4xl">{child.avatar}</span>
            <span>{child.name}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <form
      action={async (formData: FormData) => {
        formData.set("childId", selected.id);
        const result = await selectChildProfile(formData);
        if (result?.error) {
          setError(result.error);
        }
      }}
      className="flex flex-col gap-3 items-center"
    >
      <p>Enter PIN for {selected.name}</p>
      <input name="pin" type="password" inputMode="numeric" placeholder="Enter PIN" className="p-2 bg-black border border-[color:var(--tactical-teal)]" />
      {error && <p className="text-[color:var(--alert-orange)]">{error}</p>}
      <button type="submit" className="p-2 border border-[color:var(--tactical-teal)]">Confirm</button>
      <button type="button" onClick={() => setSelected(null)} className="text-sm underline">Back</button>
    </form>
  );
}
