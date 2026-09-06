"use client";

import { useState } from "react";
import { selectChildProfile } from "@/app/profiles/actions";
import { SubmitButton } from "@/components/SubmitButton";

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
      <div className="flex gap-4 flex-wrap justify-center">
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => setSelected(child)}
            className="hud-frame border-[color:var(--tactical-teal)] flex flex-col items-center gap-2 p-4 transition-[background-color,box-shadow] duration-150 ease-out hover:bg-[color:var(--tactical-teal-dim)] hover:shadow-[0_6px_24px_-4px_var(--tactical-teal)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)]"
          >
            <span className="text-4xl">{child.avatar}</span>
            <span className="tracking-[-0.02em]">{child.name}</span>
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
      <label htmlFor="profile-pin" className="tracking-[-0.02em]">Enter PIN for {selected.name}</label>
      <input
        id="profile-pin"
        name="pin"
        type="password"
        inputMode="numeric"
        placeholder="Enter PIN"
        className="hud-frame border-[color:var(--tactical-teal)] bg-[color:var(--command-black-raised)] p-2 text-center text-[color:var(--tactical-teal)] placeholder:text-[color:var(--tactical-teal)]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)]"
      />
      {error && (
        <p role="alert" className="text-[color:var(--alert-orange)]">
          {error}
        </p>
      )}
      <SubmitButton
        pendingLabel="Verifying…"
        className="hud-frame border-[color:var(--tactical-teal)] px-4 py-2 transition-[background-color,box-shadow] duration-150 ease-out hover:bg-[color:var(--tactical-teal-dim)] hover:shadow-[0_6px_24px_-4px_var(--tactical-teal)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)]"
      >
        Confirm
      </SubmitButton>
      <button
        type="button"
        onClick={() => setSelected(null)}
        className="min-h-11 min-w-11 px-2 text-sm underline decoration-[color:var(--tactical-teal)]/60 hover:text-[color:var(--alert-orange)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)]"
      >
        Back
      </button>
    </form>
  );
}
