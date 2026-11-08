-- Removes an earlier draft of the photo booth tables so photo-booth.sql can be run fresh.
-- Only run this when the booth tables are empty or you're fine losing their rows.
-- Run this first, then photo-booth.sql.

drop table if exists public.caption_votes cascade;
drop table if exists public.captions cascade;
drop table if exists public.generations cascade;

drop function if exists public.sync_caption_score() cascade;
drop function if exists public.can_caption(bigint) cascade;
drop function if exists public.generations_today() cascade;
-- Helpers the earlier draft used under other names.
drop function if exists public.limit_daily_generations() cascade;
drop function if exists public.owns_generation(bigint) cascade;
drop function if exists public.sync_caption_votes() cascade;
drop function if exists public.generations_left_today() cascade;

-- Storage policies that mention the booth bucket, whatever the old draft named them.
do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%booth-photos%'
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
    raise notice 'Dropped storage policy %', p.policyname;
  end loop;
end;
$$;
