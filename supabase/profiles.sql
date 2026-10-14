-- Profiles: one row per user, created automatically on first sign-in (email or Google).
-- Run this once in the Supabase SQL Editor, after schema.sql.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (first_name, last_name, avatar_url, updated_at) on public.profiles to authenticated;

create policy "See your own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Edit your own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Google sends given_name/family_name; fall back to splitting full_name for other providers.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := nullif(trim(coalesce(meta ->> 'full_name', meta ->> 'name', '')), '');
begin
  insert into public.profiles (id, first_name, last_name, avatar_url)
  values (
    new.id,
    coalesce(meta ->> 'given_name', split_part(full_name, ' ', 1)),
    coalesce(meta ->> 'family_name', nullif(trim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), '')),
    coalesce(meta ->> 'avatar_url', meta ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users who signed up before this table existed get an empty profile too.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- Profile photos: public to read, each user writes only inside their own <user id>/ folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "Read your own avatar files"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Upload your own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Replace your own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Delete your own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
