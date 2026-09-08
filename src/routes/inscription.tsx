import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/inscription")({
  head: () => ({
    meta: [
      { title: "Créer mon compte client — Antilla Stay" },
      {
        name: "description",
        content:
          "Créez votre compte client Antilla Stay pour suivre vos réservations, télécharger vos justificatifs et demander une annulation.",
      },
      { property: "og:title", content: "Créer mon compte client — Antilla Stay" },
      {
        property: "og:description",
        content: "Suivez vos réservations de villas en Guadeloupe depuis votre espace personnel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/mon-espace`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      toast.success(mode === "signup" ? "Compte créé, bienvenue !" : "Bon retour parmi nous !");
      navigate({ to: "/mon-espace" });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-16">
        <h1 className="text-center font-display text-3xl md:text-4xl">
          {mode === "signup" ? "Créer mon compte" : "Me connecter"}
        </h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Suivez vos réservations, téléchargez vos justificatifs et demandez une annulation en
          quelques clics.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft"
        >
          {mode === "signup" && (
            <input
              required
              type="text"
              autoComplete="name"
              placeholder="Nom et prénom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm"
            />
          )}
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
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="Mot de passe (6 caractères minimum)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="gradient-lagoon w-full rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-50"
          >
            {loading ? "Patientez..." : mode === "signup" ? "Créer mon compte" : "Se connecter"}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {mode === "signup"
              ? "J'ai déjà un compte, me connecter"
              : "Je n'ai pas encore de compte, m'inscrire"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Vous avez une référence de dossier ?{" "}
          <Link to="/ma-reservation" className="underline underline-offset-4">
            Suivre ma réservation
          </Link>
        </p>
      </div>
    </SiteLayout>
  );
}
