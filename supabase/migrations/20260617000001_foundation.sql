-- Twirl v2 — A1 Foundation: extensions, profiles, auth trigger, avatars bucket

create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;

-- ─── HELPERS ────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_edu_email(email text)
returns boolean
language sql
immutable
as $$
  select email ~* '^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.edu$';
$$;

-- ─── PROFILES ───────────────────────────────────────────────────────────────

create table public.profiles (
  id                      uuid references auth.users on delete cascade primary key,
  full_name               text not null check (char_length(full_name) between 2 and 80),
  email                   text check (public.is_edu_email(email)),
  school                  text check (char_length(school) <= 100),
  sorority                text check (char_length(sorority) <= 80),
  sizes                   text[] default '{}' check (cardinality(sizes) <= 8),
  year                    text check (char_length(year) <= 10),
  major                   text check (char_length(major) <= 80),
  hometown                text check (char_length(hometown) <= 80),
  avatar_url              text,
  bio                     text check (char_length(bio) <= 300),
  is_verified             boolean default false,
  is_suspended            boolean default false,
  rating                  numeric(3,2) default 0 check (rating between 0 and 5),
  total_rentals           integer default 0 check (total_rentals >= 0),
  push_token              text,
  notification_prefs      jsonb default '{}'::jsonb,
  stripe_account_id       text unique,
  stripe_charges_enabled  boolean default false,
  stripe_payouts_enabled  boolean default false,
  bank_last4              text check (bank_last4 ~ '^\d{4}$'),
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles visible"
  on public.profiles for select
  using (not is_suspended);

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users edit own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create index idx_profiles_school on public.profiles(school);
create index idx_profiles_sorority on public.profiles(sorority);
create index idx_profiles_rating on public.profiles(rating desc);

-- ─── AUTH TRIGGER ───────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(coalesce(new.email, 'user'), '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── AVATARS STORAGE ────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
