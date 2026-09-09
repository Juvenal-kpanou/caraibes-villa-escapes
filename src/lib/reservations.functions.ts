import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeCommitment, computeDueNow, computeTotal, requiresDeposit } from "@/lib/site";

const paymentOptionSchema = z.enum([
  "full_with_deposit",
  "full_no_deposit",
  "partial_with_deposit",
  "partial_no_deposit",
]);

const createSchema = z.object({
  villaId: z.string().uuid(),
  guestName: z.string().trim().min(2).max(120),
  guestEmail: z.string().trim().email().max(255),
  guestPhone: z.string().trim().min(6).max(30),
  guests: z.number().int().min(1).max(40),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentOption: paymentOptionSchema,
});

const RESERVATION_FIELDS =
  "id, reference, guest_name, guest_email, guest_phone, guests, check_in, check_out, nights, price_per_night, price_per_person, cleaning_fee, deposit, total_amount, amount_due_now, amount_paid, payment_option, deposit_required, status, created_at, confirmed_at, refund_requested_at, refund_processed_at, villas(name, location, capacity, images)";

function makeReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `ANT-${code}`;
}

function eachDate(from: string, to: string) {
  const out: string[] = [];
  const cursor = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  while (cursor < end) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/** Crée une demande de réservation (public) et renvoie la référence. */
export const createReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: villa, error: villaError } = await supabaseAdmin
      .from("villas")
      .select("*")
      .eq("id", data.villaId)
      .eq("is_active", true)
      .maybeSingle();
    if (villaError) throw new Error(villaError.message);
    if (!villa) throw new Error("Cette villa n'est plus disponible.");

    if (data.guests > villa.capacity) {
      throw new Error(
        `Cette villa accueille au maximum ${villa.capacity} personnes. Merci d'ajuster le nombre de voyageurs.`,
      );
    }

    const nights = eachDate(data.checkIn, data.checkOut).length;
    if (nights < 1) throw new Error("La date de départ doit être après la date d'arrivée.");

    const { data: unavailable, error: unavailableError } = await supabaseAdmin.rpc(
      "get_unavailable_dates",
      { _villa_id: data.villaId },
    );
    if (unavailableError) throw new Error(unavailableError.message);
    const taken = new Set(((unavailable ?? []) as string[]).map((d) => String(d).slice(0, 10)));
    if (eachDate(data.checkIn, data.checkOut).some((d) => taken.has(d))) {
      throw new Error("Certaines dates viennent d'être réservées. Merci de choisir d'autres dates.");
    }

    const pricePerPerson = Number((villa as { price_per_person?: number }).price_per_person ?? 0);
    if (pricePerPerson <= 0) {
      throw new Error("Le tarif de cette villa n'est pas encore renseigné.");
    }
    const deposit = Number(villa.deposit);
    const total = computeTotal(pricePerPerson, data.guests, nights);
    const dueNow = computeDueNow(data.paymentOption, total, deposit);

    let reference = makeReference();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data: existing } = await supabaseAdmin
        .from("reservations")
        .select("id")
        .eq("reference", reference)
        .maybeSingle();
      if (!existing) break;
      reference = makeReference();
    }

    const { data: created, error: insertError } = await supabaseAdmin.from("reservations").insert({
      reference,
      villa_id: data.villaId,
      guest_name: data.guestName,
      guest_email: data.guestEmail,
      guest_phone: data.guestPhone,
      guests: data.guests,
      check_in: data.checkIn,
      check_out: data.checkOut,
      nights,
      price_per_night: Number(villa.price_per_night),
      price_per_person: pricePerPerson,
      cleaning_fee: Number(villa.cleaning_fee),
      deposit,
      total_amount: total,
      amount_due_now: dueNow,
      amount_paid: 0,
      payment_option: data.paymentOption,
      deposit_required: requiresDeposit(data.paymentOption),
      status: "pending",
    })
      .select(RESERVATION_FIELDS)
      .single();
    if (insertError) throw new Error(insertError.message);

    return { reference, nights, total, dueNow, reservation: created };
  });

/** Consultation d'un dossier : référence + e-mail du dossier (double vérification). */
export const getReservationByReference = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        reference: z.string().trim().min(4).max(20),
        email: z.string().trim().email().max(255),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const reference = data.reference.toUpperCase();
    const email = data.email.toLowerCase();

    const { data: reservation, error } = await supabaseAdmin
      .from("reservations")
      .select(RESERVATION_FIELDS)
      .eq("reference", reference)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!reservation) return { reservation: null, bank: null };
    if (String(reservation.guest_email ?? "").trim().toLowerCase() !== email) {
      return { reservation: null, bank: null };
    }

    const { data: bank } = await supabaseAdmin
      .from("bank_settings")
      .select("iban, bic, bank_name, account_holder")
      .limit(1)
      .maybeSingle();

    return { reservation, bank: bank ?? null };
  });

/** Client : demande d'annulation + remboursement, gratuite. */
export const requestRefund = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        reference: z.string().trim().min(4).max(20),
        email: z.string().trim().email().max(255),
        holder: z.string().trim().min(2).max(120),
        iban: z.string().trim().min(10).max(40),
        bic: z.string().trim().min(6).max(15),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const reference = data.reference.toUpperCase();
    const email = data.email.trim().toLowerCase();

    const { data: existing, error } = await supabaseAdmin
      .from("reservations")
      .select("id, status, guest_email")
      .eq("reference", reference)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!existing || String(existing.guest_email ?? "").trim().toLowerCase() !== email) {
      throw new Error("Dossier introuvable.");
    }
    if (["refund_pending", "refunded"].includes(existing.status)) {
      throw new Error("Une demande de remboursement est déjà enregistrée.");
    }

    const { error: updateError } = await supabaseAdmin
      .from("reservations")
      .update({
        status: "refund_pending",
        refund_holder: data.holder,
        refund_iban: data.iban.replace(/\s+/g, "").toUpperCase(),
        refund_bic: data.bic.toUpperCase(),
        refund_requested_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (updateError) throw new Error(updateError.message);
    return { ok: true };
  });


/** Admin : changer le statut d'une réservation. */
export const updateReservationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum([
          "pending",
          "confirmed",
          "cancelled",
          "refund_pending",
          "refunded",
          "refund_rejected",
        ]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: current, error: readError } = await context.supabase
      .from("reservations")
      .select("amount_due_now, amount_paid")
      .eq("id", data.id)
      .maybeSingle();
    if (readError) throw new Error(readError.message);

    const patch: {
      status: string;
      confirmed_at: string | null;
      amount_paid?: number;
      refund_processed_at?: string;
    } = {
      status: data.status,
      confirmed_at: data.status === "confirmed" ? new Date().toISOString() : null,
    };
    if (data.status === "confirmed") {
      patch.amount_paid = Number(current?.amount_due_now ?? 0);
    }
    if (data.status === "refunded" || data.status === "refund_rejected") {
      patch.refund_processed_at = new Date().toISOString();
    }

    const { error } = await context.supabase.from("reservations").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin : enregistrer un paiement complémentaire (solde). */
export const markBalancePaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: current, error: readError } = await context.supabase
      .from("reservations")
      .select("total_amount, deposit, payment_option")
      .eq("id", data.id)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!current) throw new Error("Dossier introuvable.");

    const commitment = computeCommitment(
      String(current.payment_option),
      Number(current.total_amount),
      Number(current.deposit),
    );
    const { error } = await context.supabase
      .from("reservations")
      .update({ amount_paid: commitment, status: "confirmed" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
