-- Twirl v2 — A8/A9: rental contracts, reviews, reports

create table public.rental_contracts (
  id                uuid default extensions.uuid_generate_v4() primary key,
  rental_id         uuid references public.rentals(id) on delete cascade not null,
  renter_id         uuid references public.profiles(id) not null,
  owner_id          uuid references public.profiles(id) not null,
  agreed_at         timestamptz not null default now(),
  deposit_intent_id text,
  terms_version     text not null default '2.0',
  ip_address        inet,
  user_agent        text check (char_length(user_agent) <= 500),
  created_at        timestamptz default now()
);

alter table public.rental_contracts enable row level security;

create policy "Contract parties see contracts"
  on public.rental_contracts for select
  using (auth.uid() = renter_id or auth.uid() = owner_id);

create policy "Renters create contracts"
  on public.rental_contracts for insert
  with check (auth.uid() = renter_id);

create index idx_contracts_rental on public.rental_contracts(rental_id);

create table public.reviews (
  id           uuid default extensions.uuid_generate_v4() primary key,
  rental_id    uuid references public.rentals(id) on delete cascade not null unique,
  reviewer_id  uuid references public.profiles(id) not null,
  reviewee_id  uuid references public.profiles(id) not null,
  stars        integer not null check (stars between 1 and 5),
  body         text check (char_length(body) <= 500),
  created_at   timestamptz default now(),
  check (reviewer_id <> reviewee_id)
);

alter table public.reviews enable row level security;

create policy "Reviews are public"
  on public.reviews for select
  using (true);

create policy "Reviewers create reviews"
  on public.reviews for insert
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1
      from public.rentals r
      where r.id = rental_id
        and r.status = 'completed'
        and auth.uid() in (r.renter_id, r.owner_id)
    )
  );

create index idx_reviews_reviewee on public.reviews(reviewee_id);

create or replace function public.refresh_profile_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles p
  set rating = coalesce((
    select round(avg(stars)::numeric, 2)
    from public.reviews
    where reviewee_id = new.reviewee_id
  ), 0)
  where p.id = new.reviewee_id;

  return new;
end;
$$;

create trigger reviews_refresh_rating
  after insert on public.reviews
  for each row execute function public.refresh_profile_rating();

create table public.reports (
  id           uuid default extensions.uuid_generate_v4() primary key,
  reporter_id  uuid references public.profiles(id) not null,
  item_id      uuid references public.items(id),
  user_id      uuid references public.profiles(id),
  reason       text not null check (reason in ('inappropriate','counterfeit','scam','spam','other')),
  details      text check (char_length(details) <= 500),
  resolved     boolean default false,
  created_at   timestamptz default now(),
  check (item_id is not null or user_id is not null)
);

alter table public.reports enable row level security;

create policy "Users create reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "Users see own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

create index idx_reports_reporter on public.reports(reporter_id);
