# Plateforme de gestion interne MAG — Proposition de cadrage

**Date :** septembre 2026
**Objet :** remplacer le fichier Excel parallèle par une saisie unique dans la base du site.
**Statut :** proposition préliminaire. À préciser à réception du fichier Excel de MAG et de leur note de cadrage.

---

## Contexte

MAG gère aujourd'hui ses artisans dans un gros fichier Excel, en parallèle du site. Une même information est saisie deux fois : une fois dans Excel (gestion interne), une fois sur le site (affichage public). L'objectif est d'arriver à **une seule saisie**, avec des données internes non publiées (coordonnées privées, notes de suivi, historique JEMA) et une page de statistiques.

Ce lot est **chiffré séparément** de la refonte du site.

---

## Modèle de données proposé

### Principe

La table `artisans` existante devient la source unique. On ajoute les champs internes (non publics) à cette table, avec une convention simple :

- Les champs **publics** sont ceux déjà exposés sur le site (affichés sur la fiche publique).
- Les champs **internes** sont préfixés `internal_` ou stockés dans une table liée, et ne sont jamais renvoyés par les API publiques.

### Champs publics (déjà en base, affichés sur le site)

| Champ | Type | Source | Notes |
|-------|------|--------|-------|
| name | varchar | fiche publique | Nom de l'artisan / entité |
| slug | varchar | auto | URL |
| type | enum | fiche publique | artisan, école, association… |
| craft | text | fiche publique | Métier |
| categoryId | FK | fiche publique | Domaine d'art |
| commune | varchar | fiche publique | Commune |
| address | varchar | fiche publique | Adresse |
| latitude / longitude | float | géocodage | Coordonnées carte |
| phone | varchar | fiche publique | Téléphone public |
| email | varchar | fiche publique | E-mail public |
| website | varchar | fiche publique | Site internet |
| shortDescription | text | fiche publique | Description courte |
| longDescription | text | fiche publique | Description longue |
| imageUrl | varchar | upload | Photo |
| video | varchar | fiche publique | Vidéo Vimeo/YouTube |
| autre | text | fiche publique | Infos complémentaires |
| poinconType | varchar | fiche publique | Type de poinçon |
| poinconModalText | text | fiche publique | Texte explicatif |
| poinconModalLink | varchar | fiche publique | Lien poinçon |
| jemaParticipant | boolean | admin | Participe aux JEMA |
| published | boolean | admin | Visible publiquement |

### Champs internes à ajouter (non publics)

| Champ proposé | Type | Usage | Exemple |
|----------------|------|-------|---------|
| internalPhone2 | varchar | Téléphone privé (mobile, pro) | 078 123 45 67 |
| internalEmail2 | varchar | E-mail privé | mag.perso@… |
| internalContactPerson | varchar | Personne de contact chez MAG | Elsa Monteiro |
| internalStatus | varchar | Statut administratif | Actif, Inactif, Sorti, Décédé |
| internalMembershipStart | date | Début d'adhésion | 2018-01-01 |
| internalMembershipEnd | date | Fin d'adhésion (si sortie) | null |
| internalContributionPaid | boolean | Cotisation à jour | true |
| internalNotes | text | Notes libres de suivi | « A déménagé en 2024 » |
| internalTags | jsonb | Tags libres (array) | ["VIP", "JEMA 2026"] |

**À confirmer par MAG :** la liste exacte des colonnes de leur Excel déterminera les champs finaux. La proposition ci-dessus est un point de départ réaliste.

### Tables liées (historique)

#### `artisan_jema_history` — participations JEMA par artisan

| Champ | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| artisanId | FK → artisans | |
| year | integer | Année JEMA |
| role | varchar | Participant, Démonstrateur, Pavillon SICLI… |
| notes | text | Observations spécifiques |

Cette table permet de tracer l'historique de participation aux JEMA sans dupliquer les éditions (qui restent dans `jema_editions`).

#### `artisan_interactions` — journal de suivi (optionnel)

| Champ | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| artisanId | FK → artisans | |
| date | timestamp | Date de l'interaction |
| type | varchar | Appel, Email, Visite, Courrier… |
| author | varchar | Qui chez MAG (Elsa, Serena…) |
| content | text | Compte-rendu |

Table optionnelle selon le niveau de suivi souhaité par MAG.

---

## Page de statistiques

Une page `/admin/stats` (admin uniquement) affichant :

1. **Effectifs** : total artisans, par type, par domaine, par commune
2. **Évolution** : adhésions par année (graphique), sorties par année
3. **Cotisations** : % à jour, retards
4. **JEMA** : participation par édition, taux de participation par domaine
5. **Géographie** : carte de chaleur des communes, densité par secteur

Toutes ces statistiques se calculent depuis la base en SQL agrégé, sans table dédiée.

---

## Découpage en lots proposé

### Lot 5A — Extension du modèle (1 jour)

- Ajout des champs internes au schema Drizzle
- Migration `drizzle-kit push`
- Mise à jour de l'API admin pour lire/écrire ces champs
- Onglet « Fiche interne » dans l'ArtisanModal (séparé de l'onglet public)

### Lot 5B — Import Excel (0,5 jour)

- Script d'import du fichier Excel fourni par MAG vers la base
- Mapping colonnes Excel → champs internes
- Vérification et rapport d'import (lignes ignorées, doublons)

### Lot 5C — Page de statistiques (1 jour)

- Page `/admin/stats` avec graphiques ECharts
- KPIs calculés en SQL agrégé
- Export CSV des données filtrées

### Lot 5D — Journal de suivi (0,5 jour, optionnel)

- Table `artisan_interactions`
- Interface de saisie dans la fiche artisan
- Historique chronologique

**Estimation totale :** ~3 jours (5A+5B+5C), ~3,5 jours avec 5D.

---

## Points à confirmer par MAG

1. **Liste exacte des colonnes du fichier Excel** — détermine les champs internes finaux.
2. **Niveau de suivi souhaité** — simple fiche interne (5A) ou journal d'interactions complet (5D) ?
3. **Cotisations** — gère-t-on le montant ou juste « payé / non payé » ?
4. **Statuts** — quels statuts administratifs gérer (actif, inactif, sorti, décédé, autre) ?
5. **Fréquence d'import** — one-shot au démarrage, ou import récurrent ?

---

## Note technique

- Les champs internes ne sont jamais exposés par les API publiques (`/api/artisans`, sitemap, etc.). Seules les routes `/api/admin/*` y accèdent.
- Le middleware `requireAdmin` protège déjà toutes les routes admin.
- Aucune modification de la fiche publique ni des compteurs publics — les champs internes sont invisibles côté grand public.
