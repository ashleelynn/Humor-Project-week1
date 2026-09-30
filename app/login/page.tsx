import Link from "next/link";
import { Sunflower } from "../sunflower";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="page login-page">
      <Link href="/" className="back">
        <span className="arrow" aria-hidden="true">
          &lt;-
        </span>{" "}
        back to the wall
      </Link>
      <div className="peek" aria-hidden="true">
        <div className="peek-duck">
          <div className="peek-rise">
            <Sunflower variant="peek" />
          </div>
        </div>
        <div className="fence" />
      </div>
      <header className="booth-header login-head">
        <p className="badge">
          <span className="rest">members only</span>
          <span className="alt">i&apos;m not looking.</span>
        </p>
        <h1 className="title title--sm">
          <span>step into the</span>{" "}
          <span>
            <span className="accent">booth</span>
          </span>
        </h1>
        <p className="tagline">
          Your email stays with us. Your confessions go on the wall with a random alias, never your name.
        </p>
      </header>
      <LoginForm initialError={error === "confirm" ? "That confirmation link didn't work. Try signing in." : undefined} />
    </main>
  );
}
