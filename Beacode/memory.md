# Mémoire du projet — Métiers d'Art Genève

## Configuration
- Projet Next.js 15 / React 19 / TypeScript strict / Tailwind v4
- Base PostgreSQL Neon pilotée par Drizzle ORM
- Auth.js (lien magique + passkeys WebAuthn)
- Uploads via Vercel Blob
- E-mails via Resend (clé API configurée dans .env.local et Vercel)
- Carte Leaflet pour la carte des artisans

## Stack technique
- Hébergement : Vercel (CLI)
- Déploiement : `vercel --prod`
- DB : Neon (pooled + unpooled connections)

## Décisions prises
- Pages admin : CRUD complet via modals (artisans, catégories, JEMA, actualités, médias)
- AdminTable : composant partagé avec boutons edit/delete (cursor-pointer)
- Icônes Font Awesome : fa-award pour JEMA (fa-calendar-star n'existe pas)
- Géocodage auto via Nominatim sur blur de l'adresse dans ArtisanModal
- Seed : données initiales importées depuis les pages statiques vers la DB

## Données seedées
- Catégories : depuis src/lib/data.ts
- Artisans : depuis src/lib/data.ts
- JEMA : 5 éditions (2023-2027)
- Actualités : 6 entrées (depuis l-actu/page.tsx)
- Médias : 48 entrées (capsules Vimeo, interview YouTube, revues presse, articles)
