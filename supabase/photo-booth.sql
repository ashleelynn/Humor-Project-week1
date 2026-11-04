-- The Photo Booth: logged-in users drop a photo, Gemini writes three confessions in the photo's voice,
-- and everyone votes on them. Run this once in the Supabase SQL Editor, after schema.sql and profiles.sql.

-- One row per Gemini call: the photo it saw, the exact prompt it got, the model that answered,
-- and the alt text it wrote so screen reader users get the joke too.
create table public.generations (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  image_path text not null check (image_path ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$'),
  theme text not null check (char_length(theme) <= 80),
  alt_text text check (char_length(alt_text) <= 300),
  context text check (char_length(context) <= 120),
  model text not null,
  prompt text not null
);

alter table public.generations enable row level security;

-- Like confessions: who dropped a photo, what they typed, and the prompt never leave the database.
revoke all on public.generations from anon, authenticated;
grant select (id, created_at, image_path, theme, alt_text) on public.generations to anon, authenticated;
grant insert (image_path, theme, alt_text, context, model, prompt) on public.generations to authenticated;

-- Five drops per person per New York day. Keeps the free Gemini quota alive and makes each drop count.
create function public.generations_today()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from public.generations
  where user_id = (select auth.uid())
    and created_at >= (date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York');
$$;

revoke execute on function public.generations_today() from public, anon;
grant execute on function public.generations_today() to authenticated;

create policy "Anyone can browse the photo booth"
  on public.generations for select to anon, authenticated
  using (true);

create policy "Drop photos as yourself, five a day"
  on public.generations for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.generations_today()) < 5);

-- The three confessions Gemini wrote for a drop. Nobody can edit or delete them, so votes stay honest.
create table public.captions (
  id bigint generated always as identity primary key,
  generation_id bigint not null references public.generations (id) on delete cascade,
  position smallint not null check (position between 1 and 3),
  created_at timestamptz not null default now(),
  mood text not null check (mood in ('petty', 'cringe', 'unhinged', 'wholesome', 'food-crime')),
  body text not null check (char_length(body) between 1 and 280),
  score int not null default 0,
  unique (generation_id, position)
);

alter table public.captions enable row level security;

revoke all on public.captions from anon, authenticated;
grant select (id, generation_id, position, created_at, mood, body, score) on public.captions to anon, authenticated;
grant insert (generation_id, position, mood, body) on public.captions to authenticated;

-- Captions only go on your own drop, in the minutes right after you made it.
create function public.can_caption(drop_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.generations
    where id = drop_id
      and user_id = (select auth.uid())
      and created_at > now() - interval '5 minutes'
  );
$$;

revoke execute on function public.can_caption(bigint) from public, anon;
grant execute on function public.can_caption(bigint) to authenticated;

create policy "Anyone can read captions"
  on public.captions for select to anon, authenticated
  using (true);

create policy "Caption your own fresh drop"
  on public.captions for insert to authenticated
  with check (public.can_caption(generation_id));

-- Up or down votes: one per user per caption, and you can change or take back your own.
create table public.caption_votes (
  caption_id bigint not null references public.captions (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (caption_id, user_id)
);

alter table public.caption_votes enable row level security;

revoke all on public.caption_votes from anon, authenticated;
grant select, delete on public.caption_votes to authenticated;
grant insert (caption_id, vote) on public.caption_votes to authenticated;
grant update (vote) on public.caption_votes to authenticated;

create policy "See your own votes"
  on public.caption_votes for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Vote as yourself"
  on public.caption_votes for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Change your own vote"
  on public.caption_votes for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Take back your own vote"
  on public.caption_votes for delete to authenticated
  using (user_id = (select auth.uid()));

-- Keep captions.score in sync without letting users edit it directly.
create function public.sync_caption_score()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.captions set score = score - old.vote where id = old.caption_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update public.captions set score = score + new.vote where id = new.caption_id;
  end if;
  return null;
end;
$$;

create trigger caption_votes_score
  after insert or update or delete on public.caption_votes
  for each row execute function public.sync_caption_score();

-- Photos: public to view by URL. Uploads count against the daily limit, and nobody can list,
-- replace or delete them through the API. Random file names keep drops anonymous.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('booth-photos', 'booth-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Upload photo booth drops, five a day"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'booth-photos'
    and name ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$'
    and (select public.generations_today()) < 5
  );

-- Every table in the public schema gets RLS. A table with RLS on and no policies is closed to the API.
do $$
declare
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' and not rowsecurity loop
    execute format('alter table public.%I enable row level security', t.tablename);
    raise notice 'Turned on RLS for public.%', t.tablename;
  end loop;
end;
$$;

-- Check: every row should say true.
-- select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;
