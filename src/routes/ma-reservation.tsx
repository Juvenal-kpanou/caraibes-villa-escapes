import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { getReservationByReference, requestRefund } from "@/lib/reservations.functions";
import { ReservationVoucher } from "@/components/site/ReservationVoucher";
import type { VoucherReservation } from "@/components/site/ReservationVoucher";
import { STATUS_LABELS, formatDateFr, formatEUR } from "@/lib/villas";

export const Route = createFileRoute("/ma-reservation")({
  head: () => ({
    meta: [
      { title: "Suivre ma réservation — Antilla Stay" },
      {
        name: "description",
        content:
          "Saisissez votre référence KRK-XXXXXX pour consulter le statut de votre séjour, le montant à régler et nos coordonnées bancaires.",
      },
      { property: "og:title", content: "Suivre ma réservation — Antilla Stay" },
      {
        property: "og:description",
        content: "Consultez votre dossier de réservation avec votre référence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyReservationPage,
});

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-sand/60 text-foreground",
  confirmed: "bg-palm/15 text-palm",
  cancelled: "bg-destructive/10 text-destructive",
  refund_pending: "bg-sand/60 text-foreground",
  refunded: "bg-palm/15 text-palm",
  refund_rejected: "bg-destructive/10 text-destructive",
};

function MyReservationPage() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const lookup = useServerFn(getReservationByReference);
  const refund = useServerFn(requestRefund);
  const [showCancel, setShowCancel] = useState(false);
  const [bankForm, setBankForm] = useState({ holder: "", iban: "", bic: "" });

  const mutation = useMutation({
    mutationFn: (payload: { reference: string; email: string }) => lookup({ data: payload }),
    onSuccess: () => setShowCancel(false),
  });

  const refundMutation = useMutation({
    mutationFn: (payload: {
      reference: string;
      email: string;
      holder: string;
      iban: string;
      bic: string;
    }) => refund({ data: payload }),
    onSuccess: () =>
      mutation.mutate({ reference: reference.trim().toUpperCase(), email: email.trim() }),
  });



  const result = mutation.data;
  const reservation = result?.reservation as
    | (Record<string, unknown> & {
        reference: string;
        guest_name: string;
        guests: number;
        check_in: string;
        check_out: string;
        nights: number;
        price_per_night: number;
        cleaning_fee: number;
        deposit: number;
        total_amount: number;
        status: string;
        created_at: string;
        villas: { name: string; location: string; images: string[] } | null;
      })
    | null
    | undefined;

  return (
    <SiteLayout>
      <section className="bg-gradient-to-b from-secondary/40 to-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-14 text-center md:py-20">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Suivi de dossier</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">Ma réservation</h1>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Saisissez la référence reçue lors de votre demande (format KRK-XXXXXX) et l'adresse
              e-mail du dossier pour retrouver votre séjour, le montant à régler et nos coordonnées
              bancaires.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 pb-20">
        <Reveal>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const ref = reference.trim().toUpperCase();
              const mail = email.trim();
              if (ref.length >= 4 && mail.includes("@")) mutation.mutate({ reference: ref, email: mail });
            }}
            className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 shadow-soft"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex-1">
                <span className="sr-only">Référence de réservation</span>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value.toUpperCase())}
                  placeholder="KRK-XXXXXX"
                  className="w-full rounded-full border border-border bg-background px-5 py-3 tracking-[0.12em] outline-none transition focus:border-primary"
                />
              </label>
              <label className="flex-1">
                <span className="sr-only">E-mail du dossier</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full rounded-full border border-border bg-background px-5 py-3 outline-none transition focus:border-primary"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={
                mutation.isPending || reference.trim().length < 4 || !email.trim().includes("@")
              }
              className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-soft transition-all duration-300 hover:brightness-110 disabled:opacity-60"
            >
              {mutation.isPending ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2" aria-hidden="true" />
                  Recherche…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-magnifying-glass mr-2" aria-hidden="true" />
                  Rechercher
                </>
              )}
            </button>
          </form>
        </Reveal>


        {mutation.isError && (
          <p className="mt-5 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
            Une erreur est survenue lors de la recherche. Merci de réessayer.
          </p>
        )}

        {mutation.isSuccess && !reservation && (
          <div className="mt-6 rounded-3xl border border-dashed border-border p-10 text-center">
            <i className="fa-solid fa-circle-question text-3xl text-primary" aria-hidden="true" />
            <p className="mt-4 text-muted-foreground">
              Aucun dossier ne correspond à cette référence. Vérifiez la saisie ou contactez-nous.
            </p>
          </div>
        )}

        {reservation && (
          <div className="mt-8 space-y-6 animate-pop">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Référence
                  </p>
                  <p className="font-display text-2xl">{reservation.reference}</p>
                </div>
                <span
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                    STATUS_STYLES[reservation.status] ?? "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {STATUS_LABELS[reservation.status] ?? reservation.status}
                </span>
              </div>

              <div className="grid gap-6 p-6 md:grid-cols-2">
                <div>
                  <h2 className="font-display text-xl">
                    {reservation.villas?.name ?? "Villa"}
                  </h2>
                  {reservation.villas?.location && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      <i
                        className="fa-solid fa-location-dot mr-1.5 text-primary"
                        aria-hidden="true"
                      />
                      {reservation.villas.location}
                    </p>
                  )}
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Arrivée</dt>
                      <dd className="font-semibold">{formatDateFr(reservation.check_in)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Départ</dt>
                      <dd className="font-semibold">{formatDateFr(reservation.check_out)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Voyageurs</dt>
                      <dd className="font-semibold">{reservation.guests}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Titulaire</dt>
                      <dd className="font-semibold">{reservation.guest_name}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl bg-secondary/50 p-5">
                  <h3 className="font-semibold">Détail du montant</h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">
                        {formatEUR(reservation.price_per_night)} × {reservation.nights} nuit
                        {reservation.nights > 1 ? "s" : ""}
                      </dt>
                      <dd>{formatEUR(reservation.price_per_night * reservation.nights)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Frais de ménage</dt>
                      <dd>{formatEUR(reservation.cleaning_fee)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-border pt-2 font-display text-lg">
                      <dt>Total</dt>
                      <dd>{formatEUR(reservation.total_amount)}</dd>
                    </div>
                    <p className="pt-1 text-xs text-muted-foreground">
                      Caution de {formatEUR(reservation.deposit)} remise sur place à l'arrivée.
                    </p>
                  </dl>
                </div>
              </div>
            </div>

            {result?.bank && reservation.status !== "cancelled" && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <h3 className="font-display text-xl">
                  <i
                    className="fa-solid fa-building-columns mr-2 text-primary"
                    aria-hidden="true"
                  />
                  Régler par virement
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Indiquez la référence <strong>{reservation.reference}</strong> dans le libellé du
                  virement.
                </p>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Titulaire", result.bank.account_holder],
                    ["Banque", result.bank.bank_name],
                    ["IBAN", result.bank.iban],
                    ["BIC", result.bank.bic],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-secondary/50 p-4">
                      <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="mt-1 font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="mt-5 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
                >
                  <i className="fa-solid fa-print mr-2" aria-hidden="true" />
                  Imprimer le justificatif
                </button>
              </div>
            )}

            <ReservationVoucher
              reservation={reservation as unknown as VoucherReservation}
              kind={reservation.status === "confirmed" ? "confirmation" : "demande"}
            />

            {["pending", "confirmed"].includes(reservation.status) && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <h3 className="font-display text-xl">
                  <i className="fa-solid fa-rotate-left mr-2 text-primary" aria-hidden="true" />
                  Annuler ma réservation
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  L'annulation est gratuite. Indiquez vos coordonnées bancaires pour recevoir le
                  remboursement.
                </p>
                {!showCancel ? (
                  <button
                    type="button"
                    onClick={() => setShowCancel(true)}
                    className="mt-4 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-all duration-300 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Annuler ma réservation
                  </button>
                ) : (
                  <form
                    className="mt-4 space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      refundMutation.mutate({
                        reference: reservation.reference,
                        email: email.trim(),
                        holder: bankForm.holder,
                        iban: bankForm.iban,
                        bic: bankForm.bic,
                      });

                    }}
                  >
                    <input
                      required
                      placeholder="Titulaire du compte"
                      value={bankForm.holder}
                      onChange={(e) => setBankForm({ ...bankForm, holder: e.target.value })}
                      className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm"
                    />
                    <input
                      required
                      placeholder="IBAN"
                      value={bankForm.iban}
                      onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                      className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm"
                    />
                    <input
                      required
                      placeholder="BIC"
                      value={bankForm.bic}
                      onChange={(e) => setBankForm({ ...bankForm, bic: e.target.value })}
                      className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={refundMutation.isPending}
                      className="gradient-lagoon w-full rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-50"
                    >
                      {refundMutation.isPending
                        ? "Envoi en cours..."
                        : "Confirmer l'annulation"}
                    </button>
                    {refundMutation.isError && (
                      <p className="text-sm text-destructive">
                        {(refundMutation.error as Error).message}
                      </p>
                    )}
                  </form>
                )}
              </div>
            )}

            {reservation.status === "refund_pending" && (
              <div className="rounded-3xl border border-border bg-sand/30 p-6 text-sm">
                Votre demande de remboursement est en cours de traitement. Le remboursement
                interviendra sous 24h.
              </div>
            )}
            {reservation.status === "refunded" && (
              <div className="rounded-3xl border border-border bg-palm/10 p-6 text-sm">
                Remboursement effectué.
              </div>
            )}
            {reservation.status === "refund_rejected" && (
              <div className="rounded-3xl border border-border bg-destructive/10 p-6 text-sm">
                Votre demande de remboursement a été rejetée. Contactez-nous pour en savoir plus.
              </div>
            )}
          </div>
        )}

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Pas encore de dossier ?{" "}
          <Link to="/villas" className="font-semibold text-primary hover:underline">
            Découvrir nos villas
          </Link>
        </p>
      </section>
    </SiteLayout>
  );
}
