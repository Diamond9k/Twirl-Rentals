import Stripe from "https://esm.sh/stripe@14?target=deno";
import { json } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { stripeClient } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const stripe = stripeClient();
  const supabase = serviceClient();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return json({ error: "Webhook not configured" }, 500);
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("stripe-webhook signature error:", err);
    return json({ error: "Invalid signature" }, 400);
  }

  const { error: idempotencyError } = await supabase
    .from("stripe_webhook_events")
    .insert({ event_id: event.id, event_type: event.type, payload: event.data.object });

  if (idempotencyError) {
    if (idempotencyError.code === "23505") {
      return json({ received: true, duplicate: true });
    }
    console.error("idempotency insert error:", idempotencyError);
    return json({ error: "Idempotency failure" }, 500);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
      case "payment_intent.amount_capturable_updated": {
        const pi = event.data.object as Stripe.PaymentIntent;
        if (pi.metadata?.type !== "rental" || !pi.metadata?.rental_id) break;

        const { data: rental } = await supabase
          .from("rentals")
          .select("id, status")
          .eq("id", pi.metadata.rental_id)
          .maybeSingle();

        if (rental && ["pending", "approved"].includes(rental.status)) {
          await supabase
            .from("rentals")
            .update({ status: "paid", contract_agreed: true, contract_agreed_at: new Date().toISOString() })
            .eq("id", rental.id);
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const userId = account.metadata?.user_id;
        if (!userId) break;

        const external = account.external_accounts?.data?.[0] as Stripe.BankAccount | undefined;

        await supabase
          .from("profiles")
          .update({
            stripe_charges_enabled: account.charges_enabled ?? false,
            stripe_payouts_enabled: account.payouts_enabled ?? false,
            bank_last4: external?.last4 ?? null,
          })
          .eq("id", userId);
        break;
      }

      case "payout.paid":
      case "payout.failed": {
        const payout = event.data.object as Stripe.Payout;
        const status = event.type === "payout.paid" ? "paid" : "failed";

        await supabase
          .from("payout_ledger")
          .update({ status })
          .eq("stripe_payout_id", payout.id);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("stripe-webhook handler error:", err);
    return json({ error: "Handler failed" }, 500);
  }

  return json({ received: true });
});
