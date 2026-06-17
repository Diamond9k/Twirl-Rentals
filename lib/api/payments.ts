import { invokeFunction, supabase } from "@/lib/supabase";
import type {
  ConnectAccountResponse,
  EarningsResponse,
  PaymentIntentResponse,
  RequestPayoutResponse,
} from "@/lib/types";

/**
 * Cheap, Stripe-free estimate of cash-out-ready cents straight from the ledger
 * (available earnings minus pending/paid payouts). Used for the home banner;
 * the Earnings screen uses the authoritative Stripe balance via get-earnings.
 */
export async function getLedgerAvailableCents(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("payout_ledger")
    .select("entry_type, amount_cents, status")
    .eq("owner_id", userId);
  if (error) throw error;

  let earned = 0;
  let paidOrPending = 0;
  for (const row of data ?? []) {
    if (row.entry_type === "rental_earn" && row.status === "available") {
      earned += row.amount_cents;
    } else if (
      row.entry_type === "manual_payout" &&
      (row.status === "paid" || row.status === "pending")
    ) {
      paidOrPending += row.amount_cents;
    }
  }
  return Math.max(earned - paidOrPending, 0);
}

/** B3 — create/return rental + deposit PaymentIntents for the checkout sheet. */
export function createPaymentIntent(
  rentalId: string,
): Promise<PaymentIntentResponse> {
  return invokeFunction<PaymentIntentResponse>("create-payment-intent", {
    rental_id: rentalId,
  });
}

/** B4 — owner confirms return: capture rental, release deposit, ledger earn. */
export function completeRental(
  rentalId: string,
): Promise<{ success: boolean; owner_payout_cents: number }> {
  return invokeFunction("complete-rental", { rental_id: rentalId });
}

/** B2 — start Stripe Connect Express onboarding; returns a hosted URL. */
export function createConnectAccount(): Promise<ConnectAccountResponse> {
  return invokeFunction<ConnectAccountResponse>("create-connect-account");
}

/** B5 — balance + payout history for the earnings screen. */
export function getEarnings(): Promise<EarningsResponse> {
  return invokeFunction<EarningsResponse>("get-earnings");
}

/** B5 — manual cash-out button. Omit amount to cash out the full balance. */
export function requestPayout(
  amountCents?: number,
): Promise<RequestPayoutResponse> {
  return invokeFunction<RequestPayoutResponse>(
    "request-payout",
    amountCents != null ? { amount_cents: amountCents } : {},
  );
}

/** Account deletion (App Store requirement). */
export function deleteAccount(): Promise<{ success: boolean }> {
  return invokeFunction("delete-account");
}
