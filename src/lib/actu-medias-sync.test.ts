import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import {
  isBlobUrl,
  isOldSiteUrl,
  localDay,
  mediaKeys,
  planActualites,
  planMedias,
  type ActuRow,
  type MediaRow,
} from "./actu-medias-sync";
import { staticActualites, staticMedias, type StaticActu, type StaticMedia } from "./actu-medias-static";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const BLOB = "https://yembb8auyuh5e2pu.public.blob.vercel-storage.com/migration-joomla";

const actuRow = (over: Partial<ActuRow> & Pick<ActuRow, "id" | "title">): ActuRow => ({
  category: null,
  source: null,
  subtitle: null,
  excerpt: null,
  eventDate: null,
  eventEndDate: null,
  timeLabel: null,
  linkUrl: null,
  linkLabel: null,
  imageUrl: null,
  published: true,
  isArchived: false,
  ...over,
});

const mediaRow = (over: Partial<MediaRow> & Pick<MediaRow, "id" | "title" | "type">): MediaRow => ({
  mediaType: null,
  videoUrl: null,
  externalUrl: null,
  pdfUrl: null,
  date: null,
  source: null,
  sortOrder: 0,
  published: true,
  ...over,
});

/** Ligne en base équivalente à une donnée statique (pour vérifier « rien à faire »). */
const actuFromStatic = (a: StaticActu, id: string): ActuRow =>
  actuRow({
    id,
    title: a.title,
    category: a.badge,
    source: a.source,
    subtitle: a.subtitle,
    excerpt: a.description,
    eventDate: a.eventDate,
    eventEndDate: a.eventEndDate,
    timeLabel: a.timeLabel,
    linkUrl: a.linkUrl,
    linkLabel: a.linkLabel,
    imageUrl: a.imageUrl,
  });

const mediaFromStatic = (m: StaticMedia, id: string): MediaRow =>
  mediaRow({
    id,
    title: m.title,
    type: m.type,
    mediaType: m.videoUrl ? (m.videoUrl.includes("vimeo") ? "vimeo" : "youtube") : null,
    videoUrl: m.videoUrl,
    externalUrl: m.externalUrl,
    pdfUrl: m.pdfUrl,
    date: m.date,
    source: m.source,
    sortOrder: m.sortOrder,
  });

describe("URL : ancien site / Blob, jour local", () => {
  test("isOldSiteUrl / isBlobUrl", () => {
    assert.equal(isOldSiteUrl("https://metiersdart-geneve.ch/presse/AvenueClip.pdf"), true);
    assert.equal(isOldSiteUrl("http://www.metiersdart-geneve.ch/images/x.png"), true);
    assert.equal(isOldSiteUrl("https://metiersdart-geneve.ch.evil.com/x"), false);
    assert.equal(isOldSiteUrl(`${BLOB}/x.png`), false);
    assert.equal(isOldSiteUrl(null), false);
    assert.equal(isBlobUrl(`${BLOB}/x.png`), true);
    assert.equal(isBlobUrl("https://vercel-blob.com/x"), true);
    assert.equal(isBlobUrl("https://metiersdart-geneve.ch/x"), false);
  });

  test("localDay", () => {
    assert.equal(localDay(d(2026, 10, 14)), "2026-10-14");
    assert.equal(localDay(d(2027, 3, 1)), "2027-03-01");
    assert.equal(localDay(null), null);
  });
});

describe("planActualites", () => {
  test("base alignée sur le statique : rien à faire", () => {
    const rows = staticActualites.map((a, i) => actuFromStatic(a, `r${i}`));
    const plan = planActualites(staticActualites, rows);
    assert.equal(plan.unchanged.length, staticActualites.length);
    assert.deepEqual([plan.updates, plan.inserts, plan.unpublish, plan.uploads], [[], [], [], []]);
  });

  test("état de la prod du 29.09 : 5 mises à jour (étiquette / source / dates / libellés), FER dépubliée", () => {
    // Lignes du seed : category = source ou étiquette, pas de date, image déjà sur Blob
    const seeded = (a: StaticActu, i: number, category: string) =>
      actuRow({
        id: `seed${i}`,
        title: a.title,
        category,
        excerpt: a.description,
        linkUrl: a.linkUrl,
        imageUrl: a.imageUrl,
      });
    const rows = [
      seeded(staticActualites[0], 0, "En ce moment"),
      seeded(staticActualites[1], 1, "En ce moment"),
      actuRow({
        id: "fer",
        title: "TRANSMISSION D'ENTREPRISE : SÉCURISEZ VOTRE AVENIR",
        category: "FER Genève",
        imageUrl: `${BLOB}/actualites/fer-112060-011.png`,
      }),
      seeded(staticActualites[2], 2, "Métiers d'Art Genève"),
      seeded(staticActualites[3], 3, "ACG — Métiers du bois — Charpentier·ère"),
      seeded(staticActualites[4], 4, "Métiers d'Art Genève"),
    ];
    const plan = planActualites(staticActualites, rows);
    assert.deepEqual(plan.inserts, []);
    assert.deepEqual(plan.uploads, []);
    assert.deepEqual(plan.unpublish.map((u) => u.id), ["fer"]);
    assert.equal(plan.unchanged.length, 0);
    assert.deepEqual(plan.updates.map((u) => u.id), ["seed0", "seed1", "seed2", "seed3", "seed4"]);
    // Sondage locaux : seuls source et libellé manquent
    assert.deepEqual(plan.updates[0].changes, [
      { column: "source", from: null, to: "Métiers d'Art Genève" },
      { column: "link_label", from: null, to: "Plus d'info" },
    ]);
    // Conseil des artisans : étiquette retirée, source, date, horaire, libellé
    assert.deepEqual(plan.updates[2].changes, [
      { column: "category", from: "Métiers d'Art Genève", to: null },
      { column: "source", from: null, to: "Métiers d'Art Genève" },
      { column: "event_date", from: null, to: "2026-10-14" },
      { column: "time_label", from: null, to: "19h-20h30" },
      { column: "link_label", from: null, to: "Contact" },
    ]);
    // Prix de l'artisanat : sous-titre séparé de la source
    const prix = plan.updates[3].changes;
    assert.deepEqual(prix.find((c) => c.column === "subtitle"), { column: "subtitle", from: null, to: "Métiers du bois — Charpentier·ère" });
    assert.deepEqual(prix.find((c) => c.column === "source"), { column: "source", from: null, to: "ACG" });
    // JEMA 2027 : plage de dates
    const jema = plan.updates[4].changes;
    assert.deepEqual(jema.find((c) => c.column === "event_end_date"), { column: "event_end_date", from: null, to: "2027-03-21" });
  });

  test("titre rapproché hors casse et espaces ; ligne dépubliée ou archivée republiée", () => {
    const rows = [
      { ...actuFromStatic(staticActualites[0], "a"), title: "  sondage   locaux ", published: false, isArchived: true },
    ];
    const plan = planActualites([staticActualites[0]], rows);
    assert.equal(plan.inserts.length, 0);
    assert.deepEqual(plan.updates[0].changes, [
      { column: "title", from: "sondage   locaux", to: "SONDAGE LOCAUX" },
      { column: "published", from: false, to: true },
      { column: "is_archived", from: true, to: false },
    ]);
  });

  test("ligne absente → insertion avec toutes les colonnes ; déjà dépubliée → rien", () => {
    const plan = planActualites([staticActualites[2]], [actuRow({ id: "old", title: "Ancienne", published: false })]);
    assert.equal(plan.inserts.length, 1);
    assert.equal(plan.inserts[0].values.title, "CONSEIL DES ARTISANS");
    assert.equal(plan.inserts[0].values.event_date, "2026-10-14");
    assert.equal(plan.inserts[0].values.published, true);
    assert.equal(plan.inserts[0].values.is_archived, false);
    assert.deepEqual(plan.unpublish, []);
  });

  test("image attendue sur l'ancien site : Blob en base = à jour, sinon téléversement", () => {
    const joomla = { ...staticActualites[0], imageUrl: "https://metiersdart-geneve.ch/images/sondage.png" };
    const onBlob = actuFromStatic(staticActualites[0], "b");
    assert.deepEqual(planActualites([joomla], [onBlob]).uploads, []);
    assert.equal(planActualites([joomla], [onBlob]).unchanged.length, 1);
    const noImage = { ...onBlob, id: "n", imageUrl: null };
    const plan = planActualites([joomla], [noImage]);
    assert.deepEqual(plan.uploads, [
      { table: "actualites", id: "n", column: "image_url", oldUrl: joomla.imageUrl, accept: ["image"] },
    ]);
    assert.deepEqual(plan.updates[0].changes, [{ column: "image_url", from: null, to: joomla.imageUrl }]);
    const insert = planActualites([joomla], []);
    assert.deepEqual(insert.uploads[0], { table: "actualites", insert: 0, column: "image_url", oldUrl: joomla.imageUrl, accept: ["image"] });
  });

  test("deux lignes de même titre : la première est rapprochée, la seconde dépubliée", () => {
    const rows = [actuFromStatic(staticActualites[0], "first"), actuFromStatic(staticActualites[0], "second")];
    const plan = planActualites([staticActualites[0]], rows);
    assert.deepEqual(plan.unchanged.map((u) => u.id), ["first"]);
    assert.deepEqual(plan.unpublish.map((u) => u.id), ["second"]);
  });
});

describe("planMedias", () => {
  test("mediaKeys : vidéo, année de revue, titre", () => {
    assert.deepEqual(mediaKeys({ type: "video", title: "Feutrière", videoUrl: "https://vimeo.com/1176969466", date: null }), [
      "video:vimeo:1176969466",
      "title:feutrière",
    ]);
    assert.deepEqual(mediaKeys({ type: "presse", title: "Revue de presse JEMA 2026", videoUrl: null, date: d(2026, 1, 1) }), [
      "presse:2026",
      "title:revue de presse jema 2026",
    ]);
  });

  test("base alignée sur le statique : rien à faire", () => {
    const rows = staticMedias.map((m, i) => mediaFromStatic(m, `r${i}`));
    const plan = planMedias(staticMedias, rows);
    assert.equal(plan.unchanged.length, staticMedias.length);
    assert.deepEqual([plan.inserts, plan.unpublish, plan.updates, plan.uploads], [[], [], [], []]);
  });

  test("le repli statique ne pointe plus sur l'ancien site (PDF copiés sur Blob le 29.09)", () => {
    const urls = staticMedias.flatMap((m) => [m.externalUrl, m.pdfUrl, m.videoUrl]);
    assert.ok(urls.every((u) => !u || !isOldSiteUrl(u)));
  });

  test("état de la prod avant le sync du 29.09 : interview et archives retypées, revues renommées, PDF repris sur Blob", () => {
    const rows: MediaRow[] = staticMedias.map((m, i) => {
      const r = mediaFromStatic(m, `r${i}`);
      if (m.type === "interview") return { ...r, type: "video", sortOrder: 37 };
      if (m.type === "article") return { ...r, sortOrder: 38 + m.sortOrder };
      if (m.type === "presse") return { ...r, title: `Revue de presse ${m.title}`, pdfUrl: m.pdfUrl, sortOrder: 40 + (2026 - m.date!.getFullYear()) };
      // Avant le sync : archives typées « article », PDF encore sur l'ancien site
      if (m.type === "archive") {
        const file = m.externalUrl?.split("-").pop();
        return { ...r, type: "article", sortOrder: 45, externalUrl: file ? `https://metiersdart-geneve.ch/presse/${file}` : r.externalUrl };
      }
      return r;
    });
    const plan = planMedias(staticMedias, rows);
    assert.deepEqual(plan.inserts, []);
    assert.deepEqual(plan.unpublish, []);
    assert.equal(plan.unchanged.length, 37); // les capsules
    const byTitle = Object.fromEntries(plan.updates.map((u) => [u.title, u.changes]));
    assert.deepEqual(byTitle["Véronique Lombard, Ex-Vice-Présidente MAG"], [
      { column: "type", from: "video", to: "interview" },
      { column: "sort_order", from: 37, to: 0 },
    ]);
    assert.deepEqual(byTitle["Revue de presse JEMA 2026"], [
      { column: "title", from: "Revue de presse JEMA 2026", to: "JEMA 2026" },
      { column: "sort_order", from: 40, to: 0 },
    ]);
    const archive = staticMedias.find((m) => m.title.startsWith("JEMA 2021"))!;
    assert.deepEqual(byTitle["JEMA 2021 : l'artisanat au diapason"], [
      { column: "type", from: "article", to: "archive" },
      // Le statique porte déjà la copie Blob : reprise telle quelle, rien à téléverser
      { column: "external_url", from: "https://metiersdart-geneve.ch/presse/AvenueClip.pdf", to: archive.externalUrl },
      { column: "sort_order", from: 45, to: 0 },
    ]);
    assert.deepEqual(plan.uploads, []);
  });

  test("statique encore sur l'ancien site : le PDF est à téléverser", () => {
    const archive = staticMedias.find((m) => m.title.startsWith("JEMA 2021"))!;
    const joomla = { ...archive, externalUrl: "https://metiersdart-geneve.ch/presse/AvenueClip.pdf" };
    const plan = planMedias([joomla], [mediaFromStatic(joomla, "a")]);
    assert.deepEqual(
      plan.uploads.map((u) => [u.table, u.column, u.oldUrl]),
      [["medias", "external_url", "https://metiersdart-geneve.ch/presse/AvenueClip.pdf"]],
    );
    // Après téléversement, la copie Blob en base vaut l'URL Joomla attendue
    const row = { ...mediaFromStatic(joomla, "a"), externalUrl: `${BLOB}/medias/a-AvenueClip.pdf` };
    const after = planMedias([joomla], [row]);
    assert.deepEqual(after.uploads, []);
    assert.equal(after.unchanged.length, 1);
  });

  test("capsule rapprochée par identifiant vidéo malgré un autre titre ; plateforme déduite", () => {
    const feutriere = staticMedias[0];
    const row = mediaRow({ id: "v", title: "Feutrière (capsule)", type: "video", videoUrl: "https://player.vimeo.com/video/1176969466", mediaType: null });
    const plan = planMedias([feutriere], [row]);
    assert.deepEqual(plan.updates[0].changes, [
      { column: "title", from: "Feutrière (capsule)", to: "Feutrière" },
      { column: "media_type", from: null, to: "vimeo" },
      { column: "video_url", from: "https://player.vimeo.com/video/1176969466", to: "https://vimeo.com/1176969466" },
      { column: "source", from: null, to: "Art du textile" },
    ]);
  });

  test("média absent de la page : dépublié, jamais supprimé", () => {
    const extra = mediaRow({ id: "x", title: "Capsule retirée", type: "video", videoUrl: "https://vimeo.com/1" });
    const plan = planMedias([], [extra, { ...extra, id: "y", published: false }]);
    assert.deepEqual(plan.unpublish, [{ id: "x", title: "Capsule retirée" }]);
  });
});
