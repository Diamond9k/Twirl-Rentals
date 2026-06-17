import { json, optionsResponse } from "../_shared/cors.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { stripeClient } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const supabase = serviceClient();
    const userOrResp = await requireUser(req, supabase);
    if (userOrResp instanceof Response) return userOrResp;
    const user = userOrResp;

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_account_id, full_name, email")
      .eq("id", user.id)
      .single();

    const stripe = stripeClient();
    let accountId = profile?.stripe_account_id as string | null;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email ?? profile?.email ?? undefined,
        metadata: { user_id: user.id },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        settings: {
          payouts: { schedule: { interval: "manual" } },
        },
      });

      accountId = account.id;

      await supabase
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", user.id);
    } else {
      await stripe.accounts.update(accountId, {
        settings: { payouts: { schedule: { interval: "manual" } } },
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: "https://twirl.rentals/connect/refresh",
      return_url: "https://twirl.rentals/connect/return",
      type: "account_onboarding",
    });

    return json({ url: accountLink.url, account_id: accountId });
  } catch (err) {
    console.error("create-connect-account error:", err);
    return json({ error: (err as Error).message ?? "Internal error" }, 500);
  }
});
