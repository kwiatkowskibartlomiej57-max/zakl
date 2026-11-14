/* Zakładka — service worker: aplikacja działa bez internetu.
   Przy każdej nowej wersji zmień WERSJA, żeby telefon pobrał świeże pliki. */
const WERSJA = 'zakladka-2.7.0';
const MEDIA = 'zakladka-media';
const RDZEN = [
  './', 'index.html', 'css/app.css',
  'js/db.js', 'js/core.js', 'js/ean.js', 'js/extras.js', 'js/ui.js',
  'manifest.webmanifest', 'icons/logo.svg', 'icons/favicon-48.png',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png'
];
const OBCE_MEDIA = ['fonts.googleapis.com', 'fonts.gstatic.com', 'covers.openlibrary.org', 'books.google.com', 'books.googleusercontent.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(WERSJA).then(c => c.addAll(RDZEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(nazwy => Promise.all(nazwy.filter(n => n !== WERSJA && n !== MEDIA).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

function zSieciNajpierw(req) {
  const siec = fetch(req).then(r => {
    if (r.ok) {
      const kopia = r.clone();
      caches.open(WERSJA).then(c => c.put(req, kopia));
    }
    return r;
  });
  const limit = new Promise((_, nie) => setTimeout(() => nie(new Error('timeout')), 4000));
  return Promise.race([siec, limit]).catch(() =>
    caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : siec))
  );
}

function zPamieciNajpierw(req) {
  return caches.match(req).then(r => r || fetch(req).then(odp => {
    if (odp.ok || odp.type === 'opaque') {
      const kopia = odp.clone();
      caches.open(MEDIA).then(c => c.put(req, kopia));
    }
    return odp;
  }));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.endsWith('/bn.php')) return; // pośrednik BN: zawsze świeże wyniki, bez pamięci podręcznej
  if (url.origin === self.location.origin) e.respondWith(zSieciNajpierw(req));
  else if (OBCE_MEDIA.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) e.respondWith(zPamieciNajpierw(req));
  // pozostałe (wyszukiwarki książek) idą zwyczajnie przez sieć
});

/* ---------- powiadomienia ---------- */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const cel = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(okna => {
    const otwarte = okna.find(o => o.url.startsWith(self.registration.scope));
    if (otwarte) return otwarte.focus().then(o => o && o.navigate ? o.navigate(cel) : o);
    return self.clients.openWindow(cel);
  }));
});

/* Android (zainstalowana aplikacja): przeglądarka co jakiś czas budzi service workera.
   Czytamy bazę na urządzeniu i przypominamy, jeśli dziś jeszcze nic nie przeczytano. */
function bazaSW() {
  return new Promise((ok, blad) => {
    const r = indexedDB.open('polka');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => blad(r.error);
  });
}
function pobierz(db, store, klucz) {
  return new Promise((ok, blad) => {
    const t = db.transaction(store, 'readonly').objectStore(store);
    const r = klucz === undefined ? t.getAll() : t.get(klucz);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => blad(r.error);
  });
}
const isoSW = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function przypomnienieWTle() {
  const db = await bazaSW();
  if (!db.objectStoreNames.contains('ustawienia')) return;
  const u = await pobierz(db, 'ustawienia', 'glowne');
  const p = u && u.przypomnienie;
  if (!p || !p.wlaczone) return;
  const teraz = new Date(), dzis = isoSW(teraz), dzienTyg = (teraz.getDay() + 6) % 7;
  const [h, m] = String(p.godzina || '20:00').split(':').map(Number);
  if (teraz.getHours() * 60 + teraz.getMinutes() < h * 60 + m || !(p.dni || []).includes(dzienTyg)) return;
  if (await pobierz(db, 'ustawienia', 'przypomnienie-ostatnie') === dzis) return;
  const ksiazki = await pobierz(db, 'ksiazki');
  const strony = ksiazki.reduce((s, k) => s + (k.log || []).filter(w => w.data === dzis).reduce((a, w) => a + w.strony, 0), 0);
  if (strony > 0 && strony >= (u.dziennyCel || 30)) return;
  await new Promise(ok => { const t = db.transaction('ustawienia', 'readwrite'); t.objectStore('ustawienia').put(dzis, 'przypomnienie-ostatnie'); t.oncomplete = ok; t.onerror = ok; });
  await self.registration.showNotification('📖 Czas na czytanie', {
    body: strony ? `Dziś ${strony} stron. Jeszcze trochę do celu!` : 'Dziś jeszcze nic nie przeczytałeś. Wystarczy kilka stron, żeby utrzymać serię.',
    icon: 'icons/icon-192.png', badge: 'icons/favicon-48.png', tag: 'zakladka-przypomnienie', data: { url: './?akcja=postep' }
  });
}

self.addEventListener('periodicsync', e => {
  if (e.tag === 'zakladka-przypomnienie') e.waitUntil(przypomnienieWTle().catch(() => {}));
});
