// Zakładka: pośrednik dla Cloudflare Workers (darmowy plan wystarczy). Wersja 2:
//  • ?isbnIssn= / ?title= / ?author=  → katalog Biblioteki Narodowej (data.bn.org.pl)
//  • ?ceny=fraza                       → najniższe ceny książek z porównywarki Ceneo (dla listy życzeń)
//
// Jak zaktualizować istniejący worker:
// 1. dash.cloudflare.com → Workers & Pages → twój worker (np. spring-mud-cef8) → Edit code.
// 2. Zaznacz cały stary kod, wklej w to miejsce CAŁY ten plik i kliknij Deploy.
// 3. Adres zostaje ten sam, w aplikacji niczego nie zmieniasz.
const DOZWOLONE_BN = ['isbnIssn', 'title', 'author', 'limit'];
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

export default {
  async fetch(request) {
    const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json; charset=utf-8' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: { ...cors, 'Access-Control-Allow-Methods': 'GET' } });
    const wej = new URL(request.url).searchParams;

    // ---- ceny z Ceneo ----
    if (wej.get('ceny')) {
      const fraza = wej.get('ceny').slice(0, 120).trim();
      try {
        const odp = await fetch(`https://www.ceneo.pl/;szukaj-${encodeURIComponent(fraza).replace(/%20/g, '+')}`, {
          headers: { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'pl-PL,pl;q=0.9' },
          cf: { cacheTtl: 21600, cacheEverything: true }
        });
        const html = await odp.text();
        const wyniki = [];
        const re = /<div class="\s*cat-prod-row[\s\S]*?>/g;
        let m;
        while ((m = re.exec(html)) && wyniki.length < 15) {
          const tag = m[0];
          const a = n => { const x = tag.match(new RegExp(`data-${n}="([^"]*)"`, 'i')); return x ? x[1] : ''; };
          const nazwa = a('productName').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
          const cena = parseFloat(a('productminprice') || a('Price'));
          const pid = a('pid') || a('productid');
          const kat = a('GACategoryName');
          if (nazwa && cena > 0 && pid) wyniki.push({ nazwa, cena, link: `https://www.ceneo.pl/${pid}`, kategoria: kat });
        }
        return new Response(JSON.stringify({ zrodlo: 'Ceneo', fraza, wyniki }), { headers: { ...cors, 'Cache-Control': 'public, max-age=21600' } });
      } catch (e) {
        return new Response(JSON.stringify({ blad: 'Ceneo nie odpowiada.' }), { status: 502, headers: cors });
      }
    }

    // ---- Biblioteka Narodowa ----
    const wyj = new URLSearchParams();
    for (const p of DOZWOLONE_BN) if (wej.get(p)) wyj.set(p, wej.get(p).slice(0, 200));
    if (!wyj.get('isbnIssn') && !wyj.get('title') && !wyj.get('author')) {
      return new Response(JSON.stringify({ blad: 'Podaj isbnIssn, title, author albo ceny.' }), { status: 400, headers: cors });
    }
    wyj.set('limit', String(Math.min(20, Math.max(1, +wyj.get('limit') || 15))));
    const odp = await fetch(`https://data.bn.org.pl/api/institutions/bibs.json?${wyj}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Zakladka/2.12' },
      cf: { cacheTtl: 86400, cacheEverything: true }
    });
    return new Response(odp.body, { status: odp.status, headers: { ...cors, 'Cache-Control': 'public, max-age=86400' } });
  }
};
