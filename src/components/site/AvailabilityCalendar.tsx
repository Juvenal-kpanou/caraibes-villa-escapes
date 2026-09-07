import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { toISODate } from "@/lib/villas";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function buildGrid(month: Date) {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7; // lundi = 0
  const days: (Date | null)[] = Array.from({ length: offset }, () => null);
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  for (let i = 1; i <= total; i += 1) {
    days.push(new Date(month.getFullYear(), month.getMonth(), i));
  }
  return days;
}

export type CalendarProps = {
  unavailable: string[];
  /** mode lecture : simple affichage des dates grisées */
  readOnly?: boolean;
  checkIn?: string | null;
  checkOut?: string | null;
  onSelect?: (range: { checkIn: string | null; checkOut: string | null }) => void;
  /** mode admin : bascule une date au clic */
  onToggleDate?: (date: string) => void;
  blockedOnly?: string[];
};

export function AvailabilityCalendar({
  unavailable,
  readOnly = false,
  checkIn = null,
  checkOut = null,
  onSelect,
  onToggleDate,
}: CalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const taken = useMemo(() => new Set(unavailable), [unavailable]);
  const today = toISODate(new Date());
  const grid = buildGrid(month);

  const inRange = (iso: string) =>
    Boolean(checkIn && checkOut && iso > checkIn && iso < checkOut);

  function handleClick(iso: string) {
    if (onToggleDate) {
      onToggleDate(iso);
      return;
    }
    if (readOnly || !onSelect) return;
    if (!checkIn || (checkIn && checkOut)) {
      onSelect({ checkIn: iso, checkOut: null });
      return;
    }
    if (iso <= checkIn) {
      onSelect({ checkIn: iso, checkOut: null });
      return;
    }
    // refuse une plage contenant une date indisponible
    const cursor = new Date(`${checkIn}T12:00:00`);
    const end = new Date(`${iso}T12:00:00`);
    while (cursor < end) {
      if (taken.has(toISODate(cursor))) {
        onSelect({ checkIn: iso, checkOut: null });
        return;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    onSelect({ checkIn, checkOut: iso });
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mois précédent"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="size-9 rounded-full border border-border transition-colors hover:bg-secondary"
        >
          <i className="fa-solid fa-chevron-left" aria-hidden="true" />
        </button>
        <p className="font-display text-base capitalize">
          {new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(month)}
        </p>
        <button
          type="button"
          aria-label="Mois suivant"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="size-9 rounded-full border border-border transition-colors hover:bg-secondary"
        >
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
        {WEEKDAYS.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {grid.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />;
          const iso = toISODate(day);
          const isTaken = taken.has(iso);
          const isPast = iso < today;
          const isStart = iso === checkIn;
          const isEnd = iso === checkOut;
          const disabled = onToggleDate ? isPast : isTaken || isPast;

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => handleClick(iso)}
              className={cn(
                "relative aspect-square rounded-xl text-sm transition-all duration-200",
                disabled &&
                  "cursor-not-allowed bg-muted text-muted-foreground/50 line-through decoration-1",
                !disabled && "hover:scale-105 hover:bg-secondary",
                inRange(iso) && "bg-primary/15 text-foreground",
                (isStart || isEnd) &&
                  "gradient-lagoon scale-105 font-semibold text-primary-foreground shadow-soft",
                onToggleDate && isTaken && "bg-destructive/15 text-destructive line-through",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-muted" /> Indisponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="gradient-lagoon size-3 rounded" /> Vos dates
        </span>
      </div>
    </div>
  );
}
