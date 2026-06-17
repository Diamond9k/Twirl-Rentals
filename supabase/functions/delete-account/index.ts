import { json, optionsResponse } from "../_shared/cors.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const supabase = serviceClient();
    const userOrResp = await requireUser(req, supabase);
    if (userOrResp instanceof Response) return userOrResp;
    const user = userOrResp;

    const { error: rpcError } = await supabase.rpc("delete_user_data", { p_user: user.id });
    if (rpcError) {
      const status = rpcError.message.includes("active rentals") ? 409 : 500;
      return json({ error: rpcError.message }, status);
    }

    const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
    if (delError) return json({ error: delError.message }, 500);

    return json({ success: true });
  } catch (err) {
    console.error("delete-account error:", err);
    return json({ error: (err as Error).message ?? "Internal error" }, 500);
  }
});
