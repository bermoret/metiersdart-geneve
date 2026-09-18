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

  // Résolution nom de catégorie → id (nécessaire pour le JOIN côté public)
  const allCats = await db.select().from(categories);
  const catIdByName = new Map(allCats.map((c) => [c.name, c.id]));
  let catLinked = 0;

  // Artisans — upsert : met à jour les données existantes (corrige les
  // coordonnées corrompues ×1e6 et injecte les champs enrichis du scraping)
  for (const a of seedData.artisans) {
    const categoryId = catIdByName.get(a.categoryName) ?? null;
    if (categoryId) catLinked++;
    await db
      .insert(artisans)
      .values({
        name: a.name,
        slug: a.slug,
        type: a.type,
        craft: a.craft,
        categoryId,
        commune: a.commune,
        latitude: a.latitude,
        longitude: a.longitude,
        shortDescription: a.shortDescription,
        imageUrl: a.imageUrl,
        longDescription: a.longDescription,
        address: a.address,
        website: a.website,
        video: a.video,
        phone: a.phone,
        email: a.email,
        autre: a.autre,
        poinconType: a.poinconType,
        poinconModalText: a.poinconModalText,
        poinconModalLink: a.poinconModalLink,
        jemaParticipant: true,
        published: true,
      })
      .onConflictDoUpdate({
        target: artisans.slug,
        set: {
          type: a.type,
          craft: a.craft,
          categoryId,
          commune: a.commune,
          latitude: a.latitude,
          longitude: a.longitude,
          imageUrl: a.imageUrl,
          longDescription: a.longDescription,
          address: a.address,
          website: a.website,
          video: a.video,
          phone: a.phone,
          email: a.email,
          autre: a.autre,
          poinconType: a.poinconType,
          poinconModalText: a.poinconModalText,
          poinconModalLink: a.poinconModalLink,
          updatedAt: new Date(),
        },
      });
  }
  console.log(
    `✓ ${seedData.artisans.length} artisans insérés/mis à jour (${catLinked} liés à une catégorie)`,
  );

  // Éditions JEMA — upsert : descriptions et highlights éditables depuis l'admin
  const jemaSeed = [
    {
      year: 2027,
      title: "16e édition",
      startDate: new Date("2027-03-19"),
      endDate: new Date("2027-03-21"),
      isUpcoming: true,
      isPast: false,
      description:
        "Les JEMA reviennent du 19 au 21 mars 2027 à Genève. Réservez votre week-end pour rencontrer les professionnel·le·s des métiers d'art : démonstrations, visites d'ateliers, expositions et plus encore.",
      highlight: null,
    },
    {
      year: 2026,
      title: "JEMA 2026",
      startDate: new Date("2026-03-27"),
      endDate: new Date("2026-03-29"),
      isUpcoming: false,
      isPast: true,
      description:
        "Un week-end intense où 145 artisan·e·s genevois·e·s ont ouvert leurs ateliers, animé le Pavillon SICLI et partagé leurs savoir-faire à travers toute la ville. Démonstrations, ateliers d'initiation, conférences et visites guidées ont attiré un public venu nombreux à la rencontre des métiers d'art.",
      highlight: "Best of en vidéo par Raphaël Haab",
    },
    {
      year: 2025,
      title: "JEMA 2025",
      startDate: new Date("2025-03-28"),
      endDate: new Date("2025-03-30"),
      isUpcoming: false,
      isPast: true,
      description:
        "Pour cette 14ᵉ édition, les métiers d'art genevois ont déployé leurs trois parcours habituels : ouverture d'ateliers dans la ville, Pavillon SICLI au cœur de l'événement et parcours culturel dans 12 institutions. Les visiteurs ont pu découvrir la richesse des savoir-faire locaux, du textile à l'horlogerie en passant par la sculpture sur pierre.",
      highlight: "15ᵉ anniversaire du poinçon MAG",
    },
    {
      year: 2024,
      title: "JEMA 2024",
      startDate: new Date("2024-03-23"),
      endDate: new Date("2024-03-25"),
      isUpcoming: false,
      isPast: true,
      description:
        "La 13ᵉ édition des Journées Européennes des Métiers d'Art a mis à l'honneur le dialogue entre tradition et innovation. Pendant un week-end, ateliers, écoles et institutions culturelles ont partagé leurs gestes, leurs techniques et leurs passions avec un public toujours plus curieux de découvrir ces métiers rares.",
      highlight: "Focus sur la transmission",
    },
    {
      year: 2023,
      title: "JEMA 2023",
      startDate: new Date("2023-03-24"),
      endDate: new Date("2023-03-26"),
      isUpcoming: false,
      isPast: true,
      description:
        "Douzième édition consécutive pour Genève : les JEMA 2023 ont célébré le lien vivant entre les artisan·e·s et leur territoire. Démonstrations, visites guidées et expositions ont ponctué ce week-end dédié à la transmission des savoir-faire et à la rencontre entre public et professionnel·le·s.",
      highlight: "Retour post-pandémie",
    },
  ];

  for (const ed of jemaSeed) {
    await db
      .insert(jemaEditions)
      .values(ed)
      .onConflictDoUpdate({
        target: jemaEditions.year,
        set: {
          title: ed.title,
          startDate: ed.startDate,
          endDate: ed.endDate,
          isUpcoming: ed.isUpcoming,
          isPast: ed.isPast,
          description: ed.description,
          highlight: ed.highlight,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`✓ ${jemaSeed.length} éditions JEMA insérées/mises à jour`);

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
