import { supabase } from "@/lib/supabase";
import type { ItemWithOwner, ReportReason } from "@/lib/types";

/* ── Saved items (hearts) ───────────────────────────────────────────────── */

export async function getSavedItemIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("saved_items")
    .select("item_id")
    .eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.item_id));
}

export async function getSavedItems(userId: string): Promise<ItemWithOwner[]> {
  const { data, error } = await supabase
    .from("saved_items")
    .select(
      "item:items!saved_items_item_id_fkey(*, owner:profiles!items_owner_id_fkey(id, full_name, avatar_url, sorority, rating))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((r: { item: unknown }) => r.item)
    .filter(Boolean) as unknown as ItemWithOwner[];
}

export async function setSaved(
  userId: string,
  itemId: string,
  saved: boolean,
): Promise<void> {
  if (saved) {
    const { error } = await supabase
      .from("saved_items")
      .upsert({ user_id: userId, item_id: itemId }, { onConflict: "user_id,item_id" });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("saved_items")
      .delete()
      .eq("user_id", userId)
      .eq("item_id", itemId);
    if (error) throw error;
  }
}

/* ── Blocking ───────────────────────────────────────────────────────────── */

export async function blockUser(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  const { error } = await supabase
    .from("blocked_users")
    .upsert(
      { blocker_id: blockerId, blocked_id: blockedId },
      { onConflict: "blocker_id,blocked_id" },
    );
  if (error) throw error;
}

export async function unblockUser(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) throw error;
}

/* ── Reporting ──────────────────────────────────────────────────────────── */

export async function report(input: {
  reporter_id: string;
  reason: ReportReason;
  details?: string;
  item_id?: string;
  user_id?: string;
}): Promise<void> {
  const { error } = await supabase.from("reports").insert(input);
  if (error) throw error;
}
