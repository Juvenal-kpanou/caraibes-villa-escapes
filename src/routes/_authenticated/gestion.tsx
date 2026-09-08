import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
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

export const Route = createFileRoute("/_authenticated/gestion")({
  beforeLoad: async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("role", "admin");
    if (error || !data || data.length === 0) {
      toast.error("Accès non autorisé");
      throw redirect({ to: "/mon-espace" });
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
  price_per_night: 250,
  price_per_person: 35,
  cleaning_fee: 80,
  deposit: 500,
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

  async function setStatus(id: string, status: "pending" | "confirmed" | "cancelled") {
    try {
      await updateStatus({ data: { id, status } });
      toast.success("Réservation mise à jour");
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Chargement...</p>;
  if (!data?.length)
    return <p className="text-muted-foreground">Aucune demande de réservation pour le moment.</p>;

  return (
    <div className="space-y-4">
      {data.map((row: Record<string, any>) => {
        const r = row as any;
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
              {r.guest_name} · {r.guest_email} · {r.guest_phone}
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
            <span className="rounded-full bg-secondary px-3 py-1 text-xs">
              {STATUS_LABELS[r.status] ?? r.status}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus(r.id, "confirmed")}
                className="rounded-full bg-palm/10 px-4 py-2 text-xs font-semibold text-palm"
              >
                Confirmer
              </button>
              <button
                type="button"
                onClick={() => setStatus(r.id, "cancelled")}
                className="rounded-full bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive"
              >
                Annuler
              </button>
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
      is_active: v.is_active,
    });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const payload = {
      name: editing.name.trim(),
      location: editing.location.trim(),
      description: editing.description.trim(),
      images: editing.images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      capacity: Number(editing.capacity),
      bedrooms: Number(editing.bedrooms),
      bathrooms: Number(editing.bathrooms),
      beds: Number(editing.beds),
      has_pool: editing.has_pool,
      parties_allowed: editing.parties_allowed,
      amenities: editing.amenities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      price_per_night: Number(editing.price_per_night),
      price_per_person: Number(editing.price_per_person),
      cleaning_fee: Number(editing.cleaning_fee),
      deposit: Number(editing.deposit),
      is_active: editing.is_active,
    };
    const { error } = editingId
      ? await supabase.from("villas").update(payload).eq("id", editingId)
      : await supabase.from("villas").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Villa enregistrée");
    setEditing(null);
    setEditingId(null);
    queryClient.invalidateQueries({ queryKey: ["villas"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("villas").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Villa supprimée");
    queryClient.invalidateQueries({ queryKey: ["villas"] });
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
          <textarea
            className={`${field} min-h-24`}
            placeholder="Liens des photos, une par ligne (https://...)"
            value={editing.images}
            onChange={(e) => setEditing({ ...editing, images: e.target.value })}
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
                onChange={(e) =>
                  setEditing({ ...editing, price_per_person: Number(e.target.value) })
                }
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Prix par nuit indicatif (€)
              <input
                type="number"
                min={0}
                className={field}
                value={editing.price_per_night}
                onChange={(e) =>
                  setEditing({ ...editing, price_per_night: Number(e.target.value) })
                }
              />
            </label>
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
                {v.location} · {formatEUR(v.price_per_night)} / nuit ·{" "}
                {v.is_active ? "visible" : "masquée"}
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
      const norm = (rows: any[] | null) =>
        (rows ?? []).map((r: any) => ({ id: r.id as string, date: String(r.date).slice(0, 10) }));
      return {
        manual: norm(manual.data as any[]),
        overrides: norm(overrides.data as any[]),
        unavailable: ((unavailable.data as any[]) ?? []).map((d: any) =>
          String(typeof d === "string" ? d : d.get_unavailable_dates ?? d.date).slice(0, 10),
        ),
      };
    },
  });

  const manual = state?.manual ?? [];
  const overrides = state?.overrides ?? [];
  const unavailable = state?.unavailable ?? [];

  async function toggle(date: string) {
    const manualRow = manual.find((b) => b.date === date);
    const overrideRow = overrides.find((b) => b.date === date);
    let error = null;
    if (manualRow) {
      ({ error } = await supabase.from("blocked_dates").delete().eq("id", manualRow.id));
    } else if (unavailable.includes(date)) {
      // date bloquée par une réservation : on la libère via une dérogation
      ({ error } = await supabase.from("date_overrides").insert({ villa_id: selected, date }));
    } else if (overrideRow) {
      ({ error } = await supabase.from("date_overrides").delete().eq("id", overrideRow.id));
    } else {
      ({ error } = await supabase.from("blocked_dates").insert({ villa_id: selected, date }));
    }
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["blocked", selected] });
    queryClient.invalidateQueries({ queryKey: ["unavailable", selected] });
  }

  if (!villas.length)
    return <p className="text-muted-foreground">Ajoutez d'abord une villa.</p>;

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
      toast.success(
        status === "refunded" ? "Remboursement effectué" : "Demande rejetée",
      );
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
      {data.map((row: Record<string, any>) => {
        const r = row as any;
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
