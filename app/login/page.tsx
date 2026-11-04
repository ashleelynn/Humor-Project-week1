import Link from "next/link";
import { SiteNav } from "../site-nav";
import { signInWithGoogle } from "./actions";
import { LoginForm } from "./login-form";

const ERRORS: Record<string, string> = {
  confirm: "That sign-in link didn't work. Try again.",
  google: "Google sign-in isn't available right now. Try email instead.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="page page--narrow">
      <SiteNav>
        <Link href="/" className="btn ghost small">
          Back to the wall
        </Link>
      </SiteNav>
      <header className="hero hero--sm">
        <p className="eyebrow">
          <span className="rest">Members only</span>
          <span className="alt">I’m not looking.</span>
        </p>
        <h1 className="title title--sm">
          Step into the <span className="accent">booth.</span>
        </h1>
        <p className="tagline">
          Your email stays with us. Your confessions go on the wall with a random alias, never your name.
        </p>
      </header>
      <div className="card">
        <form action={signInWithGoogle}>
          <button type="submit" className="btn ghost block">
            Continue with Google
          </button>
        </form>
        <p className="or" aria-hidden="true">
          or use your email
        </p>
        <LoginForm initialError={error ? ERRORS[error] : undefined} />
      </div>
    </main>
  );
}
