import { json, optionsResponse } from "../_shared/cors.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { stripeClient, fromCents } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const supabase = serviceClient();
    const userOrResp = await requireUser(req, supabase);
    if (userOrResp instanceof Response) return userOrResp;
    const user = userOrResp;

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_payouts_enabled, bank_last4")
      .eq("id", user.id)
      .single();

    const { data: ledger, error: ledgerError } = await supabase
      .from("payout_ledger")
      .select("id, entry_type, amount_cents, status, description, created_at, stripe_payout_id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (ledgerError) return json({ error: ledgerError.message }, 500);

    const earned = (ledger ?? [])
      .filter((row) => row.entry_type === "rental_earn" && row.status === "available")
      .reduce((sum, row) => sum + row.amount_cents, 0);

    const paidOut = (ledger ?? [])
      .filter((row) => row.entry_type === "manual_payout" && row.status === "paid")
      .reduce((sum, row) => sum + row.amount_cents, 0);

    const pendingPayout = (ledger ?? [])
      .filter((row) => row.entry_type === "manual_payout" && row.status === "pending")
      .reduce((sum, row) => sum + row.amount_cents, 0);

    let stripeAvailableCents: number | null = null;
    let stripePendingCents: number | null = null;

    if (profile?.stripe_account_id) {
      try {
        const stripe = stripeClient();
        const balance = await stripe.balance.retrieve({
          stripeAccount: profile.stripe_account_id,
        });

        stripeAvailableCents = balance.available
          .filter((b) => b.currency === "usd")
          .reduce((sum, b) => sum + b.amount, 0);

        stripePendingCents = balance.pending
          .filter((b) => b.currency === "usd")
          .reduce((sum, b) => sum + b.amount, 0);
      } catch (err) {
        console.error("get-earnings balance error:", err);
      }
    }

    const ledgerAvailableCents = Math.max(earned - paidOut - pendingPayout, 0);
    const availableCents = stripeAvailableCents ?? ledgerAvailableCents;

    return json({
      available_balance: fromCents(availableCents),
      available_balance_cents: availableCents,
      stripe_pending_balance: stripePendingCents !== null ? fromCents(stripePendingCents) : null,
      ledger_available_cents: ledgerAvailableCents,
      bank_last4: profile?.bank_last4 ?? null,
      payouts_enabled: profile?.stripe_payouts_enabled ?? false,
      history: (ledger ?? []).map((row) => ({
        id: row.id,
        type: row.entry_type,
        amount: fromCents(row.amount_cents),
        amount_cents: row.amount_cents,
        status: row.status,
        description: row.description,
        created_at: row.created_at,
      })),
    });
  } catch (err) {
    console.error("get-earnings error:", err);
    return json({ error: (err as Error).message ?? "Internal error" }, 500);
  }
});
