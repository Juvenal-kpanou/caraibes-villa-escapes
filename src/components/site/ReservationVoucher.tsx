import {
  SCHEDULE_LABEL,
  SITE_NAME,
  computeCommitment,
  paymentOptionLabel,
} from "@/lib/site";
import { STATUS_LABELS, formatDateFr, formatEUR } from "@/lib/villas";

export type VoucherReservation = {
  reference: string;
  guest_name: string;
  guests: number;
  check_in: string;
  check_out: string;
  nights: number;
  price_per_person: number;
  deposit: number;
  total_amount: number;
  amount_paid: number;
  amount_due_now: number;
  payment_option: string;
  status: string;
  villas?: { name: string; location: string } | null;
};

export function ReservationVoucher({
  reservation,
  kind,
}: {
  reservation: VoucherReservation;
  kind: "demande" | "confirmation";
}) {
  const commitment = computeCommitment(
    reservation.payment_option,
    Number(reservation.total_amount),
    Number(reservation.deposit),
  );
  const paid = Number(reservation.amount_paid);
  const remaining = Math.max(0, commitment - paid);
  const fullyPaid = remaining <= 0;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft print:border-0 print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="font-display text-2xl">{SITE_NAME}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Justificatif de {kind === "demande" ? "demande de réservation" : "confirmation"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Référence</p>
          <p className="font-display text-xl tracking-wider text-primary">
            {reservation.reference}
          </p>
        </div>
      </div>

      <div className="grid gap-6 py-5 md:grid-cols-2">
        <div className="space-y-2 text-sm">
          <h3 className="font-display text-lg">{reservation.villas?.name ?? "Villa"}</h3>
          <p className="text-muted-foreground">
            <i className="fa-solid fa-location-dot mr-1.5 text-primary" aria-hidden="true" />
            {reservation.villas?.location ?? "Guadeloupe"}
          </p>
          <p>
            <span className="text-muted-foreground">Client : </span>
            {reservation.guest_name}
          </p>
          <p>
            <span className="text-muted-foreground">Arrivée : </span>
            {formatDateFr(reservation.check_in)} à 10h00
          </p>
          <p>
            <span className="text-muted-foreground">Départ : </span>
            {formatDateFr(reservation.check_out)} avant 15h00
          </p>
          <p>
            <span className="text-muted-foreground">Séjour : </span>
            {reservation.guests} personne{reservation.guests > 1 ? "s" : ""} ·{" "}
            {reservation.nights} nuit{reservation.nights > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground">{SCHEDULE_LABEL}</p>
        </div>

        <div className="space-y-2 rounded-2xl bg-secondary/50 p-5 text-sm">
          <p className="font-semibold">Détail du montant</p>
          <p className="text-muted-foreground">
            {reservation.guests} personne{reservation.guests > 1 ? "s" : ""} ×{" "}
            {reservation.nights} nuit{reservation.nights > 1 ? "s" : ""} ×{" "}
            {formatEUR(Number(reservation.price_per_person))} ={" "}
            <strong className="text-foreground">
              {formatEUR(Number(reservation.total_amount))}
            </strong>
          </p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">Caution</span>
            <span>{formatEUR(Number(reservation.deposit))}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">Formule choisie</span>
            <span className="text-right">{paymentOptionLabel(reservation.payment_option)}</span>
          </p>
          <p className="flex justify-between border-t border-border pt-2">
            <span className="text-muted-foreground">Montant déjà payé</span>
            <span className="font-semibold">{formatEUR(paid)}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">Restant à payer</span>
            <span className="font-semibold">{formatEUR(remaining)}</span>
          </p>
          <p
            className={`mt-2 rounded-xl px-3 py-2 text-center text-sm font-semibold ${
              fullyPaid ? "bg-palm/15 text-palm" : "bg-sand/70 text-foreground"
            }`}
          >
            {fullyPaid
              ? "Solde payé intégralement"
              : `Solde restant : ${formatEUR(remaining)} — à régler sous 72h`}
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Statut du dossier : {STATUS_LABELS[reservation.status] ?? reservation.status}
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-8 border-t border-border pt-6">
        <div className="relative">
          <div className="flex size-28 rotate-[-8deg] items-center justify-center rounded-full border-4 border-primary/70 text-center text-primary/80">
            <div className="flex size-24 flex-col items-center justify-center rounded-full border border-dashed border-primary/50">
              <span className="font-display text-sm leading-tight">{SITE_NAME}</span>
              <span className="mt-1 text-[8px] uppercase tracking-[0.2em]">Guadeloupe</span>
              <span className="mt-1 text-[8px] uppercase tracking-[0.14em]">Réservation</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-signature text-4xl leading-none text-foreground">Antilla Stay</p>
          <p className="mt-1 text-xs text-muted-foreground">Signature du gestionnaire</p>
        </div>
      </div>
    </div>
  );
}
