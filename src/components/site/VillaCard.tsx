import { useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { amenityIcon, formatEUR, type Villa } from "@/lib/villas";
import { computeVillaNightlyPrice, getVillaStandardCapacity } from "@/lib/site";

export function parseVillaImages(rawImages: unknown): string[] {
  if (!rawImages) return [];
  if (Array.isArray(rawImages)) {
    return rawImages.filter((img) => typeof img === "string" && img.trim().length > 0);
  }
  if (typeof rawImages === "string") {
    const trimmed = rawImages.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((img) => typeof img === "string" && img.trim().length > 0);
        }
      } catch (e) {
        // Fallback to split
      }
    }
    return trimmed.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
  }
  return [];
}

export function VillaCard({ villa }: { villa: Villa }) {
  const images = parseVillaImages(villa.images);
  const amenities = Array.isArray(villa.amenities) ? villa.amenities : [];
  const nightlyPrice = computeVillaNightlyPrice(villa);
  const stdCapacity = getVillaStandardCapacity(villa);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const touchStartX = useRef<number | null>(null);

  const validImages = images.filter((_, idx) => !failedImages[idx]);

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
        setCurrentSlide((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      } else {
        setCurrentSlide((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      }
    }
    touchStartX.current = null;
  }

  return (
    <article className="card-hover group min-w-0 overflow-hidden rounded-3xl border border-border bg-card p-4 md:p-5 shadow-soft transition-all duration-300 hover:shadow-lift flex flex-col md:flex-row gap-5 md:gap-6 items-stretch">
      {/* Zone Carrousel d'images avec cadre arrondi séparé */}
      <div
        className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl bg-muted md:w-[45%] md:aspect-[16/11] min-h-[220px]"
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
                <div key={`${img.slice(0, 30)}-${i}`} className="size-full shrink-0 relative bg-muted">
                  {!failedImages[i] ? (
                    <img
                      src={img}
                      alt={`Villa ${villa.name} à ${villa.location} — photo ${i + 1}`}
                      loading={i === 0 ? "eager" : "lazy"}
                      onError={() => setFailedImages((prev) => ({ ...prev, [i]: true }))}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center bg-sand/40 p-4 text-center text-muted-foreground">
                      <i className="fa-solid fa-umbrella-beach text-3xl text-primary/60 mb-2" aria-hidden="true" />
                      <span className="text-xs font-semibold">{villa.name}</span>
                      <span className="text-[11px]">Photo non disponible</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex size-full flex-col items-center justify-center bg-sand/40 p-4 text-center text-muted-foreground">
              <i className="fa-solid fa-umbrella-beach text-4xl text-primary/60 mb-2" aria-hidden="true" />
              <span className="text-xs font-semibold text-foreground">{villa.name}</span>
              <span className="text-[11px]">Photos à venir</span>
            </div>
          )}
        </Link>

        {/* Badge Disponibilité & Piscine */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-emerald-600/90 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white shadow-soft">
            <i className="fa-solid fa-circle-check mr-1.5" aria-hidden="true" />
            Disponible
          </span>
          {villa.has_pool && (
            <span className="rounded-full bg-cyan-600/90 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white shadow-soft">
              <i className="fa-solid fa-water-pool mr-1.5" aria-hidden="true" />
              Piscine
            </span>
          )}
        </div>

        {/* Compteur de photos */}
        {images.length > 1 && (
          <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
            {currentSlide + 1} / {images.length}
          </span>
        )}

        {/* Flèches de navigation (Desktop & Mobile) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Photo précédente"
              className="absolute left-2.5 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground opacity-90 shadow-soft transition-all duration-200 hover:bg-background hover:scale-110 active:scale-95 cursor-pointer"
            >
              <i className="fa-solid fa-chevron-left text-xs" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Photo suivante"
              className="absolute right-2.5 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground opacity-90 shadow-soft transition-all duration-200 hover:bg-background hover:scale-110 active:scale-95 cursor-pointer"
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

      {/* Informations complètes de la Villa */}
      <div className="flex w-full flex-col justify-between py-1 break-words">
        <div className="space-y-3">
          {/* Entête : Localisation + Nom */}
          <div>
            <p className="text-xs uppercase tracking-[0.16em] font-semibold text-primary break-words">
              <i className="fa-solid fa-location-dot mr-1.5" aria-hidden="true" />
              {villa.location}, Guadeloupe
            </p>
            <h3 className="mt-1 font-display text-2xl font-bold text-foreground break-words">
              <Link to="/villas/$villaId" params={{ villaId: villa.id }} className="hover:text-primary transition-colors">
                {villa.name}
              </Link>
            </h3>
          </div>

          {/* Informations clés (Badges) */}
          <div className="flex flex-wrap gap-2 text-xs font-medium text-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-secondary-foreground">
              <i className="fa-solid fa-users text-primary" aria-hidden="true" />
              Jusqu'à {villa.capacity} personnes
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-secondary-foreground">
              <i className="fa-solid fa-bed text-primary" aria-hidden="true" />
              {villa.bedrooms} chambre{villa.bedrooms > 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-secondary-foreground">
              <i className="fa-solid fa-layer-group text-primary" aria-hidden="true" />
              {villa.beds} lit{villa.beds > 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-secondary-foreground">
              <i className="fa-solid fa-shower text-primary" aria-hidden="true" />
              {villa.bathrooms} sdb
            </span>
            {villa.parties_allowed && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-purple-800 dark:text-purple-300">
                <i className="fa-solid fa-champagne-glasses text-purple-600" aria-hidden="true" />
                Fêtes autorisées
              </span>
            )}
          </div>

          {/* Description complète directement visible */}
          {villa.description && (
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line break-words break-all [overflow-wrap:anywhere] min-w-0 line-clamp-3 md:line-clamp-none">
              {villa.description}
            </p>
          )}

          {/* Équipements clés */}
          {amenities.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Équipements :</span>
              <div className="flex flex-wrap gap-2 text-primary">
                {amenities.slice(0, 6).map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-foreground">
                    <i className={amenityIcon(a)} aria-hidden="true" />
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Prix & Boutons d'action */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-border/60 pt-4 w-full">
          <div>
            <p className="font-display text-2xl font-bold text-foreground">
              {formatEUR(nightlyPrice)}
              <span className="text-sm font-normal text-muted-foreground"> / nuit</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatEUR(villa.price_per_person)} / pers. ({stdCapacity} pers.)
              {villa.deposit > 0 && ` · Caution : ${formatEUR(villa.deposit)}`}
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <Link
              to="/villas/$villaId"
              params={{ villaId: villa.id }}
              className="rounded-full border border-border bg-secondary/50 px-4 py-2.5 text-xs font-semibold text-secondary-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground text-center shrink-0"
            >
              Fiche complète
            </Link>
            <Link
              to="/villas/$villaId"
              params={{ villaId: villa.id }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-lift transition-all duration-300 hover:brightness-110 ml-auto sm:ml-0 shrink-0"
            >
              <span>Réserver cette villa</span>
              <i className="fa-solid fa-arrow-right text-[10px]" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
