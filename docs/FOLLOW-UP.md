# Follow-up — backlog versionné

Reports, points à vérifier et décisions ouvertes, par chantier (plus récent en haut).

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
  toute migration de prod). Tâche séparée ouverte.

### Skippé / hors périmètre

- **Marquee** : défilement automatique sans pause > 5 s (WCAG 2.2.2, niveau A) ; framer-motion
  ignore la règle CSS `prefers-reduced-motion` → `useReducedMotion()` à brancher.
- **Placeholders** des champs : `currentColor` à 50 % ≈ 2.75:1 sur blanc (défaut Tailwind v4).
- **Cases à cocher admin** (`ActuModal`, `ArtisanModal`, `JemaModal`) : `border-mag-cream`,
  `text-mag-red`, `focus:ring` n'ont aucun effet sans `@tailwindcss/forms` → `accent-mag-red`.
- **Couleurs de domaine en base** inchangées : les puces sont corrigées à l'affichage ; les
  marqueurs de carte (objets graphiques, 3:1) utilisent toujours la couleur brute.
- **Chapô du hero d'accueil** en `mag-dark/70` sur le dégradé crème : ≈ 4.6:1 à sa hauteur,
  gardé (passe, sans marge).

### Fait

- **Design system « Métiers d'Art Genève »** (artifact, version 6) : `mag-gray` #626978,
  `mag-field` #868a93, `focus-ring-inverse` / `.focus-ring-white`, `red-700` ; `red-600`,
  `green-600` et `mag-dark-60` retirés ; texte des puces domaine calculé comme `chipColors()`.
- **URL de prod** : `metiersdart-geneve.vercel.app` (alias de production Vercel). `mag.vercel.app`,
  cité dans `Beacode/memory.md`, n'est pas ce projet.

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
