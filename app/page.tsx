import { cookies } from "next/headers";
import Link from "next/link";
import { bayard } from "@/lib/bayard";
import { moodFor, pseudonymFor, timeAgo, type Confession } from "@/lib/confessions";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "./actions";
import { ComposeForm } from "./compose-form";
import { SameButton } from "./same-button";
import { SleepyFlower, Sunflower, WiltedFlower } from "./sunflower";

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
        <p className="badge">
          <span className="rest">open 24/7</span>
          <span className="alt">i&apos;m not looking.</span>
        </p>
        <h1 className="title">
          <span>the</span> <span>confession</span>{" "}
          <span>
            <span className="accent">booth</span>
          </span>
        </h1>
        <Sunflower variant="hero" />
        <p className="tagline">no names. no judgment. (ok, a little judgment.)</p>

        <div className="userbar">
          {user ? (
            <>
              <span className="whoami">&gt; you&apos;re in, anonymous soul</span>
              <form action={signOut}>
                <button type="submit" className="btn ghost small">
                  slip out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn">
              log in to confess{" "}
              <span className="arrow" aria-hidden="true">
                -&gt;
              </span>
            </Link>
          )}
        </div>
      </header>

      <hr className="px-rule" />

      {user && <ComposeForm />}

      {error ? (
        <div className="empty">
          <WiltedFlower />
          <h2 className="empty-title">the booth is closed for renovations</h2>
          <p>Supabase says: {error.message}</p>
        </div>
      ) : confessions.length === 0 ? (
        <div className="empty">
          <SleepyFlower />
          <h2 className="empty-title">{bayard("it’s suspiciously quiet in here...")}</h2>
          <p>Be the first to confess.</p>
        </div>
      ) : (
        <>
          <h2 className="count">
            {bayard(`${confessions.length} ${confessions.length === 1 ? "secret" : "secrets"} and counting`)}
          </h2>
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
                      <time dateTime={c.created_at}>{timeAgo(c.created_at)}</time>
                    </span>
                  </header>
                  <p className="entry-body">
                    {c.body}
                    {index === 0 && (
                      <span className="cursor" aria-hidden="true">
                        _
                      </span>
                    )}
                  </p>
                  <footer className="entry-foot">
                    <span className="alias">— {pseudonymFor(c.id)}</span>
                    <SameButton id={c.id} count={c.same_count} active={mySames.has(c.id)} signedIn={!!user} />
                  </footer>
                </article>
              );
            })}
          </section>
          <p className="wall-end">-- that&apos;s every secret. for now. --</p>
        </>
      )}
    </main>
  );
}
