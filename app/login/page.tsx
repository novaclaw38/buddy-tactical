import { signUp, signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl">Tactical Academy — Parent Access</h1>
      {error && <p className="text-[color:var(--alert-orange)]">{error}</p>}
      <form className="flex flex-col gap-3 w-full max-w-sm">
        <input name="email" type="email" placeholder="Email" required className="p-2 bg-black border border-[color:var(--tactical-teal)]" />
        <input name="password" type="password" placeholder="Password" required minLength={8} className="p-2 bg-black border border-[color:var(--tactical-teal)]" />
        <button formAction={signIn} className="p-2 border border-[color:var(--tactical-teal)]">Log In</button>
        <button formAction={signUp} className="p-2 border border-[color:var(--alert-orange)]">Sign Up</button>
      </form>
    </main>
  );
}
