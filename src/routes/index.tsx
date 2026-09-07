import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { VillaCard } from "@/components/site/VillaCard";
import { Reveal } from "@/components/site/Reveal";
import { villasQuery, formatEUR } from "@/lib/villas";
import heroAsset from "@/assets/hero.jpg.asset.json";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(villasQuery());
  },
  head: () => ({
    meta: [
      { title: "Antilla Stay — Locations de villas en Guadeloupe" },
      {
        name: "description",
        content:
          "Louez une villa de vacances en Guadeloupe : piscine, vue mer, réservation simple par virement bancaire.",
      },
      { property: "og:title", content: "Antilla Stay — Locations de villas en Guadeloupe" },
      {
        property: "og:description",
        content:
          "Des villas choisies avec soin en Guadeloupe, pour des vacances simples et chaleureuses.",
      },
    ],
  }),
  component: Index,
});

const STEPS = [
  {
    icon: "fa-solid fa-magnifying-glass",
    title: "Choisissez votre villa",
    text: "Parcourez nos villas en Guadeloupe et trouvez celle qui correspond à votre séjour.",
  },
  {
    icon: "fa-regular fa-calendar-check",
    title: "Vérifiez les disponibilités",
    text: "Sélectionnez vos dates en temps réel et consultez le tarif de votre séjour.",
  },
  {
    icon: "fa-solid fa-file-signature",
    title: "Envoyez votre demande",
    text: "Remplissez le formulaire en ligne. Vous recevez un justificatif avec les coordonnées bancaires.",
  },
  {
    icon: "fa-solid fa-money-bill-transfer",
    title: "Réglez par virement",
    text: "Effectuez le virement bancaire. Votre séjour est confirmé dès réception de l'acompte.",
  },
];

const HIGHLIGHTS = [
  { icon: "fa-solid fa-water-ladder", label: "Piscine & jardin tropical" },
  { icon: "fa-solid fa-umbrella-beach", label: "Vue mer ou proche plage" },
  { icon: "fa-solid fa-car", label: "Parking privé inclus" },
  { icon: "fa-solid fa-wifi", label: "Wi-Fi haut débit" },
];

function Index() {
  const { data: villas } = useSuspenseQuery(villasQuery());
  const featured = villas.slice(0, 3);
  const minPrice = villas.length
    ? Math.min(...villas.map((v) => v.price_per_night))
    : 0;

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroAsset.url}
            alt="Villa avec piscine en Guadeloupe"
            className="size-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        </div>

        <div className="relative mx-auto flex min-h-[70vh] w-full max-w-6xl items-center px-4 py-24 md:min-h-[78vh]">
          <div className="max-w-2xl">
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                <i className="fa-solid fa-sun" aria-hidden="true" />
                Locations en Guadeloupe
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-5 font-display text-4xl leading-[1.1] text-foreground md:text-6xl lg:text-7xl">
                Des villas de charme pour des vacances{" "}
                <span className="text-gradient">authentiques</span> en Guadeloupe.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
                Piscine privée, vue mer, jardin tropical… Réservez simplement par virement bancaire
                et recevez votre confirmation en quelques clics.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/villas"
                  className="gradient-lagoon inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  Découvrir les villas
                  <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </Link>
                <Link
                  to="/comment-ca-marche"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-secondary"
                >
                  Comment ça marche ?
                </Link>
              </div>
            </Reveal>

            {minPrice > 0 && (
              <Reveal delay={320}>
                <p className="mt-6 text-sm text-muted-foreground">
                  À partir de{" "}
                  <span className="font-display text-2xl text-foreground">{formatEUR(minPrice)}</span>
                  <span className="text-xs"> / nuit</span>
                </p>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((item) => (
            <Reveal key={item.label} delay={60}>
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <i className={`${item.icon} text-lg`} aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured villas */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Nos coups de cœur
              </p>
              <h2 className="mt-2 font-display text-3xl text-foreground md:text-4xl">
                Villas en vedette
              </h2>
            </div>
            <Link
              to="/villas"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Voir toutes les villas
              <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((villa, index) => (
            <Reveal key={villa.id} delay={index * 80}>
              <VillaCard villa={villa} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-sand/40 py-16 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-4">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Réservation simplifiée
              </p>
              <h2 className="mt-2 font-display text-3xl text-foreground md:text-4xl">
                Comment réserver votre villa
              </h2>
              <p className="mt-3 text-muted-foreground">
                Quatre étapes simples, sans carte bancaire, directement par virement.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 80}>
                <div className="relative rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <span className="absolute -right-2 -top-3 flex size-8 items-center justify-center rounded-full bg-primary font-display text-sm text-primary-foreground shadow-soft">
                    {index + 1}
                  </span>
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary">
                    <i className={step.icon} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-lg text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / Guarantee */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
        <div className="overflow-hidden rounded-[2rem] gradient-lagoon px-6 py-12 text-primary-foreground shadow-lift md:px-12 md:py-16">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <Reveal>
              <div>
                <h2 className="font-display text-3xl md:text-4xl">
                  Prêt à vivre un séjour inoubliable ?
                </h2>
                <p className="mt-4 text-primary-foreground/90">
                  Réservez en toute confiance. Votre dossier est sécurisé, votre virement est protégé
                  et notre équipe locale vous accompagne de l'envoi du justificatif jusqu'à votre
                  arrivée.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    to="/villas"
                    className="inline-flex items-center gap-2 rounded-full bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary shadow-soft transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    Réserver ma villa
                    <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                  </Link>
                  <Link
                    to="/ma-reservation"
                    className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-6 py-3 text-sm font-semibold text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary-foreground/20"
                  >
                    J'ai déjà une réservation
                  </Link>
                </div>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: "fa-solid fa-shield-halved", label: "Paiement sécurisé par virement" },
                  { icon: "fa-solid fa-headset", label: "Assistance locale 7j/7" },
                  { icon: "fa-solid fa-file-invoice", label: "Justificatif de réservation clair" },
                  { icon: "fa-solid fa-hand-holding-heart", label: "Villas vérifiées sur place" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl bg-primary-foreground/10 p-4 backdrop-blur-sm"
                  >
                    <i className={`${item.icon} mb-2 text-2xl`} aria-hidden="true" />
                    <p className="text-sm font-semibold">{item.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
