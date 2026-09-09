export const metadata = {
  title: "Manufacto",
  description:
    "Manufacto, la fabrique des savoir-faire — programme initié par la Fondation d'entreprise Hermès, déployé à Genève par le DIP et MAG.",
};

const editions = [
  {
    year: 2026,
    schools: ["École primaire Les Ouches", "École primaire Satigny-Mairie"],
  },
  {
    year: 2025,
    schools: ["École primaire Tambourine", "Cycle d'orientation Sécheron"],
  },
  {
    year: 2024,
    schools: ["École primaire Hugo-de-Senger", "Cycle d'orientation Florence"],
  },
];

export default function ManufactoPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-mag-cream/60 to-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-mag-red font-semibold uppercase tracking-wide text-sm mb-2">
            Fondation d&apos;entreprise Hermès × DIP × MAG
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-mag-dark font-serif">
            Manufacto, la fabrique des savoir-faire
          </h1>
        </div>
      </section>

      {/* Présentation */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-lg text-mag-dark/70 leading-relaxed">
            Manufacto est un programme initié et développé par la{" "}
            <strong>Fondation d&apos;entreprise Hermès</strong>, déployé à Genève
            par le <strong>DIP</strong> (Département de l&apos;instruction publique,
            de la formation et de la jeunesse) et <strong>MAG</strong>. Il permet à
            deux classes genevoises de découvrir les métiers de l&apos;artisanat et
            leurs savoir-faire. Projet pilote débuté en 2024, en complémentarité avec
            l&apos;enseignement des activités créatrices, manuelles et des arts visuels.
          </p>
        </div>
      </section>

      {/* Éditions */}
      <section className="py-12 bg-mag-sand">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-mag-red mb-8">Écoles participantes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {editions.map((ed) => (
              <div
                key={ed.year}
                className="rounded-xl border border-mag-cream bg-white p-6"
              >
                <p className="text-3xl font-black text-mag-red">{ed.year}</p>
                <ul className="mt-3 space-y-1">
                  {ed.schools.map((s) => (
                    <li key={s} className="text-sm text-mag-dark/70 flex items-start gap-2">
                      <span className="text-mag-red mt-0.5">▸</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnement */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-mag-red mb-6">Fonctionnement</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-mag-dark mb-2">Métiers concernés</h3>
              <ul className="space-y-2 text-sm text-mag-dark/70">
                <li className="flex items-center gap-2"><span className="text-mag-red">▸</span> Menuiserie (bois)</li>
                <li className="flex items-center gap-2"><span className="text-mag-red">▸</span> Sellerie-garnissage (cuir)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-mag-dark mb-2">Format</h3>
              <ul className="space-y-2 text-sm text-mag-dark/70">
                <li className="flex items-center gap-2"><span className="text-mag-red">▸</span> 12 séances de 2 heures</li>
                <li className="flex items-center gap-2"><span className="text-mag-red">▸</span> Sur le deuxième semestre</li>
                <li className="flex items-center gap-2"><span className="text-mag-red">▸</span> Réalisation d&apos;un objet contemporain dans une matière noble</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-mag-cream/30 p-6">
            <h3 className="font-bold text-mag-dark mb-3">Objectifs pédagogiques</h3>
            <ul className="space-y-2 text-sm text-mag-dark/70 leading-relaxed">
              <li>• Approche esthétique : s&apos;interroger sur le rôle des objets, les formes et les matières.</li>
              <li>• Découverte d&apos;aptitudes « non académiques ».</li>
              <li>• Promotion des valeurs portées par ces métiers : transmission, entraide, exigence.</li>
              <li>• Compagnonnage inédit entre artisan·e·s et élèves : la classe se vit différemment.</li>
              <li>• Transmettre pour favoriser l&apos;épanouissement, révéler des talents, susciter des vocations.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contexte institutionnel */}
      <section className="py-12 bg-mag-cream/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-mag-red mb-4">Contexte institutionnel</h2>
          <p className="text-mag-dark/70 leading-relaxed">
            Programme lancé en 2016 par la Fondation Hermès, déployé dans plusieurs pays.
            S&apos;inscrit dans les objectifs du DIP : faire connaître des métiers accessibles
            par l&apos;apprentissage ; permettre l&apos;entrée directe en formation professionnelle
            duale après le cycle — mesure phare du DIP pour la législature 2023–2028.
            MAG coordonne la mise en place dans les établissements scolaires et valorise les
            savoir-faire via son réseau d&apos;artisan·e·s.
          </p>

          <div className="mt-8 rounded-xl border border-mag-cream bg-white p-6">
            <h3 className="font-bold text-mag-dark mb-2">Média</h3>
            <p className="text-sm text-mag-dark/70 mb-2">
              Émission Eurêka (RTS) — « Manufacto, un programme pédagogique d&apos;ateliers
              d&apos;initiation aux métiers de bois et cuir », épisode du 22 mars 2024.
            </p>
            <a
              href="https://www.rts.ch/audio-podcast"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-mag-red hover:underline"
            >
              Écouter sur rts.ch/audio-podcast →
            </a>
          </div>

          <p className="mt-6 text-sm text-mag-gray">
            Contact média :{" "}
            <a href="mailto:contact@metiersdart-geneve.ch" className="text-mag-red hover:underline">
              contact@metiersdart-geneve.ch
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
