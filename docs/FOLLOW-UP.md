# Follow-up — backlog versionné

Reports, points à vérifier et décisions ouvertes, par chantier (plus récent en haut).

## 2026-09-29 — Derniers retours MAG + validation de la mise en ligne

MAG valide la mise en ligne une fois ces deux points faits (branche `fix/retours-mag-29-09`) :
- Focus Léman Bleu 2026 → vimeo 1182668251 (le lien du 28.09 était une capsule pierre).
- /l-actu : événement FER du 25 septembre retiré.

### 🚩 Avant la bascule DNS de metiersdart-geneve.ch (bloquant)
- Images servies par le Joomla (`metiersdart-geneve.ch/images/…`) encore en dur dans
  `src/app/l-actu/page.tsx`, `src/app/medias/page.tsx`, `src/components/ui/PoinconBadge.tsx`,
  `src/lib/artisan-details.ts` : à la bascule, ce domaine pointe sur Vercel → images cassées.
  À migrer sur Blob (comme les 155 photos du 27.09). Idem en base : 128
  `artisans.poincon_modal_link`, 2 `medias.external_url`.
- Redirections 301 des anciennes URLs Joomla (`src/lib/redirects.ts`, fiches artisans et
  domaines) : à compléter.

### À décider (Bernard)
- **Accès admin de MAG** : `contact@metiersdart-geneve.ch` existe en base avec le rôle `user`
  (connexion OK mais renvoi vers l'accueil). Passer en `admin` = décision d'accès.
- **/l-actu et /medias codées en dur** : l'admin Actualités / Médias écrit en base, mais les
  pages publiques ne la lisent pas (`src/lib/queries.ts` non branché). MAG ne peut donc pas
  modifier l'Actu ni les Médias elle-même. À brancher (avant ou après ouverture).

## 2026-09-28 — Retours de MAG avant ouverture (mail « Re: MAG: Retour nouveau site internet »)

Branche `feat/retours-mag-28-09`.

### Fait (code)
- Accueil : bouton « Répertoire complet » → /repertoire ; « Communes » = artisans + écoles
  formatrices + institutions culturelles (`countMagCommunes`, 22) ; ligne « Les autres
  répertoires » → 4 pages statiques `/repertoire/<slug>` (mêmes URLs que l'ancien site) ;
  visuel JEMA 2027 (`public/jema-2027.png`) ; « Trouver un atelier » masqué (commentaire en place).
- Répertoire : paragraphe et bouton carte retirés (`PageHero compact`).
- JEMA : Pavillon SICLI sans chiffres ; Focus Léman Bleu 2026 (vimeo 1191922591) et 2025
  (1076326732) ; `PierreFocus` = 6 participants 2026 (`pickByNames`).
- Manufacto : sur-titre « La fabrique des savoir-faire ».
- Cartes : `hasCoords`, les fiches sans coordonnées ne partent plus en (0, 0).

### Données de prod — `scripts/retours-mag-2026-09-28.ts` (à blanc : 3 lignes)
JEMA 2022 = 1er – 3 avril 2022 ; Orthethic `jema_participant = false` ; Maïa Kvasnikova sans
coordonnées. **À lancer avec `--apply` après le deploy du code `hasCoords`, accord Bernard.**

### À vérifier / décider
- ~~Titres Vimeo sans mention de Léman Bleu~~ : MAG (29.09) s'était trompée de lien pour 2026 →
  vimeo 1182668251 (« Capsule - JEMA 2026 ») ; 2025 inchangé.
- Noms des 6 participants pierre : présents dans les données statiques, non vérifiés en base
  (un nom sans fiche est ignoré silencieusement). Liste dupliquée dans `PierreFocus.tsx` et son test.
- Maïa Kvasnikova : remettre ses coordonnées quand elle aura ses nouveaux locaux. Son
  ancienne adresse reste affichée sur sa fiche (script : coordonnées seulement) — à vider si
  MAG le souhaite. L'admin ne re-géocode plus une adresse inchangée (corrigé en review).
- Admin : impossible de vider des coordonnées (`latitude: form.latitude || undefined` →
  PATCH sans le champ). Seul un script retire une fiche des cartes.
- **Affiche JEMA 2027 en dur** sur l'accueil (image + alt « 19-20-21 mars 2027 ») alors que le
  texte suit l'édition à venir : à remplacer **après le 21.03.2027**.
- Page `/repertoire/<slug>` : sur-titre avec deux pictos (✦ + icône) — à valider visuellement.
- Anciennes URLs de domaine (`/repertoire/art-du-textile`…) et fiches Joomla : 404, les
  redirections (`src/lib/redirects.ts`) restent à compléter **avant la bascule DNS**.
- 🚩 Partie non visible (statistiques, sections MAG seulement) : MAG demande une offre et un
  RDV — décision Bernard.

## 2026-09-27 — Next 16 + retrait de SimpleWebAuthn (suite de l'audit npm du 23.09)

Branche `chore/upgrade-next16-webauthn14`, construite sur `feat/metiers-editables`.

### Fait

- `next` 15.5.25 → **16.3.6**, `eslint-config-next` 16.3.4 → **16.3.6** (enfin alignés) ;
  `react` / `react-dom` restent en 19.2.8 (Next 16 accepte `^19`). `next-auth` 5.0.0-beta.32
  déclare `next ^16` en peer : inchangé. `@vercel/analytics`, `framer-motion`, `react-leaflet` :
  peers satisfaits, rien à toucher.
- `src/middleware.ts` → **`src/proxy.ts`** (convention Next 16, fonction `proxy`, runtime
  Node.js). Logique identique : présence du cookie de session NextAuth, sans requête en base ;
  les pages et route handlers gardent `requireAdmin*()`.
- `next.config.ts` : bloc `webpack` (fallback `pg-native`) supprimé — Turbopack est le bundler
  par défaut et `next build` refuse une clé `webpack`. `pg` reste en `serverExternalPackages`,
  donc `pg-native` n'est jamais résolu par le bundler : build sans avertissement.
- `tsconfig.json` : `jsx` passé de `preserve` à `react-jsx`, modification imposée par
  `next build` (commitée pour garder l'arbre propre).
- **`@simplewebauthn/server` et `/browser` retirés** au lieu d'être montés en v14. Prémisse
  du relevé du 23.09 (« passkeys admin ») fausse : le provider Passkey a été enlevé le 09.09
  (`a76e214`, erreur UnknownAction d'Auth.js beta), plus aucun import dans `src/`, et
  `@auth/core` 0.41.3 (dernière publiée) exige toujours `^9` en peer — une v14 aurait créé un
  conflit de peers sans rien sécuriser. Connexion admin = lien magique Resend uniquement.
  Table `authenticator` conservée (l'adapter la référence), présumée vide en prod.
- Défauts Next 16 acceptés sans code : `images.minimumCacheTTL` 60 s → 4 h (images Blob à
  URL immuable), `images.qualities` → `[75]` (aucune prop `quality` dans le code),
  `imageSizes` sans 16 px, `maximumRedirects` 3. Pas de `scroll-behavior: smooth` global, pas
  de `next lint` (le script `lint` appelle déjà ESLint), pas d'API de requête synchrone.
- Vérifié en local : `tsc`, `eslint` (0 erreur, 6 avertissements antérieurs), `npm test`
  (71/71), `next build` statique sans `DATABASE_URL` (194 pages, ISR 1 min sur l'accueil),
  puis `next start` + `scripts/check-deploy.sh` : 200 sur les pages publiques, vrais 404,
  `/admin` → 307 vers `/auth/signin`, `Cache-Control: s-maxage=60` sur l'accueil.
- `npm audit` après : **4 modérés, tous dev-only** — `drizzle-kit` 0.31 → `@esbuild-kit` →
  `esbuild` ≤ 0.24.2 (serveur de dev d'esbuild, non utilisé ici). Le « fix » proposé est une
  rétrogradation en drizzle-kit 0.18 : refusé. `postcss`, `next`, `@auth/core` / `next-auth`
  et SimpleWebAuthn ont disparu du rapport.

### À vérifier (après deploy)

- ~~Node ≥ 20.9 sur le projet Vercel~~ : Node.js 24.x (vérifié), exigence figée dans `engines`.
  Premier build Turbopack à regarder en preview. Le proxy ne tourne plus que sur `/admin`
  (en Next 16 il s'exécute en Node : inutile devant chaque page publique).
- `scripts/check-deploy.sh` sur la preview puis la prod (nouvelle entrée « ƒ Proxy » dans le
  build ; les logs Vercel doivent montrer le proxy sur `/admin`).
- Connexion admin par lien magique (Bernard), puis un enregistrement dans l'admin.
- Un coup d'œil sur `/qui-sommes-nous` (carte Leaflet, composant client) et `/repertoire`
  (framer-motion) : mêmes bundles, mais nouveau bundler.
- Rien à tester côté passkeys : la fonctionnalité n'existe pas en prod. Si on veut la
  réactiver un jour, attendre un `@auth/core` compatible SimpleWebAuthn ≥ 13 et rouvrir le
  UnknownAction du 09.09.

## 2026-09-27 — Backlog traité (branche `chore/backlog-2026-09-27`)

Fait en prod (accord Bernard du 27.09) :
- `crafts_count` créée, 53 (`migrate-crafts-count.ts --apply`) ; « Perly » → « Perly-Certoux »
  (`fix-perly-commune.ts --apply`, fiche marina-buckel) ; photos de l'ancien site Joomla
  copiées sur Vercel Blob (`migrate-images-to-blob.ts`, store `yemBb8auYuh5E2PU`, sauvegardes
  et journal dans `backups/`, hors dépôt ; retour arrière : `--rollback <…>.applied.json`).

Fait en code : PUT des paramètres (`parseSettingsInput`, testé), tableau de bord admin
(`requireAdmin`, requêtes en parallèle, valeurs initiales en props, alerte « fiches sans texte
À propos »), couleur / champs JEMA vidables, `programUrl` en http(s) seulement, commune
d'artisan choisie parmi la table `communes`, nom de commune validé contre les 45 territoires,
cases à cocher `accent-mag-red`, /qui-sommes-nous en `SELECT DISTINCT`, édition JEMA terminée
jamais « à venir » (et rangée dans les passées), code mort de la refonte retiré, `escapeHtml`
unique (`src/lib/html.ts`, 4e copie partielle trouvée dans `ArtisanMap.tsx`), Marquee avec
bouton pause et `prefers-reduced-motion`, placeholders à 5.5:1, `src/app/error.tsx`, test du
chemin « base en erreur », CSP en Report-Only (+ `/api/csp-report`), alias « Perly » retiré,
socle `scripts/lib/db-script.ts` (endpoint direct), seed qui ne recrée plus ce que l'admin a
supprimé (et ne duplique plus partenaires / comité / Manufacto), warnings ESLint soldés.
Mises à jour : branche `chore/upgrade-next16-webauthn14` (next 16, proxy limité à `/admin`,
SimpleWebAuthn retiré car inutilisé) — voir sa propre section.

Reste ouvert :
- **CSP** : lire les rapports (`[csp-report]` dans les logs Vercel) quelques jours, compléter
  la liste, puis passer en `Content-Security-Policy` bloquante.
- **Liens vers l'ancien site** non migrés (pages, pas des fichiers) : 128
  `artisans.poincon_modal_link`, 2 `medias.external_url` — à rediriger ou retirer avant
  l'arrêt de Joomla. Garder Joomla en ligne ≥ 1 h après la migration des photos (cache ISR).
- `src/db/seed-actu-medias.ts` réinsère des URLs Joomla : à mettre à jour ou retirer.
- Communes : pas de contrôle de doublon au POST (nom / slug uniques → 500) ; renommage
  possible par l'API seulement (pas de champ nom dans l'admin).
- Décisions MAG / Bernard listées plus bas (textes, liens, photos de mineur·e·s, 🚩 demandes
  hors périmètre, secret « Protection Bypass », base pour les previews, vérifs admin en prod).

## 2026-09-27 — Espace Communauté : accès privé par cookie signé

Décision Bernard : contenu **privé**, soumission réservée aux membres aussi. Avant, le mot de
passe n'était vérifié que côté client : `GET /api/annonces` livrait toutes les annonces
publiées à n'importe qui. Désormais :

- Verify OK → cookie `mag_communaute` httpOnly, Secure (prod), SameSite=Lax, 30 jours, signé
  HMAC (clé dérivée d'`AUTH_SECRET`) sur l'expiration + le mot de passe **courant**. Changer
  le mot de passe dans l'admin déconnecte tous les membres (voulu, à dire à MAG au
  renouvellement annuel).
- `GET` et `POST /api/annonces` → 401 sans cookie valide, 503 si la base est injoignable.
- Verify durci : corps invalide → 400, comparaison à temps constant, 10 tentatives / 15 min
  par IP (comptées avant tout `await`, une rafale parallèle ne passe pas) → 429 + `Retry-After`.
  Soumissions : 5 / heure par IP (chacune envoie un mail à MAG).

Reportés / à vérifier :
- **Connexion réussie non testée de bout en bout** (pas de mot de passe de test hors prod) :
  à faire une fois en prod — se connecter, voir les annonces, recharger (session gardée),
  Quitter. Soumission : ne pas tester en prod sans prévenir MAG (mail + annonce en attente).
- **Mot de passe commun** : le seed met « MAG 2026 ». Un mot de passe du type « MAG + année »
  se devine en quelques essais, quel que soit le limiteur. Choisir un mot de passe moins
  prévisible au prochain renouvellement (décision MAG / Bernard).
- **Limiteurs en mémoire, par instance serverless** : un frein, pas une limite globale. Si abus
  constaté : règle de rate limit Vercel Firewall sur `/api/communaute/verify`, ou stockage
  partagé (Upstash).
- IPv6 non regroupées par /64 dans le limiteur (une machine peut tourner sur ses adresses).
- Cookie sans préfixe `__Host-` (refusé en http local) : l'ajouter en prod si des
  sous-domaines de metiersdart-geneve.ch hébergent un jour du contenu tiers.
- Mot de passe stocké en clair dans `site_settings` (l'admin doit pouvoir le relire pour le
  communiquer) : le hacher = changement de schéma + perte de la relecture, pas prévu.
- Catégorie d'annonce non validée côté serveur contre la liste (liste côté client seulement).
- Pas de tests des routes (`communauteAccess`, verify) : seul `communaute-token` est testé ;
  routes contrôlées à la main en local (401 / 400 / 429 / cookie effacé).

## 2026-09-27 — Code review (max) du chantier « Métiers éditables » : corrections et reports

- **Migration avant deploy, désormais imposée** : `getSiteSettings` relance l'erreur (comme
  db-data) → tant que `crafts_count` manque, le prerender de l'accueil échoue et le build de
  prod aussi (le déploiement précédent reste en ligne). En dev local (base = prod), l'accueil
  plante aussi tant que la migration n'est pas appliquée. État au 27.09 : colonne absente en
  prod (lecture à blanc du script), ligne `default` à 37 projets.
- Corrigés : saisie brute des chiffres (plus de retour forcé à 0), envoi des seuls champs
  modifiés, plage 0 – 2 147 483 647 contrôlée et annoncée, champs bloqués pendant
  l'enregistrement, messages d'erreur en français, région « Enregistré » annoncée, échec de
  lecture signalé (plus de 0/0 ni de mot de passe vide trompeurs), « Métiers » à 53 sans base
  (previews), `/api/communaute/verify` en 400 sur corps invalide, scripts (`lock_timeout`,
  relecture après COMMIT, `to_regclass`, hôte affiché sans l'URL, backfill `--apply` qui
  n'annonce plus « À blanc »).
- Reportés (mineurs de review) — **tous traités le 27.09**, voir ci-dessus :
  - PUT des paramètres : liste des champs écrite deux fois (`values` / `set`) ;
    `const patch = {…}` suffirait (drizzle ignore les `undefined`).
  - Tableau de bord admin : deux GET identiques de `/api/admin/settings` (un par carte).
    Passer les valeurs initiales en props demande un `requireAdmin()` dans `admin/page.tsx` :
    le layout ne protège pas un rendu RSC partiel.
  - Scripts : chargement d'env, client `pg` et transaction à blanc dupliqués, et écritures de
    prod via le pooler → helper commun sur l'endpoint direct au prochain script.
  - Aucun test ne couvre le PUT partiel (le mot de passe ne remet plus les projets à 0).
  - Ligne vide en fin de `route.ts` ; repli `?? STATS_GRID[4]` inatteignable.
- À vérifier : annonce de « Enregistré » aux lecteurs d'écran (NVDA + Chrome, VoiceOver +
  Safari).
- ~~Lecture publique de `/api/annonces` et essais illimités sur `/api/communaute/verify`~~ :
  réglé le 27.09 (« Espace Communauté : accès privé par cookie signé », `7298abe`).

## 2026-09-24 — Métiers éditables dans l'admin (« MAG en chiffres »)

- Colonne `site_settings.crafts_count` (déclarée dans `src/db/schema.ts`), créée et initialisée
  à 53 par `npx tsx scripts/migrate-crafts-count.ts --apply` — **à lancer avant le deploy**
  (le code lit la colonne ; `db:push:dry` ne montre que cet ajout + le faux positif auth).
- Admin : « MAG en chiffres » (métiers + projets menés), enregistrement bloqué tant que les
  valeurs n'ont pas été lues. Accueil : chiffre masqué s'il est vide ou à 0.
- Corrigé en passant : enregistrer le mot de passe Communauté remettait « projets menés » à 0
  (PUT non partiel). La vérification du mot de passe ne lit plus que sa colonne.
- **Piège Neon** : ne jamais faire `SET default_transaction_read_only` (ni autre `SET` de
  session) à travers le pooler (`-pooler`) — le réglage peut rester sur une connexion reprise
  par la prod. Lecture à blanc = `BEGIN TRANSACTION READ ONLY … ROLLBACK` (scripts corrigés).
  Des lectures à blanc à l'ancienne ont tourné les 23-24.09 : aucune erreur « read-only » dans
  les erreurs d'exécution Vercel sur 48 h.

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
- ~~/jema, « Merci à nos partenaires » : logos ?~~ MAG (28.09) : pas de logo pour le moment.
- Stat_GLOBALES vs site : « Au Bon Relieur » (Charles Duch, Vernier) absent du site ;
  « Duo d'art » (Vernier) absent du tableau. Même entité ? — MAG (28.09) : Au Bon Relieur =
  Atelier ABR ; ~~Duo d'art~~ : bien dans Stat_GLOBALES (feuille Artisan·e·s, Vernier), version reçue le 29.09.
- Filtre commune du répertoire affiche « Perly » (alias `communeKey`, voir plus bas).

## 2026-09-24 — Code review (xhigh) du chantier « retours MAG » : reports

Corrigés : texte JEMA 2026 sans chiffres contradictoires, /medias régénéré toutes les heures,
backfill sans correspondance par mots-clés, description de repli des éditions (2022),
positions des pastilles stables au filtre, légende / texte lecteur d'écran fusionnés comme la
carte (`mergeCommunes`), liseré des pastilles, bouton « proches de chez vous » → `#carte`,
`countCrafts` retiré, `dbConfigured` partagé.

Reportés :
- ~~**Alias « Perly »**~~ (fait le 27.09) dans `communeKey` : corriger la donnée (fiche en « Perly » →
  « Perly-Certoux », écriture en base) et faire choisir la commune dans la liste des 45 dans
  l'admin artisan au lieu d'un champ libre ; retirer ensuite l'alias.
- ~~**Textes « À propos » vides**~~ (alerte sur le tableau de bord admin, 27.09) : le test ne couvre que les données statiques ; contrôle en
  base = `npx tsx scripts/backfill-descriptions.ts` à blanc (« 0 sans texte »). À brancher
  dans un contrôle périodique si des fiches sont créées sans texte.
- ~~**Qui sommes-nous**~~ (fait le 27.09) charge toute la liste des artisan·e·s pour en déduire les communes :
  une requête `SELECT DISTINCT commune` suffirait (gain négligeable à 145 fiches).
- ~~Photos de mineur·e·s : consentement à confirmer par MAG~~ : confirmé (28.09).

## 2026-09-23 — Retours de l'équipe MAG (mail « MAG: Retour nouveau site internet »)

### Fait (code)

- Accueil : pastille « Bienvenue chez MAG », bouton « Trouver les artisanes et artisans proches
  de chez vous », badge sans « + », « MAG en chiffres » = artisan·e·s (calculé) · métiers
  (admin, nomenclature MAG) · communes où exercent les artisan·e·s (calculé,
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
- **Projets menés = 37** : modifiable dans l'admin → « MAG en chiffres ».
- **Édition 2022** : créée sans dates ni description (à compléter dans l'admin JEMA si MAG les a).
- **Textes « À propos » manquants** (Anne Ponthenier et 100 autres) : `long_description` vide
  en base pour 101 fiches publiées (l'import initial n'avait repris que 44 textes). Textes
  repris de l'ancien site dans `src/lib/artisan-details.ts`, reportés en base par
  `scripts/backfill-descriptions.ts` (ne remplit que les champs vides).
- Script des autres données : `apply.cjs` + `plan.json` (hors dépôt) ; état avant dans `backup-before.json` (scratchpad de session).
- **Métiers = 53 éditable dans l'admin** : accord de Bernard le 2026-09-24, voir
  « Métiers éditables » ci-dessus.

### À vérifier / décider (avec MAG)

- ~~**Focus Léman Bleu** 2025 et 2026 : URLs à obtenir~~ : fournies le 28.09 (voir retours du 28.09).
- ~~Programme 2022 : document issuu `mise_en_page_finale_2_0393e91b4eab4c` — à confirmer~~ : confirmé (28.09).
- Textes des éditions contredits par les nouveaux chiffres : 2026 (« 145 artisan·e·s »,
  « 15 ateliers participants » vs 68 participants), 2025 (12 institutions vs 6).
- ~~🚩 Photos fournies (Manufacto : élèves ; Métiers et formations : adolescent) : droit à
  l'image des mineur·e·s à confirmer par MAG~~ : « tout est en ordre » (MAG, 28.09).
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
- ~~Une édition restée cochée « à venir » après ses dates~~ (corrigé le 27.09) s'affiche encore en « Prochaine
  édition » (accueil et /jema) : `splitJemaEditions` ne regarde que `isUpcoming`. Piste :
  ignorer une édition dont `endDate` est passée, dans `src/lib/db-data.ts`.
- ~~Textes client de l'ancien accueil~~ (faits les 23-24.09) : « proche de chez vous » (→ proches), « oeuvrons »
  (→ œuvrons), badge « {n}+ artisans référencés » (« + » alors que le nombre est exact,
  non inclusif). À corriger avec l'accord de MAG.
- ~~« Métiers MAG » (`countCrafts`, règle LOT 1)~~ (`countCrafts` retiré le 24.09) compte « A • B » comme un métier, le bandeau
  les sépare : deux définitions, à trancher.
- ~~Code devenu inutilisé~~ (retiré le 27.09, accueil refonte abandonné) : `Marquee` variante `band`, `SectionHeader` (`ui/Editorial.tsx`),
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

- ~~**Aucune commune n'est marquée « soutient MAG » en base**~~ (9 partenaires depuis le 23.09) (45/45 à `false`)** : la carte est
  entièrement grise tant que MAG ne coche pas ses communes dans l'admin.
- Millésime 2015 choisi pour avoir les communes **sans le lac** : dès 2016, swisstopo inclut la
  part de Léman de chaque commune riveraine (Genève couvrirait la Rade). Limites terrestres
  quasi inchangées depuis. Pour la version officielle avec le lac :
  `npx tsx scripts/build-communes-geo.ts 2026`.
- ~~Renommer une commune~~ (nom validé contre les 45 territoires le 27.09) dans l'admin (ex. « Ville de Genève ») la fait tomber en repli point sans
  signal. Piste : stocker le n° OFS en base, ou choisir le nom parmi les 45 dans l'admin.

### Skippé / hors périmètre

- ~~`escapeHtml` existe en 3 exemplaires~~ (factorisé le 27.09) (`ArtisansMap.tsx`, `api/annonces/route.ts`,
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
- ~~Photos des fiches encore servies depuis metiersdart-geneve.ch~~ (migrées sur Blob le 27.09) (Joomla) : à migrer vers Blob
  avant l'arrêt de l'ancien site. `canOptimizeImage()` passe en `unoptimized` tout hôte non déclaré.
- Écart assumé au design system : photos à coins quasi francs (4px) au lieu de 24px.
- ~~Vérifié en HTTP seulement~~ (rendu vérifié au navigateur le 27.09, desktop + mobile) (preview + prod : pages 200, 50/50 images) ; **rendu visuel pas
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

**Traité le 2026-09-27** (section dédiée en tête de fichier) : Next 16 installé, SimpleWebAuthn
retiré (jamais utilisé : provider Passkey enlevé le 09.09), `eslint-config-next` aligné. Reste
uniquement `esbuild` via drizzle-kit 0.31 (dev only). Relevé d'origine conservé ci-dessous :

- **`@simplewebauthn/server` ≤ 13.3.1** (projet en ^9, passkeys admin) : chaîne des certificats
  d'attestation insuffisamment vérifiée (GHSA-6hxq-p678-4hr2). Correctif = v14, cassant ; à évaluer
  selon la politique d'attestation utilisée à l'enregistrement.
- **`postcss` ≤ 8.5.22** embarqué par `next` (élevé, côté build) : correctif via next 16, cassant.
- **`esbuild` ≤ 0.24.2** via `@esbuild-kit` (dépendance de drizzle-kit 0.31, dev uniquement,
  concerne le serveur de dev d'esbuild, non utilisé ici). Disparaît avec drizzle-kit 1.0.
- Aussi : `next` (modéré), `@auth/core` / `next-auth` (faible, via SimpleWebAuthn) ; détail : `npm audit`.
- Hors audit : `eslint-config-next` 16.3.4 face à `next` 15.5 (versions désalignées).

### Skippé / hors périmètre

- **Pas de Content-Security-Policy** (Report-Only posée le 27.09) : une CSP `script-src` sans `unsafe-inline` aurait
  neutralisé ce `onclick`. À étudier avec GTM / Stape / CookieScript (scripts inline).
- ~~**Impossible de vider la couleur**~~ (corrigé le 27.09) d'une catégorie depuis l'admin : un champ vide part en
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

- ~~**Marquee**~~ (bouton pause + mouvement réduit, 27.09) : défilement automatique sans pause > 5 s (WCAG 2.2.2, niveau A) ; framer-motion
  ignore la règle CSS `prefers-reduced-motion` → `useReducedMotion()` à brancher.
- ~~**Placeholders**~~ (mag-gray, 27.09) des champs : `currentColor` à 50 % ≈ 2.75:1 sur blanc (défaut Tailwind v4).
- ~~**Cases à cocher admin**~~ (27.09) (`ActuModal`, `ArtisanModal`, `JemaModal`) : `border-mag-cream`,
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

- ~~**Rendu en prod**~~ (vérifié au navigateur le 27.09, desktop + mobile) : liens du header plus sombres, survol blanc souligné dans le footer,
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

- ~~**Seed qui recrée ce que l'admin a supprimé**~~ (tables remplies seulement si vides, `--force`, 27.09) : `onConflictDoNothing` n'écrase plus
  les modifications, mais une édition JEMA supprimée revient au prochain seed, et un
  artisan dont le slug a changé est réinséré sous l'ancien slug (`published: true`).
  Piste : ne seeder artisans / éditions JEMA que si la table est vide, ou flag `--force`.
- ~~**Pas de `src/app/error.tsx`**~~ (ajouté le 27.09) : une erreur DB sur une page rendue à la demande
  (slug ou année pas encore en cache) affiche la page d'erreur brute de Next.
- ~~**Soft 404**~~ (corrigé le 23.09) : `notFound()` répond HTTP 200 (page 404 + `noindex`) parce que
  `src/app/loading.tsx` à la racine lance le streaming avant. Ex. `/artisans/slug-inexistant`,
  `/jema/2027`. Comportement antérieur à ce chantier.
- ~~**JemaModal**~~ (27.09) : `description` et `programUrl` ne peuvent pas être vidés (`|| undefined`).
- ~~**`programUrl` en `href`**~~ (validé à l'écriture et au rendu, 27.09) sans validation `^https?://` (React 19 bloque déjà `javascript:`).
- ~~**Pas de test du chemin « base configurée mais en erreur »**~~ (`db-data-error.test.ts`, 27.09) (nécessite un mock de `@/db`).
- ~~**`jemaParticipant`**~~ (case ajoutée le 24.09) n'est pas éditable dans l'admin (le bandeau JEMA des fiches en dépend).

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
