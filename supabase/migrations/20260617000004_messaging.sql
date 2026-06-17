-- Twirl v2 — A7: messages, unread triggers, block enforcement

create table public.messages (
  id               uuid default extensions.uuid_generate_v4() primary key,
  conversation_id  uuid references public.conversations(id) on delete cascade not null,
  sender_id        uuid references public.profiles(id) not null,
  content          text not null check (char_length(content) between 1 and 2000),
  is_deleted       boolean default false,
  created_at       timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Participants see messages"
  on public.messages for select
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.user1_id or auth.uid() = c.user2_id)
        and not public.users_are_blocked(c.user1_id, c.user2_id)
    )
  );

create policy "Participants send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.user1_id or auth.uid() = c.user2_id)
        and not public.users_are_blocked(c.user1_id, c.user2_id)
    )
  );

create policy "Sender soft-deletes messages"
  on public.messages for update
  using (auth.uid() = sender_id);

create index idx_messages_conv on public.messages(conversation_id, created_at desc);
create index idx_messages_sender on public.messages(sender_id);

-- Atomic unread + last_message maintenance
create or replace function public.bump_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conv public.conversations%rowtype;
begin
  select * into v_conv
  from public.conversations
  where id = new.conversation_id;

  if not found then
    return new;
  end if;

  update public.conversations
  set
    last_message = left(new.content, 1000),
    last_message_at = new.created_at,
    unread_user1 = unread_user1 + case when new.sender_id = v_conv.user2_id then 1 else 0 end,
    unread_user2 = unread_user2 + case when new.sender_id = v_conv.user1_id then 1 else 0 end
  where id = new.conversation_id;

  return new;
end;
$$;

create trigger messages_bump_conversation
  after insert on public.messages
  for each row execute function public.bump_conversation_on_message();

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_conv public.conversations%rowtype;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  select * into v_conv from public.conversations where id = p_conversation_id;
  if not found then raise exception 'Conversation not found'; end if;

  if v_user not in (v_conv.user1_id, v_conv.user2_id) then
    raise exception 'Not authorized';
  end if;

  if v_user = v_conv.user1_id then
    update public.conversations set unread_user1 = 0 where id = p_conversation_id;
  else
    update public.conversations set unread_user2 = 0 where id = p_conversation_id;
  end if;
end;
$$;

grant execute on function public.mark_conversation_read(uuid) to authenticated;
