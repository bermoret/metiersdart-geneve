# Rapport de classement des entités du répertoire

**Date de production :** septembre 2026
**Source :** scraping de l'ancien site metiersdart-geneve.ch (145 entités)
**Objet :** classification de chaque entité selon un champ `type`, conformément au LOT 1 de la refonte.

---

## Résumé des décomptes

| Type | Nombre | Rôle dans les compteurs |
|------|--------|-------------------------|
| `artisan` | 114 | Compté comme artisan |
| `institution_culturelle` | 17 | Exclu du comptage artisans |
| `ecole_formatrice` | 7 | Exclu du comptage artisans |
| `association_professionnelle` | 5 | Exclu du comptage artisans |
| `partenaire` | 2 | Exclu du comptage artisans |
| **Total** | **145** | |

### Compteurs affichés sur le site

| Indicateur | Valeur calculée | Cible MAG | Statut |
|------------|-----------------|-----------|--------|
| Artisans (`type = artisan`) | **114** | 114 | ✅ Conforme |
| Métiers uniques (dédoublonnés, artisans only) | **82** | — | Le site affichait 106 (doublons inclus). Dédoublonné : 82. |
| Communes (toutes entités, tous types) | **23** | 20 ou 21 | ⚠️ Voir section ci-dessous |
| Domaines d'art | **12** | — | Catégories ayant au moins un artisan lié |

### Écart sur le nombre de communes

Le scraping compte **23 communes distinctes** (tous types confondus). L'ancien site en annonce 20 ou 21.

La différence vient probablement de :

1. **Clarens** (art-143, ARMP) : commune vaudoise (district de Riviera-Pays-d'Enhaut), hors canton de Genève. Incluse parce que l'ARMP y est domiciliée, mais ce n'est pas une commune genevoise.
2. **Meinier** (art-4, Bracelets Protexo SA) et **Presinge** (art-74, Poterie Passion) : communes genevoises valides mais potentiellement absentes du comptage de l'ancien site.

Si l'on exclut Clarens (hors canton), on obtient **22 communes genevoises**. Si l'on exclut également les entités non-artisans pour ne compter que les communes où un artisan est domicilié, on obtient **21 communes**.

**Recommandation :** conserver le décompte de 23 tel que scrapé (MAG s'en sert pour montrer à chaque commune ce qui se trouve sur son territoire), mais **signaler Clarens comme cas à confirmer** (voir section « À confirmer »).

---

## Méthode de classification

Chaque entité a été classée selon sa nature, déterminée par :

- Son nom (présence d'un musée, théâtre, école, association…)
- Sa catégorie d'appartenance sur l'ancien site
- Son métier déclaré

Les entités sans indicateur explicite ont été classées `artisan` par défaut, ce qui correspond au cas majoritaire dans le scraping initial.

---

## Liste complète par type

### Artisans (114)

| # | ID | Nom | Métier | Domaine | Commune |
|---|-----|-----|--------|---------|---------|
| 1 | art-1 | AP Sellerie, Anne Ponthenier | Sellière | Art du cuir | Vernier |
| 2 | art-2 | Atelier René René, Sylvia Blondin | Maroquinière | Art du cuir | Carouge |
| 3 | art-3 | L'Antre-Peaux, Chris Murner | Maroquinière | Art du cuir | Carouge |
| 4 | art-4 | Bracelets Protexo SA | Maroquinière | Art du cuir | Meinier |
| 5 | art-5 | Luxhous SA | Sellière | Art du cuir | Vernier |
| 6 | art-6 | Roger Truan SA | Gainière | Art du cuir | Carouge |
| 7 | art-7 | Sellerie Kühnen, Fabienne Panelati | Sellière | Art du cuir | Genève |
| 8 | art-8 | Sellerie moto Dubouloz, Simon Dubouloz | Sellier harnacheur | Art du cuir | Plan-les-Ouates |
| 9 | art-9 | Vaudaux Haute Gainerie depuis 1908 | Gainière | Art du cuir | Vernier |
| 10 | art-10 | Cyril Sanglier | Sellier harnacheur | Art du cuir | Chêne-Bourg |
| 11 | art-11 | Orthethic | Bottier | Art du cuir | Carouge |
| 12 | art-12 | L'Artisan du Cuir — Frédéric Viollet | Maroquinier | Art du cuir | Genève |
| 13 | art-13 | Cordonnerie Seror — Yohan Seror | Bottière • Cordonnière | Art du cuir | Genève |
| 14 | art-14 | Atelier Gibson, Oran Gibson | Bijoutier • Joaillier • Sertisseur | Art de l'horlogerie et de la bijouterie | Carouge |
| 15 | art-15 | Atelier Galerie Igor Siebold | Bijoutier | Art de l'horlogerie et de la bijouterie | Carouge |
| 16 | art-16 | Atelier Laurent Jolliet | Bijoutier • Chaîniste | Art de l'horlogerie et de la bijouterie | Vernier |
| 17 | art-17 | Blandenier SA | Graveur • Emailleur • Sertisseur | Art de l'horlogerie et de la bijouterie | Genève |
| 18 | art-18 | Catherine Schmeer bijouterie-joaillerie | Bijoutier • Joaillier | Art de l'horlogerie et de la bijouterie | Carouge |
| 19 | art-19 | Galerie H — Valérie Hangel | Bijoutier | Art de l'horlogerie et de la bijouterie | Carouge |
| 20 | art-20 | Ingrid Schmidt Schmuck | Bijoutier | Art de l'horlogerie et de la bijouterie | Genève |
| 21 | art-21 | Les Insolites, Nina Mathèz-Loïc | Bijoutier | Art de l'horlogerie et de la bijouterie | Carouge |
| 22 | art-22 | Marina Magnin Bucher — Ninamarina | Bijoutier | Art de l'horlogerie et de la bijouterie | Veyrier |
| 23 | art-23 | Samuel Gillioz | Horloger | Art de l'horlogerie et de la bijouterie | Plan-les-Ouates |
| 24 | art-24 | Stéphane Greco | Décorateur sur mouvement horloger | Art de l'horlogerie et de la bijouterie | Plan-les-Ouates |
| 25 | art-25 | Elisa Neveceral-Pantazopoulos | Bijoutière | Art de l'horlogerie et de la bijouterie | Genève |
| 26 | art-26 | Karine Dupont | Bijoutière-joaillère | Art de l'horlogerie et de la bijouterie | Carouge |
| 27 | art-27 | Traditech | Sertisseur | Art de l'horlogerie et de la bijouterie | Genève |
| 28 | art-28 | Atelier Orange — Aline Hiltpold | Bijoutière • Joaillière | Art de l'horlogerie et de la bijouterie | Carouge |
| 29 | art-29 | Dorothée Loustalot | Bijoutière • Design de bijoux | Art de l'horlogerie et de la bijouterie | Genève |
| 30 | art-30 | Sandy Rey | Bijoutière • Joaillière | Art de l'horlogerie et de la bijouterie | Genève |
| 31 | art-31 | Lucas Hage | Bijoutier | Art de l'horlogerie et de la bijouterie | Genève |
| 32 | art-32 | Atelier 9 | Bijoutier | Art de l'horlogerie et de la bijouterie | Genève |
| 33 | art-33 | Cyril Seiler | Bijoutier • Joaillier | Art de l'horlogerie et de la bijouterie | Carouge |
| 34 | art-34 | Atelier Matin Bleu, Emmanuelle Bronzino | Tailleur • Couturier | Art du textile | Carouge |
| 35 | art-35 | Carolina Véliz, créatrice textile | Feutrière | Art du textile | Carouge |
| 36 | art-36 | Mercerie Catherine B | Brodeur | Art du textile | Genève |
| 37 | art-37 | Peter Kammermann | Tapissier | Art du textile | Carouge |
| 38 | art-38 | Revenga Chemisiers Genevois, Josefa Garcia Lozano | Couturier • Tailleur | Art du textile | Genève |
| 39 | art-39 | Atelier Contre-Jour | Fabricant d'abat-jour | Art du textile | Genève |
| 40 | art-40 | Lachenal SA | Courtepointier | Art du textile | Genève |
| 41 | art-41 | Laura Catignani | Modiste | Art du textile | Genève |
| 42 | art-42 | De fil en fil — Nicole Genoud | Tisserande | Art du textile | Genève |
| 43 | art-43 | Maïa Kvasnikova | Fabricante d'objets en textiles | Art du textile | Genève |
| 44 | art-44 | Baxter Sérigraphie | Imprimeur en sérigraphie | Art du textile | Genève |
| 45 | art-45 | Jean-Robert Gase | Chapelier • Modiste | Art du textile | Genève |
| 46 | art-46 | mademoiselle L — Laurence Imstepf | Couturière | Art du textile | Genève |
| 47 | art-47 | Jardin des Couleurs — Jaky Roland | Teinturière | Art du textile | Bernex |
| 48 | art-48 | L'Atelier B, Belén Ferrier et Mohamed Kahlia | Doreur • Encadreur • Peintre-décorateur | Art du bois | Genève |
| 49 | art-49 | Barro & Cie SA | Menuisier | Art du bois | Carouge |
| 50 | art-50 | Jérôme Blanc | Tourneur sur bois • Sculpteur sur bois | Art du bois | Carouge |
| 51 | art-51 | Marco Colucci Encadrement + Art | Encadreur | Art du bois | Genève |
| 52 | art-52 | Denis Schott & Fille | Encadreur d'art | Art du bois | Genève |
| 53 | art-53 | Gaspard Meier | Charpentier ornemaniste | Art du bois | Bernex |
| 54 | art-54 | Fanny Kopp | Graveuse sur bois | Art du bois | Vernier |
| 55 | art-55 | Marco Olivet | Encadreur d'art | Art du bois | Carouge |
| 56 | art-56 | Rosso encadrements | Encadreur | Art du bois | Chêne-Bourg |
| 57 | art-57 | Sakran SA — Pascal Sakran | Menuisier • Ebéniste | Art du bois | Carouge |
| 58 | art-58 | Olivier Veuthey | Menuisier • Ebéniste | Art du bois | Bernex |
| 59 | art-59 | Art & Maison SA | Parqueteur | Art du bois | Bellevue |
| 60 | art-60 | Bespoak — Jason Lugrin | Menuisier • Ebéniste | Art du bois | Satigny |
| 61 | art-61 | Ebénisterie Nikles — Philippe Nikles | Restaurateur de meubles anciens | Art du bois | Genève |
| 62 | art-62 | Sylvio Asseo | Sculpteur sur bois | Art du bois | Puplinge |
| 63 | art-63 | Atelier ABR Sàrl | Relieur • Doreur | Art du papier | Vernier |
| 64 | art-64 | Loutan & Cie SA | Imprimeur en sérigraphe | Art du papier | Genève |
| 65 | art-65 | Réhane Favereau | Découpeuse sur papier | Art du papier | Pregny-Chambésy |
| 66 | art-66 | Duo d'art | Imprimeur en sérigraphie | Art du papier | Vernier |
| 67 | art-67 | Atelier de lutherie, Béatrice de Haller | Luthier | Art de la facture instrumentale | Carouge |
| 68 | art-68 | Maître Luthier François Lebeau | Luthier | Art de la facture instrumentale | Genève |
| 69 | art-69 | Pianos-Service P. Fuhrer | Facteur de pianos | Art de la facture instrumentale | Genève |
| 70 | art-70 | Bernard Bossert | Luthier du quatuor | Art de la facture instrumentale | Genève |
| 71 | art-71 | Vincenti Guitares — Guillaume Dayer | Luthier en guitare | Art de la facture instrumentale | Genève |
| 72 | art-72 | ICI Céramique — Elise Naville | Céramiste | Art de la terre | Genève |
| 73 | art-73 | La Maison de Nathalie | Céramiste | Art de la terre | Puplinge |
| 74 | art-74 | Poterie Passion — Sylvie Cellerino | Céramiste | Art de la terre | Presinge |
| 75 | art-75 | Héloïse Ihne | Fabricante de compositions et décors végétaux stables et durables | Art de la terre | Carouge |
| 76 | art-76 | Mioko — Marie Faurax | Céramiste | Art de la terre | Vandoeuvres |
| 77 | art-77 | L'Atelier de céramique, Annick Berclaz | Céramiste | Art de la terre | Genève |
| 78 | art-78 | Atelier C1, Thierry Reverdin | Maquettiste | Arts appliqués | Genève |
| 79 | art-79 | Atelier d'Art, Jacky Riesen | Lustrier | Arts appliqués | Lancy |
| 80 | art-80 | Atelier JMS, Jean-Michel Staudhammer | Maquettiste | Arts appliqués | Chêne-Bourg |
| 81 | art-81 | Emmanuelle Zem Rohner | Peintre décorateur • Peintre en décor du patrimoine | Arts appliqués | Genève |
| 82 | art-82 | Finissimo Reliure — Alexis De Los Santos | Relieur | Arts appliqués | Carouge |
| 83 | art-83 | Yvan Hostettler | Calligraphe | Arts appliqués | Genève |
| 84 | art-84 | Patrick Reymond | Maquettiste | Arts appliqués | Veyrier |
| 85 | art-85 | Michel'Art — Michel Favre | Peintre en lettres | Arts appliqués | Genève |
| 86 | art-86 | La Clef des Coeurs — Daniel Fauchez | Sculpteur ornemaniste | Arts appliqués | Plan-les-Ouates |
| 87 | art-87 | L'Atelier de la Cire Genève | Cirière | Arts appliqués | Carouge |
| 88 | art-88 | Jean-Philippe Naef | Restaurateur d'objets anciens | Arts appliqués | Bardonnex |
| 89 | art-89 | Marina Buckel | Oculariste | Art du verre | Perly |
| 90 | art-90 | Frédéric Taddeï | Verrier | Art du verre | Satigny |
| 91 | art-91 | Atelier du Verre — Wilma Besson | Verrier | Art du verre | Genève |
| 92 | art-92 | Atelier CAL'AS (Artisans Sculpteurs), Vincent Du Bois | Sculpteur sur pierre | Art de la pierre | Lancy |
| 93 | art-93 | Atelier Comte | Tailleur de pierre | Art de la pierre | Bardonnex |
| 94 | art-94 | Michel Gillabert | Sculpteur sur pierre | Art de la pierre | Veyrier |
| 95 | art-95 | Philippe Cartan | Sculpteur sur pierre | Art de la pierre | Plan-les-Ouates |
| 96 | art-96 | Mello & Fils SA | Tailleur de pierre | Art de la pierre | Carouge |
| 97 | art-97 | Daniel Estevez | Marbrier | Art de la pierre | Satigny |
| 98 | art-98 | Béatrice Archinard | Sculpteure sur pierre | Art de la pierre | Genève |
| 99 | art-99 | Julien Joselon | Sculpteur sur pierre | Art de la pierre | Dardagny |
| 100 | art-100 | Artisan du Staff | Staffeur-stucateur ornemaniste | Art de la pierre | Meyrin |
| 101 | art-101 | Atelier Leckie, Anna Leckie | Graveuse taille-douce | Art du métal | Carouge |
| 102 | art-102 | Charles Roulin | Coutelier d'art | Art du métal | Bernex |
| 103 | art-103 | Cerutti Toitures SA | Ferblantier ornemaniste | Art du métal | Genève |
| 104 | art-104 | Métaloïd SA | Constructeur métallique | Art du métal | Genève |
| 105 | art-105 | Joshua Teegarden | Fondeur | Art du métal | Aire-la-Ville |
| 106 | art-106 | SwissArt Edition — David Chojnacki | Fondeur d'art | Art du métal | Jussy |
| 107 | art-107 | Olivier Murner SA | Constructeur métallique | Art du métal | Genève |
| 108 | art-108 | Art Kern | Ferronnier • Constructeur métallique | Art du métal | Genève |
| 109 | art-109 | Hoffmann Art Management | Conservateur-restaurateur d'œuvres d'art | Art de la conservation et de la restauration | Lancy |
| 110 | art-110 | La Boutique du Relieur — Michel Magnin | Restaurateur de documents graphiques et imprimés | Art de la conservation et de la restauration | Carouge |
| 111 | art-111 | Orth & Fils SÀRL | Peintre décorateur • Restaurateur d'art | Art de la conservation et de la restauration | Genève |
| 112 | art-112 | Lucien Walker | Restaurateur de livres | Art de la conservation et de la restauration | Carouge |
| 113 | art-113 | Atelier AnD — Anita Durand | Restauratrice d'œuvres peintes | Art de la conservation et de la restauration | Carouge |
| 114 | art-114 | Ateliers de restauration de tableaux — Laurent Jornod | Restaurateur de tableaux | Art de la conservation et de la restauration | Genève |

### Institutions culturelles (17)

| # | ID | Nom | Métier | Commune |
|---|-----|-----|--------|---------|
| 1 | art-115 | Association pour le patrimoine industriel (API) | Typographe • Imprimeur sur presses anciennes • Relieur | Genève |
| 2 | art-116 | Atelier Genevois de Gravure Contemporaine (AGGC) | Graveur | Genève |
| 3 | art-117 | Comédie de Genève | Costumier | Genève |
| 4 | art-118 | Conservatoire et Jardin botaniques de Genève | Préparateur d'herbier | Pregny-Chambésy |
| 5 | art-119 | Fondation Baur, Musée des Arts d'Extrême-Orient | Scénographe | Genève |
| 6 | art-120 | Fondation Martin Bodmer | Technicien en conservation d'art | Cologny |
| 7 | art-121 | Grand Théâtre de Genève | Décorateur et accessoiriste costumes | Genève |
| 8 | art-122 | Muséum d'Histoire Naturelle | Taxidermiste | Genève |
| 9 | art-123 | Musée Ariana, musée suisse de la céramique et du verre | Conservateur-restaurateur | Genève |
| 10 | art-124 | Musée d'Art et d'Histoire | Conservateur-restaurateur | Genève |
| 11 | art-125 | Bibliothèque de Genève | Conservateur-restaurateur | Genève |
| 12 | art-126 | Théâtre de Carouge | Costumier | Carouge |
| 13 | art-127 | Musée d'Ethnographie de Genève — MEG | Conservateur-restaurateur | Genève |
| 14 | art-128 | Musée International de la Réforme | Graveur • Imprimeur | Genève |
| 15 | art-129 | Collection des Moulages | Scénographe • Restaurateur | Genève |
| 16 | art-130 | Scènes du Grütli | Scénographe | Genève |
| 17 | art-131 | Ateliers de décors de théâtre | Fabricant de décors de spectacle | Vernier |

### Écoles formatrices (7)

| # | ID | Nom | Métier | Commune |
|---|-----|-----|--------|---------|
| 1 | art-132 | CFP Arts Céramique • Bijouterie • Créateur de vêtements | Céramiste • Bijoutier | Genève |
| 2 | art-133 | CFP — Construction | Charpentier • Ebéniste • Menuisier • Constructeur métallique | Lancy |
| 3 | art-134 | CFPT — Horlogerie | Horloger | Lancy |
| 4 | art-135 | CFPne Lullier | Artisan fleuriste | Jussy |
| 5 | art-136 | HEAD — Haute École d'Art et de Design | Métiers de la mode | Genève |
| 6 | art-137 | IPAC Design Genève | Mode, architecture intérieure et design graphique | Vernier |
| 7 | art-138 | Ateliers horlogers de Van Cleef & Arpels | Emailleur • Graveur main • Horloger | Meyrin |

### Associations professionnelles (5)

| # | ID | Nom | Métier | Commune |
|---|-----|-----|--------|---------|
| 1 | art-139 | Parcours des Ateliers Carougeois — PAC | Métiers d'art | Carouge |
| 2 | art-140 | Label Genève | Métiers d'art | Bernex |
| 3 | art-141 | Association Romande des Métiers de la Bijouterie — ASMEBI | Bijouterie-joaillerie | Carouge |
| 4 | art-142 | MBG — Groupement des Métiers techniques du Bâtiment Genève | Métiers du bâtiment | Genève |
| 5 | art-143 | ARMP — Association Romande des Métiers de la Pierre | Métiers de la pierre | Clarens |

### Partenaires (2)

| # | ID | Nom | Métier | Commune |
|---|-----|-----|--------|---------|
| 1 | art-144 | UFGVV | Horlogerie | Genève |
| 2 | art-145 | OFPC | Formation | Genève |

---

## Cas à confirmer par MAG

Les entités suivantes présentent une ambiguïté de classement. Le type attribué est notre meilleure hypothèse ; MAG devra confirmer ou corriger.

### 1. Bracelets Protexo SA (art-4) — type `artisan`

**Raison du doute :** le nom « SA » et le métier « Maroquinière » suggèrent une entreprise industrielle plutôt qu'un atelier artisanal. Toutefois, la présence dans le répertoire des métiers d'art et la catégorie « Art du cuir » penchent vers `artisan`.

**Question :** s'agit-il d'un atelier de fabrication artisanale ou d'une entreprise industrielle ?

### 2. Luxhous SA (art-5) — type `artisan`

**Raison du doute :** même situation que Protexo. Société anonyme en sellerie, classée `artisan` car présente dans le répertoire métiers d'art.

### 3. Roger Truan SA (art-6) — type `artisan`

**Raison du doute :** société anonyme en gainière. Classée `artisan` car le métier (gainière) est un métier d'art reconnu.

### 4. Lachenal SA (art-40) — type `artisan`

**Raison du doute :** société anonyme, métier « Courtepointier ». Classée `artisan`.

### 5. Barro & Cie SA (art-49) — type `artisan`

**Raison du doute :** société anonyme en menuiserie. Classée `artisan`.

### 6. Blandenier SA (art-17) — type `artisan`

**Raison du doute :** société anonyme en gravure/émaillage/sertissage horloger. Classée `artisan` car ces métiers sont typiquement artisanaux.

### 7. ARMP — Association Romande des Métiers de la Pierre (art-143) — type `association_professionnelle`

**Raison du doute :** domiciliée à **Clarens**, qui est une commune vaudoise et non genevoise. C'est la seule entité hors canton de Genève dans le répertoire.

**Questions :**
- L'ARMP doit-elle rester dans le répertoire MAG ?
- La commune de Clarens doit-elle être comptée dans le décompte des communes ?

### 8. Ateliers horlogers de Van Cleef & Arpels (art-138) — type `ecole_formatrice`

**Raison du doute :** il s'agit d'un atelier de formation interne à une maison de luxe, pas d'une école publique au sens classique. Classé `ecole_formatrice` car sa fonction principale est la formation aux métiers de l'horlogerie.

**Question :** ce statut est-il correct, ou s'agit-il plutôt d'un `artisan` / `partenaire` ?

### 9. Orthethic (art-11) — type `artisan`

**Raison du doute :** le nom suggère une activité orthopédique plutôt qu'artisanale au sens métiers d'art. Classé `artisan` car listé sous « Art du cuir » avec le métier « Bottier ».

### 10. Cerutti Toitures SA (art-103) — type `artisan`

**Raison du doute :** société anonyme dont le nom évoque une entreprise de couverture, mais le métier attribué est « Ferblantier ornemaniste », qui est bien un métier d'art.

---

## Métiers uniques (dédoublonnés)

Le site affichait précédemment 106 métiers, doublons compris. Après dédoublonnage (un métier = une occurrence unique du champ `craft` parmi les artisans uniquement), on obtient **82 métiers distincts**.

Exemples de doublons résolus :
- « Bijoutier » apparaît chez plusieurs artisans (art-15, art-19, art-20, etc.) → 1 métier
- « Céramiste » apparaît chez art-72, art-73, art-74, art-76, art-77 → 1 métier
- « Luthier » apparaît chez art-67, art-68 → 1 métier

**Note :** le champ `craft` contient parfois plusieurs métiers séparés par « • » (ex. « Bijoutier • Joaillier • Sertisseur »). Le dédoublonnage actuel porte sur la chaîne complète, pas sur chaque métier individuel. Si MAG souhaite compter les métiers individuellement (chaque terme après « • » comme un métier distinct), le décompte sera différent et devra être recalculé.
