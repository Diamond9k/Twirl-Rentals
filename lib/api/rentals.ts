import { supabase } from "@/lib/supabase";
import type { Item, Profile, Rental } from "@/lib/types";

export interface RentalWithRelations extends Rental {
  item: Pick<Item, "id" | "title" | "brand" | "images" | "price_per_day"> | null;
  renter: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
  owner: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
}

const RENTAL_SELECT = `
  *,
  item:items!rentals_item_id_fkey(id, title, brand, images, price_per_day),
  renter:profiles!rentals_renter_id_fkey(id, full_name, avatar_url),
  owner:profiles!rentals_owner_id_fkey(id, full_name, avatar_url)
`;

/** All rentals where the user is renter OR owner (RLS already enforces this). */
export async function getMyRentals(): Promise<RentalWithRelations[]> {
  const { data, error } = await supabase
    .from("rentals")
    .select(RENTAL_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as RentalWithRelations[];
}

export async function getRental(id: string): Promise<RentalWithRelations> {
  const { data, error } = await supabase
    .from("rentals")
    .select(RENTAL_SELECT)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as RentalWithRelations;
}

/* ── Server-gated transitions (RPCs) ────────────────────────────────────── */

/** Creates a pending rental + conversation. Returns the new rental id. */
export async function createRentalRequest(
  itemId: string,
  startDate: string,
  endDate: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("create_rental_request", {
    p_item_id: itemId,
    p_start_date: startDate,
    p_end_date: endDate,
  });
  if (error) throw error;
  return data as unknown as string;
}

type RentalRpc =
  | "approve_rental"
  | "decline_rental"
  | "cancel_rental"
  | "activate_rental"
  | "mark_rental_returned";

async function callRentalRpc(fn: RentalRpc, rentalId: string): Promise<void> {
  const { error } = await supabase.rpc(fn, { p_rental_id: rentalId });
  if (error) throw error;
}

export const approveRental = (id: string) => callRentalRpc("approve_rental", id);
export const declineRental = (id: string) => callRentalRpc("decline_rental", id);
export const cancelRental = (id: string) => callRentalRpc("cancel_rental", id);
export const activateRental = (id: string) => callRentalRpc("activate_rental", id);
export const markRentalReturned = (id: string) =>
  callRentalRpc("mark_rental_returned", id);

/** Records the renter's agreement to the rental contract before paying. */
export async function recordContractAgreement(input: {
  rental_id: string;
  renter_id: string;
  owner_id: string;
}): Promise<void> {
  const { error } = await supabase.from("rental_contracts").insert(input);
  if (error) throw error;
}
