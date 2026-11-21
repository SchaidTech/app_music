const CACHE_NAME = 'app-musica-v48';
const APP_SHELL = [
  './index.html',
  './modulo-intervalos.html',
  './modulo-acordes-escalas.html',
  './modulo-tab.html',
  './modulo-cursos.html',
  './style.css',
  './tema.css',
  './cursos.css',
  './tab.css',
  './nav.js',
  './braco.js',
  './cordas.js',
  './diag.js',
  './violao.js',
  './acorde.js',
  './intervalos.js',
  './app.js',
  './fretboard.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// respostas que passaram por redirecionamento não podem ser usadas em navegações: guarda uma cópia "limpa"
async function limpa(res){
  if (!res || !res.redirected) return res;
  const corpo = await res.blob();
  return new Response(corpo, { status: res.status, statusText: res.statusText, headers: res.headers });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => Promise.all(APP_SHELL.map(async (u) => { const r = await fetch(u, { cache: 'reload' }); if (r.ok) await cache.put(u, await limpa(r)); })))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

const CDNS = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin && !CDNS.includes(url.hostname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    let cached = await cache.match(req);
    // resposta "opaca" (script/estilo sem CORS) não pode atender pedidos CORS (ex.: AudioWorklet do alphaTab): descarta
    if (cached && cached.type === 'opaque' && req.mode !== 'no-cors') cached = undefined;
    const net = fetch(req).then(async (res) => { if (res && (res.status === 200 || (res.type === 'opaque' && req.mode === 'no-cors'))) await cache.put(req, await limpa(res.clone())); return res; }).catch(() => null);
    if (cached){ event.waitUntil(net); return cached; }   // responde do cache e atualiza em segundo plano
    return (await net) || (req.mode === 'navigate' ? (await cache.match('./index.html')) : Response.error());
  })());
});
