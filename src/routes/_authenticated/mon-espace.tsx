import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole, listMyReservations } from "@/lib/account.functions";
import { STATUS_LABELS, formatDateFr, formatEUR } from "@/lib/villas";

export const Route = createFileRoute("/_authenticated/mon-espace")({
  head: () => ({
    meta: [
      { title: "Mon espace client — Antilla Stay" },
      {
        name: "description",
        content: "Retrouvez vos réservations, vos justificatifs et vos demandes d'annulation.",
      },
      { property: "og:title", content: "Mon espace client — Antilla Stay" },
      { property: "og:description", content: "Espace personnel Antilla Stay." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientSpacePage,
});

function ClientSpacePage() {
  const navigate = useNavigate();
  const fetchReservations = useServerFn(listMyReservations);
  const fetchRole = useServerFn(getMyRole);

  const { data, isLoading } = useQuery({
    queryKey: ["my-reservations"],
    queryFn: () => fetchReservations({ data: undefined }),
  });
  const { data: role } = useQuery({
    queryKey: ["my-role"],
    queryFn: () => fetchRole({ data: undefined }),
  });

  const reservations = data?.reservations ?? [];

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-5xl px-4 py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Mon espace</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Vos séjours, vos justificatifs et vos demandes d'annulation.
            </p>
          </div>
          <div className="flex gap-2">
            {role?.isAdmin && (
              <Link
                to="/gestion"
                className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary/70"
              >
                Espace gestionnaire
              </Link>
            )}
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/" });
              }}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary/70"
            >
              Se déconnecter
            </button>
          </div>
        </div>

        {isLoading && <p className="mt-10 text-sm text-muted-foreground">Chargement...</p>}

        {!isLoading && reservations.length === 0 && (
          <div className="mt-10 rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
            <p className="text-sm text-muted-foreground">
              Aucune réservation associée à votre adresse e-mail pour le moment.
            </p>
            <Link
              to="/villas"
              className="gradient-lagoon mt-5 inline-block rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"
            >
              Découvrir les villas
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {reservations.map((r) => {
            const villa = r.villas as { name?: string; location?: string } | null;
            const remaining = Number(r.total_amount) - Number(r.amount_paid);
            return (
              <div
                key={r.id}
                className="rounded-3xl border border-border bg-card p-6 shadow-soft"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-xl">{villa?.name ?? "Villa"}</p>
                    <p className="text-sm text-muted-foreground">{villa?.location}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    Séjour : {formatDateFr(r.check_in)} (10h00) → {formatDateFr(r.check_out)} (15h00)
                  </p>
                  <p>
                    {r.guests} personne(s) · {r.nights} nuit(s)
                  </p>
                  <p>Total : {formatEUR(Number(r.total_amount))}</p>
                  <p>
                    Déjà réglé : {formatEUR(Number(r.amount_paid))}
                    {remaining > 0 ? ` · Reste ${formatEUR(remaining)}` : " · Solde payé"}
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-sand-foreground">
                    Réf. {r.reference}
                  </span>
                  <Link
                    to="/ma-reservation"
                    search={{ ref: r.reference } as never}
                    className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary/70"
                  >
                    Justificatif & annulation
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SiteLayout>
  );
}
