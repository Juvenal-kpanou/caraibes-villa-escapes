import { useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { amenityIcon, formatEUR, type Villa } from "@/lib/villas";
import { computeVillaNightlyPrice, getVillaStandardCapacity } from "@/lib/site";

export function VillaCard({ villa }: { villa: Villa }) {
  const images = Array.isArray(villa.images) && villa.images.length > 0 ? villa.images : [];
  const amenities = Array.isArray(villa.amenities) ? villa.amenities : [];
  const nightlyPrice = computeVillaNightlyPrice(villa);
  const stdCapacity = getVillaStandardCapacity(villa);

  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);

  function prevSlide(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!images.length) return;
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }

  function nextSlide(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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
        // Swipe gauche -> image suivante
        setCurrentSlide((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      } else {
        // Swipe droite -> image précédente
        setCurrentSlide((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      }
    }
    touchStartX.current = null;
  }

  return (
    <article className="card-hover group min-w-0 overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      {/* Zone Carrousel d'images */}
      <div
        className="relative aspect-[4/3] w-full overflow-hidden bg-muted"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Link to="/villas/$villaId" params={{ villaId: villa.id }} className="block size-full">
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
                    width={1600}
                    height={1000}
                    className="size-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <i className="fa-solid fa-image text-3xl" aria-hidden="true" />
            </div>
          )}
        </Link>

        {/* Badge Disponibilité */}
        <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-palm shadow-soft">
          <i className="fa-solid fa-circle-check mr-1.5" aria-hidden="true" />
          Disponible
        </span>

        {/* Flèches de navigation (Desktop) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Photo précédente"
              className="absolute left-2.5 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 shadow-soft transition-all duration-200 group-hover:opacity-100 hover:bg-background hover:scale-110"
            >
              <i className="fa-solid fa-chevron-left text-xs" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Photo suivante"
              className="absolute right-2.5 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 shadow-soft transition-all duration-200 group-hover:opacity-100 hover:bg-background hover:scale-110"
            >
              <i className="fa-solid fa-chevron-right text-xs" aria-hidden="true" />
            </button>
          </>
        )}

        {/* Indicateurs de position (Dots) */}
        {images.length > 1 && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === currentSlide ? "h-2 w-4 bg-white shadow-soft" : "h-1.5 w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Informations de la Villa */}
      <div className="space-y-3 p-5 break-words">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground break-words">
            <i className="fa-solid fa-location-dot mr-1.5 text-primary" aria-hidden="true" />
            {villa.location}
          </p>
          <h3 className="mt-1 font-display text-xl break-words">{villa.name}</h3>
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

        <div className="flex flex-wrap gap-2 text-primary">
          {amenities.slice(0, 5).map((a) => (
            <i key={a} className={amenityIcon(a)} title={a} aria-hidden="true" />
          ))}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-2 pt-1">
          <div>
            <p className="font-display text-2xl">
              {formatEUR(nightlyPrice)}
              <span className="text-sm font-normal text-muted-foreground"> / nuit</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              {formatEUR(villa.price_per_person)} / pers. ({stdCapacity} pers.)
            </p>
          </div>
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
