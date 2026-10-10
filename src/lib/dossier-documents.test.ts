import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import {
  DOCUMENT_MAX_BYTES,
  contentDisposition,
  documentPathname,
  isAllowedContentType,
  isDocumentKind,
  parseDocumentPathname,
} from "./dossier-documents";

const ID = "3f2a9c1e-5b7d-4e8f-9a0b-1c2d3e4f5a6b";

describe("pièces justificatives", () => {
  test("types admis", () => {
    assert.equal(isAllowedContentType("application/pdf"), true);
    assert.equal(isAllowedContentType("image/png"), true);
    assert.equal(isAllowedContentType("text/html"), false);
    assert.equal(isAllowedContentType("application/x-msdownload"), false);
    assert.equal(isAllowedContentType("toString"), false);
    assert.equal(DOCUMENT_MAX_BYTES, 10 * 1024 * 1024);
    assert.equal(isDocumentKind("attestation_avs"), true);
    assert.equal(isDocumentKind("x"), false);
  });

  test("chemin demandé : sous dossiers/<id>/, extension du type MIME", () => {
    assert.equal(documentPathname(ID, "Attestation AVS 2026.pdf", "application/pdf"), `dossiers/${ID}/attestation-avs-2026.pdf`);
    assert.equal(documentPathname(ID.toUpperCase(), "photo.HEIC", "image/jpeg"), `dossiers/${ID}/photo.jpg`);
    assert.equal(documentPathname(ID, "../../x.pdf", "application/pdf"), `dossiers/${ID}/x.pdf`);
    assert.equal(documentPathname(ID, "***", "application/pdf"), `dossiers/${ID}/piece.pdf`);
    assert.equal(documentPathname(ID, "virus.exe", "application/x-msdownload"), null);
    assert.equal(documentPathname("pas-un-uuid", "x.pdf", "application/pdf"), null);
    const p = documentPathname(ID, `${"a".repeat(300)}.pdf`, "application/pdf");
    assert.ok(p && parseDocumentPathname(p));
  });

  test("chemin accepté : demandé, ou renvoyé par Blob avec suffixe", () => {
    assert.deepEqual(parseDocumentPathname(`dossiers/${ID}/attestation.pdf`), { dossierId: ID, ext: "pdf" });
    assert.deepEqual(parseDocumentPathname(`dossiers/${ID}/attestation-Xy9kQ2mLp0aB3cD4eF5gH6.pdf`), { dossierId: ID, ext: "pdf" });
    for (const bad of [
      null, "", `dossiers/${ID}/`, `dossiers/${ID}/x.exe`, `dossiers/${ID}/x.PDF`, `dossiers/${ID}/a/b.pdf`,
      `dossiers/${ID}/../x.pdf`, `/dossiers/${ID}/x.pdf`, `presse/x.pdf`, `dossiers/not-uuid/x.pdf`, `dossiers/${ID}/.pdf`,
      `dossiers/${ID}/-x.pdf`,
    ]) {
      assert.equal(parseDocumentPathname(bad), null, String(bad));
    }
  });

  test("content-disposition : ASCII sûr + UTF-8", () => {
    const cd = contentDisposition('Attestation "AVS" ; été.pdf', "pdf", false);
    assert.match(cd, /^attachment; filename="Attestation AVS  ete\.pdf"; filename\*=UTF-8''/);
    assert.ok(!cd.includes('"AVS"'));
    assert.match(contentDisposition("x", "jpg", true), /^inline; filename="x\.jpg"/);
    assert.match(contentDisposition("", "pdf", true), /filename="piece\.pdf"/);
  });
});
