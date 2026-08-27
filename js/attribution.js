/* attribution.js — reenvía el canal de origen del sitio a la app.
   ──────────────────────────────────────────────────────────
   El sitio vive en web.fulbito.futbol y la app en fulbito.futbol: son dominios
   distintos, así que la query NO viaja sola al hacer click. Sin esto, alguien
   que entra con ?utm_source=cancha (el QR de las láminas de los complejos)
   llega a la app sin UTM y el admin lo cuenta como "(directo)" — se pierde
   justo el dato que la lámina existe para generar.

   El UTM entrante PISA al hardcodeado de la página (las landings SEO llevan
   utm_source=seo por defecto): si la visita vino de un QR, el origen real es
   el QR, no la landing donde aterrizó.
   ────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // 's' es el source-token de las placas compartidas (atribución inter-grupo).
  var FORWARD = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 's'];
  var APP_HOST = 'fulbito.futbol';

  try {
    var incoming = new URLSearchParams(window.location.search);
    var carry = FORWARD.filter(function (k) { return incoming.get(k); });
    if (!carry.length) return;   // sin canal de origen no hay nada que reenviar

    var links = document.querySelectorAll('a[href*="' + APP_HOST + '"]');
    Array.prototype.forEach.call(links, function (a) {
      var url;
      try { url = new URL(a.href, window.location.href); } catch (e) { return; }
      // Solo la app: web.fulbito.futbol es este mismo sitio y no necesita nada.
      if (url.hostname !== APP_HOST) return;
      carry.forEach(function (k) { url.searchParams.set(k, incoming.get(k)); });
      a.href = url.toString();
    });
  } catch (e) {
    /* la atribución nunca puede romper la página */
  }
})();
