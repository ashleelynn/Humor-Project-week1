import { cookies } from "next/headers";
import Link from "next/link";
import { moodFor, pseudonymFor, timeAgo, type Confession } from "@/lib/confessions";
import { createClient } from "@/utils/supabase/server";
import { ComposeForm } from "./compose-form";
import { ArrowIcon } from "./icons";
import { NewConfessions } from "./new-confessions";
import { SameButton } from "./same-button";
import { AccountActions, BoothTabs, SiteNav } from "./site-nav";

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
      <SiteNav>
        <AccountActions signedIn={!!user} />
      </SiteNav>
      <BoothTabs current="confessions" />

      <header className="hero">
        <p className="eyebrow">
          <span className="rest">Open 24/7</span>
          <span className="alt">I’m not looking.</span>
        </p>
        <h1 className="title">
          The confession <span className="accent">booth.</span>
        </h1>
        <p className="tagline">No names. No judgment. (Ok, a little judgment.)</p>
        {user ? (
          <p className="whoami">You’re in, anonymous soul.</p>
        ) : (
          <div className="hero-cta">
            <Link href="/login" className="btn large aubergine">
              Log in to confess <ArrowIcon />
            </Link>
          </div>
        )}
      </header>

      {user && <ComposeForm />}

      {error ? (
        <div className="empty">
          <h2 className="empty-title">The booth is closed for renovations.</h2>
          <p>Supabase says: {error.message}</p>
        </div>
      ) : confessions.length === 0 ? (
        <div className="empty">
          <h2 className="empty-title">It’s suspiciously quiet in here.</h2>
          <p>Be the first to confess.</p>
        </div>
      ) : (
        <>
          <div className="wall-head">
            <h2 className="count">
              {confessions.length} {confessions.length === 1 ? "secret" : "secrets"} and counting.
            </h2>
            <NewConfessions latestId={confessions[0].id} />
          </div>
          <section className="wall" aria-label="Confessions">
            {confessions.map((c, index) => {
              const mood = moodFor(c.mood);
              return (
                <article key={c.id} className="entry" style={{ "--i": Math.min(index, 8) } as React.CSSProperties}>
                  <header className="entry-meta">
                    <span className="mood">
                      <span className="face" aria-hidden="true">
                        {mood.face}
                      </span>
                      {mood.label}
                    </span>
                    <span className="entry-when">
                      <span>#{String(c.id).padStart(4, "0")}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={c.created_at}>{timeAgo(c.created_at)}</time>
                    </span>
                  </header>
                  <p className="entry-body">{c.body}</p>
                  <footer className="entry-foot">
                    <span className="alias">— {pseudonymFor(c.id)}</span>
                    <SameButton id={c.id} count={c.same_count} active={mySames.has(c.id)} signedIn={!!user} />
                  </footer>
                </article>
              );
            })}
          </section>
          <p className="wall-end">That’s every secret. For now.</p>
        </>
      )}
    </main>
  );
}
