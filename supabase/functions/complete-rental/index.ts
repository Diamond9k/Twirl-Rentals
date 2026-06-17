import { json, optionsResponse } from "../_shared/cors.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { stripeClient, toCents } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const supabase = serviceClient();
    const userOrResp = await requireUser(req, supabase);
    if (userOrResp instanceof Response) return userOrResp;
    const user = userOrResp;

    const { rental_id } = await req.json();
    if (!rental_id) return json({ error: "Missing rental_id" }, 400);

    const { data: rental, error: rentalError } = await supabase
      .from("rentals")
      .select(`
        id, item_id, owner_id, renter_id, status,
        subtotal, commission_amount, total_price,
        stripe_payment_intent, stripe_deposit_intent,
        owner_payout_transfer_id
      `)
      .eq("id", rental_id)
      .eq("owner_id", user.id)
      .in("status", ["active", "return_pending"])
      .single();

    if (rentalError || !rental) {
      return json({ error: "Rental not found or not ready for completion" }, 404);
    }

    const stripe = stripeClient();
    const errors: string[] = [];

    if (rental.stripe_payment_intent) {
      try {
        const pi = await stripe.paymentIntents.retrieve(rental.stripe_payment_intent);
        if (pi.status === "requires_capture") {
          await stripe.paymentIntents.capture(rental.stripe_payment_intent);
        }
      } catch (err) {
        const msg = (err as Error).message ?? "capture failed";
        if (!msg.includes("already been captured")) errors.push(`Capture failed: ${msg}`);
      }
    }

    if (rental.stripe_deposit_intent) {
      try {
        const depositIntent = await stripe.paymentIntents.retrieve(rental.stripe_deposit_intent);
        if (depositIntent.status === "requires_capture") {
          await stripe.paymentIntents.cancel(rental.stripe_deposit_intent);
        } else if (depositIntent.status === "succeeded") {
          await stripe.refunds.create({ payment_intent: rental.stripe_deposit_intent });
        }
      } catch (err) {
        errors.push(`Deposit release failed: ${(err as Error).message}`);
      }
    }

    if (errors.length > 0) return json({ error: errors.join("; ") }, 500);

    const ownerCents = toCents(rental.subtotal);

    const { data: existingLedger } = await supabase
      .from("payout_ledger")
      .select("id")
      .eq("rental_id", rental_id)
      .eq("entry_type", "rental_earn")
      .maybeSingle();

    if (!existingLedger) {
      await supabase.from("payout_ledger").insert({
        owner_id: rental.owner_id,
        rental_id: rental.id,
        entry_type: "rental_earn",
        amount_cents: ownerCents,
        status: "available",
        description: "Rental completed",
      });
    }

    await supabase
      .from("rentals")
      .update({
        status: "completed",
        return_confirmed_at: new Date().toISOString(),
        deposit_released_at: new Date().toISOString(),
      })
      .eq("id", rental_id);

    await supabase
      .from("items")
      .update({ status: "active" })
      .eq("id", rental.item_id);

    await supabase.rpc("increment_owner_rental_count", { p_owner_id: rental.owner_id });

    return json({ success: true, owner_payout_cents: ownerCents });
  } catch (err) {
    console.error("complete-rental error:", err);
    return json({ error: (err as Error).message ?? "Internal error" }, 500);
  }
});
