import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { claimAdminRole } from "@/lib/reservations.functions";

export const Route = createFileRoute("/admin-connexion")({
  head: () => ({
    meta: [
      { title: "Espace gestionnaire — Antilla Stay" },
      {
        name: "description",
        content: "Connexion sécurisée à l'espace gestionnaire de Antilla Stay.",
      },
      { property: "og:title", content: "Espace gestionnaire — Antilla Stay" },
      {
        property: "og:description",
        content: "Connexion sécurisée à l'espace gestionnaire de Antilla Stay.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("role", "admin");
      if (!roles || roles.length === 0) {
        toast.error("Accès non autorisé");
        navigate({ to: "/mon-espace" });
        return;
      }
      toast.success("Bienvenue !");
      navigate({ to: "/gestion" });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-16">
        <h1 className="text-center font-display text-3xl md:text-4xl">Espace gestionnaire</h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Connectez-vous pour gérer vos villas, vos disponibilités et vos réservations.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft"
        >
          <input
            required
            type="email"
            autoComplete="email"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm"
          />
          <input
            required
            type="password"
            minLength={6}
            autoComplete="current-password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="gradient-lagoon w-full rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-50"
          >
            {loading ? "Patientez..." : "Se connecter"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Accès réservé au gestionnaire. Les clients passent par leur espace personnel.
          </p>
        </form>
      </div>
    </SiteLayout>
  );
}
