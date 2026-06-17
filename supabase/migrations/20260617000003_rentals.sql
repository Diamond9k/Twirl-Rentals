-- Twirl v2 — A5/A6: rentals ledger + server-gated status RPCs
-- conversations + blocked_users included here for create_rental_request deps

create table public.blocked_users (
  id          uuid default extensions.uuid_generate_v4() primary key,
  blocker_id  uuid references public.profiles(id) on delete cascade not null,
  blocked_id  uuid references public.profiles(id) on delete cascade not null,
  created_at  timestamptz default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocked_users enable row level security;

create policy "Users manage blocks"
  on public.blocked_users for all
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

create or replace function public.users_are_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.blocked_users
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

revoke all on function public.users_are_blocked(uuid, uuid) from public;

create table public.conversations (
  id               uuid default extensions.uuid_generate_v4() primary key,
  user1_id         uuid references public.profiles(id) not null,
  user2_id         uuid references public.profiles(id) not null,
  item_id          uuid references public.items(id),
  last_message     text check (char_length(last_message) <= 1000),
  last_message_at  timestamptz,
  unread_user1     integer default 0 check (unread_user1 >= 0),
  unread_user2     integer default 0 check (unread_user2 >= 0),
  created_at       timestamptz default now(),
  unique (user1_id, user2_id, item_id),
  check (user1_id <> user2_id)
);

alter table public.conversations enable row level security;

create policy "Participants see conversations"
  on public.conversations for select
  using (
    (auth.uid() = user1_id or auth.uid() = user2_id)
    and not public.users_are_blocked(user1_id, user2_id)
  );

create policy "Users create conversations"
  on public.conversations for insert
  with check (
    auth.uid() = user1_id
    and user1_id <> user2_id
    and not public.users_are_blocked(user1_id, user2_id)
  );

create policy "Participants update conversations"
  on public.conversations for update
  using (
    (auth.uid() = user1_id or auth.uid() = user2_id)
    and not public.users_are_blocked(user1_id, user2_id)
  );

create index idx_conv_user1 on public.conversations(user1_id);
create index idx_conv_user2 on public.conversations(user2_id);
create index idx_conv_item on public.conversations(item_id);

create table public.rentals (
  id                      uuid default extensions.uuid_generate_v4() primary key,
  item_id                 uuid references public.items(id) not null,
  renter_id               uuid references public.profiles(id) not null,
  owner_id                uuid references public.profiles(id) not null,
  conversation_id         uuid references public.conversations(id),
  start_date              date not null,
  end_date                date not null,
  subtotal                numeric(10,2) not null check (subtotal > 0),
  commission_amount       numeric(10,2) not null check (commission_amount >= 0),
  total_price             numeric(10,2) not null check (total_price > 0),
  deposit_amount          numeric(10,2) default 0 check (deposit_amount >= 0),
  status                  text not null default 'pending'
    check (status in (
      'pending','approved','paid','active','return_pending',
      'completed','cancelled','declined','disputed'
    )),
  stripe_payment_intent   text,
  stripe_deposit_intent   text,
  contract_agreed         boolean default false,
  contract_agreed_at      timestamptz,
  return_requested_at     timestamptz,
  return_confirmed_at     timestamptz,
  deposit_released_at     timestamptz,
  owner_payout_transfer_id text,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now(),
  check (end_date > start_date),
  check (renter_id <> owner_id),
  check (total_price = subtotal + commission_amount)
);

alter table public.rentals enable row level security;

-- Parties may read; no direct writes (RPCs + edge functions only)
create policy "Rental parties see rentals"
  on public.rentals for select
  using (auth.uid() = renter_id or auth.uid() = owner_id);

create trigger rentals_updated_at
  before update on public.rentals
  for each row execute function public.set_updated_at();

create index idx_rentals_renter on public.rentals(renter_id);
create index idx_rentals_owner on public.rentals(owner_id);
create index idx_rentals_item on public.rentals(item_id);
create index idx_rentals_status on public.rentals(status);
create index idx_rentals_dates on public.rentals(item_id, start_date, end_date);

-- ─── PRICING (internal) ─────────────────────────────────────────────────────

create or replace function public.calculate_rental_pricing(
  p_price_per_day numeric,
  p_start_date date,
  p_end_date date,
  p_deposit numeric default 0
)
returns table (
  rental_days integer,
  subtotal numeric,
  commission_amount numeric,
  total_price numeric,
  deposit_amount numeric
)
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_days integer;
  v_subtotal numeric;
  v_commission numeric;
begin
  v_days := (p_end_date - p_start_date);
  if v_days < 1 then
    raise exception 'Rental must be at least 1 day';
  end if;

  v_subtotal := round(p_price_per_day * v_days, 2);
  v_commission := round(v_subtotal * 0.15, 2);

  rental_days := v_days;
  subtotal := v_subtotal;
  commission_amount := v_commission;
  total_price := v_subtotal + v_commission;
  deposit_amount := coalesce(p_deposit, 0);
  return next;
end;
$$;

revoke all on function public.calculate_rental_pricing(numeric, date, date, numeric) from public;

-- ─── RENTAL RPCs ────────────────────────────────────────────────────────────

create or replace function public.create_rental_request(
  p_item_id uuid,
  p_start_date date,
  p_end_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_item public.items%rowtype;
  v_pricing record;
  v_rental_id uuid;
  v_conv_id uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_item
  from public.items
  where id = p_item_id
  for update;

  if not found then
    raise exception 'Item not found';
  end if;

  if v_item.owner_id = v_user then
    raise exception 'Cannot rent your own item';
  end if;

  if v_item.status <> 'active' then
    raise exception 'Item is not available';
  end if;

  if p_end_date <= p_start_date then
    raise exception 'End date must be after start date';
  end if;

  if public.users_are_blocked(v_user, v_item.owner_id) then
    raise exception 'Messaging blocked between users';
  end if;

  if exists (
    select 1
    from public.rentals r
    where r.item_id = p_item_id
      and r.status in ('approved','paid','active','return_pending')
      and daterange(r.start_date, r.end_date, '[]')
          && daterange(p_start_date, p_end_date, '[]')
  ) then
    raise exception 'Item is already booked for these dates';
  end if;

  select * into v_pricing
  from public.calculate_rental_pricing(
    v_item.price_per_day,
    p_start_date,
    p_end_date,
    v_item.deposit
  );

  insert into public.conversations (user1_id, user2_id, item_id)
  values (v_user, v_item.owner_id, p_item_id)
  on conflict (user1_id, user2_id, item_id) do nothing;

  select c.id into v_conv_id
  from public.conversations c
  where c.user1_id = v_user
    and c.user2_id = v_item.owner_id
    and c.item_id is not distinct from p_item_id;

  insert into public.rentals (
    item_id, renter_id, owner_id, conversation_id,
    start_date, end_date,
    subtotal, commission_amount, total_price, deposit_amount,
    status
  ) values (
    p_item_id, v_user, v_item.owner_id, v_conv_id,
    p_start_date, p_end_date,
    v_pricing.subtotal, v_pricing.commission_amount,
    v_pricing.total_price, v_pricing.deposit_amount,
    'pending'
  )
  returning id into v_rental_id;

  return v_rental_id;
end;
$$;

create or replace function public.approve_rental(p_rental_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_rental public.rentals%rowtype;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  select * into v_rental from public.rentals where id = p_rental_id for update;
  if not found or v_rental.owner_id <> v_user then
    raise exception 'Rental not found or not authorized';
  end if;
  if v_rental.status <> 'pending' then
    raise exception 'Rental is not pending approval';
  end if;

  update public.rentals set status = 'approved' where id = p_rental_id;
end;
$$;

create or replace function public.decline_rental(p_rental_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_rental public.rentals%rowtype;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  select * into v_rental from public.rentals where id = p_rental_id for update;
  if not found or v_rental.owner_id <> v_user then
    raise exception 'Rental not found or not authorized';
  end if;
  if v_rental.status <> 'pending' then
    raise exception 'Rental is not pending';
  end if;

  update public.rentals set status = 'declined' where id = p_rental_id;
end;
$$;

create or replace function public.cancel_rental(p_rental_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_rental public.rentals%rowtype;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  select * into v_rental from public.rentals where id = p_rental_id for update;
  if not found then raise exception 'Rental not found'; end if;

  if v_rental.status not in ('pending','approved') then
    raise exception 'Rental cannot be cancelled in status %', v_rental.status;
  end if;

  if v_user = v_rental.renter_id then
    null;
  elsif v_user = v_rental.owner_id and v_rental.status = 'pending' then
    null;
  else
    raise exception 'Not authorized to cancel this rental';
  end if;

  update public.rentals set status = 'cancelled' where id = p_rental_id;
end;
$$;

create or replace function public.activate_rental(p_rental_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_rental public.rentals%rowtype;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  select * into v_rental from public.rentals where id = p_rental_id for update;
  if not found or v_rental.owner_id <> v_user then
    raise exception 'Rental not found or not authorized';
  end if;
  if v_rental.status <> 'paid' then
    raise exception 'Rental must be paid before handoff';
  end if;

  update public.rentals set status = 'active' where id = p_rental_id;
  update public.items set status = 'rented' where id = v_rental.item_id;
end;
$$;

create or replace function public.mark_rental_returned(p_rental_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_rental public.rentals%rowtype;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  select * into v_rental from public.rentals where id = p_rental_id for update;
  if not found or v_rental.renter_id <> v_user then
    raise exception 'Rental not found or not authorized';
  end if;
  if v_rental.status <> 'active' then
    raise exception 'Rental is not active';
  end if;

  update public.rentals
  set status = 'return_pending',
      return_requested_at = now()
  where id = p_rental_id;
end;
$$;

grant execute on function public.create_rental_request(uuid, date, date) to authenticated;
grant execute on function public.approve_rental(uuid) to authenticated;
grant execute on function public.decline_rental(uuid) to authenticated;
grant execute on function public.cancel_rental(uuid) to authenticated;
grant execute on function public.activate_rental(uuid) to authenticated;
grant execute on function public.mark_rental_returned(uuid) to authenticated;
