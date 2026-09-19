import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Villa = {
  id: string;
  name: string;
  description: string;
  location: string;
  images: string[];
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  has_pool: boolean;
  parties_allowed: boolean;
  amenities: string[];
  price_per_person: number;
  price_per_night: number;
  cleaning_fee: number;
  deposit: number;
  pricing_threshold?: number | null;
  is_active: boolean;
  created_at: string;
};

export const villasQuery = (opts?: { onlyActive?: boolean }) =>
  queryOptions({
    queryKey: ["villas", opts?.onlyActive ?? true],
    queryFn: async (): Promise<Villa[]> => {
      let q = supabase.from("villas").select("*").order("created_at", { ascending: true });
      if (opts?.onlyActive !== false) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Villa[];
    },
  });

export const villaQuery = (id: string) =>
  queryOptions({
    queryKey: ["villa", id],
    queryFn: async (): Promise<Villa | null> => {
      const { data, error } = await supabase.from("villas").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data ?? null) as Villa | null;
    },
  });

export function eachDateISO(from: string, to: string) {
  const out: string[] = [];
  const cursor = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  while (cursor < end) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export async function fetchUnavailableDatesForVilla(client: any, villaId: string): Promise<string[]> {
  const datesSet = new Set<string>();

  // 1. Fetch manual blocked_dates set by admin
  const { data: blocked } = await client.from("blocked_dates").select("date").eq("villa_id", villaId);
  if (blocked) {
    for (const b of blocked) datesSet.add(String(b.date).slice(0, 10));
  }

  // 2. Remove date_overrides set by admin
  const { data: overrides } = await client.from("date_overrides").select("date").eq("villa_id", villaId);
  if (overrides) {
    for (const o of overrides) datesSet.delete(String(o.date).slice(0, 10));
  }

  return Array.from(datesSet).sort();
}

export const unavailableDatesQuery = (villaId: string) =>
  queryOptions({
    queryKey: ["unavailable", villaId],
    queryFn: async (): Promise<string[]> => {
      return fetchUnavailableDatesForVilla(supabase, villaId);
    },
  });

export const bankSettingsQuery = () =>
  queryOptions({
    queryKey: ["bank-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as {
        id: string;
        iban: string;
        bic: string;
        bank_name: string;
        account_holder: string;
      } | null;
    },
  });

export const AMENITY_ICONS: Record<string, string> = {
  piscine: "fa-solid fa-water-ladder",
  wifi: "fa-solid fa-wifi",
  climatisation: "fa-solid fa-snowflake",
  parking: "fa-solid fa-car",
  "vue mer": "fa-solid fa-umbrella-beach",
  barbecue: "fa-solid fa-fire-burner",
  "cuisine équipée": "fa-solid fa-kitchen-set",
  jardin: "fa-solid fa-seedling",
  jacuzzi: "fa-solid fa-hot-tub-person",
  vélos: "fa-solid fa-bicycle",
};

export function amenityIcon(name: string) {
  return AMENITY_ICONS[name.toLowerCase()] ?? "fa-solid fa-circle-check";
}

export function formatEUR(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateFr(value: string | Date) {
  const d = typeof value === "string" ? new Date(`${value.slice(0, 10)}T12:00:00`) : value;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(d);
}

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function nightsBetween(from: Date, to: Date) {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 86_400_000));
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "En attente de vérification",
  confirmed: "Virement confirmé",
  unfulfilled: "Demande non aboutie",
  expired: "Expirée",
  cancelled: "Annulée",
  refund_pending: "Remboursement en cours",
  refunded: "Remboursement effectué",
  refund_rejected: "Remboursement rejeté",
};

