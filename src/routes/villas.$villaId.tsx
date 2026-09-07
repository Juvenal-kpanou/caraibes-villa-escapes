import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { AvailabilityCalendar } from "@/components/site/AvailabilityCalendar";
import { createReservation } from "@/lib/reservations.functions";
import { ReservationVoucher } from "@/components/site/ReservationVoucher";
import {
  PAYMENT_OPTIONS,
  SCHEDULE_LABEL,
  computeCommitment,
  computeDueNow,
  computeTotal,
  requiresDeposit,
  type PaymentOption,
} from "@/lib/site";
import {
  amenityIcon,
  bankSettingsQuery,
  formatDateFr,
  formatEUR,
  nightsBetween,
  unavailableDatesQuery,
  villaQuery,
} from "@/lib/villas";

export const Route = createFileRoute("/villas/$villaId")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(villaQuery(params.villaId)),
  head: ({ loaderData }) => {
    const villa = loaderData ?? null;
    const title = villa
      ? `${villa.name}, ${villa.location} — Antilla Stay`
      : "Villa introuvable — Antilla Stay";
    const description = villa
      ? `${villa.name} à ${villa.location} : ${villa.bedrooms} chambres, jusqu'à ${villa.capacity} personnes, à partir de ${villa.price_per_night} € la nuit.`
      : "Cette villa n'est plus disponible à la réservation.";
    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (!villa) meta.push({ name: "robots", content: "noindex" });
    const cover = villa?.images?.[0];
    if (cover && cover.startsWith("https://")) {
      meta.push({ property: "og:image", content: cover });
      meta.push({ name: "twitter:image", content: cover });
    }
    return { meta };
  },
  component: VillaDetailPage,
});

function VillaDetailPage() {
  const { villaId } = Route.useParams();
  const { data: villa } = useSuspenseQuery(villaQuery(villaId));
  const { data: unavailable = [] } = useQuery(unavailableDatesQuery(villaId));
  const { data: bank } = useQuery(bankSettingsQuery());

  const [activeImage, setActiveImage] = useState(0);
  const [range, setRange] = useState<{ checkIn: string | null; checkOut: string | null }>({
    checkIn: null,
    checkOut: null,
  });
  const [form, setForm] = useState({ name: "", email: "", phone: "", guests: 2 });
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("full_with_deposit");
  const [reference, setReference] = useState<string | null>(null);
  const [voucher, setVoucher] = useState<React.ComponentProps<typeof ReservationVoucher>["reservation"] | null>(null);

  const send = useServerFn(createReservation);
  const mutation = useMutation({
    mutationFn: send,
    onSuccess: (res: { reference: string; reservation?: unknown }) => {
      setReference(res.reference);
      if (res.reservation) {
        setVoucher(res.reservation as React.ComponentProps<typeof ReservationVoucher>["reservation"]);
      }
      toast.success("Demande envoyée !");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const nights = useMemo(() => {
    if (!range.checkIn || !range.checkOut) return 0;
    return nightsBetween(new Date(`${range.checkIn}T12:00:00`), new Date(`${range.checkOut}T12:00:00`));
  }, [range]);

  if (!villa || !villa.is_active) {
    return (
      <SiteLayout>
        <div className="mx-auto flex min-h-[60vh] w-full max-w-6xl flex-col items-center justify-center px-4 text-center">
          <h1 className="font-display text-3xl md:text-4xl">Villa introuvable</h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            Cette villa n'est plus proposée à la location.
          </p>
          <Link
            to="/villas"
            className="gradient-lagoon mt-6 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
          >
            Voir toutes les villas
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const total = computeTotal(Number(villa.price_per_person), form.guests, nights);
  const dueNow = computeDueNow(paymentOption, total, Number(villa.deposit));
  const commitment = computeCommitment(paymentOption, total, Number(villa.deposit));
  const canSubmit =
    nights > 0 &&
    form.name.trim().length >= 2 &&
    /.+@.+\..+/.test(form.email) &&
    form.phone.trim().length >= 6 &&
    form.guests >= 1 &&
    form.guests <= villa.capacity;

  return (
    <SiteLayout>
      <section className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
        <Link
          to="/villas"
          className="text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <i className="fa-solid fa-arrow-left mr-2" aria-hidden="true" />
          Retour aux villas
        </Link>

        <Reveal>
          <p className="mt-6 text-xs uppercase tracking-[0.24em] text-primary">
            <i className="fa-solid fa-location-dot mr-1.5" aria-hidden="true" />
            {villa.location}
          </p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">{villa.name}</h1>
        </Reveal>

        <div className="mt-6 grid gap-3 md:grid-cols-[3fr_1fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted shadow-soft">
            {villa.images[activeImage] ? (
              <img
                src={villa.images[activeImage]}
                alt={`Villa ${villa.name} à ${villa.location}`}
                className="size-full object-cover"
                width={1600}
                height={1200}
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <i className="fa-solid fa-image text-4xl" aria-hidden="true" />
              </div>
            )}
          </div>
          {villa.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3 md:grid-cols-1">
              {villa.images.slice(0, 4).map((img, i) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`Photo ${i + 1}`}
                  className={`aspect-[4/3] overflow-hidden rounded-2xl border-2 transition-all ${
                    i === activeImage ? "border-primary" : "border-transparent opacity-80"
                  }`}
                >
                  <img src={img} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-10">
            <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
              <span>
                <i className="fa-solid fa-users mr-1.5 text-primary" aria-hidden="true" />
                {villa.capacity} personnes
              </span>
              <span>
                <i className="fa-solid fa-bed mr-1.5 text-primary" aria-hidden="true" />
                {villa.bedrooms} chambres
              </span>
              <span>
                <i className="fa-solid fa-shower mr-1.5 text-primary" aria-hidden="true" />
                {villa.bathrooms} salles de bain
              </span>
              <span>
                <i className="fa-solid fa-mattress-pillow mr-1.5 text-primary" aria-hidden="true" />
                {villa.beds} lits
              </span>
              <span>
                <i className="fa-solid fa-water-ladder mr-1.5 text-primary" aria-hidden="true" />
                {villa.has_pool ? "Piscine" : "Sans piscine"}
              </span>
              <span>
                <i className="fa-solid fa-champagne-glasses mr-1.5 text-primary" aria-hidden="true" />
                {villa.parties_allowed ? "Fêtes autorisées" : "Fêtes non autorisées"}
              </span>
            </div>

            <p className="rounded-2xl bg-secondary/50 px-4 py-3 text-sm">
              <i className="fa-regular fa-clock mr-2 text-primary" aria-hidden="true" />
              {SCHEDULE_LABEL}
            </p>

            <div>
              <h2 className="font-display text-2xl">La villa</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
                {villa.description}
              </p>
            </div>

            {villa.amenities.length > 0 && (
              <div>
                <h2 className="font-display text-2xl">Équipements</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {villa.amenities.map((a) => (
                    <li key={a} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                      <i className={`${amenityIcon(a)} text-primary`} aria-hidden="true" />
                      <span className="text-sm capitalize">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h2 className="font-display text-2xl">Disponibilités</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sélectionnez votre date d'arrivée puis votre date de départ.
              </p>
              <div className="mt-4 max-w-md">
                <AvailabilityCalendar
                  unavailable={unavailable}
                  checkIn={range.checkIn}
                  checkOut={range.checkOut}
                  onSelect={setRange}
                />
              </div>
            </div>
          </div>

          <aside className="h-fit lg:sticky lg:top-24">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              {reference ? (
                <div className="space-y-4 text-sm">
                  <div className="text-center">
                    <i className="fa-solid fa-circle-check text-3xl text-palm" aria-hidden="true" />
                    <h2 className="mt-3 font-display text-2xl">Demande enregistrée</h2>
                    <p className="mt-2 text-muted-foreground">
                      Votre référence de dossier :
                    </p>
                    <p className="mt-1 font-display text-2xl tracking-wider text-primary">
                      {reference}
                    </p>
                  </div>
                  {voucher && <ReservationVoucher reservation={voucher} kind="demande" />}
                  {bank && (
                    <div className="rounded-2xl bg-secondary/50 p-4">
                      <p className="font-semibold">Coordonnées pour le virement</p>
                      <p className="mt-2 text-muted-foreground">Bénéficiaire : {bank.account_holder}</p>
                      <p className="text-muted-foreground">Banque : {bank.bank_name}</p>
                      <p className="text-muted-foreground">IBAN : {bank.iban}</p>
                      <p className="text-muted-foreground">BIC : {bank.bic}</p>
                      <p className="mt-2 text-muted-foreground">
                        Indiquez la référence {reference} en motif du virement.
                      </p>
                    </div>
                  )}
                  <Link
                    to="/ma-reservation"
                    className="gradient-lagoon block rounded-full px-6 py-3 text-center text-sm font-semibold text-primary-foreground shadow-soft"
                  >
                    Suivre ma réservation
                  </Link>
                </div>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!canSubmit || !range.checkIn || !range.checkOut) return;
                    mutation.mutate({
                      data: {
                        villaId: villa.id,
                        guestName: form.name,
                        guestEmail: form.email,
                        guestPhone: form.phone,
                        guests: form.guests,
                        checkIn: range.checkIn,
                        checkOut: range.checkOut,
                        paymentOption,
                      },
                    });
                  }}
                >
                  <div>
                    <p className="font-display text-2xl">
                      {formatEUR(villa.price_per_person)}
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        / personne / nuit
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Caution {formatEUR(villa.deposit)} · {SCHEDULE_LABEL}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Votre formule de paiement</p>
                    {PAYMENT_OPTIONS.map((opt) => {
                      const active = opt.key === paymentOption;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setPaymentOption(opt.key)}
                          className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left text-sm transition-all duration-300 ${
                            active
                              ? "border-primary bg-primary/5 shadow-soft"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <i className={`${opt.icon} mt-0.5 text-primary`} aria-hidden="true" />
                          <span>
                            <span className="block font-semibold">{opt.label}</span>
                            <span className="block text-xs text-muted-foreground">
                              {opt.description}
                            </span>
                          </span>
                          {active && (
                            <i
                              className="fa-solid fa-circle-check ml-auto text-primary"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-2xl bg-secondary/50 p-4 text-sm">
                    {nights > 0 ? (
                      <>
                        <p>
                          Du {formatDateFr(range.checkIn!)} au {formatDateFr(range.checkOut!)}
                        </p>
                        <p className="mt-2 flex justify-between text-muted-foreground">
                          <span>
                            {form.guests} personne{form.guests > 1 ? "s" : ""} × {nights} nuit
                            {nights > 1 ? "s" : ""} × {formatEUR(villa.price_per_person)}
                          </span>
                          <span>{formatEUR(total)}</span>
                        </p>
                        <p className="flex justify-between text-muted-foreground">
                          <span>Caution</span>
                          <span>
                            {requiresDeposit(paymentOption)
                              ? formatEUR(villa.deposit)
                              : "sur place"}
                          </span>
                        </p>
                        <p className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
                          <span>À régler maintenant</span>
                          <span className="text-primary">{formatEUR(dueNow)}</span>
                        </p>
                        <p className="mt-1 flex justify-between text-xs text-muted-foreground">
                          <span>Engagement total</span>
                          <span>{formatEUR(commitment)}</span>
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">
                        Choisissez vos dates dans le calendrier pour voir le total.
                      </p>
                    )}
                  </div>


                  <div className="space-y-3">
                    <input
                      required
                      placeholder="Nom et prénom"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm"
                    />
                    <input
                      required
                      type="email"
                      placeholder="Adresse e-mail"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm"
                    />
                    <input
                      required
                      type="tel"
                      placeholder="Téléphone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm"
                    />
                    <label className="flex items-center justify-between gap-3 rounded-full border border-border px-4 py-2 text-sm">
                      <span className="text-muted-foreground">Voyageurs</span>
                      <input
                        type="number"
                        min={1}
                        max={villa.capacity}
                        value={form.guests}
                        onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
                        className="w-16 bg-transparent text-right"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit || mutation.isPending}
                    className="gradient-lagoon w-full rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-opacity disabled:opacity-50"
                  >
                    {mutation.isPending ? "Envoi en cours..." : "Envoyer ma demande"}
                  </button>
                  <p className="text-center text-xs text-muted-foreground">
                    Aucun paiement en ligne : vous réglez par virement bancaire après validation.
                  </p>
                </form>
              )}
            </div>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}
