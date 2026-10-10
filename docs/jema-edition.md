# Pages JEMA — cadrage de l'édition (LOT E2)

**Date :** 10 octobre 2026. **Statut :** proposition, décision attendue de MAG et Bernard avant
le cadrage de janvier 2027. **Cible :** JEMA de mars 2027 (15ᵉ édition passée en 2026, la
16ᵉ se prépare dès novembre).
**Source :** séance du 09.10.2026 (« choisir à l'approche des JEMA entre un gabarit Word intégré
par Jooce et une interface d'édition dédiée »), lecture du code des pages `/jema` et
`/jema/[année]` et de l'admin JEMA.

---

## 1. Ce que l'admin permet déjà

Menu **JEMA** de l'admin (`/admin/jema`, modale `JemaModal`) : une ligne par édition dans la
table `jema_editions`, avec les champs suivants.

| Champ | Saisi dans l'admin | Affiché |
|---|---|---|
| Année, titre | oui | carte de l'édition, page de l'édition |
| Dates de début et de fin | oui | « du 19 au 21 mars 2027 » sur /jema, plage courte sur la carte |
| À venir / passée | oui (cases) | /jema : bloc rouge « Prochaine édition » ; une édition à venir dont la date est passée bascule seule dans les passées |
| URL du programme | oui | bouton « Voir le programme » (http(s) seulement) |
| Description | oui | texte du bloc « Prochaine édition » ; sur la page d'une édition passée, seulement si aucun récit codé en dur n'existe |
| Temps fort | oui | prévu pour la carte, **non affiché** aujourd'hui |
| Chiffres (`stats`) | **non** (accepté par l'API, absent de la modale) | page de l'édition, à la place des chiffres codés en dur s'il est renseigné |
| Galerie (`gallery_images`) | non | nulle part |
| Parcours (`jema_parcours`) | non (table vide, jamais lue) | nulle part |

Conclusion : MAG peut aujourd'hui **annoncer** une édition (dates, titre, texte, programme) et
la faire passer dans les éditions passées. Tout le reste est du code.

## 2. Ce qui est codé en dur (intervention de Jooce à chaque changement)

### Page `/jema`
- Le chapô de présentation des JEMA.
- Les **trois parcours** (nom, icône, description) : Ouverture Ateliers, Pavillon SICLI,
  Parcours Culturel.
- La section « Merci à nos partenaires » (texte seul, pas de logos).
- Le logo JEMA (`public/jema-logo.png`).

### Page d'une édition `/jema/[année]` (`editionExtras`, un bloc par année 2022-2026)
- L'**intro** (chapô) et le **récit** « Retour sur l'édition ».
- Les **vidéos** (identifiant Vimeo ou YouTube + titre ; miniatures chargées automatiquement) :
  deux par édition (Best of, Focus Léman Bleu ou version longue).
- Le lien **programme** issuu de repli (quand l'admin n'en a pas).
- Les **quatre chiffres** avec leurs libellés (Participants, Métiers, Institutions, Écoles…),
  qui changent d'une édition à l'autre.
- Le **focus thématique** 2026 « Le domaine de la pierre se mobilise » : trois paragraphes et
  une liste de six artisan·e·s rattachés à leurs fiches (`PierreFocus.tsx`).

Constat sur cinq éditions : la structure est **stable** (intro, dates, programme, 4 chiffres,
2 vidéos, récit), à l'exception du focus thématique, propre à une année.

## 3. Cycle de vie d'une édition (ce qui bouge, et quand)

| Moment | Contenu | Aujourd'hui |
|---|---|---|
| Novembre – janvier | dates, titre, teaser, parcours de l'année | admin (dates, titre, texte) + code (parcours) |
| Janvier – mars | programme (PDF / issuu), partenaires, focus thématique, participants | admin (lien programme) + code (le reste) |
| Pendant | annonces, programme | /l-actu (admin) |
| Après (avril – juin) | récit, chiffres, vidéos Best of, bascule en édition passée | admin (bascule) + code (récit, chiffres, vidéos) |

Soit **3 à 4 interventions de Jooce par édition**, concentrées sur les deux mois les plus chargés
pour MAG, avec le risque d'attente signalé par Bernard le 09.10.

## 4. Options

### A — Gabarit Word, intégration par Jooce
MAG remplit un gabarit Word par édition (sections fixes : intro, dates, lien programme, 4
chiffres, liens vidéo, récit, focus facultatif, partenaires). Jooce l'intègre dans le code.
- Coût initial : **0,25 j** (gabarit Word + consignes). Par édition : **3 à 5 h** réparties sur
  3-4 livraisons, avec un délai de prise en charge à chaque fois.
- Avantages : aucun développement ; les mises en page particulières restent possibles.
- Limites : dépendance à Jooce en pleine période JEMA, relectures, pas d'aperçu avant mise en ligne.

### B — Interface d'édition complète
L'admin JEMA couvre tout : intro et récit, chiffres libellés, vidéos, galerie photo, programme,
parcours de l'année, partenaires (logos et liens), focus thématique (titre, paragraphes,
artisan·e·s choisis dans le répertoire).
- Coût initial : **2 j** (schéma, API, modale refaite en page pleine, pages publiques lues
  depuis la base avec repli sur les contenus 2022-2026 reportés en base, script de reprise,
  tests, revue). Par édition : **0** côté Jooce.
- Avantages : autonomie totale, aperçu immédiat, historique des éditions dans la base.
- Limites : le focus thématique, différent chaque année dans sa forme, rentre mal dans des
  champs fixes ; tout ce qui sort du gabarit demandera quand même du code.

### C — Hybride (recommandé)
L'interface couvre le **contenu récurrent et structuré** d'une édition : intro, récit, 4
chiffres libellés, vidéos (plateforme, identifiant, titre), programme, galerie, et sur /jema les
trois parcours et le chapô. Le **focus thématique** et les sections exceptionnelles restent sur
gabarit Word intégré par Jooce (option A), une fois par édition au plus.
- Coût initial : **1,5 j**. Par édition : 0 pour le récurrent, 1 à 2 h si un focus est voulu.
- C'est l'option qui enlève la dépendance aux moments critiques (annonce, programme, après-coup)
  sans sur-investir dans des cas qui changent chaque année.

## 5. Critères de décision (demandés le 09.10)

| Critère | Constat | Penche vers |
|---|---|---|
| Volume de mises à jour | 3-4 par édition, chaque année | B ou C |
| Stabilité de la structure | identique sur 5 éditions, sauf le focus | C |
| Ressources MAG | Sandra gère déjà l'admin (actus, médias, artisans) | B ou C |
| Disponibilité de Jooce en mars | goulot signalé en séance | B ou C |
| Budget 2026-2027 | tiroirs arbitrés selon les communes | A si rien n'est financé, sinon C |

## 6. Si C est retenue : contenu de l'interface

**Table `jema_editions`, champs ajoutés** : `intro` (texte), `story` (récit, texte long),
`videos` (`jsonb`, liste de { plateforme, identifiant, titre }), `stats` passe en liste ordonnée
de { libellé, valeur } (aujourd'hui objet sans ordre), `gallery_images` branché à l'écran
(envoi d'images via la route existante `/api/admin/upload`). `highlight` affiché sur la carte
ou retiré.
**Table `jema_parcours`** (existante, vide) : les trois parcours, rattachés à l'édition à venir,
avec nom, icône (liste fermée) et description ; ordre libre.
**Chapô de /jema** : `site_settings.jema_intro` (ou page statique existante).
**Écran admin** : page pleine `/admin/jema/[id]` (comme le dossier artisan) avec sections
Annonce (dates, titre, intro, programme), Parcours, Après-coup (récit, chiffres, vidéos,
galerie), Publication (à venir / passée). Enregistrement automatique.
**Pages publiques** : lisent la base ; les contenus 2022-2026 codés en dur sont reportés en base
par un script à blanc puis `--apply` (comme les reprises précédentes), puis le code mort est
retiré. `PierreFocus` reste un composant conditionné par un drapeau `focus_pierre` de
l'édition 2026.
**Hors périmètre** : mise en page libre (blocs arbitraires), programme détaillé par atelier
(reste sur issuu), inscriptions.

## 7. Plan et calendrier proposés

| Étape | Charge | Quand |
|---|---|---|
| Décision A / B / C par MAG | — | novembre 2026 |
| Gabarit Word (A ou C) | 0,25 j | décembre 2026 |
| Schéma, API, écran admin (C) | 0,75 j | janvier 2027 |
| Pages publiques + reprise des éditions 2022-2026 | 0,5 j | janvier 2027 |
| Revue, tests, mise en ligne, prise en main par Sandra | 0,25 j | début février 2027 |
| Saisie de l'édition 2027 par MAG | — | février 2027, avant le programme |

## 8. Ce qui est demandé à MAG dès maintenant

1. Trancher entre A, B et C (recommandation : **C**).
2. Dans tous les cas, fournir le contenu 2027 dans l'ordre du gabarit : dates, titre, intro,
   parcours, lien programme, puis après l'événement récit, chiffres, vidéos.
3. Dire si le focus thématique 2026 (pierre) doit rester en ligne sur l'édition 2026, et si un
   focus est prévu en 2027.
