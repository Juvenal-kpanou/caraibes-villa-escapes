import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Renvoie le rôle du compte connecté. */
export const getMyRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const roles = (data ?? []).map((r) => String(r.role));
    return { roles, isAdmin: roles.includes("admin") };
  });

/** Réservations rattachées à l'adresse e-mail du compte connecté. */
export const listMyReservations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const raw = String((context.claims as { email?: string }).email ?? "").trim();
    const email = raw.toLowerCase();
    if (!email) return { reservations: [] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("reservations")
      .select(
        "id, reference, guests, check_in, check_out, nights, total_amount, amount_paid, deposit, status, created_at, villas(name, location)",
      )
      .in("guest_email", Array.from(new Set([raw, email])))
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { reservations: data ?? [] };
  });
