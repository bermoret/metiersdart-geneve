# Mémoire du projet — Métiers d'Art Genève

## Architecture & Stack
- **Next.js 15 / React 19** (App Router) / TypeScript strict / Tailwind v4
- **DB : PostgreSQL Neon** via Drizzle ORM (`drizzle-kit push` pour migrations)
- **Auth.js (NextAuth v5)** : magic link (Resend) + Passkeys WebAuthn — `src/auth.ts` avec `experimental.enableWebauthn: true`
- **Vercel Blob** pour uploads d'images (`@vercel/blob`)
- **Resend** pour e-mails (domaine vérifié `jooce.ch`, from: `contact@jooce.ch`)
- **Leaflet** pour carte interactive des artisans
- **Framer Motion** pour animations on-scroll et micro-interactions
- **Font Awesome 6 free** pour icônes

## Hébergement & déploiement
- Vercel (CLI) — `vercel --prod` / Prod : https://mag.vercel.app
- DB Neon : pooled + unpooled connections
- Git remote : `https://github.com/bermoret/metiersdart-geneve.git`

## Variables d'environnement
- `AUTH_SECRET` — Vercel (3 envs) + `.env.local`
- `RESEND_API_KEY` — Vercel (3 envs) + local
- `RESEND_FROM_EMAIL` = `contact@jooce.ch`
- `DATABASE_URL` — Neon, `sslmode=verify-full`
- `BLOB_READ_WRITE_TOKEN` — requis pour Vercel Blob

## Schéma DB (Drizzle)
- `src/db/schema.ts` : `artisans`, `categories`, `actualites`, `jemaEditions`, `medias`
- `src/db/auth-schema.ts` : `user`, `account`, `session`, `verification_token`, `authenticator`
- `drizzle.config.ts` référence **les deux** fichiers (corrigé — initialement seul `schema.ts` causait erreur `42P01`)

## Back-office admin
- Routes protégées par Auth.js + middleware `requireAdmin` / `requireAdmin_api` (`src/lib/admin.ts`)
- Pages admin sous `/admin/*` : dashboard, artisans, catégories, actualités, JEMA, médias
- CRUD complet via modals (`ArtisanModal`, `CategoryModal`, `JemaModal`, `ActuModal`, `MediaModal`)
- `AdminTable` : composant partagé avec boutons edit/delete (`cursor-pointer`)
- API routes CRUD sous `/api/admin/*` pour chaque type de contenu
- Upload images via `/api/admin/upload` (Vercel Blob)
- Géocodage auto via `/api/admin/geocode` (Nominatim) sur blur de l'adresse → lat/lng

## Données seedées
- Catégories et artisans : depuis `src/lib/data.ts`
- JEMA : 5 éditions (2023–2027)
- Actualités : 6 entrées
- Médias : 48 entrées (capsules Vimeo, interview YouTube, revues presse, articles)

## Filtres des données (`src/lib/data.ts`)
- **`artisansOnly`** : filtre les types non-artisan (`ecole_formatrice`, `association_professionnelle`, `institution_culturelle`, `partenaire`) — utilisé partout pour les comptages et affichages
- **`artisanCategories`** : catégories ayant au moins un artisan lié
- Compteur homepage : ~135 artisans (au lieu de 145 avant filtrage)
- Pages utilisant ces filtres : `page.tsx`, `categories/[slug]`, `jema/page`, `sitemap.ts`, `artisans/[slug]` (related), `HomeMapSection`, `RepertoireTable`

## Conventions & préférences
- **Workflow obligatoire** : code review → security review → commit → **git push** (le push était négligé)
- Charte graphique MAG : rouge `#b42c36`, rouge foncé `#701618`, crème `#f5e8d5`, sand `#faf6ef`, dark `#323848`, footer `#171717`
- Typographies : Muli (sans-serif), Frank Ruhl Libre (serif)
- Boutons pills (`border-radius: 100px`) style Joomla
- `cursor-pointer` sur tous les éléments cliquables
- Photos hero : préférence jeunes artisanes femmes, rendu peau/mains propre et lisse
- Carte Leaflet : tuiles Esri Light Gray (gratuites, sans clé) + filtre CSS crème (`grayscale(0.6) sepia(0.45)`), markers pulsants couleurs MAG ; `isolate` sur conteneurs pour empêcher z-index overlap avec menu
- CARTO Positron abandonné (nécessite clé API)

## Design / animations
- Composants : `Reveal` (scroll reveal), `AnimatedCounter` (count-up), `Marquee` (bande défilante), `StaggerGroup` (stagger children)
- Grille catégories : `items-start` pour éviter stretch CSS grid ; fond `bg-mag-sand` au lieu de bordure beige (artefact visuel)
- Texture grain, hover effects cartes, underline animé sur nav links

## Fichiers clés
- `src/auth.ts` — config NextAuth
- `src/app/globals.css` — charte graphique + styles Leaflet + animations
- `src/app/page.tsx` — homepage complète (hero, marquee métiers, carte, catégories, stats animées, mission, CTA)
- `src/components/map/ArtisansMap.tsx` — carte Leaflet (tuiles Esri + jitter markers + popups MAG)
- `src/components/home/HomeMapSection.tsx` — section carte sur homepage (utilise `artisansOnly`)
- `src/components/repertoire/RepertoireTable.tsx` — tableau répertoire (utilise `artisansOnly`)
- `public/hero-artisan.png` — photo hero générée (jeune artisan femme)
- `public/artisan-hands.jpg`, `public/artisan-tools.jpg` — photos fournies par l'utilisateur
