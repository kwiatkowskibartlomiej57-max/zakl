'use strict';
/* Zakładka — model danych, operacje na książkach i obliczenia */

const WERSJA = '2.20.3';
const POSREDNIK_BN = 'https://spring-mud-cef8.kwiatkowskibartlomiej57.workers.dev';
const DOMYSLNE = { imie: '', cel: 200, start: '2026-09-01', koniec: '2027-08-31', srednia: 300, dziennyCel: 0, motyw: 'auto', tydzienStrony: 0, tydzienKsiazki: 0, miesiacStrony: 0, miesiacKsiazki: 0, celeMiesiecy: {}, googleKlucz: '', posrednik: '', planyTygodni: {}, przypomnienie: { wlaczone: false, godzina: '20:00', dni: [0, 1, 2, 3, 4, 5, 6] }, seria: { prog: 1, dniWolne: [], zamrozenia: 0, cel: 0 }, czasDni: [30, 30, 30, 30, 30, 60, 60], stalePlany: [], trybRozkladu: 'kolejno', czasTygodni: {}, celeTygodni: {}, losowania: {}, losIle: 3, budzet: 0, odkrywaj: { tak: [], nie: [] }, cenyAuto: true, listyZyczen: [], gra: { wydane: 0, kupione: [], zalozone: [], zadania: {}, zamrozeniaKupione: {}, sowka: true } };
const STATUSY = ['czytam', 'doPrzeczytania', 'pozniej', 'zyczenia', 'przeczytana', 'porzucona'];
const FORMATY = { papier: 'Papier', ebook: 'E-book', audio: 'Audiobook' };

const FORMY_STRON = ['strona', 'strony', 'stron'];
const FORMY_STRON_D = ['strony', 'stron', 'stron']; // dopełniacz: „z 150 stron”, „brakuje 1 strony”
const FORMY_DNI = ['dzień', 'dni', 'dni'];
const FORMY_KSIAZEK = ['książka', 'książki', 'książek'];
const FORMY_KSIAZEK_D = ['książki', 'książek', 'książek'];
const FORMY_KSIAZEK_B = ['książkę', 'książki', 'książek'];

const Z = { ksiazki: [], ustawienia: { ...DOMYSLNE } };

/* ---------- daty (wszystko jako tekst RRRR-MM-DD) ---------- */
const pad = n => String(n).padStart(2, '0');
const isoZDaty = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dzisISO = () => isoZDaty(new Date());
const doDaty = iso => new Date(iso + 'T00:00:00Z');
const dniMiedzy = (a, b) => Math.round((doDaty(b) - doDaty(a)) / 864e5);
function dodajDni(iso, n) {
  const d = doDaty(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const dzienTygodnia = iso => (doDaty(iso).getUTCDay() + 6) % 7; // 0 = poniedziałek
const poprawnyMiesiac = s => typeof s === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
const poprawnaData = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(doDaty(s));

/* ---------- drobiazgi ---------- */
const noweId = () => (window.crypto && crypto.randomUUID)
  ? crypto.randomUUID()
  : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

function odmiana(n, [jeden, kilka, wiele]) {
  if (!Number.isInteger(n)) return kilka;
  const a = Math.abs(n);
  if (a === 1) return jeden;
  const j = a % 10, d = a % 100;
  return j >= 2 && j <= 4 && !(d >= 12 && d <= 14) ? kilka : wiele;
}
const ile = (n, formy) => `${n} ${odmiana(n, formy)}`;
const ulamek = (n, miejsca = 1) => n.toFixed(miejsca).replace('.', ',');
const liczba = n => Math.round(n).toLocaleString('pl-PL');
const znajdz = id => Z.ksiazki.find(k => k.id === id);
const ogranicz = (v, min, max) => Math.max(min, Math.min(max, v));

/* ---------- normalizacja (stare kopie, import, błędne dane) ---------- */
function normalizujKsiazke(k = {}) {
  const strony = Math.max(1, Math.round(+k.strony) || 300);
  const status = STATUSY.includes(k.status) ? k.status : 'doPrzeczytania';
  const n = {
    id: k.id ? String(k.id) : noweId(),
    tytul: String(k.tytul || '').trim() || 'Bez tytułu',
    autor: String(k.autor || '').trim(),
    strony,
    format: FORMATY[k.format] ? k.format : 'papier',
    tagi: Array.isArray(k.tagi) ? [...new Set(k.tagi.map(t => String(t).trim().toLowerCase()).filter(Boolean))] : [],
    okladka: typeof k.okladka === 'string' && k.okladka ? k.okladka : null,
    isbn: String(k.isbn || '').replace(/[^\dXx]/g, ''),
    status,
    bazowa: !!k.bazowa && status === 'czytam',
    celData: poprawnaData(k.celData) ? k.celData : (poprawnaData(k.cel) ? k.cel : null),
    planOd: k.planOd && poprawnaData(k.planOd.data) ? { data: k.planOd.data, strona: Math.max(0, +k.planOd.strona || 0) } : null,
    strona: ogranicz(Math.round(+k.strona) || 0, 0, strony),
    start: poprawnaData(k.start) ? k.start : null,
    koniec: poprawnaData(k.koniec) ? k.koniec : null,
    ocena: ogranicz(Math.round(+k.ocena) || 0, 0, 5),
    recenzja: String(k.recenzja || ''),
    log: (Array.isArray(k.log) ? k.log : [])
      .filter(w => w && poprawnaData(w.data) && +w.strony > 0)
      .map(w => ({ data: w.data, strony: Math.round(+w.strony) })),
    sesje: (Array.isArray(k.sesje) ? k.sesje : [])
      .filter(s => s && poprawnaData(s.data))
      .map(s => ({ data: s.data, minuty: Math.max(0, Math.round(+s.minuty) || 0), strony: Math.max(0, Math.round(+s.strony) || 0) })),
    cytaty: (Array.isArray(k.cytaty) ? k.cytaty : [])
      .filter(c => c && String(c.tekst || '').trim())
      .map(c => ({ id: c.id || noweId(), tekst: String(c.tekst).trim(), strona: +c.strona > 0 ? Math.round(+c.strona) : null, data: poprawnaData(c.data) ? c.data : dzisISO(), notatka: !!c.notatka })),
    czytania: (Array.isArray(k.czytania) ? k.czytania : []).filter(c => c && poprawnaData(c.koniec)),
    kolejnosc: Number.isFinite(+k.kolejnosc) ? +k.kolejnosc : 0,
    dodano: poprawnaData(k.dodano) ? k.dodano : dzisISO(),
    porzucono: poprawnaData(k.porzucono) ? k.porzucono : null,
    bazowaWynik: ['wTerminie', 'po'].includes(k.bazowaWynik) ? k.bazowaWynik : null,
    planMiesiac: poprawnyMiesiac(k.planMiesiac) ? k.planMiesiac : null,
    seria: String(k.seria || '').trim().slice(0, 80),
    tom: +k.tom > 0 ? Math.round(+k.tom * 10) / 10 : null,
    odlozono: poprawnaData(k.odlozono) ? k.odlozono : null,
    pula: !!k.pula,
    kategorie: (Array.isArray(k.kategorie) ? k.kategorie : []).map(String).filter(x => KATEGORIE.some(c => c.id === x)).slice(0, 4),
    listy: (Array.isArray(k.listy) ? k.listy : []).map(String).slice(0, 10),
    rodzaj: k.rodzaj === 'techniczna' ? 'techniczna' : 'zwykla',
    celRozdzialow: ogranicz(Math.round(+k.celRozdzialow) || 0, 0, 30),
    rozdzialy: (Array.isArray(k.rozdzialy) ? k.rozdzialy : []).filter(r => r && String(r.tytul || '').trim()).slice(0, 200)
      .map(r => ({ id: String(r.id || noweId()), tytul: String(r.tytul).trim().slice(0, 140), od: +r.od >= 1 ? Math.round(+r.od) : null, zrobiony: !!r.zrobiony, data: poprawnaData(r.data) ? r.data : null })),
    cena: +k.cena > 0 ? Math.round(+k.cena * 100) / 100 : null,
    link: /^https?:\/\//.test(String(k.link || '')) ? String(k.link).slice(0, 500) : '',
    priorytet: ogranicz(Math.round(+k.priorytet) || 0, 0, 3),
    pozyczona: k.pozyczona && String(k.pozyczona.kto || '').trim()
      ? {
        kto: String(k.pozyczona.kto).trim().slice(0, 60), data: poprawnaData(k.pozyczona.data) ? k.pozyczona.data : dzisISO(),
        kierunek: k.pozyczona.kierunek === 'od' ? 'od' : 'komus', typ: k.pozyczona.typ === 'biblioteka' ? 'biblioteka' : 'osoba',
        termin: poprawnaData(k.pozyczona.termin) ? k.pozyczona.termin : null, prolongaty: ogranicz(Math.round(+k.pozyczona.prolongaty) || 0, 0, 20)
      }
      : null,
    historiaPozyczek: (Array.isArray(k.historiaPozyczek) ? k.historiaPozyczek : []).filter(h => h && h.kto && poprawnaData(h.od)).slice(-30)
      .map(h => ({ kto: String(h.kto).slice(0, 60), od: h.od, do: poprawnaData(h.do) ? h.do : null, kierunek: h.kierunek === 'od' ? 'od' : 'komus', typ: h.typ === 'biblioteka' ? 'biblioteka' : 'osoba', poTerminie: !!h.poTerminie })),
    opis: String(k.opis || '').slice(0, 4000),
    opisZrodlo: String(k.opisZrodlo || '').slice(0, 40),
    fabula: String(k.fabula || '').slice(0, 4000),
    fakty: k.fakty && typeof k.fakty === 'object' ? Object.fromEntries(Object.entries(k.fakty).filter(([, v]) => Array.isArray(v)).map(([n, v]) => [String(n).slice(0, 30), v.map(x => String(x).slice(0, 80)).slice(0, 6)])) : {},
    opisLinki: (Array.isArray(k.opisLinki) ? k.opisLinki : []).filter(l => l && /^https:\/\//.test(l.link)).slice(0, 6).map(l => ({ nazwa: String(l.nazwa).slice(0, 30), link: String(l.link).slice(0, 300) })),
    cenyCeneo: k.cenyCeneo && poprawnaData(k.cenyCeneo.data) ? Object.fromEntries(['papier', 'ebook', 'audio'].map(f => [f, k.cenyCeneo[f] && +k.cenyCeneo[f].cena > 0 ? { cena: +k.cenyCeneo[f].cena, link: /^https:\/\//.test(k.cenyCeneo[f].link) ? k.cenyCeneo[f].link : '', nazwa: String(k.cenyCeneo[f].nazwa || '').slice(0, 120) } : null]).concat([['data', k.cenyCeneo.data]])) : null,
    cenaDocelowa: +k.cenaDocelowa > 0 ? Math.round(+k.cenaDocelowa * 100) / 100 : null,
    ceny: (Array.isArray(k.ceny) ? k.ceny : []).filter(c => c && +c.cena > 0 && poprawnaData(c.data)).slice(-20).map(c => ({ data: c.data, cena: Math.round(+c.cena * 100) / 100, sklep: String(c.sklep || '').slice(0, 40) })),
    okazja: String(k.okazja || '').slice(0, 40),
    cenaZakupu: +k.cenaZakupu > 0 ? Math.round(+k.cenaZakupu * 100) / 100 : null,
    dataZakupu: poprawnaData(k.dataZakupu) ? k.dataZakupu : null
  };
  if (n.status === 'przeczytana') n.strona = n.strony;
  if (n.bazowa && !n.celData) n.celData = dodajDni(dzisISO(), 61);
  if (n.bazowa && !n.planOd) n.planOd = { data: n.start || dzisISO(), strona: 0 };
  return n;
}

function normalizujUstawienia(u = {}) {
  const w = { ...DOMYSLNE };
  if (!u || typeof u !== 'object') return w;
  if (typeof u.imie === 'string') w.imie = u.imie.trim().slice(0, 40);
  if (+u.cel >= 1) w.cel = Math.round(+u.cel);
  if (poprawnaData(u.start)) w.start = u.start;
  if (poprawnaData(u.koniec)) w.koniec = u.koniec;
  if (w.koniec <= w.start) w.koniec = dodajDni(w.start, 364);
  if (+u.srednia >= 20) w.srednia = Math.round(+u.srednia);
  if (+u.dziennyCel >= 0) w.dziennyCel = Math.round(+u.dziennyCel);
  if (['auto', 'jasny', 'ciemny'].includes(u.motyw)) w.motyw = u.motyw;
  for (const n of ['tydzienStrony', 'tydzienKsiazki', 'miesiacStrony', 'miesiacKsiazki']) if (+u[n] >= 0) w[n] = Math.round(+u[n]);
  if (typeof u.googleKlucz === 'string') w.googleKlucz = u.googleKlucz.trim().slice(0, 100);
  if (typeof u.posrednik === 'string' && (/^https:\/\//.test(u.posrednik.trim()) || !u.posrednik.trim())) w.posrednik = u.posrednik.trim().slice(0, 300);
  w.planyTygodni = {};
  if (u.planyTygodni && typeof u.planyTygodni === 'object') {
    const granica = dodajDni(dzisISO(), -7 * 52);
    for (const [pn, lista] of Object.entries(u.planyTygodni)) {
      if (!poprawnaData(pn) || pn < granica || !Array.isArray(lista)) continue;
      const x = lista.filter(e => e && e.id).map(e => ({ id: String(e.id), dzien: poprawnaData(e.dzien) ? e.dzien : null, strony: Math.max(0, Math.round(+e.strony) || 0), minuty: Math.max(0, Math.round(+e.minuty) || 0), ...(e.ukryty ? { ukryty: String(e.ukryty) } : {}) }));
      if (x.length) w.planyTygodni[pn] = x;
    }
  }
  const se = u.seria || {};
  w.seria = {
    prog: ogranicz(Math.round(+se.prog) || 1, 1, 500),
    dniWolne: Array.isArray(se.dniWolne) ? [...new Set(se.dniWolne.map(Number).filter(d => d >= 0 && d <= 6))].sort() : [],
    zamrozenia: ogranicz(Math.round(+se.zamrozenia) || 0, 0, 10),
    cel: ogranicz(Math.round(+se.cel) || 0, 0, 3650)
  };
  if (Array.isArray(u.czasDni) && u.czasDni.length === 7) w.czasDni = u.czasDni.map(v => ogranicz(Math.round(+v) || 0, 0, 600));
  w.stalePlany = (Array.isArray(u.stalePlany) ? u.stalePlany : []).filter(r => r && r.id)
    .map(r => ({ rid: String(r.rid || noweId()), id: String(r.id), dni: [...new Set((r.dni || []).map(Number).filter(d => d >= 0 && d <= 6))].sort(), strony: Math.max(0, Math.round(+r.strony) || 0), minuty: Math.max(0, Math.round(+r.minuty) || 0) }))
    .filter(r => r.dni.length);
  if (['kolejno', 'rownolegle'].includes(u.trybRozkladu)) w.trybRozkladu = u.trybRozkladu;
  w.planujWCzasie = !!u.planujWCzasie;
  w.losIle = ogranicz(Math.round(+u.losIle) || 3, 1, 8);
  w.budzet = +u.budzet > 0 ? Math.round(+u.budzet) : 0;
  w.cenyAuto = u.cenyAuto !== false;
  const g = u.gra || {};
  w.gra = {
    wydane: Math.max(0, Math.round(+g.wydane) || 0),
    kupione: (Array.isArray(g.kupione) ? g.kupione : []).map(String).slice(0, 100),
    zalozone: (Array.isArray(g.zalozone) ? g.zalozone : []).map(String).slice(0, 10),
    zadania: Object.fromEntries(Object.entries(g.zadania || {}).filter(([d, v]) => poprawnaData(d) && Array.isArray(v) && d >= dodajDni(dzisISO(), -60)).map(([d, v]) => [d, v.map(String).slice(0, 5)])),
    zamrozeniaKupione: Object.fromEntries(Object.entries(g.zamrozeniaKupione || {}).filter(([m, v]) => poprawnyMiesiac(m) && +v > 0).map(([m, v]) => [m, Math.min(10, Math.round(+v))])),
    sowka: g.sowka !== false,
    historiaWidziane: ogranicz(Math.round(+g.historiaWidziane) || 0, 0, 50),
    glos: g.glos !== false, muzyka: g.muzyka !== false, zarty: g.zarty !== false, glosSowki: g.glosSowki !== false, zakladka18: g.zakladka18 !== false, dzwieki: g.dzwieki !== false, czestosc: ['rzadko', 'normalnie', 'czesto'].includes(g.czestosc) ? g.czestosc : 'normalnie'
  };
  w.listyZyczen = (Array.isArray(u.listyZyczen) ? u.listyZyczen : []).filter(l => l && String(l.nazwa || '').trim()).slice(0, 20)
    .map(l => ({ id: String(l.id || noweId()), nazwa: String(l.nazwa).trim().slice(0, 40), emoji: String(l.emoji || '📚').slice(0, 4) }));
  const od = u.odkrywaj || {};
  w.odkrywaj = { tak: (Array.isArray(od.tak) ? od.tak : []).map(String).slice(-500), nie: (Array.isArray(od.nie) ? od.nie : []).map(String).slice(-1000) };
  w.losowania = {};
  for (const [pn, v] of Object.entries(u.losowania || {})) {
    if (!poprawnaData(pn) || !v || !Array.isArray(v.ids)) continue;
    w.losowania[pn] = { ids: v.ids.map(String).slice(0, 12), data: poprawnaData(v.data) ? v.data : pn, zatwierdzone: !!v.zatwierdzone };
  }
  w.tempoReczne = +u.tempoReczne >= 5 ? ogranicz(Math.round(+u.tempoReczne), 5, 300) : 0;
  // czas i cel książek ustawione dla konkretnego tygodnia (klucz: poniedziałek)
  w.czasTygodni = {}; w.celeTygodni = {};
  const granicaT = dodajDni(dzisISO(), -7 * 26);
  for (const [pn, v] of Object.entries(u.czasTygodni || {})) if (poprawnaData(pn) && pn >= granicaT && Array.isArray(v) && v.length === 7) w.czasTygodni[pn] = v.map(x => ogranicz(Math.round(+x) || 0, 0, 600));
  for (const [pn, v] of Object.entries(u.celeTygodni || {})) if (poprawnaData(pn) && pn >= granicaT && +v > 0) w.celeTygodni[pn] = ogranicz(Math.round(+v), 1, 30);
  const pr = u.przypomnienie || {};
  w.przypomnienie = {
    wlaczone: !!pr.wlaczone,
    godzina: /^([01]\d|2[0-3]):[0-5]\d$/.test(pr.godzina) ? pr.godzina : '20:00',
    dni: Array.isArray(pr.dni) ? [...new Set(pr.dni.map(Number).filter(d => d >= 0 && d <= 6))].sort() : [0, 1, 2, 3, 4, 5, 6]
  };
  w.celeMiesiecy = {};
  if (u.celeMiesiecy && typeof u.celeMiesiecy === 'object') {
    for (const [ym, c] of Object.entries(u.celeMiesiecy)) {
      if (!poprawnyMiesiac(ym) || !c) continue;
      const x = { ksiazki: Math.max(0, Math.round(+c.ksiazki) || 0), strony: Math.max(0, Math.round(+c.strony) || 0), notatka: String(c.notatka || '').trim().slice(0, 200) };
      if (x.ksiazki || x.strony || x.notatka) w.celeMiesiecy[ym] = x;
    }
  }
  return w;
}

/* ---------- operacje (każda zwraca listę zmienionych książek) ---------- */
function nowaKsiazka(dane) {
  const max = Z.ksiazki.reduce((a, k) => Math.max(a, k.kolejnosc || 0), 0);
  const k = normalizujKsiazke({ ...dane, id: noweId(), dodano: dzisISO(), kolejnosc: max + 1, status: 'doPrzeczytania', strona: 0 });
  Z.ksiazki.push(k);
  return k;
}

function zacznijCzytac(k, data = dzisISO()) {
  if (['doPrzeczytania', 'porzucona', 'pozniej', 'zyczenia'].includes(k.status)) k.status = 'czytam';
  k.odlozono = null;
  k.start = k.start || data;
  k.porzucono = null;
  return [k];
}

function dopiszLog(k, data, roznica) {
  if (!roznica) return;
  if (roznica > 0) {
    const w = k.log.find(x => x.data === data);
    if (w) w.strony += roznica; else k.log.push({ data, strony: roznica });
    return;
  }
  // poprawka w dół: odejmij najpierw z podanego dnia, potem od najnowszych
  let reszta = -roznica;
  const kolej = [...k.log].sort((a, b) => (a.data === data ? -1 : b.data === data ? 1 : b.data.localeCompare(a.data)));
  for (const w of kolej) {
    const o = Math.min(w.strony, reszta);
    w.strony -= o;
    reszta -= o;
    if (!reszta) break;
  }
  k.log = k.log.filter(w => w.strony > 0);
}

function oznaczPrzeczytana(k, data = dzisISO(), wliczStrony = true) {
  if (wliczStrony) dopiszLog(k, data, k.strony - k.strona);
  if (k.bazowa && k.celData) k.bazowaWynik = data <= k.celData ? 'wTerminie' : 'po';
  k.strona = k.strony;
  k.status = 'przeczytana';
  k.koniec = data;
  k.start = k.start || data;
  k.bazowa = false;
  return [k];
}

function ustawStrone(k, wartosc, data = dzisISO()) {
  const v = Math.round(+wartosc);
  if (!Number.isFinite(v)) return { roznica: 0, skonczona: false };
  const nowa = ogranicz(v, 0, k.strony);
  const roznica = nowa - k.strona;
  if (k.status !== 'czytam') zacznijCzytac(k, data);
  dopiszLog(k, data, roznica);
  k.strona = nowa;
  const skonczona = nowa >= k.strony;
  if (skonczona) oznaczPrzeczytana(k, data);
  return { roznica, skonczona };
}

function ustawBazowa(k, celData) {
  const zmienione = [k];
  // można mieć kilka bazowych (np. dwie grube książki naraz); powyżej limitu zdejmujemy najstarszą
  const inne = bazowe().filter(b => b !== k);
  if (inne.length >= MAKS_BAZOWYCH) { const naj = inne.sort((a, b) => (a.planOd ? a.planOd.data : '').localeCompare(b.planOd ? b.planOd.data : ''))[0]; naj.bazowa = false; zmienione.push(naj); }
  zacznijCzytac(k);
  k.bazowa = true;
  k.celData = celData;
  k.planOd = { data: dzisISO(), strona: k.strona };
  return zmienione;
}

function zdejmijBazowa(k) { k.bazowa = false; return [k]; }

function porzuc(k) {
  k.status = 'porzucona';
  k.bazowa = false;
  k.porzucono = dzisISO();
  return [k];
}

function czytajPonownie(k) {
  k.czytania.push({ start: k.start, koniec: k.koniec, ocena: k.ocena });
  k.status = 'czytam';
  k.strona = 0;
  k.start = dzisISO();
  k.koniec = null;
  return [k];
}

function kolejka() {
  return Z.ksiazki.filter(k => k.status === 'doPrzeczytania').sort((a, b) => a.kolejnosc - b.kolejnosc);
}

function naPoczatekKolejki(k) {
  const min = kolejka().reduce((a, x) => Math.min(a, x.kolejnosc), Infinity);
  k.kolejnosc = (Number.isFinite(min) ? min : 0) - 1;
  return [k];
}

function przesunWKolejce(k, kierunek) {
  const lista = kolejka();
  const i = lista.indexOf(k), j = i + kierunek;
  if (i < 0 || j < 0 || j >= lista.length) return [];
  const inny = lista[j];
  [k.kolejnosc, inny.kolejnosc] = [inny.kolejnosc, k.kolejnosc];
  if (k.kolejnosc === inny.kolejnosc) k.kolejnosc += kierunek * 0.5;
  return [k, inny];
}

/* ---------- obliczenia ---------- */
const MAKS_BAZOWYCH = 3;
const bazowe = () => Z.ksiazki.filter(k => k.bazowa && k.status === 'czytam').sort((a, b) => (a.celData || '').localeCompare(b.celData || ''));
const bazowa = () => bazowe()[0] || null;

function ostatniaAktywnosc(k) {
  return k.log.reduce((a, w) => (w.data > a ? w.data : a), k.start || k.dodano);
}

const czytane = () => Z.ksiazki.filter(k => k.status === 'czytam')
  .sort((a, b) => ostatniaAktywnosc(b).localeCompare(ostatniaAktywnosc(a)));

function mapaDni() {
  const m = new Map();
  for (const k of Z.ksiazki) for (const w of k.log) m.set(w.data, (m.get(w.data) || 0) + w.strony);
  return m;
}

const stronyKsiazkiDnia = (k, iso) => k.log.reduce((s, w) => s + (w.data === iso ? w.strony : 0), 0);

/* ---------- passa (seria) z ustawieniami: próg stron, dni wolne, zamrożenia ---------- */
const ustSerii = () => (Z.ustawienia && Z.ustawienia.seria) || { prog: 1, dniWolne: [], zamrozenia: 0, cel: 0 };
/** 'czytal' | 'wolny' | 'brak' */
function rodzajDnia(d, m, u = ustSerii()) {
  if ((m.get(d) || 0) >= u.prog) return 'czytal';
  if (u.dniWolne.includes(dzienTygodnia(d))) return 'wolny';
  return 'brak';
}
/** Szczegóły obecnej passy: liczba dni czytania w ciągu, zużyte zamrożenia i dni pokryte zamrożeniem. */
function seriaSzczegoly(m, u = ustSerii()) {
  const dzis = dzisISO();
  let d = dzis;
  if (rodzajDnia(d, m, u) !== 'czytal') d = dodajDni(d, -1); // dzisiejszy dzień jeszcze trwa
  const zuzyte = {}, zamrozone = [], wolne = [];
  const limit = mies => u.zamrozenia + ((Z.ustawienia.gra && Z.ustawienia.gra.zamrozeniaKupione[mies]) || 0);
  const pierwszy = m.size ? [...m.keys()].reduce((a, b) => (a < b ? a : b)) : dzis;
  let n = 0, start = null, i = 0;
  while (i++ < 4000) {
    const r = rodzajDnia(d, m, u);
    if (r === 'czytal') { n++; start = d; }
    else if (r === 'wolny') wolne.push(d);
    else {
      const mies = d.slice(0, 7);
      if ((zuzyte[mies] || 0) < limit(mies) && n > 0) { zuzyte[mies] = (zuzyte[mies] || 0) + 1; zamrozone.push(d); }
      else break;
    }
    d = dodajDni(d, -1);
    if (d < pierwszy) break;
  }
  const tenMies = dzis.slice(0, 7);
  return {
    dni: n, start, zamrozone: zamrozone.filter(x => !start || x > start), wolne: wolne.filter(x => !start || x > start),
    zamrozeniaZostalo: Math.max(0, limit(tenMies) - (zuzyte[tenMies] || 0)), zamrozeniaLimit: limit(tenMies), dzisZrobione: rodzajDnia(dzis, m, u) === 'czytal',
    dzisWolny: rodzajDnia(dzis, m, u) === 'wolny', cel: u.cel, prog: u.prog
  };
}
function seriaAktualna(m) { return seriaSzczegoly(m).dni; }

function najdluzszaSeria(m, u = ustSerii()) {
  const klucze = [...m.keys()].filter(d => (m.get(d) || 0) > 0).sort();
  if (!klucze.length) return 0;
  let naj = 0, teraz = 0;
  const zuzyte = {};
  const limit = mies => u.zamrozenia + ((Z.ustawienia.gra && Z.ustawienia.gra.zamrozeniaKupione[mies]) || 0);
  for (let d = klucze[0], i = 0; d <= klucze[klucze.length - 1] && i < 4000; d = dodajDni(d, 1), i++) {
    const r = rodzajDnia(d, m, u);
    if (r === 'czytal') { teraz++; naj = Math.max(naj, teraz); }
    else if (r === 'brak') {
      const mies = d.slice(0, 7);
      if (teraz > 0 && (zuzyte[mies] || 0) < limit(mies)) zuzyte[mies] = (zuzyte[mies] || 0) + 1;
      else teraz = 0;
    }
  }
  return naj;
}

/** Średnia stron dziennie z ostatnich `okno` dni (krócej, jeśli historia jest krótsza). */
function sredniaDzienna(m, okno = 30) {
  if (!m.size) return 0;
  const dzis = dzisISO();
  const pierwszy = [...m.keys()].sort()[0];
  const dni = ogranicz(dniMiedzy(pierwszy, dzis) + 1, 1, okno);
  let s = 0;
  for (let i = 0; i < dni; i++) s += m.get(dodajDni(dzis, -i)) || 0;
  return s / dni;
}

function tempoZSesji(sesje) {
  let min = 0, str = 0;
  for (const s of sesje) if (s.minuty > 0 && s.strony > 0) { min += s.minuty; str += s.strony; }
  return min >= 10 ? str / (min / 60) : null;
}
const tempoOgolne = () => tempoZSesji(Z.ksiazki.flatMap(k => k.sesje));
const tempoKsiazki = k => tempoZSesji(k.sesje);

/** Wszystkie ukończenia (także ponowne czytania) w przedziale dat. */
function ukonczenia(od, doDnia) {
  const w = [];
  for (const k of Z.ksiazki) {
    if (k.status === 'przeczytana' && k.koniec && k.koniec >= od && k.koniec <= doDnia) w.push({ k, koniec: k.koniec });
    for (const c of k.czytania) if (c.koniec >= od && c.koniec <= doDnia) w.push({ k, koniec: c.koniec });
  }
  return w.sort((a, b) => a.koniec.localeCompare(b.koniec));
}

function postepCelu(m = mapaDni()) {
  const u = Z.ustawienia, dzis = dzisISO();
  const przeczytane = ukonczenia(u.start, u.koniec).length;
  const zostalo = Math.max(0, u.cel - przeczytane);
  const dniCalosc = Math.max(1, dniMiedzy(u.start, u.koniec) + 1);
  const dniZostalo = ogranicz(dniMiedzy(dzis, u.koniec) + 1, 1, dniCalosc);
  const dniMinelo = ogranicz(dniMiedzy(u.start, dzis), 0, dniCalosc); // pełne dni przed dzisiejszym
  const oczekiwane = Math.floor(u.cel * dniMinelo / dniCalosc);
  const tempo = sredniaDzienna(m, 30);
  return {
    cel: u.cel, przeczytane, zostalo, dniZostalo,
    przedStartem: dzis < u.start, poKoncu: dzis > u.koniec,
    tygodniowo: zostalo / dniZostalo * 7,
    stronDziennie: Math.ceil(zostalo * u.srednia / dniZostalo),
    oczekiwane, roznica: przeczytane - oczekiwane, oczekiwanyProc: dniMinelo / dniCalosc * 100,
    tempo, prognoza: przeczytane + Math.floor(tempo * dniZostalo / u.srednia)
  };
}

function dziennyCel(m = mapaDni()) {
  if (Z.ustawienia.dziennyCel > 0) return Z.ustawienia.dziennyCel;
  const g = postepCelu(m);
  if (g.przedStartem || g.poKoncu || !g.zostalo) return 30;
  return Math.max(1, g.stronDziennie);
}

function planBazowej(k) {
  const dzis = dzisISO();
  const dzisiaj = stronyKsiazkiDnia(k, dzis);
  const zostalo = k.strony - k.strona;
  const dniDoTerminu = dniMiedzy(dzis, k.celData) + 1; // razem z dzisiaj
  const poTerminie = dniDoTerminu < 1;
  const dni = Math.max(1, dniDoTerminu);
  const norma = Math.max(1, Math.ceil((zostalo + dzisiaj) / dni));
  const od = k.planOd || { data: k.start || dzis, strona: 0 };
  const calosc = Math.max(1, dniMiedzy(od.data, k.celData) + 1);
  const naStrone = d => Math.round(od.strona + (k.strony - od.strona) * ogranicz(d, 0, calosc) / calosc);
  const minelo = dniMiedzy(od.data, dzis);
  const planWczoraj = naStrone(minelo);
  const planDzis = naStrone(minelo + 1);
  let roznica, stan;
  if (k.strona >= planDzis) { roznica = k.strona - planDzis; stan = roznica > 0 ? 'przed' : 'wPlanie'; }
  else if (k.strona >= planWczoraj) { roznica = 0; stan = 'wPlanie'; }
  else { roznica = planWczoraj - k.strona; stan = 'za'; }
  return { dzisiaj, zostalo, dni, poTerminie, norma, planDzis, roznica, stan, zrobione: dzisiaj >= norma };
}

/** Szacunkowa data skończenia książki z tempa z ostatnich 14 dni. */
function prognozaKsiazki(k) {
  const dzis = dzisISO();
  let s = 0;
  for (let i = 0; i < 14; i++) s += stronyKsiazkiDnia(k, dodajDni(dzis, -i));
  if (!s) return null;
  const dni = Math.ceil((k.strony - k.strona) / (s / 14));
  return dodajDni(dzis, Math.max(0, dni - 1));
}

function czasCzytania(godziny) {
  const min = Math.round(godziny * 60);
  if (min < 60) return `${Math.max(1, min)} min`;
  const h = Math.floor(min / 60), r = min % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

/* ---------- kopia zapasowa ---------- */
function daneDoKopii() {
  return { aplikacja: 'Zakładka', wersja: WERSJA, eksport: new Date().toISOString(), ustawienia: Z.ustawienia, ksiazki: Z.ksiazki };
}

/* ---------- sesja: czas z pauzami ---------- */
function czasSesji(s, teraz = Date.now()) {
  if (!s) return 0;
  return Math.max(0, (s.pauzaOd || teraz) - s.start - (s.pauzaMs || 0));
}

/* ---------- dziennik wpisów: poprawki ---------- */
/** Zmienia wpis z dnia `data`: nowa data i/lub liczba stron. Dla czytanej książki koryguje też bieżącą stronę. */
function zmienWpis(k, data, nowaData, noweStrony) {
  const w = k.log.find(x => x.data === data);
  if (!w) return [];
  let nowe = Math.max(0, Math.round(+noweStrony) || 0);
  if (k.status === 'czytam') {
    nowe = Math.min(nowe, w.strony + (k.strony - k.strona)); // nie da się przeskoczyć końca książki
    k.strona = ogranicz(k.strona + nowe - w.strony, 0, k.strony);
  }
  k.log = k.log.filter(x => x !== w);
  if (nowe > 0) {
    const cel = poprawnaData(nowaData) && nowaData <= dzisISO() ? nowaData : data;
    const istn = k.log.find(x => x.data === cel);
    if (istn) istn.strony += nowe; else k.log.push({ data: cel, strony: nowe });
  }
  return [k];
}

/** Co czytałeś danego dnia: książki, strony i sesje. */
function dzienCzytania(iso) {
  const ksiazki = Z.ksiazki.map(k => ({ k, strony: stronyKsiazkiDnia(k, iso) })).filter(x => x.strony > 0)
    .sort((a, b) => b.strony - a.strony);
  const sesje = Z.ksiazki.flatMap(k => k.sesje.filter(s => s.data === iso).map(s => ({ k, ...s })));
  return { ksiazki, sesje, razem: ksiazki.reduce((s, x) => s + x.strony, 0), minuty: sesje.reduce((s, x) => s + x.minuty, 0) };
}

/** Średnio stron w poszczególne dni tygodnia (pn–nd) z ostatnich `tygodnie` tygodni. */
function rozkladTygodnia(m = mapaDni(), tygodnie = 12) {
  const suma = Array(7).fill(0), ileDni = Array(7).fill(0), dzis = dzisISO();
  for (let i = 0; i < tygodnie * 7; i++) {
    const d = dodajDni(dzis, -i), t = dzienTygodnia(d);
    suma[t] += m.get(d) || 0;
    ileDni[t]++;
  }
  return suma.map((s, i) => s / Math.max(1, ileDni[i]));
}

/* ---------- odznaki ---------- */
function odznaki(m = mapaDni()) {
  const przeczytane = ukonczenia('0000-01-01', '9999-12-31');
  const nPrz = przeczytane.length;
  const strony = [...m.values()].reduce((s, v) => s + v, 0);
  const seria = najdluzszaSeria(m);
  const najDzien = Math.max(0, ...m.values());
  const najGrubsza = Math.max(0, ...przeczytane.map(x => x.k.strony));
  const cytaty = Z.ksiazki.reduce((s, k) => s + k.cytaty.length, 0);
  const najSesja = Math.max(0, ...Z.ksiazki.flatMap(k => k.sesje.map(s => s.minuty)));
  const autorzy = new Set(przeczytane.map(x => x.k.autor.toLowerCase()).filter(Boolean)).size;
  const naCzas = Z.ksiazki.some(k => k.bazowaWynik === 'wTerminie');
  const g = postepCelu(m);
  const ocenione = Z.ksiazki.filter(k => k.status === 'przeczytana' && k.ocena).length;
  const def = [
    ['pierwsza', 'Pierwsze koty', 'Przeczytaj pierwszą książkę', nPrz, 1],
    ['dziesiec', 'Półeczka', 'Przeczytaj 10 książek', nPrz, 10],
    ['piecdziesiat', 'Regał', 'Przeczytaj 50 książek', nPrz, 50],
    ['sto', 'Biblioteka', 'Przeczytaj 100 książek', nPrz, 100],
    ['seria7', 'Tydzień z książką', 'Czytaj 7 dni z rzędu', seria, 7],
    ['seria30', 'Nawyk', 'Czytaj 30 dni z rzędu', seria, 30],
    ['seria100', 'Żelazna wola', 'Czytaj 100 dni z rzędu', seria, 100],
    ['maraton', 'Maraton', 'Przeczytaj 100 stron jednego dnia', najDzien, 100],
    ['tysiac', 'Tysiąc stron', 'Przeczytaj łącznie 1000 stron', strony, 1000],
    ['dziesiectysiecy', 'Dziesięć tysięcy', 'Przeczytaj łącznie 10 000 stron', strony, 10000],
    ['cegla', 'Cegła', 'Skończ książkę mającą 700 stron lub więcej', najGrubsza, 700],
    ['skupienie', 'Godzina skupienia', 'Czytaj w jednej sesji przez godzinę', najSesja, 60],
    ['cytaty', 'Kolekcjoner zdań', 'Zapisz 25 cytatów lub notatek', cytaty, 25],
    ['autorzy', 'Odkrywca', 'Przeczytaj książki 10 różnych autorów', autorzy, 10],
    ['krytyk', 'Krytyk', 'Oceń 10 przeczytanych książek', ocenione, 10],
    ['naczas', 'Na czas', 'Skończ książkę bazową przed terminem', naCzas ? 1 : 0, 1],
    ['cel', 'Cel osiągnięty', 'Zrealizuj cel roczny', g.przeczytane, g.cel]
  ];
  return def.map(([id, nazwa, opis, wart, prog]) => ({ id, nazwa, opis, wart: Math.min(wart, prog), prog, zdobyta: wart >= prog }));
}

/* ---------- podsumowanie roku ---------- */
function lataZDanymi() {
  const lata = new Set();
  for (const k of Z.ksiazki) {
    for (const w of k.log) lata.add(+w.data.slice(0, 4));
    if (k.status === 'przeczytana' && k.koniec) lata.add(+k.koniec.slice(0, 4));
    for (const c of k.czytania) lata.add(+c.koniec.slice(0, 4));
  }
  return [...lata].sort((a, b) => b - a);
}

function podsumowanieRoku(rok) {
  const od = `${rok}-01-01`, doDnia = `${rok}-12-31`;
  const ksiazki = ukonczenia(od, doDnia);
  const m = mapaDni(), wRoku = new Map([...m].filter(([d]) => d >= od && d <= doDnia));
  const strony = [...wRoku.values()].reduce((s, v) => s + v, 0);
  const miesiace = Array(12).fill(0);
  for (const x of ksiazki) miesiace[+x.koniec.slice(5, 7) - 1]++;
  const stronyMies = Array(12).fill(0);
  for (const [d, v] of wRoku) stronyMies[+d.slice(5, 7) - 1] += v;
  const autorzy = {};
  for (const x of ksiazki) if (x.k.autor) autorzy[x.k.autor] = (autorzy[x.k.autor] || 0) + 1;
  const topAutor = Object.entries(autorzy).sort((a, b) => b[1] - a[1])[0];
  const oceny = ksiazki.map(x => x.k.ocena).filter(Boolean);
  const minuty = Z.ksiazki.reduce((s, k) => s + k.sesje.filter(x => x.data >= od && x.data <= doDnia).reduce((a, x) => a + x.minuty, 0), 0);
  const najMies = stronyMies.indexOf(Math.max(...stronyMies));
  return {
    rok, ksiazki, strony, dni: [...wRoku.values()].filter(v => v > 0).length,
    seria: najdluzszaSeria(wRoku), miesiace, stronyMies,
    najMies: stronyMies[najMies] ? najMies : -1,
    najdluzsza: [...ksiazki].sort((a, b) => b.k.strony - a.k.strony)[0] || null,
    ulubione: ksiazki.filter(x => x.k.ocena === 5).map(x => x.k),
    topAutor: topAutor && topAutor[1] > 1 ? topAutor : null,
    sredniaOcena: oceny.length ? oceny.reduce((s, v) => s + v, 0) / oceny.length : null,
    minuty, najDzien: [...wRoku].sort((a, b) => b[1] - a[1])[0] || null
  };
}

/* ---------- cele tygodniowe i miesięczne (wersja 2.3) ---------- */
const miesiacTeraz = () => dzisISO().slice(0, 7);
function przesunMiesiac(ym, n) {
  const [r, m] = ym.split('-').map(Number);
  const x = r * 12 + (m - 1) + n;
  return `${Math.floor(x / 12)}-${pad(x % 12 + 1)}`;
}
const dniWMiesiacu = ym => new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0)).getUTCDate();
const zakresMiesiaca = ym => [`${ym}-01`, `${ym}-${pad(dniWMiesiacu(ym))}`];
const poczatekTygodnia = (iso = dzisISO()) => dodajDni(iso, -dzienTygodnia(iso));

/** Wspólna miara: ile dni okresu celu rocznego wypada w przedziale [od, do]. */
function dniOkresuW(od, doDnia) {
  const u = Z.ustawienia;
  const a = od > u.start ? od : u.start, b = doDnia < u.koniec ? doDnia : u.koniec;
  return a > b ? 0 : dniMiedzy(a, b) + 1;
}
function bazaDzienna() {
  const u = Z.ustawienia;
  if (u.dziennyCel > 0) return u.dziennyCel;
  return Math.max(1, Math.ceil(u.cel * u.srednia / Math.max(1, dniMiedzy(u.start, u.koniec) + 1)));
}
const zaokr1 = n => Math.round(n * 10) / 10;

/** Cel na tydzień zaczynający się od `pn`. auto = wyliczony z celu rocznego. */
function celTygodnia(pn = poczatekTygodnia()) {
  const u = Z.ustawienia, nd = dodajDni(pn, 6);
  const dniCalosc = Math.max(1, dniMiedzy(u.start, u.koniec) + 1), w = dniOkresuW(pn, nd);
  return {
    strony: u.tydzienStrony || bazaDzienna() * 7,
    ksiazki: (u.celeTygodni && u.celeTygodni[pn]) || u.tydzienKsiazki || (w ? Math.max(0.5, zaokr1(u.cel * 7 / dniCalosc)) : 0),
    autoStrony: !u.tydzienStrony, autoKsiazki: !u.tydzienKsiazki && !(u.celeTygodni && u.celeTygodni[pn])
  };
}

/** Cel na miesiąc: najpierw wpis dla tego miesiąca, potem stała wartość z ustawień, na końcu wyliczenie. */
function celMiesiaca(ym) {
  const u = Z.ustawienia, wl = u.celeMiesiecy[ym] || {};
  const [od, doDnia] = zakresMiesiaca(ym);
  const dniCalosc = Math.max(1, dniMiedzy(u.start, u.koniec) + 1), w = dniOkresuW(od, doDnia);
  // narastająco, żeby suma automatycznych celów miesięcy dawała dokładnie cel roczny
  const przed = dniOkresuW(u.start, dodajDni(od, -1));
  const autoK = w ? Math.round(u.cel * (przed + w) / dniCalosc) - Math.round(u.cel * przed / dniCalosc) : 0;
  const autoS = bazaDzienna() * dniWMiesiacu(ym);
  return {
    ksiazki: wl.ksiazki || u.miesiacKsiazki || autoK,
    strony: wl.strony || u.miesiacStrony || autoS,
    zrodloK: wl.ksiazki ? 'miesiac' : u.miesiacKsiazki ? 'stale' : 'auto',
    zrodloS: wl.strony ? 'miesiac' : u.miesiacStrony ? 'stale' : 'auto',
    notatka: wl.notatka || '', wlasny: !!u.celeMiesiecy[ym]
  };
}

function ustawCelMiesiaca(ym, { ksiazki = 0, strony = 0, notatka = '' } = {}) {
  const c = { ksiazki: Math.max(0, Math.round(+ksiazki) || 0), strony: Math.max(0, Math.round(+strony) || 0), notatka: String(notatka).trim().slice(0, 200) };
  if (c.ksiazki || c.strony || c.notatka) Z.ustawienia.celeMiesiecy[ym] = c;
  else delete Z.ustawienia.celeMiesiecy[ym];
}

/** Ile z przedziału czasu już minęło (0–1), żeby pokazać „gdzie powinieneś być”. */
function czescOkresu(od, doDnia, dzis = dzisISO()) {
  if (dzis < od) return 0;
  if (dzis > doDnia) return 1;
  return (dniMiedzy(od, dzis) + 1) / (dniMiedzy(od, doDnia) + 1);
}

function sumaStron(od, doDnia, m = mapaDni()) {
  let s = 0;
  for (const [d, v] of m) if (d >= od && d <= doDnia) s += v;
  return s;
}

function postepTygodnia(m = mapaDni(), pn = poczatekTygodnia()) {
  const nd = dodajDni(pn, 6), c = celTygodnia(pn);
  return { od: pn, do: nd, cel: c, strony: sumaStron(pn, nd, m), ksiazki: ukonczenia(pn, nd).length, czesc: czescOkresu(pn, nd) };
}

/** Pełny obraz jednego miesiąca. */
function danyMiesiac(ym, m = mapaDni()) {
  const [od, doDnia] = zakresMiesiaca(ym);
  const dni = {};
  for (const [d, v] of m) if (d >= od && d <= doDnia && v > 0) dni[d] = v;
  const czytane = [];
  for (const k of Z.ksiazki) {
    const s = k.log.reduce((a, w) => a + (w.data >= od && w.data <= doDnia ? w.strony : 0), 0);
    if (s > 0) czytane.push({ k, strony: s, dni: new Set(k.log.filter(w => w.data >= od && w.data <= doDnia).map(w => w.data)).size });
  }
  czytane.sort((a, b) => b.strony - a.strony);
  const ukon = ukonczenia(od, doDnia);
  const minuty = Z.ksiazki.reduce((s, k) => s + k.sesje.filter(x => x.data >= od && x.data <= doDnia).reduce((a, x) => a + x.minuty, 0), 0);
  const strony = Object.values(dni).reduce((s, v) => s + v, 0);
  const zaplanowane = Z.ksiazki.filter(k => k.planMiesiac === ym)
    .map(k => ({ k, zrobiona: ukon.some(x => x.k === k) }))
    .sort((a, b) => a.zrobiona - b.zrobiona || (a.k.kolejnosc || 0) - (b.k.kolejnosc || 0));
  const najDzien = Object.entries(dni).sort((a, b) => b[1] - a[1])[0] || null;
  return {
    ym, od, do: doDnia, dni, strony, dniCzytania: Object.keys(dni).length, czytane, ukonczone: ukon,
    zaplanowane, minuty, najDzien, cel: celMiesiaca(ym), czesc: czescOkresu(od, doDnia),
    seria: najdluzszaSeria(new Map(Object.entries(dni)))
  };
}

/** Miesiące, w których coś się działo (od najnowszego), plus bieżący. */
function miesiaceZDanymi() {
  const s = new Set([miesiacTeraz()]);
  for (const k of Z.ksiazki) {
    for (const w of k.log) s.add(w.data.slice(0, 7));
    if (k.status === 'przeczytana' && k.koniec) s.add(k.koniec.slice(0, 7));
    for (const c of k.czytania) s.add(c.koniec.slice(0, 7));
    if (k.planMiesiac) s.add(k.planMiesiac);
  }
  for (const ym of Object.keys(Z.ustawienia.celeMiesiecy)) s.add(ym);
  return [...s].sort().reverse();
}

function zaplanujNaMiesiac(k, ym) { k.planMiesiac = poprawnyMiesiac(ym) ? ym : null; return [k]; }

/* ---------- cykle i pożyczki (wersja 2.5) ---------- */
const nazwaSerii = s => s.trim().toLowerCase();
function ksiazkiSerii(seria) {
  if (!seria) return [];
  const n = nazwaSerii(seria);
  return Z.ksiazki.filter(k => k.seria && nazwaSerii(k.seria) === n)
    .sort((a, b) => (a.tom ?? 999) - (b.tom ?? 999) || a.tytul.localeCompare(b.tytul, 'pl'));
}
/** Następny nieprzeczytany tom po książce k (najpierw o wyższym numerze). */
function nastepnyTom(k) {
  const lista = ksiazkiSerii(k.seria).filter(x => x !== k && x.status !== 'przeczytana');
  if (!lista.length) return null;
  return lista.find(x => k.tom != null && x.tom != null && x.tom > k.tom) || lista[0];
}
function serie() {
  const m = new Map();
  for (const k of Z.ksiazki) if (k.seria) {
    const n = nazwaSerii(k.seria);
    const x = m.get(n) || { nazwa: k.seria, ksiazki: 0, przeczytane: 0 };
    x.ksiazki++;
    if (k.status === 'przeczytana') x.przeczytane++;
    m.set(n, x);
  }
  return [...m.values()].sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'));
}
const pozyczoneKsiazki = () => Z.ksiazki.filter(k => k.pozyczona).sort((a, b) => (a.pozyczona.termin || '9999').localeCompare(b.pozyczona.termin || '9999') || a.pozyczona.data.localeCompare(b.pozyczona.data));

/** Cel roczny w czasie: ile książek przeczytane narastająco w każdym dniu okresu. */
function celWCzasie() {
  const u = Z.ustawienia, dzis = dzisISO();
  const ukon = ukonczenia(u.start, u.koniec);
  const dni = dniMiedzy(u.start, u.koniec) + 1;
  const doDzis = ogranicz(dniMiedzy(u.start, dzis) + 1, 0, dni);
  const narast = [];
  let i = 0, n = 0;
  for (let d = 0; d < doDzis; d++) {
    const iso = dodajDni(u.start, d);
    while (i < ukon.length && ukon[i].koniec <= iso) { n++; i++; }
    narast.push(n);
  }
  const tempo = doDzis ? n / doDzis : 0; // książek dziennie od startu
  return { dni, doDzis, narast, cel: u.cel, przeczytane: n, prognoza: Math.round(n + tempo * (dni - doDzis)) };
}

/* ---------- plan tygodnia (wersja 2.6) ---------- */
const DNI_PELNE = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela'];
const zostaloStron = k => Math.max(0, k.strony - (k.status === 'czytam' ? k.strona : 0));

/** Wpisy planu tygodnia z książkami; wpis bez dnia = „przeczytać w tym tygodniu”. */
function planTygodnia(pn = poczatekTygodnia()) {
  return (Z.ustawienia.planyTygodni[pn] || []).map((e, i) => ({ ...e, i, k: znajdz(e.id) })).filter(e => e.k);
}
function zapiszPlanTygodnia(pn, wpisy) {
  const czyste = wpisy.map(({ id, dzien, strony, minuty, ukryty }) => ({ id, dzien: dzien || null, strony: strony || 0, minuty: minuty || 0, ...(ukryty ? { ukryty } : {}) }));
  if (czyste.length) Z.ustawienia.planyTygodni[pn] = czyste;
  else delete Z.ustawienia.planyTygodni[pn];
}
function dodajDoPlanu(pn, id, dzien = null, strony = 0) {
  if (znajdz(id) && znajdz(id).bazowa) return; // bazowa ma automatyczną normę
  const lista = planTygodnia(pn);
  const juz = lista.find(e => e.id === id && (e.dzien || null) === (dzien || null));
  if (juz) juz.strony = strony || juz.strony;
  else lista.push({ id, dzien, strony });
  zapiszPlanTygodnia(pn, lista);
}
function usunZPlanu(pn, i) {
  zapiszPlanTygodnia(pn, planTygodnia(pn).filter(e => e.i !== i));
}

/** Stan jednego wpisu: ile przeczytano i czy zrobione. */
function stanWpisu(e, pn) {
  const nd = dodajDni(pn, 6);
  if (e.dzien) {
    const przecz = stronyKsiazkiDnia(e.k, e.dzien);
    return { przecz, zrobione: e.strony ? przecz >= e.strony : przecz > 0, minal: e.dzien < dzisISO() };
  }
  const przecz = e.k.log.reduce((s, w) => s + (w.data >= pn && w.data <= nd ? w.strony : 0), 0);
  const skonczona = ukonczenia(pn, nd).some(x => x.k === e.k);
  return { przecz, zrobione: skonczona || (e.strony > 0 && przecz >= e.strony), minal: nd < dzisISO() };
}

function planDnia(iso = dzisISO()) {
  const pn = poczatekTygodnia(iso);
  return planTygodniaPelny(pn).filter(e => e.dzien === iso);
}

/* ---------- przypomnienia i plik kalendarza (.ics) ---------- */
const ICS_DNI = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const icsTekst = t => String(t).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const icsData = (iso, hhmm) => `${iso.replace(/-/g, '')}T${hhmm.replace(':', '')}00`;
function icsZwin(linia) { // linie max 75 znaków
  const out = [];
  for (let i = 0; i < linia.length; i += 73) out.push((i ? ' ' : '') + linia.slice(i, i + 73));
  return out.join('\r\n');
}
function icsKalendarz(wydarzenia) {
  const teraz = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const l = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Zakladka//PL', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const w of wydarzenia) {
    l.push('BEGIN:VEVENT', `UID:${w.uid}@zakladka`, `DTSTAMP:${teraz}`, `DTSTART:${w.start}`, `DURATION:PT${w.minuty || 30}M`,
      `SUMMARY:${icsTekst(w.tytul)}`);
    if (w.opis) l.push(`DESCRIPTION:${icsTekst(w.opis)}`);
    if (w.rrule) l.push(`RRULE:${w.rrule}`);
    l.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsTekst(w.tytul)}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT');
  }
  l.push('END:VCALENDAR');
  return l.map(icsZwin).join('\r\n') + '\r\n';
}
/** Codzienne przypomnienie jako powtarzające się wydarzenie w kalendarzu telefonu. */
function icsPrzypomnienia() {
  const p = Z.ustawienia.przypomnienie;
  const dni = p.dni.length ? p.dni : [0, 1, 2, 3, 4, 5, 6];
  let start = dzisISO();
  while (!dni.includes(dzienTygodnia(start))) start = dodajDni(start, 1);
  return icsKalendarz([{
    uid: 'przypomnienie-codzienne', start: icsData(start, p.godzina), minuty: 30,
    tytul: '📖 Czas na czytanie', opis: `Dzienny cel: ${dziennyCel()} stron. Otwórz Zakładkę i zapisz postęp.`,
    rrule: `FREQ=WEEKLY;BYDAY=${dni.map(d => ICS_DNI[d]).join(',')}`
  }]);
}
/** Plan tygodnia jako wydarzenia: jedno na każdy dzień z zaplanowanym czytaniem. */
function icsPlanuTygodnia(pn) {
  const godz = Z.ustawienia.przypomnienie.godzina;
  const wydarzenia = [];
  for (let i = 0; i < 7; i++) {
    const d = dodajDni(pn, i);
    if (d < dzisISO()) continue;
    const wpisy = planTygodniaPelny(pn).filter(e => e.dzien === d);
    if (!wpisy.length) continue;
    const suma = wpisy.reduce((s, e) => s + e.strony, 0);
    wydarzenia.push({
      uid: `plan-${d}`, start: icsData(d, godz), minuty: 45,
      tytul: `📖 Czytanie${suma ? `: ${suma} str.` : ''}`,
      opis: wpisy.map(e => `${e.k.tytul}${e.strony ? ` — ${e.strony} str.` : ''}`).join('\n')
    });
  }
  return icsKalendarz(wydarzenia);
}

/* ---------- losowanie: waga książek ---------- */
function wagaLosowania(k, { dlugoCzeka = true } = {}) {
  let w = 1;
  if (dlugoCzeka) w += Math.min(3, Math.max(0, dniMiedzy(k.dodano, dzisISO())) / 120); // czeka 4 miesiące = 2x szansy
  const poprz = k.seria ? ksiazkiSerii(k.seria).filter(x => x.tom != null && k.tom != null && x.tom < k.tom) : [];
  if (poprz.length && poprz.every(x => x.status === 'przeczytana')) w += 1.5; // następny tom cyklu
  return w;
}
function losujWazone(lista, waga) {
  const wagi = lista.map(waga), suma = wagi.reduce((s, v) => s + v, 0);
  let r = Math.random() * suma;
  for (let i = 0; i < lista.length; i++) { r -= wagi[i]; if (r <= 0) return lista[i]; }
  return lista[lista.length - 1] || null;
}

/* ---------- półki: na później i lista życzeń (wersja 2.7) ---------- */
function odlozNaPozniej(k) {
  k.status = 'pozniej';
  k.bazowa = false;
  k.odlozono = dzisISO();
  return [k];
}
function doKolejki(k, naPoczatek = false) {
  const lista = kolejka();
  k.status = 'doPrzeczytania';
  k.odlozono = null;
  k.kolejnosc = naPoczatek ? (lista.length ? Math.min(...lista.map(x => x.kolejnosc)) - 1 : 0) : (lista.length ? Math.max(...lista.map(x => x.kolejnosc)) + 1 : 0);
  return [k];
}
function naListeZyczen(k) {
  k.status = 'zyczenia';
  k.bazowa = false;
  return [k];
}
const listaZyczen = () => Z.ksiazki.filter(k => k.status === 'zyczenia')
  .sort((a, b) => b.priorytet - a.priorytet || (a.cena ?? 1e9) - (b.cena ?? 1e9) || a.tytul.localeCompare(b.tytul, 'pl'));
const naPozniej = () => Z.ksiazki.filter(k => k.status === 'pozniej').sort((a, b) => (b.odlozono || '').localeCompare(a.odlozono || ''));

/* ---------- zaawansowany plan: czas na czytanie, stałe plany, przenoszenie (2.7) ---------- */
const tempoPlanu = () => Z.ustawienia.tempoReczne || tempoOgolne() || 30; // stron na godzinę: wpisane ręcznie, z sesji albo 30
const stronZMinut = min => Math.round(min * tempoPlanu() / 60);
const minutZeStron = str => Math.round(str * 60 / tempoPlanu());
function czasDnia(iso) {
  const t = Z.ustawienia.czasTygodni && Z.ustawienia.czasTygodni[poczatekTygodnia(iso)];
  return (t || Z.ustawienia.czasDni || [])[dzienTygodnia(iso)] ?? 30;
}
const czasyTygodnia = pn => (Z.ustawienia.czasTygodni[pn] || Z.ustawienia.czasDni).slice();

/** Wpisy wygenerowane ze stałych planów (np. „Lalka: pn–pt po 30 stron”). */
function wpisyStale(pn) {
  const wyj = [], ukryte = new Set((Z.ustawienia.planyTygodni[pn] || []).filter(e => e.ukryty).map(e => `${e.ukryty}|${e.dzien}`));
  for (const r of Z.ustawienia.stalePlany) {
    const k = znajdz(r.id);
    if (!k || k.status === 'przeczytana' || k.status === 'porzucona') continue;
    for (const d of r.dni) {
      const dzien = dodajDni(pn, d);
      if (ukryte.has(`${r.rid}|${dzien}`)) continue;
      if (k.status === 'przeczytana' && k.koniec && k.koniec < dzien) continue;
      wyj.push({ id: r.id, dzien, strony: r.strony, minuty: r.minuty, staly: r.rid, k, i: -1 });
    }
  }
  return wyj;
}

function stanWpisuPelny(e, pn) {
  const st = stanWpisu(e, pn);
  if (e.dzien && e.minuty) {
    const min = e.k.sesje.filter(x => x.data === e.dzien).reduce((a, x) => a + x.minuty, 0);
    st.minPrzecz = min;
    if (!e.strony) st.zrobione = min >= e.minuty;
    else st.zrobione = st.zrobione || min >= e.minuty;
  }
  return st;
}

/**
 * Norma książki bazowej na dany dzień — liczona przez system, nie ustawiana ręcznie.
 * Minione dni: według planu liniowego od startu do terminu. Dziś i dalej: pozostałe strony / dni do terminu.
 */
function normaBazowejDnia(k, d) {
  if (!k || !k.bazowa || !k.celData) return 0;
  const od = k.planOd || { data: k.start || dzisISO(), strona: 0 };
  if (d < od.data || d > k.celData) return 0;
  const dzis = dzisISO();
  if (d >= dzis) return planBazowej(k).norma;
  const calosc = Math.max(1, dniMiedzy(od.data, k.celData) + 1);
  const naStrone = n => Math.round(od.strona + (k.strony - od.strona) * ogranicz(n, 0, calosc) / calosc);
  const n = dniMiedzy(od.data, d);
  return Math.max(0, naStrone(n + 1) - naStrone(n));
}
/** Automatyczne wpisy książki bazowej na każdy dzień tygodnia. */
function wpisyBazowej(pn) {
  const wyj = [];
  for (const k of bazowe()) for (let i = 0; i < 7; i++) {
    const d = dodajDni(pn, i), n = normaBazowejDnia(k, d);
    if (n > 0) wyj.push({ id: k.id, dzien: d, strony: n, minuty: 0, auto: 'bazowa', k, i: -1 });
  }
  return wyj;
}
/** Plan tygodnia razem ze stałymi planami, automatyczną normą bazowej i stanem każdego wpisu. */
function planTygodniaPelny(pn = poczatekTygodnia()) {
  const bz = new Set(bazowe().map(b => b.id));
  return [...planTygodnia(pn).filter(e => !e.ukryty && !bz.has(e.id)), ...wpisyStale(pn).filter(e => !bz.has(e.id)), ...wpisyBazowej(pn)]
    .map(e => ({ ...e, ...stanWpisuPelny(e, pn) }));
}

function przeniesWpis(pnZ, i, nowaData, { kopiuj = false } = {}) {
  const lista = planTygodnia(pnZ);
  const e = lista.find(x => x.i === i);
  if (!e) return;
  const pnNa = poczatekTygodnia(nowaData);
  if (!kopiuj) zapiszPlanTygodnia(pnZ, lista.filter(x => x.i !== i));
  const cel = planTygodnia(pnNa);
  const juz = cel.find(x => x.id === e.id && x.dzien === nowaData && !x.ukryty);
  if (juz) { juz.strony += e.strony; juz.minuty = (juz.minuty || 0) + (e.minuty || 0); }
  else cel.push({ id: e.id, dzien: nowaData, strony: e.strony, minuty: e.minuty || 0 });
  zapiszPlanTygodnia(pnNa, cel);
}

/** Niezrobione wpisy z minionych dni tego tygodnia → na dziś (z pomniejszeniem o to, co już przeczytano). */
function przeniesNiezrobione(pn = poczatekTygodnia()) {
  const dzis = dzisISO();
  const zalegle = planTygodnia(pn).filter(e => e.dzien && e.dzien < dzis && !e.ukryty).map(e => ({ ...e, ...stanWpisuPelny(e, pn) })).filter(e => !e.zrobione);
  let n = 0;
  for (const e of zalegle.sort((a, b) => b.i - a.i)) {
    const reszta = e.strony ? Math.max(1, e.strony - e.przecz) : 0;
    const lista = planTygodnia(pn).filter(x => x.i !== e.i);
    zapiszPlanTygodnia(pn, lista);
    const pnD = poczatekTygodnia(dzis), cel = planTygodnia(pnD);
    const juz = cel.find(x => x.id === e.id && x.dzien === dzis && !x.ukryty);
    if (juz) juz.strony += reszta; else cel.push({ id: e.id, dzien: dzis, strony: reszta, minuty: e.minuty || 0 });
    zapiszPlanTygodnia(pnD, cel);
    n++;
  }
  return n;
}

/**
 * Liczy rozkład (bez zapisu) — do podglądu na żywo i do zapisu.
 * ids: kolejność ma znaczenie w trybie 'kolejno' (najpierw kończy pierwszą, potem następną).
 * czasy: minuty na każdy dzień tygodnia (pn..nd) dla tego rozkładu; 0 = dzień bez czytania.
 */
function obliczRozklad(pn, ids, { od = dzisISO(), tryb = Z.ustawienia.trybRozkladu, czasy = czasyTygodnia(pn), limit = false } = {}) {
  const nd = dodajDni(pn, 6), start = od < pn ? pn : od;
  const pusty = { wpisy: [], dni: [], strony: 0, potrzebaMin: 0, maszMin: 0, za_duzo: false, naDzien: [], koniec: {} };
  if (start > nd) return pusty;
  const dni = [];
  for (let d = start; d <= nd; d = dodajDni(d, 1)) dni.push(d);
  // czas zajęty przez książkę bazową (jej norma liczy się sama) odejmujemy od czasu dnia
  const bz = bazowe(), baz = bz[0] || null;
  const normaDnia = d => bz.reduce((s, b) => s + normaBazowejDnia(b, d), 0);
  const rezerwa = dni.map(d => minutZeStron(normaDnia(d)));
  const czasDnia0 = dni.map(d => czasy[dzienTygodnia(d)] || 0);
  let wagi = czasDnia0.map((c, i) => Math.max(0, c - rezerwa[i]));
  const bazowaZjada = czasDnia0.some(v => v > 0) && !wagi.some(v => v > 0);
  if (bazowaZjada) wagi = czasDnia0.slice();
  const bezCzasu = !wagi.some(v => v > 0);
  if (bezCzasu) wagi = dni.map(() => 1);
  const sumaW = wagi.reduce((a, b) => a + b, 0);
  const ksiazki = ids.map(znajdz).filter(k => k && zostaloStron(k) > 0 && !k.bazowa);
  const razem = ksiazki.reduce((s, k) => s + zostaloStron(k), 0);
  const bazInfo = baz ? { k: baz, lista: bz, strony: dni.reduce((s, d) => s + normaDnia(d), 0), min: rezerwa.reduce((a, b) => a + b, 0) } : null;
  if (!razem) return { ...pusty, dni, baz: bazInfo, rezerwa };
  const naDzien = [];
  let nar = 0;
  wagi.forEach((w, i) => { const przed = Math.round(razem * nar / sumaW); nar += w; naDzien[i] = Math.round(razem * nar / sumaW) - przed; });
  if (limit && !bezCzasu) {
    // tylko tyle, ile zmieści się w czasie: każdy dzień dostaje swoją pojemność, aż skończą się strony
    let zostalo = razem;
    dni.forEach((d, i) => { naDzien[i] = Math.min(zostalo, stronZMinut(wagi[i] || 0)); zostalo -= naDzien[i]; });
  }
  const zaplanowane = naDzien.reduce((a, b) => a + b, 0);
  const wpisy = [], koniec = {}, czesc = {}; // koniec: dzień skończenia (tylko gdy plan domyka książkę); czesc: zaplanowane strony
  if (tryb === 'rownolegle') {
    for (const k of ksiazki) {
      const udzial = zostaloStron(k) / razem;
      let zostalo = zostaloStron(k);
      if (zaplanowane < razem) zostalo = Math.round(zostalo * zaplanowane / razem);
      dni.forEach((d, i) => {
        const s = i === dni.length - 1 ? zostalo : Math.min(zostalo, Math.round(naDzien[i] * udzial));
        if (s > 0) { wpisy.push({ id: k.id, dzien: d, strony: s, minuty: 0 }); zostalo -= s; czesc[k.id] = (czesc[k.id] || 0) + s; if (czesc[k.id] >= zostaloStron(k)) koniec[k.id] = d; }
      });
    }
  } else {
    let ki = 0, resztaK = ksiazki[0] ? zostaloStron(ksiazki[0]) : 0;
    dni.forEach((d, i) => {
      let budzet = naDzien[i];
      while (budzet > 0 && ki < ksiazki.length) {
        const s = Math.min(budzet, resztaK);
        if (s > 0) { wpisy.push({ id: ksiazki[ki].id, dzien: d, strony: s, minuty: 0 }); czesc[ksiazki[ki].id] = (czesc[ksiazki[ki].id] || 0) + s; }
        budzet -= s; resztaK -= s;
        if (resztaK <= 0 && ksiazki[ki]) koniec[ksiazki[ki].id] = d;
        if (resztaK <= 0) { ki++; resztaK = ksiazki[ki] ? zostaloStron(ksiazki[ki]) : 0; }
      }
    });
  }
  const potrzebaMin = minutZeStron(razem), maszMin = bezCzasu ? 0 : wagi.reduce((a, b) => a + b, 0);
  const dniAktywne = bezCzasu ? dni.length : wagi.filter(v => v > 0).length;
  return {
    wpisy, dni, strony: razem, zaplanowane, potrzebaMin, maszMin, bezCzasu, dniAktywne, limit: limit && !bezCzasu,
    za_duzo: maszMin > 0 && potrzebaMin > maszMin * 1.1,
    minutDziennie: Math.ceil(potrzebaMin / Math.max(1, dniAktywne)),
    naDzien: dni.map((d, i) => ({ d, strony: naDzien[i], min: czasDnia0[i], rezerwa: rezerwa[i], baz: normaDnia(d) })),
    koniec, czesc, baz: bazInfo, bazowaZjada, rezerwa
  };
}

/** Zapisuje rozkład: zastępuje wcześniejsze wpisy tych książek od dnia `od`. */
function rozlozPlan(pn, ids, od = dzisISO(), tryb = Z.ustawienia.trybRozkladu, czasy = null, limit = false) {
  const r = obliczRozklad(pn, ids, { od, tryb, limit, ...(czasy ? { czasy } : {}) });
  if (!r.dni.length) return { dni: 0 };
  const start = r.dni[0];
  const lista = planTygodnia(pn).filter(e => !(ids.includes(e.id) && e.dzien && e.dzien >= start && !e.ukryty));
  lista.push(...r.wpisy);
  for (const id of ids) if (znajdz(id) && !znajdz(id).bazowa && !lista.some(e => e.id === id && !e.dzien)) lista.push({ id, dzien: null, strony: 0, minuty: 0 });
  zapiszPlanTygodnia(pn, lista);
  if (czasy) Z.ustawienia.czasTygodni[pn] = czasy.slice();
  return { ...r, dni: r.dni.length };
}

/**
 * Dobiera książki na tydzień: najpierw te, które już czytasz (najbliżej końca), potem kolejka.
 * krotsze: z kolejki bierze najpierw krótsze, żeby łatwiej dobić do celu liczby książek.
 */
function dobierzKsiazki(ile, { krotsze = false, pomin = [] } = {}) {
  const czyt = czytane().filter(k => !pomin.includes(k.id) && zostaloStron(k) > 0 && !czyTechniczna(k) && !k.bazowa).sort((a, b) => zostaloStron(a) - zostaloStron(b));
  let kol = kolejka().filter(k => !pomin.includes(k.id) && !czyTechniczna(k));
  if (krotsze) kol = [...kol].sort((a, b) => a.strony - b.strony);
  return [...czyt, ...kol].slice(0, ile);
}

/* ---------- losowanie na tydzień z puli moich książek (wersja 2.9) ---------- */
/** Pula: książki, które masz i chcesz losować (bez przeczytanych i porzuconych). */
const pulaLosowania = () => Z.ksiazki.filter(k => k.pula && !['przeczytana', 'porzucona'].includes(k.status))
  .sort((a, b) => (b.dodano || '').localeCompare(a.dodano || '') || a.tytul.localeCompare(b.tytul, 'pl'));
/** Od piątku losujemy już na przyszły tydzień. */
const tydzienDoLosowania = () => dzienTygodnia(dzisISO()) >= 4 ? dodajDni(poczatekTygodnia(), 7) : poczatekTygodnia();

/**
 * Losuje `ile` różnych książek z puli. Opcje: dlugosc ('dowolna'|'krotka'|'srednia'|'dluga'),
 * pomin (id), swieze (pomija książki wylosowane w ostatnich 2 tygodniach, jeśli to możliwe).
 */
function losujNaTydzien(ile, { dlugosc = 'dowolna', pomin = [], swieze = true, pn = tydzienDoLosowania() } = {}) {
  let pula = pulaLosowania().filter(k => !pomin.includes(k.id) && k.status !== 'czytam' && !czyTechniczna(k))
    .filter(k => dlugosc === 'krotka' ? k.strony < 250 : dlugosc === 'srednia' ? k.strony >= 250 && k.strony < 450 : dlugosc === 'dluga' ? k.strony >= 450 : true);
  if (swieze) {
    const ostatnie = new Set([dodajDni(pn, -7), dodajDni(pn, -14)].flatMap(t => (Z.ustawienia.losowania[t] || {}).ids || []));
    const bez = pula.filter(k => !ostatnie.has(k.id));
    if (bez.length >= ile) pula = bez;
  }
  const wynik = [];
  while (wynik.length < ile && pula.length) {
    const k = losujWazone(pula, x => wagaLosowania(x));
    wynik.push(k);
    pula = pula.filter(x => x !== k);
  }
  return wynik;
}

/* ---------- książki techniczne: czytane po kawałku, rozdziałami (wersja 2.9) ---------- */
const czyTechniczna = k => k && k.rodzaj === 'techniczna';
/** Rozdziały w kolejności stron (bez numeru strony zostają na swoim miejscu). */
function rozdzialyK(k) {
  return k.rozdzialy.map((r, i) => ({ ...r, i })).sort((a, b) => (a.od ?? 1e9) - (b.od ?? 1e9) || a.i - b.i);
}
function nastepnyRozdzial(k) { return rozdzialyK(k).find(r => !r.zrobiony) || null; }

/** Odhacza rozdział. Bieżąca strona przesuwa się na koniec rozdziału, a strony trafiają do dziennika. */
function odhaczRozdzial(k, rid, zrobiony = true, data = dzisISO()) {
  const r = k.rozdzialy.find(x => x.id === rid);
  if (!r) return [];
  r.zrobiony = zrobiony;
  r.data = zrobiony ? data : null;
  if (zrobiony) {
    const lista = rozdzialyK(k), i = lista.findIndex(x => x.id === rid);
    const nast = lista.slice(i + 1).find(x => x.od);
    const koniec = nast ? nast.od - 1 : (lista.slice(i + 1).length ? null : k.strony);
    if (koniec && koniec > k.strona) {
      if (k.status !== 'czytam') zacznijCzytac(k, data);
      ustawStrone(k, Math.min(koniec, k.strony), data);
    }
  }
  return [k];
}

/** „1. Wstęp ........ 15” → { tytul: '1. Wstęp', od: 15 } */
function parsujSpis(tekst) {
  return String(tekst || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => {
    const m = l.match(/^(.*?)[\s.…·_–-]*\s(\d{1,4})\s*$/);
    return m && m[1].trim() ? { tytul: m[1].trim().slice(0, 140), od: +m[2] } : { tytul: l.slice(0, 140), od: null };
  });
}
/** Dzieli książkę na n równych części, gdy nie chce się przepisywać spisu treści. */
function podzielNaCzesci(k, n) {
  n = ogranicz(Math.round(n) || 1, 1, 100);
  const krok = k.strony / n;
  return Array.from({ length: n }, (_, i) => ({ id: noweId(), tytul: `Część ${i + 1}`, od: Math.floor(i * krok) + 1, zrobiony: Math.floor((i + 1) * krok) <= k.strona, data: null }));
}

function rozdzialyWTygodniu(k, pn = poczatekTygodnia()) {
  const nd = dodajDni(pn, 6);
  return k.rozdzialy.filter(r => r.zrobiony && r.data && r.data >= pn && r.data <= nd).length;
}
/** Tempo w rozdziałach na tydzień i prognoza końca (techniczne czyta się nieregularnie, więc liczymy od startu). */
function prognozaTechnicznej(k) {
  const zrobione = k.rozdzialy.filter(r => r.zrobiony && r.data).length;
  const zostalo = k.rozdzialy.filter(r => !r.zrobiony).length;
  if (!k.start || !zrobione || !zostalo) return { naTydzien: null, koniec: null, zostalo };
  const tyg = Math.max(1, dniMiedzy(k.start, dzisISO()) + 1) / 7;
  const naTydzien = zrobione / Math.max(1, tyg);
  return { naTydzien, koniec: dodajDni(dzisISO(), Math.ceil(zostalo / naTydzien * 7)), zostalo };
}
const dniBezCzytania = k => dniMiedzy(ostatniaAktywnosc(k), dzisISO());

/* ---------- pożyczki 2.0 i wydatki (wersja 2.11) ---------- */
/** Ile dni do terminu zwrotu (ujemne = po terminie), null gdy bez terminu. */
const dniDoZwrotu = k => k.pozyczona && k.pozyczona.termin ? dniMiedzy(dzisISO(), k.pozyczona.termin) : null;
function zwrocPozyczke(k, data = dzisISO()) {
  const p = k.pozyczona;
  if (!p) return [];
  k.historiaPozyczek = [...(k.historiaPozyczek || []), { kto: p.kto, od: p.data, do: data, kierunek: p.kierunek, typ: p.typ, poTerminie: !!(p.termin && data > p.termin) }].slice(-30);
  k.pozyczona = null;
  return [k];
}
function prolonguj(k, dni) {
  const p = k.pozyczona;
  if (!p) return [];
  p.termin = dodajDni(p.termin && p.termin > dzisISO() ? p.termin : dzisISO(), dni);
  p.prolongaty = (p.prolongaty || 0) + 1;
  return [k];
}
/** Kupione książki z ceną: wydatki w okresie. */
function wydatki(od, doDnia) {
  const lista = Z.ksiazki.filter(k => k.cenaZakupu && k.dataZakupu && k.dataZakupu >= od && k.dataZakupu <= doDnia);
  return { suma: lista.reduce((s, k) => s + k.cenaZakupu, 0), ile: lista.length, lista };
}
const czyOkazja = k => k.status === 'zyczenia' && k.cena && k.cenaDocelowa && k.cena <= k.cenaDocelowa;
const zl = n => `${(+n).toFixed(2).replace('.', ',')} zł`;
function zapiszCene(k, cena, sklep = '') {
  cena = Math.round(+cena * 100) / 100;
  if (!(cena > 0)) { k.cena = null; return [k]; }
  const ost = k.ceny[k.ceny.length - 1];
  if (!ost || ost.cena !== cena || ost.sklep !== sklep) k.ceny = [...k.ceny, { data: dzisISO(), cena, sklep }].slice(-20);
  k.cena = cena;
  return [k];
}

/* ---------- odkrywaj (wersja 2.12) ---------- */
const kluczKsiazki = (tytul, autor = '') => `${tytul}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').split(/[:.(]/)[0].replace(/[^a-z0-9]+/g, ' ').trim() + '|' + String(autor).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').split(/[ ,]/).filter(Boolean).pop();
/** Książki, na których opieramy propozycje: najwyżej ocenione, potem przeczytane i czytane. */
function zrodlaGustu(ile = 6) {
  const oc = Z.ksiazki.filter(k => k.ocena >= 4).sort((a, b) => b.ocena - a.ocena || (b.koniec || '').localeCompare(a.koniec || ''));
  const reszta = Z.ksiazki.filter(k => !oc.includes(k) && ['przeczytana', 'czytam', 'zyczenia'].includes(k.status) && k.autor)
    .sort((a, b) => (b.koniec || b.start || b.dodano || '').localeCompare(a.koniec || a.start || a.dodano || ''));
  return [...oc, ...reszta].filter(k => k.rodzaj !== 'techniczna').slice(0, ile);
}

/** Następna książka do zaczęcia: najpierw z planu tygodnia (najbliższy dzień), potem z losowania, z planu miesiąca, na końcu pierwsza w kolejce. */
function nastepnaKsiazka() {
  const dzis = dzisISO(), czeka = k => k && !['czytam', 'przeczytana', 'porzucona'].includes(k.status) && !k.bazowa;
  for (const pn of [poczatekTygodnia(), dodajDni(poczatekTygodnia(), 7)]) {
    const dni = planTygodniaPelny(pn).filter(e => e.dzien && e.dzien >= dzis && czeka(e.k)).sort((a, b) => a.dzien.localeCompare(b.dzien));
    if (dni[0]) return { k: dni[0].k, powod: dni[0].dzien === dzis ? 'w planie na dziś' : `w planie na ${['poniedziałek', 'wtorek', 'środę', 'czwartek', 'piątek', 'sobotę', 'niedzielę'][dzienTygodnia(dni[0].dzien)]}` };
    const tyd = planTygodnia(pn).filter(e => !e.dzien && !e.ukryty && czeka(e.k));
    if (tyd[0]) return { k: tyd[0].k, powod: pn === poczatekTygodnia() ? 'w planie tego tygodnia' : 'w planie na przyszły tydzień' };
    const los = (Z.ustawienia.losowania[pn] || {}).ids || [];
    const l = los.map(znajdz).find(czeka);
    if (l) return { k: l, powod: 'wylosowana na ten tydzień' };
  }
  const mies = Z.ksiazki.filter(k => k.planMiesiac === dzis.slice(0, 7) && czeka(k)).sort((a, b) => a.kolejnosc - b.kolejnosc)[0];
  if (mies) return { k: mies, powod: 'w planie miesiąca' };
  const k = kolejka().find(x => !czyTechniczna(x));
  return k ? { k, powod: 'pierwsza w kolejce' } : null;
}

/* ---------- kategorie (wersja 2.13) ---------- */
const KATEGORIE = [
  { id: 'fantasy', nazwa: 'Fantasy', emoji: '🐉', wz: /fantasy|fantastyk(?!a naukowa)|baśń|magi|wiedźmin|smok|elf/, ol: 'fantasy' },
  { id: 'scifi', nazwa: 'Sci-fi', emoji: '🚀', wz: /science fiction|sci-?fi|fantastyka naukowa|kosm|cyberpunk|space/, ol: 'science fiction' },
  { id: 'kryminal', nazwa: 'Kryminał', emoji: '🔍', wz: /kryminał|kryminal|detekty|mystery|crime|zbrodni|śledztw/, ol: 'detective and mystery stories' },
  { id: 'thriller', nazwa: 'Thriller', emoji: '🔪', wz: /thriller|sensacj|suspense|szpieg/, ol: 'thriller' },
  { id: 'horror', nazwa: 'Horror', emoji: '👻', wz: /horror|groza|grozy|nadprzyrodz/, ol: 'horror' },
  { id: 'romans', nazwa: 'Romans', emoji: '💕', wz: /romans|romance|miłos|love stor/, ol: 'love stories' },
  { id: 'humor', nazwa: 'Komedia', emoji: '😂', wz: /humor|komedi|satyr|humorystycz|zabawn/, ol: 'humor' },
  { id: 'obyczaj', nazwa: 'Obyczajowa', emoji: '🏡', wz: /obyczaj|domestic|społeczn|social fiction|rodzin/, ol: 'domestic fiction' },
  { id: 'historia', nazwa: 'Historyczna', emoji: '🏰', wz: /histor/, ol: 'historical fiction' },
  { id: 'przygoda', nazwa: 'Przygodowa', emoji: '🧭', wz: /przygod|adventure/, ol: 'adventure stories' },
  { id: 'reportaz', nazwa: 'Reportaż', emoji: '📰', wz: /reportaż|reportaz|literatura faktu|non-?fiction|dziennikarst/, ol: 'reportage' },
  { id: 'biografia', nazwa: 'Biografia', emoji: '👤', wz: /biograf|wspomnien|memoir|pamiętnik/, ol: 'biography' },
  { id: 'nauka', nazwa: 'Popularnonaukowa', emoji: '🔬', wz: /popularnonauk|nauka|popular science|psycholog(?!iczn)|ekonomi|filozof/, ol: 'popular science' },
  { id: 'poradnik', nazwa: 'Poradnik', emoji: '💡', wz: /poradnik|rozwój|self-?help|produktywn|zdrow/, ol: 'self-help' },
  { id: 'mlodziez', nazwa: 'Młodzieżowa', emoji: '🎒', wz: /młodzież|mlodziez|young adult|nastolat/, ol: 'young adult fiction' },
  { id: 'dzieci', nazwa: 'Dla dzieci', emoji: '🧸', wz: /dziecię|dla dzieci|children|juvenile/, ol: 'juvenile fiction' },
  { id: 'poezja', nazwa: 'Poezja', emoji: '🪶', wz: /poezj|wiersz|poetry|poemat/, ol: 'poetry' },
  { id: 'klasyka', nazwa: 'Klasyka', emoji: '🏛️', wz: /klasyk|lektur|classic|powieść polska|literatura polska/, ol: 'classic literature' },
  { id: 'techniczna', nazwa: 'Techniczna', emoji: '💻', wz: /programow|informatyk|technicz|inżynier|kod/, ol: 'computer programming' }
];
const kategoria = id => KATEGORIE.find(c => c.id === id) || null;
/** Kategorie książki: wybrane ręcznie albo rozpoznane z tagów, gatunku z Wikidata i rodzaju. */
function kategorieKsiazki(k) {
  if (k.kategorie && k.kategorie.length) return k.kategorie;
  const tekst = [...(k.tagi || []), ...((k.fakty && k.fakty.gatunek) || []), ...((k.fakty && k.fakty.temat) || [])].join(' ').toLowerCase();
  const wyn = KATEGORIE.filter(c => c.wz.test(tekst)).map(c => c.id);
  if (k.rodzaj === 'techniczna' && !wyn.includes('techniczna')) wyn.push('techniczna');
  return wyn.slice(0, 3);
}

/* ---------- listki, poziomy i zadania dnia (wersja 2.15) ---------- */
const POZIOMY = ['Nowy czytelnik', 'Ciekawski', 'Mól książkowy', 'Pożeracz stron', 'Bibliofil', 'Erudyta', 'Strażnik biblioteki', 'Mistrz zakładki', 'Legenda czytelnictwa'];
const ZADANIA_DNIA = [
  { id: 'str10', nazwa: 'Przeczytaj 10 stron', nagroda: 10, ok: d => d.strony >= 10 },
  { id: 'str25', nazwa: 'Przeczytaj 25 stron', nagroda: 15, ok: d => d.strony >= 25 },
  { id: 'sesja15', nazwa: 'Sesja czytania 15 minut', nagroda: 15, ok: d => d.minuty >= 15 },
  { id: 'cytat', nazwa: 'Zapisz cytat albo notatkę', nagroda: 10, ok: d => d.cytaty >= 1 },
  { id: 'dwie', nazwa: 'Poczytaj dwie różne książki', nagroda: 15, ok: d => d.ksiazki >= 2 },
  { id: 'cel', nazwa: 'Zrób dzienny cel stron', nagroda: 20, ok: d => d.strony >= d.cel },
  { id: 'rozdzial', nazwa: 'Skończ rozdział', nagroda: 10, ok: d => d.rozdzialy >= 1 },
  { id: 'ocena', nazwa: 'Oceń przeczytaną książkę', nagroda: 5, ok: d => d.oceny >= 1 }
];
/** Co się dziś wydarzyło (do zadań dnia). */
function dzisiejszeStatystyki(dzien = dzisISO()) {
  const m = mapaDni();
  return {
    strony: m.get(dzien) || 0, cel: dziennyCel(m),
    minuty: Z.ksiazki.reduce((s, k) => s + k.sesje.filter(x => x.data === dzien).reduce((a, x) => a + x.minuty, 0), 0),
    cytaty: Z.ksiazki.reduce((s, k) => s + k.cytaty.filter(c => c.data === dzien).length, 0),
    ksiazki: Z.ksiazki.filter(k => k.log.some(w => w.data === dzien)).length,
    rozdzialy: Z.ksiazki.reduce((s, k) => s + (k.rozdzialy || []).filter(r => r.zrobiony && r.data === dzien).length, 0),
    oceny: Z.ksiazki.filter(k => k.ocena && k.koniec === dzien).length
  };
}
/** Trzy zadania na dziś — codziennie inne, ale stałe w ciągu dnia. */
function zadaniaDnia(dzien = dzisISO()) {
  const pula = [...ZADANIA_DNIA];
  const wyb = [];
  let h = hashTekstu(dzien);
  while (wyb.length < 3 && pula.length) { const i = h % pula.length; wyb.push(pula.splice(i, 1)[0]); h = Math.floor(h / 7) + 13; }
  const st = dzisiejszeStatystyki(dzien), odebrane = (Z.ustawienia.gra.zadania[dzien] || []);
  return wyb.map(z => ({ ...z, zrobione: z.ok(st), odebrane: odebrane.includes(z.id) }));
}
function hashTekstu(t) { let h = 0; for (const c of String(t)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

/** Listki zdobyte za czytanie — liczone z danych, więc nigdy się nie „gubią”. */
function listkiZdobyte() {
  const m = mapaDni();
  const strony = [...m.values()].reduce((a, b) => a + b, 0);
  const dni = [...m.values()].filter(v => v > 0).length;
  const ksiazki = Z.ksiazki.reduce((s, k) => s + (k.status === 'przeczytana' ? 1 : 0) + k.czytania.length, 0);
  const cytaty = Z.ksiazki.reduce((s, k) => s + k.cytaty.length, 0);
  const naj = najdluzszaSeria(m);
  const passa = (naj >= 7 ? 20 : 0) + (naj >= 30 ? 100 : 0) + (naj >= 100 ? 300 : 0) + (naj >= 365 ? 1000 : 0);
  const zadania = Object.entries(Z.ustawienia.gra.zadania).reduce((s, [, ids]) => s + ids.reduce((a, id) => a + ((ZADANIA_DNIA.find(z => z.id === id) || {}).nagroda || 0), 0), 0);
  return { razem: Math.floor(strony / 10) + dni * 5 + ksiazki * 30 + cytaty * 3 + passa + zadania, strony: Math.floor(strony / 10), dni: dni * 5, ksiazki: ksiazki * 30, cytaty: cytaty * 3, passa, zadania };
}
const listkiStan = () => { const z = listkiZdobyte(); return { ...z, saldo: Math.max(0, z.razem - Z.ustawienia.gra.wydane) }; };
/** Poziom z doświadczenia (wszystkie zdobyte listki, także wydane). */
function poziom(xp = listkiZdobyte().razem) {
  let n = 0, prog = 0, nast = 50;
  while (xp >= nast && n < 98) { n++; prog = nast; nast = Math.round(nast + 60 * Math.pow(n + 1, 1.35)); }
  return { n: n + 1, nazwa: POZIOMY[Math.min(POZIOMY.length - 1, Math.floor(n / 2))], xp, prog, nast, proc: (xp - prog) / (nast - prog) * 100 };
}
const SKLEP = [
  { id: 'okulary', nazwa: 'Okulary do czytania', emoji: '👓', cena: 40 },
  { id: 'szalik', nazwa: 'Ciepły szalik', emoji: '🧣', cena: 70 },
  { id: 'kubek', nazwa: 'Kubek kakao', emoji: '☕', cena: 60 },
  { id: 'kwiat', nazwa: 'Kwiatek za uchem', emoji: '🌸', cena: 50 },
  { id: 'czapka', nazwa: 'Czapka czarodzieja', emoji: '🎩', cena: 150 },
  { id: 'lampka', nazwa: 'Lampka do czytania', emoji: '💡', cena: 120 },
  { id: 'korona', nazwa: 'Korona Mistrza', emoji: '👑', cena: 400 },
  { id: 'zamrozenie', nazwa: 'Zamrożenie passy (ten miesiąc)', emoji: '🧊', cena: 120, zuzywalne: true }
];
function kup(id) {
  const p = SKLEP.find(x => x.id === id), g = Z.ustawienia.gra;
  if (!p) return { blad: 'Nie ma takiej rzeczy.' };
  if (!p.zuzywalne && g.kupione.includes(id)) return { blad: 'Już to masz.' };
  if (listkiStan().saldo < p.cena) return { blad: `Brakuje ${p.cena - listkiStan().saldo} listków.` };
  g.wydane += p.cena;
  if (p.zuzywalne) { const m = dzisISO().slice(0, 7); g.zamrozeniaKupione[m] = (g.zamrozeniaKupione[m] || 0) + 1; }
  else { g.kupione.push(id); if (!g.zalozone.includes(id)) g.zalozone.push(id); }
  return { ok: true, p };
}
