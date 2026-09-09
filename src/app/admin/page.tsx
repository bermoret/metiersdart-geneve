import { db } from "@/db";
import { artisans, categories, actualites, jemaEditions, medias } from "@/db/schema";
import { count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [artisanCount] = await db.select({ count: count() }).from(artisans);
  const [categoryCount] = await db.select({ count: count() }).from(categories);
  const [actuCount] = await db.select({ count: count() }).from(actualites);
  const [jemaCount] = await db.select({ count: count() }).from(jemaEditions);
  const [mediaCount] = await db.select({ count: count() }).from(medias);

  const stats = [
    { label: "Artisans", value: artisanCount.count, href: "/admin/artisans", icon: "fas fa-hammer", color: "text-mag-red" },
    { label: "Catégories", value: categoryCount.count, href: "/admin/categories", icon: "fas fa-tags", color: "text-mag-red" },
    { label: "Actualités", value: actuCount.count, href: "/admin/actualites", icon: "fas fa-newspaper", color: "text-mag-red" },
    { label: "Éditions JEMA", value: jemaCount.count, href: "/admin/jema", icon: "fas fa-award", color: "text-mag-red" },
    { label: "Médias", value: mediaCount.count, href: "/admin/medias", icon: "fas fa-video", color: "text-mag-red" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-mag-dark font-serif mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <a
            key={s.label}
            href={s.href}
            className="rounded-xl border border-mag-cream bg-white p-6 hover:border-mag-red/30 hover:shadow-md transition-all"
          >
            <i className={`${s.icon} text-2xl ${s.color} mb-3`} aria-hidden />
            <p className="text-3xl font-black text-mag-dark">{s.value}</p>
            <p className="mt-1 text-sm text-mag-gray">{s.label}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
