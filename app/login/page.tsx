import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="page login-page">
      <Link href="/" className="back">
        ← back to the wall
      </Link>
      <div className="login-card">
        <span className="neon">members only</span>
        <h1 className="title small">
          step into the <span className="accent">booth</span>
        </h1>
        <p className="tagline">
          Your email stays with us. Your confessions go on the wall with a random alias, never your name.
        </p>
        <LoginForm initialError={error === "confirm" ? "That confirmation link didn't work. Try signing in." : undefined} />
      </div>
    </main>
  );
}
