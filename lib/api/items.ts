import { supabase } from "@/lib/supabase";
import type { Item, ItemStatus, ItemWithOwner } from "@/lib/types";

const OWNER_SELECT =
  "*, owner:profiles!items_owner_id_fkey(id, full_name, avatar_url, sorority, rating)";

export interface BrowseFilters {
  search?: string;
  occasion?: string;
  category?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  sorority?: string;
}

export async function browseItems(
  filters: BrowseFilters = {},
): Promise<ItemWithOwner[]> {
  let query = supabase
    .from("items")
    .select(OWNER_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(60);

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      `title.ilike.${term},brand.ilike.${term},description.ilike.${term}`,
    );
  }
  if (filters.occasion) query = query.eq("occasion", filters.occasion);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.size) query = query.eq("size", filters.size as NonNullable<Item["size"]>);
  if (filters.minPrice != null) query = query.gte("price_per_day", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("price_per_day", filters.maxPrice);

  const { data, error } = await query;
  if (error) throw error;

  let items = (data ?? []) as unknown as ItemWithOwner[];
  // Chapter filter is on the joined owner profile.
  if (filters.sorority) {
    items = items.filter((i) => i.owner?.sorority === filters.sorority);
  }
  return items;
}

export async function getItem(id: string): Promise<ItemWithOwner> {
  const { data, error } = await supabase
    .from("items")
    .select(OWNER_SELECT)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as ItemWithOwner;
}

/** Listings shown on a public profile / closet — by owner, by status set. */
export async function getItemsByOwner(
  ownerId: string,
  statuses?: ItemStatus[],
): Promise<Item[]> {
  let query = supabase
    .from("items")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (statuses?.length) query = query.in("status", statuses);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export type ItemDraft = Pick<
  Item,
  | "title"
  | "description"
  | "price_per_day"
  | "deposit"
  | "size"
  | "occasion"
  | "category"
  | "brand"
  | "condition"
  | "images"
  | "status"
>;

export async function createItem(
  ownerId: string,
  draft: Partial<ItemDraft>,
): Promise<Item> {
  const { data, error } = await supabase
    .from("items")
    .insert({ owner_id: ownerId, ...draft })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(
  id: string,
  patch: Partial<ItemDraft>,
): Promise<Item> {
  const { data, error } = await supabase
    .from("items")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw error;
}

/** yyyy-mm-dd ranges already booked (approved/paid/active/return_pending). */
export async function getBookedRanges(
  itemId: string,
): Promise<{ start_date: string; end_date: string }[]> {
  const { data, error } = await supabase
    .from("rentals")
    .select("start_date, end_date")
    .eq("item_id", itemId)
    .in("status", ["approved", "paid", "active", "return_pending"]);
  if (error) throw error;
  return data ?? [];
}
