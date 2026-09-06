import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CommandOrb } from "@/components/CommandOrb";

const DIRECTION_CONTRACT = `<!--
THESIS: Buddy's landing page is its own pre-flight instrument panel, not a hero-plus-feature-cards pitch — the Command Orb as master gauge, real product facts as armed status readouts, refusing the category default.
OWN-WORLD: Full Tactical, inherited unchanged — Command Black ground, Tactical Teal / Alert Orange signal split, JetBrains Mono throughout, HUD-frame bracket corners, the Command Orb's signature glow.
STORY: A parent lands mid-preflight, reads four true status readouts (safety, voice-first, mechanism, guilt-free), and enlists their Cadet — belief earned by fact, not claim.
FIRST VIEWPORT: "Buddy Tactical Academy — Cleared for Launch" headline, reticle-ringed Orb centered, four HUD-frame panels flanking (2x2 on mobile), orange "ENLIST YOUR CADET" button below, boot-sequence stagger on load. No kicker above the headline — the floor bans it.
FORM: Instrument Panel Diagnostics — dealt lead, index 5 of 7; seed a14d2a99.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
-->`;

const READOUTS = [
  {
    label: "SAFETY",
    detail:
      "Every parent account is isolated by Supabase Row-Level Security — your Cadet's data never crosses into another family's.",
  },
  {
    label: "VOICE-FIRST",
    detail:
      "Hold to talk. Groq Whisper transcribes, an LLM answers in character, Groq text-to-speech speaks it back.",
  },
  {
    label: "MECHANISM",
    detail:
      "Mission beats are generated live, reacting to what your Cadet actually says — no two sessions play out the same.",
  },
  {
    label: "GUILT-FREE",
    detail:
      "Rank and course progress are tracked per Cadet, per course — structured growth you can see, not just screen time.",
  },
];

const COURSES = [
  { name: "Robotics", status: "ACTIVE" },
  { name: "Beast Intelligence", status: "IN DEVELOPMENT" },
  { name: "Field Rations", status: "IN DEVELOPMENT" },
  { name: "Botany Ops", status: "IN DEVELOPMENT" },
];

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/profiles");
  }

  return (
    <>
      <div style={{ display: "none" }} dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
      <main className="flex min-h-screen flex-col items-center gap-24 px-8 py-16">
        {/* First viewport: the instrument panel */}
        <section className="flex w-full max-w-5xl flex-col items-center gap-8 text-center">
          <h1
            className="animate-boot-in text-4xl font-bold tracking-[-0.02em] sm:text-5xl"
            style={{ animationDelay: "0ms" }}
          >
            Buddy Tactical Academy — Cleared for Launch
          </h1>

          <div className="grid w-full grid-cols-2 items-center gap-6 sm:grid-cols-[1fr_1fr_auto_1fr_1fr] sm:gap-4">
            {READOUTS.slice(0, 2).map((readout, index) => (
              <ReadoutPanel key={readout.label} {...readout} delayMs={160 + index * 80} />
            ))}

            <div className="relative order-first col-span-2 flex items-center justify-center py-4 sm:order-none sm:col-span-1">
              <span
                className="orb-reticle animate-boot-in top-0 left-1/2 h-6 w-px -translate-x-1/2"
                style={{ animationDelay: "160ms" }}
              />
              <span
                className="orb-reticle animate-boot-in bottom-0 left-1/2 h-6 w-px -translate-x-1/2"
                style={{ animationDelay: "160ms" }}
              />
              <span
                className="orb-reticle animate-boot-in top-1/2 left-0 h-px w-6 -translate-y-1/2"
                style={{ animationDelay: "160ms" }}
              />
              <span
                className="orb-reticle animate-boot-in top-1/2 right-0 h-px w-6 -translate-y-1/2"
                style={{ animationDelay: "160ms" }}
              />
              <CommandOrb amplitude={0} />
            </div>

            {READOUTS.slice(2).map((readout, index) => (
              <ReadoutPanel key={readout.label} {...readout} delayMs={160 + (index + 2) * 80} />
            ))}
          </div>

          <Link
            href="/login"
            className="animate-boot-in hud-frame border-[color:var(--alert-orange)] px-8 py-4 text-[color:var(--alert-orange)] transition-colors hover:bg-[color:var(--command-black-raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--tactical-teal)]"
            style={{ animationDelay: "560ms" }}
          >
            Enlist Your Cadet
          </Link>
        </section>

        {/* Systems detail: the same four readouts, said plainly */}
        <section className="flex w-full max-w-3xl flex-col gap-8">
          <h2 className="text-xl tracking-[-0.02em] text-[color:var(--tactical-teal)]/80">
            Systems Check
          </h2>
          <dl className="flex flex-col gap-6">
            {READOUTS.map((readout) => (
              <div key={readout.label} className="flex flex-col gap-1">
                <dt className="text-sm tracking-[-0.02em] text-[color:var(--alert-orange)]">
                  {readout.label}
                </dt>
                <dd className="leading-relaxed">{readout.detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Honest roadmap: one course is live, the rest are labeled as such */}
        <section className="flex w-full max-w-3xl flex-col gap-8">
          <h2 className="text-xl tracking-[-0.02em] text-[color:var(--tactical-teal)]/80">
            Course Roadmap
          </h2>
          <ul className="flex flex-col gap-3">
            {COURSES.map((course) => (
              <li
                key={course.name}
                className="hud-frame flex items-center justify-between border-[color:var(--tactical-teal)] px-4 py-3"
              >
                <span className="tracking-[-0.02em]">{course.name}</span>
                <span
                  className={
                    course.status === "ACTIVE"
                      ? "text-sm text-[color:var(--tactical-teal)]"
                      : "text-sm text-[color:var(--tactical-teal)]/50"
                  }
                >
                  {course.status}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Close */}
        <section className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <p className="tracking-[-0.02em]">
            One live course. One real mission loop. Nothing here is a demo.
          </p>
          <Link
            href="/login"
            className="hud-frame border-[color:var(--alert-orange)] px-8 py-4 text-[color:var(--alert-orange)] transition-colors hover:bg-[color:var(--command-black-raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--tactical-teal)]"
          >
            Enlist Your Cadet
          </Link>
        </section>
      </main>
    </>
  );
}

function ReadoutPanel({
  label,
  delayMs,
}: {
  label: string;
  delayMs: number;
}) {
  return (
    <div
      className="animate-boot-in hud-frame flex flex-col items-center gap-2 border-[color:var(--tactical-teal)] px-3 py-4 text-center"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span className="text-xs tracking-[-0.02em] text-[color:var(--tactical-teal)] sm:text-sm">
        {label}
      </span>
      <span
        className="h-2 w-2 bg-[color:var(--tactical-teal)] shadow-[0_2px_8px_-2px_var(--tactical-teal)]"
        aria-hidden="true"
      />
    </div>
  );
}
