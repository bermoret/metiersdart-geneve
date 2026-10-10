# Plateforme de gestion interne MAG — Cadrage et mapping (LOT A1)

**Date :** 10 octobre 2026 (remplace la proposition préliminaire de septembre, conservée en annexe).
**Objet :** saisie unique des artisans dans l'admin du site (onboarding, pièces, suivi), dont
découlent la fiche publique, les compteurs et l'export Excel (LOT A2).
**Statut :** mapping à **valider par Bernard** avant la migration (`db:push`).
**Sources :** formulaire « Check-list intégration nouvel artisan » du 04.05.26 (A4 recto verso),
`Stat_GLOBALES.xlsx` (MàJ 01.09.26), PV de la séance MAG du 09.10.2026, prompt LOT A1. Les trois
fichiers sont dans `docs/mag-inputs/` (hors git : données personnelles).

---

## 1. Constat

Un artisan est aujourd'hui intégré en trois temps : formulaire papier rempli pendant la visite
d'atelier, recopie dans l'Excel (onglet « Artisan·e·s », 121 lignes, 12 colonnes), puis création
de la fiche sur le site. Les écarts entre fichier et site viennent de cette double saisie.

Ce que contient réellement l'Excel pour un artisan (onglet « Artisan·e·s ») : commune, date
d'intégration, domaine, métier, nom, prénom, raison sociale, téléphone, mail, adresse,
commentaires (11 lignes, datées « jj.mm.aa : … »), entreprise formatrice (OUI / à valider par
l'OFPC). L'onglet « GLOBAL » ajoute, par artisan, le type de poinçon (colonnes A / B / E =
Atelier 66 / Boutique 29 / Entreprise 19, total 114) et la caisse AVS (17 renseignées : Ocas,
FER CIAM, Suva…). Les autres onglets sont des listes (métiers, communes, écoles, institutions,
partenaires, capsules, événements) ou des tableaux de synthèse : ils relèvent de l'export (A2).

121 lignes dans « Artisan·e·s » pour 114 artisans comptés dans « GLOBAL » : les 7 lignes
excédentaires correspondent vraisemblablement aux sorties notées en commentaire (faillite,
retraite, liquidation, départ à l'étranger, retrait du catalogue). À confirmer au rapprochement.

## 2. Principes retenus

1. **Table dédiée `artisan_dossiers`**, liée 1:1 à `artisans` (`artisan_id` nullable), plutôt que
   des colonnes internes sur `artisans`. Raison : `src/lib/queries.ts` et plusieurs lectures de
   `db-data.ts` sélectionnent des lignes entières de `artisans` (`db.select().from(artisans)`) ;
   une colonne interne ajoutée là finirait dans les payloads des pages publiques. Avec une table
   séparée, aucune route ni page publique ne peut y accéder par inadvertance : la garantie est
   structurelle, et le test de non-exposition la vérifie.
2. **Le dossier précède la fiche.** Un artisan en évaluation n'a pas de fiche publique. Le bouton
   « Éligible » crée la fiche (non publiée) à partir du dossier.
3. **Coordonnées :** le formulaire n'a qu'un téléphone et un mail, avec une case « accepte que
   son numéro et son mail soient visibles sur sa page ». Ils sont stockés dans le dossier ; ils ne
   sont recopiés sur la fiche publique que si le consentement est coché.
4. **Désactiver dépublie, ne supprime jamais.** La fiche reste en base pour les statistiques
   (sorties par année et motif) et une réactivation éventuelle.
5. **Journal en ajout seul** (`artisan_journal`) : rien n'y est modifié ni effacé depuis l'admin.
6. **Le formulaire évoluera** : colonnes explicites pour ce qui sert aux statistiques et aux
   écrans, `jsonb` `extra` pour les questions ajoutées plus tard sans migration.

## 3. Statuts et transitions

| Statut | Signification | Fiche publique |
|--------|---------------|----------------|
| `en_evaluation` | Dossier ouvert, visite faite ou à faire, critères en cours | aucune |
| `eligible` | Critères validés (bouton « Éligible ») | créée, `published = false` |
| `actif` | Artisan intégré (bouton « Activer ») | `published = true` |
| `desactive` | Sorti (faillite, fermeture, retraite, retrait…) | `published = false`, conservée |

Transitions et effets (chaque action écrit une entrée de journal, avec l'auteur) :

- `en_evaluation` → `eligible` : crée la fiche pré-remplie (nom public, métier, domaine, commune,
  adresse, site, poinçon ; téléphone et mail seulement si consentement), `published = false`.
  Journal `eligibilite`.
- `eligible` → `actif` : `published = true`, `integrated_at` = aujourd'hui si vide. Journal
  `activation`. Les compteurs publics suivent automatiquement (ils ne comptent que les publiés).
- `actif` → `desactive` : motif obligatoire (faillite, fermeture d'atelier, retraite, départ,
  retrait du catalogue, autre) + date, `published = false`. Journal `desactivation`.
- `desactive` → `actif` : réactivation, `published = true`. Journal `activation`.
- Depuis n'importe quel statut → `desactive` (un dossier éligible jamais activé peut être clos).
- Changement d'adresse dans la fiche (PATCH `/api/admin/artisans/[id]`) : si un dossier est lié,
  entrée `changement_adresse` automatique (ancienne → nouvelle adresse) ; le re-géocodage
  existant s'applique.
- « Fermeture » (journal `fermeture`, date + motif) : note une fermeture d'atelier sans
  obligatoirement désactiver (activité suspendue, restructuration).

## 4. Mapping formulaire → base

Le formulaire est reproduit dans le même ordre à l'écran. Colonne « Public » : copié sur la
fiche au passage « Éligible » (puis la fiche fait foi). Colonne « Stats » : sert au LOT A2.

### En-tête

| Question du formulaire | Colonne | Type | Public | Stats |
|---|---|---|---|---|
| Source | `source` | text | | ✓ (origine des contacts) |
| Prénom, nom | `first_name`, `last_name` | varchar | → `artisans.name` (composé) | |
| Nom atelier | `workshop_name` | varchar | → `artisans.name` (composé) | |
| Domaine | `category_id` | FK `categories` | → `artisans.category_id` | ✓ |
| Métier d'art | `craft` | varchar | → `artisans.craft` | ✓ |
| Téléphone | `phone` | varchar | → `artisans.phone` si consentement | |
| E-mail | `email` | varchar | → `artisans.email` si consentement | |
| Adresse professionnelle | `street` | varchar | → `artisans.address` (composé) | |
| NPA / Ville | `postal_code`, `city` | varchar | → `artisans.address` (composé) | |
| Commune | `commune` | varchar (table `communes`) | → `artisans.commune` | ✓ |

Nom public composé : `workshop_name — Prénom Nom` si atelier, sinon `Prénom Nom` (même forme
que les fiches existantes : « Bespoak — Jason Lugrin », « Sylvio Asseo »). Modifiable ensuite.

### Répertoire

| Question | Colonne | Type |
|---|---|---|
| Métier d'art reconnu par l'INMA | `inma_recognized` | boolean (null = non renseigné) |
| Fait partie de l'ASMA (sinon dossier à envoyer après intégration) | `asma_member` | boolean |
| Accepte téléphone et mail visibles sur sa page | `contact_public_consent` | boolean |

### Critères d'intégration MAG

| Question | Colonne | Type |
|---|---|---|
| Activité exercée à Genève | `activity_in_geneva` | boolean |
| Essentiellement artisanale / manuelle, non industrielle | `mainly_manual` | boolean |
| Professionnel·le : source de revenu principale | `main_income` | boolean |
| Autodidacte (si oui, CV ou références) | `self_taught` | boolean |
| Entreprise : secteur dédié aux métiers d'art (OUI / NON / NA) | `company_dedicated_sector` | boolean, null = NA |
| Nom de l'entreprise | `company_name` | varchar |
| Inscription au RC | `rc_registered` | boolean |
| Forme juridique | `legal_form` | varchar |
| Date de l'inscription | `rc_registered_at` | date |
| Affilié·e à une caisse AVS (OUI / NON / NA) | `avs_affiliated` | boolean, null = NA |
| Laquelle (+ attestation) | `avs_fund` | varchar ; attestation → pièce jointe |
| Reconnu·e au sein de son domaine | `recognized_in_field` | boolean |
| A un site internet | `has_website` + `website` | boolean + varchar → `artisans.website` |
| A des réseaux sociaux | `has_social_media` + `social_links` | boolean + jsonb → `artisans.social_links` |

### Éligibilité

| Question | Colonne | Type |
|---|---|---|
| Éligible selon les critères | `status` (voir § 3) | enum |
| Rendez-vous dans l'atelier | `workshop_visit_at` | date |
| Visité par (PV du 09.10) | `visited_by` | varchar |

### Formations

| Question | Colonne | Type |
|---|---|---|
| Formation(s) | `has_training` + `training_details` | boolean + text (parcours) |
| Lauréat d'un prix (artisanat), lequel | `award_winner` + `award_details` | boolean + text |
| Autorisation entreprise formatrice | `trainer_company` + `trainer_company_note` | boolean + text (« à valider par l'OFPC », « confirmation reçue le … ») |

### Divers projets

| Question | Colonne | Type |
|---|---|---|
| Visite de classes (min / max) | `class_visits`, `class_visits_min`, `class_visits_max` | boolean, integer, integer |
| Visite grand public (min / max) | `public_visits`, `public_visits_min`, `public_visits_max` | boolean, integer, integer |
| Présentation du métier : conférence | `talk_conference` | boolean |
| Présentation du métier : table ronde | `talk_round_table` | boolean |
| Présentation du métier : classe | `talk_class` | boolean |
| JEMA | `jema_interest` | boolean (distinct de `artisans.jema_participant`, qui est la mention publique) |
| Écoles & Artisans | `ecoles_artisans_interest` | boolean |

### Fin de formulaire

| Question | Colonne | Type |
|---|---|---|
| Poinçon : Atelier / Entreprise / Boutique | `poincon_type` | varchar → `artisans.poincon_type` |
| Association professionnelle, laquelle / lesquelles | `professional_association` + `professional_associations` | boolean + text |
| Consentement newsletter Mailchimp | `newsletter_consent` | boolean |
| Photo HD carrée + texte ~500 signes à demander | pas de colonne : se lit sur la fiche (`image_url`, `long_description`) | |
| Divers (PV) | `notes` | text, libre |
| Questions ajoutées plus tard | `extra` | jsonb `{ clé: valeur }` |

### Suivi (hors formulaire)

| Donnée | Colonne | Type | Origine |
|---|---|---|---|
| Date d'intégration | `integrated_at` | date | Excel « DATE INTÉGRATION » ; sinon date d'activation |
| Date et motif de sortie | `deactivated_at`, `deactivation_reason` | date, varchar | action « Désactiver » |
| Création / mise à jour | `created_at`, `updated_at`, `created_by` | timestamp, varchar | automatique |

## 5. Mapping Excel → base (reprise de l'historique)

Onglet « Artisan·e·s », ligne 3 = en-têtes, données dès la ligne 4 :

| Colonne Excel | Destination | Règle |
|---|---|---|
| A Commune | `artisans.commune` (fiche) / `dossier.commune` | nom ramené à la table `communes` (`findCommuneName`) ; « Chêne-bourg » → « Chêne-Bourg » |
| B DATE INTÉGRATION | `dossier.integrated_at` | date Excel (numéro de série) → date |
| C DOMAINE | `artisans.category_id` si vide, `dossier.category_id` | libellés Excel ≠ site : « Art de l'horlogerie / bijouterie » → « Art de l'horlogerie et de la bijouterie », « Art de la conservation et restauration » → « … et de la restauration » ; sinon identiques |
| D METIER | `dossier.craft` (la fiche garde son métier) | tel quel |
| E NOM, F PRÉNOM | `dossier.last_name`, `dossier.first_name` | NOM en capitales → casse normale (« LUGRIN » → « Lugrin ») |
| G RAISON SOCIALE | `dossier.workshop_name` | tel quel |
| H TÉLÉPHONE, I MAIL | `dossier.phone`, `dossier.email` | plusieurs valeurs séparées par retour à la ligne : première dans la colonne, les autres dans `notes` ; la fiche publique n'est pas modifiée |
| J ADRESSE | `dossier.street`, `postal_code`, `city` | dernière ligne « 1242 Satigny » → NPA + ville, le reste → rue |
| K COMMENTAIRES | `artisan_journal` type `remarque` | une entrée par ligne de commentaire ; date extraite si le texte commence par « jj.mm.aa : » ou « mm.aa : », sinon date d'import avec le texte intact |
| L ENTREPRISE FORMATRICE | `dossier.trainer_company` + `trainer_company_note` | « OUI » → true ; « OUI. … OFPC » → true + note ; vide → null |

Onglet « GLOBAL » (données dès la ligne 17, colonne A = nom tel que « ARCHINARD Béatrice ») :

| Colonne | Destination | Règle |
|---|---|---|
| B / C / D (X) | `artisans.poincon_type` **seulement si vide en base** | B → ATELIER, C → BOUTIQUE, D → ENTREPRISE |
| E Caisse AVS | `dossier.avs_fund`, `avs_affiliated = true` | tel quel (« Ocas », « FER CIAM »…) |

### Rapprochement Excel ↔ fiches existantes

Les fiches en base ont un seul `name` (« Bespoak — Jason Lugrin », « Rosso encadrements »,
« Sylvio Asseo »). Règle, après normalisation (minuscules, accents et ponctuation retirés) :

1. `name` contient NOM **et** PRÉNOM → rapprochée ;
2. sinon `name` égal ou contenant la RAISON SOCIALE (≥ 4 caractères) → rapprochée ;
3. sinon NOM seul présent dans une **unique** fiche → rapprochée **à confirmer** (signalée à
   part dans le rapport : « Schott encadreur Sàrl » ↔ « Denis Schott & Fille », « Ateliers
   Blandenier » ↔ « Blandenier SA ») ;
4. plusieurs fiches candidates → **ambiguë**, rien n'est écrit, à trancher à la main ;
5. aucune fiche → **non rapprochée** : si le commentaire indique une sortie (faillite,
   liquidation, retraite, fin d'activité, retiré, départ) → dossier créé sans fiche, statut
   `desactive`, `deactivated_at` = date du commentaire, motif déduit ; sinon ligne **ignorée**
   et listée dans le rapport (à décider : créer la fiche ? sortie non notée ?).

Essai à blanc des règles 1 et 2 sur les noms des données statiques du site (instantané de la
base, 10.10) : 108 lignes rapprochées sur 121, **aucune ambiguë**, 13 non rapprochées = 1 ligne
vide + 7 sorties commentées + 5 à examiner (Giglio Orthopédie, Au Bon Relieur, Schott, Buckel,
Blandenier, ICI Céramique après changement de propriétaire). La règle 3 en récupère quatre.

Statut initial des dossiers rapprochés : fiche publiée → `actif` ; fiche non publiée →
`eligible`. Une fiche déjà dotée d'un dossier n'est pas réimportée (le script est rejouable).

**Section « Retiré du répertoire »** (constaté le 10.10) : la ligne 119 de l'onglet est un
séparateur, les 6 lignes qui suivent sont les sorties. Pour elles : sortie par défaut (motif du
commentaire, sinon « retrait du catalogue » ; date du commentaire, sinon inconnue et signalée),
et jamais de rapprochement sur le seul nom de famille (deux homonymes, IHNE et COLUCCI, ont une
fiche active). Une ligne « retirée » qui correspond pourtant à une fiche publiée est signalée,
pas désactivée.

Script `scripts/import-excel-mag.ts` : à blanc par défaut (rapport seul), `--apply --backup
<fichier.json>` pour écrire, sur le socle `scripts/lib/db-script.ts` (endpoint direct, sauvegarde
dans `backups/` avant écriture, comme `migrate-joomla-links.ts`). Lecture du classeur avec
`exceljs` (4.4.0, MIT, lecture et écriture avec styles : servira aussi à l'export du LOT A2 ;
`xlsx` sur npm n'est plus maintenu).

## 6. Tables (Drizzle, `src/db/schema.ts`)

### `artisan_dossiers`

`id` uuid PK · `artisan_id` uuid FK `artisans` nullable unique (`on delete set null`) · `status`
enum `dossier_status` (`en_evaluation` | `eligible` | `actif` | `desactive`, défaut
`en_evaluation`) · toutes les colonnes du § 4 · `integrated_at` date · `deactivated_at` date ·
`deactivation_reason` varchar · `notes` text · `extra` jsonb · `created_by` varchar ·
`created_at`, `updated_at` timestamp. Index : `status`, `artisan_id`, `last_name`.

### `artisan_documents`

`id` uuid PK · `dossier_id` FK `artisan_dossiers` (`on delete cascade`) · `label` varchar (nom
affiché) · `kind` varchar (attestation AVS, extrait RC, CV, autre) · `pathname` varchar (chemin du
blob **privé**, jamais une URL publique) · `content_type` varchar · `size` integer · `uploaded_by`
varchar · `uploaded_at` timestamp.

### `artisan_journal`

`id` uuid PK · `dossier_id` FK (`on delete cascade`) · `type` enum `journal_type` (`remarque` |
`changement_adresse` | `fermeture` | `activation` | `desactivation` | `eligibilite`) ·
`occurred_at` date (date de l'événement, saisie) · `text` text · `motif` varchar · `author`
varchar · `created_at` timestamp. Index : `dossier_id, occurred_at`.

Le type `eligibilite` s'ajoute aux cinq types du prompt : le passage « Éligible » doit être
journalisé et n'entre dans aucun des cinq.

## 7. Écrans et routes admin

- Menu **« Onboarding »** (`/admin/onboarding`) : liste des dossiers filtrée par statut
  (en évaluation, éligibles, actifs, désactivés), recherche par nom, bouton « Nouveau dossier ».
- **Dossier** (`/admin/onboarding/[id]`) : page pleine, pas une modale ; sections dans l'ordre du
  formulaire papier ; **brouillon enregistré automatiquement** (debounce ~1,5 s après la dernière
  frappe + à la perte de focus, indicateur « Enregistré à hh:mm ») ; bloc « Pièces
  justificatives » (upload, liste, téléchargement, suppression) ; bloc « Journal » (entrées
  datées, formulaire « Ajouter une remarque / une fermeture ») ; boutons d'action selon le
  statut (« Éligible », « Activer », « Désactiver… », « Réactiver »).
- **Fiche artisan** (modale existante) : lien « Fiche interne » vers le dossier lié, ou « Créer le
  dossier » (artisan existant sans dossier, cas des fiches créées à la main après l'import).
- Routes, toutes derrière `requireAdminApi` :
  `GET/POST /api/admin/dossiers` · `GET/PATCH/DELETE /api/admin/dossiers/[id]` ·
  `POST /api/admin/dossiers/[id]/actions` (`eligible` | `activate` | `deactivate` | `reactivate`)
  · `GET/POST /api/admin/dossiers/[id]/journal` · `GET/POST /api/admin/dossiers/[id]/documents`
  · `GET/DELETE /api/admin/dossiers/[id]/documents/[docId]` (GET = téléchargement en flux).
- Usage sur ordinateur : pas de travail particulier sur le responsive de ces écrans.

## 8. Pièces justificatives : stockage privé

`@vercel/blob` 2.8.0 (installé) gère les blobs privés : `put(..., { access: "private" })` à
l'envoi et `get(pathname, { access: "private" })` côté serveur pour relire le fichier. Les pièces
sont donc stockées en privé et servies uniquement par la route admin de téléchargement, qui
vérifie la session puis transmet le flux. Aucune URL publique n'existe pour ces fichiers. Formats
acceptés : PDF, JPEG, PNG, WebP ; taille maximale 10 Mo par pièce.

## 9. Non-exposition : test

`src/lib/dossiers-exposure.test.ts` vérifie que : (a) les colonnes publiques de `db-data.ts`
(`publicArtisanColumns`) et les sélections de `queries.ts` ne référencent que la table `artisans`
(jamais `artisan_dossiers`, `artisan_documents`, `artisan_journal`) ; (b) aucun fichier sous
`src/app` hors `src/app/admin` et `src/app/api/admin` n'importe ces tables ni les helpers de
dossier ; (c) le sitemap n'en dépend pas. Test statique sur les sources, exécuté par `npm test`.

## 10. Hébergement : constat du 10.10

- Base Neon en `eu-central-1` (Francfort) : données au repos en Europe, conforme à la décision
  du 09.10.
- Fonctions Vercel du projet `metiersdart-geneve` : le déploiement de production du 10.10
  s'exécute en **`iad1` (Washington, États-Unis)**, région par défaut de Vercel. Les données
  transitent donc par les États-Unis à chaque requête serveur. Proposition : passer la région
  des fonctions à `fra1` (Francfort), ce qui rapproche aussi les fonctions de la base (latence).
  Réglage dans le projet Vercel (Settings → Functions → Region) ou `regions: ["fra1"]` dans un
  `vercel.json` ; **à faire avec l'accord de Bernard**, pas dans ce lot sans son feu vert.
- Vercel Blob : région du store à vérifier dans le tableau de bord (non exposée par l'API).

## 11. Hors LOT A1

- Export Excel, tableau de bord, vue par commune, compteur « Métiers » calculé → LOT A2.
- Historique des participations JEMA / événements par artisan (onglets « GLOBAL » col. I,
  « Capsules », « Événements ») : non lié à l'artisan dans l'Excel ; à cadrer avec A2.
- Cotisations, montants : absents du formulaire et de l'Excel, non gérés.
- Saisie par l'artisan, comptes individuels, version tablette : écartés le 09.10.

## 12. À valider par Bernard avant la migration

1. Table séparée `artisan_dossiers` (§ 2.1) plutôt que des colonnes sur `artisans`.
2. Liste des colonnes du § 4 : rien à retirer, rien à ajouter ?
3. Règles de rapprochement et sort des 7 lignes « sorties » (§ 5) ; statut initial actif /
   eligible selon la publication.
4. Type de journal `eligibilite` ajouté ; motifs de désactivation (faillite, fermeture d'atelier,
   retraite, départ, retrait du catalogue, autre).
5. Coordonnées copiées sur la fiche seulement si consentement (§ 2.3).
6. Librairie `exceljs` pour la lecture (A1) et l'écriture (A2).
7. Région des fonctions Vercel (§ 10) : passer à `fra1` ?
8. Base de développement : `.env.local` avec `DATABASE_URL` (branche Neon de dev, pas la prod),
   `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY` / `RESEND_FROM_EMAIL` pour tester
   l'admin en local. Sans base, le code et les tests unitaires avancent, mais ni `db:push:dry`
   ni l'import ni les écrans ne peuvent être vérifiés.

---

## Annexe — proposition préliminaire de septembre 2026 (remplacée)

Proposait des colonnes `internal_*` directement sur `artisans` (téléphone et mail privés,
personne de contact MAG, statut administratif, dates d'adhésion, cotisation, notes, tags), une
table `artisan_jema_history` et une table optionnelle `artisan_interactions`, en quatre lots
(5A modèle, 5B import Excel, 5C statistiques, 5D journal). Le formulaire et l'Excel reçus le
10.10 ont fixé les champs réels (§ 4 et § 5) ; le journal remplace `artisan_interactions`, les
cotisations n'existent pas chez MAG, et l'historique JEMA est reporté (§ 10).
