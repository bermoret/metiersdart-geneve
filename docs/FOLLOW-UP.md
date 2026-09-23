# Follow-up — backlog versionné

Reports, points à vérifier et décisions ouvertes, par chantier (plus récent en haut).

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
