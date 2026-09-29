import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { parseActuInput, parseMediaInput } from "./actu-medias-input";

const err = (r: { error: string } | { values: unknown }) => ("error" in r ? r.error : null);

describe("parseActuInput", () => {
  test("création : titre obligatoire, champs nettoyés, vides → null", () => {
    const r = parseActuInput(
      {
        title: "  CONSEIL DES ARTISANS ",
        category: "",
        source: "Métiers d'Art Genève",
        eventDate: "2026-10-14",
        eventEndDate: "",
        timeLabel: "19h-20h30",
        linkUrl: "mailto:contact@metiersdart-geneve.ch",
        linkLabel: null,
        published: true,
      },
      "create",
    );
    assert.ok("values" in r, err(r) ?? "");
    assert.equal(r.values.title, "CONSEIL DES ARTISANS");
    assert.equal(r.values.category, null);
    assert.equal(r.values.eventDate?.toISOString(), "2026-10-14T00:00:00.000Z");
    assert.equal(r.values.eventEndDate, null);
    assert.equal(r.values.linkUrl, "mailto:contact@metiersdart-geneve.ch");
    assert.equal(r.values.linkLabel, null);
    assert.equal("imageUrl" in r.values, false);
    assert.equal(err(parseActuInput({ title: "  " }, "create")), "Le titre est obligatoire");
    assert.equal(err(parseActuInput({ excerpt: "x" }, "create")), "Le titre est obligatoire");
  });

  test("modification : seuls les champs envoyés ; rien → erreur", () => {
    const r = parseActuInput({ published: false }, "patch");
    assert.deepEqual(r, { values: { published: false } });
    assert.equal(err(parseActuInput({}, "patch")), "Aucun champ à modifier");
    assert.equal(err(parseActuInput({ title: "" }, "patch")), "Le titre est obligatoire");
  });

  test("liens : http(s), mailto et chemin du site acceptés ; le reste refusé", () => {
    for (const ok of ["https://example.ch/x", "mailto:a@b.ch", "/jema"]) {
      assert.ok("values" in parseActuInput({ linkUrl: ok }, "patch"), ok);
    }
    for (const bad of ["javascript:alert(1)", "//evil.ch", "www.example.ch", "data:text/html,x"]) {
      assert.match(err(parseActuInput({ linkUrl: bad }, "patch")) ?? "", /^Le lien doit/, bad);
    }
    assert.match(err(parseActuInput({ imageUrl: "/images/x.png" }, "patch")) ?? "", /image/);
  });

  test("dates incohérentes ou invalides refusées", () => {
    assert.match(err(parseActuInput({ eventDate: "2026-10-30", eventEndDate: "2026-10-14" }, "patch")) ?? "", /précède/);
    assert.match(err(parseActuInput({ title: "x", eventDate: "pas une date" }, "create")) ?? "", /invalide/);
    assert.match(err(parseActuInput({ title: "x", eventDate: null, eventEndDate: "2026-10-14" }, "create")) ?? "", /sans date de début/);
  });

  test("longueurs des colonnes varchar et types respectés", () => {
    assert.match(err(parseActuInput({ category: "x".repeat(101) }, "patch")) ?? "", /100 caractères/);
    assert.match(err(parseActuInput({ published: "oui" }, "patch")) ?? "", /oui \/ non/);
    assert.match(err(parseActuInput({ title: 42 }, "patch")) ?? "", /texte attendu/);
    assert.equal(err(parseActuInput(null, "patch")), "Requête invalide");
    assert.equal(err(parseActuInput([], "patch")), "Requête invalide");
  });
});

describe("parseMediaInput", () => {
  test("capsule : plateforme déduite de l'adresse", () => {
    const r = parseMediaInput(
      { title: "Feutrière", type: "video", videoUrl: "https://vimeo.com/1176969466", source: "Art du textile", sortOrder: "3" },
      "create",
    );
    assert.ok("values" in r, err(r) ?? "");
    assert.equal(r.values.mediaType, "vimeo");
    assert.equal(r.values.sortOrder, 3);
    assert.equal(r.values.type, "video");
    const yt = parseMediaInput({ title: "Itw", type: "interview", videoUrl: "https://youtu.be/una6Mnq0BBk" }, "create");
    assert.ok("values" in yt);
    assert.equal(yt.values.mediaType, "youtube");
  });

  test("adresse obligatoire selon le type", () => {
    assert.match(err(parseMediaInput({ title: "x", type: "video" }, "create")) ?? "", /vidéo est obligatoire/);
    assert.match(err(parseMediaInput({ title: "x", type: "presse", pdfUrl: "" }, "create")) ?? "", /PDF est obligatoire/);
    assert.match(err(parseMediaInput({ title: "x", type: "archive" }, "create")) ?? "", /article est obligatoire/);
    // Modification : le type envoyé avec une adresse vide est refusé, sans adresse envoyée non
    assert.match(err(parseMediaInput({ type: "article", externalUrl: "" }, "patch")) ?? "", /obligatoire/);
    assert.ok("values" in parseMediaInput({ type: "article" }, "patch"));
    assert.ok("values" in parseMediaInput({ title: "Nouveau titre" }, "patch"));
  });

  test("adresses : http(s) seulement, vidéo reconnue", () => {
    assert.match(err(parseMediaInput({ videoUrl: "https://example.ch/video" }, "patch")) ?? "", /Vimeo/);
    assert.match(err(parseMediaInput({ externalUrl: "javascript:alert(1)" }, "patch")) ?? "", /http/);
    assert.match(err(parseMediaInput({ pdfUrl: "/presse/x.pdf" }, "patch")) ?? "", /http/);
    const cleared = parseMediaInput({ videoUrl: "" }, "patch");
    assert.deepEqual(cleared, { values: { mediaType: null, videoUrl: null } });
  });

  test("type inconnu, ordre non entier, corps vide", () => {
    assert.equal(err(parseMediaInput({ title: "x", type: "podcast" }, "create")), "Type de média inconnu");
    assert.equal(err(parseMediaInput({ title: "x" }, "create")), "Type de média inconnu");
    assert.match(err(parseMediaInput({ sortOrder: "1.5" }, "patch")) ?? "", /entier/);
    assert.equal(err(parseMediaInput({}, "patch")), "Aucun champ à modifier");
  });
});
