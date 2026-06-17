import { json, optionsResponse } from "../_shared/cors.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { stripeClient, toCents } from "../_shared/stripe.ts";

const RATE_LIMIT = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const supabase = serviceClient();
    const userOrResp = await requireUser(req, supabase);
    if (userOrResp instanceof Response) return userOrResp;
    const user = userOrResp;

    const { rental_id } = await req.json();
    if (!rental_id) return json({ error: "Missing rental_id" }, 400);

    const { data: recent } = await supabase
      .from("recent_rentals_by_user")
      .select("count")
      .eq("renter_id", user.id)
      .maybeSingle();

    if ((recent?.count ?? 0) > RATE_LIMIT) {
      return json({ error: "Too many rental requests today" }, 429);
    }

    const { data: rental, error: rentalError } = await supabase
      .from("rentals")
      .select(`
        id, renter_id, owner_id, status,
        subtotal, commission_amount, total_price, deposit_amount,
        stripe_payment_intent, stripe_deposit_intent
      `)
      .eq("id", rental_id)
      .eq("renter_id", user.id)
      .in("status", ["pending", "approved"])
      .single();

    if (rentalError || !rental) {
      return json({ error: "Rental not found or not payable" }, 404);
    }

    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_charges_enabled")
      .eq("id", rental.owner_id)
      .single();

    if (!ownerProfile?.stripe_account_id) {
      return json({ error: "Owner has not set up payouts yet" }, 422);
    }

    const stripe = stripeClient();
    const rentalCents = toCents(rental.total_price);
    const depositCents = toCents(rental.deposit_amount ?? 0);

    let paymentIntentId = rental.stripe_payment_intent as string | null;
    let paymentIntentClientSecret: string | null = null;

    if (paymentIntentId) {
      const existing = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (existing.status === "requires_payment_method" || existing.status === "requires_confirmation") {
        paymentIntentClientSecret = existing.client_secret;
      } else if (existing.status !== "requires_capture" && existing.status !== "succeeded") {
        paymentIntentId = null;
      }
    }

    if (!paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: rentalCents,
        currency: "usd",
        capture_method: "manual",
        metadata: {
          rental_id,
          type: "rental",
          user_id: user.id,
          owner_id: rental.owner_id,
        },
        transfer_data: {
          destination: ownerProfile.stripe_account_id,
        },
        application_fee_amount: toCents(rental.commission_amount),
      });

      paymentIntentId = paymentIntent.id;
      paymentIntentClientSecret = paymentIntent.client_secret;

      await supabase
        .from("rentals")
        .update({ stripe_payment_intent: paymentIntentId })
        .eq("id", rental_id);
    }

    let depositIntentClientSecret: string | null = null;
    let depositIntentId = rental.stripe_deposit_intent as string | null;

    if (depositCents > 0) {
      if (depositIntentId) {
        const existingDeposit = await stripe.paymentIntents.retrieve(depositIntentId);
        if (existingDeposit.status === "requires_payment_method" ||
            existingDeposit.status === "requires_confirmation") {
          depositIntentClientSecret = existingDeposit.client_secret;
        } else if (existingDeposit.status !== "requires_capture") {
          depositIntentId = null;
        }
      }

      if (!depositIntentId) {
        const depositIntent = await stripe.paymentIntents.create({
          amount: depositCents,
          currency: "usd",
          capture_method: "manual",
          metadata: { rental_id, type: "deposit", user_id: user.id },
        });

        depositIntentId = depositIntent.id;
        depositIntentClientSecret = depositIntent.client_secret;

        await supabase
          .from("rentals")
          .update({ stripe_deposit_intent: depositIntentId })
          .eq("id", rental_id);
      }
    }

    return json({
      paymentIntentClientSecret,
      depositIntentClientSecret,
      pricing: {
        subtotal: rental.subtotal,
        commission_amount: rental.commission_amount,
        total_price: rental.total_price,
        deposit_amount: rental.deposit_amount,
      },
    });
  } catch (err) {
    console.error("create-payment-intent error:", err);
    return json({ error: (err as Error).message ?? "Internal error" }, 500);
  }
});
