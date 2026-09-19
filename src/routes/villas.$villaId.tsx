import { useMemo, useState, useRef } from "react";
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
  computePricingBreakdown,
  computeTotal,
  computeVillaNightlyPrice,
  getVillaStandardCapacity,
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
    const nightlyPrice = villa ? computeVillaNightlyPrice(villa) : 0;
    const description = villa
      ? `${villa.name} à ${villa.location} : ${villa.bedrooms} chambres, jusqu'à ${villa.capacity} personnes, à partir de ${formatEUR(nightlyPrice)} la nuit (${villa.price_per_person} € / pers. / nuit).`
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

  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const images = Array.isArray(villa?.images) && villa.images.length > 0 ? villa.images : [];

  function prevSlide(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!images.length) return;
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }

  function nextSlide(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!images.length) return;
    setCurrentSlide((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || !images.length) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
  }

  const [range, setRange] = useState<{ checkIn: string | null; checkOut: string | null }>({
    checkIn: null,
    checkOut: null,
  });
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", guests: 2 });
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

  const breakdown = computePricingBreakdown(
    Number(villa.price_per_person),
    form.guests,
    nights,
    villa.pricing_threshold,
    villa.capacity,
  );
  const total = breakdown.total;
  const dueNow = computeDueNow(paymentOption, total, Number(villa.deposit));
  const commitment = computeCommitment(paymentOption, total, Number(villa.deposit));

  return (
    <SiteLayout>
      <section className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14 overflow-x-hidden min-w-0">
        <Link
          to="/villas"
          className="text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <i className="fa-solid fa-arrow-left mr-2" aria-hidden="true" />
          Retour aux villas
        </Link>

        <Reveal>
          <p className="mt-6 text-xs uppercase tracking-[0.24em] font-semibold text-primary">
            <i className="fa-solid fa-location-dot mr-1.5" aria-hidden="true" />
            {villa.location}, Guadeloupe
          </p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">{villa.name}</h1>
        </Reveal>

        {/* Carrousel Multi-Photos Fiche Client */}
        <div className="mt-6 space-y-3">
          <div
            className="group relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-muted shadow-soft md:aspect-[16/9]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {images.length > 0 ? (
              <div
                className="flex size-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {images.map((img, i) => (
                  <div key={`${img.slice(0, 30)}-${i}`} className="size-full shrink-0">
                    <img
                      src={img}
                      alt={`Villa ${villa.name} à ${villa.location} — photo ${i + 1}`}
                      loading={i === 0 ? "eager" : "lazy"}
                      className="size-full object-cover"
                      width={1600}
                      height={1000}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <i className="fa-solid fa-image text-4xl" aria-hidden="true" />
              </div>
            )}

            {/* Badge Disponibilité & Piscine */}
            <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-600/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-white shadow-soft">
                <i className="fa-solid fa-circle-check mr-1.5" aria-hidden="true" />
                Disponible à la réservation
              </span>
              {villa.has_pool && (
                <span className="rounded-full bg-cyan-600/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-white shadow-soft">
                  <i className="fa-solid fa-water-pool mr-1.5" aria-hidden="true" />
                  Piscine privée
                </span>
              )}
            </div>

            {/* Compteur de position (ex: 1 / 5) */}
            {images.length > 1 && (
              <span className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md shadow-soft">
                {currentSlide + 1} / {images.length}
              </span>
            )}

            {/* Flèches de navigation Précédent / Suivant (toujours claires et cliquables) */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Photo précédente"
                  className="absolute left-3 top-1/2 z-30 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lift transition-all hover:bg-background hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <i className="fa-solid fa-chevron-left text-sm" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Photo suivante"
                  className="absolute right-3 top-1/2 z-30 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lift transition-all hover:bg-background hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <i className="fa-solid fa-chevron-right text-sm" aria-hidden="true" />
                </button>
              </>
            )}

            {/* Puces indicatrices au bas de l'image */}
            {images.length > 1 && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i === currentSlide ? "h-2 w-5 bg-white shadow-soft" : "h-1.5 w-1.5 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bande de vignettes pour sélection directe de photo */}
          {images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
              {images.map((img, i) => (
                <button
                  key={`${img.slice(0, 30)}-thumb-${i}`}
                  type="button"
                  onClick={() => setCurrentSlide(i)}
                  aria-label={`Afficher la photo ${i + 1}`}
                  className={`relative aspect-[4/3] h-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                    i === currentSlide ? "border-primary ring-2 ring-primary/30" : "border-transparent opacity-70 hover:opacity-100"
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

            <div className="min-w-0">
              <h2 className="font-display text-2xl">La villa</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground break-words break-all [overflow-wrap:anywhere] min-w-0">
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
                    if (!range.checkIn || !range.checkOut || nights < 1) {
                      toast.error("Veuillez choisir vos dates d'arrivée et de départ dans le calendrier.");
                      return;
                    }
                    if (!form.name.trim()) {
                      toast.error("Veuillez remplir votre nom et prénom.");
                      return;
                    }
                    if (!form.email.trim() || !/.+@.+\..+/.test(form.email)) {
                      toast.error("Veuillez indiquer une adresse e-mail valide.");
                      return;
                    }
                    if (!form.phone.trim() || form.phone.trim().length < 6) {
                      toast.error("Veuillez indiquer un numéro de téléphone valide.");
                      return;
                    }
                    if (!form.address.trim()) {
                      toast.error("Veuillez indiquer votre adresse du domicile.");
                      return;
                    }

                    mutation.mutate({
                      data: {
                        villaId: villa.id,
                        guestName: form.name.trim(),
                        guestEmail: form.email.trim(),
                        guestPhone: form.phone.trim(),
                        guestAddress: form.address.trim(),
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
                      {formatEUR(computeVillaNightlyPrice(villa))}
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        / nuit
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatEUR(villa.price_per_person)} / pers. / nuit (base {getVillaStandardCapacity(villa)} pers.)
                      {villa.pricing_threshold && villa.pricing_threshold > 0
                        ? ` · majoration +15% au-delà de ${villa.pricing_threshold} pers.`
                        : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
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
                        {breakdown.hasSurcharge ? (
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground border-b border-border/50 pb-2">
                            <div className="flex justify-between">
                              <span>
                                {breakdown.standardGuests} pers. × {nights} nuit{nights > 1 ? "s" : ""} × {formatEUR(breakdown.standardPricePerPerson)}
                              </span>
                              <span>{formatEUR(breakdown.standardTotal)}</span>
                            </div>
                            <div className="flex justify-between text-amber-800 font-medium">
                              <span>
                                + {breakdown.surchargedGuests} pers. × {nights} nuit{nights > 1 ? "s" : ""} × {formatEUR(breakdown.surchargedPricePerPerson)} (+15%)
                              </span>
                              <span>{formatEUR(breakdown.surchargedTotal)}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-foreground pt-1">
                              <span>Sous-total séjour</span>
                              <span>{formatEUR(total)}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-2 flex justify-between text-muted-foreground">
                            <span>
                              {form.guests} personne{form.guests > 1 ? "s" : ""} × {nights} nuit
                              {nights > 1 ? "s" : ""} × {formatEUR(villa.price_per_person)}
                            </span>
                            <span>{formatEUR(total)}</span>
                          </p>
                        )}
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
                    <input
                      required
                      placeholder="Adresse du domicile"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm"
                    />
                    <label className="flex items-center justify-between gap-3 rounded-full border border-border px-4 py-2 text-sm">
                      <span className="text-muted-foreground">Voyageurs</span>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(villa.capacity * 2, (villa.pricing_threshold || 0) + 10, 30)}
                        value={form.guests}
                        onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
                        className="w-16 bg-transparent text-right outline-none font-semibold text-primary"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="gradient-lagoon w-full rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-opacity disabled:opacity-50 hover:brightness-110 cursor-pointer"
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
