function removeEndSlash(url) {
  if (url.endsWith('/')) {
    return url.substr(0, url.length - 1);
  }
  return url;
}

const cacheName = 'perfectly-balanced';
const origin = 'https://perfectly-balanced.luisafk.repl.co';
const assets = [
  '/',
  '/_replit.html',
  '/clearCache.html',
  '/style.css',
  '/script.js',
  '/tests.js',
  '/tips.js',
  '/levels.js',
  '/random.js',
  '/winwheel-2.8.0/Winwheel.min.js',
  '/socket.io/socket.io.js',
  '/manifest.json',
  '/pop.wav',
  '/favicon.ico',
  '/favicon.png',
  '/favicon96.png',
  '/favicon96_hard.png',
  '/favicon96_multiplayer.png',
  '/favicon192.png',
  '/favicon512.png',
  '/screenshots/screenshot1.jpg',
  '/screenshots/screenshot2.jpg',
  'https://cdn.jsdelivr.net/npm/js-cookie@3.0.1/dist/js.cookie.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.18.0/matter.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/UAParser.js/1.0.2/ua-parser.min.js',
  'https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined',
  'https://fonts.googleapis.com/css2?family=Montserrat&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/2.0.2/TweenMax.min.js',
  'https://accounts.google.com/gsi/client',
].map((asset) => {
  asset = asset.startsWith('/') ? origin + asset : asset;
  asset = removeEndSlash(asset);
  return asset;
});

const indexUrl = removeEndSlash(assets[0]);

self.addEventListener('install', (e) => {
  console.debug('[%c\xE6%c] onInstall', 'font-family: webdings;', '');

  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', (e) => {
  const url = removeEndSlash(e.request.url);

  console.debug('[%c\xC2%c] onFetch', 'font-family: webdings;', '');

  // ignore non-GETs
  if (e.request.method != 'GET') return;

  // ignore Google analytics/logging
  if (e.request.url.startsWith('https://play.google.com/log')) {
    console.log(
      '[%cx%c] Canceled Google Play log',
      'font-family: webdings;',
      ''
    );
    e.respondWith(
      new Response('Canceled by Service Worker [sw]', {
        url,
        status: 400,
        statusText: 'Canceled by [sw]',
      })
    );
    return;
  }

  // ignore WebSockets
  if (url.startsWith(origin + '/socket.io') && !url.endsWith('.js')) return;

  // cache only assets
  if (!assets.includes(url)) return;

  e.respondWith(
    (async () => {
      const r = await caches.match(e.request);

      console.log(
        `[%c\xC2%c] Fetching resource: ${url}`,
        'font-family: webdings;',
        ''
      );

      if (r) return r;

      const response = await fetch(e.request);
      let text = null;

      if (url == indexUrl) {
        text = await response.clone().text();
        if (text.substr(16, 38) != '<!-- Perfectly Balanced index.html -->') {
          console.log(
            `[%c\xB3%c] Prevented caching index because does not have identifier`,
            'font-family: webdings;',
            ''
          );
          return response;
        }
      }

      const cache = await caches.open(cacheName);

      console.log(
        `[%c\xB3%c] Caching new resource: ${url}`,
        'font-family: webdings;',
        ''
      );

      cache.put(e.request, response.clone());

      return response;
    })()
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type) {
    if (/CLEAR(?:_(?:HTML|STYLE|SCRIPT))?_CACHE/.test(e.data.type)) {
      if (!navigator.onLine) {
        console.log(
          '[%cx%c] prevented clearing cache when offline',
          'font-family: webdings;',
          ''
        );
        return;
      }
    }

    switch (e.data.type) {
      case 'CLEAR_HTML_CACHE':
        console.log(
          '[%c\xB3%c] deleting HTML cache',
          'font-family: webdings;',
          ''
        );
        caches.open(cacheName).then((cache) => {
          cache.delete('/').then((deleted) => {
            if (deleted)
              console.log(
                '[%c\xB3%c] HTML cache deleted',
                'font-family: webdings;',
                ''
              );
            else
              console.log(
                '[%cr%c] could not delete HTML cache',
                'font-family: webdings;',
                ''
              );
          });
        });
        break;
      case 'CLEAR_SCRIPT_CACHE':
        console.log(
          '[%c\xB3%c] deleting script cache',
          'font-family: webdings;',
          ''
        );
        caches.open(cacheName).then((cache) => {
          cache.delete('/script.js').then((deleted) => {
            if (deleted)
              console.log(
                '[%c\xB3%c] script cache deleted',
                'font-family: webdings;',
                ''
              );
            else
              console.log(
                '[%cr%c] could not delete script cache',
                'font-family: webdings;',
                ''
              );
          });
        });
        break;
      case 'CLEAR_STYLE_CACHE':
        console.log(
          '[%c\xB3%c] deleting style cache',
          'font-family: webdings;',
          ''
        );
        caches.open(cacheName).then((cache) => {
          cache.delete('/style.css').then((deleted) => {
            if (deleted)
              console.log(
                '[%c\xB3%c] style cache deleted',
                'font-family: webdings;',
                ''
              );
            else
              console.log(
                '[%cr%c] could not delete style cache',
                'font-family: webdings;',
                ''
              );
          });
        });
        break;
      case 'CLEAR_LEVELS_CACHE':
        console.log(
          '[%c\xB3%c] deleting levels cache',
          'font-family: webdings;',
          ''
        );
        caches.open(cacheName).then((cache) => {
          cache.delete('/levels.js').then((deleted) => {
            if (deleted)
              console.log(
                '[%c\xB3%c] levels cache deleted',
                'font-family: webdings;',
                ''
              );
            else
              console.log(
                '[%cr%c] could not delete levels cache',
                'font-family: webdings;',
                ''
              );
          });
        });
        break;
      case 'CLEAR_CACHE':
        console.log(
          '[%c\xB3%c] deleting all cache',
          'font-family: webdings;',
          ''
        );
        caches.delete(cacheName).then((deleted) => {
          if (deleted)
            console.log(
              '[%c\xB3%c] all cache deleted',
              'font-family: webdings;',
              ''
            );
          else
            console.log(
              '[%cr%c] could not delete all cache',
              'font-family: webdings;',
              ''
            );
        });
        break;
      default:
        console.log(
          '[%cr%c] invalid message type',
          'font-family: webdings;',
          '',
          e.data.type
        );
    }
  }
});
