"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/repertoire", label: "Répertoire" },
  { href: "/qui-sommes-nous", label: "Qui sommes-nous" },
  { href: "/jema", label: "JEMA" },
  { href: "/l-actu", label: "L'actu des artisans" },
  { href: "/medias", label: "Médias" },
  { href: "/metiers-et-formations", label: "Métiers et formations" },
  { href: "/manufacto", label: "Manufacto" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-mag-cream border-b border-mag-red/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo MAG */}
          <Link
            href="/"
            className="flex items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <Image
              src="/logo.png"
              alt="Métiers d'Art Genève"
              width={90}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden lg:flex items-center gap-1"
            aria-label="Navigation principale"
          >
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`nav-link px-3 py-2 text-sm font-medium rounded-full transition-colors ${
                    active
                      ? "bg-mag-red text-white"
                      : "text-mag-dark/70 hover:text-mag-red hover:bg-mag-red/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 text-mag-dark rounded-lg hover:bg-mag-red/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav
            className="lg:hidden pb-4 flex flex-col gap-1"
            aria-label="Navigation mobile"
          >
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`nav-link px-4 py-2.5 text-sm font-medium rounded-full transition-colors ${
                    active
                      ? "bg-mag-red text-white"
                      : "text-mag-dark/70 hover:text-mag-red hover:bg-mag-red/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
