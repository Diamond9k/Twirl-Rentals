import { json, optionsResponse } from "../_shared/cors.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { stripeClient, fromCents } from "../_shared/stripe.ts";

const MIN_PAYOUT_CENTS = 100;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const supabase = serviceClient();
    const userOrResp = await requireUser(req, supabase);
    if (userOrResp instanceof Response) return userOrResp;
    const user = userOrResp;

    const { amount_cents } = await req.json().catch(() => ({}));

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_payouts_enabled")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_account_id) {
      return json({ error: "Connect account not set up" }, 422);
    }

    if (!profile.stripe_payouts_enabled) {
      return json({ error: "Payouts not enabled on your account" }, 422);
    }

    const stripe = stripeClient();
    const balance = await stripe.balance.retrieve({
      stripeAccount: profile.stripe_account_id,
    });

    const availableCents = balance.available
      .filter((b) => b.currency === "usd")
      .reduce((sum, b) => sum + b.amount, 0);

    const payoutCents = typeof amount_cents === "number" && amount_cents > 0
      ? Math.min(amount_cents, availableCents)
      : availableCents;

    if (payoutCents < MIN_PAYOUT_CENTS) {
      return json({
        error: `Minimum cash out is ${fromCents(MIN_PAYOUT_CENTS)}`,
        available_balance_cents: availableCents,
      }, 422);
    }

    const payout = await stripe.payouts.create(
      { amount: payoutCents, currency: "usd" },
      { stripeAccount: profile.stripe_account_id },
    );

    await supabase.from("payout_ledger").insert({
      owner_id: user.id,
      entry_type: "manual_payout",
      amount_cents: payoutCents,
      status: payout.status === "paid" ? "paid" : "pending",
      stripe_payout_id: payout.id,
      description: "Manual cash out",
    });

    return json({
      success: true,
      payout_id: payout.id,
      amount: fromCents(payoutCents),
      amount_cents: payoutCents,
      status: payout.status,
    });
  } catch (err) {
    console.error("request-payout error:", err);
    return json({ error: (err as Error).message ?? "Internal error" }, 500);
  }
});
