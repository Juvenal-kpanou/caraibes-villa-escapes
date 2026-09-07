import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { bankSettingsQuery } from "@/lib/villas";

export const Route = createFileRoute("/comment-ca-marche")({
  head: () => ({
    meta: [
      { title: "Comment réserver votre villa — Antilla Stay" },
      {
        name: "description",
        content:
          "Réservation en 5 étapes : choix de la villa, dates, demande, virement bancaire et confirmation par notre équipe.",
      },
      { property: "og:title", content: "Comment réserver votre villa — Antilla Stay" },
      {
        property: "og:description",
        content: "Le déroulé complet d'une réservation payée par virement bancaire.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorksPage,
});

const STEPS = [
  {
    icon: "fa-solid fa-house-chimney-window",
    title: "1. Choisissez votre villa",
    text: "Parcourez le catalogue et comparez capacité, équipements et tarifs. Chaque villa indique le nombre maximum de voyageurs autorisé.",
  },
  {
    icon: "fa-solid fa-calendar-days",
    title: "2. Vérifiez les disponibilités",
    text: "Le calendrier de la villa affiche en temps réel les nuits déjà réservées ou bloquées. Sélectionnez vos dates d'arrivée et de départ.",
  },
  {
    icon: "fa-solid fa-paper-plane",
    title: "3. Envoyez votre demande",
    text: "Renseignez vos coordonnées et le nombre de voyageurs. Votre demande est enregistrée avec une référence unique au format KRK-XXXXXX.",
  },
  {
    icon: "fa-solid fa-building-columns",
    title: "4. Réglez par virement bancaire",
    text: "Vous recevez un justificatif de demande avec le montant total et nos coordonnées bancaires. Indiquez votre référence dans le libellé du virement.",
  },
  {
    icon: "fa-solid fa-circle-check",
    title: "5. Recevez la confirmation",
    text: "Dès réception du virement, notre équipe valide manuellement votre dossier et vous délivre le justificatif de confirmation de séjour.",
  },
];

const FAQ = [
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Uniquement le virement bancaire. Aucune carte bancaire n'est demandée sur le site et aucun paiement n'est traité en ligne.",
  },
  {
    q: "Ma demande vaut-elle réservation ferme ?",
    a: "Non. Les dates sont réservées à titre provisoire tant que le virement n'est pas reçu. La réservation devient ferme après validation manuelle par notre équipe.",
  },
  {
    q: "Puis-je dépasser la capacité indiquée ?",
    a: "Non. Le nombre de voyageurs ne peut pas dépasser la capacité maximale de la villa, contrôlée automatiquement lors de la demande.",
  },
  {
    q: "Comment suivre mon dossier ?",
    a: "Depuis la page Ma réservation, saisissez votre référence KRK-XXXXXX pour consulter le statut, le montant et les coordonnées bancaires.",
  },
  {
    q: "Une caution est-elle demandée ?",
    a: "Oui, une caution est indiquée sur chaque villa. Elle est remise sur place à l'arrivée et restituée en fin de séjour.",
  },
];

function HowItWorksPage() {
  const { data: bank } = useQuery(bankSettingsQuery());

  return (
    <SiteLayout>
      <section className="bg-gradient-to-b from-secondary/40 to-background">
        <div className="mx-auto w-full max-w-4xl px-4 py-14 text-center md:py-20">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Réservation</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">Comment ça marche</h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Une réservation simple et transparente, réglée par virement bancaire et validée
              manuellement par notre équipe en Guadeloupe.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 pb-16">
        <ol className="space-y-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 80}>
              <li className="card-hover flex gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-xl text-primary">
                  <i className={s.icon} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display text-xl">{s.title}</h2>
                  <p className="mt-1.5 text-muted-foreground">{s.text}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 pb-16">
        <Reveal>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
            <h2 className="font-display text-2xl">
              <i className="fa-solid fa-building-columns mr-2 text-primary" aria-hidden="true" />
              Coordonnées bancaires
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Elles vous sont également rappelées sur votre justificatif de demande. Pensez à
              indiquer votre référence de dossier dans le libellé du virement.
            </p>
            {bank ? (
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  ["Titulaire", bank.account_holder],
                  ["Banque", bank.bank_name],
                  ["IBAN", bank.iban],
                  ["BIC", bank.bic],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-secondary/50 p-4">
                    <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-1 font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">
                Les coordonnées bancaires vous seront communiquées avec votre justificatif de
                demande.
              </p>
            )}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 pb-20">
        <Reveal>
          <h2 className="font-display text-2xl">Questions fréquentes</h2>
        </Reveal>
        <div className="mt-5 space-y-3">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={i * 60}>
              <details className="group rounded-2xl border border-border bg-card p-5 shadow-soft">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {item.q}
                  <i
                    className="fa-solid fa-chevron-down text-primary transition-transform duration-300 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 text-muted-foreground">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/villas"
              className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-soft transition-all duration-300 hover:brightness-110"
            >
              Voir les villas
            </Link>
            <Link
              to="/ma-reservation"
              className="rounded-full bg-secondary px-6 py-3 font-semibold text-secondary-foreground transition-all duration-300 hover:brightness-105"
            >
              Suivre mon dossier
            </Link>
          </div>
        </Reveal>
      </section>
    </SiteLayout>
  );
}
