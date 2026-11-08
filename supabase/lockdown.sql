-- One-time cleanup for databases set up before these lines were added to the other SQL files.
-- Safe to run more than once.

-- Unused helpers left behind by an earlier draft of the photo booth.
drop function if exists public.limit_daily_generations();
drop function if exists public.owns_generation(bigint);
drop function if exists public.sync_caption_votes();
drop function if exists public.generations_left_today();

-- Trigger functions: only their triggers run them, so nobody can call them through the API.
revoke execute on function public.sync_same_count() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_caption_score() from public, anon, authenticated;
