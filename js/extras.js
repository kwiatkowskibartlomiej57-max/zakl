'use strict';
/* Zakładka — wyszukiwanie książek w internecie, skaner ISBN, zdjęcia okładek, import i eksport plików */

/* ---------- wyszukiwanie książek ----------
   Źródła:
   • Google Books — najlepsze okładki; bez własnego klucza często trafia na wspólny limit (błąd 429),
   • Open Library — API wydań po ISBN (ma też część polskich wydań) i wyszukiwarka po tytule,
   • Biblioteka Narodowa — prawie każda książka wydana w Polsce. Jej serwer nie pozwala na zapytania
     prosto z przeglądarki, więc idzie przez pośrednika: bn.php obok aplikacji (serwer z PHP)
     albo własny adres z Ustawień (np. Cloudflare Worker z pliku proxy/cloudflare-worker.js). */
const Wyszukiwarka = (() => {
  const czyIsbn = q => {
    const s = q.replace(/[-\s]/g, '').toUpperCase();
    return /^(\d{9}[\dX]|\d{13})$/.test(s) ? s : null;
  };

  function isbn13na10(s) {
    if (!/^978\d{10}$/.test(s)) return null;
    const r = s.slice(3, 12);
    let suma = 0;
    for (let i = 0; i < 9; i++) suma += (10 - i) * +r[i];
    const k = (11 - suma % 11) % 11;
    return r + (k === 10 ? 'X' : k);
  }
  function isbn10na13(s) {
    if (!/^\d{9}[\dX]$/.test(s)) return null;
    const r = '978' + s.slice(0, 9);
    let suma = 0;
    for (let i = 0; i < 12; i++) suma += +r[i] * (i % 2 ? 3 : 1);
    return r + (10 - suma % 10) % 10;
  }
  const warianty = isbn => [...new Set([isbn, isbn13na10(isbn), isbn10na13(isbn)].filter(Boolean))];

  const stan = { googleLimit: false, bnLokalny: null, ostatnie: {}, poprawka: null };

  function zTimeoutem(url, ms = 9000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
  }
  const ustawienia = () => (typeof Z !== 'undefined' && Z.ustawienia) || {};

  /* ----- Google Books ----- */
  async function googleZapytanie(zap) {
    const klucz = (ustawienia().googleKlucz || '').trim();
    const r = await zTimeoutem(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(zap)}&maxResults=15&printType=books${klucz ? `&key=${encodeURIComponent(klucz)}` : ''}`);
    if (r.status === 429 || r.status === 403) { stan.googleLimit = true; throw new Error(`Google Books: limit zapytań (${r.status})`); }
    if (!r.ok) throw new Error(`Google Books odpowiada błędem ${r.status}`);
    stan.googleLimit = false;
    const j = await r.json();
    return (j.items || []).map(it => {
      const v = it.volumeInfo || {};
      const ids = v.industryIdentifiers || [];
      const nr = ids.find(x => x.type === 'ISBN_13') || ids.find(x => x.type === 'ISBN_10');
      let okl = v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail);
      if (okl) okl = okl.replace(/^http:/, 'https:').replace('&edge=curl', '');
      return {
        tytul: v.title || '',
        autor: (v.authors || []).join(', '),
        strony: v.pageCount || null,
        okladka: okl || null,
        isbn: nr ? (nr.type === 'ISBN_10' ? isbn10na13(nr.identifier) || nr.identifier : nr.identifier) : '',
        rok: (v.publishedDate || '').slice(0, 4),
        wydawca: v.publisher || '',
        zrodlo: 'Google Books',
        tagi: []
      };
    }).filter(x => x.tytul);
  }
  async function google(q) {
    const isbn = czyIsbn(q);
    if (!isbn) return googleZapytanie(q);
    for (const w of warianty(isbn)) {
      const x = await googleZapytanie(`isbn:${w}`);
      if (x.length) return x;
    }
    return [];
  }

  /* ----- Open Library ----- */
  async function openLibraryIsbn(isbn) {
    const klucze = warianty(isbn).map(w => `ISBN:${w}`);
    const r = await zTimeoutem(`https://openlibrary.org/api/books?bibkeys=${klucze.join(',')}&jscmd=data&format=json`);
    if (!r.ok) throw new Error(`Open Library odpowiada błędem ${r.status}`);
    const j = await r.json();
    return Object.values(j).map(d => ({
      tytul: d.title || '',
      autor: (d.authors || []).map(a => a.name).slice(0, 3).join(', '),
      strony: d.number_of_pages || (d.pagination && parseInt(d.pagination, 10)) || null,
      okladka: d.cover ? (d.cover.medium || d.cover.large || d.cover.small).replace(/^http:/, 'https:') : null,
      isbn: (d.identifiers && d.identifiers.isbn_13 && d.identifiers.isbn_13[0]) || isbn,
      rok: (String(d.publish_date || '').match(/\d{4}/) || [''])[0],
      wydawca: (d.publishers || []).map(p => p.name).join(', '),
      zrodlo: 'Open Library',
      tagi: []
    })).filter(x => x.tytul);
  }
  async function openLibrary(q) {
    const isbn = czyIsbn(q);
    if (isbn) return openLibraryIsbn(isbn);
    const pola = 'title,author_name,number_of_pages_median,cover_i,isbn,first_publish_year,language';
    const r = await zTimeoutem(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=15&fields=${pola}`);
    if (!r.ok) throw new Error(`Open Library odpowiada błędem ${r.status}`);
    const j = await r.json();
    return (j.docs || []).map(d => ({
      tytul: d.title || '',
      autor: (d.author_name || []).slice(0, 3).join(', '),
      strony: d.number_of_pages_median || null,
      okladka: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
      isbn: (d.isbn || []).find(x => x.startsWith('97883')) || (d.isbn || []).find(x => x.length === 13) || '',
      rok: d.first_publish_year ? String(d.first_publish_year) : '',
      polski: (d.language || []).includes('pol'),
      zrodlo: 'Open Library',
      tagi: []
    })).filter(x => x.tytul).sort((a, b) => b.polski - a.polski);
  }

  /* ----- Biblioteka Narodowa (przez pośrednika) ----- */
  const BN_API = 'https://data.bn.org.pl/api/institutions/bibs.json';
  function adresyBN(parametry) {
    const qs = new URLSearchParams({ ...parametry, limit: '15' }).toString();
    const wlasny = (ustawienia().posrednik || (typeof POSREDNIK_BN !== 'undefined' ? POSREDNIK_BN : '')).trim().replace(/\/+$/, '');
    const lista = [];
    if (wlasny) lista.push(wlasny.includes('{url}') ? wlasny.replace('{url}', encodeURIComponent(`${BN_API}?${qs}`)) : `${wlasny}?${qs}`);
    if (stan.bnLokalny !== false && location.protocol.startsWith('http')) lista.push(`bn.php?${qs}`);
    return lista;
  }
  const pole = (marc, tag) => (marc && marc.fields || []).filter(f => f[tag]).map(f => f[tag]);
  const podpole = (f, kod) => (f && f.subfields || []).filter(s => s[kod] != null).map(s => s[kod]);
  const czysc = t => String(t || '').replace(/\s*[/:;,.=]\s*$/, '').replace(/\s+/g, ' ').trim();
  function autorBN(nazwa) {
    const t = czysc(nazwa).replace(/\s*\(.*?\)\s*/g, ' ').trim();
    const m = t.match(/^([^,]+),\s*(.+)$/);
    return m ? `${m[2]} ${m[1]}` : t;
  }
  function zBN(b) {
    const marc = b.marc;
    const f245 = pole(marc, '245')[0];
    const glowny = f245 ? czysc(podpole(f245, 'a')[0]) : '', podtytul = f245 ? czysc(podpole(f245, 'b')[0]) : '';
    // krótki podtytuł zostaje („Empuzjon: horror przyrodoleczniczy”), długi opis już nie
    let tytul = glowny ? (podtytul && glowny.length + podtytul.length <= 60 ? `${glowny}: ${podtytul}` : glowny) : czysc(b.title);
    tytul = tytul.replace(/\s*:\s*$/, '');
    if (tytul.length > 60) tytul = tytul.split(/\s+(?:albo|czyli)\s+|\s*[:;]\s+/)[0]; // „Księgi Jakubowe albo Wielka podróż…” → „Księgi Jakubowe”
    // 100 = główny autor; 700 (tłumacze, ilustratorzy) tylko gdy głównego brak
    const glowni = pole(marc, '100'), dodatkowi = pole(marc, '700').filter(f => !podpole(f, 'e').some(r => /tłum|il\.|ilustr|red\.|oprac/i.test(r)));
    const autorzy = (glowni.length ? glowni : dodatkowi.slice(0, 2)).map(f => podpole(f, 'a')[0]).filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).map(autorBN);
    const opis = podpole(pole(marc, '300')[0], 'a')[0] || '';
    // „451, [7] s.” → 451; liczby w nawiasach to strony nienumerowane
    const liczby = (opis.replace(/\[[^\]]*\]/g, '').match(/\d+/g) || []).map(Number);
    const isbny = pole(marc, '020').map(f => (podpole(f, 'a')[0] || '').replace(/[^\dX]/gi, '')).filter(Boolean);
    // cykl: pole 490 albo 830, np. „Wiedźmin ; t. 2” → seria „Wiedźmin”, tom 2
    // 800 $t = cykl autora („Wiedźmin”, t. 2). 490 bierzemy tylko, gdy wskazuje autora („Saga o wiedźminie / Andrzej Sapkowski”);
    // serie wydawnicze bez autora („Fantasy”, „Seria z Żurawiem”) pomijamy.
    let seria = '', tom = null;
    const f800 = pole(marc, '800').find(f => podpole(f, 't')[0]);
    const f490 = pole(marc, '490').find(f => / \/ /.test(podpole(f, 'a')[0] || ''));
    const zrodloSerii = f800 ? { nazwa: podpole(f800, 't')[0], v: podpole(f800, 'v')[0] } : f490 ? { nazwa: podpole(f490, 'a')[0].split(' / ')[0], v: podpole(f490, 'v')[0] } : null;
    if (zrodloSerii) {
      seria = czysc(zrodloSerii.nazwa).replace(/\s*\(.*?\)\s*$/, '');
      const v = String(zrodloSerii.v || '').match(/(\d+)/);
      tom = v ? +v[1] : null;
      if (seria.length > 60 || /^\d+$/.test(seria)) seria = '';
    }
    const streszczenie = podpole(pole(marc, '520')[0], 'a')[0] || '';
    return {
      opis: streszczenie ? czysc(streszczenie) : '',
      jezyk: String(b.language || ''),
      seria, tom: seria ? tom : null,
      tytul,
      autor: autorzy.join(', '),
      // poniżej 40 stron to zwykle broszura, fragment albo opis nośnika (audiobook), a nie liczba stron książki
      strony: (n => n >= 40 ? n : null)(liczby.length ? Math.max(0, ...liczby.filter(n => n < 5000)) : 0),
      okladka: null,
      isbn: isbny.find(x => x.length === 13) || isbny[0] || '',
      isbny,
      rok: String(b.publicationYear || '').slice(0, 4),
      wydawca: czysc(podpole(pole(marc, '260')[0] || pole(marc, '264')[0], 'b')[0] || ''),
      zrodlo: 'Biblioteka Narodowa',
      tagi: [b.genre, b.subject].filter(Boolean).flatMap(t => String(t).split(/\s{2,}|;/)).map(t => t.trim().toLowerCase()).filter(t => t && t.length < 30).slice(0, 2)
    };
  }
  async function bibliotekaNarodowa(q) {
    const isbn = czyIsbn(q);
    if (!isbn) {
      // tekst może być tytułem albo nazwiskiem autora: pytamy o oba naraz
      // „Empuzjon Tokarczuk” / „Tokarczuk Empuzjon”: dzielimy też na tytuł + nazwisko (pierwsze albo ostatnie słowo)
      const slowa = q.split(/\s+/).filter(Boolean);
      const zapytania = [{ title: q }, { author: q }];
      if (slowa.length >= 2) {
        zapytania.push({ title: slowa.slice(0, -1).join(' '), author: slowa[slowa.length - 1] });
        zapytania.push({ title: slowa.slice(1).join(' '), author: slowa[0] });
      }
      const wyn = await Promise.allSettled(zapytania.map(p => bnZapytanie(p)));
      if (wyn.every(r => r.status === 'rejected')) throw wyn[0].reason;
      // najpierw trafienia „tytuł + autor” (najdokładniejsze), potem reszta
      return [...wyn.slice(2), ...wyn.slice(0, 2)].flatMap(r => r.value || []);
    }
    return bnZapytanie({ isbnIssn: isbn }, isbn);
  }
  async function bnZapytanie(parametry, isbn = null) {
    const adresy = adresyBN(parametry);
    if (!adresy.length) return [];
    let blad = null;
    for (const url of adresy) {
      try {
        const r = await zTimeoutem(url, 12000);
        if (!r.ok) throw new Error(`Biblioteka Narodowa: błąd ${r.status}`);
        const j = await r.json(); // zwykły plik zamiast PHP albo strona błędu → wyjątek
        if (!j || !Array.isArray(j.bibs)) throw new Error('Biblioteka Narodowa: nieoczekiwana odpowiedź');
        if (url.startsWith('bn.php')) stan.bnLokalny = true;
        // bez artykułów i recenzji z czasopism; polskie wydania najpierw
        let lista = j.bibs.filter(b => !b.deleted && (!b.kind || /książk|ksiazk|book/i.test(b.kind)))
          .sort((a, b) => (b.language === 'polski') - (a.language === 'polski'))
          .map(zBN).filter(x => x.tytul);
        if (isbn && !lista.length && isbn.length === 13) {
          // BN czasem trzyma ISBN z myślnikami albo jako 10 cyfr
          const alt = isbn13na10(isbn);
          if (alt) return bnZapytanie({ isbnIssn: alt }, alt);
        }
        return lista;
      } catch (e) {
        if (url.startsWith('bn.php')) stan.bnLokalny = false;
        blad = e;
      }
    }
    throw blad;
  }

  /* ----- łączenie wyników ----- */
  const klucz = w => `${w.tytul} ${w.autor.split(',')[0]}`.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  function polacz(isbn, listy) {
    const wszystkie = listy.flat();
    if (isbn) {
      // jedna książka: bierz najlepsze pole z każdego źródła
      const pasujace = wszystkie; // wszystkie źródła pytano o ten sam numer
      if (!pasujace.length) return [];
      const bn = pasujace.find(w => w.zrodlo === 'Biblioteka Narodowa');
      const glowny = bn || pasujace[0];
      // krótszy tytuł z innego źródła, jeśli to początek pełnego tytułu BN
      const krotki = pasujace.map(w => w.tytul).filter(t => t && t.length < glowny.tytul.length && glowny.tytul.toLowerCase().startsWith(t.toLowerCase())).sort((a, b) => a.length - b.length)[0];
      const scalony = {
        ...glowny,
        tytul: glowny.tytul.length > 50 && krotki ? krotki : glowny.tytul,
        isbn: isbn.length === 13 ? isbn : (isbn10na13(isbn) || isbn),
        autor: glowny.autor || (pasujace.find(w => w.autor) || {}).autor || '',
        strony: glowny.strony || (pasujace.find(w => w.strony) || {}).strony || null,
        okladka: (pasujace.find(w => w.okladka) || {}).okladka || null,
        seria: glowny.seria || (pasujace.find(w => w.seria) || {}).seria || '',
        tom: glowny.tom ?? (pasujace.find(w => w.tom != null) || {}).tom ?? null,
        zrodlo: [...new Set(pasujace.map(w => w.zrodlo))].join(' + ')
      };
      return [scalony];
    }
    const mapa = new Map();
    for (const w of wszystkie) {
      const k = klucz(w);
      const byl = mapa.get(k);
      if (!byl) { mapa.set(k, { ...w }); continue; }
      byl.strony = byl.strony || w.strony;
      byl.okladka = byl.okladka || w.okladka;
      byl.isbn = byl.isbn || w.isbn;
    }
    return [...mapa.values()];
  }
  /** Najtrafniejsze najpierw: ile słów zapytania jest w tytule i autorze. */
  function wedlugTrafnosci(q, lista) {
    const norm = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
    const slowa = norm(q).split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 1);
    if (!slowa.length) return lista;
    const ocena = w => {
      const t = norm(`${w.tytul} ${w.autor}`);
      return slowa.filter(s => t.includes(s)).length / slowa.length + (norm(w.tytul).startsWith(slowa[0]) ? 0.2 : 0) + (w.okladka ? 0.05 : 0) + (w.strony ? 0.05 : 0);
    };
    return lista.map((w, i) => ({ w, i, o: ocena(w) })).sort((a, b) => b.o - a.o || a.i - b.i).map(x => x.w);
  }

  async function szukaj(q) {
    const isbn = czyIsbn(q);
    const zrodla = [['google', google], ['openLibrary', openLibrary], ['bn', bibliotekaNarodowa]];
    const wyniki = await Promise.allSettled(zrodla.map(([, f]) => f(q)));
    stan.ostatnie = Object.fromEntries(zrodla.map(([n], i) => [n, wyniki[i].status === 'fulfilled' ? wyniki[i].value.length : `błąd: ${wyniki[i].reason && wyniki[i].reason.message}`]));
    const listy = wyniki.map(r => (r.status === 'fulfilled' ? r.value : []));
    // po tytule: najpierw Biblioteka Narodowa (polskie wydania), potem Google, potem Open Library
    const kolejnosc = isbn ? listy : [listy[2], listy[0], listy[1]];
    const razem = isbn ? polacz(isbn, kolejnosc) : wedlugTrafnosci(q, polacz(null, kolejnosc));
    if (!razem.length && wyniki.every(r => r.status === 'rejected')) throw wyniki[0].reason;
    return razem;
  }

  /* ----- tolerancja na literówki i brak polskich znaków (2.11) ----- */
  const bezOgonkow = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
  const slowaZ = t => bezOgonkow(t).split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 1);
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 3) return 9;
    const d = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = d[0]; d[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const t = d[j];
        d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = t;
      }
    }
    return d[b.length];
  }
  /** 0–1: jak dobrze wynik pasuje do zapytania, z tolerancją na literówki i ogonki. */
  function podobienstwo(q, w) {
    const qs = slowaZ(q), ws = slowaZ(`${w.tytul} ${w.autor}`);
    if (!qs.length || !ws.length) return 0;
    let suma = 0;
    for (const s of qs) {
      let naj = 0;
      for (const t of ws) {
        if (t === s) { naj = 1; break; }
        if (t.startsWith(s) || (s.length >= 4 && s.startsWith(t) && t.length >= 4)) naj = Math.max(naj, .9);
        else if (s.length >= 4) { const l = lev(s, t.slice(0, s.length + 1)); const l2 = lev(s, t); const m = Math.min(l, l2); if (m <= (s.length >= 7 ? 2 : 1)) naj = Math.max(naj, 1 - m * .18); }
      }
      suma += naj;
    }
    return suma / qs.length;
  }
  /** Słowa przycięte do początku z gwiazdką: „sapkowsky wiedzmin” → „sapkow* wiedzm*”. */
  const zapytanieRdzeni = q => slowaZ(q).filter(w => w.length >= 3).map(w => (w.length > 5 ? w.slice(0, w.length - 2) : w.length > 3 ? w.slice(0, w.length - 1) : w) + '*').join(' ');

  async function openLibraryRdzenie(q) {
    const z = zapytanieRdzeni(q);
    if (!z) return [];
    const pola = 'title,author_name,number_of_pages_median,cover_i,isbn,first_publish_year,language';
    const r = await zTimeoutem(`https://openlibrary.org/search.json?q=${encodeURIComponent(z)}&limit=20&fields=${pola}`);
    if (!r.ok) return [];
    const j = await r.json();
    return (j.docs || []).map(d => ({
      tytul: d.title || '', autor: (d.author_name || []).slice(0, 3).join(', '), strony: d.number_of_pages_median || null,
      okladka: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
      isbn: (d.isbn || []).find(x => x.startsWith('97883')) || (d.isbn || []).find(x => x.length === 13) || '',
      rok: d.first_publish_year ? String(d.first_publish_year) : '', polski: (d.language || []).includes('pol'), zrodlo: 'Open Library', tagi: []
    })).filter(x => x.tytul);
  }

  /** Pełne wyszukiwanie z drugą rundą „po rdzeniach”, gdy pierwsza dała mało albo słabo pasujące wyniki. */
  async function szukajMadrze(q) {
    stan.poprawka = null;
    const isbn = czyIsbn(q);
    let wyn = [];
    let blad = null;
    try { wyn = await szukaj(q); } catch (e) { blad = e; }
    if (isbn) { if (blad) throw blad; return wyn; }
    const najlepsze = wyn.slice(0, 3).reduce((m, w) => Math.max(m, podobienstwo(q, w)), 0);
    if (wyn.length < 4 || najlepsze < .75) {
      try {
        const dod = await openLibraryRdzenie(q);
        const znane = new Set(wyn.map(w => bezOgonkow(w.tytul + w.autor)));
        wyn = wyn.concat(dod.filter(w => !znane.has(bezOgonkow(w.tytul + w.autor))));
      } catch { /* druga runda opcjonalna */ }
      // bez polskich znaków: dopytaj też BN słowami z rdzeni (np. „ksiegi jakubowe”)
    }
    if (!wyn.length && blad) throw blad;
    const ocenione = wyn.map((w, i) => ({ w, i, o: podobienstwo(q, w) + (w.polski ? .05 : 0) + (w.okladka ? .02 : 0) + (w.strony ? .02 : 0) }))
      .sort((a, b) => b.o - a.o || a.i - b.i);
    const top = ocenione[0];
    // „Czy chodziło ci o…”: najlepszy wynik pasuje dopiero z tolerancją literówek
    if (top && top.o >= .6) {
      const qs = slowaZ(q), ws = slowaZ(`${top.w.tytul} ${top.w.autor}`);
      if (qs.some(s => !ws.some(t => t === s || t.startsWith(s)))) stan.poprawka = `${top.w.tytul}${top.w.autor ? ' ' + top.w.autor.split(',')[0] : ''}`;
    }
    const dobre = ocenione.filter(x => x.o >= .5);
    return (dobre.length >= 3 ? dobre : ocenione.filter(x => x.o >= .34 || ocenione.length <= 5)).map(x => x.w);
  }

  /* ----- podpowiedzi przy pisaniu ----- */
  let podpCtrl = null;
  async function podpowiedzi(q) {
    if (podpCtrl) podpCtrl.abort();
    podpCtrl = new AbortController();
    const s = slowaZ(q);
    if (!s.length || q.trim().length < 3 || czyIsbn(q)) return [];
    const z = s.map((w, i) => i === s.length - 1 && w.length >= 3 ? w + '*' : w).join(' ');
    const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(z)}&limit=20&fields=title,author_name,first_publish_year,language`, { signal: podpCtrl.signal });
    if (!r.ok) return [];
    const j = await r.json();
    const widziane = new Set();
    return (j.docs || []).map(d => ({ tytul: d.title || '', autor: (d.author_name || [])[0] || '', rok: d.first_publish_year || '', polski: (d.language || []).includes('pol') }))
      .filter(x => x.tytul && !widziane.has(bezOgonkow(x.tytul + x.autor)) && widziane.add(bezOgonkow(x.tytul + x.autor)))
      .map(x => ({ ...x, o: podobienstwo(q, x) }))
      .filter(x => x.o >= .6) // tylko to, co naprawdę zaczyna się od wpisanych słów
      .sort((a, b) => b.o - a.o || b.polski - a.polski).slice(0, 6);
  }

  /* ----- opis książki: Wikipedia PL, Google Books, Open Library ----- */
  const bezHtml = t => String(t || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n').trim();
  async function opisWikipedia({ tytul, autor }) {
    const q = `${tytul} ${autor ? autor.split(',')[0] : ''}`.trim();
    const r = await zTimeoutem(`https://pl.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=5&format=json&origin=*`);
    if (!r.ok) return null;
    const j = await r.json();
    const tn = bezOgonkow(tytul).split(/[:.(]/)[0].trim();
    const naz = autor ? bezOgonkow(autor.split(',')[0]).split(' ').pop() : '';
    const traf = (j.query && j.query.search || []).find(x => { const t = bezOgonkow(x.title); return t.startsWith(tn) || tn.startsWith(t.replace(/\s*\(.*\)$/, '')); });
    if (!traf) return null;
    const s = await zTimeoutem(`https://pl.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(traf.title.replace(/ /g, '_'))}`);
    if (!s.ok) return null;
    const p = await s.json();
    const tekst = p.extract || '';
    // pilnuj, żeby to był artykuł o książce, a nie o czymś o tej samej nazwie
    const gatunkowe = /powieść|książk|zbiór|opowiada|reportaż|tom |cykl|esej|poradnik|wydan|autorstwa|literat|dramat|poemat/i.test(tekst);
    const oKsiazce = naz && naz.length > 2 ? bezOgonkow(tekst).includes(naz) : gatunkowe; // ten sam tytuł, inny autor = inna książka
    if (!oKsiazce || tekst.length < 60) return null;
    return { tekst, zrodlo: 'Wikipedia', link: p.content_urls && p.content_urls.desktop && p.content_urls.desktop.page };
  }
  async function opisGoogle({ tytul, autor, isbn }) {
    if (stan.googleLimit && !(ustawienia().googleKlucz)) return null;
    const klucz = (ustawienia().googleKlucz || '').trim();
    const zap = isbn ? `isbn:${isbn}` : `intitle:${tytul}${autor ? ` inauthor:${autor.split(',')[0]}` : ''}`;
    const r = await zTimeoutem(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(zap)}&maxResults=3${klucz ? `&key=${encodeURIComponent(klucz)}` : ''}`);
    if (r.status === 429 || r.status === 403) { stan.googleLimit = true; return null; }
    if (!r.ok) return null;
    const j = await r.json();
    const v = (j.items || []).map(x => x.volumeInfo || {}).find(x => x.description);
    return v ? { tekst: bezHtml(v.description), zrodlo: 'Google Books' } : null;
  }
  async function opisOpenLibrary({ tytul, autor, isbn }) {
    let klucz = null;
    if (isbn) {
      const r = await zTimeoutem(`https://openlibrary.org/isbn/${isbn}.json`);
      if (r.ok) { const j = await r.json(); klucz = j.works && j.works[0] && j.works[0].key; if (j.description) return { tekst: bezHtml(j.description.value || j.description), zrodlo: 'Open Library', jezyk: 'en' }; }
    }
    if (!klucz) {
      const r = await zTimeoutem(`https://openlibrary.org/search.json?title=${encodeURIComponent(tytul)}${autor ? `&author=${encodeURIComponent(autor.split(',')[0])}` : ''}&limit=1&fields=key`);
      if (r.ok) { const j = await r.json(); klucz = j.docs && j.docs[0] && j.docs[0].key; }
    }
    if (!klucz) return null;
    const w = await zTimeoutem(`https://openlibrary.org${klucz}.json`);
    if (!w.ok) return null;
    const j = await w.json();
    const d = j.description && (j.description.value || j.description);
    return d ? { tekst: bezHtml(d), zrodlo: 'Open Library', jezyk: 'en', tematy: (j.subjects || []).slice(0, 8) } : null;
  }
  async function opis(k) {
    for (const f of [opisWikipedia, opisGoogle, opisOpenLibrary]) {
      try { const o = await f(k); if (o && o.tekst) return { ...o, tekst: o.tekst.slice(0, 4000) }; } catch { /* następne źródło */ }
    }
    return null;
  }

  /* ----- podobne książki — tylko polskie wydania (2.13) ----- */
  const okladkaIsbn = isbn => isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false` : null;
  /** Open Library z filtrem polskich wydań: tytuł bierzemy z polskiego wydania, nie z angielskiego dzieła. */
  async function olPolskie(zap, limit = 20, offset = 0) {
    const r = await zTimeoutem(`https://openlibrary.org/search.json?q=${encodeURIComponent(zap + ' language:pol')}&limit=${limit}&offset=${offset}&fields=key,title,author_name,cover_i,number_of_pages_median,first_publish_year,editions`);
    if (!r.ok) return [];
    const j = await r.json();
    return (j.docs || []).map(d => {
      const wyd = d.editions && d.editions.docs && d.editions.docs[0];
      return { tytul: (wyd && wyd.title) || d.title, autor: (d.author_name || [])[0] || '', okladka: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null, strony: d.number_of_pages_median || null, rok: d.first_publish_year || '', polski: !!wyd, isbn: '' };
    }).filter(x => x.tytul && x.polski);
  }
  async function podobne(k, posiadane = []) {
    const mam = new Set(posiadane.map(x => bezOgonkow(x.tytul).split(/[:.(]/)[0].trim()));
    const nazwisko = k.autor ? k.autor.split(',')[0].trim().split(' ').pop() : '';
    // „Norman Davies” ≠ „P. C. W. Davies”: imię (albo jego inicjał) też musi się zgadzać
    const imie = k.autor ? bezOgonkow(k.autor.split(',')[0].trim().split(' ')[0]) : '';
    const zgodneImie = a => !imie || imie === bezOgonkow(nazwisko) || bezOgonkow(a).includes(imie) || new RegExp(`(^|\\s)${imie[0]}\\.`).test(bezOgonkow(a));
    const zadania = [];
    if (nazwisko) {
      zadania.push(['autor', bnZapytanie({ author: nazwisko }).then(l => l.filter(x => bezOgonkow(x.autor).includes(bezOgonkow(nazwisko)) && zgodneImie(x.autor) && (!x.jezyk || /polski/i.test(x.jezyk))).map(x => ({ tytul: x.tytul, autor: x.autor, strony: x.strony, isbn: x.isbn, okladka: okladkaIsbn(x.isbn), opis: x.opis })))]);
      zadania.push(['autor', olPolskie(`author:"${k.autor.split(',')[0].trim()}"`, 15)]);
    }
    const kat = typeof kategorieKsiazki === 'function' ? kategorieKsiazki(k)[0] : null;
    const kk = kat && typeof kategoria === 'function' ? kategoria(kat) : null;
    if (kk) zadania.push(['kategoria', olPolskie(`subject:"${kk.ol}"`, 25)]);
    const wyniki = await Promise.allSettled(zadania.map(([, z]) => z));
    const lista = [];
    wyniki.forEach((r, i) => {
      if (r.status !== 'fulfilled') return;
      const [rodzaj] = zadania[i];
      lista.push(...r.value.map(x => ({ ...x, polski: true, powod: rodzaj === 'autor' ? `Inna książka: ${k.autor.split(',')[0]}` : `Kategoria: ${kk.nazwa}` })));
    });
    const widziane = new Set();
    return lista.filter(x => x.tytul && !mam.has(bezOgonkow(x.tytul).split(/[:.(]/)[0].trim()) && bezOgonkow(x.tytul) !== bezOgonkow(k.tytul))
      // bez duplikatów, także tych różniących się literówką („Boze igrysko” = „Boże igrzysko”)
      .filter(x => { const kl = bezOgonkow(x.tytul).split(/[:.(]/)[0].trim(); if (!kl || [...widziane].some(w => w === kl || (kl.length > 6 && lev(w, kl) <= 2))) return false; widziane.add(kl); return true; })
      .filter(x => !/'s |\b(the|of|and|legacy)\b/i.test(x.tytul)) // angielskie tytuły odpadają
      .sort((a, b) => (!!b.okladka - !!a.okladka))
      .slice(0, 14);
  }
  /** Propozycje z kategorii (fantasy, kryminał, komedia…), tylko polskie wydania. */
  async function wKategorii(katId, posiadane = [], strona = 0) {
    const kk = kategoria(katId);
    if (!kk) return [];
    const mam = new Set(posiadane.map(x => bezOgonkow(x.tytul).split(/[:.(]/)[0].trim()));
    const l = await olPolskie(`subject:"${kk.ol}"`, 30, strona * 30);
    return l.filter(x => !mam.has(bezOgonkow(x.tytul).split(/[:.(]/)[0].trim())).map(x => ({ ...x, powod: `${kk.emoji} ${kk.nazwa}` }));
  }

  /* ----- cena e-booka w Google Play (gdy Google udostępnia ją dla Polski) ----- */
  async function cenaEbooka(k) {
    const klucz = (ustawienia().googleKlucz || '').trim();
    const zap = k.isbn ? `isbn:${k.isbn}` : `intitle:${k.tytul}${k.autor ? ` inauthor:${k.autor.split(',')[0]}` : ''}`;
    const r = await zTimeoutem(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(zap)}&country=PL&maxResults=5${klucz ? `&key=${encodeURIComponent(klucz)}` : ''}`);
    if (r.status === 429 || r.status === 403) { stan.googleLimit = true; throw new Error('Google Books: limit zapytań. Dodaj klucz w Ustawieniach.'); }
    if (!r.ok) throw new Error(`Google Books: błąd ${r.status}`);
    const j = await r.json();
    const z = (j.items || []).map(x => x.saleInfo || {}).find(s => s.saleability === 'FOR_SALE' && (s.retailPrice || s.listPrice));
    if (!z) return null;
    const c = z.retailPrice || z.listPrice;
    return { cena: c.amount, waluta: c.currencyCode, link: z.buyLink || null };
  }

  /* ----- opis „pro” (2.12): pełny wstęp i fabuła z Wikipedii + fakty z Wikidata ----- */
  const WIKIDATA_POLA = {
    P136: 'gatunek', P577: 'wydanie', P123: 'wydawca', P166: 'nagrody', P1476: 'tytulOryginalny', P655: 'tlumacz',
    P407: 'jezyk', P179: 'cykl', P495: 'kraj', P840: 'miejsceAkcji', P155: 'poprzednia', P156: 'nastepna', P921: 'temat'
  };
  async function znajdzStroneWiki({ tytul, autor }) {
    const q = `${tytul} ${autor ? autor.split(',')[0] : ''}`.trim();
    const r = await zTimeoutem(`https://pl.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=6&format=json&origin=*`);
    if (!r.ok) return null;
    const j = await r.json();
    const tn = bezOgonkow(tytul).split(/[:.(]/)[0].trim();
    const kand = (j.query && j.query.search || []).filter(x => { const t = bezOgonkow(x.title).replace(/\s*\(.*\)$/, ''); return t === tn || t.startsWith(tn) || (tn.startsWith(t) && t.length > 3); });
    // „Bieguni (powieść)” przed „Bieguni (zespół)”
    kand.sort((a, b) => (/powie|ksiazk|zbior|tom|cykl/.test(bezOgonkow(b.title)) - /powie|ksiazk|zbior|tom|cykl/.test(bezOgonkow(a.title))));
    return kand[0] ? kand[0].title : null;
  }
  function sekcjeWiki(tekst) {
    const czesci = tekst.split(/\n(?==+ ?[^=\n]+? ?=+\n)/);
    const wstep = czesci.shift().trim();
    const sekcje = czesci.map(c => { const m = c.match(/^=+ ?(.+?) ?=+\n([\s\S]*)$/); return m ? { tytul: m[1].trim(), tekst: m[2].replace(/\n=+ ?[^=\n]+? ?=+\n/g, '\n').trim() } : null; }).filter(Boolean);
    return { wstep, sekcje };
  }
  const przytnij = (t, max) => { t = t.replace(/\n{3,}/g, '\n\n').trim(); if (t.length <= max) return t; const c = t.slice(0, max); const k = Math.max(c.lastIndexOf('. '), c.lastIndexOf('.\n')); return (k > max * .6 ? c.slice(0, k + 1) : c + '…').trim(); };

  async function faktyWikidata(q) {
    const r = await zTimeoutem(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${q}&props=claims|sitelinks&format=json&origin=*`);
    if (!r.ok) return {};
    const e = Object.values((await r.json()).entities || {})[0];
    if (!e || !e.claims) return {};
    const surowe = {}, ids = new Set();
    for (const [p, klucz] of Object.entries(WIKIDATA_POLA)) {
      const w = (e.claims[p] || []).map(c => c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value).filter(Boolean).slice(0, 5);
      if (!w.length) continue;
      surowe[klucz] = w;
      w.forEach(v => { if (v && v.id) ids.add(v.id); });
    }
    let etykiety = {};
    if (ids.size) {
      const l = await zTimeoutem(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${[...ids].slice(0, 50).join('|')}&props=labels&languages=pl|en&format=json&origin=*`);
      if (l.ok) etykiety = Object.fromEntries(Object.entries((await l.json()).entities || {}).map(([id, v]) => [id, (v.labels && (v.labels.pl || v.labels.en) || {}).value || '']));
    }
    const fakty = {};
    const PL = { novel: 'powieść', 'social fiction': 'powieść obyczajowa', 'fragmentary novel': 'powieść fragmentaryczna', 'science fiction': 'fantastyka naukowa', 'crime novel': 'kryminał', 'crime fiction': 'kryminał', 'detective fiction': 'kryminał', 'short story': 'opowiadanie', 'short story collection': 'zbiór opowiadań', essay: 'esej', 'historical novel': 'powieść historyczna', 'young adult fiction': 'literatura młodzieżowa', "children's literature": 'literatura dziecięca', 'horror fiction': 'horror', thriller: 'thriller', 'romance novel': 'romans', biography: 'biografia', autobiography: 'autobiografia', memoir: 'wspomnienia', 'non-fiction': 'literatura faktu', reportage: 'reportaż', poetry: 'poezja', drama: 'dramat', 'dystopian novel': 'powieść dystopijna', satire: 'satyra', 'magic realism': 'realizm magiczny', 'philosophical novel': 'powieść filozoficzna', 'adventure novel': 'powieść przygodowa', 'psychological novel': 'powieść psychologiczna', 'speculative fiction': 'fantastyka', 'high fantasy': 'fantasy', 'dark fantasy': 'dark fantasy', 'epic fantasy': 'fantasy' };
    for (const id of Object.keys(etykiety)) { const t = etykiety[id].toLowerCase(); if (PL[t]) etykiety[id] = PL[t]; }
    for (const [k, w] of Object.entries(surowe)) {
      const v = w.map(x => x.id ? etykiety[x.id] : x.time ? String(x.time).slice(1, 5) : x.text ? x.text : '').filter(Boolean);
      if (v.length) fakty[k] = [...new Set(v)];
    }
    // oryginalny tytuł pokazujemy tylko, gdy książka nie jest polska
    if (fakty.tytulOryginalny && (fakty.jezyk || []).some(j => /polski/i.test(j))) delete fakty.tytulOryginalny;
    if (fakty.wydanie) fakty.wydanie = [fakty.wydanie.sort()[0]];
    return fakty;
  }

  async function opisPro(k) {
    const w = { opis: '', fabula: '', fakty: {}, zrodla: [], zrodlo: '' };
    try {
      const strona = await znajdzStroneWiki(k);
      if (strona) {
        const r = await zTimeoutem(`https://pl.wikipedia.org/w/api.php?action=query&prop=extracts|pageprops&explaintext=1&exsectionformat=wiki&redirects=1&titles=${encodeURIComponent(strona)}&format=json&origin=*`);
        if (r.ok) {
          const p = Object.values((await r.json()).query.pages || {})[0] || {};
          const { wstep, sekcje } = sekcjeWiki(p.extract || '');
          const naz = k.autor ? bezOgonkow(k.autor.split(',')[0]).split(' ').pop() : '';
          const gatunkowe = /powieść|książk|zbiór|opowiada|reportaż|tom |cykl|esej|poradnik|wydan|autorstwa|literat|dramat|poemat|fantasy|kryminał/i.test(wstep);
          // gdy znamy autora, artykuł musi o nim wspominać — inaczej to inna książka o tym samym tytule
          const oKsiazce = naz && naz.length > 2 ? bezOgonkow(wstep).includes(naz) : gatunkowe;
          if (oKsiazce && wstep.length > 60) {
            w.opis = przytnij(wstep, 1800);
            const tlo = sekcje.find(s => /^(tło|geneza|okoliczności powstania|historia powstania)/i.test(s.tytul));
            const fab = sekcje.find(s => /^(fabuła|treść|opis fabuły|zarys fabuły|streszczenie|akcja|fabuła i bohaterowie|zawartość|tematyka)/i.test(s.tytul));
            if (tlo && tlo.tekst.length > 80) w.opis += `\n\n${przytnij(tlo.tekst, 900)}`;
            if (fab && fab.tekst.length > 80) w.fabula = przytnij(fab.tekst, 2500);
            w.zrodlo = 'Wikipedia';
            w.zrodla.push({ nazwa: 'Wikipedia', link: `https://pl.wikipedia.org/wiki/${encodeURIComponent(strona.replace(/ /g, '_'))}` });
            const q = p.pageprops && p.pageprops.wikibase_item;
            if (q) {
              try { w.fakty = await faktyWikidata(q); } catch { /* bez faktów */ }
              w.zrodla.push({ nazwa: 'Wikidata', link: `https://www.wikidata.org/wiki/${q}` });
            }
          }
        }
      }
    } catch { /* Wikipedia nie odpowiada */ }
    if (!w.opis) {
      for (const f of [opisGoogle, opisOpenLibrary]) {
        try { const o = await f(k); if (o && o.tekst) { w.opis = przytnij(o.tekst, 2500); w.zrodlo = o.zrodlo; if (o.tematy && !w.fakty.gatunek) w.fakty.temat = o.tematy.slice(0, 4); break; } } catch { /* następne */ }
      }
    }
    const fraza = encodeURIComponent(`${k.tytul} ${k.autor ? k.autor.split(',')[0] : ''}`.trim());
    w.zrodla.push({ nazwa: 'Lubimyczytać', link: `https://lubimyczytac.pl/szukaj/ksiazki?phrase=${fraza}` });
    w.zrodla.push({ nazwa: 'Open Library', link: k.isbn ? `https://openlibrary.org/isbn/${k.isbn}` : `https://openlibrary.org/search?q=${fraza}` });
    return w.opis || Object.keys(w.fakty).length ? w : null;
  }

  /* ----- ceny z Ceneo przez pośrednika (2.12) ----- */
  async function ceny(k) {
    const fraza = `${k.tytul.split(/[:(]/)[0].trim()} ${k.autor ? k.autor.split(',')[0].split(' ').pop() : ''}`.trim();
    const adresy = adresyBN({ ceny: fraza });
    if (!adresy.length) throw new Error('Brak pośrednika.');
    let j = null, blad = null;
    for (const url of adresy) {
      try {
        const r = await zTimeoutem(url.replace(/[?&]limit=\d+/, ''), 20000);
        const x = await r.json();
        if (x && Array.isArray(x.wyniki)) { j = x; break; }
        if (x && x.blad && /Podaj isbnIssn/.test(x.blad)) blad = new Error('Twój worker ma starą wersję. Wklej nowy kod z pliku proxy/cloudflare-worker.js (instrukcja w README).');
      } catch (e) { blad = blad || e; }
    }
    if (!j) throw blad || new Error('Nie udało się sprawdzić cen.');
    const tyt = bezOgonkow(k.tytul).split(/[:.(]/)[0].trim();
    const pasujace = j.wyniki.map(w => {
      const n = bezOgonkow(w.nazwa);
      const format = /e-?book|e-beletr|e-liter|epub|mobi/.test(n + ' ' + bezOgonkow(w.kategoria)) ? 'ebook' : /audiobook|mp3|cd/.test(n) ? 'audio' : 'papier';
      return { ...w, format, o: podobienstwo(k.tytul.split(/[:(]/)[0], { tytul: w.nazwa, autor: '' }) };
    }).filter(w => w.o >= .8 && bezOgonkow(w.nazwa).includes(tyt)
      && !/2w1|pakiet|komplet|zestaw|w j\. |ukrain|english|edition|naklejk|plakat|kubek|gra |puzzle/.test(bezOgonkow(w.nazwa))
      && !/\b(the|of|and|volume|vol|book)\b/.test(bezOgonkow(w.nazwa).replace(tyt, ''))); // bez wydań obcojęzycznych
    const naj = f => pasujace.filter(w => w.format === f).sort((a, b) => a.cena - b.cena)[0] || null;
    return { papier: naj('papier'), ebook: naj('ebook'), audio: naj('audio'), wszystkie: pasujace.sort((a, b) => a.cena - b.cena).slice(0, 8), data: new Date().toISOString().slice(0, 10) };
  }

  /* ----- opinie czytelników (2.21): Lubimyczytać przez pośrednika, a zapasowo średnia z Open Library ----- */
  async function opinie(k) {
    const tytul = k.tytul.split(/[:(]/)[0].trim(), autor = k.autor ? k.autor.split(',')[0].trim() : '';
    const wlasny = (ustawienia().posrednik || (typeof POSREDNIK_BN !== 'undefined' ? POSREDNIK_BN : '')).trim().replace(/\/+$/, '');
    if (wlasny && !wlasny.includes('{url}')) {
      try {
        const r = await zTimeoutem(`${wlasny}?${new URLSearchParams({ opinie: tytul, autor })}`, 15000);
        const x = await r.json();
        if (x && x.zrodlo === 'Lubimyczytać' && x.ocena) return { ...x, data: new Date().toISOString().slice(0, 10) };
      } catch { /* stary worker albo brak sieci: próbujemy dalej */ }
    }
    try {
      const q = new URLSearchParams({ title: tytul, fields: 'title,author_name,ratings_average,ratings_count,key', limit: '5' });
      if (autor) q.set('author', autor.split(' ').pop());
      const j = await (await zTimeoutem(`https://openlibrary.org/search.json?${q}`, 12000)).json();
      const w = (j.docs || []).filter(d => d.ratings_count > 0).sort((a, b) => b.ratings_count - a.ratings_count)[0];
      if (w) return { zrodlo: 'Open Library', ocena: Math.round(w.ratings_average * 10) / 10, skala: 5, ocen: w.ratings_count, url: `https://openlibrary.org${w.key}`, opinie: [], data: new Date().toISOString().slice(0, 10) };
    } catch { /* brak sieci */ }
    return null;
  }

  /** Sprawdza, które źródła działają (do Ustawień). */
  async function test() {
    const probny = '9788308039861';
    const [g, o, b] = await Promise.allSettled([google(probny), openLibrary(probny), bibliotekaNarodowa(probny)]);
    const opis = r => r.status === 'fulfilled' ? (r.value.length ? 'działa' : 'działa, brak wyniku') : r.reason.message;
    return {
      google: opis(g), openLibrary: opis(o),
      bn: adresyBN({ isbnIssn: probny }).length ? opis(b) : 'brak pośrednika'
    };
  }

  return { szukaj, szukajMadrze, podpowiedzi, opis, opisPro, ceny, opinie, podobne, wKategorii, cenaEbooka, podobienstwo, bezOgonkow, czyIsbn, test, stan, isbn10na13 };
})();

/* ---------- skaner kodów kreskowych ----------
   Własny dekoder (js/ean.js) działa wszędzie, także na iPhonie. Jeśli przeglądarka ma wbudowany
   BarcodeDetector (Chrome na Androidzie), używamy obu naraz — wygrywa ten, który pierwszy odczyta kod. */
const Skaner = {
  _natywny: undefined,

  async natywny() {
    if (this._natywny !== undefined) return this._natywny;
    this._natywny = null;
    try {
      if ('BarcodeDetector' in window && (await BarcodeDetector.getSupportedFormats()).includes('ean_13')) {
        this._natywny = new BarcodeDetector({ formats: ['ean_13'] });
      }
    } catch { /* brak wsparcia */ }
    return this._natywny;
  },

  maAparat() {
    return !!(window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  },

  // przycisk skanera jest zawsze: bez aparatu na żywo zostaje odczyt ze zdjęcia
  async dostepny() { return true; },

  async start(video, poOdczycie, { naStatus } = {}) {
    const strumien = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    });
    const sciezka = strumien.getVideoTracks()[0];
    try { await sciezka.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }); } catch { /* nieobsługiwane */ }
    let aktywny = true;
    const stop = () => {
      if (!aktywny) return;
      aktywny = false;
      strumien.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    };
    video.srcObject = strumien;
    await video.play();

    const natywny = await this.natywny();
    const plotno = document.createElement('canvas');
    const ctx = plotno.getContext('2d', { willReadFrequently: true });
    const glosy = new Map();
    const start = Date.now();
    let podpowiedz = false;
    const znaleziony = kod => { stop(); poOdczycie(kod); };

    const petla = async () => {
      if (!aktywny) return;
      try {
        if (natywny) {
          const kody = await natywny.detect(video);
          const kod = kody.map(k => k.rawValue).find(v => /^97[89]\d{10}$/.test(v));
          if (kod) return znaleziony(kod);
        }
        const w = video.videoWidth, h = video.videoHeight;
        if (w && h) {
          plotno.width = w; plotno.height = h;
          ctx.drawImage(video, 0, 0, w, h);
          const szary = EAN.naSzary(ctx.getImageData(0, 0, w, h).data, w, h);
          for (const [k, v] of EAN.zSzarego(szary, w, h, { pas: 0.7, krokY: 5, krokX: 7 })) glosy.set(k, (glosy.get(k) || 0) + v);
          // dwa niezależne odczyty tego samego numeru = pewny wynik
          const kod = EAN.najlepszyIsbn(glosy, 2);
          if (kod) return znaleziony(kod);
        }
      } catch { /* klatka jeszcze niegotowa */ }
      if (!podpowiedz && Date.now() - start > 8000 && naStatus) {
        podpowiedz = true;
        naStatus('Nadal szukam… Przybliż telefon, żeby kod zajął większość ramki, i trzymaj go poziomo. Możesz też zrobić zdjęcie kodu.');
      }
      if (aktywny) setTimeout(petla, 120);
    };
    petla();

    // latarka, jeśli aparat ją ma (Android)
    let latarka = null;
    try {
      if (sciezka.getCapabilities && sciezka.getCapabilities().torch) {
        let wl = false;
        latarka = async () => { wl = !wl; await sciezka.applyConstraints({ advanced: [{ torch: wl }] }); return wl; };
      }
    } catch { /* brak */ }
    return { stop, latarka };
  },

  /** Odczyt ISBN ze zdjęcia (plik z aparatu albo galerii). Zwraca numer albo null. */
  async zPliku(plik) {
    const url = URL.createObjectURL(plik);
    try {
      const img = await wczytajObraz(url);
      const natywny = await this.natywny();
      if (natywny) {
        try {
          const kod = (await natywny.detect(img)).map(k => k.rawValue).find(v => /^97[89]\d{10}$/.test(v));
          if (kod) return kod;
        } catch { /* spróbuj własnym */ }
      }
      // kilka rozmiarów: duży dla małych kodów, mniejszy wygładza szum i rozmycie
      for (const maks of [2000, 1200, 800]) {
        const s = Math.min(1, maks / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * s)), h = Math.max(1, Math.round(img.naturalHeight * s));
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, w, h);
        const kod = EAN.najlepszyIsbn(EAN.zSzarego(EAN.naSzary(ctx.getImageData(0, 0, w, h).data, w, h), w, h, { krokY: 3, krokX: 3 }));
        if (kod) return kod;
      }
      return null;
    } finally { URL.revokeObjectURL(url); }
  }
};

/* ---------- okładki: zdjęcie z aparatu lub obraz z internetu → mały JPEG w bazie ---------- */
function wczytajObraz(src, cors = false) {
  return new Promise((ok, blad) => {
    const img = new Image();
    if (cors) img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = () => blad(new Error('Nie udało się wczytać obrazu.'));
    img.src = src;
  });
}

function obrazNaDataURL(img, maxW = 360, maxH = 540) {
  const s = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * s));
  c.height = Math.max(1, Math.round(img.naturalHeight * s));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.82);
}

async function plikNaOkladke(plik) {
  const url = URL.createObjectURL(plik);
  try { return obrazNaDataURL(await wczytajObraz(url)); }
  finally { URL.revokeObjectURL(url); }
}

/** Próbuje zapisać okładkę z internetu w bazie (działa offline). Gdy serwer nie pozwala, zostaje adres. */
async function urlNaOkladke(url) {
  try {
    const img = await wczytajObraz(url, true);
    if (img.naturalWidth < 20) return url;
    return obrazNaDataURL(img);
  } catch {
    return url;
  }
}

/* ---------- pliki ---------- */
function wybierzPlik(accept) {
  return new Promise(ok => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.hidden = true;
    input.addEventListener('change', () => { ok(input.files[0] || null); input.remove(); }, { once: true });
    document.body.append(input);
    input.click();
  });
}

async function zapiszPlik(nazwa, tresc, typ) {
  const plik = new File([tresc], nazwa, { type: typ });
  const mobilny = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (mobilny && navigator.canShare && navigator.canShare({ files: [plik] })) {
    try {
      await navigator.share({ files: [plik], title: nazwa });
      return true;
    } catch (e) {
      if (e.name === 'AbortError') return false;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(plik);
  a.download = nazwa;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return true;
}

/* ---------- CSV i Goodreads ---------- */
function parsujCSV(tekst) {
  const wiersze = [];
  let w = [], pole = '', cudzyslow = false;
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst[i];
    if (cudzyslow) {
      if (c === '"') {
        if (tekst[i + 1] === '"') { pole += '"'; i++; } else cudzyslow = false;
      } else pole += c;
    } else if (c === '"') cudzyslow = true;
    else if (c === ',') { w.push(pole); pole = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && tekst[i + 1] === '\n') i++;
      w.push(pole); wiersze.push(w); w = []; pole = '';
    } else pole += c;
  }
  if (pole !== '' || w.length) { w.push(pole); wiersze.push(w); }
  return wiersze.filter(r => r.some(x => x.trim() !== ''));
}

const csvPole = v => {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function czytajGoodreads(tekst) {
  const [naglowek, ...wiersze] = parsujCSV(tekst.replace(/^﻿/, ''));
  if (!naglowek) throw new Error('Plik jest pusty.');
  const idx = nazwa => naglowek.findIndex(h => h.trim().toLowerCase() === nazwa.toLowerCase());
  const k = {
    tytul: idx('Title'), autor: idx('Author'), strony: idx('Number of Pages'), isbn13: idx('ISBN13'), isbn: idx('ISBN'),
    ocena: idx('My Rating'), przeczytana: idx('Date Read'), dodana: idx('Date Added'), polka: idx('Exclusive Shelf'),
    polki: idx('Bookshelves'), recenzja: idx('My Review')
  };
  if (k.tytul < 0) throw new Error('To nie wygląda na eksport z Goodreads: brak kolumny „Title”.');
  const pole = (r, i) => (i >= 0 ? (r[i] || '').trim() : '');
  const isbn = s => s.replace(/^=/, '').replace(/[^\dXx]/g, '');
  const data = s => {
    const m = s.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    return m ? `${m[1]}-${pad(m[2])}-${pad(m[3])}` : null;
  };
  const systemowe = ['read', 'to-read', 'currently-reading', 'did-not-finish'];
  return wiersze.map(r => {
    const polka = pole(r, k.polka);
    const status = polka === 'read' ? 'przeczytana'
      : polka === 'currently-reading' ? 'czytam'
      : polka === 'did-not-finish' ? 'porzucona' : 'doPrzeczytania';
    const strony = +pole(r, k.strony) || Z.ustawienia.srednia;
    const dodano = data(pole(r, k.dodana)) || dzisISO();
    return {
      tytul: pole(r, k.tytul),
      autor: pole(r, k.autor),
      strony,
      isbn: isbn(pole(r, k.isbn13)) || isbn(pole(r, k.isbn)),
      ocena: +pole(r, k.ocena) || 0,
      status,
      strona: status === 'przeczytana' ? strony : 0,
      koniec: status === 'przeczytana' ? (data(pole(r, k.przeczytana)) || dodano) : null,
      start: status === 'czytam' ? dzisISO() : null,
      dodano,
      tagi: pole(r, k.polki).split(',').map(t => t.trim()).filter(t => t && !systemowe.includes(t)),
      recenzja: pole(r, k.recenzja).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    };
  }).filter(x => x.tytul);
}

function csvGoodreads(ksiazki) {
  const nag = ['Title', 'Author', 'ISBN13', 'My Rating', 'Number of Pages', 'Date Read', 'Date Added', 'Bookshelves', 'Exclusive Shelf', 'My Review'];
  const polka = { przeczytana: 'read', czytam: 'currently-reading', doPrzeczytania: 'to-read', porzucona: 'did-not-finish', pozniej: 'to-read', zyczenia: 'to-read' };
  const d = s => (s ? s.replace(/-/g, '/') : '');
  const wiersze = ksiazki.map(k => [
    k.tytul, k.autor, k.isbn, k.ocena || '', k.strony, d(k.koniec), d(k.dodano), k.tagi.join(', '), polka[k.status], k.recenzja
  ].map(csvPole).join(','));
  return [nag.join(','), ...wiersze].join('\r\n');
}
