import { supabase } from "@/lib/supabase";
import type { Profile, Review } from "@/lib/types";

export async function getProfile(id: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(
  id: string,
  patch: Partial<Profile>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export interface ReviewWithReviewer extends Review {
  reviewer: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
}

export async function getReviewsForUser(
  userId: string,
): Promise<ReviewWithReviewer[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "*, reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, avatar_url)",
    )
    .eq("reviewee_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ReviewWithReviewer[];
}

export async function searchProfiles(
  query: string,
  excludeId?: string,
): Promise<Pick<Profile, "id" | "full_name" | "avatar_url" | "sorority">[]> {
  let q = supabase
    .from("profiles")
    .select("id, full_name, avatar_url, sorority")
    .order("full_name", { ascending: true })
    .limit(30);
  if (query.trim()) q = q.ilike("full_name", `%${query.trim()}%`);
  if (excludeId) q = q.neq("id", excludeId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createReview(input: {
  rental_id: string;
  reviewer_id: string;
  reviewee_id: string;
  stars: number;
  body?: string;
}): Promise<void> {
  const { error } = await supabase.from("reviews").insert(input);
  if (error) throw error;
}
