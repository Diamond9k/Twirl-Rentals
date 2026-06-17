-- Twirl v2 — Security lockdown: revoke dangerous RPCs, pin search_path

revoke execute on function public.handle_new_user() from public, anon, authenticated;

revoke all on function public.users_are_blocked(uuid, uuid) from public, anon, authenticated;
grant execute on function public.users_are_blocked(uuid, uuid) to authenticated, service_role;

revoke all on function public.calculate_rental_pricing(numeric, date, date, numeric) from public, anon, authenticated;
grant execute on function public.calculate_rental_pricing(numeric, date, date, numeric) to service_role;

revoke all on function public.bump_conversation_on_message() from public, anon, authenticated;
revoke all on function public.refresh_profile_rating() from public, anon, authenticated;
revoke all on function public.sync_item_save_count() from public, anon, authenticated;

revoke all on function public.increment_owner_rental_count(uuid) from public, anon, authenticated;
grant execute on function public.increment_owner_rental_count(uuid) to service_role;

alter function public.is_edu_email(text) set search_path = '';
alter function public.set_updated_at() set search_path = '';

-- item-images: public bucket serves direct URLs; block enumeration via broad SELECT policy
drop policy if exists "Public read item images" on storage.objects;

-- Harden rental money columns: only service_role may update rentals directly
create or replace function public.guard_rental_sensitive_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_setting('role', true) = 'service_role'
     or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if new.status is distinct from old.status
     or new.subtotal is distinct from old.subtotal
     or new.commission_amount is distinct from old.commission_amount
     or new.total_price is distinct from old.total_price
     or new.deposit_amount is distinct from old.deposit_amount
     or new.stripe_payment_intent is distinct from old.stripe_payment_intent
     or new.stripe_deposit_intent is distinct from old.stripe_deposit_intent
     or new.contract_agreed is distinct from old.contract_agreed
     or new.owner_payout_transfer_id is distinct from old.owner_payout_transfer_id then
    raise exception 'Rental status and payment fields are server-managed';
  end if;

  return new;
end;
$$;

create trigger rentals_guard_sensitive
  before update on public.rentals
  for each row execute function public.guard_rental_sensitive_columns();
