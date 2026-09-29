import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import {
  actuLinkLabel,
  formatActuDate,
  formatArchiveDate,
  groupMedias,
  isActuPast,
  parseVideoUrl,
  visibleActualites,
  type PublicMedia,
} from "./actu-medias";
import { staticActualites, staticMedias } from "./actu-medias-static";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const NOW = new Date(2026, 8, 29, 10); // 29 septembre 2026

describe("formatActuDate", () => {
  test("un jour de l'année en cours : sans année", () => {
    assert.equal(formatActuDate(d(2026, 10, 14), null, NOW), "14 octobre");
    assert.equal(formatActuDate(d(2026, 10, 30), d(2026, 10, 30), NOW), "30 octobre");
  });

  test("« 1er »", () => {
    assert.equal(formatActuDate(d(2026, 11, 1), null, NOW), "1er novembre");
  });

  test("une autre année : avec l'année", () => {
    assert.equal(formatActuDate(d(2027, 1, 14), null, NOW), "14 janvier 2027");
  });

  test("plage dans le même mois", () => {
    assert.equal(formatActuDate(d(2027, 3, 19), d(2027, 3, 21), NOW), "du 19 au 21 mars 2027");
    assert.equal(formatActuDate(d(2026, 10, 19), d(2026, 10, 21), NOW), "du 19 au 21 octobre");
  });

  test("plage à cheval sur deux mois", () => {
    assert.equal(formatActuDate(d(2026, 10, 30), d(2026, 11, 2), NOW), "du 30 octobre au 2 novembre");
    assert.equal(formatActuDate(d(2027, 3, 30), d(2027, 4, 1), NOW), "du 30 mars au 1er avril 2027");
  });

  test("plage à cheval sur deux années", () => {
    assert.equal(
      formatActuDate(d(2026, 12, 30), d(2027, 1, 2), NOW),
      "du 30 décembre 2026 au 2 janvier 2027",
    );
  });

  test("sans date", () => {
    assert.equal(formatActuDate(null, d(2026, 10, 1), NOW), "");
  });
});

describe("actuLinkLabel", () => {
  test("libellé saisi prioritaire", () => {
    assert.equal(actuLinkLabel({ linkUrl: "mailto:a@b.ch", linkLabel: " S'inscrire " }), "S'inscrire");
  });
  test("par défaut : Contact pour un mailto, Plus d'info sinon", () => {
    assert.equal(actuLinkLabel({ linkUrl: "mailto:contact@metiersdart-geneve.ch", linkLabel: null }), "Contact");
    assert.equal(actuLinkLabel({ linkUrl: "MAILTO:x@y.ch", linkLabel: "" }), "Contact");
    assert.equal(actuLinkLabel({ linkUrl: "/jema", linkLabel: null }), "Plus d'info");
    assert.equal(actuLinkLabel({ linkUrl: null, linkLabel: null }), "Plus d'info");
  });
});

describe("visibleActualites / isActuPast", () => {
  const actu = (title: string, start: Date | null, end: Date | null = null) => ({
    title,
    eventDate: start,
    eventEndDate: end,
  });

  test("sans date d'abord (ordre reçu), puis par date croissante", () => {
    const list = [
      actu("JEMA 2027", d(2027, 3, 19), d(2027, 3, 21)),
      actu("Prix", d(2026, 10, 30)),
      actu("Sondage locaux", null),
      actu("Conseil", d(2026, 10, 14)),
      actu("Sondage écoles", null),
    ];
    assert.deepEqual(
      visibleActualites(list, NOW).map((a) => a.title),
      ["Sondage locaux", "Sondage écoles", "Conseil", "Prix", "JEMA 2027"],
    );
  });

  test("événement passé masqué ; le jour même, encore affiché", () => {
    const fer = actu("FER", d(2026, 9, 25));
    const today = actu("Aujourd'hui", d(2026, 9, 29));
    const range = actu("Plage en cours", d(2026, 9, 20), d(2026, 9, 29));
    assert.equal(isActuPast(fer, NOW), true);
    assert.equal(isActuPast(today, NOW), false);
    assert.equal(isActuPast(range, NOW), false);
    assert.equal(isActuPast(actu("Sans date", null), NOW), false);
    assert.deepEqual(visibleActualites([fer, today, range], NOW).map((a) => a.title), ["Plage en cours", "Aujourd'hui"]);
  });

  test("données statiques : les 5 cartes du 29.09, dans l'ordre de la page", () => {
    assert.deepEqual(
      visibleActualites(staticActualites, NOW).map((a) => a.title),
      [
        "SONDAGE LOCAUX",
        "SONDAGE ÉCOLES & ARTISANS",
        "CONSEIL DES ARTISANS",
        "PRIX DE L'ARTISANAT — APPEL À CANDIDATURE",
        "JOURNÉES EUROPÉENNES DES MÉTIERS D'ART 2027",
      ],
    );
    const labels = visibleActualites(staticActualites, NOW).map((a) =>
      formatActuDate(a.eventDate, a.eventEndDate, NOW),
    );
    assert.deepEqual(labels, ["", "", "14 octobre", "30 octobre", "du 19 au 21 mars 2027"]);
  });
});

describe("parseVideoUrl", () => {
  test("Vimeo", () => {
    for (const url of [
      "https://vimeo.com/1176969466",
      "https://www.vimeo.com/1176969466/abc123",
      "https://player.vimeo.com/video/1176969466?h=x",
      "https://vimeo.com/channels/staffpicks/1176969466",
      " https://vimeo.com/1176969466 ",
    ]) {
      assert.deepEqual(parseVideoUrl(url), { platform: "vimeo", videoId: "1176969466" }, url);
    }
  });

  test("YouTube", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=una6Mnq0BBk",
      "https://youtube.com/watch?feature=share&v=una6Mnq0BBk",
      "https://youtu.be/una6Mnq0BBk?t=10",
      "https://www.youtube.com/embed/una6Mnq0BBk",
      "https://www.youtube.com/shorts/una6Mnq0BBk",
      "https://m.youtube.com/watch?v=una6Mnq0BBk",
    ]) {
      assert.deepEqual(parseVideoUrl(url), { platform: "youtube", videoId: "una6Mnq0BBk" }, url);
    }
  });

  test("refusés", () => {
    for (const bad of [
      "1176969466",
      "una6Mnq0BBk",
      "https://vimeo.com/",
      "https://vimeo.com/channels/staffpicks",
      "https://www.youtube.com/watch?v=trop-court",
      "https://www.youtube.com/@mag",
      "https://example.com/watch?v=una6Mnq0BBk",
      "javascript:alert(1)",
      "ftp://vimeo.com/123456",
      null,
      42,
    ]) {
      assert.equal(parseVideoUrl(bad), null, String(bad));
    }
  });
});

describe("groupMedias", () => {
  const media = (over: Partial<PublicMedia> & Pick<PublicMedia, "title" | "type">): PublicMedia => ({
    id: over.title,
    videoUrl: null,
    externalUrl: null,
    pdfUrl: null,
    date: null,
    source: null,
    sortOrder: 0,
    ...over,
  });

  test("sections, tris et vidéos non reconnues ignorées", () => {
    const list = [
      media({ title: "B", type: "video", videoUrl: "https://vimeo.com/2", sortOrder: 2 }),
      media({ title: "A", type: "video", videoUrl: "https://vimeo.com/1", sortOrder: 1 }),
      media({ title: "Cassée", type: "video", videoUrl: "https://vimeo.com/" }),
      media({ title: "Itw", type: "interview", videoUrl: "https://youtu.be/una6Mnq0BBk" }),
      media({ title: "Lien 2", type: "article", externalUrl: "https://a.ch", sortOrder: 1 }),
      media({ title: "Lien 1", type: "article", externalUrl: "https://b.ch", sortOrder: 0 }),
      media({ title: "JEMA 2025", type: "presse", pdfUrl: "https://x/2025.pdf", date: d(2025, 1, 1) }),
      media({ title: "JEMA 2026", type: "presse", pdfUrl: "https://x/2026.pdf", date: d(2026, 1, 1) }),
      media({ title: "Sans date", type: "archive", externalUrl: "https://x/0.pdf" }),
      media({ title: "2021", type: "archive", externalUrl: "https://x/1.pdf", date: d(2021, 3, 25) }),
      media({ title: "2022", type: "archive", externalUrl: "https://x/2.pdf", date: d(2022, 1, 1) }),
      media({ title: "Sans PDF", type: "presse", date: d(2024, 1, 1) }),
      media({ title: "Sans lien", type: "article" }),
    ];
    const g = groupMedias(list);
    assert.deepEqual(g.capsules.map((c) => [c.title, c.platform, c.videoId]), [["A", "vimeo", "1"], ["B", "vimeo", "2"]]);
    assert.deepEqual(g.interviews.map((c) => [c.platform, c.videoId]), [["youtube", "una6Mnq0BBk"]]);
    assert.deepEqual(g.links.map((m) => m.title), ["Lien 1", "Lien 2"]);
    assert.deepEqual(g.presse.map((m) => m.title), ["JEMA 2026", "JEMA 2025"]);
    assert.deepEqual(g.archives.map((m) => m.title), ["2022", "2021", "Sans date"]);
  });

  test("données statiques : 37 capsules, 1 interview, 2 liens, 5 revues, 3 archives, ordre de la page", () => {
    const g = groupMedias(staticMedias.map((m, i) => ({ ...m, id: String(i) })));
    assert.equal(g.capsules.length, 37);
    assert.equal(g.capsules[0].title, "Feutrière");
    assert.equal(g.capsules[36].title, "Conservatrice et restauratrice de tableaux");
    assert.ok(g.capsules.every((c) => c.platform === "vimeo"));
    assert.equal(g.interviews.length, 1);
    assert.equal(g.interviews[0].videoId, "una6Mnq0BBk");
    assert.deepEqual(g.links.map((m) => m.source), ["carac.tv", "Léman Bleu"]);
    assert.deepEqual(g.presse.map((m) => m.title), ["JEMA 2026", "JEMA 2025", "JEMA 2024", "JEMA 2023", "JEMA 2022"]);
    assert.deepEqual(g.archives.map((m) => formatArchiveDate(m.date)), ["14.10.2021", "25.03.2021", "01.02.2021"]);
  });
});

describe("formatArchiveDate", () => {
  test("JJ.MM.AAAA", () => {
    assert.equal(formatArchiveDate(d(2021, 2, 1)), "01.02.2021");
    assert.equal(formatArchiveDate(null), "");
  });
});
