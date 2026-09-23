# Follow-up — backlog versionné

Reports, points à vérifier et décisions ouvertes, par chantier (plus récent en haut).

## 2026-09-23 — Carte des communes : territoires au lieu de points (/qui-sommes-nous)

### Fait

- Chaque commune est dessinée par son territoire (rouge = soutient MAG, gris sinon), au lieu
  d'un point. Géométrie : `src/lib/ge-communes.json`, générée par
  `npx tsx scripts/build-communes-geo.ts` (swisstopo swissBOUNDARIES3D, simplifiée à 10 m en
  préservant les frontières partagées ; le script échoue si la topologie casse).
- Rapprochement base ↔ territoires par nom : `communeKey()` (`src/lib/utils.ts`, testé).
  Commune de la base sans territoire → repli sur un point. Liste `sr-only` des communes soutiens.

### À vérifier / décider

- **Aucune commune n'est marquée « soutient MAG » en base (45/45 à `false`)** : la carte est
  entièrement grise tant que MAG ne coche pas ses communes dans l'admin.
- Millésime 2015 choisi pour avoir les communes **sans le lac** : dès 2016, swisstopo inclut la
  part de Léman de chaque commune riveraine (Genève couvrirait la Rade). Limites terrestres
  quasi inchangées depuis. Pour la version officielle avec le lac :
  `npx tsx scripts/build-communes-geo.ts 2026`.
- Renommer une commune dans l'admin (ex. « Ville de Genève ») la fait tomber en repli point sans
  signal. Piste : stocker le n° OFS en base, ou choisir le nom parmi les 45 dans l'admin.

### Skippé / hors périmètre

- `escapeHtml` existe en 3 exemplaires (`ArtisansMap.tsx`, `api/annonces/route.ts`,
  `CommunesSoutiensMap.tsx`) : à factoriser dans `src/lib` avec un test (précédent XSS).

## 2026-09-23 — Soft 404 sur les routes dynamiques — corrigé

- `/artisans/<slug inconnu>`, `/categories/<slug inconnu>`, `/jema/<année inconnue>` répondaient
  **200** (+ `noindex`) au lieu de 404, depuis avant la refonte. Cause confirmée en local
  (`next build && next start`) : `src/app/loading.tsx` à la racine ouvrait un Suspense, la
  réponse partait en streaming avant le `notFound()`. Fichier supprimé → vrais 404.
- Garde-fou : `scripts/check-deploy.sh [URL]` vérifie 200 sur les pages clés et 404 sur des
  pages inexistantes ; à lancer après chaque deploy prod.
- Effet de bord assumé : plus d'indicateur de chargement global pendant la navigation vers une
  page pas encore générée (ou l'admin). Si besoin un jour : `loading.tsx` par segment, **jamais
  au-dessus d'une route dynamique qui appelle `notFound()`**.

## 2026-09-23 — Refonte éditoriale du front public (mergée dans `main`, `f1bc521`)

Direction « magazine » validée par Bernard sur la maquette Design : grands titres serif Black,
photos d'artisan·e·s à fond perdu, aplats sable / quasi-noir / rouge, sur-titres en capitales.
Nouveau vocabulaire partagé : `src/components/ui/Editorial.tsx` (`PageHero`, `SectionHeader`,
`Eyebrow`) et la classe `.h-section` (globals.css). Admin non touché.

### Point de restauration

- Tag `restore/avant-refonte-2026-09-23` + branche `archive/avant-refonte` = `main` au
  commit `1002b44`, poussés sur origin.
- Revenir à l'ancienne version : `git revert` du merge de `refonte-editoriale`, ou redéployer
  le tag dans Vercel (Deployments → deployment du commit `1002b44` → Promote).

### À vérifier / décider

- Accroche « Genève, à la main. » : proposition, à valider avec le client.
- Artisan·e·s mis·es en avant sur l'accueil codé·e·s en dur par nom dans `src/app/page.tsx`
  (`HERO_ARTISAN`, `PORTRAITS`…) ; introuvable = ignoré. Piste : un champ « mis en avant » dans l'admin.
- Photos des fiches encore servies depuis metiersdart-geneve.ch (Joomla) : à migrer vers Blob
  avant l'arrêt de l'ancien site. `canOptimizeImage()` passe en `unoptimized` tout hôte non déclaré.
- Écart assumé au design system : photos à coins quasi francs (4px) au lieu de 24px.
- Vérifié en HTTP seulement (preview + prod : pages 200, 50/50 images) ; **rendu visuel pas
  encore passé au navigateur** (desktop + mobile).
- `vercel curl` a généré un secret « Protection Bypass for Automation » dans les réglages du
  projet Vercel (Deployment Protection) : garder ou révoquer.

## 2026-09-23 — Sécurité : XSS stockée via `categories.color`

Corrigé en code : la couleur n'entre plus brute ni dans le HTML des marqueurs Leaflet
(`artisanMarker()`, `src/lib/map-marker.ts`) ni dans le dégradé de la page catégorie
(`normalizeHex()`, repli `#b42c36`) ; routes admin POST / PATCH en 400 hors `^#[0-9a-fA-F]{6}$`
(`isHexColor()`) ; champ couleur de l'admin = sélecteur natif + saisie vérifiée, envoyée
normalisée. Tests : `isHexColor`, `artisanMarker` (charges XSS comprises).

### Fait : contrainte CHECK en base (accord Bernard, 2026-09-23)

`categories_color_hex CHECK (color ~ '^#[0-9a-fA-F]{6}$')` appliquée en prod par SQL, dans une
transaction (16/16 conformes, NULL permis) et déclarée dans `src/db/schema.ts`. Testée dans une
transaction annulée : la charge `onclick` de la review, `red`, `#9d8`, `#b42c36ff` refusés (23514) ; NULL,
`#b42c36`, `#B42C36` acceptés. Un `db:push` ne la touche plus (vérifié à blanc).

### `db:push` : faux positif sur les tables d'auth — toujours passer par `db:push:dry`

Même sans aucun changement de schéma, `drizzle-kit push` veut exécuter 4 statements :
DROP puis ADD des clés primaires composites de `account` et `verification_token`. La base
correspond pourtant déjà au schéma (mêmes noms, mêmes colonnes) : faux positif de drizzle-kit
sur les PK composites nommées. Inoffensif aujourd'hui (tables vides), mais chaque push les
rejoue et, une fois les tables peuplées, un échec entre DROP et ADD laisserait la table sans clé.
C'est pour ça que la contrainte CHECK a été passée en SQL et pas par `db:push`.
- Avant tout `db:push` : `npm run db:push:dry` (`scripts/db-push-dry.sh`) affiche le SQL
  que push exécuterait, via une connexion directe forcée en lecture seule : rien ne peut s'écrire.
  push n'est pas transactionnel (statements un par un).
- Changer la regex de `categories_color_hex` dans `schema.ts` ne la change pas en base :
  push compare les CHECK par nom. DROP + ADD en SQL, ou renommer la contrainte.
- **Cause** (établie le 2026-09-23) : drizzle-kit 0.31 lit les colonnes des PK via
  `information_schema.constraint_column_usage` sans `ORDER BY` ; la prod les rend inversées
  (`provider_account_id, provider` / `token, identifier`), la comparaison est ordonnée → diff.
  Déclarer les colonnes à l'envers dans le schéma masquerait le bug sur un ordre non garanti : écarté.
- **0.31.11** (dernière stable, installée) : toujours présent.
- **1.0.0-rc.4** (testé à part, lecture seule) : « No changes detected », CHECK comprise ; vraie
  lecture à blanc (`push --explain`) ; détecte bien une colonne ajoutée. Mais le kit 1.0 exige
  drizzle-orm 1.0 (refus avec 0.45), et `@auth/drizzle-adapter` 1.11.3 est construit sur
  drizzle-orm `^0.45.2`.
- 1.0 ne compare pas non plus le contenu des CHECK sur push (regex modifiée non vue).
- `pushSchema()` de `drizzle-kit/api` (0.31) est inutilisable ici : il perd les paramètres
  des requêtes d'introspection (`there is no parameter $1`).

**Décidé (Bernard, 2026-09-23)** : on reste en drizzle 0.31 ; tout `db:push` passe d'abord par
`npm run db:push:dry`. Migration en 1.0 à rouvrir quand drizzle 1.0 sera stable et
`@auth/drizzle-adapter` compatible.

### Relevé en passant : `npm audit`, extrait (2026-09-23, antérieur, inchangé par la mise à jour)

- **`@simplewebauthn/server` ≤ 13.3.1** (projet en ^9, passkeys admin) : chaîne des certificats
  d'attestation insuffisamment vérifiée (GHSA-6hxq-p678-4hr2). Correctif = v14, cassant ; à évaluer
  selon la politique d'attestation utilisée à l'enregistrement.
- **`postcss` ≤ 8.5.22** embarqué par `next` (élevé, côté build) : correctif via next 16, cassant.
- **`esbuild` ≤ 0.24.2** via `@esbuild-kit` (dépendance de drizzle-kit 0.31, dev uniquement,
  concerne le serveur de dev d'esbuild, non utilisé ici). Disparaît avec drizzle-kit 1.0.
- Aussi : `next` (modéré), `@auth/core` / `next-auth` (faible, via SimpleWebAuthn) ; détail : `npm audit`.
- Hors audit : `eslint-config-next` 16.3.4 face à `next` 15.5 (versions désalignées).

### Skippé / hors périmètre

- **Pas de Content-Security-Policy** : une CSP `script-src` sans `unsafe-inline` aurait
  neutralisé ce `onclick`. À étudier avec GTM / Stape / CookieScript (scripts inline).
- **Impossible de vider la couleur** d'une catégorie depuis l'admin : un champ vide part en
  `undefined`, le PATCH ne touche pas la colonne (même motif que `JemaModal`). Antérieur.
- **Catégorie sans couleur** : la page catégorie affiche désormais un dégradé rouge MAG
  (`#b42c36`) au lieu d'aucun fond. Sans effet aujourd'hui (les 16 catégories ont une couleur).

### À vérifier

- **Admin en prod** (session admin requise, non testée ici) : couleur modifiée au sélecteur →
  enregistrée en `#rrggbb` minuscules ; saisie `rouge` → message sous le champ, bouton
  « Enregistrer » désactivé ; saisie `#9D8` → acceptée, enregistrée `#99dd88`.

## 2026-09-23 — Accessibilité : contrastes WCAG AA

Paires texte / fond relevées à l'extraction du design system, corrigées dans le code :
`mag-gray` assombri (#626978), bordure des champs `mag-field` (#868a93), anneau de focus
blanc sur fonds sombres ou rouges (`.focus-ring-white`), états en red-700 / green-700,
puces domaine lisibles via `chipColors()`.

### 🚩 À traiter en priorité (trouvé en review, antérieur au chantier)

- **XSS stockée via `categories.color`** : `src/components/map/ArtisansMap.tsx` (`getIcon`)
  injecte la couleur brute dans le HTML du marqueur Leaflet ; aucune validation dans les
  routes admin des catégories ; `varchar(20)` suffit pour un `onclick`. Exploitable par un
  compte admin, servie au public. Correctif : normaliser à la sortie (`normalizeHex`),
  valider `^#[0-9a-fA-F]{6}$` en API, contrainte `CHECK` en base (accord requis avant
  toute migration de prod). → **Corrigé en code**, voir « Sécurité : XSS stockée via
  `categories.color` » ; contrainte CHECK appliquée le 2026-09-23.

### Skippé / hors périmètre

- **Marquee** : défilement automatique sans pause > 5 s (WCAG 2.2.2, niveau A) ; framer-motion
  ignore la règle CSS `prefers-reduced-motion` → `useReducedMotion()` à brancher.
- **Placeholders** des champs : `currentColor` à 50 % ≈ 2.75:1 sur blanc (défaut Tailwind v4).
- **Cases à cocher admin** (`ActuModal`, `ArtisanModal`, `JemaModal`) : `border-mag-cream`,
  `text-mag-red`, `focus:ring` n'ont aucun effet sans `@tailwindcss/forms` → `accent-mag-red`.
- **Couleurs de domaine en base** inchangées : les puces sont corrigées à l'affichage ; les
  marqueurs de carte (objets graphiques, 3:1) gardent la teinte d'origine (normalisée, non assombrie).
- **Chapô du hero d'accueil** en `mag-dark/70` sur le dégradé crème : ≈ 4.6:1 à sa hauteur,
  gardé (passe, sans marge).

### Fait

- **Design system « Métiers d'Art Genève »** (artifact, version 6) : `mag-gray` #626978,
  `mag-field` #868a93, `focus-ring-inverse` / `.focus-ring-white`, `red-700` ; `red-600`,
  `green-600` et `mag-dark-60` retirés ; texte des puces domaine calculé comme `chipColors()`.
- **URL de prod** : `metiersdart-geneve.vercel.app` (alias de production Vercel), corrigée dans
  `Beacode/memory.md` qui citait `mag.vercel.app` (pas ce projet).

### À vérifier

- **Rendu en prod** : liens du header plus sombres, survol blanc souligné dans le footer,
  bordure des champs visible (connexion, répertoire, Espace Communauté, admin), puces domaine
  papier / horlogerie / verre assombries.

## 2026-09-23 — Suivi : GTM / Stape / CookieScript / GA4 repris de l'ancien site

Même conteneur que le site Joomla (`GTM-M6497K4X`, loader Stape `nlpd.metiersdart-geneve.ch`) ;
CookieScript et GA4 (`G-S9P7VJHKRL`) sont dans le conteneur. Chargé uniquement sur
`metiersdart-geneve.ch` / `www` (ou avec `?gtm_debug`), jamais sur `/admin` et `/auth`.

### À vérifier (à la bascule DNS)

- **Ne pas toucher l'enregistrement DNS `nlpd`** (CNAME vers Stape) en basculant l'apex et
  `www` vers Vercel — sinon GTM, CookieScript et GA4 tombent.
- **Bannière CookieScript** visible sur `metiersdart-geneve.ch` (elle ne s'affiche pas sur
  localhost / vercel.app, hors domaine licencié).
- **GA4 temps réel** : pages vues reçues, y compris les navigations internes (le site est une
  SPA : vérifier que la mesure améliorée « changements d'historique » est active sur le flux).

### Skippé

- **Pas de `<noscript>` ns.html** (présent sur l'ancien site) : sans JavaScript, pas de
  consentement possible, donc pas de pixel.
- **Tag Assistant sur vercel.app** : `?gtm_debug` se perd à chaque rechargement complet ;
  suffisant pour un test ponctuel, pas de persistance ajoutée.

## 2026-09-23 — Correctifs de review : pages publiques branchées sur la base

### Skippé / hors périmètre

- **Seed qui recrée ce que l'admin a supprimé** : `onConflictDoNothing` n'écrase plus
  les modifications, mais une édition JEMA supprimée revient au prochain seed, et un
  artisan dont le slug a changé est réinséré sous l'ancien slug (`published: true`).
  Piste : ne seeder artisans / éditions JEMA que si la table est vide, ou flag `--force`.
- **Pas de `src/app/error.tsx`** : une erreur DB sur une page rendue à la demande
  (slug ou année pas encore en cache) affiche la page d'erreur brute de Next.
- **Soft 404** : `notFound()` répond HTTP 200 (page 404 + `noindex`) parce que
  `src/app/loading.tsx` à la racine lance le streaming avant. Ex. `/artisans/slug-inexistant`,
  `/jema/2027`. Comportement antérieur à ce chantier.
- **JemaModal** : `description` et `programUrl` ne peuvent pas être vidés (`|| undefined`).
- **`programUrl` en `href`** sans validation `^https?://` (React 19 bloque déjà `javascript:`).
- **Pas de test du chemin « base configurée mais en erreur »** (nécessite un mock de `@/db`).
- **`jemaParticipant`** n'est pas éditable dans l'admin (le bandeau JEMA des fiches en dépend).

### À vérifier

- **Pages `/jema/2023…2026`** : le récit « Retour sur l'édition » reste le texte d'origine
  (codé en dur dans `editionExtras`) ; la description admin s'affiche sur les cartes `/jema`
  et sert de récit aux nouvelles éditions. Pour que l'admin pilote aussi le récit, l'intro
  et la vidéo : colonnes dédiées en base. La carte 2023 (« lien vivant… ») et l'intro
  « retour post-pandémie » de la page 2023 sont à relire par MAG.
- **Stats 2023–2025** : placeholders « — » à renseigner (admin, champ `stats`) ou retirer.
- **Titre de l'édition à venir** : « 16e édition » en base, contre « JEMA 2026 »… pour les
  autres ; le bandeau `/jema` affiche « 16e édition ». À harmoniser dans l'admin.
- **« Atelier Leckie, Anna Leckie »** : détails scrapés introuvables (1/145).
- **Build** : avec `DATABASE_URL` défini, le build échoue désormais si Neon est injoignable
  (voulu : le déploiement précédent reste en ligne).
- **Previews Vercel sans base** : `DATABASE_URL` n'est défini qu'en Production (Preview n'a
  que `DATABASE_URL_UNPOOLED`) → les previews servent les données statiques et ne montrent
  ni les modifications admin ni les éditions JEMA. Ajouter `DATABASE_URL` (idéalement une
  branche Neon) à l'environnement Preview si on veut valider sur preview.
- **Éditions sans case cochée** : une édition ni « À venir » ni « Passée » n'est pas affichée
  (aide ajoutée dans la modale admin).
