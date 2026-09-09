import type { Metadata } from "next";
import {
  MetiersFormationsTable,
  type MetierFormation,
} from "@/components/metiers/MetiersFormationsTable";

export const metadata: Metadata = {
  title: "Métiers et formations",
  description:
    "Tous les métiers d'art exercés par les professionnel·le·s du répertoire MAG, avec définitions INMA et formations suisses.",
};

const metiersFormations: MetierFormation[] = [
  {
    metier: "Bijoutier·ière",
    definition:
      "Le.la bijoutier.ière réalise des bijoux en métal (précieux ou non), terre, verre, textile, bois… en petite série ou en pièce unique. Il.elle travaille la matière selon des techniques diverses, adaptées au matériau utilisé.",
    formations: ["Bijoutier CFC / Bijoutière CFC"],
    category: "Art de l'horlogerie et de la bijouterie",
  },
  {
    metier: "Bottier·ière",
    definition:
      "Coupe, couture, assemblage et montage du cuir : le.la bottier.ière main crée des chaussures sur mesure. À partir du dessin du contour et de l'empreinte du pied, reporté sur une forme en bois, il.elle travaille les pièces de cuir par piquage, collage, rivetage, agrafage et enfin lustrage.",
    formations: ["Cordonnier CFC / Cordonnière CFC", "Bottier-orthopédiste CFC / Bottière-orthopédiste CFC"],
    category: "Art du cuir",
  },
  {
    metier: "Brodeur·euse",
    definition:
      "À l'aide de fils de lin, de coton, de soie, de laine, le.la brodeur.euse crée des motifs en aplat ou en relief sur des tissus variés. Il.elle travaille à la main, à l'aide d'une aiguille ou d'un crochet, ou à la machine.",
    formations: ["Courtepointier CFC / Courtepointière CFC"],
    category: "Art du textile",
  },
  {
    metier: "Calligraphe",
    definition:
      "Le.la calligraphe recherche l'expressivité dans le tracé de caractères latins, chinois, hébraïques, arabes. Il.elle utilise la plume d'oie ou métallique, le calame de roseau ou le pinceau sur du papier vélin ou du parchemin.",
    formations: ["Technologue en médias CFC"],
    category: "Arts appliqués",
  },
  {
    metier: "Céramiste",
    definition:
      "Avec la terre cuite, la faïence, le grès ou la porcelaine, le.la céramiste transforme la pâte molle et crue en objet dur et inaltérable. Il.elle prépare les terres et les travaille par modelage, tournage ou moulage.",
    formations: ["Céramiste CFC"],
    category: "Art de la terre",
  },
  {
    metier: "Chaîniste",
    definition:
      "À partir d'un métal précieux enroulé sur un mandrin puis coupé avec une lame de scie, le.la chaîniste fabrique des chaînes d'anneaux métalliques fermés par soudure.",
    formations: ["Bijoutier CFC / Bijoutière CFC"],
    category: "Art de l'horlogerie et de la bijouterie",
  },
  {
    metier: "Chapelier·ière",
    definition:
      "Le chapelier réalise des chapeaux en une seule pièce sur des formes en bois ou en aluminium, par l'assemblage de tresses sur des machines chaînette, ou par l'assemblage des pièces de tissu sur des piqueuses plates.",
    formations: ["Confectionneur AFP / Confectionneuse AFP", "Créateur de vêtements CFC / Créatrice de vêtements CFC"],
    category: "Art du textile",
  },
  {
    metier: "Charpentier·ière",
    definition:
      "D'après un plan, le.la charpentier.ière choisit ses bois — chêne, châtaignier ou sapin — dont il.elle peut exploiter les courbures naturelles. Il.elle taille les pièces principales appelées fermes, poutres, pannes, chevrons, tenons et mortaises, et les assemble.",
    formations: ["Charpentier CFC / Charpentière CFC"],
    category: "Art du bois",
  },
  {
    metier: "Conservateur·trice-restaurateur·trice d'œuvres d'art",
    definition:
      "Le.la conservateur.trice-restaurateur.trice assure la préservation de biens culturels de toutes époques touchant des domaines variés. Spécialistes d'une technique ou d'un matériau (peintures, sculptures, photographies, textiles, métaux, poteries…), il.elle s'appuie sur des règles internationales d'éthique pour examiner, analyser puis traiter les objets d'art qui lui sont confiés.",
    formations: ["Doreur-encadreur CFC / Doreuse-encadreuse CFC", "Conservateur-restaurateur HES / Conservatrice-restauratrice HES"],
    category: "Art de la conservation et de la restauration",
  },
  {
    metier: "Constructeur·trice métallique",
    definition:
      "Le.la constructeur.trice métallique conçoit, fabrique et pose des ouvrages métalliques pour le bâtiment. Pour réaliser rampes d'escalier, balcons, portails, il.elle met en forme acier, aluminium, cuivre, inox ou laiton.",
    formations: ["Constructeur métallique CFC / Constructrice métallique CFC"],
    category: "Art du métal",
  },
  {
    metier: "Cordonnier·ière",
    definition:
      "Le.la cordonnier.ière répare et rénove des chaussures de tous genres en cuir ou en matières synthétiques. Il.elle adapte et corrige aussi certaines chaussures pour les personnes rencontrant des problèmes orthopédiques.",
    formations: ["Cordonnier CFC / Cordonnière CFC"],
    category: "Art du cuir",
  },
  {
    metier: "Costumier·ière",
    definition:
      "Maîtrisant les techniques du.de la tailleur.euse et du.de la couturier.ière, le.la costumier.ière confectionne des habits de scène contemporains ou d'époque. Il.elle prend les mesures de chaque comédien.ne et détermine les techniques de coupes et d'assemblages.",
    formations: ["Créateur de vêtements CFC / Créatrice de vêtements CFC", "Costumier de théâtre / Costumière de théâtre"],
    category: "Art du textile",
  },
  {
    metier: "Courtepointier·ière",
    definition:
      "La courtepointière ou le courtepointier confectionnent et posent des produits de décoration d'intérieur en tissu : rideaux, voilages, coussins, housses de literie, linge de table, couvertures, accessoires.",
    formations: ["Courtepointier CFC / Courtepointière", "Couturier d'intérieur AFP / Couturière d'intérieur AFP"],
    category: "Art du textile",
  },
  {
    metier: "Coutelier·ière",
    definition:
      "Le.la coutelier.ière forge un bloc généralement d'acier. Il.elle affine la matière par traitement thermique puis assure le tranchant de la lame par l'émouture. Il.elle réalise le manche dans des matériaux très divers tels corne, bois, ivoire, porcelaine, fibre de carbone…",
    formations: ["Coutelier CFC / Coutelière CFC"],
    category: "Art du métal",
  },
  {
    metier: "Couturier·ière / Créateur·trice de vêtement",
    definition:
      "L'art du.de la couturier.ière consiste à interpréter l'idée d'un vêtement puis à le réaliser d'aplomb et sur mesure. Maillon indispensable dans la chaîne de création d'une collection, le.la couturier.ière effectue et/ou supervise les différentes étapes entre le croquis et le prototype.",
    formations: ["Créateur de vêtements CFC / Créatrice de vêtements CFC"],
    category: "Art du textile",
  },
  {
    metier: "Décorateur·trice sur mouvement horloger",
    definition:
      "Il.elle conçoit l'ensemble des éléments esthétiques et fonctionnels d'une montre, du cadran au bracelet, en respectant un cahier des charges précis. Son activité associe créativité, maîtrise technique et collaboration étroite avec les différents acteurs de l'industrie horlogère.",
    formations: ["Designer d'objets horlogers"],
    category: "Art de l'horlogerie et de la bijouterie",
  },
  {
    metier: "Découpeur·euse sur papier",
    definition:
      "Le.la découpeur.euse sur papier manipule, transforme et modèle la matière pour lui donner du volume. Plusieurs techniques sont à sa disposition : pliage, découpage, collage, couture ou tressage.",
    formations: ["Opérateur de médias imprimés CFC / Opératrice de médias imprimés CFC"],
    category: "Art du papier",
  },
  {
    metier: "Doreur·euse",
    definition:
      "Sur un bois nettoyé et encollé, le.la doreur.euse applique le gros blanc, amalgame poncé une fois sec. Il.elle dépose alors l'assiette à dorer qui va recevoir la feuille d'or. Le brunissage effectué à l'agate permet de révéler tout le brillant de l'or.",
    formations: ["Doreur-encadreur CFC / Doreuse-encadreuse CFC"],
    category: "Art du bois",
  },
  {
    metier: "Ébéniste",
    definition:
      "L'ébéniste conçoit et réalise des meubles d'agencement, des meubles de style ou de création, à l'unité ou en petite série. Traditionnellement attaché au travail du bois, notamment d'essences rares et précieuses, le métier s'ouvre à l'utilisation de tous types de matériaux : corian, textile, métal, verre…",
    formations: ["Menuisier CFC : ébénisterie / Menuisière CFC : ébénisterie"],
    category: "Art du bois",
  },
  {
    metier: "Émailleur·euse",
    definition:
      "Pour orner montres et pièces d'horlogerie, l'émailleur sur cadrans choisit les techniques du champlevé, du cloisonné ou de la peinture. La poudre d'émail est appliquée au pinceau ou à la spatule. Plusieurs cuissons révèlent les couleurs.",
    formations: ["Emailleur — émailleuse, domaine horlogerie/joaillerie"],
    category: "Art de l'horlogerie et de la bijouterie",
  },
  {
    metier: "Fabricant·e d'abat-jour",
    definition:
      "Le.la fabricant·e d'abat-jour conçoit la forme et réalise la structure de l'abat-jour puis procède à son habillage. Traditionnellement en tissu, l'abat-jour peut être composé d'autres matériaux : bois, métal, plumes, papier.",
    formations: ["Technicien ES en textile et habillement / Technicienne ES en textile et habillement"],
    category: "Art du textile",
  },
  {
    metier: "Encadreur·euse",
    definition:
      "Le travail de l'encadreur.euse est avant tout de protéger et de mettre en valeur un document ou un objet. La connaissance des œuvres, de leur style, des techniques et des matières est essentielle pour déterminer les matériaux ou le type de baguettes à utiliser.",
    formations: ["Doreur-encadreur CFC / Doreuse-encadreuse CFC"],
    category: "Art du bois",
  },
  {
    metier: "Fabricant·e de compositions et décors végétaux stables et durables",
    definition:
      "L'artisan.e fleuriste traite, entretient et arrange des fleurs coupées et des plantes. Il.elle crée et réalise des compositions florales en utilisant des matières végétales ou artificielles, mêlées parfois d'accessoires.",
    formations: ["Fleuriste CFC"],
    category: "Art de la terre",
  },
  {
    metier: "Facteur·trice de pianos",
    definition:
      "Le.la facteur.trice de pianos est maître de trois spécialités : celle du bois, du métal et de la mécanique. Pour la fabrication des pianos neufs, les étapes sont confiées à chaque spécialiste mais, en restauration, l'artisan.e doit toutes les maîtriser.",
    formations: ["Facteur de piano CFC / Factrice de piano CFC"],
    category: "Art de la facture instrumentale",
  },
  {
    metier: "Fabricant·e de décors de spectacle",
    definition:
      "Le fabricant de décors de spectacle maîtrise les techniques du dessin, de la couleur, du volume, de la perspective, de l'architecture. Il réalise une maquette plane, puis en volume, assure le suivi technique et supervise le montage des décors.",
    formations: ["Scénographe HES", "Menuisier CFC / Menuisière CFC"],
    category: "Institutions culturelles",
  },
  {
    metier: "Ferblantier·ière ornemaniste",
    definition:
      "S'il.elle traite toute la couverture, le.la ferblantier.ière ornemaniste est surtout un.une spécialiste des ornements de toiture : œil-de-bœuf, lucarne, bandeau décoratif… Il.elle travaille le zinc, le plomb et le cuivre selon des méthodes traditionnelles.",
    formations: ["Ferblantier CFC / Ferblantière CFC"],
    category: "Art du métal",
  },
  {
    metier: "Ferronnier·ière",
    definition:
      "Le ferronnier-forgeron met en forme le fer à chaud par forgeage, c'est-à-dire le battage du métal au marteau sur une enclume. Il réalise des grilles, garde-corps, rampes d'escalier mais aussi de petits objets décoratifs ou du mobilier.",
    formations: ["Constructeur métallique CFC / Constructrice métallique CFC"],
    category: "Art du métal",
  },
  {
    metier: "Gainier·ière",
    definition:
      "Le.la gainier.ière fabrique des gaines, écrins, fourreaux, socles, coffrets, articles de bureau. Il.elle utilise des fûts (bois ou carcasse) ou des supports en carton et les recouvre de cuir, de papier ou de simili cuir.",
    formations: ["Artisan du cuir et du textile CFC / Artisane du cuir et du textile CFC"],
    category: "Art du cuir",
  },
  {
    metier: "Feutrier·ière",
    definition:
      "À partir de laine cardée ou peignée qu'il.elle répartit, humidifie et savonne manuellement, le.la feutrier.ière permet aux fibres de laine de s'amalgamer afin de créer un feutre, textile non tissé.",
    formations: ["Artisan du cuir et du textile CFC / Artisane du cuir et du textile CFC"],
    category: "Art du textile",
  },
  {
    metier: "Horloger·ère",
    definition:
      "L'horloger.ère conçoit, fabrique et répare montres, pendules, horloges et réveils. Il.elle peut solliciter d'autres professionnel.le.s pour le décor des pièces ou la réalisation des boîtes : bijoutier.ière, émailleur.euse, marbrier.ière, ébéniste…",
    formations: ["Horloger CFC / Horlogère CFC"],
    category: "Art de l'horlogerie et de la bijouterie",
  },
  {
    metier: "Graveur·euse",
    definition:
      "Le.la graveur.euse entame le métal avec différents outils : burin, échoppe ou pointe sèche. En creusant des traits plus ou moins profonds, il.elle élabore un motif décoratif et des effets de surface, ou grave des caractères typographiques.",
    formations: ["Graveur CFC / Graveuse CFC"],
    category: "Art du métal",
  },
  {
    metier: "Graveur·euse taille douce",
    definition:
      "Le graveur en taille-douce utilise le burin, la pointe sèche ou l'acide pour graver une plaque de métal, le plus souvent du cuivre. Les incisions sont ensuite encrées à la main ou au tampon. La matrice et le papier humide sont passés sous presse.",
    formations: ["Graveur CFC / Graveuse CFC", "Gravure / sérigraphie / typographie — cours et stages"],
    category: "Art du métal",
  },
  {
    metier: "Imprimeur·euse en sérigraphie",
    definition:
      "À partir d'un dessin reproduit sur un cadre tendu de nylon servant de pochoir, l'imprimeur·euse en sérigraphie applique et racle la peinture pour permettre le transfert du motif sur la pièce textile.",
    formations: ["Technologue en médias CFC"],
    category: "Art du papier",
  },
  {
    metier: "Joaillier·ière",
    definition:
      "Le.la joaillier.ière réalise des bijoux ornés de pierres précieuses ou fines. Il.elle prévoit l'emplacement au sein duquel la pierre sera mise en valeur, perce la monture puis procède au fraisage afin d'accueillir la pierre.",
    formations: ["Bijoutier CFC / Bijoutière CFC"],
    category: "Art de l'horlogerie et de la bijouterie",
  },
  {
    metier: "Luthier·ière",
    definition:
      "Le.la luthier.ière en guitare fabrique, répare et restaure des guitares acoustiques, électriques et des basses. Le.la luthier.ière du quatuor crée et restaure violons, altos, violoncelles, contrebasses. À l'aide de rabots, gouges et canifs, il.elle travaille le bois d'érable pour la tête, l'épicéa pour la table d'harmonie, l'ébène pour la touche.",
    formations: ["Luthier CFC / Luthière CFC"],
    category: "Art de la facture instrumentale",
  },
  {
    metier: "Maquettiste",
    definition:
      "Le.la maquettiste réalise des modèles réduits en trois dimensions pour l'industrie, le design, l'architecture, l'urbanisme ou la scénographie. Il.elle a recours à des techniques diverses : tournage, thermoformage, moulage, peinture, assemblage.",
    formations: ["Maquettiste d'architecture CFC"],
    category: "Arts appliqués",
  },
  {
    metier: "Maroquinier·ière",
    definition:
      "Le.la maroquinier.ière produit des articles usuels et de luxe. Il.elle utilise des cuirs souples, des petites peaux et des accessoires tels que tissu, lamés et matériaux fantaisie. Il.elle réalise les objets par coupe, couture, collage, contrecollage et rembordage.",
    formations: ["Artisan du cuir et du textile CFC / Artisane du cuir et textile CFC"],
    category: "Art du cuir",
  },
  {
    metier: "Marbrier",
    definition:
      "Le marbrier est spécialisé dans le sciage, la taille et le polissage du marbre en blocs ou en tranches. Il œuvre dans le domaine de la décoration, proposant mobilier, cheminées, carrelages, escaliers, ou dans le domaine funéraire.",
    formations: ["Tailleur de pierre CFC / Tailleuse de pierre CFC"],
    category: "Art de la pierre",
  },
  {
    metier: "Menuisier·ière",
    definition:
      "Avec du bois massif, le.la menuisier.ière réalise portes, fenêtres, volets, lambris. Il.elle anticipe les déformations du bois en ajustant les pièces par embrèvement, un assemblage figé par des chevilles. Il.elle intervient en création sur mesure ou en restauration du patrimoine.",
    formations: ["Menuisier CFC / Menuisière CFC"],
    category: "Art du bois",
  },
  {
    metier: "Modiste",
    definition:
      "Le·la modiste est un créateur de chapeaux et d'accessoires de tête (ville et spectacle). Il·elle maîtrise toutes les techniques du métier : fabrication à partir de moules, de supports divers ou à main levée.",
    formations: ["Diplôme de Modiste"],
    category: "Art du textile",
  },
  {
    metier: "Oculariste",
    definition:
      "L'oculariste réalise des prothèses oculaires, sur mesure, pour des personnes ayant perdu l'usage d'un œil. Deux techniques existent : les prothèses de verre soufflé et celles en résines synthétiques.",
    formations: ["Souffleur de verre pour appareils scientifiques CFC / Souffleuse de verre pour appareils scientifiques CFC"],
    category: "Art du verre",
  },
  {
    metier: "Peintre décorateur·trice",
    definition:
      "Le.la peintre en décor œuvre principalement dans les secteurs de la décoration intérieure et du décor de spectacle. Il.elle marie techniques et matières pour réaliser trompe-l'œil, patines, panoramiques… in situ ou sur toile.",
    formations: ["Peintre CFC", "Peintre en décors de théâtre CFC", "Peintre en décor du patrimoine"],
    category: "Arts appliqués",
  },
  {
    metier: "Relieur·euse",
    definition:
      "Reliure classique ou contemporaine, le.la relieur.euse habille le livre en fonction de son usage futur. Il.elle assemble les cahiers par couture et les recouvre de plats cartonnés parfois ornés de cuirs, de papier et titrés à l'or.",
    formations: ["Opérateur de médias imprimés CFC / Opératrice en médias imprimés CFC"],
    category: "Art du papier",
  },
  {
    metier: "Restaurateur·trice de documents graphiques et imprimés",
    definition:
      "Le.la restaurateur.trice de documents graphiques et imprimés travaille sur papier ou parchemin : livre, archive, affiche, estampe, lithographie, dessin, pastel, papier peint…",
    formations: ["Opérateur en médias imprimés CFC / Opératrice en médias imprimés CFC", "Conservateur-restaurateur HES / Conservatrice-restauratrice HES"],
    category: "Art de la conservation et de la restauration",
  },
  {
    metier: "Sculpteur·trice sur bois",
    definition:
      "Le.la sculpteur.euse sur bois taille le bois afin de faire naître des motifs ou des formes. Il.elle peut réaliser des sculptures en bas-reliefs plus ou moins profonds ou des sculptures en ronde-bosse en trois dimensions.",
    formations: ["Sculpteur sur bois CFC / Sculptrice sur bois CFC", "Artiste plasticien HES / Artiste plasticienne HES"],
    category: "Art du bois",
  },
  {
    metier: "Sellier·ière",
    definition:
      "Le.la sellier.ère-maroquinier.ière fabrique des articles tels que portefeuilles, porte-cartes, sacs à main, ceintures, réalisés « façon sellier » avec des bords francs cousus à la main. Le.la sellier.ère-harnacheur.euse réalise toutes les pièces en cuir indispensables à l'équipement d'un cheval.",
    formations: ["Artisan du cuir et du textile CFC / Artisane du cuir et textile CFC"],
    category: "Art du cuir",
  },
  {
    metier: "Scénographe",
    definition:
      "Le.la scénographe crée l'atmosphère d'un film ou d'une pièce de théâtre. Il.elle conçoit et adapte les décors d'une scène de théâtre, d'opéra ou d'un plateau de tournage en tenant compte des contraintes techniques et financières.",
    formations: ["Polydesigner 3D CFC", "Scénographe HES"],
    category: "Institutions culturelles",
  },
  {
    metier: "Sculpteur·trice sur pierre",
    definition:
      "Le.la sculpteur.trice sur pierre réalise des ornements et des motifs décoratifs en bas-relief ou des sculptures en ronde-bosse ou en haut-relief. La pierre est choisie en fonction de ses caractéristiques physiques : densité, volume, surface, dureté et fiabilité.",
    formations: ["Tailleur de pierre CFC / Tailleuse de pierre CFC", "Artiste plasticien HES / Artiste plasticienne HES"],
    category: "Art de la pierre",
  },
  {
    metier: "Staffeur·euse — stucateur·euse",
    definition:
      "Les réalisations du.de la staffeur.euse — stucateur.euse sont ornementales (moulures, faux-plafonds…) ou fonctionnelles (améliorations thermiques, acoustiques…). Il.elle travaille un mélange de plâtre, le staff, ou un enduit imitant le marbre et la pierre, le stuc.",
    formations: ["Plâtrier constructeur à sec CFC / Plâtrière constructrice à sec CFC"],
    category: "Art de la pierre",
  },
  {
    metier: "Tailleur·euse",
    definition:
      "L'art du.de la tailleur.euse consiste à réaliser entièrement à la main des vêtements emblématiques du vestiaire masculin : costumes composés d'un veston, d'un pantalon et éventuellement d'un gilet, smokings, manteaux, etc.",
    formations: ["Créateur de vêtements CFC / Créatrice de vêtements CFC", "Designer HES en design mode"],
    category: "Art du textile",
  },
  {
    metier: "Sertisseur·euse",
    definition:
      "Le.la sertisseur.euse enchâsse les pierres précieuses dans un étau de bois, la « poignée », et les protège par une couche de cire chaude. Il.elle détermine ensuite le type de sertissage le plus adapté : serti à griffes, serti clos, serti à grains ou serti rail.",
    formations: ["Sertisseur de pierres précieuses CFC / Sertisseuse de pierres précieuses CFC"],
    category: "Art de l'horlogerie et de la bijouterie",
  },
  {
    metier: "Tapissier·ière",
    definition:
      "Le.la tapissier.ière d'ameublement façonne des étoffes pour réaliser des décors textile dans les espaces intérieurs. Il.elle fabrique et pose tentures, voilages, rideaux et coussins. Il.elle est aussi spécialisé.e dans la réalisation de garnitures de sièges anciens ou contemporains.",
    formations: ["Tapissier-décorateur CFC / Tapissière-décoratrice CFC"],
    category: "Art du textile",
  },
  {
    metier: "Verrier",
    definition:
      "Le verrier décorateur est capable de réaliser des opérations de transformation, de décoration, de parachèvement du verre et peut également concevoir un ouvrage dans son ensemble.",
    formations: ["Vitrail, verre", "Verrier créateur"],
    category: "Art du verre",
  },
];

export default function MetiersFormationsPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-mag-cream/60 to-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-black text-mag-dark font-serif">
            Métiers et formations
          </h1>
          <p className="mt-4 max-w-3xl text-mag-dark/70 leading-relaxed">
            Cette page répertorie tous les métiers d&apos;art exercés par les
            professionnel.le.s enregistré.e.s au répertoire MAG. Les définitions,
            non exhaustives, sont tirées du site de notre homologue français,
            l&apos;Institut National des Métiers d&apos;Art (INMA). Lorsqu&apos;une
            formation est disponible en Suisse, elle est indiquée par son titre.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MetiersFormationsTable data={metiersFormations} />
        </div>
      </section>
    </>
  );
}
