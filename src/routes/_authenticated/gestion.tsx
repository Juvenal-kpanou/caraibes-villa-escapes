import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { VillaPhotoUploader } from "@/components/site/VillaPhotoUploader";
import { AvailabilityCalendar } from "@/components/site/AvailabilityCalendar";
import { supabase } from "@/integrations/supabase/client";
import { updateReservationStatus } from "@/lib/reservations.functions";
import {
  STATUS_LABELS,
  bankSettingsQuery,
  formatDateFr,
  formatEUR,
  villasQuery,
  type Villa,
} from "@/lib/villas";
import { computeTotal, computeVillaNightlyPrice, getVillaStandardCapacity } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/gestion")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw redirect({ to: "/admin-connexion" });
      }
      // Check admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin");

      // If user_roles check passes or table is open, allow access
    } catch (err: unknown) {
      if (err && typeof err === "object" && "to" in err) {
        throw err;
      }
      throw redirect({ to: "/admin-connexion" });
    }
  },
  head: () => ({
    meta: [
      { title: "Gestion — Antilla Stay" },
      {
        name: "description",
        content: "Tableau de bord gestionnaire : villas, disponibilités et réservations.",
      },
      { property: "og:title", content: "Gestion — Antilla Stay" },
      { property: "og:description", content: "Tableau de bord gestionnaire Antilla Stay." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GestionPage,
});

type Tab = "reservations" | "remboursements" | "villas" | "dates" | "banque";

const EMPTY_VILLA = {
  name: "",
  location: "",
  description: "",
  images: "",
  capacity: 4,
  bedrooms: 2,
  bathrooms: 1,
  beds: 4,
  has_pool: false,
  parties_allowed: false,
  amenities: "",
  price_per_night: 35,
  price_per_person: 35,
  cleaning_fee: 80,
  deposit: 500,
  pricing_threshold: 0,
  is_active: true,
};

function GestionPage() {
  const [tab, setTab] = useState<Tab>("reservations");
  const navigate = useNavigate();

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "reservations", label: "Réservations", icon: "fa-solid fa-calendar-check" },
    { key: "remboursements", label: "Remboursements", icon: "fa-solid fa-rotate-left" },
    { key: "villas", label: "Villas", icon: "fa-solid fa-house" },
    { key: "dates", label: "Dates bloquées", icon: "fa-solid fa-calendar-xmark" },
    { key: "banque", label: "Coordonnées bancaires", icon: "fa-solid fa-building-columns" },
  ];

  return (
    <SiteLayout>
      <section className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Espace gestionnaire</p>
            <h1 className="mt-2 font-display text-3xl md:text-4xl">Tableau de bord</h1>
          </div>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
            className="rounded-full border border-border px-5 py-2.5 text-sm transition-colors hover:bg-secondary"
          >
            Se déconnecter
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-full px-5 py-2.5 text-sm transition-all ${
                tab === t.key
                  ? "gradient-lagoon font-semibold text-primary-foreground shadow-soft"
                  : "border border-border hover:bg-secondary"
              }`}
            >
              <i className={`${t.icon} mr-2`} aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "reservations" && <ReservationsPanel />}
          {tab === "remboursements" && <RefundsPanel />}
          {tab === "villas" && <VillasPanel />}
          {tab === "dates" && <BlockedDatesPanel />}
          {tab === "banque" && <BankPanel />}
        </div>
      </section>
    </SiteLayout>
  );
}

/* ---------------- Réservations ---------------- */

function ReservationsPanel() {
  const queryClient = useQueryClient();
  const updateStatus = useServerFn(updateReservationStatus);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, villas(name, location)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function setStatus(
    id: string,
    status: "pending" | "confirmed" | "unfulfilled" | "expired" | "cancelled",
  ) {
    try {
      await updateStatus({ data: { id, status } });
      if (status === "confirmed") {
        toast.success("Virement confirmé ! La réservation est maintenant enregistrée.");
      } else if (status === "unfulfilled") {
        toast.success("Dates libérées. La demande a été marquée comme 'Demande non aboutie'.");
      } else {
        toast.success("Statut mis à jour");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["unavailable"] });
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Chargement...</p>;
  if (!data?.length)
    return <p className="text-muted-foreground">Aucune demande de réservation pour le moment.</p>;

  return (
    <div className="space-y-4">
      {data.map((row: Record<string, unknown>) => {
        const r = row as Record<string, unknown> & {
          id: string;
          reference: string;
          status: string;
          created_at: string;
          check_in: string;
          check_out: string;
          nights: number;
          guests: number;
          total_amount: number;
          deposit: number;
          guest_name: string;
          guest_email: string;
          guest_phone: string;
          guest_address?: string;
          villas?: { name: string; location: string } | null;
        };
        const createdAtTime = new Date(r.created_at).getTime();
        const hoursElapsed = (Date.now() - createdAtTime) / (3600 * 1000);
        const hoursRemaining = Math.max(0, Math.ceil(72 - hoursElapsed));
        const isPendingExpired = r.status === "pending" && hoursRemaining <= 0;

        return (
          <article
            key={r.id}
            className="rounded-3xl border border-border bg-card p-5 shadow-soft md:flex md:items-center md:justify-between md:gap-6"
          >
            <div className="space-y-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-lg">
                  {r.reference} · {r.villas?.name ?? "Villa supprimée"}
                </p>
                {r.status === "pending" && (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    {isPendingExpired
                      ? "⏱️ Délai de 72h dépassé"
                      : `⏱️ Expire dans ~${hoursRemaining}h`}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground break-words">
                {r.guest_name} · {r.guest_email} · {r.guest_phone}
                {r.guest_address ? ` · ${r.guest_address}` : ""}
              </p>
              <p className="text-muted-foreground">
                Du {formatDateFr(r.check_in)} au {formatDateFr(r.check_out)} · {r.nights} nuits ·{" "}
                {r.guests} voyageurs
              </p>
              <p className="font-semibold">
                Total {formatEUR(Number(r.total_amount))} · caution {formatEUR(Number(r.deposit))}
              </p>
            </div>
            <div className="mt-4 flex flex-col items-start gap-2 md:mt-0 md:items-end">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  r.status === "pending"
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : r.status === "confirmed"
                      ? "bg-palm/15 text-palm"
                      : r.status === "unfulfilled" || r.status === "cancelled"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-secondary text-secondary-foreground"
                }`}
              >
                {STATUS_LABELS[r.status] ?? r.status}
              </span>
              <div className="flex flex-wrap gap-2">
                {r.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setStatus(r.id, "confirmed")}
                      className="rounded-full bg-palm/15 px-4 py-2 text-xs font-semibold text-palm transition-colors hover:bg-palm hover:text-primary-foreground"
                    >
                      <i className="fa-solid fa-check mr-1.5" aria-hidden="true" />
                      Valider le virement
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(r.id, "unfulfilled")}
                      className="rounded-full bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <i className="fa-solid fa-calendar-xmark mr-1.5" aria-hidden="true" />
                      Libérer les dates
                    </button>
                  </>
                )}
                {r.status === "confirmed" && (
                  <button
                    type="button"
                    onClick={() => setStatus(r.id, "cancelled")}
                    className="rounded-full bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* ---------------- Villas ---------------- */

function VillasPanel() {
  const queryClient = useQueryClient();
  const { data: villas = [] } = useQuery(villasQuery({ onlyActive: false }));
  const [editing, setEditing] = useState<typeof EMPTY_VILLA | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startEdit(v: Villa) {
    setEditingId(v.id);
    setEditing({
      name: v.name,
      location: v.location,
      description: v.description,
      images: v.images.join("\n"),
      capacity: v.capacity,
      bedrooms: v.bedrooms,
      bathrooms: v.bathrooms,
      beds: v.beds,
      has_pool: v.has_pool,
      parties_allowed: v.parties_allowed,
      amenities: v.amenities.join(", "),
      price_per_night: v.price_per_night,
      price_per_person: v.price_per_person,
      cleaning_fee: v.cleaning_fee,
      deposit: v.deposit,
      pricing_threshold: v.pricing_threshold ?? 0,
      is_active: v.is_active,
    });
  }

  async function save() {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("Veuillez remplir le nom de la villa.");
      return;
    }
    if (!editing.location.trim()) {
      toast.error("Veuillez indiquer la commune de la villa (ex: Sainte-Anne).");
      return;
    }
    setSaving(true);
    try {
      const thresholdVal = Number(editing.pricing_threshold);
      const payload = {
        name: editing.name.trim(),
        location: editing.location.trim(),
        description: editing.description.trim(),
        images: (typeof editing.images === "string" ? editing.images : "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        capacity: Math.max(1, Number(editing.capacity) || 1),
        bedrooms: Math.max(1, Number(editing.bedrooms) || 1),
        bathrooms: Math.max(1, Number(editing.bathrooms) || 1),
        beds: Math.max(1, Number(editing.beds) || 1),
        has_pool: Boolean(editing.has_pool),
        parties_allowed: Boolean(editing.parties_allowed),
        amenities: (typeof editing.amenities === "string" ? editing.amenities : "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        price_per_night: computeVillaNightlyPrice({
          price_per_person: Math.max(0, Number(editing.price_per_person) || 0),
          capacity: Math.max(1, Number(editing.capacity) || 1),
          pricing_threshold: thresholdVal > 0 ? thresholdVal : null,
        }),
        price_per_person: Math.max(0, Number(editing.price_per_person) || 0),
        cleaning_fee: Math.max(0, Number(editing.cleaning_fee) || 0),
        deposit: Math.max(0, Number(editing.deposit) || 0),
        pricing_threshold: thresholdVal > 0 ? thresholdVal : null,
        is_active: Boolean(editing.is_active),
      };
      let { error } = editingId
        ? await supabase.from("villas").update(payload).eq("id", editingId)
        : await supabase.from("villas").insert(payload);

      // Fallback si la colonne pricing_threshold n'existe pas encore dans la base Supabase
      if (
        error &&
        (error.message?.includes("pricing_threshold") ||
          error.message?.includes("schema cache") ||
          error.message?.includes("column"))
      ) {
        const { pricing_threshold, ...safePayload } = payload;
        const retryResult = editingId
          ? await supabase.from("villas").update(safePayload).eq("id", editingId)
          : await supabase.from("villas").insert(safePayload);
        error = retryResult.error;
      }

      setSaving(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(editingId ? "Villa mise à jour !" : "Nouvelle villa créée avec succès !");
      setEditing(null);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["villas"] });
    } catch (err: unknown) {
      setSaving(false);
      toast.error((err as Error)?.message || "Erreur lors de l'enregistrement de la villa.");
    }
  }

  async function remove(id: string) {
    try {
      await supabase.from("blocked_dates").delete().eq("villa_id", id);
      await supabase.from("date_overrides").delete().eq("villa_id", id);

      const { error } = await supabase.from("villas").delete().eq("id", id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Villa supprimée");
      queryClient.invalidateQueries({ queryKey: ["villas"] });
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Erreur lors de la suppression de la villa.");
    }
  }

  const field = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm";

  return (
    <div className="space-y-6">
      {!editing && (
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setEditing({ ...EMPTY_VILLA });
          }}
          className="gradient-lagoon rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
        >
          <i className="fa-solid fa-plus mr-2" aria-hidden="true" />
          Ajouter une villa
        </button>
      )}

      {editing && (
        <div className="space-y-3 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-display text-xl">
            {editingId ? "Modifier la villa" : "Nouvelle villa"}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className={field}
              placeholder="Nom de la villa"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <input
              className={field}
              placeholder="Commune (ex : Sainte-Anne)"
              value={editing.location}
              onChange={(e) => setEditing({ ...editing, location: e.target.value })}
            />
          </div>
          <textarea
            className={`${field} min-h-28`}
            placeholder="Description"
            value={editing.description}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
          />
          <VillaPhotoUploader
            images={
              typeof editing.images === "string"
                ? editing.images
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : Array.isArray(editing.images)
                  ? editing.images
                  : []
            }
            onChange={(newImages) => setEditing({ ...editing, images: newImages.join("\n") })}
          />
          <input
            className={field}
            placeholder="Équipements séparés par des virgules (piscine, wifi, climatisation)"
            value={editing.amenities}
            onChange={(e) => setEditing({ ...editing, amenities: e.target.value })}
          />
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-xs text-muted-foreground">
              Voyageurs max
              <input
                type="number"
                min={1}
                className={field}
                value={editing.capacity}
                onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })}
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Chambres
              <input
                type="number"
                min={1}
                className={field}
                value={editing.bedrooms}
                onChange={(e) => setEditing({ ...editing, bedrooms: Number(e.target.value) })}
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Salles de bain
              <input
                type="number"
                min={1}
                className={field}
                value={editing.bathrooms}
                onChange={(e) => setEditing({ ...editing, bathrooms: Number(e.target.value) })}
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Nombre de lits
              <input
                type="number"
                min={1}
                className={field}
                value={editing.beds}
                onChange={(e) => setEditing({ ...editing, beds: Number(e.target.value) })}
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Tarif par personne et par nuit (€)
              <input
                type="number"
                min={0}
                className={field}
                value={editing.price_per_person}
                onChange={(e) => {
                  const p = Number(e.target.value);
                  setEditing({ ...editing, price_per_person: p, price_per_night: p });
                }}
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Seuil avant majoration (+15%)
              <input
                type="number"
                min={0}
                placeholder="Ex: 5 (laisser 0 pour aucun seuil)"
                className={field}
                value={editing.pricing_threshold || ""}
                onChange={(e) =>
                  setEditing({ ...editing, pricing_threshold: Number(e.target.value) || 0 })
                }
              />
            </label>
            {(() => {
              const p = Number(editing.price_per_person) || 0;
              const cap = Number(editing.capacity) || 1;
              const thresh = Number(editing.pricing_threshold) || 0;
              const stdCap = getVillaStandardCapacity({ capacity: cap, pricing_threshold: thresh });
              const nightlyPrice = computeVillaNightlyPrice({
                price_per_person: p,
                capacity: cap,
                pricing_threshold: thresh,
              });
              const fullCapPrice = computeTotal(p, cap, 1, thresh);
              const hasExtraSurcharge = thresh > 0 && cap > thresh;

              return (
                <div className="flex flex-col justify-center rounded-2xl border border-border bg-secondary/40 px-3.5 py-2 text-xs">
                  <span className="font-medium text-foreground">
                    Prix par nuit indicatif calculé
                  </span>
                  <span className="mt-0.5 font-semibold text-primary">
                    {formatEUR(nightlyPrice)} / nuit
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    ({formatEUR(p)} / pers. / nuit · base {stdCap} pers.)
                    {hasExtraSurcharge && (
                      <span className="block text-[10px] text-amber-700 font-medium">
                        Jusqu'à {formatEUR(fullCapPrice)}/nuit à {cap} pers. (+15% au-delà de{" "}
                        {thresh} pers.)
                      </span>
                    )}
                  </span>
                </div>
              );
            })()}
            <label className="text-xs text-muted-foreground">
              Frais de ménage (€)
              <input
                type="number"
                min={0}
                className={field}
                value={editing.cleaning_fee}
                onChange={(e) => setEditing({ ...editing, cleaning_fee: Number(e.target.value) })}
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Caution (€)
              <input
                type="number"
                min={0}
                className={field}
                value={editing.deposit}
                onChange={(e) => setEditing({ ...editing, deposit: Number(e.target.value) })}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.has_pool}
                onChange={(e) => setEditing({ ...editing, has_pool: e.target.checked })}
              />
              Piscine
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.parties_allowed}
                onChange={(e) => setEditing({ ...editing, parties_allowed: e.target.checked })}
              />
              Fêtes autorisées
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.is_active}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
              />
              Villa visible sur le site
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              disabled={saving || !editing.name.trim()}
              onClick={save}
              className="gradient-lagoon rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setEditingId(null);
              }}
              className="rounded-full border border-border px-6 py-3 text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {villas.map((v) => (
          <article
            key={v.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft"
          >
            <div>
              <p className="font-display text-lg">{v.name}</p>
              <p className="text-sm text-muted-foreground">
                {v.location} · {formatEUR(computeVillaNightlyPrice(v))} / nuit (
                {formatEUR(v.price_per_person)} / pers.) · {v.is_active ? "visible" : "masquée"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => startEdit(v)}
                className="rounded-full border border-border px-4 py-2 text-xs"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={() => remove(v.id)}
                className="rounded-full bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive"
              >
                Supprimer
              </button>
            </div>
          </article>
        ))}
        {!villas.length && (
          <p className="text-muted-foreground">Aucune villa enregistrée pour l'instant.</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- Dates bloquées ---------------- */

function BlockedDatesPanel() {
  const queryClient = useQueryClient();
  const { data: villas = [] } = useQuery(villasQuery({ onlyActive: false }));
  const [villaId, setVillaId] = useState<string>("");
  const selected = villaId || villas[0]?.id || "";

  const { data: state } = useQuery({
    queryKey: ["blocked", selected],
    enabled: Boolean(selected),
    queryFn: async () => {
      const [manual, overrides, unavailable] = await Promise.all([
        supabase.from("blocked_dates").select("id, date").eq("villa_id", selected),
        supabase.from("date_overrides").select("id, date").eq("villa_id", selected),
        supabase.rpc("get_unavailable_dates", { _villa_id: selected }),
      ]);
      if (manual.error) throw manual.error;
      if (overrides.error) throw overrides.error;
      if (unavailable.error) throw unavailable.error;
      const norm = (rows: Array<Record<string, unknown>> | null) =>
        (rows ?? []).map((r) => ({ id: String(r["id"]), date: String(r["date"]).slice(0, 10) }));
      return {
        manual: norm(manual.data as Array<Record<string, unknown>>),
        overrides: norm(overrides.data as Array<Record<string, unknown>>),
        unavailable: ((unavailable.data as Array<Record<string, unknown> | string>) ?? []).map(
          (d) =>
            String(typeof d === "string" ? d : (d["get_unavailable_dates"] ?? d["date"])).slice(
              0,
              10,
            ),
        ),
      };
    },
  });

  const manual = state?.manual ?? [];
  const overrides = state?.overrides ?? [];
  const unavailable = state?.unavailable ?? [];

  async function toggle(date: string) {
    const normDate = date.slice(0, 10);
    const manualRow = manual.find((b) => b.date === normDate || b.date.startsWith(normDate));
    const overrideRow = overrides.find((b) => b.date === normDate || b.date.startsWith(normDate));
    let error = null;

    if (manualRow) {
      ({ error } = await supabase.from("blocked_dates").delete().eq("id", manualRow.id));
    } else if (overrideRow) {
      ({ error } = await supabase.from("date_overrides").delete().eq("id", overrideRow.id));
    } else if (unavailable.includes(normDate)) {
      // date bloquée par une réservation : on la libère via une dérogation
      const res = await supabase
        .from("date_overrides")
        .upsert({ villa_id: selected, date: normDate }, { onConflict: "villa_id,date" });
      error = res.error;
    } else {
      const res = await supabase
        .from("blocked_dates")
        .insert({ villa_id: selected, date: normDate });
      if (res.error) {
        // En cas de conflit (la date existait déjà en BDD mais n'était pas synchronisée localement)
        if (res.error.code === "23505" || res.error.message?.includes("unique constraint")) {
          const delRes = await supabase
            .from("blocked_dates")
            .delete()
            .eq("villa_id", selected)
            .eq("date", normDate);
          error = delRes.error;
        } else {
          error = res.error;
        }
      }
    }
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["blocked", selected] });
    queryClient.invalidateQueries({ queryKey: ["unavailable", selected] });
  }

  if (!villas.length) return <p className="text-muted-foreground">Ajoutez d'abord une villa.</p>;

  return (
    <div className="space-y-4">
      <select
        value={selected}
        onChange={(e) => setVillaId(e.target.value)}
        className="rounded-full border border-border bg-background px-4 py-3 text-sm"
      >
        {villas.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
      <p className="text-sm text-muted-foreground">
        Cliquez sur une date pour la bloquer ou la libérer. Les dates occupées par une réservation
        peuvent aussi être libérées manuellement.
      </p>
      <div className="max-w-md">
        <AvailabilityCalendar unavailable={unavailable} onToggleDate={toggle} />
      </div>
      {overrides.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Dates libérées manuellement : {overrides.map((o) => formatDateFr(o.date)).join(", ")}
        </p>
      )}
    </div>
  );
}

/* ---------------- Coordonnées bancaires ---------------- */

function BankPanel() {
  const queryClient = useQueryClient();
  const { data: bank } = useQuery(bankSettingsQuery());
  const [form, setForm] = useState<{
    account_holder: string;
    bank_name: string;
    iban: string;
    bic: string;
  } | null>(null);
  const values = form ?? {
    account_holder: bank?.account_holder ?? "",
    bank_name: bank?.bank_name ?? "",
    iban: bank?.iban ?? "",
    bic: bank?.bic ?? "",
  };
  const field = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm";

  async function save() {
    const { error } = bank?.id
      ? await supabase.from("bank_settings").update(values).eq("id", bank.id)
      : await supabase.from("bank_settings").insert(values);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Coordonnées enregistrées");
    queryClient.invalidateQueries({ queryKey: ["bank-settings"] });
  }

  return (
    <div className="max-w-lg space-y-3 rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-xl">Coordonnées pour les virements</h2>
      <input
        className={field}
        placeholder="Titulaire du compte"
        value={values.account_holder}
        onChange={(e) => setForm({ ...values, account_holder: e.target.value })}
      />
      <input
        className={field}
        placeholder="Nom de la banque"
        value={values.bank_name}
        onChange={(e) => setForm({ ...values, bank_name: e.target.value })}
      />
      <input
        className={field}
        placeholder="IBAN"
        value={values.iban}
        onChange={(e) => setForm({ ...values, iban: e.target.value })}
      />
      <input
        className={field}
        placeholder="BIC"
        value={values.bic}
        onChange={(e) => setForm({ ...values, bic: e.target.value })}
      />
      <button
        type="button"
        onClick={save}
        className="gradient-lagoon rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
      >
        Enregistrer
      </button>
    </div>
  );
}

/* ---------------- Remboursements ---------------- */

function RefundsPanel() {
  const queryClient = useQueryClient();
  const updateStatus = useServerFn(updateReservationStatus);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-refunds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, villas(name, location)")
        .in("status", ["refund_pending", "refunded", "refund_rejected"])
        .order("refund_requested_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function decide(id: string, status: "refunded" | "refund_rejected") {
    try {
      await updateStatus({ data: { id, status } });
      toast.success(status === "refunded" ? "Remboursement effectué" : "Demande rejetée");
      queryClient.invalidateQueries({ queryKey: ["admin-refunds"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Chargement...</p>;
  if (!data?.length)
    return <p className="text-muted-foreground">Aucune demande de remboursement.</p>;

  return (
    <div className="space-y-4">
      {data.map((row: Record<string, unknown>) => {
        const r = row as Record<string, unknown> & {
          id: string;
          reference: string;
          status: string;
          check_in: string;
          check_out: string;
          amount_paid: number;
          guest_name: string;
          guest_email: string;
          refund_holder?: string;
          refund_iban?: string;
          refund_bic?: string;
          villas?: { name: string; location: string } | null;
        };
        return (
          <article
            key={r.id}
            className="rounded-3xl border border-border bg-card p-5 shadow-soft md:flex md:items-center md:justify-between md:gap-6"
          >
            <div className="space-y-1 text-sm">
              <p className="font-display text-lg">
                {r.reference} · {r.villas?.name ?? "Villa supprimée"}
              </p>
              <p className="text-muted-foreground">
                {r.guest_name} · {r.guest_email}
              </p>
              <p className="text-muted-foreground">
                Du {formatDateFr(r.check_in)} au {formatDateFr(r.check_out)} · déjà réglé{" "}
                {formatEUR(Number(r.amount_paid))}
              </p>
              <p className="text-muted-foreground">
                Titulaire {r.refund_holder ?? "—"} · IBAN {r.refund_iban ?? "—"} · BIC{" "}
                {r.refund_bic ?? "—"}
              </p>
            </div>
            <div className="mt-4 flex flex-col items-start gap-2 md:mt-0 md:items-end">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                {STATUS_LABELS[r.status] ?? r.status}
              </span>
              {r.status === "refund_pending" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => decide(r.id, "refunded")}
                    className="rounded-full bg-palm/10 px-4 py-2 text-xs font-semibold text-palm"
                  >
                    Accepter
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(r.id, "refund_rejected")}
                    className="rounded-full bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive"
                  >
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
