// Zakładka: pośrednik dla Cloudflare Workers (darmowy plan wystarczy). Wersja 3:
//  • ?isbnIssn= / ?title= / ?author=  → katalog Biblioteki Narodowej (data.bn.org.pl)
//  • ?ceny=fraza                       → najniższe ceny książek z porównywarki Ceneo (dla listy życzeń)
//  • ?opinie=tytuł&autor=nazwisko      → ocena i opinie czytelników z Lubimyczytać (recenzja Sówki po dodaniu książki)
//
// Jak zaktualizować istniejący worker:
// 1. dash.cloudflare.com → Workers & Pages → twój worker (np. spring-mud-cef8) → Edit code.
// 2. Zaznacz cały stary kod, wklej w to miejsce CAŁY ten plik i kliknij Deploy.
// 3. Adres zostaje ten sam, w aplikacji niczego nie zmieniasz.
const DOZWOLONE_BN = ['isbnIssn', 'title', 'author', 'limit'];
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

/* ---------- Lubimyczytać: ocena i opinie (wersja 3) ---------- */
const bezOg = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toLowerCase();
const odEncji = t => String(t || '').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
/** Wyniki wyszukiwania: id, tytuł, autorzy, średnia i liczba ocen. */
function lcWyniki(html) {
  const wyn = [];
  for (const blok of html.split('class="book-card book-card--l').slice(1, 25)) {
    const id = (blok.match(/data-book-id="(\d+)"/) || [])[1];
    const href = (blok.match(/class="book-card__title"[^>]*href="(\/ksiazka\/[^"]+)"/) || [])[1];
    const tytul = odEncji((blok.match(/class="book-card__title"[^>]*title="([^"]*)"/) || [])[1]);
    const autorzy = odEncji(((blok.match(/class="book-card__author">([\s\S]*?)<\/div>/) || [])[1] || ''));
    const ocena = parseFloat(((blok.match(/rating__avarage">([^<]*)</) || [])[1] || '').replace(',', '.')) || 0;
    const ocen = parseInt(((blok.match(/rating__text">[\s\S]*?(\d[\d\s]*)\s*ocen/) || [])[1] || '0').replace(/\s/g, ''), 10) || 0;
    if (id && href) wyn.push({ id, href, tytul, autorzy, ocena, ocen });
  }
  return wyn;
}
/** Najlepsze dopasowanie: zgodny autor (nazwisko) i tytuł, a z nich ta pozycja, która ma najwięcej ocen. */
function lcWybierz(wyniki, tytul, autor) {
  const nazw = bezOg(autor).split(/[\s,]+/).filter(x => x.length > 2).pop() || '';
  const tyt = bezOg(tytul).split(/[:.(]/)[0].trim();
  let kand = wyniki.filter(w => !nazw || bezOg(w.autorzy).includes(nazw));
  const poTytule = kand.filter(w => bezOg(w.tytul).includes(tyt) || tyt.includes(bezOg(w.tytul).split(/[:.(]/)[0].trim()));
  if (poTytule.length) kand = poTytule;
  return kand.sort((a, b) => b.ocen - a.ocen)[0] || null;
}
/** Strona książki: dane z JSON-LD (ocena, liczba ocen, opinie z ich ocenami). */
function lcKsiazka(html) {
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let d; try { d = JSON.parse(m[1]); } catch { continue; }
    if (d['@type'] !== 'Book') continue;
    const ar = d.aggregateRating || {};
    const opinie = (d.review || []).map(r => ({ tekst: odEncji(r.reviewBody), ocena: parseFloat(String((r.reviewRating || {}).ratingValue || '').replace(',', '.')) || null, autor: (r.author || {}).name || '' }))
      .filter(r => r.tekst.length > 30);
    return {
      tytul: d.name || '', url: d.url || '', ocena: parseFloat(String(ar.ratingValue || '').replace(',', '.')) || null, ocen: +ar.ratingCount || 0, skala: +ar.bestRating || 10,
      strony: +d.numberOfPages || null, gatunek: odEncji(String(d.genre || '').split('/').pop().replace(/-/g, ' ')), opinie
    };
  }
  return null;
}
/** O czym najczęściej piszą czytelnicy (liczone ze wszystkich opinii) i średnia ocen w opiniach. */
const TEMATY = {
  wciaga: /wciąga|nie (mogłam|mogłem) się oderwać|pochłon|jednym tchem|nie da się odłożyć/i,
  nudna: /nudn|dłuży|dłużyzn|męcząc|ciężko się czyta|nie (dałam|dałem) rady|przegadan/i,
  klimat: /klimat/i,
  humor: /humor|zabawn|śmieszn|(śmiałam|śmiałem) się/i,
  jezyk: /piękny język|pięknie napisan|styl|pióro|język/i,
  emocje: /wzrusz|płakał|łzy|emocj|chwyta za serce/i,
  polecam: /polecam/i,
  rozczarowanie: /rozczarow|zawiod|spodziewał/i,
  bohaterowie: /bohater|postaci/i,
  zakonczenie: /zakończeni|końcówk|finał/i
};
function lcTematy(opinie) {
  const t = {};
  for (const o of opinie) for (const [k, re] of Object.entries(TEMATY)) if (re.test(o.tekst)) t[k] = (t[k] || 0) + 1;
  const oc = opinie.map(o => o.ocena).filter(x => x != null);
  return { tematy: t, opinieIle: opinie.length, opinieSrednia: oc.length ? Math.round(oc.reduce((a, b) => a + b, 0) / oc.length * 10) / 10 : null };
}
/** Krótkie cytaty z opinii: najlepsza, najgorsza i jedna ze środka; skrócone do 1–2 zdań. */
function lcCytaty(opinie) {
  const skroc = t => { const zd = t.split(/(?<=[.!?…])\s+/); let o = ''; for (const z of zd) { if ((o + ' ' + z).length > 220) break; o = (o + ' ' + z).trim(); } return (o || t.slice(0, 200) + '…').trim(); };
  const z = opinie.filter(o => o.ocena != null).sort((a, b) => b.ocena - a.ocena);
  const wyb = [z[0], z[z.length - 1], z[Math.floor(z.length / 2)]].filter(Boolean);
  const unik = [...new Map(wyb.map(o => [o.tekst, o])).values()];
  return (unik.length ? unik : opinie.slice(0, 3)).map(o => ({ tekst: skroc(o.tekst), ocena: o.ocena }));
}

export default {
  async fetch(request) {
    const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json; charset=utf-8' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: { ...cors, 'Access-Control-Allow-Methods': 'GET' } });
    const wej = new URL(request.url).searchParams;

    // ---- opinie z Lubimyczytać ----
    if (wej.get('opinie')) {
      const tytul = wej.get('opinie').slice(0, 150).trim(), autor = (wej.get('autor') || '').slice(0, 80).trim();
      const naglowki = { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'pl-PL,pl;q=0.9' };
      try {
        const fraza = `${tytul.split(/[:(]/)[0]} ${autor.split(/[\s,]+/).filter(Boolean).pop() || ''}`.trim();
        const sz = await fetch(`https://lubimyczytac.pl/szukaj/ksiazki?phrase=${encodeURIComponent(fraza)}`, { headers: naglowki, cf: { cacheTtl: 86400, cacheEverything: true } });
        const wybor = lcWybierz(lcWyniki(await sz.text()), tytul, autor);
        if (!wybor) return new Response(JSON.stringify({ zrodlo: 'Lubimyczytać', brak: true }), { headers: { ...cors, 'Cache-Control': 'public, max-age=86400' } });
        const st = await fetch(`https://lubimyczytac.pl${wybor.href}`, { headers: naglowki, cf: { cacheTtl: 86400, cacheEverything: true } });
        const k = lcKsiazka(await st.text()) || {};
        const wynik = {
          zrodlo: 'Lubimyczytać', tytul: k.tytul || wybor.tytul, autorzy: wybor.autorzy, url: k.url || `https://lubimyczytac.pl${wybor.href}`,
          ocena: k.ocena || wybor.ocena || null, ocen: k.ocen || wybor.ocen, skala: k.skala || 10, gatunek: k.gatunek || '', opinie: lcCytaty(k.opinie || []), ...lcTematy(k.opinie || [])
        };
        return new Response(JSON.stringify(wynik), { headers: { ...cors, 'Cache-Control': 'public, max-age=86400' } });
      } catch (e) {
        return new Response(JSON.stringify({ blad: 'Lubimyczytać nie odpowiada.' }), { status: 502, headers: cors });
      }
    }

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
      return new Response(JSON.stringify({ blad: 'Podaj isbnIssn, title, author, ceny albo opinie.' }), { status: 400, headers: cors });
    }
    wyj.set('limit', String(Math.min(20, Math.max(1, +wyj.get('limit') || 15))));
    const odp = await fetch(`https://data.bn.org.pl/api/institutions/bibs.json?${wyj}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Zakladka/2.12' },
      cf: { cacheTtl: 86400, cacheEverything: true }
    });
    return new Response(odp.body, { status: odp.status, headers: { ...cors, 'Cache-Control': 'public, max-age=86400' } });
  }
};
