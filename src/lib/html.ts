// Échappement HTML des textes injectés dans du HTML brut (popups et
// infobulles Leaflet, e-mails). Précédent : XSS stockée via un champ admin.

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Échappe `& < > " '` : sûr en contenu de balise et en valeur d'attribut (guillemets simples ou doubles). */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}
