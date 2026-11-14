'use strict';
/* Zakładka — model danych, operacje na książkach i obliczenia */

const WERSJA = '2.7.0';
const POSREDNIK_BN = 'https://spring-mud-cef8.kwiatkowskibartlomiej57.workers.dev';
const DOMYSLNE = { imie: '', cel: 200, start: '2026-09-01', koniec: '2027-08-31', srednia: 300, dziennyCel: 0, motyw: 'auto', tydzienStrony: 0, tydzienKsiazki: 0, miesiacStrony: 0, miesiacKsiazki: 0, celeMiesiecy: {}, googleKlucz: '', posrednik: '', planyTygodni: {}, przypomnienie: { wlaczone: false, godzina: '20:00', dni: [0, 1, 2, 3, 4, 5, 6] }, seria: { prog: 1, dniWolne: [], zamrozenia: 0, cel: 0 }, czasDni: [30, 30, 30, 30, 30, 60, 60], stalePlany: [], trybRozkladu: 'kolejno' };
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
    cena: +k.cena > 0 ? Math.round(+k.cena * 100) / 100 : null,
    link: /^https?:\/\//.test(String(k.link || '')) ? String(k.link).slice(0, 500) : '',
    priorytet: ogranicz(Math.round(+k.priorytet) || 0, 0, 3),
    pozyczona: k.pozyczona && String(k.pozyczona.kto || '').trim()
      ? { kto: String(k.pozyczona.kto).trim().slice(0, 60), data: poprawnaData(k.pozyczona.data) ? k.pozyczona.data : dzisISO(), kierunek: k.pozyczona.kierunek === 'od' ? 'od' : 'komus' }
      : null
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
  for (const b of Z.ksiazki) if (b.bazowa && b !== k) { b.bazowa = false; zmienione.push(b); }
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
const bazowa = () => Z.ksiazki.find(k => k.bazowa && k.status === 'czytam') || null;

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
  const pierwszy = m.size ? [...m.keys()].reduce((a, b) => (a < b ? a : b)) : dzis;
  let n = 0, start = null, i = 0;
  while (i++ < 4000) {
    const r = rodzajDnia(d, m, u);
    if (r === 'czytal') { n++; start = d; }
    else if (r === 'wolny') wolne.push(d);
    else {
      const mies = d.slice(0, 7);
      if ((zuzyte[mies] || 0) < u.zamrozenia && n > 0) { zuzyte[mies] = (zuzyte[mies] || 0) + 1; zamrozone.push(d); }
      else break;
    }
    d = dodajDni(d, -1);
    if (d < pierwszy) break;
  }
  const tenMies = dzis.slice(0, 7);
  return {
    dni: n, start, zamrozone: zamrozone.filter(x => !start || x > start), wolne: wolne.filter(x => !start || x > start),
    zamrozeniaZostalo: Math.max(0, u.zamrozenia - (zuzyte[tenMies] || 0)), dzisZrobione: rodzajDnia(dzis, m, u) === 'czytal',
    dzisWolny: rodzajDnia(dzis, m, u) === 'wolny', cel: u.cel, prog: u.prog
  };
}
function seriaAktualna(m) { return seriaSzczegoly(m).dni; }

function najdluzszaSeria(m, u = ustSerii()) {
  const klucze = [...m.keys()].filter(d => (m.get(d) || 0) > 0).sort();
  if (!klucze.length) return 0;
  let naj = 0, teraz = 0;
  const zuzyte = {};
  for (let d = klucze[0], i = 0; d <= klucze[klucze.length - 1] && i < 4000; d = dodajDni(d, 1), i++) {
    const r = rodzajDnia(d, m, u);
    if (r === 'czytal') { teraz++; naj = Math.max(naj, teraz); }
    else if (r === 'brak') {
      const mies = d.slice(0, 7);
      if (teraz > 0 && (zuzyte[mies] || 0) < u.zamrozenia) zuzyte[mies] = (zuzyte[mies] || 0) + 1;
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
    ksiazki: u.tydzienKsiazki || (w ? Math.max(0.5, zaokr1(u.cel * 7 / dniCalosc)) : 0),
    autoStrony: !u.tydzienStrony, autoKsiazki: !u.tydzienKsiazki
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
const pozyczoneKsiazki = () => Z.ksiazki.filter(k => k.pozyczona).sort((a, b) => a.pozyczona.data.localeCompare(b.pozyczona.data));

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
const tempoPlanu = () => tempoOgolne() || 30; // stron na godzinę; bez sesji zakładamy 30
const stronZMinut = min => Math.round(min * tempoPlanu() / 60);
const minutZeStron = str => Math.round(str * 60 / tempoPlanu());
const czasDnia = iso => (Z.ustawienia.czasDni || [])[dzienTygodnia(iso)] ?? 30;

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

/** Plan tygodnia razem ze stałymi planami i stanem każdego wpisu. */
function planTygodniaPelny(pn = poczatekTygodnia()) {
  return [...planTygodnia(pn).filter(e => !e.ukryty), ...wpisyStale(pn)].map(e => ({ ...e, ...stanWpisuPelny(e, pn) }));
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
 * Rozkłada pozostałe strony książek na dni od `od` do niedzieli, proporcjonalnie do czasu na czytanie w danym dniu.
 * tryb 'kolejno': najpierw kończy pierwszą książkę, potem następną; 'rownolegle': każda po trochu codziennie.
 */
function rozlozPlan(pn, ids, od = dzisISO(), tryb = Z.ustawienia.trybRozkladu) {
  const nd = dodajDni(pn, 6), start = od < pn ? pn : od;
  if (start > nd) return { dni: 0 };
  const dni = [];
  for (let d = start; d <= nd; d = dodajDni(d, 1)) dni.push(d);
  let wagi = dni.map(czasDnia);
  if (!wagi.some(v => v > 0)) wagi = dni.map(() => 1);
  const sumaW = wagi.reduce((a, b) => a + b, 0);
  const ksiazki = ids.map(znajdz).filter(k => k && zostaloStron(k) > 0);
  const razem = ksiazki.reduce((s, k) => s + zostaloStron(k), 0);
  // ile stron przypada na każdy dzień (zaokrąglenia narastająco, żeby suma się zgadzała)
  const naDzien = [];
  let nar = 0;
  wagi.forEach((w, i) => { const przed = Math.round(razem * nar / sumaW); nar += w; naDzien[i] = Math.round(razem * nar / sumaW) - przed; });
  let lista = planTygodnia(pn).filter(e => !(ids.includes(e.id) && e.dzien && e.dzien >= start));
  if (tryb === 'rownolegle') {
    for (const k of ksiazki) {
      const udzial = zostaloStron(k) / razem;
      let zostalo = zostaloStron(k);
      dni.forEach((d, i) => {
        const s = i === dni.length - 1 ? zostalo : Math.min(zostalo, Math.round(naDzien[i] * udzial));
        if (s > 0) { lista.push({ id: k.id, dzien: d, strony: s, minuty: 0 }); zostalo -= s; }
      });
    }
  } else {
    let ki = 0, resztaK = ksiazki[0] ? zostaloStron(ksiazki[0]) : 0;
    dni.forEach((d, i) => {
      let budzet = naDzien[i];
      while (budzet > 0 && ki < ksiazki.length) {
        const s = Math.min(budzet, resztaK);
        if (s > 0) lista.push({ id: ksiazki[ki].id, dzien: d, strony: s, minuty: 0 });
        budzet -= s; resztaK -= s;
        if (resztaK <= 0) { ki++; resztaK = ksiazki[ki] ? zostaloStron(ksiazki[ki]) : 0; }
      }
    });
  }
  for (const k of ksiazki) if (!lista.some(e => e.id === k.id && !e.dzien)) lista.push({ id: k.id, dzien: null, strony: 0, minuty: 0 });
  zapiszPlanTygodnia(pn, lista);
  const potrzebaMin = minutZeStron(razem), maszMin = dni.reduce((s, d) => s + czasDnia(d), 0);
  return { dni: dni.length, strony: razem, potrzebaMin, maszMin, za_duzo: maszMin > 0 && potrzebaMin > maszMin * 1.1 };
}
