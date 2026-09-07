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
  { to: "/ma-reservation", label: "Ma réservation" },
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
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="rounded-full px-3 py-2 text-sm text-foreground/70 transition-colors hover:text-primary"
              aria-label={`Écrire à ${CONTACT_EMAIL}`}
            >
              <i className="fa-solid fa-envelope" aria-hidden="true" />
            </a>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-3 py-2 text-sm font-medium text-palm transition-colors hover:text-primary"
            >
              <i className="fa-brands fa-whatsapp mr-1.5" aria-hidden="true" />
              WhatsApp
            </a>
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
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl px-3 py-2.5 text-sm font-medium text-palm"
            >
              <i className="fa-brands fa-whatsapp mr-2" aria-hidden="true" />
              {WHATSAPP_DISPLAY}
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="block rounded-xl px-3 py-2.5 text-sm font-medium"
            >
              <i className="fa-solid fa-envelope mr-2" aria-hidden="true" />
              {CONTACT_EMAIL}
            </a>
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
            <div className="flex gap-2">
              {[
                "fa-brands fa-facebook-f",
                "fa-brands fa-instagram",
                "fa-brands fa-whatsapp",
                "fa-brands fa-tripadvisor",
              ].map((icon) => (
                <span
                  key={icon}
                  className="flex size-9 items-center justify-center rounded-full bg-background text-primary shadow-soft transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <i className={icon} aria-hidden="true" />
                </span>
              ))}
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
    </div>
  );
}
