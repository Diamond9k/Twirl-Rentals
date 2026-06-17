import { invokeFunction } from "@/lib/supabase";
import type {
  ConnectAccountResponse,
  EarningsResponse,
  PaymentIntentResponse,
  RequestPayoutResponse,
} from "@/lib/types";

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
