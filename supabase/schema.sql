-- The Confession Booth: anonymous thoughts, posted by logged-in users.
-- Run this once in the Supabase SQL Editor.

create table public.confessions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  body text not null check (char_length(body) between 3 and 280),
  mood text not null default 'unhinged'
    check (mood in ('petty', 'cringe', 'unhinged', 'wholesome', 'food-crime')),
  same_count int not null default 0
);

alter table public.confessions enable row level security;

-- Keep it anonymous: user_id is never readable through the API.
revoke all on public.confessions from anon, authenticated;
grant select (id, created_at, body, mood, same_count) on public.confessions to anon, authenticated;
grant insert (body, mood) on public.confessions to authenticated;

create policy "Anyone can read confessions"
  on public.confessions for select to anon, authenticated
  using (true);

create policy "Logged-in users confess as themselves"
  on public.confessions for insert to authenticated
  with check (user_id = (select auth.uid()));

-- "🫠 same" reactions: one per user per confession.
create table public.confession_sames (
  confession_id bigint not null references public.confessions (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (confession_id, user_id)
);

alter table public.confession_sames enable row level security;

revoke all on public.confession_sames from anon, authenticated;
grant select, insert, delete on public.confession_sames to authenticated;

create policy "See your own sames"
  on public.confession_sames for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Add your own same"
  on public.confession_sames for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Take back your own same"
  on public.confession_sames for delete to authenticated
  using (user_id = (select auth.uid()));

-- Keep confessions.same_count in sync without letting users edit it directly.
create function public.sync_same_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.confessions set same_count = same_count + 1 where id = new.confession_id;
  else
    update public.confessions set same_count = same_count - 1 where id = old.confession_id;
  end if;
  return null;
end;
$$;

create trigger confession_sames_count
  after insert or delete on public.confession_sames
  for each row execute function public.sync_same_count();

-- A few confessions to break the ice.
insert into public.confessions (user_id, body, mood, same_count, created_at) values
  (null, 'I say "on my way" when I have not yet located my other shoe.', 'unhinged', 14, now() - interval '3 days'),
  (null, 'I''ve been mispronouncing "quinoa" on purpose for three years because correcting myself now would be admitting defeat.', 'petty', 9, now() - interval '2 days 5 hours'),
  (null, 'I eat cereal with orange juice. I am not taking questions at this time.', 'food-crime', 3, now() - interval '2 days'),
  (null, 'Someone waved at the person behind me, I waved back, and then I committed and walked over to say hi.', 'cringe', 21, now() - interval '1 day 20 hours'),
  (null, 'I water my neighbor''s sad balcony plant while they''re at work. They think it''s thriving on its own.', 'wholesome', 33, now() - interval '1 day 8 hours'),
  (null, 'I rehearse arguments in the shower and I have never once lost.', 'unhinged', 27, now() - interval '1 day'),
  (null, 'I keep a mental list of everyone who has ever hit reply-all. You know who you are.', 'petty', 18, now() - interval '20 hours'),
  (null, 'I microwaved fish in the office kitchen. I know. I KNOW.', 'food-crime', 6, now() - interval '9 hours'),
  (null, 'I thanked my GPS out loud. Twice. It said nothing back and honestly that hurt.', 'cringe', 12, now() - interval '4 hours'),
  (null, 'My houseplants all have names and I tell them about my day. Gerald the fern knows everything.', 'wholesome', 15, now() - interval '50 minutes');
