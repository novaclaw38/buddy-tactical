import { signUp, signIn } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

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
        <label htmlFor="email" className="sr-only">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          required
          className="hud-frame border-[color:var(--tactical-teal)] bg-[color:var(--command-black-raised)] p-3 text-[color:var(--tactical-teal)] placeholder:text-[color:var(--tactical-teal)]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)]"
        />
        <label htmlFor="password" className="sr-only">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          required
          minLength={8}
          className="hud-frame border-[color:var(--tactical-teal)] bg-[color:var(--command-black-raised)] p-3 text-[color:var(--tactical-teal)] placeholder:text-[color:var(--tactical-teal)]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)]"
        />
        <SubmitButton
          formAction={signIn}
          pendingLabel="Logging In…"
          className="hud-frame border-[color:var(--tactical-teal)] p-3 text-[color:var(--tactical-teal)] transition-[background-color,box-shadow] duration-150 ease-out hover:bg-[color:var(--tactical-teal-dim)] hover:shadow-[0_6px_24px_-4px_var(--tactical-teal)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)]"
        >
          Log In
        </SubmitButton>
        <SubmitButton
          formAction={signUp}
          pendingLabel="Signing Up…"
          className="hud-frame border-[color:var(--alert-orange)] p-3 text-[color:var(--alert-orange)] transition-[background-color,box-shadow] duration-150 ease-out hover:bg-[color:var(--command-black-raised)] hover:shadow-[0_6px_24px_-4px_var(--alert-orange)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--tactical-teal)]"
        >
          Sign Up
        </SubmitButton>
      </form>
    </main>
  );
}
