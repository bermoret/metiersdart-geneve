// Google Tag Manager servi en first-party via Stape (« custom loader »), repris
// à l'identique de l'ancien site Joomla. Le conteneur embarque tout le reste :
// bannière CookieScript (Consent Mode, nLPD/RGPD) et GA4 G-S9P7VJHKRL, envoyé
// au conteneur serveur Stape. Rien d'autre à intégrer côté site.
// Conteneur GTM-M6497K4X. Pas de <noscript> ns.html : sans JavaScript,
// CookieScript ne peut pas recueillir le consentement.
const STAPE_HOST = "https://nlpd.metiersdart-geneve.ch";
// Chemin + paramètre du loader Stape (11= base64 de "id=GTM-M6497K4X")
const STAPE_LOADER_URL = `${STAPE_HOST}/8u2ikedxgjvoz.js?11=aWQ9R1RNLU02NDk3SzRY&page=1`;

// Suivi uniquement sur le domaine final : tant que le site tourne sur
// *.vercel.app (préproduction, previews), les visites ne doivent ni polluer
// GA4 ni faire tourner CookieScript hors de son domaine. Exception :
// ?gtm_debug (ajouté par Tag Assistant) pour tester le conteneur avant la
// bascule DNS. L'admin et l'authentification ne sont jamais suivis.
const TRACKED_HOSTS = ["metiersdart-geneve.ch", "www.metiersdart-geneve.ch"];

/** Snippet GTM (loader Stape) — injecté par le layout racine en beforeInteractive. */
export const GTM_LOADER_SCRIPT = `(function(w,d,s,l){
  var loc=w.location;
  var allowed=${JSON.stringify(TRACKED_HOSTS)}.indexOf(loc.hostname)!==-1||/[?&]gtm_debug=/.test(loc.search);
  if(!allowed||/^\\/(admin|auth)(\\/|$)/.test(loc.pathname))return;
  w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
  var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;
  j.src=${JSON.stringify(STAPE_LOADER_URL)};f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer');`;
