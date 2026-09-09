import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  const navItems = [
    { href: "/admin", label: "Tableau de bord", icon: "fas fa-home" },
    { href: "/admin/artisans", label: "Artisans", icon: "fas fa-hammer" },
    { href: "/admin/categories", label: "Catégories", icon: "fas fa-tags" },
    { href: "/admin/actualites", label: "Actualités", icon: "fas fa-newspaper" },
    { href: "/admin/jema", label: "JEMA", icon: "fas fa-award" },
    { href: "/admin/medias", label: "Médias", icon: "fas fa-video" },
  ];

  return (
    <div className="min-h-screen bg-mag-sand/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-mag-cream shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b border-mag-cream">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl font-black text-mag-red font-serif">MAG</span>
            <span className="text-sm text-mag-gray">Admin</span>
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-mag-dark/70 hover:bg-mag-cream/40 hover:text-mag-red transition-colors"
            >
              <i className={`${item.icon} w-5 text-center`} aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-mag-cream mt-auto">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-mag-gray hover:text-mag-red transition-colors"
          >
            <i className="fas fa-arrow-left" aria-hidden />
            Retour au site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
