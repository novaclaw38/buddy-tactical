import { signUp, signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl tracking-[-0.02em]">Tactical Academy — Parent Access</h1>
      {error && (
        <p role="alert" className="hud-frame border-[color:var(--alert-orange)] px-3 py-2 text-[color:var(--alert-orange)]">
          {error}
        </p>
      )}
      <form className="flex flex-col gap-3 w-full max-w-sm">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="hud-frame border-[color:var(--tactical-teal)] bg-[color:var(--command-black-raised)] p-3 text-[color:var(--tactical-teal)] placeholder:text-[color:var(--tactical-teal)]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)]"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          minLength={8}
          className="hud-frame border-[color:var(--tactical-teal)] bg-[color:var(--command-black-raised)] p-3 text-[color:var(--tactical-teal)] placeholder:text-[color:var(--tactical-teal)]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)]"
        />
        <button
          formAction={signIn}
          className="hud-frame border-[color:var(--tactical-teal)] p-3 text-[color:var(--tactical-teal)] hover:bg-[color:var(--tactical-teal-dim)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)] transition-colors"
        >
          Log In
        </button>
        <button
          formAction={signUp}
          className="hud-frame border-[color:var(--alert-orange)] p-3 text-[color:var(--alert-orange)] hover:bg-[color:var(--command-black-raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--tactical-teal)] transition-colors"
        >
          Sign Up
        </button>
      </form>
    </main>
  );
}
