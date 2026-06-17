-- Twirl v2 — B1/B4/B5/B6: payout ledger, webhook idempotency, account deletion

create table public.payout_ledger (
  id                  uuid default extensions.uuid_generate_v4() primary key,
  owner_id            uuid references public.profiles(id) on delete cascade not null,
  rental_id           uuid references public.rentals(id) on delete set null,
  entry_type          text not null
    check (entry_type in ('rental_earn','manual_payout','refund')),
  amount_cents        integer not null check (amount_cents > 0),
  status              text not null default 'pending'
    check (status in ('pending','available','paid','failed')),
  stripe_transfer_id  text,
  stripe_payout_id    text,
  description         text check (char_length(description) <= 200),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.payout_ledger enable row level security;

create policy "Owners see own ledger"
  on public.payout_ledger for select
  using (auth.uid() = owner_id);

create trigger payout_ledger_updated_at
  before update on public.payout_ledger
  for each row execute function public.set_updated_at();

create index idx_payout_ledger_owner on public.payout_ledger(owner_id, created_at desc);
create index idx_payout_ledger_rental on public.payout_ledger(rental_id);

create table public.stripe_webhook_events (
  event_id      text primary key,
  event_type    text not null,
  processed_at  timestamptz not null default now(),
  payload       jsonb
);

alter table public.stripe_webhook_events enable row level security;
-- No client policies — service_role only via edge functions

create or replace function public.delete_user_data(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.rentals r
    where (r.owner_id = p_user or r.renter_id = p_user)
      and r.status in ('pending','approved','paid','active','return_pending','disputed')
  ) then
    raise exception 'Cannot delete account with active rentals';
  end if;

  delete from public.payout_ledger where owner_id = p_user;

  delete from public.reviews
    where reviewer_id = p_user or reviewee_id = p_user;

  delete from public.rental_contracts
    where owner_id = p_user or renter_id = p_user;

  delete from public.rentals
    where owner_id = p_user or renter_id = p_user
       or item_id in (select id from public.items where owner_id = p_user);

  delete from public.messages where sender_id = p_user;

  delete from public.conversations
    where user1_id = p_user or user2_id = p_user
       or item_id in (select id from public.items where owner_id = p_user);

  delete from public.reports
    where reporter_id = p_user or user_id = p_user
       or item_id in (select id from public.items where owner_id = p_user);

  delete from public.saved_items where user_id = p_user;
  delete from public.blocked_users where blocker_id = p_user or blocked_id = p_user;
  delete from public.items where owner_id = p_user;
  delete from public.profiles where id = p_user;
end;
$$;

revoke all on function public.delete_user_data(uuid) from public;
grant execute on function public.delete_user_data(uuid) to service_role;

create or replace function public.increment_owner_rental_count(p_owner_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set total_rentals = total_rentals + 1
  where id = p_owner_id;
end;
$$;

revoke all on function public.increment_owner_rental_count(uuid) from public, anon, authenticated;
grant execute on function public.increment_owner_rental_count(uuid) to service_role;

-- Rate-limit helper for payment intents (service_role reads bypass RLS)
create or replace view public.recent_rentals_by_user as
  select renter_id, count(*)::integer as count
  from public.rentals
  where created_at > now() - interval '24 hours'
  group by renter_id;

alter view public.recent_rentals_by_user set (security_invoker = true);
