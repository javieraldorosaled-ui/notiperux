// NotiPerúx Service Worker v10 - Soporte de Actualización en Tiempo Real PWA
const CACHE_NAME = 'notiperux-pwa-v11';
const STATIC_ASSETS = [
  '/logo.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
  '/favicon.ico',
  '/manifest.json',
];

const EMBEDDED_MANIFEST = {
  id: '/',
  name: 'NotiPerúx - Noticias del Perú y el Mundo',
  short_name: 'NotiPerúx',
  description:
    'El Diario de Mayor Circulación Informativa del Perú. Noticias verificadas del Perú y el Mundo en tiempo real.',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#000000',
  theme_color: '#000000',
  orientation: 'portrait-primary',
  lang: 'es-PE',
  dir: 'ltr',
  prefer_related_applications: false,
  categories: ['news', 'magazines', 'utilities'],
  icons: [
    {
      src: '/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
    },
    {
      src: '/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
  shortcuts: [
    {
      name: 'Noticias del Perú',
      short_name: 'Perú',
      description: 'Principales noticias nacionales verificadas',
      url: '/?tab=peru',
      icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
    },
    {
      name: 'Noticias del Mundo',
      short_name: 'Mundo',
      description: 'Noticias internacionales y corresponsalía global',
      url: '/?tab=internacional',
      icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
    },
    {
      name: 'Kiosko de Diarios',
      short_name: 'Kiosko',
      description: 'Portadas de los principales diarios impresos',
      url: '/?tab=kiosko',
      icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
    },
  ],
};

async function createFallbackPngResponse(size) {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#165338';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#F2F8ED';
      ctx.font = `bold ${Math.round(size * 0.44)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', size / 2, size / 2);
      const blob = await canvas.convertToBlob({ type: 'image/png' });
      return new Response(blob, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  }
  return Response.error();
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.put(
        '/manifest.json',
        new Response(JSON.stringify(EMBEDDED_MANIFEST), {
          status: 200,
          headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
        })
      );
      for (const assetUrl of STATIC_ASSETS) {
        if (assetUrl === '/manifest.json') continue;
        try {
          const response = await fetch(assetUrl, {
            credentials: 'include',
            cache: 'no-cache',
          });
          if (response && response.status === 200 && !response.redirected) {
            const contentType = (response.headers.get('content-type') || '').toLowerCase();
            if (assetUrl !== '/' && contentType.includes('text/html')) {
              continue;
            }
            await cache.put(assetUrl, response.clone());
          }
        } catch (err) {
          // Ignorar fallo individual de precarga
        }
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data === 'skipWaiting')) {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname === '/sw.js') {
    return;
  }

  // Garantizar siempre un manifest.json válido 200 OK sin redirecciones de cookies
  if (url.pathname === '/manifest.json' || url.pathname === '/manifest.webmanifest') {
    event.respondWith(
      new Response(JSON.stringify(EMBEDDED_MANIFEST), {
        status: 200,
        headers: {
          'Content-Type': 'application/manifest+json; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    );
    return;
  }

  // Garantizar iconos PNG válidos para el instalador WebAPK de Chrome en Android
  if (
    url.pathname === '/icon-192x192.png' ||
    url.pathname === '/icon-512x512.png' ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/favicon.png' ||
    url.pathname === '/logo.png'
  ) {
    const iconSize = url.pathname.includes('512') || url.pathname.includes('logo') ? 512 : 192;
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(url.pathname);
        if (cached) {
          const ct = (cached.headers.get('content-type') || '').toLowerCase();
          if (ct.startsWith('image/')) {
            return cached;
          }
        }
        try {
          const netRes = await fetch(url.origin + url.pathname, {
            credentials: 'include',
            cache: 'no-cache',
          });
          const ct = (netRes.headers.get('content-type') || '').toLowerCase();
          if (netRes && netRes.status === 200 && !netRes.redirected && ct.startsWith('image/')) {
            await cache.put(url.pathname, netRes.clone());
            return netRes;
          }
        } catch (err) {}
        return createFallbackPngResponse(iconSize);
      })()
    );
    return;
  }

  // REGLA CRÍTICA 1: Endpoints dinámicos de noticias y APIs (/api/*)
  // NUNCA congelar en caché estática. Siempre conectar a la red en vivo.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(async () => {
        return new Response(JSON.stringify({ offline: true, items: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // REGLA CRÍTICA 2: Archivos JSON de datos (/data/*.json)
  // Estrategia Network-First: Siempre intenta red primero para traer las noticias más frescas;
  // solo si la red falla (sin internet), recurre a la última versión guardada en caché.
  if (url.pathname.startsWith('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ items: [], sources: [], updatedAt: null }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }

  // REGLA CRÍTICA 3: Navegación de página (HTML)
  // Network-First: Siempre intenta obtener el HTML fresco desde la red.
  // Solo usa la caché si falla la red.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && !networkResponse.redirected) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', clone)).catch(() => {});
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match('/');
          return cached || Response.error();
        })
    );
    return;
  }

  // REGLA 4: Recursos estáticos generales (JS, CSS, fuentes, imágenes locales)
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          !networkResponse.redirected
        ) {
          const contentType = (networkResponse.headers.get('content-type') || '').toLowerCase();
          if (!contentType.includes('text/html')) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return Response.error();
      })
  );
});
