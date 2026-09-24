# Follow-up — backlog versionné

Reports, points à vérifier et décisions ouvertes, par chantier (plus récent en haut).

## 2026-09-24 — Contrôle en prod des retours MAG du 23.09 (avant réponse au mail)

Tous les points du mail vérifiés en prod (textes, chiffres, liens, 14 artisans de la carte à
coordonnées distinctes, mention JEMA 86 avec / 28 sans, 0 fiche sans « À propos »), sauf les
Focus Léman Bleu 2025 / 2026 (URLs à obtenir, déjà listé plus bas). Constats en passant :

- ~~Mention JEMA non éditable dans l'admin~~ : case « A participé aux JEMA » ajoutée à la fiche
  admin (GET liste / fiche et PATCH la transmettent ; décochée pour un nouvel artisan, POST sans
  le champ = `false`). Au passage : le formulaire se réinitialise à chaque ouverture (annuler
  puis rouvrir ne garde plus la saisie abandonnée).
- **JEMA 2026, « Le domaine de la pierre se mobilise »** : `PierreFocus` liste tous les
  artisan·e·s « Art de la pierre » du répertoire sous « Artisan·e·s présents », dont Artisan du
  Staff et Julien Joselon, non participants d'après JEMA27_APPEL. Titre à changer ou filtre
  participants 2026 : question posée à MAG.
- ~~Admin Communes « Soutient MAG »~~ : renommé « Commune partenaire » (+ rappel de la règle « en recherche d'artisan·e·s »).
- ~~« oeuvrons »~~ → « œuvrons » sur l'accueil (accord Bernard).
- /jema, « Merci à nos partenaires » : texte seul, aucun logo ni nom (jamais eu) — question à MAG.
- Stat_GLOBALES vs site : « Au Bon Relieur » (Charles Duch, Vernier) absent du site ;
  « Duo d'art » (Vernier) absent du tableau. Même entité ? Question à MAG.
- Filtre commune du répertoire affiche « Perly » (alias `communeKey`, voir plus bas).

## 2026-09-24 — Code review (xhigh) du chantier « retours MAG » : reports

Corrigés : texte JEMA 2026 sans chiffres contradictoires, /medias régénéré toutes les heures,
backfill sans correspondance par mots-clés, description de repli des éditions (2022),
positions des pastilles stables au filtre, légende / texte lecteur d'écran fusionnés comme la
carte (`mergeCommunes`), liseré des pastilles, bouton « proches de chez vous » → `#carte`,
`countCrafts` retiré, `dbConfigured` partagé.

Reportés :
- **Alias « Perly »** dans `communeKey` : corriger la donnée (fiche en « Perly » →
  « Perly-Certoux », écriture en base) et faire choisir la commune dans la liste des 45 dans
  l'admin artisan au lieu d'un champ libre ; retirer ensuite l'alias.
- **Textes « À propos » vides** : le test ne couvre que les données statiques ; contrôle en
  base = `npx tsx scripts/backfill-descriptions.ts` à blanc (« 0 sans texte »). À brancher
  dans un contrôle périodique si des fiches sont créées sans texte.
- **Qui sommes-nous** charge toute la liste des artisan·e·s pour en déduire les communes :
  une requête `SELECT DISTINCT commune` suffirait (gain négligeable à 145 fiches).
- Métiers = 53 (constante) et photos de mineur·e·s : voir ci-dessous (migration à accorder,
  consentement à confirmer par MAG).

## 2026-09-23 — Retours de l'équipe MAG (mail « MAG: Retour nouveau site internet »)

### Fait (code)

- Accueil : pastille « Bienvenue chez MAG », bouton « Trouver les artisanes et artisans proches
  de chez vous », badge sans « + », « MAG en chiffres » = artisan·e·s (calculé) · 53 métiers
  (constante `CRAFTS_COUNT`, nomenclature MAG) · communes où exercent les artisan·e·s (calculé,
  21) · projets menés (admin, masqué tant qu'il vaut 0). « Notre mission » retirée.
- Qui sommes-nous : « Communes partenaires », phrase de contact retirée, légende limitée aux
  partenaires ; partenaire sans artisan·e au répertoire = « en recherche d'artisan·e·s »
  (contour rouge) ; liens OPS / OFPC mis à jour. `communeKey` : « Perly » = Perly-Certoux.
- Carte d'accueil : pastilles au même point réparties en cercle (`spreadOverlapping`).
- Carte des communes aux couleurs de la carte de MAG (`communes-palette.ts`) : or = partenaire,
  contour or = partenaire en recherche d'artisan·e·s, rose = artisan·e·s présent·e·s (non
  partenaire), légende à trois entrées. Rose et gris peu distincts pour les daltonien·ne·s
  (palette du client ; noms dans les popups et le texte pour lecteur d'écran).
- JEMA, éditions, Répertoire, Médias, Métiers et formations, Manufacto, page artisan : voir le
  commit.

### Données de prod — appliquées par Bernard le 2026-09-23

`apply.cjs` (une transaction, état avant sauvegardé) puis `backfill-descriptions.ts --apply` ;
vérifié en prod : 9 partenaires, 37 projets, édition 2022 en ligne, mention JEMA à jour,
3 fiches encore au centre de Genève, 0 texte « À propos » vide.

- **Coordonnées** : 60 fiches posées au centre de leur commune ou empilées (26 au centre de
  Genève) — d'où les « artisans manquants » sur la carte. 52 adresses géocodées via swisstopo
  (SearchServer) ; restent au centre : Julien Joselon et Maïa Kvasnikova (« en recherche de
  locaux »), fiches sans adresse (Atelier Leckie, PAC, UFGVV, OFPC, Label Genève, ARMB).
- **Mention JEMA** : `jema_participant` valait `true` pour les 145 fiches. D'après le tableau
  JEMA27_APPEL (colonnes 2022-2026) : 83 artisan·e·s à `true`, 28 à `false`. Inchangés faute de
  correspondance sûre : Marina Buckel (« Matthias Buckel et Filles » ?), Atelier ABR, Orthethic.
  Le tableau ne couvre pas les éditions avant 2022. Institutions / écoles non touchées.
- **Communes partenaires** (9, carte de MAG) : Bellevue, Carouge, Genève, Gy, Meyrin,
  Perly-Certoux, Plan-les-Ouates, Satigny, Vandœuvres — modifiables ensuite dans l'admin (Communes).
- **Projets menés = 37** : modifiable dans l'admin → « Événements & projets MAG ».
- **Édition 2022** : créée sans dates ni description (à compléter dans l'admin JEMA si MAG les a).
- **Textes « À propos » manquants** (Anne Ponthenier et 100 autres) : `long_description` vide
  en base pour 101 fiches publiées (l'import initial n'avait repris que 44 textes). Textes
  repris de l'ancien site dans `src/lib/artisan-details.ts`, reportés en base par
  `scripts/backfill-descriptions.ts` (ne remplit que les champs vides).
- Script des autres données : `apply.cjs` + `plan.json` (hors dépôt) ; état avant dans `backup-before.json` (scratchpad de session).
- **Métiers = 53 éditable dans l'admin** : demande une colonne `site_settings.crafts_count`
  (migration de prod → accord de Bernard) ; d'ici là constante dans `src/app/page.tsx`.

### À vérifier / décider (avec MAG)

- **Focus Léman Bleu** 2025 et 2026 : URLs à obtenir (candidat 2026 : article Léman Bleu du
  28.03.2026 « Entre tradition et modernité, les artisans se dévoilent aux JEMA », non confirmé).
- Programme 2022 : document issuu `mise_en_page_finale_2_0393e91b4eab4c` (publié le 08.03.2022
  par le même compte que les autres programmes) — à confirmer.
- Textes des éditions contredits par les nouveaux chiffres : 2026 (« 145 artisan·e·s »,
  « 15 ateliers participants » vs 68 participants), 2025 (12 institutions vs 6).
- 🚩 Photos fournies (Manufacto : élèves ; Métiers et formations : adolescent) : droit à
  l'image des mineur·e·s à confirmer par MAG.
- 43 descriptions déjà en base finissent par le texte du poinçon et « Cliquez ici pour en
  savoir plus. » (lien perdu) : à nettoyer avec l'accord de MAG.
- Photos Manufacto / Métiers et formations publiées sans métadonnées EXIF.
- 🚩 **Demandes hors périmètre** (engagement à cadrer) : statistiques du site reliées au fichier
  Stat_GLOBALES ; sections de fiche artisan visibles par MAG seulement (notes, contacts,
  formation, prix, participations JEMA, documents) → données personnelles (nLPD), accès,
  stockage de documents.

## 2026-09-23 — Accueil : retour à l'ancienne version (préférence du client)

### Fait

- `src/app/page.tsx` et `HomeMapSection.tsx` repris de l'avant-refonte (`1002b44`), avec les
  modifications de contenu conservées : pas de pastille « Association genevoise des métiers
  d'art », titre « Métiers d'Art Genève (MAG) » (demande d'Elsa) ; bandeau des métiers qui
  sépare les métiers cumulés (« A • B »). Image du hero en `priority`, flèches décoratives
  masquées aux lecteurs d'écran.
- Les autres pages, le header et le footer restent en style refonte.

### À vérifier / décider

- Cohérence : accueil ancienne version, reste du site en style refonte. Header / footer / autres
  pages à ramener aussi si le client préfère l'ancien ensemble (tag `restore/avant-refonte-2026-09-23`).
- ~~Bandeau JEMA~~ : remis au style ancien (entre les domaines et « Notre mission »),
  branché sur la prochaine édition de l'admin ; photo = fiche de Frédéric Taddeï (recherche par
  nom, repli `/artisan-tools.jpg`). Portraits d'artisan·e·s non remis.
- Une édition restée cochée « à venir » après ses dates s'affiche encore en « Prochaine
  édition » (accueil et /jema) : `splitJemaEditions` ne regarde que `isUpcoming`. Piste :
  ignorer une édition dont `endDate` est passée, dans `src/lib/db-data.ts`.
- Textes client de l'ancien accueil : « proche de chez vous » (→ proches), « oeuvrons »
  (→ œuvrons), badge « {n}+ artisans référencés » (« + » alors que le nombre est exact,
  non inclusif). À corriger avec l'accord de MAG.
- « Métiers MAG » (`countCrafts`, règle LOT 1) compte « A • B » comme un métier, le bandeau
  les sépare : deux définitions, à trancher.
- Code devenu inutilisé : `Marquee` variante `band`, `SectionHeader` (`ui/Editorial.tsx`),
  `.h-section-inverse`. À nettoyer si la refonte de l'accueil est abandonnée pour de bon.

## 2026-09-23 — Retours d'Elsa (mail du 19.09) : sur-titre (MAG) + liens orientation.ch

### Fait

- Accueil : plus de « Association genevoise des métiers d'art » ; « (MAG) » après le nom
  (depuis le retour à l'ancienne version : pastille supprimée, titre « Métiers d'Art Genève (MAG) »).
- /metiers-et-formations : 62 formations sur 68 renvoient à leur fiche orientation.ch (nouvel
  onglet). URLs reprises des liens de l'ancien site, résolues vers leur adresse actuelle ;
  les 41 URLs uniques vérifiées (vraie page, pas la page « n'existe pas » d'orientation.ch).

### À vérifier / décider (avec MAG)

- 6 formations sans lien, orientation.ch n'ayant plus de fiche : Couturier·ère d'intérieur AFP,
  Opérateur·trice de/en médias imprimés CFC (3 variantes de libellé), Diplôme de Modiste,
  Peintre en décor du patrimoine. Remplacer par une formation actuelle ou laisser sans lien.
- Liens approchés : « Designer HES en design mode » → filière générique Design ;
  « Costumier·ère de théâtre » → fiche de l'École de couture de Fribourg ;
  « Menuisier CFC : ébénisterie » → fiche Menuisier·ère CFC.
- Coquilles de libellés antérieures : « Courtepointière » sans CFC, « Artisane du cuir et
  textile » (→ « et du textile »), variantes « de / en médias imprimés ».
- Mention « Page mise à jour le 8 janvier 2026 » au bas du tableau : à actualiser ?
- Pied de page : les liens réseaux sociaux pointent vers les accueils génériques
  (linkedin.com, instagram.com, facebook.com, vimeo.com) — URLs des comptes MAG à obtenir.

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

- ~~Accroche « Genève, à la main. »~~ et ~~artisan·e·s mis·es en avant codé·e·s en dur~~ :
  caducs, l'accueil est revenu à l'ancienne version (voir « Accueil : retour à l'ancienne version »).
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
