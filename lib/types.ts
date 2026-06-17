/**
 * Database types for Twirl v2.
 *
 * Hand-authored to match supabase/migrations exactly. You can regenerate
 * a fuller version any time with:
 *   supabase gen types typescript --project-id lcbywlafowwfrtsakhlv > lib/types.gen.ts
 */

export type ItemStatus = "draft" | "active" | "rented";

export type ItemCondition = "new" | "like_new" | "good" | "fair";

export type ItemSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export type RentalStatus =
  | "pending"
  | "approved"
  | "paid"
  | "active"
  | "return_pending"
  | "completed"
  | "cancelled"
  | "declined"
  | "disputed";

export type PayoutEntryType = "rental_earn" | "manual_payout" | "refund";

export type PayoutStatus = "pending" | "available" | "paid" | "failed";

export type ReportReason =
  | "inappropriate"
  | "counterfeit"
  | "scam"
  | "spam"
  | "other";

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  school: string | null;
  sorority: string | null;
  sizes: string[];
  year: string | null;
  major: string | null;
  hometown: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  is_suspended: boolean;
  rating: number;
  total_rentals: number;
  push_token: string | null;
  notification_prefs: Record<string, unknown>;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  bank_last4: string | null;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  price_per_day: number;
  deposit: number;
  size: ItemSize | null;
  occasion: string | null;
  category: string | null;
  brand: string | null;
  condition: ItemCondition | null;
  images: string[];
  status: ItemStatus;
  view_count: number;
  save_count: number;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
}

/** Item joined with its owner profile (common browse/detail shape). */
export interface ItemWithOwner extends Item {
  owner: Pick<
    Profile,
    "id" | "full_name" | "avatar_url" | "sorority" | "rating"
  > | null;
}

export interface SavedItem {
  id: string;
  user_id: string;
  item_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  item_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_user1: number;
  unread_user2: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
}

export interface Rental {
  id: string;
  item_id: string;
  renter_id: string;
  owner_id: string;
  conversation_id: string | null;
  start_date: string;
  end_date: string;
  subtotal: number;
  commission_amount: number;
  total_price: number;
  deposit_amount: number;
  status: RentalStatus;
  stripe_payment_intent: string | null;
  stripe_deposit_intent: string | null;
  contract_agreed: boolean;
  contract_agreed_at: string | null;
  return_requested_at: string | null;
  return_confirmed_at: string | null;
  deposit_released_at: string | null;
  owner_payout_transfer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  rental_id: string;
  reviewer_id: string;
  reviewee_id: string;
  stars: number;
  body: string | null;
  created_at: string;
}

export interface PayoutLedgerEntry {
  id: string;
  owner_id: string;
  rental_id: string | null;
  entry_type: PayoutEntryType;
  amount_cents: number;
  status: PayoutStatus;
  stripe_transfer_id: string | null;
  stripe_payout_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/* ── Edge function response shapes ──────────────────────────────────────── */

export interface PaymentIntentResponse {
  paymentIntentClientSecret: string | null;
  depositIntentClientSecret: string | null;
  pricing: {
    subtotal: number;
    commission_amount: number;
    total_price: number;
    deposit_amount: number;
  };
}

export interface EarningsHistoryRow {
  id: string;
  type: PayoutEntryType;
  amount: number;
  amount_cents: number;
  status: PayoutStatus;
  description: string | null;
  created_at: string;
}

export interface EarningsResponse {
  available_balance: number;
  available_balance_cents: number;
  stripe_pending_balance: number | null;
  ledger_available_cents: number;
  bank_last4: string | null;
  payouts_enabled: boolean;
  history: EarningsHistoryRow[];
}

export interface ConnectAccountResponse {
  url: string;
  account_id: string;
}

export interface RequestPayoutResponse {
  success: boolean;
  payout_id: string;
  amount: number;
  amount_cents: number;
  status: string;
}

/* ── Minimal Database typing for the supabase-js generic ────────────────── */

type TableShape<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableShape<Profile>;
      items: TableShape<Item>;
      saved_items: TableShape<SavedItem>;
      conversations: TableShape<Conversation>;
      messages: TableShape<Message>;
      rentals: TableShape<Rental>;
      reviews: TableShape<Review>;
      payout_ledger: TableShape<PayoutLedgerEntry>;
      blocked_users: TableShape<{
        id: string;
        blocker_id: string;
        blocked_id: string;
        created_at: string;
      }>;
      reports: TableShape<{
        id: string;
        reporter_id: string;
        item_id: string | null;
        user_id: string | null;
        reason: ReportReason;
        details: string | null;
        resolved: boolean;
        created_at: string;
      }>;
      rental_contracts: TableShape<{
        id: string;
        rental_id: string;
        renter_id: string;
        owner_id: string;
        agreed_at: string;
        deposit_intent_id: string | null;
        terms_version: string;
        created_at: string;
      }>;
    };
    Views: {
      recent_rentals_by_user: {
        Row: { renter_id: string; count: number };
      };
    };
    Functions: Record<string, unknown>;
    Enums: Record<string, never>;
  };
}
