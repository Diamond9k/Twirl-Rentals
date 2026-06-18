import { supabase } from "@/lib/supabase";
import type { Conversation, Item, Message, Profile } from "@/lib/types";

export interface ConversationWithMeta extends Conversation {
  user1: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
  user2: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
  item: Pick<Item, "id" | "title" | "images"> | null;
}

const CONVERSATION_SELECT = `
  *,
  user1:profiles!conversations_user1_id_fkey(id, full_name, avatar_url),
  user2:profiles!conversations_user2_id_fkey(id, full_name, avatar_url),
  item:items!conversations_item_id_fkey(id, title, images)
`;

export async function getConversations(): Promise<ConversationWithMeta[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .order("last_message_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as unknown as ConversationWithMeta[];
}

export async function getConversation(
  id: string,
): Promise<ConversationWithMeta> {
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as ConversationWithMeta;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const { error } = await supabase.rpc("mark_conversation_read", {
    p_conversation_id: conversationId,
  });
  if (error) throw error;
}

/**
 * Find an existing conversation between two users (optionally about an item),
 * or create one. Returns the conversation id. Used by "Message" CTAs.
 */
export async function getOrCreateConversation(
  selfId: string,
  otherId: string,
  itemId?: string | null,
): Promise<string> {
  // user1 is always the initiator per RLS insert policy.
  const existing = await supabase
    .from("conversations")
    .select("id")
    .or(
      `and(user1_id.eq.${selfId},user2_id.eq.${otherId}),and(user1_id.eq.${otherId},user2_id.eq.${selfId})`,
    )
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) return existing.data.id;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ user1_id: selfId, user2_id: otherId, item_id: itemId ?? null })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

/** Unread count for the current user across a conversation row. */
export function unreadFor(conv: Conversation, userId: string): number {
  if (conv.user1_id === userId) return conv.unread_user1;
  if (conv.user2_id === userId) return conv.unread_user2;
  return 0;
}

export function otherParty(
  conv: ConversationWithMeta,
  userId: string,
): Pick<Profile, "id" | "full_name" | "avatar_url"> | null {
  return conv.user1_id === userId ? conv.user2 : conv.user1;
}

/** Realtime subscription for new messages in a conversation. Returns unsubscribe. */
export function subscribeToMessages(
  conversationId: string,
  onInsert: (message: Message) => void,
): () => void {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onInsert(payload.new as Message),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
