import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { href: "/repertoire", label: "Répertoire" },
  { href: "/qui-sommes-nous", label: "Qui sommes-nous" },
  { href: "/jema", label: "JEMA" },
  { href: "/l-actu", label: "L'actu des artisans" },
  { href: "/medias", label: "Médias" },
  { href: "/metiers-et-formations", label: "Métiers et formations" },
  { href: "/manufacto", label: "Manufacto" },
];

const socialLinks = [
  {
    href: "https://www.linkedin.com/",
    label: "LinkedIn",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zM8.34 17h2.66v-7H8.34v7zm1.33-8.25a1.55 1.55 0 100-3.1 1.55 1.55 0 000 3.1zM15.67 17h2.66v-3.7c0-2.02-1.08-2.96-2.52-2.96-.73 0-1.27.4-1.48.68V11h-2.66c0 .76 0 7 0 7h2.66v-3.9c0-.22.02-.44.09-.6.18-.44.6-.9 1.3-.9.92 0 1.28.7 1.28 1.72V17z" />
      </svg>
    ),
  },
  {
    href: "https://www.facebook.com/",
    label: "Facebook",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0022 12z" />
      </svg>
    ),
  },
  {
    href: "https://www.instagram.com/",
    label: "Instagram",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "https://vimeo.com/",
    label: "Vimeo",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.4 7.35c-.1 2.3-1.7 5.5-4.8 9.6-3.2 4.2-5.9 6.3-8.1 6.3-1.4 0-2.5-1.3-3.4-3.8L4.3 12c-.7-2.5-1.4-3.8-2.2-3.8-.2 0-.8.4-1.9 1.1L0 7.6c1.2-1.1 2.4-2.2 3.6-3.3C5.2 2.8 6.4 2 7.1 1.9c1.8-.2 2.9 1.1 3.3 3.8.4 2.9.7 4.7.8 5.4.5 2.3 1 3.5 1.6 3.5.5 0 1.2-.8 2.1-2.3.9-1.5 1.4-2.7 1.5-3.5.1-1.4-.4-2.1-1.6-2.1-.6 0-1.2.1-1.8.4 1.2-3.9 3.4-5.8 6.6-5.8 2.4-.1 3.6 1.6 3.7 5z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="bg-mag-footer text-white">
      {/* Citation */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <p className="font-serif text-lg italic text-white/80 max-w-3xl mx-auto text-center leading-relaxed">
            Quand vous faites travailler un·e artisan·e, vous achetez bien plus
            qu&apos;un service. Vous reconnaissez la maîtrise d&apos;un geste,
            l&apos;exigence d&apos;un savoir-faire et des centaines d&apos;heures
            d&apos;essais, d&apos;échecs et d&apos;expérimentations. Vous
            n&apos;achetez pas simplement quelque chose. Vous achetez un morceau
            de cœur, une parcelle d&apos;âme, une part de la vie consacrée au
            travail de la matière.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo + Coordonnées */}
          <div>
            <Image
              src="/logo.png"
              alt="Métiers d'Art Genève"
              width={120}
              height={53}
              className="h-12 w-auto mb-4 brightness-0 invert"
            />
            <p className="text-sm text-white/70 mb-2">
              pa : emmenegger compétences conseils
              <br />
              6a, route du Grand-Lancy
              <br />
              1227 Les Acacias — Genève
            </p>
            <a
              href="tel:+41227899190"
              className="text-sm text-white/70 hover:text-mag-red transition-colors block mt-3"
            >
              +41 22 789 91 90 (Bureau de l&apos;association MAG)
            </a>
            <a
              href="mailto:contact@metiersdart-geneve.ch"
              className="text-sm text-white/70 hover:text-mag-red transition-colors block"
            >
              contact@metiersdart-geneve.ch
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-bold mb-4 font-serif">Navigation</h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-mag-red transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <h3 className="text-lg font-bold mb-4 font-serif">Nos réseaux sociaux</h3>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-mag-red transition-colors"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Métiers d&apos;Art Genève.
          </p>
          <p className="text-xs text-white/50">Site internet jooce.ch</p>
        </div>
      </div>
    </footer>
  );
}
