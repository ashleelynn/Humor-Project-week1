import { cookies } from "next/headers";
import Link from "next/link";
import { moodFor, timeAgo, type MoodId } from "@/lib/confessions";
import { DAILY_DROPS, PHOTO_BUCKET, themeFor, type Drop } from "@/lib/photo-booth";
import { createClient } from "@/utils/supabase/server";
import { ArrowIcon } from "../icons";
import { AccountActions, BoothTabs, SiteNav } from "../site-nav";
import { DropForm } from "./drop-form";
import { VoteButtons } from "./vote-buttons";

// Claude usually answers in well under a minute; this leaves room for a slow one.
export const maxDuration = 60;

type TopCaption = { id: number; mood: MoodId; body: string; score: number; generations: { image_path: string } | null };

export default async function PhotoBoothPage() {
  const supabase = createClient(await cookies());
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    {
      data: { user },
    },
    { data, error },
    { data: topData },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("generations")
      .select("id, created_at, image_path, theme, alt_text, captions!inner(id, position, mood, body, score)")
      .order("created_at", { ascending: false })
      .order("position", { referencedTable: "captions" })
      .limit(30),
    supabase
      .from("captions")
      .select("id, mood, body, score, generations(image_path)")
      .gte("created_at", since)
      .gt("score", 0)
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const drops = (data ?? []) as Drop[];
  const top = topData as TopCaption | null;
  const captionIds = drops.flatMap((d) => d.captions.map((c) => c.id));

  let myVotes = new Map<number, -1 | 1>();
  let dropsLeft = DAILY_DROPS;
  if (user) {
    const [{ data: votes }, { data: used }] = await Promise.all([
      captionIds.length
        ? supabase.from("caption_votes").select("caption_id, vote").in("caption_id", captionIds)
        : Promise.resolve({ data: [] }),
      supabase.rpc("generations_today"),
    ]);
    myVotes = new Map((votes ?? []).map((v) => [v.caption_id as number, v.vote as -1 | 1]));
    dropsLeft = Math.max(0, DAILY_DROPS - ((used as number | null) ?? 0));
  }

  const photoUrl = (path: string) => supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  const theme = themeFor();

  return (
    <main className="page">
      <SiteNav>
        <AccountActions signedIn={!!user} />
      </SiteNav>
      <BoothTabs current="photos" />

      <header className="hero">
        <p className="eyebrow">Today’s theme: {theme}</p>
        <h1 className="title">
          The photo <span className="accent">booth.</span>
        </h1>
        <p className="tagline">Drop a photo and the booth writes three confessions in its voice. Everyone votes on the funniest.</p>
        {!user && (
          <div className="hero-cta">
            <Link href="/login" className="btn large aubergine">
              Log in to drop a photo <ArrowIcon />
            </Link>
          </div>
        )}
      </header>

      {user && <DropForm dropsLeft={dropsLeft} />}

      {top?.generations && (
        <section className="spotlight" aria-labelledby="spotlight-title">
          <img src={photoUrl(top.generations.image_path)} alt="" className="spotlight-photo" />
          <div>
            <h2 id="spotlight-title" className="eyebrow">
              Top caption, last 24 hours
            </h2>
            <p className="spotlight-body">{top.body}</p>
            <p className="spotlight-meta">
              {moodFor(top.mood).label} · {top.score} {top.score === 1 ? "point" : "points"}
            </p>
          </div>
        </section>
      )}

      {error ? (
        <div className="empty">
          <h2 className="empty-title">The photo booth is still being built.</h2>
          <p>Supabase says: {error.message}</p>
        </div>
      ) : drops.length === 0 ? (
        <div className="empty">
          <h2 className="empty-title">No photos yet.</h2>
          <p>Be the first to feed the booth.</p>
        </div>
      ) : (
        <>
          <div className="wall-head">
            <h2 className="count">
              {drops.length} {drops.length === 1 ? "drop" : "drops"}, {captionIds.length} confessions.
            </h2>
          </div>
          <section className="wall" aria-label="Photo drops">
            {drops.map((drop, index) => {
              const best = Math.max(...drop.captions.map((c) => c.score));
              return (
                <article key={drop.id} className="drop" style={{ "--i": Math.min(index, 8) } as React.CSSProperties}>
                  <figure className="drop-photo">
                    <img
                      src={photoUrl(drop.image_path)}
                      alt={drop.alt_text ?? "A photo dropped in the booth"}
                      loading={index < 2 ? "eager" : "lazy"}
                    />
                  </figure>
                  <header className="entry-meta drop-meta">
                    <span className="drop-theme">{drop.theme}</span>
                    <span className="entry-when">
                      <span>#{String(drop.id).padStart(4, "0")}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={drop.created_at}>{timeAgo(drop.created_at)}</time>
                    </span>
                  </header>
                  <ol className="captions">
                    {drop.captions.map((c) => {
                      const mood = moodFor(c.mood);
                      const leading = best > 0 && c.score === best;
                      return (
                        <li key={c.id} className="caption">
                          <div className="caption-text">
                            <span className="mood">
                              <span className="face" aria-hidden="true">
                                {mood.face}
                              </span>
                              {mood.label}
                              {leading && <span className="leading">Leading</span>}
                            </span>
                            <p className="caption-body">{c.body}</p>
                          </div>
                          <VoteButtons captionId={c.id} score={c.score} vote={myVotes.get(c.id) ?? 0} signedIn={!!user} />
                        </li>
                      );
                    })}
                  </ol>
                </article>
              );
            })}
          </section>
          <p className="wall-end">That’s every drop. New theme at midnight.</p>
        </>
      )}
    </main>
  );
}
