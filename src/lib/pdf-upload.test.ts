import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { hasPdfMagic, isPdfPathname, pdfPathname } from "./pdf-upload";

const bytes = (s: string) => new TextEncoder().encode(s);

describe("envoi de PDF (admin)", () => {
  test("octets magiques %PDF-", () => {
    assert.equal(hasPdfMagic(bytes("%PDF-1.7\n")), true);
    assert.equal(hasPdfMagic(bytes("%PDF")), false);
    assert.equal(hasPdfMagic(bytes("<html>")), false);
    assert.equal(hasPdfMagic(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d])), false);
  });

  test("chemin Blob nettoyé, sous presse/", () => {
    assert.equal(pdfPathname("Revue de Presse JEMA 2026.pdf"), "presse/revue-de-presse-jema-2026.pdf");
    assert.equal(pdfPathname("Écho genevois.PDF"), "presse/echo-genevois.pdf");
    assert.equal(pdfPathname("../../etc/passwd"), "presse/etc-passwd.pdf");
    assert.equal(pdfPathname("***.pdf"), "presse/document.pdf");
    for (const name of ["Revue de Presse JEMA 2026.pdf", "../../x.pdf", "***.pdf", `${"a".repeat(200)}.pdf`]) {
      assert.ok(isPdfPathname(pdfPathname(name)), name);
    }
  });

  test("route du jeton : seuls les chemins presse/*.pdf", () => {
    for (const bad of [null, "", "presse/", "presse/x.exe", "artisans/x.pdf", "presse/../x.pdf", "presse/a/b.pdf", "/presse/x.pdf", "presse/X.pdf"]) {
      assert.equal(isPdfPathname(bad), false, String(bad));
    }
  });
});
