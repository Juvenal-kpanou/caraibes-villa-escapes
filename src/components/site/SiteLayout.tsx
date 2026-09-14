import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  CONTACT_EMAIL,
  SITE_NAME,
  SITE_TAGLINE,
  WHATSAPP_DISPLAY,
  WHATSAPP_LINK,
} from "@/lib/site";

const NAV = [
  { to: "/", label: "Accueil" },
  { to: "/villas", label: "Nos villas" },
  { to: "/comment-ca-marche", label: "Comment ça marche" },
  { to: "/ma-reservation", label: "Suivre ma réservation" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="gradient-lagoon flex size-10 items-center justify-center rounded-2xl text-primary-foreground shadow-soft">
              <i className="fa-solid fa-umbrella-beach" aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg">{SITE_NAME}</span>
              <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {SITE_TAGLINE}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "bg-secondary text-secondary-foreground" }}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary/70"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/villas"
              className="gradient-lagoon ml-2 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lift"
            >
              Réserver ma villa
            </Link>
          </nav>

          <button
            type="button"
            aria-label="Ouvrir le menu"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full border border-border p-2.5 text-foreground md:hidden"
          >
            <i className={open ? "fa-solid fa-xmark" : "fa-solid fa-bars"} aria-hidden="true" />
          </button>
        </div>

        {open && (
          <nav className="animate-pop border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary/70"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-border bg-sand text-sand-foreground">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-xl">{SITE_NAME}</p>
            <p className="mt-2 text-sm text-sand-foreground/75">
              Des villas choisies avec soin en Guadeloupe, pour des vacances simples et
              chaleureuses.
            </p>
          </div>
          <div className="text-sm">
            <p className="mb-3 font-semibold">Navigation</p>
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="block py-1 hover:text-primary">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="space-y-2 text-sm">
            <p className="mb-3 font-semibold">Contact</p>
            <p>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                <i className="fa-brands fa-whatsapp mr-2 text-palm" aria-hidden="true" />
                {WHATSAPP_DISPLAY}
              </a>
            </p>
            <p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-primary">
                <i className="fa-solid fa-envelope mr-2 text-primary" aria-hidden="true" />
                {CONTACT_EMAIL}
              </a>
            </p>
            <p>
              <i className="fa-solid fa-location-dot mr-2 text-primary" aria-hidden="true" />
              Le Gosier, Guadeloupe
            </p>
            <p className="pt-1 text-xs text-sand-foreground/70">
              Arrivée à partir de 10h00 / Départ avant 15h00
            </p>
          </div>
          <div className="text-sm">
            <p className="mb-3 font-semibold">Suivez-nous</p>
            <div className="flex items-center gap-2.5">
              <a
                href="https://www.tiktok.com/@villa.guadeloupe6"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="flex size-9 items-center justify-center rounded-full bg-background text-primary shadow-soft transition-transform duration-300 hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground"
              >
                <i className="fa-brands fa-tiktok text-sm" aria-hidden="true" />
              </a>
              <a
                href="https://wa.me/33780957372"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex size-9 items-center justify-center rounded-full bg-background text-primary shadow-soft transition-transform duration-300 hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground"
              >
                <i className="fa-brands fa-whatsapp text-base" aria-hidden="true" />
              </a>
            </div>
            <Link
              to="/admin-connexion"
              className="mt-5 inline-block text-xs text-sand-foreground/60 hover:text-primary"
            >
              Espace gestionnaire
            </Link>
          </div>
        </div>
        <div className="border-t border-border/60 py-4 text-center text-xs text-sand-foreground/70">
          © {new Date().getFullYear()} {SITE_NAME} — Paiement par virement bancaire uniquement.
        </div>
      </footer>

      {/* Bouton WhatsApp flottant avec animation de pulsation */}
      <a
        href="https://wa.me/33780957372?text=Bonjour%2C%20je%20souhaite%20avoir%20des%20informations%20sur%20une%20villa"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter sur WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition-transform duration-300 hover:scale-110 focus:outline-none"
      >
        <span className="pointer-events-none absolute inset-0 rounded-full bg-[#25D366]/60 animate-ping" />
        <i className="fa-brands fa-whatsapp relative z-10 text-3xl" aria-hidden="true" />
      </a>
    </div>
  );
}
