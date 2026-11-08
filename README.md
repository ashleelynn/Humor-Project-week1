# The Confession Booth

An anonymous confessions wall for college students, built with Next.js and Supabase, styled after Hinge's brand system.

It has two rooms:

- **Confessions** (`/`): logged-in users post anonymous confessions with a mood; everyone can "same" the ones they relate to.
- **Photo booth** (`/photo-booth`): logged-in users drop a photo, Claude writes three confessions in the voice of whatever's in it, and everyone votes them up or down.

## Setup

### 1. Supabase

Run these in the Supabase SQL Editor, in order:

1. `supabase/schema.sql`: confessions and "same" reactions
2. `supabase/profiles.sql`: profiles and the `avatars` bucket
3. `supabase/photo-booth.sql`: AI generations, captions, votes, the `booth-photos` bucket, and RLS on every public table

If the booth tables already exist from an earlier draft (the page says a column like `captions.mood` does not exist), run `supabase/photo-booth-reset.sql` first, then `photo-booth.sql` again. If you set up the database before the trigger functions were locked down, run `supabase/lockdown.sql` once.

### 2. Environment variables

Set these in `.env.local` for local dev, and in Vercel under Settings → Environment Variables:

| Name | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API keys |
| `ANTHROPIC_API_KEY` | [Claude Console](https://platform.claude.com/settings/keys). Server-only, never prefix it with `NEXT_PUBLIC_`. |
| `ANTHROPIC_MODEL` | Optional. Defaults to `claude-opus-5-5`. |

### 3. Run it

```bash
npm install
npm run dev
```

## How the data is protected

Every table has row level security on. The API roles only get the columns they need:

| Table | Anyone | Logged-in users |
| --- | --- | --- |
| `confessions` | Read (never `user_id`) | Post as themselves |
| `confession_sames` | — | See, add and remove their own |
| `profiles` | — | See and edit their own |
| `generations` | Read photo, theme, alt text (never who, the prompt, or their context) | Insert as themselves, 5 per New York day |
| `captions` | Read | Insert only on their own drop, within 5 minutes, 3 max; never edit text or score |
| `caption_votes` | — | See, cast, change and take back their own; one per caption |

Scores and "same" counts are kept in sync by triggers, so nobody can set them directly. Photos get random file names so a URL can't be traced back to whoever dropped it.

## Product notes

Built for Sam: a Columbia junior, chronically online, from the Midwest and new to New York.

- **A reason to come back every day.** The photo booth has a daily theme ("Bodega cats", "Butler at 2am", "Something that reminds you of home") that changes at midnight New York time, and a "Top caption, last 24 hours" spotlight.
- **Scarcity makes drops count.** Five drops a day keeps the feed curated and the API bill small.
- **Better than Crackd.** Voting is one tap with instant feedback and no page reload. Captions are tagged with the same moods as confessions so the two rooms feel like one app. Photos stay anonymous. Claude also writes alt text, so the feed works with a screen reader.
