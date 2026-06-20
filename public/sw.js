/*
 * Kill-switch de service worker (limpieza de una sola vez).
 *
 * Contexto: la v1 del portafolio (Jekyll) registró /sw.js con una estrategia
 * cache-first que interceptaba TODO el sitio. Los visitantes que cargaron la
 * v1 siguen viendo esa versión stale aunque haya nuevos deploys, porque su SW
 * viejo responde desde caché sin ir a la red. Un deploy nuevo no lo arregla:
 * el SW viejo ni pide el index.html nuevo, así que nunca descubre este kill-switch
 * —salvo por hard-reload / devtools unregister. Por eso el script de registro en
 * Layout.astro solo registra este SW si YA hay un SW controlando la página.
 *
 * Flujo: este SW se instala (skipWaiting → pasa a activar de inmediato), en
 * 'activate' toma el control (clients.claim), borra TODOS los caches, se
 * DESREGISTRA a sí mismo y recarga cada cliente para que cargue la versión nueva.
 * Al desregistrarse, el guard `navigator.serviceWorker.controller` del script de
 * registro deja de cumplirse (ya no hay controller) → no se vuelve a registrar →
 * sin bucle de recarga. Los visitantes nuevos (sin SW viejo) nunca registran nada.
 *
 * Sin handler de fetch: durante el instante que está activo no intercepta nada
 * (todo va a red), así que no puede meter el sitio en un estado roto.
 */

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Tomar el control de las páginas abiertas de inmediato.
      await self.clients.claim();

      // Vaciar todos los caches (los de la v1 + cualquier otro).
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));

      // Desregistrarse: el SW deja de controlar y no vuelve a registrarse.
      await self.registration.unregister();

      // Recargar cada cliente para que pida la versión nueva (sin caché).
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      await Promise.all(
        clients.map((c) => {
          // c.navigate recarga con el SW ya desregistrado → fetch limpio a red.
          if (c && typeof c.navigate === 'function') {
            return c.navigate(c.url).catch(() => {});
          }
          return null;
        }),
      );
    })(),
  );
});