import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { VillaCard } from "@/components/site/VillaCard";
import { formatEUR, villasQuery } from "@/lib/villas";

export const Route = createFileRoute("/villas/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(villasQuery()),
  head: () => ({
    meta: [
      { title: "Nos villas en Guadeloupe — Antilla Stay" },
      {
        name: "description",
        content:
          "Parcourez notre catalogue de villas avec piscine en Guadeloupe : Sainte-Anne, Le Gosier, Saint-François, Deshaies et plus.",
      },
      { property: "og:title", content: "Nos villas en Guadeloupe — Antilla Stay" },
      {
        property: "og:description",
        content: "Villas avec piscine en Guadeloupe : capacité, tarifs et disponibilités.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VillasPage,
});

type SortKey = "price-asc" | "price-desc" | "capacity-desc";

function VillasPage() {
  const { data: villas } = useSuspenseQuery(villasQuery());
  const [search, setSearch] = useState("");
  const [minGuests, setMinGuests] = useState(0);
  const [sort, setSort] = useState<SortKey>("price-asc");

  const locations = useMemo(
    () => Array.from(new Set(villas.map((v) => v.location))).sort(),
    [villas],
  );
  const [location, setLocation] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = villas.filter((v) => {
      if (location && v.location !== location) return false;
      if (minGuests && v.capacity < minGuests) return false;
      if (!term) return true;
      return (
        v.name.toLowerCase().includes(term) ||
        v.location.toLowerCase().includes(term) ||
        v.description.toLowerCase().includes(term)
      );
    });
    return [...list].sort((a, b) => {
      if (sort === "price-asc") return a.price_per_night - b.price_per_night;
      if (sort === "price-desc") return b.price_per_night - a.price_per_night;
      return b.capacity - a.capacity;
    });
  }, [villas, search, location, minGuests, sort]);

  const minPrice = villas.length ? Math.min(...villas.map((v) => v.price_per_night)) : 0;

  return (
    <SiteLayout>
      <section className="bg-gradient-to-b from-secondary/40 to-background">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:py-20">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Catalogue</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">Nos villas en Guadeloupe</h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              {villas.length} villas soigneusement sélectionnées, avec piscine et jardin tropical, à
              partir de {formatEUR(minPrice)} la nuit. Paiement par virement bancaire, validation
              manuelle par notre équipe.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <Reveal>
          <div className="grid gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft md:grid-cols-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold">Rechercher</span>
              <div className="relative">
                <i
                  className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, commune…"
                  className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-3 outline-none transition focus:border-primary"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold">Commune</span>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-full border border-border bg-background px-4 py-2 outline-none transition focus:border-primary"
              >
                <option value="">Toutes les communes</option>
                {locations.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold">Voyageurs</span>
              <select
                value={minGuests}
                onChange={(e) => setMinGuests(Number(e.target.value))}
                className="rounded-full border border-border bg-background px-4 py-2 outline-none transition focus:border-primary"
              >
                <option value={0}>Peu importe</option>
                {[2, 4, 6, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} personnes et plus
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold">Trier par</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-full border border-border bg-background px-4 py-2 outline-none transition focus:border-primary"
              >
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="capacity-desc">Capacité</option>
              </select>
            </label>
          </div>
        </Reveal>

        <p className="mt-6 text-sm text-muted-foreground">
          {filtered.length} villa{filtered.length > 1 ? "s" : ""} correspondant à votre recherche
        </p>

        {filtered.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-border p-12 text-center">
            <i className="fa-solid fa-umbrella-beach text-3xl text-primary" aria-hidden="true" />
            <p className="mt-4 text-muted-foreground">
              Aucune villa ne correspond à ces critères. Essayez d'élargir votre recherche.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((villa, i) => (
              <Reveal key={villa.id} delay={i * 80}>
                <VillaCard villa={villa} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
