import { Link } from "@tanstack/react-router";
import { amenityIcon, formatEUR, type Villa } from "@/lib/villas";

export function VillaCard({ villa }: { villa: Villa }) {
  const cover = villa.images[0];
  return (
    <article className="card-hover group overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      <Link to="/villas/$villaId" params={{ villaId: villa.id }} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {cover ? (
            <img
              src={cover}
              alt={`Villa ${villa.name} à ${villa.location}`}
              loading="lazy"
              width={1600}
              height={1000}
              className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <i className="fa-solid fa-image text-3xl" aria-hidden="true" />
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-palm shadow-soft">
            <i className="fa-solid fa-circle-check mr-1.5" aria-hidden="true" />
            Disponible
          </span>
        </div>
      </Link>

      <div className="space-y-3 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <i className="fa-solid fa-location-dot mr-1.5 text-primary" aria-hidden="true" />
            {villa.location}
          </p>
          <h3 className="mt-1 font-display text-xl">{villa.name}</h3>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>
            <i className="fa-solid fa-users mr-1.5 text-primary" aria-hidden="true" />
            {villa.capacity} pers.
          </span>
          <span>
            <i className="fa-solid fa-bed mr-1.5 text-primary" aria-hidden="true" />
            {villa.bedrooms} ch.
          </span>
          <span>
            <i className="fa-solid fa-shower mr-1.5 text-primary" aria-hidden="true" />
            {villa.bathrooms} sdb
          </span>
        </div>

        <div className="flex gap-2 text-primary">
          {villa.amenities.slice(0, 5).map((a) => (
            <i key={a} className={amenityIcon(a)} title={a} aria-hidden="true" />
          ))}
        </div>

        <div className="flex items-end justify-between pt-1">
          <p className="font-display text-2xl">
            {formatEUR(villa.price_per_night)}
            <span className="text-sm font-normal text-muted-foreground"> / nuit</span>
          </p>
          <Link
            to="/villas/$villaId"
            params={{ villaId: villa.id }}
            className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
          >
            Découvrir
          </Link>
        </div>
      </div>
    </article>
  );
}
