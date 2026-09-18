import { db } from "@/db";
import {
  categories,
  artisans,
  jemaEditions,
  manufactoEditions,
  partenaires,
  comiteMembers,
  communes,
  siteSettings,
} from "@/db/schema";
import { users } from "@/db/auth-schema";
import { eq } from "drizzle-orm";
import { seedData } from "./seed-data";

async function main() {
  console.log("🌱 Début du seed…");

  // Catégories
  for (const cat of seedData.categories) {
    await db.insert(categories).values({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      color: cat.color,
      sortOrder: cat.sortOrder ?? 0,
    }).onConflictDoNothing({ target: categories.slug });
  }
  console.log(`✓ ${seedData.categories.length} catégories insérées`);

  // Artisans
  for (const a of seedData.artisans) {
    await db.insert(artisans).values({
      name: a.name,
      slug: a.slug,
      type: a.type,
      craft: a.craft,
      commune: a.commune,
      latitude: Math.round(a.latitude * 1e6),
      longitude: Math.round(a.longitude * 1e6),
      shortDescription: a.shortDescription,
      jemaParticipant: true,
      published: true,
    }).onConflictDoNothing({ target: artisans.slug });
  }
  console.log(`✓ ${seedData.artisans.length} artisans insérés`);

  // JEMA édition 2027 (à venir)
  await db.insert(jemaEditions).values({
    year: 2027,
    title: "16e édition",
    startDate: new Date("2027-03-19"),
    endDate: new Date("2027-03-21"),
    isUpcoming: true,
    isPast: false,
    description: "Les JEMA reviennent du 19 au 21 mars 2027 à Genève.",
  }).onConflictDoNothing({ target: jemaEditions.year });

  // JEMA éditions passées
  for (const year of [2026, 2025, 2024, 2023]) {
    await db.insert(jemaEditions).values({
      year,
      title: `${year === 2026 ? "15e" : year === 2025 ? "14e" : "13e"} édition`,
      isUpcoming: false,
      isPast: true,
    }).onConflictDoNothing({ target: jemaEditions.year });
  }
  console.log("✓ Éditions JEMA insérées");

  // Partenaires
  for (const p of seedData.partenaires) {
    await db.insert(partenaires).values(p).onConflictDoNothing();
  }

  // Comité
  for (const m of seedData.comite) {
    await db.insert(comiteMembers).values(m).onConflictDoNothing();
  }
  console.log("✓ Partenaires et comité insérés");

  // Manufacto éditions
  for (const ed of seedData.manufacto) {
    await db.insert(manufactoEditions).values({
      year: ed.year,
      schools: ed.schools,
    }).onConflictDoNothing();
  }
  console.log("✓ Manufacto inséré");

  // Communes
  for (const c of seedData.communes) {
    await db.insert(communes).values({
      name: c.name,
      slug: c.slug,
      latitude: c.latitude,
      longitude: c.longitude,
      soutientMag: c.soutientMag,
      sortOrder: c.sortOrder ?? 0,
    }).onConflictDoNothing({ target: communes.slug });
  }
  console.log(`✓ ${seedData.communes.length} communes insérées`);

  // Paramètres du site — mot de passe Communauté par défaut
  await db.insert(siteSettings).values({
    id: "default",
    eventsCount: 0,
    communautePassword: "MAG 2026",
  }).onConflictDoNothing({ target: siteSettings.id });
  console.log("✓ Paramètres du site initialisés (mot de passe Communauté : MAG 2026)");

  // Utilisateur administrateur
  const adminEmail = "bernard.moret@jooce.ch";
  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (!existingAdmin) {
    await db.insert(users).values({
      email: adminEmail,
      name: "Bernard Moret",
      role: "admin",
    });
    console.log(`✓ Utilisateur admin créé : ${adminEmail}`);
  } else if (existingAdmin.role !== "admin") {
    await db.update(users).set({ role: "admin" }).where(eq(users.email, adminEmail));
    console.log(`✓ Rôle admin attribué à : ${adminEmail}`);
  } else {
    console.log(`✓ Utilisateur admin déjà présent : ${adminEmail}`);
  }

  console.log("🎉 Seed terminé !");
}

main().catch((err) => {
  console.error("❌ Erreur seed:", err);
  process.exit(1);
});
