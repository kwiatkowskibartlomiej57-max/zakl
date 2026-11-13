// Zakładka: pośrednik do katalogu Biblioteki Narodowej dla Cloudflare Workers (darmowy plan wystarczy).
// 1. dash.cloudflare.com → Workers & Pages → Create → Worker → „Hello World”.
// 2. Edit code: wklej cały ten plik w miejsce przykładu i kliknij Deploy.
// 3. Skopiuj adres workera (np. https://zakladka-bn.twoj-login.workers.dev)
//    i wklej go w Zakładce: Ustawienia → Wyszukiwanie książek → Adres pośrednika.
const DOZWOLONE = ['isbnIssn', 'title', 'author', 'limit'];

export default {
  async fetch(request) {
    const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json; charset=utf-8' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: { ...cors, 'Access-Control-Allow-Methods': 'GET' } });
    const wej = new URL(request.url).searchParams;
    const wyj = new URLSearchParams();
    for (const p of DOZWOLONE) if (wej.get(p)) wyj.set(p, wej.get(p).slice(0, 200));
    if (!wyj.get('isbnIssn') && !wyj.get('title') && !wyj.get('author')) {
      return new Response(JSON.stringify({ blad: 'Podaj isbnIssn, title albo author.' }), { status: 400, headers: cors });
    }
    wyj.set('limit', String(Math.min(20, Math.max(1, +wyj.get('limit') || 15))));
    const odp = await fetch(`https://data.bn.org.pl/api/institutions/bibs.json?${wyj}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Zakladka/2.4' },
      cf: { cacheTtl: 86400, cacheEverything: true }
    });
    return new Response(odp.body, { status: odp.status, headers: { ...cors, 'Cache-Control': 'public, max-age=86400' } });
  }
};
