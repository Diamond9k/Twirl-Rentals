-- Twirl v2 — A3/A4: items (draft/active/rented), saved_items, item-images bucket

create table public.items (
  id              uuid default extensions.uuid_generate_v4() primary key,
  owner_id        uuid references public.profiles(id) on delete cascade not null,
  title           text not null check (char_length(title) between 3 and 100),
  description     text check (char_length(description) <= 1000),
  price_per_day   numeric(10,2) not null check (price_per_day between 1 and 500),
  deposit         numeric(10,2) default 0 check (deposit between 0 and 2000),
  size            text check (size in ('XS','S','M','L','XL','XXL')),
  occasion        text check (char_length(occasion) <= 80),
  category        text check (char_length(category) <= 80),
  brand           text check (char_length(brand) <= 80),
  condition       text check (condition in ('new','like_new','good','fair')),
  images          text[] default '{}' check (cardinality(images) <= 8),
  status          text not null default 'draft'
    check (status in ('draft','active','rented')),
  view_count      integer default 0 check (view_count >= 0),
  save_count      integer default 0 check (save_count >= 0),
  is_flagged      boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.items enable row level security;

create policy "Public active items visible"
  on public.items for select
  using (status = 'active' and not is_flagged);

create policy "Owners see all own items"
  on public.items for select
  using (auth.uid() = owner_id);

create policy "Owners insert items"
  on public.items for insert
  with check (auth.uid() = owner_id and status in ('draft','active'));

create policy "Owners update own items"
  on public.items for update
  using (auth.uid() = owner_id)
  with check (
    auth.uid() = owner_id
    and status in ('draft','active','rented')
  );

create policy "Owners delete own items"
  on public.items for delete
  using (auth.uid() = owner_id and status = 'draft');

create trigger items_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

create index idx_items_owner on public.items(owner_id);
create index idx_items_status on public.items(status) where status = 'active';
create index idx_items_occasion on public.items(occasion);
create index idx_items_price on public.items(price_per_day);
create index idx_items_created on public.items(created_at desc);

-- ─── SAVED ITEMS ────────────────────────────────────────────────────────────

create table public.saved_items (
  id         uuid default extensions.uuid_generate_v4() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  item_id    uuid references public.items(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (user_id, item_id)
);

alter table public.saved_items enable row level security;

create policy "Users see own saved"
  on public.saved_items for select
  using (auth.uid() = user_id);

create policy "Users manage saved"
  on public.saved_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_saved_user on public.saved_items(user_id);
create index idx_saved_item on public.saved_items(item_id);

-- Bump save_count when hearts toggle
create or replace function public.sync_item_save_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.items set save_count = save_count + 1 where id = new.item_id;
  elsif tg_op = 'DELETE' then
    update public.items set save_count = greatest(save_count - 1, 0) where id = old.item_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger saved_items_count_ins
  after insert on public.saved_items
  for each row execute function public.sync_item_save_count();

create trigger saved_items_count_del
  after delete on public.saved_items
  for each row execute function public.sync_item_save_count();

-- ─── ITEM IMAGES STORAGE ────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-images',
  'item-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

create policy "Auth users upload item images"
  on storage.objects for insert
  with check (
    bucket_id = 'item-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners update item images"
  on storage.objects for update
  using (
    bucket_id = 'item-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Owners delete item images"
  on storage.objects for delete
  using (
    bucket_id = 'item-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
