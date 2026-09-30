import { cookies } from "next/headers";
import Link from "next/link";
import {
  moodFor,
  pseudonymFor,
  tapeTiltFor,
  tiltFor,
  timeAgo,
  type Confession,
} from "@/lib/confessions";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "./actions";
import { ComposeForm } from "./compose-form";
import { SameButton } from "./same-button";

export default async function Page() {
  const supabase = createClient(await cookies());

  const [
    {
      data: { user },
    },
    { data, error },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("confessions")
      .select("id, created_at, body, mood, same_count")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const confessions = (data ?? []) as Confession[];

  let mySames = new Set<number>();
  if (user) {
    const { data: sames } = await supabase.from("confession_sames").select("confession_id");
    mySames = new Set((sames ?? []).map((s) => s.confession_id as number));
  }

  return (
    <main className="page">
      <header className="booth-header">
        <span className="neon">open 24/7</span>
        <h1 className="title">
          the confession <span className="accent">booth</span>
        </h1>
        <p className="tagline">no names. no judgment. (ok, a little judgment.)</p>

        <div className="userbar">
          {user ? (
            <>
              <span>you&apos;re in, anonymous soul 🕯️</span>
              <form action={signOut}>
                <button type="submit" className="ghost small">
                  slip out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="whisper small">
              log in to confess →
            </Link>
          )}
        </div>
      </header>

      {user && <ComposeForm />}

      {error ? (
        <div className="empty">
          <p className="empty-title">the booth is closed for renovations 🚧</p>
          <p>Supabase says: {error.message}</p>
        </div>
      ) : confessions.length === 0 ? (
        <div className="empty">
          <p className="empty-title">it&apos;s suspiciously quiet in here…</p>
          <p>Be the first to confess.</p>
        </div>
      ) : (
        <>
          <p className="count">
            {confessions.length} {confessions.length === 1 ? "secret" : "secrets"} and counting
          </p>
          <section className="wall" aria-label="Confessions">
            {confessions.map((c) => {
              const mood = moodFor(c.mood);
              return (
                <article
                  key={c.id}
                  className="note"
                  style={
                    {
                      "--note": mood.color,
                      "--tilt": `${tiltFor(c.id)}deg`,
                      "--tape-tilt": `${tapeTiltFor(c.id)}deg`,
                    } as React.CSSProperties
                  }
                >
                  <span className="mood-chip">
                    {mood.emoji} {mood.label}
                  </span>
                  <p className="note-body">{c.body}</p>
                  <footer className="note-foot">
                    <span className="byline">
                      — {pseudonymFor(c.id)}
                      <br />
                      <time dateTime={c.created_at}>{timeAgo(c.created_at)}</time>
                    </span>
                    <SameButton id={c.id} count={c.same_count} active={mySames.has(c.id)} signedIn={!!user} />
                  </footer>
                </article>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}
