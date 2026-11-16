'use strict';
/* Zakładka — interfejs */

/* ================= narzędzia ================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* tryb prywatny */ } }

const MIES_KR = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
const dataDluga = (iso, rok = true) => doDaty(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', ...(rok ? { year: 'numeric' } : {}), timeZone: 'UTC' });
const dataKrotka = iso => `${+iso.slice(8)} ${MIES_KR[+iso.slice(5, 7) - 1]}`;
const dataDzis = () => new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

const U = {
  widok: ['dzis', 'biblioteka', 'losuj', 'statystyki', 'cytaty', 'ustawienia'].includes(lsGet('zakladka-widok')) ? lsGet('zakladka-widok') : 'dzis',
  polka: 'czytam', szukaj: '', sort: 'domyslnie', tag: null, szukajCytat: '',
  pierwszyRender: true, instalacja: null, skaner: false, dzien: dzisISO(),
  losTryb: lsGet('zakladka-los-tryb') === 'odkrywaj' ? 'odkrywaj' : 'losuj'
};

/* ================= ikony ================= */
const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  dzis: svg('<path d="M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1z"/>'),
  biblioteka: svg('<rect x="3" y="4" width="4" height="16" rx="1"/><rect x="9" y="4" width="4" height="16" rx="1"/><path d="M15.2 5.4l3.6-1.1 3.9 14.9-3.6 1.1z"/>'),
  statystyki: svg('<path d="M3 21h18M6 17v-5M11 17V6M16 17v-8M21 17v-3"/>'),
  cytaty: svg('<path d="M10 7H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3v1a3 3 0 0 1-3 3M20 7h-4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3v1a3 3 0 0 1-3 3"/>'),
  ustawienia: svg('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  szukaj: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  aparat: svg('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>'),
  skaner: svg('<path d="M3 7V4h3M18 4h3v3M21 17v3h-3M6 20H3v-3M7 8v8M10 8v8M13 8v8M17 8v8"/>'),
  zegar: svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  kopiuj: svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  udostepnij: svg('<path d="M12 3v12M8 7l4-4 4 4M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/>'),
  kosz: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  edytuj: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>'),
  gora: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  dol: svg('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  zamknij: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  plomien: svg('<path d="M12 21c-4 0-7-2.8-7-6.5 0-3 2-5 3.5-6.5.3 2 1.3 3 2.5 3.5C11 8 12 5 14.5 3c.5 3 4.5 5.5 4.5 11 0 4-3 7-7 7z"/>'),
  gwiazda: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="currentColor"/></svg>',
  pobierz: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  wgraj: svg('<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>'),
  obraz: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>'),
  pauza: svg('<path d="M9 5v14M15 5v14"/>'),
  graj: svg('<path d="M7 4.5v15l12-7.5z"/>'),
  kostka: svg('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/>'),
  medal: svg('<circle cx="12" cy="14" r="6"/><path d="M8.5 9.2L6 3h4l2 4 2-4h4l-2.5 6.2M12 11.5l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3z"/>'),
  kalendarz: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7.5 14h2M11 14h2M14.5 14h2M7.5 17.5h2M11 17.5h2"/>'),
  wstecz: svg('<path d="M15 5l-7 7 7 7"/>'),
  dalej: svg('<path d="M9 5l7 7-7 7"/>'),
  reka: svg('<path d="M3 13h3l4 2h4a1.5 1.5 0 0 1 0 3h-4M14 18l5-3a1.6 1.6 0 0 1 2 2.4L15 21H8l-5-2"/><rect x="11" y="3" width="8" height="9" rx="1"/>'),
  dzwonek: svg('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
  losuj: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/>'),
  rok: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2"/>')
};
const LOGO = '<svg class="logo" viewBox="100 120 312 340" aria-hidden="true"><path d="M118 380c56-7 104 0 138 24 34-24 82-31 138-24v16c-56-7-104 0-138 24-34-24-82-31-138-24z" fill="var(--zloto)"/><path d="M256 170c-34-23-82-31-138-25v235c56-7 104 0 138 24z" fill="var(--strona-l)"/><path d="M256 170c34-23 82-31 138-25v235c-56-7-104 0-138 24z" fill="var(--strona-p)"/><path d="M318 132h34v318l-17-21-17 21z" fill="var(--wstazka)"/></svg>';

/* ================= elementy wspólne ================= */
const PLOTNA = ['#1f4a3d', '#6b1e2c', '#22385c', '#7a5218', '#4a2f52', '#38474f', '#5c3b23', '#24555a'];
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }

function okladka(k, rozmiar = 'm') {
  const kolor = PLOTNA[hash(k.tytul + k.autor) % PLOTNA.length];
  const inicjal = esc((k.tytul.match(/[\p{L}\p{N}]/u) || ['?'])[0].toUpperCase());
  const gen = `<span class="okl-gen" style="--kolor:${kolor}"><span class="okl-inicjal">${inicjal}</span><span class="okl-tytul">${esc(k.tytul)}</span><span class="okl-autor">${esc(k.autor)}</span></span>`;
  const img = k.okladka ? `<img src="${esc(k.okladka)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : '';
  return `<span class="okl okl-${rozmiar}">${gen}${img}</span>`;
}

function pasek(proc, { plan = null, duzy = false } = {}) {
  const p = ogranicz(proc || 0, 0, 100);
  return `<span class="pasek${duzy ? ' pasek-duzy' : ''}" role="progressbar" aria-valuenow="${Math.round(p)}" aria-valuemin="0" aria-valuemax="100" aria-label="Postęp ${Math.round(p)}%">
    <span class="pasek-wyp" style="width:${p}%"></span>
    ${plan != null ? `<span class="pasek-plan" style="left:${ogranicz(plan, 0, 100)}%" title="Tu powinieneś być na koniec dnia"></span>` : ''}
    ${duzy ? `<span class="pasek-wstazka" style="left:${p}%"></span>` : ''}
  </span>`;
}

function pierscien(wart, cel) {
  const r = 50, obw = 2 * Math.PI * r, p = cel ? Math.min(1, wart / cel) : 0;
  return `<svg class="pierscien" viewBox="0 0 120 120" aria-hidden="true">
    <circle cx="60" cy="60" r="${r}" class="pr-tlo"/>
    <circle cx="60" cy="60" r="${r}" class="pr-wyp${p >= 1 ? ' pr-pelny' : ''}" stroke-dasharray="${obw.toFixed(1)}" stroke-dashoffset="${(obw * (1 - p)).toFixed(1)}" transform="rotate(-90 60 60)"/>
  </svg>`;
}

function gwiazdki(k) {
  return `<div class="gwiazdki" role="group" aria-label="Ocena">${[1, 2, 3, 4, 5].map(n =>
    `<button type="button" class="gwiazdka${k.ocena >= n ? ' wl' : ''}" data-akcja="ocena" data-id="${k.id}" data-n="${n}" aria-label="${n} na 5" aria-pressed="${k.ocena >= n}">${I.gwiazda}</button>`).join('')}</div>`;
}

function radio(nazwa, wartosc, etykieta, zaznaczony = false) {
  return `<label class="seg"><input type="radio" name="${nazwa}" value="${esc(wartosc)}"${zaznaczony ? ' checked' : ''}><span>${etykieta}</span></label>`;
}

function statusKsiazki(k) {
  if (k.status === 'czytam') return k.bazowa ? 'Książka bazowa' : 'Czytam';
  if (k.status === 'doPrzeczytania') return `Do przeczytania, nr ${kolejka().indexOf(k) + 1} w kolejce`;
  if (k.status === 'przeczytana') return k.koniec ? `Przeczytana ${dataDluga(k.koniec)}` : 'Przeczytana';
  if (k.status === 'pozniej') return `Na później${k.odlozono ? ` od ${dataDluga(k.odlozono)}` : ''}${k.strona ? `, przerwana na s. ${k.strona}` : ''}`;
  if (k.status === 'zyczenia') return `Lista życzeń${k.priorytet ? ', ' + ['', 'chcę', 'bardzo chcę', 'muszę mieć'][k.priorytet] : ''}${k.cena ? `, ${k.cena.toFixed(2).replace('.', ',')} zł` : ''}`;
  return k.porzucono ? `Porzucona ${dataDluga(k.porzucono)}` : 'Porzucona';
}

/* ================= toasty ================= */
function toast(tekst, { akcja, onAkcja, typ, czas = 3500 } = {}) {
  const el = document.createElement('div');
  el.className = 'toast' + (typ ? ' toast-' + typ : '');
  el.setAttribute('role', typ === 'blad' ? 'alert' : 'status');
  const s = document.createElement('span');
  s.textContent = tekst;
  el.append(s);
  const zamknij = () => { el.classList.remove('widoczny'); setTimeout(() => el.remove(), 220); };
  if (akcja) {
    const b = document.createElement('button');
    b.className = 'toast-akcja';
    b.textContent = akcja;
    b.addEventListener('click', () => { onAkcja(); zamknij(); });
    el.append(b);
    czas = Math.max(czas, 6000);
  }
  $('#toasty').append(el);
  requestAnimationFrame(() => el.classList.add('widoczny'));
  setTimeout(zamknij, czas);
}

/* ================= arkusze (okna od dołu) ================= */
const otwarte = [];

function arkusz({ tytul = '', render, klasa = '', ukryjTytul = false, onZamknij, odswiezalny = false, ksiazkaId = null }) {
  const tlo = document.createElement('div');
  tlo.className = 'arkusz-tlo';
  tlo.innerHTML = `<div class="arkusz ${klasa}" role="dialog" aria-modal="true" aria-label="${esc(tytul)}" tabindex="-1">
    <div class="arkusz-gora"><h2 class="${ukryjTytul ? 'sr' : ''}">${esc(tytul)}</h2><button type="button" class="btn-ikona" data-zamknij aria-label="Zamknij">${I.zamknij}</button></div>
    <div class="arkusz-tresc"></div>
  </div>`;
  const a = { tlo, el: $('.arkusz', tlo), tresc: $('.arkusz-tresc', tlo), odswiezalny, ksiazkaId, zamkniety: false, poprzedniFokus: document.activeElement };
  a.rysuj = () => {
    const pozycja = a.el.scrollTop;
    const rozwiniete = $$('details', a.tresc).map(d => d.open);
    a.tresc.innerHTML = render(a);
    $$('details', a.tresc).forEach((d, i) => { if (rozwiniete[i]) d.open = true; });
    a.el.scrollTop = pozycja;
  };
  a.zamknij = wynik => {
    if (a.zamkniety) return;
    a.zamkniety = true;
    otwarte.splice(otwarte.indexOf(a), 1);
    tlo.classList.remove('widoczny');
    setTimeout(() => tlo.remove(), 220);
    document.body.classList.toggle('arkusz-otwarty', otwarte.length > 0);
    if (a.poprzedniFokus && document.contains(a.poprzedniFokus)) a.poprzedniFokus.focus({ preventScroll: true });
    if (onZamknij) onZamknij(wynik);
    renderPigulka();
  };
  tlo.addEventListener('click', e => {
    if (e.target === tlo || e.target.closest('[data-zamknij]')) a.zamknij();
  });
  document.body.append(tlo);
  przeciaganieArkusza(a);
  otwarte.push(a);
  document.body.classList.add('arkusz-otwarty');
  a.rysuj();
  requestAnimationFrame(() => {
    tlo.classList.add('widoczny');
    const pierwsze = $('[autofocus]', a.el);
    (pierwsze || a.el).focus({ preventScroll: true });
  });
  return a;
}

function potwierdz(tresc, { tytul = 'Na pewno?', tak = 'Tak', nie = 'Anuluj', niebezpieczne = false } = {}) {
  return new Promise(ok => {
    let wynik = false;
    const a = arkusz({
      tytul, klasa: 'arkusz-maly', onZamknij: () => ok(wynik),
      render: () => `<p class="potwierdz-tresc">${tresc}</p>
        <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>${esc(nie)}</button>
        <button type="button" class="btn ${niebezpieczne ? 'btn-niebezpieczny' : 'btn-glowny'}" data-tak autofocus>${esc(tak)}</button></div>`
    });
    $('[data-tak]', a.tresc).addEventListener('click', () => { wynik = true; a.zamknij(); });
  });
}

/* ================= zapis ================= */
function bladZapisu(e) {
  console.error(e);
  toast('Nie udało się zapisać na urządzeniu. Sprawdź wolne miejsce i zrób kopię zapasową.', { typ: 'blad', czas: 7000 });
}
async function utrwal(...lista) {
  try { for (const k of lista.flat()) if (k) await Baza.zapisz(k); } catch (e) { bladZapisu(e); }
}
async function utrwalUstawienia() {
  lsSet('zakladka-motyw', Z.ustawienia.motyw);
  try { await Baza.zapiszUstawienia(Z.ustawienia); } catch (e) { bladZapisu(e); }
}

function odswiez() {
  renderWidok();
  for (const a of [...otwarte]) {
    if (a.ksiazkaId && !znajdz(a.ksiazkaId)) a.zamknij();
    else if (a.odswiezalny) a.rysuj();
  }
  renderPigulka();
  sprawdzOdznaki();
  sprawdzCele();
  sprawdzHistorie();
  sprawdzBingo();
  const sr = stronyRazem();
  if (U.stronyPoprz != null && sr > U.stronyPoprz) reakcjaNaStrony(sr - U.stronyPoprz);
  U.stronyPoprz = sr;
}

/* ================= motyw ================= */
function zastosujMotyw() {
  const m = Z.ustawienia.motyw, html = document.documentElement;
  if (m === 'jasny') html.dataset.theme = 'light';
  else if (m === 'ciemny') html.dataset.theme = 'dark';
  else delete html.dataset.theme;
  const ciemny = m === 'ciemny' || (m === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  $('meta[name="theme-color"]').setAttribute('content', ciemny ? '#0f1b17' : '#e7ebe3');
}

/* ================= widok: Dziś ================= */
function powitanie() {
  const h = new Date().getHours();
  const t = h < 5 ? 'Dobranoc' : h < 12 ? 'Dzień dobry' : h < 18 ? 'Cześć' : 'Dobry wieczór';
  return Z.ustawienia.imie ? `${t}, ${esc(Z.ustawienia.imie)}` : t;
}

function banery() {
  const out = [];
  const ost = lsGet('zakladka-kopia');
  const odlozone = lsGet('zakladka-kopia-odloz');
  const dni = ost ? dniMiedzy(ost, dzisISO()) : null;
  if (Z.ksiazki.length >= 3 && (dni === null || dni >= 7) && !(odlozone && odlozone > dzisISO())) {
    out.push(`<div class="baner"><p>${dni === null ? 'Nie masz jeszcze kopii zapasowej.' : `Ostatnia kopia zapasowa była ${dni} dni temu.`} Zapisz ją na Dysku albo w plikach telefonu.</p>
      <div class="przyciski"><button type="button" class="btn btn-glowny" data-akcja="kopia">Zrób kopię</button><button type="button" class="btn-tekst" data-akcja="kopia-pozniej">Później</button></div></div>`);
  }
  return out.join('');
}

function widokPowitalny() {
  return `<section class="powitalny">
    <div class="powitalny-logo">${LOGO}</div>
    <h1>Zakładka</h1>
    <p class="powitalny-lead">Dziennik czytania, który pamięta, gdzie skończyłeś.</p>
    <ul class="powitalny-lista">
      <li><strong>Książka bazowa.</strong> Jedna długa książka na kilka miesięcy i dzienna norma stron, żeby zdążyć.</li>
      <li><strong>Kilka książek naraz.</strong> Krótsze czytasz obok i każdą śledzisz osobno.</li>
      <li><strong>Cel roczny.</strong> Widzisz, ile stron dziennie potrzebujesz i czy idziesz zgodnie z planem.</li>
      <li><strong>Cytaty i notatki.</strong> Zapisujesz zdania z numerem strony.</li>
    </ul>
    <div class="przyciski"><button type="button" class="btn btn-glowny" data-akcja="dodaj">Dodaj pierwszą książkę</button>
      <button type="button" class="btn" data-akcja="import-goodreads">Importuj z Goodreads</button></div>
    <p class="cichy">Masz kopię z innego telefonu? <button type="button" class="btn-tekst" data-akcja="import-json">Wczytaj kopię</button></p>
  </section>`;
}

function blokBazowej(k) {
  const p = planBazowej(k);
  const proc = k.strona / k.strony * 100;
  const tempo = tempoKsiazki(k) || tempoOgolne();
  const plan = p.stan === 'przed' ? `${ile(p.roznica, FORMY_STRON)} przed planem`
    : p.stan === 'za' ? `${ile(p.roznica, FORMY_STRON)} za planem` : 'Idziesz zgodnie z planem';
  const termin = p.poTerminie ? `minął ${dataDluga(k.celData, false)}`
    : p.dni === 1 ? 'dziś' : `${dataDluga(k.celData, false)}, za ${ile(p.dni, FORMY_DNI)}`;
  const brakuje = p.norma - p.dzisiaj;
  return `<section class="bazowa${U.pierwszyRender ? ' animuj' : ''}" aria-label="Książka bazowa">
    <p class="bazowa-etykieta">Książka bazowa</p>
    <button type="button" class="bazowa-ksiazka" data-akcja="ksiazka" data-id="${k.id}">${okladka(k, 's')}
      <span class="bazowa-tekst"><span class="bazowa-tytul">${esc(k.tytul)}</span><span class="bazowa-autor">${esc(k.autor)}</span></span></button>
    <p class="bazowa-strona"><span>Strona <strong>${k.strona}</strong> z ${k.strony}</span><span>${Math.floor(proc)}%</span></p>
    ${pasek(proc, { plan: p.planDzis / k.strony * 100, duzy: true })}
    <dl class="bazowa-fakty">
      <div><dt>Dziś</dt><dd>${p.dzisiaj} z ${p.norma} ${odmiana(p.norma, FORMY_STRON_D)} ${p.zrobione ? `<span class="znacznik znacznik-ok">${I.check}norma zrobiona</span>` : `<span class="znacznik">brakuje ${brakuje}</span>`}</dd></div>
      <div><dt>Plan</dt><dd class="${p.stan === 'za' ? 'zle' : ''}">${plan}</dd></div>
      <div><dt>Termin</dt><dd>${termin}</dd></div>
      ${tempo ? `<div><dt>Do końca</dt><dd>ok. ${czasCzytania(p.zostalo / tempo)} czytania</dd></div>` : ''}
    </dl>
    <div class="przyciski">
      <button type="button" class="btn btn-zloty" data-akcja="postep" data-id="${k.id}">Zapisz postęp</button>
      <button type="button" class="btn btn-na-plotnie" data-akcja="sesja" data-id="${k.id}">${I.zegar}Sesja</button>
      ${p.poTerminie ? `<button type="button" class="btn btn-na-plotnie" data-akcja="bazowa" data-id="${k.id}">Przesuń termin</button>` : ''}
    </div>
  </section>`;
}

function blokBezBazowej() {
  return `<section class="bazowa bazowa-pusta" aria-label="Książka bazowa">
    <p class="bazowa-etykieta">Książka bazowa</p>
    <h2>Wybierz jedną długą książkę na kilka miesięcy</h2>
    <p>Czytasz ją codziennie, a Zakładka liczy dzienną normę stron, żeby zdążyć przed terminem.</p>
    <div class="przyciski"><button type="button" class="btn btn-zloty" data-akcja="wybierz-bazowa">Wybierz z biblioteki</button>
      <button type="button" class="btn btn-na-plotnie" data-akcja="dodaj" data-jako="bazowa">Dodaj nową</button></div>
  </section>`;
}

function wierszCzytanej(k) {
  const proc = k.strona / k.strony * 100;
  const dzis = stronyKsiazkiDnia(k, dzisISO());
  const prog = prognozaKsiazki(k);
  return `<li class="wiersz">
    <button type="button" class="wiersz-glowny" data-akcja="ksiazka" data-id="${k.id}">${okladka(k, 's')}
      <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">${esc(k.autor || FORMATY[k.format])}</span>
      ${pasek(proc)}<span class="wiersz-info">Strona ${k.strona} z ${k.strony}${dzis ? `, dziś +${dzis}` : ''}${prog ? `. Skończysz ok. ${dataKrotka(prog)}` : ''}</span></span>
    </button>
    <span class="wiersz-akcje">
      <button type="button" class="btn-ikona" data-akcja="postep" data-id="${k.id}" aria-label="Zapisz postęp: ${esc(k.tytul)}">${I.plus}</button>
      <button type="button" class="btn-ikona" data-akcja="sesja" data-id="${k.id}" aria-label="Sesja czytania: ${esc(k.tytul)}">${I.zegar}</button>
    </span>
  </li>`;
}

function blokCelu(m) {
  const u = Z.ustawienia, g = postepCelu(m);
  let tresc;
  if (g.przedStartem) tresc = `<p>Odliczanie startuje ${dataDluga(u.start)}.</p>`;
  else if (g.poKoncu) tresc = `<p>Okres celu skończył się ${dataDluga(u.koniec)}. Ustaw nowy w ustawieniach.</p>`;
  else if (!g.zostalo) tresc = '<p class="ok">Cel osiągnięty. Każda kolejna książka to nadwyżka.</p>';
  else {
    tresc = `<p>Potrzebujesz ${ulamek(g.tygodniowo)} książki tygodniowo, czyli ok. ${ile(g.stronDziennie, FORMY_STRON)} dziennie.</p>
      <p class="${g.roznica >= 0 ? 'ok' : 'zle'}">${g.roznica > 0 ? `Masz ${ile(g.roznica, FORMY_KSIAZEK_B)} zapasu względem planu.`
        : g.roznica === 0 ? 'Idziesz dokładnie zgodnie z planem.'
        : `Do planu brakuje ci ${ile(-g.roznica, FORMY_KSIAZEK_D)}.`}</p>
      ${g.tempo > 0 ? `<p class="cichy">Przy tempie z ostatnich tygodni (${Math.round(g.tempo)} str. dziennie) wyjdzie ok. ${ile(g.prognoza, FORMY_KSIAZEK)} do ${dataDluga(u.koniec)}.</p>` : ''}`;
  }
  return `<section class="sekcja cel">
    <div class="sekcja-gora"><h2>Cel roczny</h2><button type="button" class="btn-tekst" data-akcja="idz" data-widok="ustawienia">Zmień</button></div>
    <p class="cel-liczby"><strong>${g.przeczytane}</strong><span>z ${ile(u.cel, FORMY_KSIAZEK_D)}</span></p>
    ${pasek(g.przeczytane / u.cel * 100, { plan: g.przedStartem || g.poKoncu ? null : g.oczekiwanyProc })}
    ${tresc}
  </section>`;
}

function cytatDnia() {
  const wszystkie = Z.ksiazki.flatMap(k => k.cytaty.filter(c => !c.notatka).map(c => ({ c, k })));
  if (!wszystkie.length) return '';
  const { c, k } = wszystkie[hash(dzisISO()) % wszystkie.length];
  return `<section class="sekcja cytat-dnia">
    <h2>Z twoich cytatów</h2>
    <blockquote>${esc(c.tekst)}</blockquote>
    <p class="cichy"><button type="button" class="btn-tekst" data-akcja="ksiazka" data-id="${k.id}">${esc(k.tytul)}</button>${c.strona ? `, s. ${c.strona}` : ''}</p>
  </section>`;
}

function widokDzis() {
  if (!Z.ksiazki.length) return widokPowitalny();
  const m = mapaDni(), dzis = dzisISO();
  const dzisStron = m.get(dzis) || 0;
  const cel = dziennyCel(m);
  const seria = seriaAktualna(m);
  let tydzien = 0;
  for (let d = dodajDni(dzis, -dzienTygodnia(dzis)); d <= dzis; d = dodajDni(d, 1)) tydzien += m.get(d) || 0;
  const baz = bazowa();
  const pob = czytane().filter(k => !k.bazowa && !czyTechniczna(k));
  const nastI = nastepnaKsiazka(), nast = nastI && nastI.k;
  const brak = cel - dzisStron;
  const doZapisu = baz || czytane()[0];
  const ss = seriaSzczegoly(m);
  const zagrozona = !ss.dzisZrobione && !ss.dzisWolny && seria > 0 && new Date().getHours() >= 17
    ? `<div class="baner baner-seria"><p>${I.plomien}<span>Twoja seria <strong>${ile(seria, FORMY_DNI)}</strong> skończy się o północy. Wystarczy jedna strona, żeby ją utrzymać.</span></p>
      ${doZapisu ? `<div class="przyciski"><button type="button" class="btn btn-glowny" data-akcja="postep" data-id="${doZapisu.id}">Zapisz postęp</button><button type="button" class="btn" data-akcja="sesja" data-id="${doZapisu.id}">${I.zegar}Sesja</button></div>` : ''}</div>` : '';
  return `${stosBanerow([banerPozyczek(), zagrozona, banery(), banerLosowania()])}
  <section class="powitanie">${scenaPory()}
    <p class="powitanie-data">${dataDzis()}</p>
    <h1>${powitanie()}</h1>
  </section>
  ${Z.ustawienia.gra.sowka ? htmlSowki() : ''}
  <section class="dzien" aria-label="Dzisiejsze czytanie">
    <div class="dzien-pierscien">${pierscien(dzisStron, cel)}
      <div class="dzien-liczba"><strong data-licz="${dzisStron}">${dzisStron}</strong><span>z ${ile(cel, FORMY_STRON_D)}</span></div></div>
    <div class="dzien-boki">
      <p class="dzien-seria${seria ? ' aktywna' : ''}" data-akcja="passa" role="button" tabindex="0" title="Twoja passa">${I.plomien}<span>${seria ? `<strong>${ile(seria, FORMY_DNI)}</strong> z rzędu` : 'Przeczytaj dziś choć stronę, żeby zacząć serię'}</span></p>
      <p>W tym tygodniu <strong>${ile(tydzien, FORMY_STRON)}</strong></p>
      <p class="cichy">${brak <= 0 ? 'Dzienny cel zrobiony.' : `Do dziennego celu brakuje ${ile(brak, FORMY_STRON_D)}.`}</p>
    </div>
  </section>
  ${blokiBazowych()}
  ${blokPlanuDnia()}
  <section class="sekcja">
    <div class="sekcja-gora"><h2>Czytam też</h2>${pob.length ? `<span class="licznik">${pob.length}</span>` : ''}</div>
    ${pob.length ? `<ul class="lista">${pob.map(wierszCzytanej).join('')}</ul>`
      : `<p class="pusto">Nic obok bazowej. <button type="button" class="btn-tekst" data-akcja="idz" data-widok="biblioteka" data-polka="doPrzeczytania">Wybierz coś z listy do przeczytania</button></p>`}
  </section>
  ${blokTechnicznych()}
  ${blokOkresow(m)}
  ${blokCelu(m)}
  ${nast ? `<section class="sekcja">
    <div class="sekcja-gora"><h2>Następna do czytania</h2><span class="sekcja-akcje">${kolejka().length > 1 ? `<button type="button" class="btn-tekst" data-akcja="losuj">Losuj</button>` : ''}<button type="button" class="btn-tekst" data-akcja="idz" data-widok="biblioteka" data-polka="doPrzeczytania">Cała lista</button></span></div>
    <div class="nastepna"><button type="button" class="wiersz-glowny" data-akcja="ksiazka" data-id="${nast.id}">${okladka(nast, 's')}
      <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(nast.tytul)}</span><span class="wiersz-autor">${esc(nast.autor)}${nast.autor ? ', ' : ''}${ile(nast.strony, FORMY_STRON)}</span><span class="wiersz-info">${esc(nastI.powod)}</span></span></button>
      <button type="button" class="btn" data-akcja="zacznij" data-id="${nast.id}">Zacznij</button></div>
  </section>` : ''}
  ${cytatDnia()}
  ${htmlCiekawostki()}
  ${htmlMuzyki()}`;
}

/* ================= widok: Biblioteka ================= */
const POLKI = [['czytam', 'Czytam'], ['doPrzeczytania', 'Do przeczytania'], ['pozniej', 'Na później'], ['zyczenia', 'Lista życzeń'], ['przeczytana', 'Przeczytane'], ['porzucona', 'Porzucone']];
const SORTY = { domyslnie: 'Domyślnie', tytul: 'Tytuł', autor: 'Autor', strony: 'Liczba stron', ocena: 'Ocena', dodano: 'Ostatnio dodane' };

function sortuj(lista) {
  const pl = (a, b) => a.localeCompare(b, 'pl');
  switch (U.sort) {
    case 'tytul': return lista.sort((a, b) => pl(a.tytul, b.tytul));
    case 'autor': return lista.sort((a, b) => pl(a.autor.split(' ').pop(), b.autor.split(' ').pop()) || pl(a.tytul, b.tytul));
    case 'strony': return lista.sort((a, b) => b.strony - a.strony);
    case 'ocena': return lista.sort((a, b) => b.ocena - a.ocena || pl(a.tytul, b.tytul));
    case 'dodano': return lista.sort((a, b) => b.dodano.localeCompare(a.dodano));
    default:
      if (U.polka === 'doPrzeczytania') return lista.sort((a, b) => a.kolejnosc - b.kolejnosc);
      if (U.polka === 'przeczytana') return lista.sort((a, b) => (b.koniec || '').localeCompare(a.koniec || ''));
      if (U.polka === 'zyczenia') return lista.sort((a, b) => b.priorytet - a.priorytet || (a.cena ?? 1e9) - (b.cena ?? 1e9));
      if (U.polka === 'pozniej') return lista.sort((a, b) => (b.odlozono || '').localeCompare(a.odlozono || ''));
      if (U.polka === 'czytam') return lista.sort((a, b) => (b.bazowa - a.bazowa) || ostatniaAktywnosc(b).localeCompare(ostatniaAktywnosc(a)));
      return lista.sort((a, b) => (b.porzucono || '').localeCompare(a.porzucono || ''));
  }
}

function htmlSiatki() {
  const q = U.szukaj.trim().toLowerCase();
  let lista = U.pozyczone ? pozyczoneKsiazki() : Z.ksiazki.filter(k => k.status === U.polka);
  if (q) lista = lista.filter(k => `${k.tytul} ${k.autor} ${k.tagi.join(' ')} ${k.isbn} ${k.seria}`.toLowerCase().includes(q));
  if (U.tag) lista = lista.filter(k => k.tagi.includes(U.tag));
  if (U.kategoria) lista = lista.filter(k => kategorieKsiazki(k).includes(U.kategoria));
  if (U.polka === 'zyczenia' && U.listaZ && !U.pozyczone) lista = lista.filter(k => k.listy.includes(U.listaZ));
  if (!U.pozyczone) lista = sortuj(lista);
  if (!lista.length) {
    if (q || U.tag) return `<p class="pusto">Nic nie pasuje na tej półce.</p>${htmlInnychPolek(q)}`;
    const puste = {
      czytam: 'Nie czytasz teraz nic. Zacznij książkę z listy do przeczytania albo dodaj nową.',
      doPrzeczytania: 'Lista do przeczytania jest pusta. Dodaj książki, po które chcesz sięgnąć.',
      przeczytana: 'Tu trafią książki, które skończysz.',
      porzucona: 'Porzucone książki trafiają tutaj. Rzucenie nudnej książki to oszczędność czasu na lepszą.',
      pozniej: 'Tu odkładasz książki, do których chcesz wrócić kiedyś, ale nie teraz. Nie zajmują miejsca w kolejce.',
      zyczenia: 'Lista życzeń: książki, które chcesz kupić albo dostać. Zapisz cenę i link do sklepu.'
    };
    return `<div class="pusto-duze"><p>${puste[U.polka]}</p>${U.polka !== 'porzucona' && U.polka !== 'przeczytana' ? '<button type="button" class="btn btn-glowny" data-akcja="dodaj">Dodaj książkę</button>' : ''}</div>`;
  }
  const kolejkowa = U.polka === 'doPrzeczytania' && U.sort === 'domyslnie' && !q && !U.tag;
  return `<ul class="siatka">${lista.map((k, i) => `<li style="--n:${i}"><button type="button" class="kafel" data-akcja="ksiazka" data-id="${k.id}">
      ${okladka(k, 'm')}${kolejkowa ? `<span class="kafel-nr" aria-label="Pozycja w kolejce">${i + 1}</span>` : ''}${k.bazowa ? '<span class="kafel-wstazka" aria-label="Książka bazowa"></span>' : ''}
      ${k.pozyczona ? `<span class="kafel-pozyczka${dniDoZwrotu(k) != null && dniDoZwrotu(k) < 0 ? ' po-terminie' : ''}" title="${k.pozyczona.kierunek === 'komus' ? 'Pożyczona: ' : 'Od: '}${esc(k.pozyczona.kto)}">${I.reka}${esc(k.pozyczona.kto)}</span>` : ''}
      <span class="kafel-tytul">${esc(k.tytul)}</span><span class="kafel-autor">${esc(k.autor)}${k.seria ? `<span class="kafel-seria">${esc(k.seria)}${k.tom != null ? ` ${String(k.tom).replace('.', ',')}` : ''}</span>` : ''}</span>
      ${k.status === 'czytam' || (k.status === 'pozniej' && k.strona) ? pasek(k.strona / k.strony * 100) : ''}
      ${k.status === 'zyczenia' && (k.cena || k.priorytet) ? `<span class="kafel-zycz">${k.priorytet ? `<span class="kafel-prio">${'♥'.repeat(k.priorytet)}</span>` : ''}${k.cena ? `${k.cena.toFixed(2).replace('.', ',')} zł` : ''}</span>` : ''}
      ${k.status === 'przeczytana' && k.ocena ? `<span class="kafel-ocena" aria-label="Ocena ${k.ocena} na 5">${'★'.repeat(k.ocena)}<span class="kafel-ocena-reszta">${'★'.repeat(5 - k.ocena)}</span></span>` : ''}
    </button></li>`).join('')}</ul>${htmlInnychPolek(q)}`;
}

function widokBiblioteka() {
  const liczby = Object.fromEntries(STATUSY.map(s => [s, Z.ksiazki.filter(k => k.status === s).length]));
  const tagi = [...new Set(Z.ksiazki.filter(k => k.status === U.polka).flatMap(k => k.tagi))].sort((a, b) => a.localeCompare(b, 'pl'));
  if (U.tag && !tagi.includes(U.tag)) U.tag = null;
  return `<section class="naglowek-widoku"><h1>Biblioteka</h1>
    <span class="naglowek-akcje"><button type="button" class="btn" data-akcja="dodaj-wiele">${I.skaner}Wiele</button><button type="button" class="btn btn-glowny" data-akcja="dodaj">${I.plus}Dodaj</button></span></section>
  <div class="polki" role="tablist" aria-label="Półki">${POLKI.map(([s, n]) =>
    `<button type="button" role="tab" aria-selected="${!U.pozyczone && U.polka === s}" data-akcja="polka" data-polka="${s}">${n}<span class="polki-liczba">${liczby[s]}</span></button>`).join('')}</div>
  <div class="filtry">
    <label class="pole-szukaj">${I.szukaj}<input type="search" id="szukaj-bib" placeholder="Szukaj: tytuł, autor, tag" value="${esc(U.szukaj)}" aria-label="Szukaj w bibliotece"></label>
    <select id="sort-bib" aria-label="Sortowanie">${Object.entries(SORTY).map(([v, n]) => `<option value="${v}"${U.sort === v ? ' selected' : ''}>${n}</option>`).join('')}</select>
  </div>
  ${U.polka === 'zyczenia' && !U.pozyczone ? htmlListZyczen() : ''}
  ${htmlFiltraKategorii(U.pozyczone ? pozyczoneKsiazki() : Z.ksiazki.filter(k => k.status === U.polka))}
  ${tagi.length ? `<div class="tagi-filtr">${tagi.map(t => `<button type="button" class="tag${U.tag === t ? ' wybrany' : ''}" data-akcja="tag" data-tag="${esc(t)}" aria-pressed="${U.tag === t}">${esc(t)}</button>`).join('')}</div>` : ''}
  ${pozyczoneKsiazki().length ? `<div class="tagi-filtr"><button type="button" class="tag tag-pozyczone${U.pozyczone ? ' wybrany' : ''}" data-akcja="pozyczone-filtr" aria-pressed="${!!U.pozyczone}">${I.reka}Pożyczone (${pozyczoneKsiazki().length})</button></div>` : ''}
  ${U.pozyczone ? '<p class="cichy pozyczone-info">Wszystkie pożyczone książki, z każdej półki. Najdłużej pożyczone są pierwsze.</p>' : ''}
  ${U.polka === 'doPrzeczytania' && liczby.doPrzeczytania > 1 ? `<button type="button" class="btn btn-maly losuj-btn" data-akcja="losuj">${I.kostka}Nie wiem, co czytać: losuj</button>` : ''}
  ${naglowekPolki()}
  <div id="siatka-bib">${htmlSiatki()}</div>`;
}

/* ================= widok: Statystyki ================= */
function wykresDni(m, cel) {
  const N = 30, W = 340, H = 150, D = 18, G = 12, dzis = dzisISO();
  const dane = Array.from({ length: N }, (_, i) => { const d = dodajDni(dzis, i - N + 1); return { d, v: m.get(d) || 0 }; });
  const max = Math.max(cel * 1.2, ...dane.map(x => x.v), 10);
  const wys = H - D - G, sz = W / N, y = v => G + wys - v / max * wys;
  const slupki = dane.map((x, i) => {
    const h = x.v / max * wys;
    return `<g class="klik" data-akcja="dzien" data-data="${x.d}"><rect x="${(i * sz).toFixed(1)}" y="${G}" width="${sz.toFixed(1)}" height="${wys}" class="trafienie"/><rect x="${(i * sz + 1.5).toFixed(1)}" y="${(G + wys - h).toFixed(1)}" width="${(sz - 3).toFixed(1)}" height="${(x.v ? Math.max(h, 2) : 0).toFixed(1)}" rx="1.5" class="sl${x.v >= cel ? ' sl-pelny' : ''}"><title>${dataKrotka(x.d)}: ${ile(x.v, FORMY_STRON)}</title></rect></g>`;
  }).join('');
  const podpisy = dane.map((x, i) => (N - 1 - i) % 7 === 0 ? `<text x="${(i * sz + sz / 2).toFixed(1)}" y="${H - 4}" text-anchor="middle" class="etykieta">${i === N - 1 ? 'dziś' : dataKrotka(x.d)}</text>` : '').join('');
  return `<svg class="wykres" viewBox="0 0 ${W} ${H}" role="img" aria-label="Strony dziennie przez ostatnie 30 dni">
    <line x1="0" x2="${W}" y1="${G + wys}" y2="${G + wys}" class="os"/>${slupki}
    <line x1="0" x2="${W}" y1="${y(cel).toFixed(1)}" y2="${y(cel).toFixed(1)}" class="linia-celu"/>
    <text x="2" y="${(y(cel) - 4).toFixed(1)}" class="etykieta">cel ${cel}</text>${podpisy}</svg>`;
}

function heatmapa(m, cel) {
  const T = 26, K = 11, O = 3, L = 18, G = 15, dzis = dzisISO();
  const start = dodajDni(dodajDni(dzis, -dzienTygodnia(dzis)), -(T - 1) * 7);
  let komorki = '', miesiace = '', ostM = '', ostX = -99;
  for (let t = 0; t < T; t++) {
    const tStart = dodajDni(start, t * 7), x = L + t * (K + O);
    const mies = tStart.slice(5, 7);
    if (mies !== ostM) {
      if (x - ostX > 28 && t < T - 1) { miesiace += `<text x="${x}" y="10" class="etykieta">${MIES_KR[+mies - 1]}</text>`; ostX = x; }
      ostM = mies;
    }
    for (let d = 0; d < 7; d++) {
      const iso = dodajDni(tStart, d);
      if (iso > dzis) continue;
      const v = m.get(iso) || 0;
      const p = v === 0 ? 0 : v < cel / 3 ? 1 : v < cel * 2 / 3 ? 2 : v < cel ? 3 : 4;
      komorki += `<rect x="${x}" y="${G + d * (K + O)}" width="${K}" height="${K}" rx="2" class="hm hm${p}${iso === dzis ? ' hm-dzis' : ''} klik" data-akcja="dzien" data-data="${iso}"><title>${dataKrotka(iso)}: ${ile(v, FORMY_STRON)}</title></rect>`;
    }
  }
  const dni = [[0, 'pn'], [2, 'śr'], [4, 'pt'], [6, 'nd']].map(([d, t]) => `<text x="0" y="${G + d * (K + O) + K - 2}" class="etykieta">${t}</text>`).join('');
  const W = L + T * (K + O), H = G + 7 * (K + O);
  return `<svg class="wykres" viewBox="0 0 ${W} ${H}" role="img" aria-label="Dni czytania przez ostatnie 26 tygodni">${miesiace}${dni}${komorki}</svg>
    <p class="legenda" aria-hidden="true">mniej <span class="hm-p hm0"></span><span class="hm-p hm1"></span><span class="hm-p hm2"></span><span class="hm-p hm3"></span><span class="hm-p hm4"></span> cel zrobiony</p>`;
}

function wykresMiesiecy() {
  const u = Z.ustawienia, dzisM = dzisISO().slice(0, 7);
  const mies = [];
  for (let d = u.start.slice(0, 7) + '-01'; d.slice(0, 7) <= u.koniec.slice(0, 7) && mies.length < 24;) {
    mies.push(d.slice(0, 7));
    const [r, mm] = d.split('-').map(Number);
    d = mm === 12 ? `${r + 1}-01-01` : `${r}-${pad(mm + 1)}-01`;
  }
  const licz = Object.fromEntries(mies.map(x => [x, 0]));
  for (const { koniec } of ukonczenia(u.start, u.koniec)) if (koniec.slice(0, 7) in licz) licz[koniec.slice(0, 7)]++;
  const naMiesiac = u.cel / mies.length;
  const W = 340, H = 160, D = 18, G = 16, wys = H - D - G, sz = W / mies.length;
  const max = Math.max(naMiesiac * 1.3, ...Object.values(licz), 2);
  const y = v => G + wys - v / max * wys;
  const slupki = mies.map((x, i) => {
    const v = licz[x], h = v / max * wys, cx = i * sz + sz / 2;
    const kl = x > dzisM ? 'sl sl-przyszly' : x === dzisM ? 'sl sl-teraz' : 'sl';
    return `<g class="klik" data-akcja="miesiac" data-ym="${x}"><rect x="${(i * sz).toFixed(1)}" y="${G}" width="${sz.toFixed(1)}" height="${wys}" class="trafienie"/><rect x="${(i * sz + sz * 0.18).toFixed(1)}" y="${(G + wys - h).toFixed(1)}" width="${(sz * 0.64).toFixed(1)}" height="${(v ? Math.max(h, 2) : 0).toFixed(1)}" rx="2" class="${kl}"><title>${MIES_KR[+x.slice(5) - 1]} ${x.slice(0, 4)}: ${ile(v, FORMY_KSIAZEK)}</title></rect></g>
      ${v ? `<text x="${cx.toFixed(1)}" y="${(G + wys - h - 4).toFixed(1)}" text-anchor="middle" class="etykieta etykieta-mocna">${v}</text>` : ''}
      <text x="${cx.toFixed(1)}" y="${H - 4}" text-anchor="middle" class="etykieta${x === dzisM ? ' etykieta-mocna' : ''}">${MIES_KR[+x.slice(5) - 1]}</text>`;
  }).join('');
  return `<svg class="wykres" viewBox="0 0 ${W} ${H}" role="img" aria-label="Przeczytane książki w kolejnych miesiącach okresu celu">
    <line x1="0" x2="${W}" y1="${G + wys}" y2="${G + wys}" class="os"/>${slupki}
    <line x1="0" x2="${W}" y1="${y(naMiesiac).toFixed(1)}" y2="${y(naMiesiac).toFixed(1)}" class="linia-celu"/>
    <text x="${W - 2}" y="${(y(naMiesiac) - 4).toFixed(1)}" text-anchor="end" class="etykieta">plan ${ulamek(naMiesiac)} / mies.</text></svg>`;
}

function ranking(pary, pusty) {
  if (!pary.length) return `<p class="cichy">${pusty}</p>`;
  const max = pary[0][1];
  return `<ol class="ranking">${pary.map(([n, v]) => `<li><span class="ranking-nazwa">${esc(n)}</span><span class="ranking-liczba">${v}</span><span class="ranking-pasek" style="--w:${v / max * 100}%"></span></li>`).join('')}</ol>`;
}

const DNI_KR = ['pn', 'wt', 'śr', 'cz', 'pt', 'so', 'nd'];
const DNI_MN = ['poniedziałki', 'wtorki', 'środy', 'czwartki', 'piątki', 'soboty', 'niedziele'];

function wykresTygodnia(m) {
  const r = rozkladTygodnia(m, 12);
  const max = Math.max(...r, 1), naj = r.indexOf(Math.max(...r));
  const W = 340, H = 130, D = 18, G = 16, wys = H - D - G, sz = W / 7;
  const slupki = r.map((v, i) => {
    const h = v / max * wys, cx = i * sz + sz / 2;
    return `<rect x="${(i * sz + sz * 0.22).toFixed(1)}" y="${(G + wys - h).toFixed(1)}" width="${(sz * 0.56).toFixed(1)}" height="${(v ? Math.max(h, 2) : 0).toFixed(1)}" rx="3" class="sl${i === naj && v ? ' sl-pelny' : ''}"><title>${DNI_MN[i]}: średnio ${Math.round(v)} str.</title></rect>
      ${v ? `<text x="${cx.toFixed(1)}" y="${(G + wys - h - 4).toFixed(1)}" text-anchor="middle" class="etykieta${i === naj ? ' etykieta-mocna' : ''}">${Math.round(v)}</text>` : ''}
      <text x="${cx.toFixed(1)}" y="${H - 4}" text-anchor="middle" class="etykieta">${DNI_KR[i]}</text>`;
  }).join('');
  const opis = r[naj] ? `Najwięcej czytasz w ${DNI_MN[naj]}: średnio ${ile(Math.round(r[naj]), FORMY_STRON)}.` : 'Za mało danych.';
  return `<p class="cichy">${opis} Ostatnie 12 tygodni.</p>
    <svg class="wykres" viewBox="0 0 ${W} ${H}" role="img" aria-label="Średnio stron w dni tygodnia"><line x1="0" x2="${W}" y1="${G + wys}" y2="${G + wys}" class="os"/>${slupki}</svg>`;
}

function htmlOdznak(lista) {
  return `<ul class="odznaki">${lista.map(o => `<li class="odznaka${o.zdobyta ? ' zdobyta' : ''}">
    <span class="odznaka-ikona" aria-hidden="true">${I.medal}</span>
    <span class="odznaka-tekst"><strong>${esc(o.nazwa)}</strong><span>${esc(o.opis)}</span>
    ${o.zdobyta ? '' : `<span class="odznaka-pasek"><span style="width:${(o.wart / o.prog * 100).toFixed(1)}%"></span></span><span class="odznaka-ile">${liczba(o.wart)} / ${liczba(o.prog)}</span>`}</span></li>`).join('')}</ul>`;
}

function widokStatystyki() {
  const m = mapaDni(), u = Z.ustawienia;
  const przeczytane = Z.ksiazki.filter(k => k.status === 'przeczytana');
  if (!m.size && !przeczytane.length) {
    return `<section class="naglowek-widoku"><h1>Statystyki</h1></section>
      <div class="pusto-duze"><p>Statystyki pojawią się, gdy zapiszesz pierwsze przeczytane strony.</p>
      <p class="cichy">Na ekranie Dziś kliknij „Zapisz postęp” albo włącz sesję czytania.</p></div>`;
  }
  const cel = dziennyCel(m);
  const ukon = ukonczenia(u.start, u.koniec);
  let stronOkres = 0;
  for (const [d, v] of m) if (d >= u.start && d <= u.koniec) stronOkres += v;
  const tempo = tempoOgolne();
  const minutySesji = Z.ksiazki.reduce((s, k) => s + k.sesje.reduce((a, x) => a + x.minuty, 0), 0);
  const oceny = przeczytane.filter(k => k.ocena);
  const najDzien = [...m].sort((a, b) => b[1] - a[1])[0];
  const najdluzsza = [...przeczytane].sort((a, b) => b.strony - a.strony)[0];
  const szybkie = przeczytane.filter(k => k.start && k.koniec && k.strony >= 100).map(k => ({ k, dni: dniMiedzy(k.start, k.koniec) + 1 })).sort((a, b) => a.dni - b.dni)[0];
  const autorzy = {}, tagi = {};
  for (const k of przeczytane) {
    if (k.autor) autorzy[k.autor] = (autorzy[k.autor] || 0) + 1;
    for (const t of k.tagi) tagi[t] = (tagi[t] || 0) + 1;
  }
  const top = o => Object.entries(o).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pl')).slice(0, 5);
  const odz = odznaki(m), zdobyte = odz.filter(o => o.zdobyta).length;
  const odzSort = [...odz].sort((a, b) => b.zdobyta - a.zdobyta || (b.wart / b.prog) - (a.wart / a.prog));
  return `<section class="naglowek-widoku"><h1>Statystyki</h1>
    <span class="naglowek-akcje"><button type="button" class="btn" data-akcja="miesiac" data-ym="${miesiacTeraz()}">${I.kalendarz}Miesiąc</button><button type="button" class="btn" data-akcja="rok">${I.rok}Twój rok</button><button type="button" class="btn" data-akcja="tydzien-podsumowanie">🦉 Tydzień</button></span></section>
  ${htmlBingo()}
  <dl class="liczby">
    <div><dt>Przeczytane w okresie celu</dt><dd>${ukon.length}<small> z ${u.cel}</small></dd></div>
    <div><dt>Strony w okresie celu</dt><dd>${liczba(stronOkres)}</dd></div>
    <div><dt>Średnio dziennie, 30 dni</dt><dd>${Math.round(sredniaDzienna(m, 30))}<small> str.</small></dd></div>
    <div><dt>Tempo z sesji</dt><dd>${tempo ? `${Math.round(tempo)}<small> str./h</small>` : '<small>brak sesji</small>'}</dd></div>
    <div data-akcja="passa" class="klik-liczba"><dt>Obecna passa ›</dt><dd>${seriaAktualna(m)}<small> ${odmiana(seriaAktualna(m), FORMY_DNI)}</small></dd></div>
    <div><dt>Najdłuższa seria</dt><dd>${najdluzszaSeria(m)}<small> ${odmiana(najdluzszaSeria(m), FORMY_DNI)}</small></dd></div>
  </dl>
  <section class="sekcja"><h2>Strony dziennie</h2><p class="cichy">Ostatnie 30 dni. Przerywana linia to dzienny cel, pełne słupki to dni z celem. Kliknij dzień, żeby zobaczyć szczegóły.</p>${wykresDni(m, cel)}</section>
  <section class="sekcja"><h2>Dni czytania</h2><p class="cichy">Ostatnie pół roku. Kliknij kratkę, żeby zobaczyć ten dzień.</p>${heatmapa(m, cel)}</section>
  <section class="sekcja"><h2>Dni tygodnia</h2>${wykresTygodnia(m)}</section>
  <section class="sekcja"><div class="sekcja-gora"><h2>Odznaki</h2><span class="licznik">${zdobyte} / ${odz.length}</span></div>${htmlOdznak(U.wszystkieOdznaki ? odzSort : odzSort.slice(0, 6))}
    ${odz.length > 6 ? `<button type="button" class="btn-tekst" data-akcja="odznaki-wiecej">${U.wszystkieOdznaki ? 'Pokaż mniej' : `Pokaż wszystkie (${odz.length})`}</button>` : ''}</section>
  <section class="sekcja"><h2>Cel roczny w czasie</h2>${wykresCeluWCzasie()}</section>
  <section class="sekcja"><h2>Książki w miesiącach</h2><p class="cichy">Od ${dataDluga(u.start)} do ${dataDluga(u.koniec)}.</p>${wykresMiesiecy()}</section>
  <section class="sekcja"><h2>Miesiąc po miesiącu</h2><p class="cichy">Kliknij miesiąc, żeby zobaczyć kalendarz, przeczytane książki i plan.</p>${htmlMiesiecy(m)}</section>
  ${htmlProfiluCzytelnika()}
  ${htmlPoryCzytania()}
  ${htmlWydatkow()}
  <section class="sekcja"><h2>Rekordy</h2><dl class="rekordy">
    ${najDzien ? `<div><dt>Najlepszy dzień</dt><dd>${ile(najDzien[1], FORMY_STRON)}, ${dataDluga(najDzien[0])}</dd></div>` : ''}
    ${najdluzsza ? `<div><dt>Najdłuższa przeczytana</dt><dd>${esc(najdluzsza.tytul)}, ${ile(najdluzsza.strony, FORMY_STRON)}</dd></div>` : ''}
    ${szybkie ? `<div><dt>Najszybciej przeczytana</dt><dd>${esc(szybkie.k.tytul)}, ${ile(szybkie.dni, FORMY_DNI)}</dd></div>` : ''}
    ${minutySesji ? `<div><dt>Czas w sesjach</dt><dd>${czasCzytania(minutySesji / 60)}</dd></div>` : ''}
    ${oceny.length ? `<div><dt>Średnia ocena</dt><dd>${ulamek(oceny.reduce((s, k) => s + k.ocena, 0) / oceny.length)} na 5</dd></div>` : ''}
    <div><dt>Przeczytane ogółem</dt><dd>${ile(przeczytane.length, FORMY_KSIAZEK)}, ${ile(przeczytane.reduce((s, k) => s + k.strony, 0), FORMY_STRON)}</dd></div>
  </dl></section>
  <section class="sekcja dwie"><div><h2>Autorzy</h2>${ranking(top(autorzy), 'Pojawią się po przeczytaniu kilku książek.')}</div>
    <div><h2>Tagi</h2>${ranking(top(tagi), 'Dodawaj tagi do książek, np. historia albo reportaż.')}</div></section>`;
}

/* ================= widok: Cytaty ================= */
function htmlCytatow() {
  const q = U.szukajCytat.trim().toLowerCase();
  const lista = Z.ksiazki.flatMap(k => k.cytaty.map(c => ({ c, k })))
    .filter(({ c, k }) => !q || `${c.tekst} ${k.tytul} ${k.autor}`.toLowerCase().includes(q))
    .sort((a, b) => b.c.data.localeCompare(a.c.data) || (b.c.strona || 0) - (a.c.strona || 0));
  if (!lista.length) return '<p class="pusto">Nic nie pasuje do wyszukiwania.</p>';
  return lista.map(({ c, k }) => `<article class="cytat${c.notatka ? ' cytat-notatka' : ''}">
    ${c.notatka ? '<p class="cytat-rodzaj">Moja notatka</p>' : ''}
    <blockquote>${esc(c.tekst)}</blockquote>
    <footer><span class="cytat-zrodlo"><button type="button" class="btn-tekst" data-akcja="ksiazka" data-id="${k.id}">${esc(k.tytul)}</button>${c.strona ? `, s. ${c.strona}` : ''}</span>
      <span class="cytat-akcje">
        <button type="button" class="btn-ikona maly" data-akcja="cytat-kopiuj" data-id="${k.id}" data-cid="${c.id}" aria-label="Kopiuj">${I.kopiuj}</button>
        <button type="button" class="btn-ikona maly" data-akcja="cytat-obraz" data-id="${k.id}" data-cid="${c.id}" aria-label="Zapisz jako obrazek">${I.obraz}</button>
        ${navigator.share ? `<button type="button" class="btn-ikona maly" data-akcja="cytat-udostepnij" data-id="${k.id}" data-cid="${c.id}" aria-label="Udostępnij">${I.udostepnij}</button>` : ''}
        <button type="button" class="btn-ikona maly" data-akcja="cytat-edytuj" data-id="${k.id}" data-cid="${c.id}" aria-label="Edytuj">${I.edytuj}</button>
      </span></footer>
  </article>`).join('');
}

function widokCytaty() {
  const ileC = Z.ksiazki.reduce((s, k) => s + k.cytaty.length, 0);
  if (!ileC) {
    return `<section class="naglowek-widoku"><h1>Cytaty i notatki</h1></section>
      <div class="pusto-duze"><p>Tu zbierają się zdania, które chcesz zapamiętać.</p>
      <p class="cichy">Otwórz książkę i kliknij „Dodaj cytat”. Możesz też zapisać własną myśl z numerem strony.</p></div>`;
  }
  return `<section class="naglowek-widoku"><h1>Cytaty i notatki</h1><span class="licznik">${ileC}</span></section>
    <label class="pole-szukaj">${I.szukaj}<input type="search" id="szukaj-cyt" placeholder="Szukaj w cytatach" value="${esc(U.szukajCytat)}" aria-label="Szukaj w cytatach"></label>
    <div id="lista-cyt" class="lista-cytatow">${htmlCytatow()}</div>`;
}

/* ================= widok: Ustawienia ================= */
function widokUstawienia() {
  const u = Z.ustawienia;
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ost = lsGet('zakladka-kopia');
  const auto = (() => { const g = postepCelu(); return g.zostalo && !g.przedStartem && !g.poKoncu ? g.stronDziennie : 30; })();
  return `<section class="naglowek-widoku"><h1>Ustawienia</h1></section>
  <form id="f-ustawienia" class="formularz grupa" novalidate>
    <h2>Cel roczny</h2>
    <div class="f-rzad"><label>Ile książek<input name="cel" type="number" inputmode="numeric" min="1" value="${u.cel}" required></label>
      <label>Średnio stron w książce<input name="srednia" type="number" inputmode="numeric" min="20" value="${u.srednia}" required></label></div>
    <div class="f-rzad"><label>Od<input name="start" type="date" value="${u.start}" required></label>
      <label>Do<input name="koniec" type="date" value="${u.koniec}" required></label></div>
    <label>Dzienny cel stron<input name="dziennyCel" type="number" inputmode="numeric" min="0" value="${u.dziennyCel || ''}" placeholder="Automatycznie: ${auto}"></label>
    <p class="podpowiedz">Zostaw puste, a dzienny cel wyliczy się z celu rocznego.</p>
    <h2 class="f-podtytul">Cele tygodniowe i miesięczne</h2>
    <div class="f-rzad"><label>Stron w tygodniu<input name="tydzienStrony" type="number" inputmode="numeric" min="0" value="${u.tydzienStrony || ''}" placeholder="Auto: ${bazaDzienna() * 7}"></label>
      <label>Książek w tygodniu<input name="tydzienKsiazki" type="number" inputmode="numeric" min="0" value="${u.tydzienKsiazki || ''}" placeholder="Auto: ${fmtCel(zaokr1(u.cel * 7 / Math.max(1, dniMiedzy(u.start, u.koniec) + 1)))}"></label></div>
    <div class="f-rzad"><label>Stron w miesiącu<input name="miesiacStrony" type="number" inputmode="numeric" min="0" value="${u.miesiacStrony || ''}" placeholder="Auto: ok. ${bazaDzienna() * 30}"></label>
      <label>Książek w miesiącu<input name="miesiacKsiazki" type="number" inputmode="numeric" min="0" value="${u.miesiacKsiazki || ''}" placeholder="Auto: ok. ${Math.max(1, Math.round(u.cel * 30.4 / Math.max(1, dniMiedzy(u.start, u.koniec) + 1)))}"></label></div>
    <p class="podpowiedz">Puste pola liczą się same z celu rocznego. Wpisana liczba obowiązuje co tydzień albo co miesiąc. Pojedynczym miesiącom ustawisz cel niżej.</p>
    <label>Imię do powitania<input name="imie" value="${esc(u.imie)}" autocomplete="given-name" maxlength="40"></label>
    <div class="przyciski"><button type="submit" class="btn btn-glowny">Zapisz ustawienia</button></div>
  </form>
  ${htmlPrzypomnien()}
  <form id="f-wyszukiwanie" class="formularz grupa" novalidate>
    <h2>Wyszukiwanie książek</h2>
    <p class="cichy">Aplikacja szuka w Google Books, Open Library i w katalogu Biblioteki Narodowej, który ma prawie każdą polską książkę.</p>
    <label>Klucz Google Books API (opcjonalnie)<input name="googleKlucz" value="${esc(u.googleKlucz)}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="AIza…"></label>
    <details class="pomoc"><summary>Po co klucz i jak go zdobyć (2 minuty, za darmo)</summary>
      <p>Bez klucza Google Books często odpowiada „limit zapytań wyczerpany”, bo dzieli wspólny limit ze wszystkimi aplikacjami bez klucza. Z własnym kluczem masz 1000 wyszukiwań dziennie.</p>
      <ol><li>Wejdź na console.cloud.google.com i zaloguj się kontem Google.</li>
        <li>Utwórz projekt (np. „Zakładka”).</li>
        <li>W „APIs &amp; Services → Library” wyszukaj <strong>Books API</strong> i kliknij Enable.</li>
        <li>W „Credentials” wybierz Create credentials → API key i skopiuj klucz tutaj.</li></ol>
      <p class="cichy">Klucz zostaje na tym urządzeniu i w twoich kopiach zapasowych.</p></details>
    <label>Adres pośrednika Biblioteki Narodowej (opcjonalnie)<input name="posrednik" type="url" value="${esc(u.posrednik)}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Domyślny: ${esc(POSREDNIK_BN.replace('https://', ''))}"></label>
    <p class="podpowiedz">Domyślny pośrednik jest już ustawiony. Pole wypełnij tylko, jeśli chcesz użyć innego.</p>
    <details class="pomoc"><summary>Jak włączyć Bibliotekę Narodową</summary>
      <p>Serwer Biblioteki Narodowej nie odpowiada aplikacjom w przeglądarce bezpośrednio, więc potrzebny jest mały pośrednik.</p>
      <ul><li><strong>Twój serwer z PHP (np. Apache):</strong> plik <code>bn.php</code> leży już obok aplikacji i działa sam. To pole zostaw puste.</li>
        <li><strong>GitHub Pages:</strong> załóż darmowy Cloudflare Worker z pliku <code>proxy/cloudflare-worker.js</code> (instrukcja jest na górze pliku) i wklej tu jego adres.</li></ul></details>
    <div class="przyciski"><button type="submit" class="btn btn-glowny">Zapisz</button><button type="button" class="btn" data-akcja="test-zrodel">Sprawdź źródła</button><button type="button" class="btn" data-akcja="worker">Zaktualizuj workera (ceny)</button></div>
    <ul id="stan-zrodel" class="stan-zrodel" hidden></ul>
  </form>
  <section class="grupa"><h2>Cele na poszczególne miesiące</h2>${htmlCelowMiesiecy()}</section>
  <section class="grupa"><h2>Wygląd</h2>
    <fieldset class="segment"><legend class="sr">Motyw</legend>${radio('motyw', 'auto', 'Jak w systemie', u.motyw === 'auto')}${radio('motyw', 'jasny', 'Jasny', u.motyw === 'jasny')}${radio('motyw', 'ciemny', 'Ciemny', u.motyw === 'ciemny')}</fieldset>
  </section>
  <section class="grupa"><h2>Telefon</h2>
    <p>${standalone ? 'Zakładka działa jako zainstalowana aplikacja.'
      : U.instalacja ? 'Zainstaluj Zakładkę, żeby otwierała się jak zwykła aplikacja i działała bez internetu.'
      : ios ? 'Na iPhonie: w Safari kliknij Udostępnij, a potem „Do ekranu początkowego”.'
      : 'W Chrome otwórz menu i wybierz „Zainstaluj aplikację” albo „Dodaj do ekranu głównego”.'}</p>
    ${U.instalacja && !standalone ? '<div class="przyciski"><button type="button" class="btn btn-glowny" data-akcja="instaluj">Zainstaluj aplikację</button></div>' : ''}
    <p id="stan-pamieci" class="cichy">Sprawdzam pamięć urządzenia…</p>
    <div class="przyciski" id="pamiec-przycisk" hidden><button type="button" class="btn" data-akcja="pamiec">Poproś o trwałą pamięć</button></div>
  </section>
  <section class="grupa"><h2>Kopia zapasowa</h2>
    <p class="cichy">Książki są zapisane tylko na tym urządzeniu. Kopia chroni je przy zmianie telefonu albo czyszczeniu przeglądarki. ${ost ? `Ostatnia kopia: ${dataDluga(ost)}.` : 'Nie zrobiłeś jeszcze kopii.'}</p>
    <div class="przyciski"><button type="button" class="btn btn-glowny" data-akcja="kopia">${I.pobierz}Zrób kopię</button>
      <button type="button" class="btn" data-akcja="import-json">${I.wgraj}Wczytaj kopię</button></div>
  </section>
  <section class="grupa"><h2>Goodreads</h2>
    <p class="cichy">Na Goodreads wejdź w My Books, potem Import and export i Export Library. Pobrany plik CSV wczytasz tutaj. Książki, które już masz, zostaną pominięte.</p>
    <div class="przyciski"><button type="button" class="btn" data-akcja="import-goodreads">${I.wgraj}Importuj CSV</button>
      <button type="button" class="btn" data-akcja="eksport-csv">${I.pobierz}Eksportuj CSV</button></div>
  </section>
  <section class="grupa grupa-ryzyko"><h2>Usuwanie danych</h2>
    <p class="cichy">Usuwa wszystkie książki, cytaty i ustawienia z tego urządzenia. Zrób wcześniej kopię.</p>
    <div class="przyciski"><button type="button" class="btn btn-ryzyko" data-akcja="usun-wszystko">Usuń wszystkie dane</button></div>
  </section>
  <section class="grupa"><h2>Wersja aplikacji</h2>
    <p>Masz wersję <strong>${WERSJA}</strong>. Jeśli nie widzisz nowych funkcji, telefon trzyma starą wersję w pamięci.</p>
    <div class="przyciski"><button type="button" class="btn btn-glowny" data-akcja="aktualizuj">Wymuś aktualizację</button><button type="button" class="btn" data-akcja="co-nowego">Co nowego</button></div>
  </section>
  <p class="stopka">${LOGO}Zakładka ${WERSJA}. Twoje książki zostają na tym urządzeniu.</p>`;
}

async function pokazStanPamieci() {
  const el = $('#stan-pamieci');
  if (!el) return;
  if (!navigator.storage || !navigator.storage.persisted) {
    el.textContent = 'Ta przeglądarka nie pokazuje stanu pamięci. Rób regularnie kopie zapasowe.';
    return;
  }
  try {
    const trwala = await navigator.storage.persisted();
    let t = trwala
      ? 'Trwała pamięć jest włączona: system nie usunie danych, gdy zabraknie miejsca.'
      : 'Pamięć nie jest trwała: przy braku miejsca system może usunąć dane.';
    if (navigator.storage.estimate) {
      const { usage } = await navigator.storage.estimate();
      t += ` Zajęte: ${usage > 1048576 ? ulamek(usage / 1048576) + ' MB' : Math.max(1, Math.round(usage / 1024)) + ' KB'}.`;
    }
    el.textContent = t;
    const p = $('#pamiec-przycisk');
    if (p) p.hidden = trwala;
  } catch {
    el.textContent = 'Nie udało się sprawdzić pamięci.';
  }
}

/* ================= render główny ================= */
const WIDOKI = { dzis: widokDzis, biblioteka: widokBiblioteka, losuj: widokLosowanie, statystyki: widokStatystyki, cytaty: widokCytaty, ustawienia: widokUstawienia };
// Ustawienia są w nagłówku (ikona suwaków), żeby w dolnym pasku zmieściło się Losowanie
const NAWIGACJA = [['dzis', 'Dziś'], ['biblioteka', 'Biblioteka'], ['losuj', 'Losuj'], ['statystyki', 'Statystyki'], ['cytaty', 'Cytaty']];

function renderNawigacja() {
  $$('.btn-gora').forEach(b => b.toggleAttribute('aria-current', U.widok === b.dataset.widok));
  $('#nawigacja').innerHTML = NAWIGACJA.map(([w, n]) =>
    `<button type="button" data-akcja="idz" data-widok="${w}"${U.widok === w ? ' aria-current="page"' : ''}>${I[w]}<span>${n}</span></button>`).join('');
}

function renderWidok() {
  const el = $('#widok');
  el.innerHTML = WIDOKI[U.widok]();
  el.dataset.widok = U.widok;
  renderNawigacja();
  if (U.widok === 'ustawienia') pokazStanPamieci();
  if (U.widok === 'losuj') podlaczPodpowiedzi($('[data-los-dodaj] input'), { naWybor: q => { const f = $('[data-los-dodaj]'); if (f) f.requestSubmit(); } });
  // wejście widoku: animacja i liczby
  if (U.ostatniWidok !== U.widok) { el.classList.remove('wejscie'); void el.offsetWidth; el.classList.add('wejscie'); U.ostatniWidok = U.widok; }
  animujLiczby(el);
  U.pierwszyRender = false;
  Sowa.poZmianieWidoku(U.widok);
}

function idz(widok, polka) {
  // płynne przejście między zakładkami (View Transitions, gdy przeglądarka je ma)
  if (document.startViewTransition && U.widok !== widok && !bezRuchu() && !U.wPrzejsciu) {
    U.wPrzejsciu = true;
    const t = document.startViewTransition(() => idz(widok, polka));
    t.finished.finally(() => { U.wPrzejsciu = false; });
    return;
  }
  U.widok = widok;
  if (polka) { U.polka = polka; U.tag = null; U.sort = 'domyslnie'; }
  lsSet('zakladka-widok', widok);
  renderWidok();
  window.scrollTo({ top: 0 });
  $('#widok').focus({ preventScroll: true });
}

/* ================= arkusz: szczegóły książki ================= */
function htmlKsiazki(k) {
  const proc = k.strona / k.strony * 100;
  const tempo = tempoKsiazki(k);
  const tempoDoKonca = tempo || tempoOgolne();
  const prog = k.status === 'czytam' ? prognozaKsiazki(k) : null;
  const dniCzytania = new Set(k.log.map(w => w.data)).size;
  const minuty = k.sesje.reduce((s, x) => s + x.minuty, 0);
  const lista = kolejka();
  const nr = lista.indexOf(k);
  const p = k.bazowa ? planBazowej(k) : null;

  let akcje = '';
  if (k.status === 'czytam') {
    akcje = `<button type="button" class="btn btn-glowny" data-akcja="postep" data-id="${k.id}">Zapisz postęp</button>
      <button type="button" class="btn" data-akcja="sesja" data-id="${k.id}">${I.zegar}Sesja</button>
      <button type="button" class="btn" data-akcja="skonczona" data-id="${k.id}">${I.check}Skończona</button>
      ${k.bazowa ? `<button type="button" class="btn" data-akcja="bazowa" data-id="${k.id}">Zmień termin</button>
        <button type="button" class="btn-tekst" data-akcja="zdejmij-bazowa" data-id="${k.id}">Przestań traktować jako bazową</button>`
        : `<button type="button" class="btn" data-akcja="bazowa" data-id="${k.id}">Ustaw jako bazową</button>`}
      <button type="button" class="btn-tekst" data-akcja="na-pozniej" data-id="${k.id}">Odłóż na później</button>
      <button type="button" class="btn-tekst" data-akcja="porzuc" data-id="${k.id}">Porzuć</button>`;
  } else if (k.status === 'pozniej') {
    akcje = `<button type="button" class="btn btn-glowny" data-akcja="${k.strona ? 'wznow' : 'zacznij'}" data-id="${k.id}">${k.strona ? `Wróć do czytania (s. ${k.strona})` : 'Zacznij czytać'}</button>
      <button type="button" class="btn" data-akcja="do-kolejki" data-id="${k.id}">Do kolejki</button>
      <button type="button" class="btn-tekst" data-akcja="do-kolejki" data-id="${k.id}" data-poczatek="1">Na początek kolejki</button>`;
  } else if (k.status === 'zyczenia') {
    akcje = `<button type="button" class="btn btn-glowny" data-akcja="mam-ja" data-id="${k.id}">${I.check}Mam ją: do przeczytania</button>
      <button type="button" class="btn" data-akcja="zacznij" data-id="${k.id}">Zacznij czytać</button>
      <button type="button" class="btn-tekst" data-akcja="na-pozniej" data-id="${k.id}">Na później</button>`;
  } else if (k.status === 'doPrzeczytania') {
    akcje = `<button type="button" class="btn btn-glowny" data-akcja="zacznij" data-id="${k.id}">Zacznij czytać</button>
      <button type="button" class="btn" data-akcja="bazowa" data-id="${k.id}">Zacznij jako bazową</button>
      <span class="kolejka-ster" role="group" aria-label="Pozycja w kolejce">
        <button type="button" class="btn-ikona" data-akcja="kolejka" data-id="${k.id}" data-kierunek="-1" aria-label="Wyżej w kolejce"${nr <= 0 ? ' disabled' : ''}>${I.gora}</button>
        <button type="button" class="btn-ikona" data-akcja="kolejka" data-id="${k.id}" data-kierunek="1" aria-label="Niżej w kolejce"${nr >= lista.length - 1 ? ' disabled' : ''}>${I.dol}</button>
        ${nr > 0 ? `<button type="button" class="btn-tekst" data-akcja="na-poczatek" data-id="${k.id}">Na początek</button>` : ''}
      </span>
      <button type="button" class="btn-tekst" data-akcja="na-pozniej" data-id="${k.id}">Na później</button>
      <button type="button" class="btn-tekst" data-akcja="zyczenia" data-id="${k.id}">Na listę życzeń</button>`;
  } else if (k.status === 'przeczytana') {
    akcje = `<button type="button" class="btn" data-akcja="ponownie" data-id="${k.id}">Przeczytaj ponownie</button>`;
  } else {
    akcje = `<button type="button" class="btn btn-glowny" data-akcja="wznow" data-id="${k.id}">Wróć do czytania</button>`;
  }

  const cytaty = [...k.cytaty].sort((a, b) => (a.strona || 0) - (b.strona || 0));
  return `<div class="kd-gora">${okladka(k, 'l')}
    <div class="kd-meta">
      <p class="kd-status">${esc(statusKsiazki(k))}</p>
      <h2 class="kd-tytul">${esc(k.tytul)}</h2>
      ${k.autor ? `<p class="kd-autor">${esc(k.autor)}</p>` : ''}
      ${k.seria ? `<p class="kd-cykl">${esc(k.seria)}${k.tom != null ? `, ${tomTekst(k.tom)}` : ''}</p>` : ''}
      <p class="kd-szczegoly">${czyTechniczna(k) ? '<span class="znacznik-tech">techniczna</span> ' : ''}${ile(k.strony, FORMY_STRON)}, ${FORMATY[k.format].toLowerCase()}${k.isbn ? `, ISBN ${esc(k.isbn)}` : ''}</p>
      ${k.tagi.length ? `<p class="kd-tagi">${k.tagi.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</p>` : ''}
    </div></div>
  ${k.status === 'czytam' ? `<div class="kd-postep">
    <p class="kd-strona"><span>Strona <strong>${k.strona}</strong> z ${k.strony}</span><span>${Math.floor(proc)}%</span></p>
    ${pasek(proc, { plan: p ? p.planDzis / k.strony * 100 : null })}
    <p class="cichy">${[
      p ? `Termin ${dataDluga(k.celData)}, dziś norma ${ile(p.norma, FORMY_STRON)}` : '',
      prog ? `przy obecnym tempie skończysz ok. ${dataDluga(prog, false)}` : '',
      tempoDoKonca ? `zostało ok. ${czasCzytania((k.strony - k.strona) / tempoDoKonca)} czytania` : ''
    ].filter(Boolean).join(', ').replace(/^./, c => c.toUpperCase()) || 'Zapisuj postęp, a pokażę, kiedy skończysz.'}</p></div>` : ''}
  ${k.status === 'przeczytana' ? `<div class="kd-ocena"><p>Twoja ocena</p>${gwiazdki(k)}</div>${htmlWrazen(k)}` : ''}
  ${k.status === 'porzucona' ? `<p class="kd-porzucona">Porzucona ${k.porzucono ? dataDluga(k.porzucono) : ''}${k.strona ? ` na stronie ${k.strona}` : ''}${k.powodPorzucenia ? `. Powód: ${esc(POWODY_PORZUCENIA.find(p => p.id === k.powodPorzucenia).nazwa.toLowerCase())}` : ''}.</p>` : ''}
  <div class="przyciski kd-akcje">${akcje}</div>
  ${htmlZyczenia(k)}
  ${htmlRozdzialow(k)}
  ${['czytam', 'doPrzeczytania', 'pozniej'].includes(k.status) ? `<p class="kd-plan">${I.kalendarz}${k.planMiesiac
    ? `<span>W planie na <button type="button" class="btn-tekst" data-akcja="miesiac" data-ym="${k.planMiesiac}">${nazwaMiesiaca(k.planMiesiac)}</button></span><button type="button" class="btn-tekst" data-akcja="plan-ksiazki" data-id="${k.id}">Zmień</button>`
    : `<button type="button" class="btn-tekst" data-akcja="plan-ksiazki" data-id="${k.id}">Zaplanuj na miesiąc</button>`}
    ${k.bazowa ? '<span class="kd-plan-tydz">· norma dzienna liczona automatycznie</span>' : planTygodnia().some(e => e.id === k.id) ? '<span class="kd-plan-tydz">· w planie tego tygodnia</span>' : `<button type="button" class="btn-tekst" data-akcja="do-tygodnia" data-id="${k.id}">Na ten tydzień</button>`}</p>` : ''}
  ${k.status === 'przeczytana' || k.recenzja ? `<label class="kd-recenzja">Twoje wrażenia<textarea name="recenzja" rows="3" placeholder="Co zostanie ci z tej książki?">${esc(k.recenzja)}</textarea></label>` : ''}
  ${htmlOpisu(k)}
  ${htmlOpinii(k)}
  ${htmlPozyczki(k)}
  ${htmlSerii(k)}
  ${htmlPodobnych(k)}
  <section class="kd-sekcja">
    <div class="sekcja-gora"><h3>Cytaty i notatki</h3><button type="button" class="btn btn-maly" data-akcja="cytat-dodaj" data-id="${k.id}">${I.plus}Dodaj cytat</button></div>
    ${cytaty.length ? cytaty.map(c => `<article class="cytat${c.notatka ? ' cytat-notatka' : ''}">
      ${c.notatka ? '<p class="cytat-rodzaj">Moja notatka</p>' : ''}<blockquote>${esc(c.tekst)}</blockquote>
      <footer><span class="cichy">${c.strona ? `s. ${c.strona}, ` : ''}${dataKrotka(c.data)}</span>
      <span class="cytat-akcje"><button type="button" class="btn-ikona maly" data-akcja="cytat-kopiuj" data-id="${k.id}" data-cid="${c.id}" aria-label="Kopiuj">${I.kopiuj}</button>
      <button type="button" class="btn-ikona maly" data-akcja="cytat-obraz" data-id="${k.id}" data-cid="${c.id}" aria-label="Zapisz jako obrazek">${I.obraz}</button>
      <button type="button" class="btn-ikona maly" data-akcja="cytat-edytuj" data-id="${k.id}" data-cid="${c.id}" aria-label="Edytuj">${I.edytuj}</button></span></footer></article>`).join('')
      : '<p class="cichy">Zapisz zdanie, które chcesz zapamiętać, albo własną myśl z numerem strony.</p>'}
  </section>
  <section class="kd-sekcja"><h3>Historia</h3><dl class="rekordy">
    <div><dt>Dodana</dt><dd>${dataDluga(k.dodano)}</dd></div>
    ${k.start ? `<div><dt>Zaczęta</dt><dd>${dataDluga(k.start)}</dd></div>` : ''}
    ${k.koniec && k.status === 'przeczytana' ? `<div><dt>Skończona</dt><dd>${dataDluga(k.koniec)}${k.start ? `, po ${ile(dniMiedzy(k.start, k.koniec) + 1, FORMY_DNI)}` : ''}</dd></div>` : ''}
    ${dniCzytania ? `<div><dt>Dni z czytaniem</dt><dd>${dniCzytania}</dd></div>` : ''}
    ${k.sesje.length ? `<div><dt>Sesje</dt><dd>${k.sesje.length}, razem ${czasCzytania(minuty / 60)}</dd></div>` : ''}
    ${tempo ? `<div><dt>Tempo</dt><dd>${Math.round(tempo)} str./h</dd></div>` : ''}
    ${k.czytania.length ? `<div><dt>Wcześniej przeczytana</dt><dd>${k.czytania.map(c => dataDluga(c.koniec)).join(', ')}</dd></div>` : ''}
  </dl>
  ${k.log.length ? `<details class="dziennik"><summary>Dziennik czytania (${ile(k.log.length, ['wpis', 'wpisy', 'wpisów'])})</summary>
    <p class="cichy">Pomyliłeś się? Kliknij wpis, żeby zmienić liczbę stron, przenieść go na inny dzień albo usunąć.</p>
    <ul class="dziennik-lista">${[...k.log].sort((a, b) => b.data.localeCompare(a.data)).map(w =>
      `<li><button type="button" class="dziennik-wpis" data-akcja="wpis" data-id="${k.id}" data-data="${w.data}"><span>${dataDluga(w.data)}</span><strong>+${ile(w.strony, FORMY_STRON)}</strong>${I.edytuj}</button></li>`).join('')}</ul>
  </details>` : ''}</section>
  <div class="kd-dol"><button type="button" class="btn" data-akcja="edytuj" data-id="${k.id}">${I.edytuj}Edytuj</button>
    <button type="button" class="btn btn-ryzyko" data-akcja="usun" data-id="${k.id}">${I.kosz}Usuń</button></div>`;
}

function arkuszKsiazki(id) {
  const k = znajdz(id);
  if (!k) return;
  const a = arkusz({ tytul: k.tytul, ukryjTytul: true, klasa: 'arkusz-ksiazka', odswiezalny: true, ksiazkaId: id, render: () => htmlKsiazki(znajdz(id)) });
  a.tresc.addEventListener('change', e => {
    if (e.target.name !== 'recenzja') return;
    const kk = znajdz(id);
    kk.recenzja = e.target.value.trim();
    utrwal(kk);
    toast('Zapisano wrażenia.');
  });
}

/* ================= arkusz: dodawanie i edycja ================= */
/* ---------- 2.23: szybsze i pewniejsze zapisywanie książek ---------- */
/** Link z księgarni albo serwisu → fraza do wyszukania (tytuł z adresu). */
function frazaZLinku(q) {
  if (!/^https?:\/\//i.test(q)) return null;
  try {
    const u = new URL(q);
    const isbn = (u.pathname + u.search).match(/97[89]\d{10}/);
    if (isbn) return isbn[0];
    const czesci = u.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    // lubimyczytac.pl/ksiazka/123/tytul, empik.com/tytul-autor,p123,ksiazka-p, taniaksiazka.pl/tytul-autor-p-123.html
    let slug = czesci.reverse().find(c => /[a-ząćęłńóśźż]{3,}-[a-ząćęłńóśźż]/i.test(c)) || czesci[0] || '';
    slug = slug.split(',')[0].replace(/\.(html?|php)$/i, '').replace(/-p-\d+$/i, '').replace(/-\d{4,}$/g, '').replace(/[-_+]+/g, ' ').trim();
    return slug.length >= 3 ? slug : null;
  } catch { return null; }
}
/** Czy ta książka (ISBN albo tytuł i nazwisko autora, bez polskich znaków) już jest w bibliotece. */
function podobnaWBibliotece(w) {
  const bez = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').split(/[:(]/)[0].replace(/[^a-z0-9]+/g, ' ').trim();
  const nazw = t => bez(t).split(' ').pop() || '';
  return Z.ksiazki.find(k => (w.isbn && k.isbn && k.isbn === w.isbn) || (bez(k.tytul) === bez(w.tytul) && (!w.autor || !k.autor || nazw(k.autor) === nazw(w.autor)))) || null;
}
/** Dyktowanie: mówisz tytuł, aplikacja wpisuje go w pole i szuka. */
function dyktuj(pole, potem, przycisk) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR || !pole) return;
  const r = new SR();
  r.lang = 'pl-PL'; r.interimResults = true; r.maxAlternatives = 1;
  przycisk && przycisk.classList.add('nagrywa');
  r.onresult = e => { pole.value = [...e.results].map(x => x[0].transcript).join(' '); };
  r.onerror = e => { toast(e.error === 'not-allowed' ? 'Pozwól na mikrofon, żeby dyktować tytuł.' : 'Nie usłyszałam. Spróbuj jeszcze raz.'); };
  r.onend = () => { przycisk && przycisk.classList.remove('nagrywa'); if (pole.value.trim()) potem(); };
  try { r.start(); } catch { przycisk && przycisk.classList.remove('nagrywa'); }
}

function arkuszFormularza(id = null, { jako = 'doPrzeczytania' } = {}) {
  const edytowana = id ? znajdz(id) : null;
  const k = edytowana || { tytul: '', autor: '', strony: '', isbn: '', format: 'papier', tagi: [], okladka: null, seria: '', tom: null };
  let okl = k.okladka;
  let wyniki = [], opisWyniku = '';
  const a = arkusz({
    tytul: edytowana ? 'Edytuj książkę' : 'Dodaj książkę',
    render: () => `<form class="formularz" novalidate>
      ${edytowana ? '' : `<div class="szukajka">
        <label for="f-q">Znajdź w internecie</label>
        <div class="szukajka-rzad"><input id="f-q" type="search" placeholder="Tytuł, autor albo ISBN" enterkeyhint="search" autocomplete="off">
          <button type="button" class="btn" data-szukaj>${I.szukaj}<span class="sr">Szukaj</span></button>
          ${U.skaner ? `<button type="button" class="btn" data-skanuj aria-label="Skanuj kod kreskowy">${I.skaner}</button>` : ''}
          ${window.SpeechRecognition || window.webkitSpeechRecognition ? '<button type="button" class="btn" data-dyktuj aria-label="Powiedz tytuł">🎤</button>' : ''}</div>
        <div class="wyniki" aria-live="polite"></div>
        <p class="podpowiedz">Możesz też wkleić link z Lubimyczytać, Empiku czy innej księgarni. Albo wpisz dane ręcznie poniżej. Masz kilka książek? <button type="button" class="btn-tekst" data-wiele>Dodaj wiele naraz</button></p>
      </div>`}
      <div class="f-okladka"><div class="f-okl-podglad"></div>
        <div class="f-okl-akcje"><label class="btn">${I.aparat}Zdjęcie okładki<input type="file" accept="image/*" data-plik class="sr"></label>
          <button type="button" class="btn-tekst" data-bez-okladki>Bez okładki</button></div></div>
      <label>Tytuł<input name="tytul" value="${esc(k.tytul)}" required autocomplete="off"${edytowana ? ' autofocus' : ''}></label>
      <label>Autor<input name="autor" value="${esc(k.autor)}" autocomplete="off"></label>
      <div class="f-rzad f-rzad-seria"><label>Cykl (opcjonalnie)<input name="seria" value="${esc(k.seria || '')}" list="znane-serie" autocomplete="off" placeholder="np. Wiedźmin"></label>
        <label>Tom<input name="tom" type="number" inputmode="decimal" min="0" step="0.5" value="${k.tom ?? ''}"></label></div>
      <datalist id="znane-serie">${serie().map(x => `<option value="${esc(x.nazwa)}">`).join('')}</datalist>
      <div class="f-rzad"><label>Liczba stron<input name="strony" type="number" inputmode="numeric" min="1" value="${esc(k.strony)}" required></label>
        <label>ISBN<input name="isbn" inputmode="numeric" value="${esc(k.isbn)}" autocomplete="off"></label></div>
      <fieldset class="segment"><legend>Format</legend>${Object.entries(FORMATY).map(([v, n]) => radio('format', v, n, k.format === v)).join('')}</fieldset>
      <label class="przelacznik"><input type="checkbox" name="techniczna"${k.rodzaj === 'techniczna' ? ' checked' : ''}><span>Książka techniczna / do nauki</span></label>
      <p class="podpowiedz">Czytana po kawałku, rozdziałami, nie codziennie. Nie trafia do planu tygodnia ani losowania, a postęp odhaczasz rozdziałami.</p>
      <p class="podpowiedz f-audio"${k.format === 'audio' ? '' : ' hidden'}>Przy audiobooku wpisz liczbę stron wydania papierowego, a postęp zapisuj w stronach albo procentach tej liczby.</p>
      <label>Tagi<input name="tagi" value="${esc(k.tagi.join(', '))}" placeholder="np. historia, reportaż" autocomplete="off"></label>
      <p class="podpowiedz">Oddziel przecinkami.</p>
      ${htmlWyboruKategorii(k)}
      ${edytowana ? '' : `<fieldset class="segment"><legend>Gdzie odłożyć</legend>
        ${radio('gdzie', 'doPrzeczytania', 'Do przeczytania', jako === 'doPrzeczytania')}${radio('gdzie', 'czytam', 'Czytam teraz', jako === 'czytam')}${radio('gdzie', 'bazowa', 'Jako bazową', jako === 'bazowa')}${radio('gdzie', 'zyczenia', 'Lista życzeń', jako === 'zyczenia')}${radio('gdzie', 'pozniej', 'Na później', jako === 'pozniej')}</fieldset>
        <label class="f-miesiace"${jako === 'bazowa' ? '' : ' hidden'}>Na ile miesięcy?<input name="miesiace" type="number" inputmode="decimal" min="0.5" step="0.5" value="2"></label>
        <label class="f-juz"${jako === 'czytam' || jako === 'bazowa' ? '' : ' hidden'}>Już zaczęte? Jestem na stronie<input name="juz" type="number" inputmode="numeric" min="0" placeholder="0"></label>
        <div class="f-listy"${jako === 'zyczenia' ? '' : ' hidden'}>${htmlListWFormularzu()}</div>`}
      <p class="blad" hidden></p>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Anuluj</button>
        ${edytowana ? '' : '<button type="submit" class="btn" data-i-nastepna>Dodaj i następną</button>'}
        <button type="submit" class="btn btn-glowny">${edytowana ? 'Zapisz zmiany' : 'Dodaj książkę'}</button></div>
    </form>`
  });
  const f = $('form', a.tresc);
  const el = n => f.elements.namedItem(n);
  const podglad = () => {
    $('.f-okl-podglad', f).innerHTML = okladka({ tytul: el('tytul').value || 'Tytuł', autor: el('autor').value, okladka: okl }, 'l');
    $('[data-bez-okladki]', f).hidden = !okl;
  };
  podglad();
  ['tytul', 'autor'].forEach(n => el(n).addEventListener('input', () => { if (!okl) podglad(); }));

  const pokazBlad = t => { const b = $('.blad', f); b.textContent = t; b.hidden = !t; };

  const podpowiedzZrodel = () => {
    const u = Z.ustawienia, s = Wyszukiwarka.stan;
    const rady = [];
    if (s.googleLimit && !u.googleKlucz) rady.push('Google Books odmówił (wspólny limit zapytań). Dodaj darmowy klucz w Ustawieniach → Wyszukiwanie książek.');
    if (typeof s.ostatnie.bn === 'string' && s.ostatnie.bn.startsWith('błąd')) rady.push('Biblioteka Narodowa teraz nie odpowiada. Spróbuj za chwilę albo sprawdź pośrednika w Ustawieniach → Wyszukiwanie książek.');
    return rady.length ? `<div class="rada-zrodla">${rady.map(r => `<p>${esc(r)}</p>`).join('')}<button type="button" class="btn-tekst" data-do-ustawien>Otwórz ustawienia wyszukiwania</button></div>` : '';
  };
  const bezWynikow = q => Wyszukiwarka.czyIsbn(q)
    ? `<p class="cichy">Nie znalazłem książki o numerze ${esc(q)}. Numer ISBN wpisałem do formularza. Wpisz tytuł (i autora) w pole wyszukiwania, a poszukam po tytule, albo uzupełnij dane ręcznie.</p>${podpowiedzZrodel()}`
    : `<p class="cichy">Nic nie znalazłem. Sprawdź pisownię, spróbuj samego nazwiska autora albo wpisz dane ręcznie.</p>${podpowiedzZrodel()}`;

  async function szukaj() {
    let q = $('#f-q', f).value.trim();
    const zLinku = frazaZLinku(q);
    if (zLinku) { q = zLinku; $('#f-q', f).value = q; }
    const box = $('.wyniki', f);
    if (!q) { $('#f-q', f).focus(); return; }
    if (!navigator.onLine) { box.innerHTML = '<p class="cichy">Jesteś offline. Wpisz dane ręcznie albo spróbuj, gdy wróci internet.</p>'; return; }
    box.innerHTML = '<p class="cichy ladowanie">Szukam…</p>';
    try {
      wyniki = await Wyszukiwarka.szukajMadrze(q);
      box.innerHTML = wyniki.length
        ? `<ul class="wyniki-lista">${wyniki.slice(0, 12).map((w, i) => `<li><button type="button" class="wynik" data-wynik="${i}">
            ${okladka({ tytul: w.tytul, autor: w.autor, okladka: w.okladka }, 's')}
            <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(w.tytul)}</span>
            <span class="wiersz-autor">${esc([w.autor, w.rok, w.strony ? ile(w.strony, FORMY_STRON) : ''].filter(Boolean).join(', '))}</span></span></button></li>`).join('')}</ul>`
        : bezWynikow(q);
      if (wyniki.length) box.insertAdjacentHTML('beforeend', `<p class="cichy zrodla-info">Źródło: ${esc([...new Set(wyniki.map(w => w.zrodlo))].join(', '))}.</p>`);
      if (Wyszukiwarka.stan.poprawka) box.insertAdjacentHTML('afterbegin', `<p class="poprawka">Czy chodziło ci o: <button type="button" class="btn-tekst" data-poprawka>${esc(Wyszukiwarka.stan.poprawka)}</button>?</p>`);
      const isbn = Wyszukiwarka.czyIsbn(q);
      if (isbn) {
        el('isbn').value = isbn.length === 10 ? Wyszukiwarka.isbn10na13(isbn) || isbn : isbn;
        // jeden pewny wynik po ISBN: wpisz od razu, bez dodatkowego klikania
        if (wyniki.length === 1) $('[data-wynik="0"]', box)?.click();
      }
    } catch (e) {
      console.warn(e);
      box.innerHTML = `<p class="cichy">Wyszukiwarka nie odpowiada. Wpisz dane ręcznie.</p>${podpowiedzZrodel()}`;
    }
  }

  f.addEventListener('click', async e => {
    if (e.target.closest('[data-szukaj]')) szukaj();
    const nl = e.target.closest('[data-nowa-lista-f]');
    if (nl) {
      const pole = $('[data-nazwa-listy-f]', f), nazwa = (nl.dataset.nowaListaF || pole.value).trim();
      if (!nazwa) { pole.focus(); return; }
      const n = { id: noweId(), nazwa: nazwa.slice(0, 40), emoji: nl.dataset.emoji || '🛒' };
      Z.ustawienia.listyZyczen.push(n); utrwalUstawienia();
      const zazn = new Set([...$$('[name="lista-f"]:checked', f).map(x => x.value), n.id]);
      $('.f-listy', f).innerHTML = htmlListWFormularzu(zazn);
      toast(`Nowa lista: ${n.emoji} ${n.nazwa}`);
    }
    const pop = e.target.closest('[data-poprawka]');
    if (pop) { $('#f-q', f).value = pop.textContent; szukaj(); }
    if (e.target.closest('[data-wiele]')) { a.zamknij(); arkuszWielu(); return; }
    if (e.target.closest('[data-dyktuj]')) dyktuj($('#f-q', f), () => szukaj(), e.target.closest('[data-dyktuj]'));
    if (e.target.closest('[data-skanuj]')) arkuszSkanera(kod => { $('#f-q', f).value = kod; el('isbn').value = kod; szukaj(); });
    if (e.target.closest('[data-bez-okladki]')) { okl = null; podglad(); }
    if (e.target.closest('[data-do-ustawien]')) {
      while (otwarte.length) otwarte[otwarte.length - 1].zamknij();
      idz('ustawienia');
      setTimeout(() => { const c = $('#f-wyszukiwanie'); if (c) window.scrollTo({ top: c.getBoundingClientRect().top + window.scrollY - 70 }); }, 400);
    }
    const w = e.target.closest('[data-wynik]');
    if (w) {
      const r = wyniki[+w.dataset.wynik];
      el('tytul').value = r.tytul;
      el('autor').value = r.autor;
      opisWyniku = r.opis || '';
      if (r.strony) el('strony').value = r.strony;
      if (r.isbn) el('isbn').value = r.isbn;
      if (r.seria) { el('seria').value = r.seria; el('tom').value = r.tom ?? ''; }
      if (r.tagi && r.tagi.length && !el('tagi').value.trim()) el('tagi').value = r.tagi.join(', ');
      okl = r.okladka;
      podglad();
      const dup = podobnaWBibliotece(r);
      $('.wyniki', f).innerHTML = `<p class="ok">Wybrano: ${esc(r.tytul)}.${r.strony ? '' : ' Uzupełnij liczbę stron.'}</p>${dup ? `<p class="ostrzezenie-dup">⚠️ Masz już „${esc(dup.tytul)}”${dup.autor ? ` (${esc(dup.autor)})` : ''} na półce <strong>${esc((POLKI.find(([id]) => id === dup.status) || [, dup.status])[1])}</strong>.</p>` : ''}`;
      if (dup) Glos.mow('Uwaga, tę książkę już masz na półce.', 's', { wl: Z.ustawienia.gra.glosSowki });
      if (!r.strony) el('strony').focus();
      if (r.okladka) {
        const zapisana = await urlNaOkladke(r.okladka);
        if (okl === r.okladka) { okl = zapisana; }
      }
    }
  });
  $('#f-q', f)?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); szukaj(); } });
  podlaczPodpowiedzi($('#f-q', f), { naWybor: () => szukaj() });
  $('[data-plik]', f).addEventListener('change', async e => {
    const plik = e.target.files[0];
    if (!plik) return;
    try { okl = await plikNaOkladke(plik); podglad(); } catch { toast('Nie udało się wczytać zdjęcia.', { typ: 'blad' }); }
  });
  f.addEventListener('change', e => {
    if (e.target.name === 'gdzie') { $('.f-miesiace', f).hidden = e.target.value !== 'bazowa'; $('.f-listy', f).hidden = e.target.value !== 'zyczenia'; $('.f-juz', f).hidden = !['czytam', 'bazowa'].includes(e.target.value); }
    if (e.target.name === 'format') $('.f-audio', f).hidden = e.target.value !== 'audio';
    if (e.target.name === 'seria' && !el('tom').value) {
      // znany cykl: podpowiedz kolejny numer tomu
      const tomy = ksiazkiSerii(e.target.value).filter(x => x !== edytowana && x.tom != null).map(x => x.tom);
      if (tomy.length) el('tom').value = Math.floor(Math.max(...tomy)) + 1;
    }
  });

  f.addEventListener('submit', async e => {
    e.preventDefault();
    const tytul = el('tytul').value.trim();
    const strony = Math.round(+el('strony').value);
    if (!tytul) { pokazBlad('Wpisz tytuł.'); el('tytul').focus(); return; }
    if (!(strony >= 1)) { pokazBlad('Wpisz liczbę stron.'); el('strony').focus(); return; }
    const dane = {
      tytul, autor: el('autor').value.trim(), strony, isbn: el('isbn').value.replace(/[^\dXx]/g, ''),
      format: f.elements.format.value, tagi: el('tagi').value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean), okladka: okl,
      rodzaj: f.elements.techniczna.checked ? 'techniczna' : 'zwykla',
      kategorie: $$('[name="kat"]:checked', f).map(x => x.value).slice(0, 3),
      seria: el('seria').value.trim().slice(0, 80), tom: +el('tom').value > 0 ? Math.round(+el('tom').value * 10) / 10 : null
    };
    if (edytowana) {
      Object.assign(edytowana, dane, { tagi: [...new Set(dane.tagi)] });
      edytowana.strona = Math.min(edytowana.strona, strony);
      if (edytowana.status === 'przeczytana') edytowana.strona = strony;
      utrwal(edytowana);
      a.zamknij();
      odswiez();
      toast('Zapisano zmiany.');
      return;
    }
    const klucz = (tytul + dane.autor).toLowerCase();
    if (Z.ksiazki.some(x => (x.tytul + x.autor).toLowerCase() === klucz)
      && !(await potwierdz(`„${esc(tytul)}” jest już w bibliotece. Dodać drugi egzemplarz?`, { tytul: 'Ta książka już jest', tak: 'Dodaj mimo to' }))) return;
    const nowa = nowaKsiazka(dane);
    let zmienione = [nowa];
    const gdzie = f.elements.gdzie.value;
    if (gdzie === 'czytam') zacznijCzytac(nowa);
    if (gdzie === 'zyczenia') { naListeZyczen(nowa); nowa.listy = $$('[name="lista-f"]:checked', f).map(x => x.value); }
    if (gdzie === 'pozniej') odlozNaPozniej(nowa);
    if (gdzie === 'bazowa') {
      const mies = Math.max(0.5, parseFloat(String(el('miesiace').value).replace(',', '.')) || 2);
      zmienione = ustawBazowa(nowa, dodajDni(dzisISO(), Math.round(mies * 30.44) - 1));
    }
    const juz = Math.round(+(el('juz') && el('juz').value) || 0);
    if (juz > 0 && (gdzie === 'czytam' || gdzie === 'bazowa')) {
      // strony przeczytane przed dodaniem: bez wpisu do dzisiejszego licznika
      nowa.strona = Math.min(juz, nowa.strony - 1);
      if (nowa.planOd) nowa.planOd = { data: dzisISO(), strona: nowa.strona };
    }
    await utrwal(zmienione);
    const nastepna = e.submitter && e.submitter.hasAttribute('data-i-nastepna');
    a.zamknij();
    if (nastepna) setTimeout(() => { arkuszFormularza(null, { jako: gdzie === 'bazowa' ? 'doPrzeczytania' : gdzie }); Glos.mow('Książka zapisana. Hu-hu!', 's', { wl: Z.ustawienia.gra.glosSowki }); }, 260);
    if (U.widok === 'biblioteka') U.polka = nowa.status;
    odswiez();
    toast(`Dodano „${nowa.tytul}”.`);
    if (opisWyniku && !nowa.opis) { nowa.opis = opisWyniku; nowa.opisZrodlo = 'Biblioteka Narodowa'; utrwal(nowa); }
    if (nowa.status === 'zyczenia') sprawdzCeny(nowa, { cicho: true });
    poDodaniu(nowa);
  });
  if (!edytowana) setTimeout(() => $('#f-q', f).focus(), 80);
}

/* ================= arkusz: postęp ================= */
function arkuszPostepu(id) {
  const k = znajdz(id);
  if (!k) return;
  const zapamietane = lsGet('zakladka-procent-' + id);
  const procentowo = zapamietane != null ? zapamietane === '1' : k.format !== 'papier';
  const a = arkusz({
    tytul: 'Zapisz postęp', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <div class="postep-ksiazka">${okladka(k, 's')}<span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">Teraz strona ${k.strona} z ${k.strony}</span></span></div>
      <fieldset class="segment segment-maly"><legend class="sr">Jednostka</legend>${radio('jednostka', 'strona', 'Strona', !procentowo)}${radio('jednostka', 'proc', 'Procent', procentowo)}</fieldset>
      <label class="pole-duze"><span data-etykieta>${procentowo ? 'Przeczytałem procent' : 'Jestem na stronie'}</span><input name="strona" type="number" inputmode="decimal" min="0" max="${procentowo ? 100 : k.strony}" step="${procentowo ? 0.1 : 1}" value="${procentowo ? (k.strona ? +(k.strona / k.strony * 100).toFixed(1) : '') : (k.strona || '')}" placeholder="${procentowo ? 0 : k.strona}" autofocus></label>
      <div class="szybkie" role="group" aria-label="Dodaj strony"></div>
      <fieldset class="segment"><legend>Kiedy czytałeś</legend>${radio('kiedy', 'dzis', 'Dziś', true)}${radio('kiedy', 'wczoraj', 'Wczoraj')}${radio('kiedy', 'inny', 'Inny dzień')}</fieldset>
      <label class="f-data" hidden>Data<input type="date" name="data" max="${dzisISO()}" value="${dodajDni(dzisISO(), -2)}"></label>
      <p class="podsumowanie" aria-live="polite">&nbsp;</p>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Zapisz</button></div>
    </form>`
  });
  const f = $('form', a.tresc), pole = f.elements.namedItem('strona');
  let proc = procentowo;
  const naStrone = w => proc ? Math.round(+String(w).replace(',', '.') / 100 * k.strony) : Math.round(+w);
  const rysujSzybkie = () => {
    $('.szybkie', f).innerHTML = (proc ? [1, 5, 10, 25] : [5, 10, 25, 50]).map(n => `<button type="button" class="chip" data-plus="${n}">+${n}${proc ? '%' : ''}</button>`).join('')
      + `<button type="button" class="chip" data-koniec>${proc ? '100%' : 'Ostatnia strona'}</button>`;
  };
  rysujSzybkie();
  const podsum = () => {
    const v = naStrone(pole.value), r = v - k.strona;
    $('.podsumowanie', f).textContent = pole.value === '' || !Number.isFinite(v) ? ' '
      : v >= k.strony ? 'To koniec książki.'
      : r > 0 ? `+${ile(r, FORMY_STRON)}`
      : r < 0 ? `Poprawka: ${ile(r, FORMY_STRON)}` : 'Bez zmian.';
  };
  pole.addEventListener('input', podsum);
  f.addEventListener('click', e => {
    const b = e.target.closest('[data-plus]');
    const teraz = pole.value === '' ? (proc ? k.strona / k.strony * 100 : k.strona) : +String(pole.value).replace(',', '.');
    if (b) { pole.value = proc ? +Math.min(100, teraz + +b.dataset.plus).toFixed(1) : Math.min(k.strony, teraz + +b.dataset.plus); podsum(); }
    if (e.target.closest('[data-koniec]')) { pole.value = proc ? 100 : k.strony; podsum(); }
  });
  f.addEventListener('change', e => {
    if (e.target.name === 'kiedy') $('.f-data', f).hidden = e.target.value !== 'inny';
    if (e.target.name === 'jednostka') {
      const strona = pole.value === '' ? null : naStrone(pole.value);
      proc = e.target.value === 'proc';
      lsSet('zakladka-procent-' + k.id, proc ? '1' : '0');
      pole.max = proc ? 100 : k.strony;
      pole.step = proc ? 0.1 : 1;
      if (strona != null) pole.value = proc ? +(strona / k.strony * 100).toFixed(1) : strona;
      $('[data-etykieta]', f).textContent = proc ? 'Przeczytałem procent' : 'Jestem na stronie';
      rysujSzybkie();
      podsum();
    }
  });
  f.addEventListener('submit', e => {
    e.preventDefault();
    if (pole.value === '') { pole.focus(); return; }
    const kiedy = f.elements.kiedy.value;
    let data = kiedy === 'dzis' ? dzisISO() : kiedy === 'wczoraj' ? dodajDni(dzisISO(), -1) : f.elements.namedItem('data').value;
    if (!poprawnaData(data) || data > dzisISO()) data = dzisISO();
    const { roznica, skonczona } = ustawStrone(k, naStrone(pole.value), data);
    utrwal(k);
    a.zamknij();
    odswiez();
    if (skonczona) celebracja(k.id);
    else if (roznica > 0) toast(`Zapisano: +${ile(roznica, FORMY_STRON)}${data !== dzisISO() ? ` (${dataKrotka(data)})` : ''}.`);
    else if (roznica < 0) toast('Poprawiono stronę.');
  });
  setTimeout(() => { pole.focus(); pole.select(); }, 80);
}

/* ================= sesja czytania ================= */
const sesjaAktywna = () => { try { return JSON.parse(lsGet('zakladka-sesja') || 'null'); } catch { return null; } };
function stoper(ms) {
  const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

function otworzSesje(id) {
  let s = sesjaAktywna();
  if (s && !znajdz(s.id)) { lsSet('zakladka-sesja', null); s = null; }
  if (s && s.id !== id) {
    potwierdz(`Trwa sesja z „${esc(znajdz(s.id).tytul)}”. Zakończ ją, zanim zaczniesz kolejną.`, { tytul: 'Sesja w toku', tak: 'Pokaż sesję' })
      .then(ok => ok && arkuszSesji(s.id));
    return;
  }
  if (!s) {
    const k = znajdz(id);
    if (k.status !== 'czytam') { zacznijCzytac(k); utrwal(k); odswiez(); }
    const poprz = (() => { try { return JSON.parse(lsGet('zakladka-sesja-ustawienia') || '{}'); } catch { return {}; } })();
    lsSet('zakladka-sesja', JSON.stringify({ id, start: Date.now(), strona: k.strona, cel: poprz.cel || 0, tlo: poprz.tlo || '' }));
    setTimeout(() => Glos.mow(SESJA_TEKSTY.start, 's', { wl: Z.ustawienia.gra.glosSowki }), 500);
  }
  arkuszSesji(id);
}

/* ---------- 2.21: rozbudowana sesja: cel z pierścieniem, dźwięki tła, szacunek stron, podsumowanie ---------- */
const CELE_SESJI = [0, 15, 25, 45, 60];
const DZWIEKI_TLA = [['', '🔇', 'Cisza'], ['deszcz', '🌧️', 'Deszcz'], ['kominek', '🔥', 'Kominek'], ['las', '🌲', 'Las'], ['kawiarnia', '☕', 'Kawiarnia'], ['szum', '〰️', 'Szum']];
function arkuszSesji(id) {
  const k = znajdz(id), s = sesjaAktywna();
  if (!k || !s) return;
  let blokada = null;
  const zwolnij = () => { if (blokada) { blokada.release().catch(() => {}); blokada = null; } };
  const godzina = new Date(s.start).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  const tempo = tempoKsiazki(k) || tempoOgolne() || 0; // stron na godzinę
  const zapisz = () => lsSet('zakladka-sesja', JSON.stringify(s));
  const R = 108, OBW = 2 * Math.PI * R;
  const a = arkusz({
    tytul: 'Sesja czytania', klasa: 'arkusz-sesja', onZamknij: () => { clearInterval(t); zwolnij(); },
    render: () => `<div class="sesja${s.pauzaOd ? ' sesja-pauza' : ''}">
      <div class="sesja-naglowek">${okladka(k, 's')}<div><p class="sesja-tytul">${esc(k.tytul)}</p><p class="sesja-start">${s.pauzaOd ? 'Pauza. ' : ''}Od ${godzina}, start na stronie ${s.strona}</p></div></div>
      <div class="sesja-tarcza">
        <svg viewBox="0 0 240 240" aria-hidden="true"><circle cx="120" cy="120" r="${R}" class="tarcza-tlo"/><circle cx="120" cy="120" r="${R}" class="tarcza-postep" data-postep stroke-dasharray="${OBW.toFixed(1)}" stroke-dashoffset="${OBW.toFixed(1)}"/></svg>
        <div class="tarcza-srodek"><p class="sesja-czas" data-czas role="timer" aria-live="off">${stoper(czasSesji(s))}</p><p class="tarcza-cel" data-cel-opis></p></div>
        <div class="sesja-sowa">${svgSowki('czyta', Z.ustawienia.gra.zalozone)}</div>
      </div>
      <p class="sesja-szacunek" data-szacunek></p>
      <div class="sesja-opcje"><span>Cel</span>${CELE_SESJI.map(c => `<button type="button" class="chip-m${(s.cel || 0) === c ? ' akt' : ''}" data-cel="${c}">${c ? `${c} min` : 'bez celu'}</button>`).join('')}</div>
      <div class="sesja-opcje"><span>Tło</span>${DZWIEKI_TLA.map(([kl, e, n]) => `<button type="button" class="chip-m${(s.tlo || '') === kl ? ' akt' : ''}" data-tlo="${kl}" title="${n}">${e} ${n}</button>`).join('')}</div>
      <button type="button" class="btn btn-na-plotnie sesja-pauza-btn" data-pauza>${s.pauzaOd ? `${I.graj}Wznów` : `${I.pauza}Pauza`}</button>
      ${'wakeLock' in navigator ? '<label class="przelacznik"><input type="checkbox" data-blokada> Nie wygaszaj ekranu</label>' : ''}
      <form class="formularz sesja-koniec" novalidate>
        <label class="pole-duze"><span>Skończyłem na stronie</span><input name="strona" type="number" inputmode="numeric" min="0" max="${k.strony}" value="${k.strona}"></label>
        <div class="przyciski"><button type="submit" class="btn btn-zloty">Zakończ sesję</button>
          <button type="button" class="btn btn-na-plotnie" data-zamknij>Zwiń</button>
          <button type="button" class="btn-tekst" data-odrzuc>Odrzuć sesję</button></div>
      </form></div>`
  });
  const tick = () => {
    const ms = czasSesji(s), min = ms / 60000;
    const c = $('[data-czas]', a.tresc); if (!c) return;
    const cel = s.cel || 0;
    c.textContent = cel && min > cel ? `+${stoper(ms - cel * 60000)}` : stoper(ms);
    c.classList.toggle('nadgodziny', !!(cel && min > cel));
    const proc = cel ? Math.min(1, min / cel) : (min % 60) / 60;
    $('[data-postep]', a.tresc).setAttribute('stroke-dashoffset', (OBW * (1 - proc)).toFixed(1));
    $('.sesja-tarcza', a.tresc).classList.toggle('cel-zrobiony', !!(cel && min >= cel));
    $('[data-cel-opis]', a.tresc).textContent = cel ? (min >= cel ? `cel ${cel} min zrobiony ✓` : `z ${cel} min · zostało ${Math.ceil(cel - min)} min`) : 'bez celu, czytaj ile chcesz';
    const szac = Math.round(tempo * min / 60), zost = k.strony - k.strona - szac;
    $('[data-szacunek]', a.tresc).textContent = tempo ? `≈ ${szac} ${odmiana(szac, FORMY_STRON)} przy twoim tempie (${Math.round(tempo)} str./h)${zost > 0 ? ` · do końca książki ok. ${czasLadnie(zost / tempo * 60)}` : ''}` : 'Po kilku sesjach pokażę, ile stron mniej więcej już przeczytałeś.';
    // kamienie milowe: połowa i cel (raz na sesję)
    if (cel && !s.pauzaOd) {
      if (!s.polowa && min >= cel / 2 && cel >= 15) { s.polowa = true; zapisz(); Glos.mow(SESJA_TEKSTY.polowa, 's', { wl: Z.ustawienia.gra.glosSowki }); }
      if (!s.celOk && min >= cel) {
        s.celOk = true; zapisz();
        Fx.graj('dzwonek'); if (navigator.vibrate) navigator.vibrate([30, 60, 30, 60, 60]);
        konfetti({ ile: 50 });
        Glos.mow(cel === 25 ? SESJA_TEKSTY.przerwa : SESJA_TEKSTY.cel, 's', { wl: Z.ustawienia.gra.glosSowki });
        if (cel === 25) toast('🍅 25 minut! To dobry moment na 5 minut przerwy (albo czytaj dalej).', { czas: 8000, akcja: 'Pauza', onAkcja: () => $('[data-pauza]', a.tresc)?.click() });
      }
    }
  };
  const t = setInterval(tick, 1000);
  tick();
  if (s.tlo && !s.pauzaOd) Fx.tlo(s.tlo);
  a.tresc.addEventListener('click', e => {
    const c = e.target.closest('[data-cel]');
    if (c || e.target.closest('[data-tlo]')) setTimeout(() => lsSet('zakladka-sesja-ustawienia', JSON.stringify({ cel: s.cel || 0, tlo: s.tlo || '' })), 0);
    if (c) { s.cel = +c.dataset.cel; s.polowa = s.celOk = czasSesji(s) / 60000 >= s.cel && s.cel > 0; zapisz(); $$('[data-cel]', a.tresc).forEach(b => b.classList.toggle('akt', b === c)); tick(); return; }
    const tl = e.target.closest('[data-tlo]');
    if (tl) { s.tlo = tl.dataset.tlo; zapisz(); $$('[data-tlo]', a.tresc).forEach(b => b.classList.toggle('akt', b === tl)); Glos.odblokuj(); if (s.pauzaOd) Fx.tloStop(); else Fx.tlo(s.tlo); return; }
    if (!e.target.closest('[data-pauza]')) return;
    if (s.pauzaOd) { s.pauzaMs = (s.pauzaMs || 0) + Date.now() - s.pauzaOd; s.pauzaOd = null; if (s.tlo) Fx.tlo(s.tlo); }
    else { s.pauzaOd = Date.now(); Fx.tloStop(); }
    zapisz();
    $('.sesja', a.tresc).classList.toggle('sesja-pauza', !!s.pauzaOd);
    $('[data-pauza]', a.tresc).innerHTML = s.pauzaOd ? `${I.graj}Wznów` : `${I.pauza}Pauza`;
    $('.sesja-start', a.tresc).textContent = `${s.pauzaOd ? 'Pauza. ' : ''}Od ${godzina}, start na stronie ${s.strona}`;
  });
  $('[data-blokada]', a.tresc)?.addEventListener('change', async e => {
    if (e.target.checked) {
      try {
        blokada = await navigator.wakeLock.request('screen');
        blokada.addEventListener('release', () => { if (!a.zamkniety) e.target.checked = false; });
      } catch { e.target.checked = false; toast('Telefon nie pozwolił zablokować wygaszania.'); }
    } else zwolnij();
  });
  $('[data-odrzuc]', a.tresc).addEventListener('click', async () => {
    if (!(await potwierdz('Sesja nie zostanie zapisana.', { tytul: 'Odrzucić sesję?', tak: 'Odrzuć', niebezpieczne: true }))) return;
    lsSet('zakladka-sesja', null);
    Fx.tloStop();
    a.zamknij();
    toast('Odrzucono sesję.');
  });
  $('form', a.tresc).addEventListener('submit', e => {
    e.preventDefault();
    const wartosc = e.target.elements.namedItem('strona').value;
    lsSet('zakladka-sesja', null);
    Fx.tloStop();
    a.zamknij();
    zakonczSesje(k, s, wartosc === '' ? k.strona : wartosc);
  });
  renderPigulka();
}
const czasLadnie = min => { min = Math.max(1, Math.round(min)); return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60 ? `${min % 60} min` : ''}`.trim() : `${min} min`; };
const SESJA_TEKSTY = { start: 'Zaczynamy! Ja też czytam, cichutko.', polowa: 'Połowa sesji za nami. Czytamy dalej!', cel: 'Cel sesji osiągnięty! Hu-hu!', przerwa: 'Czas na krótką przerwę. Rozprostuj skrzydła!', koniec: 'Świetna sesja! Jestem z ciebie dumna.', rekord: 'Nowy rekord sesji! Hu-hu!' };

function zakonczSesje(k, s, wartosc) {
  const minuty = Math.max(1, Math.round(czasSesji(s) / 60000));
  const rekordPrzed = Z.ksiazki.reduce((m, x) => Math.max(m, ...x.sesje.map(y => y.minuty)), 0);
  const tempoPrzed = tempoOgolne();
  const { skonczona } = ustawStrone(k, wartosc, dzisISO());
  const strony = Math.max(0, k.strona - s.strona);
  k.sesje.push({ data: dzisISO(), minuty, strony, godz: new Date(s.start).getHours() });
  utrwal(k);
  odswiez();
  if (skonczona) { celebracja(k.id); return; }
  const tempoTeraz = strony && minuty >= 5 ? Math.round(strony / minuty * 60) : 0;
  const rekord = minuty >= 10 && minuty > rekordPrzed;
  const a = arkusz({
    tytul: 'Koniec sesji', klasa: 'arkusz-maly arkusz-po-sesji',
    render: () => `<div class="po-sesji"><div class="po-sesji-sowa">${svgSowki('zadowolona', Z.ustawienia.gra.zalozone)}</div>
      ${rekord ? '<p class="po-sesji-rekord">🏆 Nowy rekord sesji!</p>' : ''}
      <dl class="liczby"><div><dt>Czas</dt><dd>${czasLadnie(minuty)}</dd></div><div><dt>Strony</dt><dd>${strony}</dd></div>
        <div><dt>Tempo</dt><dd>${tempoTeraz ? `${tempoTeraz}<small> str./h</small>` : '<small>—</small>'}</dd></div>
        <div><dt>Na tle średniej</dt><dd>${tempoTeraz && tempoPrzed ? `${tempoTeraz >= tempoPrzed ? '▲' : '▼'} ${Math.abs(Math.round((tempoTeraz / tempoPrzed - 1) * 100))}<small>%</small>` : '<small>—</small>'}</dd></div></dl>
      <p class="cichy">${esc(k.tytul)}: strona ${k.strona} z ${k.strony}${tempoOgolne() ? `, do końca ok. ${czasLadnie((k.strony - k.strona) / (tempoKsiazki(k) || tempoOgolne()) * 60)} czytania` : ''}.</p>
      <div class="przyciski przyciski-srodek"><button type="button" class="btn btn-glowny" data-zamknij>Super</button></div></div>`
  });
  if (rekord) konfetti({ ile: 80 });
  Fx.graj('dzwonek');
  setTimeout(() => Glos.mow(rekord ? SESJA_TEKSTY.rekord : SESJA_TEKSTY.koniec, 's', { wl: Z.ustawienia.gra.glosSowki }), 400);
  return a;
}

function renderPigulka() {
  const el = $('#pigulka');
  const s = sesjaAktywna();
  const k = s && znajdz(s.id);
  const widoczna = !!k && !otwarte.some(a => a.el.classList.contains('arkusz-sesja'));
  el.hidden = !widoczna;
  document.body.classList.toggle('z-pigulka', widoczna);
  if (!widoczna) return;
  el.dataset.id = k.id;
  el.classList.toggle('pigulka-pauza', !!s.pauzaOd);
  el.innerHTML = `<span class="pigulka-kropka" aria-hidden="true"></span><span data-czas>${stoper(czasSesji(s))}</span>${s.pauzaOd ? '<span class="pigulka-stan">pauza</span>' : ''}<span class="pigulka-tytul">${esc(k.tytul)}</span>`;
  el.setAttribute('aria-label', `Trwa sesja czytania: ${k.tytul}. Pokaż`);
}

/* ================= arkusz: bazowa ================= */
function arkuszBazowej(id) {
  const k = znajdz(id);
  if (!k) return;
  const dzis = dzisISO();
  const domyslna = k.bazowa && k.celData >= dzis ? k.celData : dodajDni(dzis, 60);
  const a = arkusz({
    tytul: k.bazowa ? 'Termin książki bazowej' : 'Ustaw jako bazową', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <div class="postep-ksiazka">${okladka(k, 's')}<span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">Zostało ${ile(k.strony - k.strona, FORMY_STRON)}</span></span></div>
      <fieldset class="segment"><legend>Na ile czasu</legend>${[1, 2, 3, 4, 6].map(m => radio('okres', m, `${m} mies.`, !k.bazowa && m === 2)).join('')}${radio('okres', 'data', 'Data', k.bazowa)}</fieldset>
      <label class="f-data"${k.bazowa ? '' : ' hidden'}>Skończyć do<input type="date" name="data" min="${dzis}" value="${domyslna}"></label>
      <p class="podsumowanie" aria-live="polite"></p>
      ${k.bazowa ? '' : (bazowe().length ? `<p class="podpowiedz">${bazowe().length >= MAKS_BAZOWYCH ? `Masz już ${MAKS_BAZOWYCH} bazowe, więc „${esc(bazowe().slice().sort((a, b) => (a.planOd ? a.planOd.data : '').localeCompare(b.planOd ? b.planOd.data : ''))[0].tytul)}” stanie się zwykłą czytaną.` : `Będzie to twoja ${bazowe().length + 1}. książka bazowa. Normy wszystkich sumują się w planie dnia.`}</p>` : '')}
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">${k.bazowa ? 'Zapisz termin' : 'Ustaw jako bazową'}</button></div>
    </form>`
  });
  const f = $('form', a.tresc);
  const celData = () => {
    const o = f.elements.okres.value;
    if (o === 'data') return poprawnaData(f.elements.namedItem('data').value) ? f.elements.namedItem('data').value : null;
    return dodajDni(dzis, Math.round(+o * 30.44) - 1);
  };
  const podsum = () => {
    const d = celData();
    if (!d || d < dzis) { $('.podsumowanie', f).textContent = 'Wybierz datę od dziś wzwyż.'; return; }
    const dni = dniMiedzy(dzis, d) + 1;
    const norma = Math.ceil((k.strony - k.strona) / dni);
    $('.podsumowanie', f).textContent = `Do ${dataDluga(d)}: ok. ${ile(norma, FORMY_STRON)} dziennie przez ${ile(dni, FORMY_DNI)}.`;
  };
  f.addEventListener('change', e => {
    if (e.target.name === 'okres') $('.f-data', f).hidden = e.target.value !== 'data';
    podsum();
  });
  f.addEventListener('input', podsum);
  podsum();
  f.addEventListener('submit', e => {
    e.preventDefault();
    const d = celData();
    if (!d || d < dzis) return;
    if (k.bazowa) { k.celData = d; k.planOd = { data: dzis, strona: k.strona }; utrwal(k); }
    else utrwal(ustawBazowa(k, d));
    a.zamknij();
    odswiez();
    toast(`„${k.tytul}” to teraz książka bazowa, termin ${dataDluga(d, false)}.`);
  });
}

function arkuszWyboruBazowej() {
  const lista = Z.ksiazki.filter(k => (k.status === 'czytam' && !k.bazowa) || k.status === 'doPrzeczytania').sort((a, b) => b.strony - a.strony);
  const a = arkusz({
    tytul: 'Wybierz książkę bazową', klasa: 'arkusz-maly',
    render: () => lista.length ? `<p class="cichy">Bazowa to gruba książka czytana po trochu każdego dnia przez dłuższy czas, np. 500+ stron na 1–3 miesiące. Możesz mieć do ${MAKS_BAZOWYCH} naraz.</p>
      <ul class="lista">${lista.map(k => `<li class="wiersz"><button type="button" class="wiersz-glowny" data-wybierz="${k.id}">${okladka(k, 's')}
        <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">${esc(k.autor)}${k.autor ? ', ' : ''}${ile(k.strony, FORMY_STRON)}${k.status === 'czytam' ? ', czytasz' : ''}${k.strony >= 500 ? ' · <span class="ok">gruba, idealna na bazową</span>' : ''}</span></span></button></li>`).join('')}</ul>`
      : `<p>Nie masz jeszcze książek do wyboru.</p><div class="przyciski"><button type="button" class="btn btn-glowny" data-akcja="dodaj" data-jako="bazowa">Dodaj książkę</button></div>`
  });
  a.tresc.addEventListener('click', e => {
    const b = e.target.closest('[data-wybierz]');
    if (b) { a.zamknij(); arkuszBazowej(b.dataset.wybierz); }
    if (e.target.closest('[data-akcja="dodaj"]')) a.zamknij();
  });
}

/* ================= arkusz: cytat ================= */
function arkuszCytatu(id, cid = null) {
  const k = znajdz(id);
  if (!k) return;
  const c = cid ? k.cytaty.find(x => x.id === cid) : null;
  const a = arkusz({
    tytul: c ? 'Edytuj cytat' : 'Dodaj cytat', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <p class="cichy">${esc(k.tytul)}</p>
      <fieldset class="segment"><legend class="sr">Rodzaj</legend>${radio('rodzaj', 'cytat', 'Cytat', !c || !c.notatka)}${radio('rodzaj', 'notatka', 'Moja notatka', !!(c && c.notatka))}</fieldset>
      <label>Treść<textarea name="tekst" rows="5" required autofocus placeholder="Przepisz zdanie albo zapisz swoją myśl">${esc(c ? c.tekst : '')}</textarea></label>
      <div class="ocr"><label class="btn btn-maly">📷 Tekst ze zdjęcia strony<input type="file" accept="image/*" capture="environment" data-ocr hidden></label><span class="cichy" data-ocr-stan></span></div>
      <label class="pole-waskie">Strona<input name="strona" type="number" inputmode="numeric" min="1" max="${k.strony}" value="${c ? (c.strona || '') : (k.strona || '')}"></label>
      <div class="przyciski przyciski-koniec">${c ? '<button type="button" class="btn btn-ryzyko" data-usun-cytat>Usuń</button>' : ''}
        <button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Zapisz</button></div>
    </form>`
  });
  const f = $('form', a.tresc);
  $('[data-ocr]', f).addEventListener('change', async e => {
    const plik = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!plik) return;
    const st = $('[data-ocr-stan]', f);
    st.classList.add('ladowanie');
    st.textContent = 'Pobieram czytnik tekstu (tylko za pierwszym razem)…';
    try {
      const w = await tekstZeZdjecia(plik, (proc, status) => { st.textContent = proc != null ? `Czytam stronę… ${proc}%` : status && /load|init/.test(status) ? 'Przygotowuję polski słownik…' : st.textContent; });
      const pole = f.elements.namedItem('tekst');
      pole.value = w.tekst;
      if (w.strona && !+f.elements.namedItem('strona').value) f.elements.namedItem('strona').value = w.strona;
      st.textContent = `Gotowe (pewność ${w.pewnosc}%). Usuń to, czego nie chcesz w cytacie.`;
      pole.focus();
      if (navigator.vibrate) navigator.vibrate(20);
    } catch (err) { st.textContent = err.message || 'Nie udało się odczytać tekstu.'; }
    st.classList.remove('ladowanie');
  });
  f.addEventListener('submit', e => {
    e.preventDefault();
    const tekst = f.elements.namedItem('tekst').value.trim();
    if (!tekst) { f.elements.namedItem('tekst').focus(); return; }
    const dane = { tekst, strona: +f.elements.namedItem('strona').value > 0 ? Math.round(+f.elements.namedItem('strona').value) : null, notatka: f.elements.rodzaj.value === 'notatka' };
    if (c) Object.assign(c, dane);
    else k.cytaty.push({ id: noweId(), data: dzisISO(), ...dane });
    utrwal(k);
    a.zamknij();
    odswiez();
    toast(dane.notatka ? 'Zapisano notatkę.' : 'Zapisano cytat.');
  });
  $('[data-usun-cytat]', f)?.addEventListener('click', () => {
    const idx = k.cytaty.indexOf(c);
    k.cytaty.splice(idx, 1);
    utrwal(k);
    a.zamknij();
    odswiez();
    toast('Usunięto cytat.', { akcja: 'Cofnij', onAkcja: () => { k.cytaty.splice(idx, 0, c); utrwal(k); odswiez(); } });
  });
}

/* ================= skaner ================= */
function arkuszSkanera(poOdczycie, { seria = false } = {}) {
  let stop = null;
  const odczytane = new Set();
  const naZywo = Skaner.maAparat();
  const a = arkusz({
    tytul: 'Skanuj kod kreskowy', klasa: 'arkusz-maly', onZamknij: () => stop && stop(),
    render: () => `${naZywo ? `<div class="skaner"><video playsinline muted autoplay></video><span class="skaner-ramka" aria-hidden="true"></span><span class="skaner-linia" aria-hidden="true"></span>
        <button type="button" class="btn skaner-latarka" data-latarka hidden>Latarka</button></div>` : ''}
      <p class="cichy skaner-status" aria-live="polite">${naZywo
        ? 'Nakieruj aparat na kod kreskowy z tyłu książki, tak żeby wypełnił ramkę. Numer ISBN zaczyna się od 978 albo 979.'
        : 'Zrób zdjęcie kodu kreskowego z tyłu książki. Numer ISBN zaczyna się od 978 albo 979.'}</p>
      ${seria ? '<p class="skaner-licznik" aria-live="polite"></p>' : ''}
      <div class="przyciski przyciski-koniec">
        <button type="button" class="btn${seria ? ' btn-glowny' : ''}" data-zamknij>${seria ? 'Gotowe' : 'Anuluj'}</button>
        <label class="btn${naZywo ? '' : ' btn-glowny'}">Zrób zdjęcie kodu<input type="file" accept="image/*" capture="environment" data-zdjecie-kodu hidden></label>
      </div>`
  });
  const status = (tekst, blad = false) => {
    const p = $('.skaner-status', a.tresc);
    if (!p) return;
    p.textContent = tekst;
    p.classList.toggle('blad', blad);
  };
  const gotowe = kod => {
    if (a.zamkniety) return;
    if (seria) {
      // tryb seryjny: zapisz kod i skanuj dalej, bez zamykania okna
      if (!odczytane.has(kod)) {
        odczytane.add(kod);
        if (navigator.vibrate) navigator.vibrate(40);
        poOdczycie(kod);
        const l = $('.skaner-licznik', a.tresc);
        if (l) l.textContent = `Zeskanowane: ${odczytane.size}. Ostatni: ${kod}. Skieruj aparat na następną książkę.`;
      }
      if (naZywo) setTimeout(uruchom, 1100);
      return;
    }
    if (navigator.vibrate) navigator.vibrate(40);
    a.zamknij();
    poOdczycie(kod);
  };

  $('[data-zdjecie-kodu]', a.tresc).addEventListener('change', async e => {
    const plik = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!plik) return;
    status('Szukam kodu na zdjęciu…');
    try {
      const kod = await Skaner.zPliku(plik);
      if (kod) gotowe(kod);
      else status('Nie widzę kodu na tym zdjęciu. Zrób je z bliska, ostro i z kodem ustawionym poziomo.', true);
    } catch {
      status('Nie udało się wczytać zdjęcia.', true);
    }
  });

  if (!naZywo) return;
  function uruchom() {
  if (a.zamkniety || !$('video', a.tresc)) return;
  Skaner.start($('video', a.tresc), gotowe, { naStatus: t => status(t) })
    .then(s => {
      stop = s.stop;
      if (a.zamkniety) { s.stop(); return; }
      if (s.latarka) {
        const b = $('[data-latarka]', a.tresc);
        b.hidden = false;
        b.addEventListener('click', async () => {
          try { b.classList.toggle('btn-glowny', await s.latarka()); } catch { b.hidden = true; }
        });
      }
    })
    .catch(e => {
      const sk = $('.skaner', a.tresc);
      if (sk) sk.remove();
      status(e && e.name === 'NotAllowedError'
        ? 'Brak dostępu do aparatu. Zezwól na niego w ustawieniach przeglądarki albo zrób zdjęcie kodu.'
        : 'Nie udało się uruchomić aparatu. Zrób zdjęcie kodu.', true);
    });
  }
  uruchom();
}

/* ================= ukończenie ================= */
function arkuszZakonczenia(id) {
  const k = znajdz(id);
  if (!k) return;
  const reszta = k.strony - k.strona;
  const zakoncz = wlicz => { utrwal(oznaczPrzeczytana(k, dzisISO(), wlicz)); odswiez(); celebracja(k.id); };
  if (!reszta) { zakoncz(false); return; }
  const a = arkusz({
    tytul: 'Skończona?', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <p>Do końca „${esc(k.tytul)}” zostało ${ile(reszta, FORMY_STRON)}. Kiedy je przeczytałeś?</p>
      <fieldset class="segment"><legend class="sr">Kiedy</legend>${radio('kiedy', 'dzis', 'Dziś', reszta <= 150)}${radio('kiedy', 'wczesniej', 'Wcześniej, bez zapisu', reszta > 150)}</fieldset>
      <p class="podpowiedz">Strony z „Wcześniej” nie wejdą do dzisiejszego licznika ani serii.</p>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Przeczytana</button></div>
    </form>`
  });
  $('form', a.tresc).addEventListener('submit', e => {
    e.preventDefault();
    const wlicz = e.target.elements.kiedy.value === 'dzis';
    a.zamknij();
    zakoncz(wlicz);
  });
}

function celebracja(id) {
  const k = znajdz(id);
  if (!k) return;
  const s = sesjaAktywna();
  if (s && s.id === id) { lsSet('zakladka-sesja', null); renderPigulka(); }
  const u = Z.ustawienia;
  const wCelu = k.koniec >= u.start && k.koniec <= u.koniec;
  const n = ukonczenia(u.start, u.koniec).length;
  if (navigator.vibrate) navigator.vibrate([20, 60, 30]);
  setTimeout(() => konfetti(), 250);
  arkusz({
    tytul: 'Przeczytane', ukryjTytul: true, klasa: 'arkusz-maly arkusz-brawo', odswiezalny: true, ksiazkaId: id,
    render: () => {
      const kk = znajdz(id);
      return `<div class="brawo">
        <div class="brawo-okl">${okladka(kk, 'l')}<span class="brawo-wstazka" aria-hidden="true"></span></div>
        <h2>Przeczytane</h2>
        <p>„${esc(kk.tytul)}”${wCelu ? ` to twoja ${n}. książka w tym celu. Zostało ${Math.max(0, u.cel - n)}.` : ' trafia na półkę przeczytanych.'}</p>
        <p class="cichy">Jak ją oceniasz?</p>
        ${gwiazdki(kk)}
        ${htmlWrazen(kk)}
        ${kk.ocena >= 4 ? htmlPodobnych(kk, { naglowek: 'Skoro ci się podobała, może też…', kompakt: true }) : kk.ocena ? '' : '<p class="cichy brawo-podp">Oceń ją na 4 albo 5, a podsunę podobne książki.</p>'}
        ${(() => { const nt = nastepnyTom(kk); return nt && nt.status === 'doPrzeczytania' ? `<p class="brawo-nastepny">Następny w cyklu: <strong>${esc(nt.tytul)}</strong></p><div class="przyciski"><button type="button" class="btn btn-zloty" data-akcja="zacznij" data-id="${nt.id}">Zacznij następny tom</button></div>` : ''; })()}
        <div class="przyciski"><button type="button" class="btn" data-akcja="cytat-dodaj" data-id="${kk.id}">Dodaj cytat</button>
          <button type="button" class="btn btn-glowny" data-zamknij>Gotowe</button></div>
      </div>`;
    }
  });
}

/* ================= arkusz: jeden dzień ================= */
function arkuszDnia(iso) {
  arkusz({
    tytul: dataDluga(iso), klasa: 'arkusz-maly', odswiezalny: true,
    render: () => {
      const d = dzienCzytania(iso);
      const cel = dziennyCel();
      return `<p class="dzien-suma"><strong>${d.razem}</strong> ${odmiana(d.razem, FORMY_STRON)}${d.minuty ? `, ${czasCzytania(d.minuty / 60)} w sesjach` : ''}
        ${d.razem >= cel ? `<span class="znacznik znacznik-ok">${I.check}cel zrobiony</span>` : ''}</p>
        ${d.ksiazki.length ? `<ul class="lista">${d.ksiazki.map(({ k, strony }) => `<li class="wiersz">
          <button type="button" class="wiersz-glowny" data-akcja="ksiazka" data-id="${k.id}">${okladka(k, 's')}
            <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">+${ile(strony, FORMY_STRON)}</span></span></button>
          <button type="button" class="btn-ikona" data-akcja="wpis" data-id="${k.id}" data-data="${iso}" aria-label="Popraw wpis: ${esc(k.tytul)}">${I.edytuj}</button>
        </li>`).join('')}</ul>`
        : `<p class="cichy">${iso === dzisISO() ? 'Dziś jeszcze nic nie zapisałeś.' : 'Tego dnia nie ma zapisanych stron.'}</p>`}
        ${(bazowa() || czytane()[0]) && iso < dzisISO() ? `<p class="cichy dzien-dopisz">Zapomniałeś zapisać? Otwórz „Zapisz postęp” i wybierz „Inny dzień”.</p>` : ''}`;
    }
  });
}

/* ================= arkusz: poprawka wpisu ================= */
function arkuszWpisu(id, data) {
  const k = znajdz(id);
  const w = k && k.log.find(x => x.data === data);
  if (!w) return;
  const czyta = k.status === 'czytam';
  const a = arkusz({
    tytul: 'Popraw wpis', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <div class="postep-ksiazka">${okladka(k, 's')}<span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">${dataDluga(data)}: +${ile(w.strony, FORMY_STRON)}</span></span></div>
      <div class="f-rzad"><label>Stron tego dnia<input name="strony" type="number" inputmode="numeric" min="0" value="${w.strony}"></label>
        <label>Dzień<input name="data" type="date" max="${dzisISO()}" value="${data}"></label></div>
      <p class="podpowiedz">${czyta ? 'Zmiana liczby stron przesunie też twoją bieżącą stronę w książce.' : 'Książka jest skończona, więc zmienią się tylko statystyki.'}</p>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn btn-ryzyko" data-usun-wpis>Usuń wpis</button>
        <button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Zapisz</button></div>
    </form>`
  });
  const f = $('form', a.tresc);
  const kopia = () => ({ log: k.log.map(x => ({ ...x })), strona: k.strona });
  const zastosuj = (strony, nowaData, komunikat) => {
    const przed = kopia();
    utrwal(zmienWpis(k, data, nowaData, strony));
    a.zamknij();
    odswiez();
    toast(komunikat, { akcja: 'Cofnij', onAkcja: () => { Object.assign(k, przed); utrwal(k); odswiez(); } });
  };
  f.addEventListener('submit', e => {
    e.preventDefault();
    const strony = Math.max(0, Math.round(+f.elements.namedItem('strony').value) || 0);
    const nowaData = f.elements.namedItem('data').value;
    zastosuj(strony, nowaData, strony ? 'Poprawiono wpis.' : 'Usunięto wpis.');
  });
  $('[data-usun-wpis]', f).addEventListener('click', () => zastosuj(0, data, 'Usunięto wpis.'));
}

/* ================= arkusz: podsumowanie roku ================= */
const MIES_MN = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];

function tekstRoku(r) {
  return [`Mój rok ${r.rok} w książkach`,
    `${ile(r.ksiazki.length, FORMY_KSIAZEK)}, ${ile(r.strony, FORMY_STRON)}, ${ile(r.dni, FORMY_DNI)} z czytaniem.`,
    r.najdluzsza ? `Najdłuższa: ${r.najdluzsza.k.tytul} (${ile(r.najdluzsza.k.strony, FORMY_STRON)}).` : '',
    r.ulubione.length ? `Ulubione: ${r.ulubione.slice(0, 5).map(k => k.tytul).join(', ')}.` : '',
    r.sredniaOcena ? `Średnia ocena: ${ulamek(r.sredniaOcena)}/5.` : '',
    '— Zakładka, dziennik czytania'].filter(Boolean).join('\n');
}

/* ================= bingo czytelnicze i podsumowanie tygodnia (2.21) ================= */
const MIESIACE_M = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
function htmlBingo() {
  const b = bingoMiesiaca(), ile = b.zrobione.filter(Boolean).length;
  return `<section class="sekcja bingo"><div class="sekcja-gora"><h2>🎯 Bingo: ${MIESIACE_M[+b.mies.slice(5) - 1]}</h2><span class="cichy">${ile}/9 · ${b.linie ? `${b.linie} ${odmiana(b.linie, ['linia', 'linie', 'linii'])}` : 'zbierz linię'}</span></div>
    <p class="cichy">Pola zaznaczają się same. Każda linia daje 40 🍃, pełna karta jeszcze 150 🍃. Co miesiąc nowa karta.</p>
    <ol class="bingo-karta">${b.pola.map((p, i) => `<li class="${b.zrobione[i] ? 'ok' : ''}" style="--i:${i}"><span class="bingo-e">${p.emoji}</span><span class="bingo-n">${esc(p.nazwa)}</span>${b.zrobione[i] ? '<span class="bingo-znak" aria-label="zrobione">✓</span>' : ''}</li>`).join('')}</ol></section>`;
}
/** Po każdej zmianie danych: czy wpadła nowa linia bingo? Wtedy listki, konfetti i Sówka. */
function sprawdzBingo() {
  const g = Z.ustawienia.gra, b = bingoMiesiaca(), bylo = g.bingo[b.mies] || 0;
  if (b.nagroda <= bylo) return;
  g.bingo[b.mies] = b.nagroda; utrwalUstawienia();
  if (U.bingoStart == null) { U.bingoStart = true; return; } // przy starcie aplikacji bez fanfar
  konfetti({ ile: b.pelna ? 160 : 70 });
  toast(b.pelna ? `🎯 Pełna karta bingo! +${b.nagroda - bylo} 🍃` : `🎯 Bingo! Linia zrobiona, +${b.nagroda - bylo} 🍃`, { czas: 6000, akcja: 'Pokaż', onAkcja: () => idz('statystyki') });
  setTimeout(() => sowkaMowi(b.pelna ? SOWA_TEKSTY.bingo[1] : SOWA_TEKSTY.bingo[0], { czas: 5000 }), 900);
}
/** Podsumowanie tygodnia (pon–nd). przesun = 0: bieżący, 1: poprzedni. */
function daneTygodnia(przesun = 0) {
  const dzis = dzisISO(), dt = (new Date(dzis + 'T12:00').getDay() + 6) % 7;
  const pon = dodajDni(dzis, -dt - 7 * przesun), nd = dodajDni(pon, 6), m = mapaDni();
  const dni = Array.from({ length: 7 }, (_, i) => dodajDni(pon, i));
  const strony = dni.reduce((s, d) => s + (m.get(d) || 0), 0);
  const czytal = dni.filter(d => (m.get(d) || 0) > 0).length;
  const naj = dni.reduce((a, d) => ((m.get(d) || 0) > (m.get(a) || 0) ? d : a), dni[0]);
  const minuty = Z.ksiazki.reduce((s, k) => s + k.sesje.filter(x => x.data >= pon && x.data <= nd).reduce((a, x) => a + x.minuty, 0), 0);
  const skonczone = Z.ksiazki.filter(k => k.status === 'przeczytana' && k.koniec >= pon && k.koniec <= nd);
  const ks = Z.ksiazki.map(k => ({ k, s: (k.log || []).filter(w => w.data >= pon && w.data <= nd).reduce((a, w) => a + w.strony, 0) })).sort((a, b) => b.s - a.s)[0];
  const cytaty = Z.ksiazki.reduce((s, k) => s + k.cytaty.filter(q => q.data >= pon && q.data <= nd).length, 0);
  return { pon, nd, dni, m, strony, czytal, naj, najStron: m.get(naj) || 0, minuty, skonczone, ulubiona: ks && ks.s ? ks : null, cytaty };
}
function arkuszTygodnia(przesun = 0) {
  const w = daneTygodnia(przesun), p = daneTygodnia(przesun + 1);
  const roznica = w.strony - p.strony, max = Math.max(1, ...w.dni.map(d => w.m.get(d) || 0));
  const DN = ['pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'nd'];
  const a = arkusz({
    tytul: przesun ? 'Poprzedni tydzień' : 'Ten tydzień', klasa: 'arkusz-tydzien',
    render: () => `<div class="tydz-gora"><div class="tydz-sowa">${svgSowki(w.strony ? 'zadowolona' : 'czeka', Z.ustawienia.gra.zalozone)}</div>
        <div><p class="cichy">${dataKrotka(w.pon)} – ${dataKrotka(w.nd)}</p><p class="tydz-liczba"><strong>${liczba(w.strony)}</strong> ${odmiana(w.strony, FORMY_STRON)}</p>
        <p class="${roznica >= 0 ? 'plus' : 'minus'}">${p.strony ? `${roznica >= 0 ? '▲' : '▼'} ${liczba(Math.abs(roznica))} ${roznica >= 0 ? 'więcej' : 'mniej'} niż tydzień wcześniej` : 'Pierwszy tydzień z zapisami. Hu-hu!'}</p></div></div>
      <div class="tydz-wykres" role="img" aria-label="Strony w kolejnych dniach">${w.dni.map((d, i) => `<div class="tydz-slup${d === w.naj && w.najStron ? ' naj' : ''}"><span style="height:${((w.m.get(d) || 0) / max * 100).toFixed(0)}%"></span><small>${DN[i]}</small></div>`).join('')}</div>
      <dl class="liczby">
        <div><dt>Dni z czytaniem</dt><dd>${w.czytal}<small> / 7</small></dd></div>
        <div><dt>Najlepszy dzień</dt><dd>${w.najStron ? `${DN[w.dni.indexOf(w.naj)]}<small> · ${w.najStron} str.</small>` : '<small>—</small>'}</dd></div>
        <div><dt>Czas w sesjach</dt><dd>${w.minuty ? `${Math.floor(w.minuty / 60)}<small> h </small>${w.minuty % 60}<small> min</small>` : '<small>brak sesji</small>'}</dd></div>
        <div><dt>Skończone książki</dt><dd>${w.skonczone.length}</dd></div></dl>
      ${w.ulubiona ? `<p class="tydz-ulub">📖 Najwięcej czytałeś: <strong>${esc(w.ulubiona.k.tytul)}</strong> (${w.ulubiona.s} str.)</p>` : ''}
      ${w.skonczone.length ? `<p class="tydz-ulub">🏁 Skończone: ${w.skonczone.map(k => `<strong>${esc(k.tytul)}</strong>`).join(', ')}</p>` : ''}
      ${w.cytaty ? `<p class="tydz-ulub">✍️ Zapisane cytaty: ${w.cytaty}</p>` : ''}
      <div class="przyciski przyciski-srodek"><button type="button" class="btn" data-tydz="${przesun + 1}">‹ Wcześniejszy</button>${przesun ? `<button type="button" class="btn" data-tydz="${przesun - 1}">Późniejszy ›</button>` : ''}</div>`
  });
  a.tresc.addEventListener('click', e => { const b = e.target.closest('[data-tydz]'); if (b) { a.zamknij(); setTimeout(() => arkuszTygodnia(+b.dataset.tydz), 320); } });
  // Sówka komentuje (nagrane kwestie)
  setTimeout(() => {
    const kw = SOWA_TEKSTY.tydzien;
    Glos.mow(!w.strony ? kw[3] : !p.strony || roznica >= 0 ? kw[1] : kw[2], 's', { wl: Z.ustawienia.gra.glosSowki });
  }, 600);
}
/** W poniedziałek (raz) Sówka sama pokazuje podsumowanie poprzedniego tygodnia. */
function podsumowanieWPoniedzialek() {
  const dzis = dzisISO();
  if (new Date(dzis + 'T12:00').getDay() !== 1 || lsGet('zakladka-tydzien-pokazany') === dzis || !Z.ksiazki.length) return;
  if (!daneTygodnia(1).strony) return;
  lsSet('zakladka-tydzien-pokazany', dzis);
  setTimeout(() => { if (!otwarte.length) { Glos.mow(SOWA_TEKSTY.tydzien[0], 's', { wl: Z.ustawienia.gra.glosSowki }); setTimeout(() => arkuszTygodnia(1), 1800); } }, 5000);
}

function arkuszRoku() {
  const lata = lataZDanymi();
  const teraz = new Date().getFullYear();
  if (!lata.includes(teraz)) lata.unshift(teraz);
  let rok = lata[0] === teraz || !lata.length ? teraz : lata[0];
  const a = arkusz({
    tytul: 'Twój rok w książkach', klasa: 'arkusz-rok', odswiezalny: true,
    render: () => {
      const r = podsumowanieRoku(rok);
      const maxM = Math.max(...r.stronyMies, 1);
      return `${lata.length > 1 ? `<fieldset class="segment"><legend class="sr">Rok</legend>${lata.map(l => radio('rok', l, l, l === rok)).join('')}</fieldset>` : ''}
      <div class="rok-naglowek"><p class="rok-liczba">${r.rok}</p><p>${r.ksiazki.length ? `${ile(r.ksiazki.length, FORMY_KSIAZEK)} i ${ile(r.strony, FORMY_STRON)}` : r.strony ? `${ile(r.strony, FORMY_STRON)}, jeszcze bez skończonej książki` : 'Ten rok dopiero czeka na pierwsze strony.'}</p></div>
      <dl class="liczby">
        <div><dt>Dni z czytaniem</dt><dd>${r.dni}</dd></div>
        <div><dt>Najdłuższa seria</dt><dd>${r.seria}<small> ${odmiana(r.seria, FORMY_DNI)}</small></dd></div>
        <div><dt>Średnio na dzień czytania</dt><dd>${r.dni ? Math.round(r.strony / r.dni) : 0}<small> str.</small></dd></div>
        <div><dt>Czas w sesjach</dt><dd>${r.minuty ? czasCzytania(r.minuty / 60).replace(/ (h|min)/g, '<small> $1</small>') : '<small>brak</small>'}</dd></div>
      </dl>
      ${r.strony ? `<section class="kd-sekcja"><h3>Strony w miesiącach</h3>
        <div class="rok-miesiace">${r.stronyMies.map((v, i) => `<span class="rok-m${i === r.najMies ? ' naj' : ''}" title="${MIES_MN[i]}: ${ile(v, FORMY_STRON)}"><span class="rok-m-sl" style="height:${(v / maxM * 100).toFixed(1)}%"></span><span class="rok-m-et">${MIES_KR[i][0]}</span></span>`).join('')}</div>
        ${r.najMies >= 0 ? `<p class="cichy">Najlepszy miesiąc: ${MIES_MN[r.najMies]}, ${ile(r.stronyMies[r.najMies], FORMY_STRON)}.</p>` : ''}</section>` : ''}
      ${r.ksiazki.length ? `<section class="kd-sekcja"><h3>Przeczytane</h3>
        <ul class="rok-okladki">${r.ksiazki.map(({ k }) => `<li><button type="button" class="kafel" data-akcja="ksiazka" data-id="${k.id}" aria-label="${esc(k.tytul)}">${okladka(k, 'm')}</button></li>`).join('')}</ul></section>
      <section class="kd-sekcja"><h3>Wyróżnienia</h3><dl class="rekordy">
        ${r.najdluzsza ? `<div><dt>Najdłuższa</dt><dd>${esc(r.najdluzsza.k.tytul)}, ${ile(r.najdluzsza.k.strony, FORMY_STRON)}</dd></div>` : ''}
        ${r.najDzien ? `<div><dt>Najlepszy dzień</dt><dd>${dataDluga(r.najDzien[0], false)}, ${ile(r.najDzien[1], FORMY_STRON)}</dd></div>` : ''}
        ${r.topAutor ? `<div><dt>Ulubiony autor</dt><dd>${esc(r.topAutor[0])}, ${ile(r.topAutor[1], FORMY_KSIAZEK)}</dd></div>` : ''}
        ${r.sredniaOcena ? `<div><dt>Średnia ocena</dt><dd>${ulamek(r.sredniaOcena)} na 5</dd></div>` : ''}
        ${r.ulubione.length ? `<div><dt>Na 5 gwiazdek</dt><dd>${r.ulubione.map(k => esc(k.tytul)).join(', ')}</dd></div>` : ''}
      </dl></section>
      <div class="przyciski przyciski-srodek"><button type="button" class="btn" data-akcja="obraz-roku" data-rok="${r.rok}">${I.obraz}Obrazek z okładkami</button><button type="button" class="btn btn-glowny" data-udostepnij-rok>${I.udostepnij}Udostępnij tekst</button></div>` : ''}`;
    }
  });
  a.tresc.addEventListener('change', e => { if (e.target.name === 'rok') { rok = +e.target.value; a.rysuj(); } });
  a.tresc.addEventListener('click', async e => {
    if (!e.target.closest('[data-udostepnij-rok]')) return;
    const tekst = tekstRoku(podsumowanieRoku(rok));
    if (navigator.share) { try { await navigator.share({ text: tekst }); } catch { /* anulowano */ } return; }
    try { await navigator.clipboard.writeText(tekst); toast('Skopiowano podsumowanie.'); } catch { toast('Nie udało się skopiować.', { typ: 'blad' }); }
  });
}

/* ================= cytat jako obrazek ================= */
function zawijaj(ctx, tekst, szer) {
  const linie = [];
  for (const akapit of tekst.split('\n')) {
    let linia = '';
    for (const slowo of akapit.split(/\s+/).filter(Boolean)) {
      const proba = linia ? linia + ' ' + slowo : slowo;
      if (ctx.measureText(proba).width > szer && linia) { linie.push(linia); linia = slowo; } else linia = proba;
    }
    linie.push(linia);
  }
  return linie;
}

async function obrazCytatu({ k, c }) {
  const W = 1080, H = 1350, M = 110;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const serif = '"Literata", Georgia, serif', sans = '"Figtree", system-ui, sans-serif';
  try { await Promise.all([document.fonts.load(`italic 56px ${serif}`), document.fonts.load(`600 34px ${sans}`)]); } catch { /* bez czcionek */ }
  // płótno
  ctx.fillStyle = '#1f4a3d';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#000000';
  for (let x = 0; x < W; x += 3) ctx.fillRect(x, 0, 1, H);
  ctx.globalAlpha = 1;
  // złota ramka
  ctx.strokeStyle = 'rgba(217, 182, 110, .55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, W - 96, H - 96);
  // wstążka
  ctx.fillStyle = '#a3233a';
  ctx.beginPath();
  ctx.moveTo(W - 210, 0); ctx.lineTo(W - 150, 0); ctx.lineTo(W - 150, 250); ctx.lineTo(W - 180, 222); ctx.lineTo(W - 210, 250);
  ctx.closePath(); ctx.fill();
  // cudzysłów
  ctx.fillStyle = '#d9b66e';
  ctx.font = `600 220px ${serif}`;
  ctx.fillText('„', M - 10, 330);
  // tekst — dobierz rozmiar, żeby się zmieścił
  const notatka = c.notatka;
  let rozmiar = 64, linie;
  const maxH = H - 400 - 300;
  do {
    ctx.font = `${notatka ? '' : 'italic '}400 ${rozmiar}px ${serif}`;
    linie = zawijaj(ctx, c.tekst, W - 2 * M);
    if (linie.length * rozmiar * 1.42 <= maxH) break;
    rozmiar -= 4;
  } while (rozmiar > 26);
  const wysTekstu = linie.length * rozmiar * 1.42;
  let y = 400 + Math.max(0, (maxH - wysTekstu) / 2) + rozmiar;
  ctx.fillStyle = '#f1ede0';
  for (const l of linie) { ctx.fillText(l, M, y); y += rozmiar * 1.42; }
  // podpis
  ctx.fillStyle = '#d9b66e';
  ctx.fillRect(M, H - 290, 80, 4);
  ctx.font = `600 38px ${serif}`;
  ctx.fillStyle = '#f1ede0';
  const tytul = zawijaj(ctx, k.tytul, W - 2 * M).slice(0, 2);
  tytul.forEach((l, i) => ctx.fillText(l, M, H - 225 + i * 46));
  ctx.font = `500 30px ${sans}`;
  ctx.fillStyle = '#b7c6bb';
  ctx.fillText([k.autor, c.strona ? `s. ${c.strona}` : ''].filter(Boolean).join(' · '), M, H - 225 + tytul.length * 46 + 4);
  ctx.font = `600 24px ${sans}`;
  ctx.fillStyle = 'rgba(217, 182, 110, .8)';
  ctx.textAlign = 'right';
  ctx.fillText('ZAKŁADKA', W - M, H - 90);
  const blob = await new Promise(ok => cv.toBlob(ok, 'image/png'));
  if (!blob) throw new Error('Nie udało się utworzyć obrazka.');
  return blob;
}

/* ================= odznaki: powiadomienie o nowej ================= */
function sprawdzOdznaki() {
  if (!Z.ksiazki.length) return;
  const zdobyte = odznaki().filter(o => o.zdobyta);
  const znane = lsGet('zakladka-odznaki');
  lsSet('zakladka-odznaki', JSON.stringify(zdobyte.map(o => o.id)));
  if (znane == null) return; // pierwsze uruchomienie: bez zasypywania powiadomieniami
  let stare;
  try { stare = new Set(JSON.parse(znane)); } catch { return; }
  const nowe = zdobyte.filter(o => !stare.has(o.id));
  if (!nowe.length) return;
  setTimeout(() => toast(nowe.length === 1 ? `Nowa odznaka: ${nowe[0].nazwa}. ${nowe[0].opis}.` : `Nowe odznaki: ${nowe.map(o => o.nazwa).join(', ')}.`,
    { akcja: 'Zobacz', onAkcja: () => { for (const a of [...otwarte]) a.zamknij(); U.wszystkieOdznaki = true; idz('statystyki'); } }), 600);
}

/* ================= cele tygodniowe i miesięczne (2.3) ================= */
const nazwaMiesiaca = (ym, rok = true) => `${MIES_MN[+ym.slice(5, 7) - 1]}${rok ? ' ' + ym.slice(0, 4) : ''}`;
const nazwaMiesiacaD = ym => doDaty(ym + '-01').toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', timeZone: 'UTC' }).replace(/^\d+\s/, '');
const fmtCel = n => Number.isInteger(n) ? liczba(n) : ulamek(n);
const odmCel = (n, formy) => Number.isInteger(n) ? odmiana(n, formy) : formy[0]; // „3,8 książki”
const ZRODLA = { auto: 'z celu rocznego', stale: 'stały', miesiac: 'tylko ten miesiąc' };

/** Jeden wiersz celu: etykieta, „x z y”, pasek z kreską planu i podpowiedź. */
function wierszCelu({ etykieta, wart, cel, czesc, formy, formyD, dniZostalo, przyszly = false }) {
  if (!cel) return '';
  const proc = wart / cel * 100, zrobione = wart >= cel;
  const oczek = cel * czesc, brak = Math.max(0, cel - wart);
  let opis;
  if (zrobione) opis = `<span class="ok">${I.check}Zrobione${wart > cel ? `, ${fmtCel(zaokr1(wart - cel))} ponad cel` : ''}.</span>`;
  else if (przyszly) opis = 'Ten okres jeszcze się nie zaczął.';
  else if (czesc >= 1) opis = `<span class="zle">Zabrakło ${fmtCel(zaokr1(brak))} ${odmCel(zaokr1(brak), formyD)}.</span>`;
  else {
    const roz = wart - oczek;
    const tempo = dniZostalo > 0 ? brak / dniZostalo : brak;
    opis = `${roz >= 0 ? `<span class="ok">Przed planem.</span>` : `<span class="zle">${formy === FORMY_STRON ? liczba(Math.ceil(-roz)) : fmtCel(zaokr1(-roz))} za planem.</span>`}
      ${formy === FORMY_STRON ? ` Brakuje ${ile(Math.ceil(brak), FORMY_STRON_D)}, czyli ok. ${ile(Math.ceil(tempo), FORMY_STRON)} dziennie.` : ` Brakuje ${fmtCel(zaokr1(brak))} ${odmCel(zaokr1(brak), FORMY_KSIAZEK_D)}.`}`;
  }
  return `<div class="cel-wiersz${zrobione ? ' zrobiony' : ''}">
    <p class="cel-wiersz-gora"><span>${etykieta}</span><span><strong>${fmtCel(wart)}</strong> z ${fmtCel(cel)} ${odmCel(cel, formyD)}</span></p>
    ${pasek(Math.min(100, proc), { plan: przyszly || czesc >= 1 || zrobione ? null : czesc * 100 })}
    <p class="cel-wiersz-opis">${opis}</p></div>`;
}

function blokOkresow(m) {
  const t = postepTygodnia(m), dzis = dzisISO();
  const ym = miesiacTeraz(), mc = danyMiesiac(ym, m);
  const dniT = dniMiedzy(dzis, t.do) + 1, dniM = dniMiedzy(dzis, mc.do) + 1;
  return `<section class="sekcja okresy">
    <div class="sekcja-gora"><h2>Tydzień i miesiąc</h2><span class="sekcja-akcje"><button type="button" class="btn-tekst" data-akcja="tydzien">Plan tygodnia</button><button type="button" class="btn-tekst" data-akcja="miesiac" data-ym="${ym}">${I.kalendarz}${nazwaMiesiaca(ym, false)}</button></span></div>
    <div class="okresy-siatka">
      <div class="okres"><h3>Ten tydzień <small>${dataKrotka(t.od)} – ${dataKrotka(t.do)}</small></h3>
        ${wierszCelu({ etykieta: 'Strony', wart: t.strony, cel: t.cel.strony, czesc: t.czesc, formy: FORMY_STRON, formyD: FORMY_STRON_D, dniZostalo: dniT })}
        ${wierszCelu({ etykieta: 'Książki', wart: t.ksiazki, cel: t.cel.ksiazki, czesc: t.czesc, formy: FORMY_KSIAZEK, formyD: FORMY_KSIAZEK_D, dniZostalo: dniT })}</div>
      <div class="okres"><h3>${nazwaMiesiaca(ym, false).replace(/^./, c => c.toUpperCase())} <small>zostało ${ile(dniM, FORMY_DNI)}</small></h3>
        ${wierszCelu({ etykieta: 'Strony', wart: mc.strony, cel: mc.cel.strony, czesc: mc.czesc, formy: FORMY_STRON, formyD: FORMY_STRON_D, dniZostalo: dniM })}
        ${wierszCelu({ etykieta: 'Książki', wart: mc.ukonczone.length, cel: mc.cel.ksiazki, czesc: mc.czesc, formy: FORMY_KSIAZEK, formyD: FORMY_KSIAZEK_D, dniZostalo: dniM })}
        ${mc.cel.notatka ? `<p class="okres-notatka">${esc(mc.cel.notatka)}</p>` : ''}
        ${mc.zaplanowane.length ? `<p class="cichy okres-plan">Plan miesiąca: ${mc.zaplanowane.filter(x => x.zrobiona).length} z ${mc.zaplanowane.length} przeczytane.</p>` : ''}</div>
    </div>
  </section>`;
}

/* ---------- kalendarz miesiąca ---------- */
function kalendarzMiesiaca(mc) {
  const cel = bazaDzienna(), dzis = dzisISO();
  const pierwszy = dzienTygodnia(mc.od), ileDni = dniWMiesiacu(mc.ym);
  const okl = U.kalBezOkladek ? {} : okladkiDni(mc.od, mc.do);
  let kom = '';
  for (let i = 0; i < pierwszy; i++) kom += '<span class="kal-pusty"></span>';
  for (let d = 1; d <= ileDni; d++) {
    const iso = `${mc.ym}-${pad(d)}`, v = mc.dni[iso] || 0;
    const p = v === 0 ? 0 : v < cel / 3 ? 1 : v < cel * 2 / 3 ? 2 : v < cel ? 3 : 4;
    const przyszly = iso > dzis;
    kom += `<button type="button" class="kal-dzien hm${p}${iso === dzis ? ' kal-dzis' : ''}${przyszly ? ' kal-przyszly' : ''}" ${przyszly ? 'disabled' : `data-akcja="dzien" data-data="${iso}"`} aria-label="${dataDluga(iso)}: ${ile(v, FORMY_STRON)}">
      ${okl[iso] ? `<span class="kal-okl">${okl[iso].k.okladka ? `<img src="${esc(okl[iso].k.okladka)}" alt="" loading="lazy" onerror="this.remove()">` : `<span class="kal-okl-gen" style="--kolor:${PLOTNA[hash(okl[iso].k.tytul + okl[iso].k.autor) % PLOTNA.length]}">${esc((okl[iso].k.tytul.match(/[\p{L}\p{N}]/u) || ['?'])[0])}</span>`}</span>` : ''}
      <span class="kal-nr">${d}</span>${v ? `<span class="kal-v">${v}</span>` : ''}</button>`;
  }
  return `<div class="kalendarz" role="group" aria-label="Kalendarz: ${nazwaMiesiaca(mc.ym)}">
    ${DNI_KR.map(d => `<span class="kal-naglowek">${d}</span>`).join('')}${kom}</div>`;
}

/* ---------- arkusz: miesiąc ---------- */
function arkuszMiesiaca(start = miesiacTeraz()) {
  let ym = start;
  const a = arkusz({
    tytul: 'Twój miesiąc', klasa: 'arkusz-miesiac', odswiezalny: true,
    render: () => {
      const m = mapaDni(), mc = danyMiesiac(ym, m), pop = danyMiesiac(przesunMiesiac(ym, -1), m);
      const teraz = miesiacTeraz(), przyszly = ym > teraz;
      const dniZostalo = ym === teraz ? dniMiedzy(dzisISO(), mc.do) + 1 : 0;
      const dniMinelo = ym < teraz ? dniWMiesiacu(ym) : ym === teraz ? dniMiedzy(mc.od, dzisISO()) + 1 : 0;
      const zmiana = pop.strony ? Math.round((mc.strony - pop.strony) / pop.strony * 100) : null;
      const zaplStron = mc.zaplanowane.filter(x => !x.zrobiona).reduce((s, x) => s + (x.k.strony - (x.k.status === 'czytam' ? x.k.strona : 0)), 0);
      return `<div class="mies-nawigacja">
        <button type="button" class="btn-ikona" data-mies="-1" aria-label="Poprzedni miesiąc">${I.wstecz}</button>
        <h3 class="mies-tytul">${nazwaMiesiaca(ym)}</h3>
        <button type="button" class="btn-ikona" data-mies="1" aria-label="Następny miesiąc"${ym >= przesunMiesiac(teraz, 12) ? ' disabled' : ''}>${I.dalej}</button>
      </div>
      ${ym !== teraz ? `<p class="mies-wroc"><button type="button" class="btn-tekst" data-mies-teraz>Wróć do bieżącego miesiąca</button></p>` : ''}
      <section class="kd-sekcja mies-cele">
        <div class="sekcja-gora"><h3>Cele</h3><button type="button" class="btn btn-maly" data-akcja="cel-miesiaca" data-ym="${ym}">${I.edytuj}${mc.cel.wlasny ? 'Zmień cel' : 'Ustaw cel'}</button></div>
        ${wierszCelu({ etykieta: 'Książki', wart: mc.ukonczone.length, cel: mc.cel.ksiazki, czesc: mc.czesc, formy: FORMY_KSIAZEK, formyD: FORMY_KSIAZEK_D, dniZostalo, przyszly })}
        ${wierszCelu({ etykieta: 'Strony', wart: mc.strony, cel: mc.cel.strony, czesc: mc.czesc, formy: FORMY_STRON, formyD: FORMY_STRON_D, dniZostalo, przyszly })}
        <p class="podpowiedz">Cel książek: ${ZRODLA[mc.cel.zrodloK]}. Cel stron: ${ZRODLA[mc.cel.zrodloS]}.</p>
        ${mc.cel.notatka ? `<p class="okres-notatka">${esc(mc.cel.notatka)}</p>` : ''}
      </section>
      ${przyszly ? '' : `<dl class="liczby">
        <div><dt>Dni z czytaniem</dt><dd>${mc.dniCzytania}<small> z ${dniMinelo}</small></dd></div>
        <div><dt>Średnio dziennie</dt><dd>${dniMinelo ? Math.round(mc.strony / dniMinelo) : 0}<small> str.</small></dd></div>
        <div><dt>Najdłuższa seria</dt><dd>${mc.seria}<small> ${odmiana(mc.seria, FORMY_DNI)}</small></dd></div>
        <div><dt>Względem ${nazwaMiesiacaD(pop.ym)}</dt><dd>${zmiana == null ? '<small>brak danych</small>' : `${zmiana > 0 ? '+' : ''}${zmiana}<small>%</small>`}</dd></div>
        ${mc.minuty ? `<div><dt>Czas w sesjach</dt><dd>${czasCzytania(mc.minuty / 60).replace(/ (h|min)/g, '<small> $1</small>')}</dd></div>` : ''}
        ${mc.najDzien ? `<div><dt>Najlepszy dzień</dt><dd>${mc.najDzien[1]}<small> str., ${dataKrotka(mc.najDzien[0])}</small></dd></div>` : ''}
      </dl>
      <section class="kd-sekcja"><div class="sekcja-gora"><h3>Kalendarz</h3><button type="button" class="btn-tekst" data-kal-okl>${U.kalBezOkladek ? 'Pokaż okładki' : 'Pokaż kolory'}</button></div>${kalendarzMiesiaca(mc)}</section>`}
      <section class="kd-sekcja">
        <div class="sekcja-gora"><h3>Plan na ten miesiąc</h3><button type="button" class="btn btn-maly" data-akcja="plan-miesiaca" data-ym="${ym}">${I.plus}Dodaj książki</button></div>
        ${mc.zaplanowane.length ? `<ul class="lista">${mc.zaplanowane.map(({ k, zrobiona }) => `<li class="wiersz${zrobiona ? ' plan-zrobiona' : ''}">
          <button type="button" class="wiersz-glowny" data-akcja="ksiazka" data-id="${k.id}">${okladka(k, 's')}
            <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">${zrobiona ? 'przeczytana' : k.status === 'czytam' ? `czytasz, ${Math.floor(k.strona / k.strony * 100)}%` : k.status === 'przeczytana' ? 'przeczytana wcześniej' : ile(k.strony, FORMY_STRON)}</span></span></button>
          ${zrobiona ? `<span class="plan-check" aria-label="Przeczytana">${I.check}</span>` : `<button type="button" class="btn-ikona" data-odplanuj="${k.id}" aria-label="Usuń z planu: ${esc(k.tytul)}">${I.zamknij}</button>`}
        </li>`).join('')}</ul>
        ${zaplStron && !przyszly && dniZostalo ? `<p class="cichy">Do końca planu zostało ${ile(zaplStron, FORMY_STRON_D)}: ok. ${ile(Math.ceil(zaplStron / dniZostalo), FORMY_STRON)} dziennie.</p>` : ''}
        ${zaplStron && przyszly ? `<p class="cichy">Razem ${ile(zaplStron, FORMY_STRON)}, czyli ok. ${ile(Math.ceil(zaplStron / dniWMiesiacu(ym)), FORMY_STRON)} dziennie.</p>` : ''}`
        : '<p class="cichy">Wybierz książki, które chcesz przeczytać w tym miesiącu. Zobaczysz, ile stron dziennie to wymaga.</p>'}
      </section>
      ${mc.ukonczone.length ? `<section class="kd-sekcja"><div class="sekcja-gora"><h3>Przeczytane (${mc.ukonczone.length})</h3><button type="button" class="btn btn-maly" data-akcja="obraz-miesiaca" data-ym="${ym}">${I.obraz}Obrazek</button></div>
        <ul class="rok-okladki">${mc.ukonczone.map(({ k, koniec }) => `<li><button type="button" class="kafel" data-akcja="ksiazka" data-id="${k.id}" aria-label="${esc(k.tytul)}, skończona ${dataKrotka(koniec)}">${okladka(k, 'm')}<span class="kafel-data">${dataKrotka(koniec)}</span></button></li>`).join('')}</ul></section>` : ''}
      ${mc.czytane.length ? `<section class="kd-sekcja"><h3>Czytane w tym miesiącu</h3>
        <ul class="lista">${mc.czytane.map(({ k, strony, dni }) => `<li class="wiersz">
          <button type="button" class="wiersz-glowny" data-akcja="ksiazka" data-id="${k.id}">${okladka(k, 's')}
            <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">${esc(statusKsiazki(k))}</span></span></button>
          <span class="mies-strony"><strong>${liczba(strony)}</strong><small>${odmiana(strony, FORMY_STRON)}, ${ile(dni, FORMY_DNI)}</small></span>
          <span class="mies-udzial" style="--w:${(strony / mc.strony * 100).toFixed(1)}%"></span>
        </li>`).join('')}</ul></section>` : przyszly ? '' : '<p class="pusto">W tym miesiącu nie ma zapisanych stron.</p>'}`;
    }
  });
  a.tresc.addEventListener('click', e => {
    const n = e.target.closest('[data-mies]');
    if (n) { ym = przesunMiesiac(ym, +n.dataset.mies); a.rysuj(); a.el.scrollTop = 0; return; }
    if (e.target.closest('[data-mies-teraz]')) { ym = miesiacTeraz(); a.rysuj(); return; }
    if (e.target.closest('[data-kal-okl]')) { U.kalBezOkladek = !U.kalBezOkladek; a.rysuj(); return; }
    const o = e.target.closest('[data-odplanuj]');
    if (o) {
      const k = znajdz(o.dataset.odplanuj);
      utrwal(zaplanujNaMiesiac(k, null));
      odswiez();
      toast(`Usunięto z planu: „${k.tytul}”.`, { akcja: 'Cofnij', onAkcja: () => { utrwal(zaplanujNaMiesiac(k, ym)); odswiez(); } });
    }
  });
}

/* ---------- arkusz: cel na konkretny miesiąc ---------- */
function arkuszCeluMiesiaca(ym = miesiacTeraz()) {
  const u = Z.ustawienia, wl = u.celeMiesiecy[ym] || {};
  const zapas = { ...u.celeMiesiecy };
  delete Z.ustawienia.celeMiesiecy[ym];
  const auto = celMiesiaca(ym); // wartości bez własnego celu, do podpowiedzi
  Z.ustawienia.celeMiesiecy = zapas;
  const a = arkusz({
    tytul: 'Cel na miesiąc', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <label>Miesiąc<input name="ym" type="month" value="${ym}" required></label>
      <div class="f-rzad"><label>Książek<input name="ksiazki" type="number" inputmode="numeric" min="0" value="${wl.ksiazki || ''}" placeholder="${auto.ksiazki || 'brak'}"></label>
        <label>Stron<input name="strony" type="number" inputmode="numeric" min="0" value="${wl.strony || ''}" placeholder="${auto.strony}"></label></div>
      <p class="podpowiedz">Puste pole = wartość domyślna (${auto.ksiazki ? `${ile(auto.ksiazki, FORMY_KSIAZEK)}, ` : ''}${ile(auto.strony, FORMY_STRON)}, ${ZRODLA[auto.zrodloK]}). Wpisz własną liczbę, np. mniej na miesiąc z urlopem albo sesją, więcej na wakacje.</p>
      <div class="szybkie" role="group" aria-label="Szybki wybór książek">${[2, 4, 6, 8, 10, 15, 20].map(n => `<button type="button" class="chip" data-k="${n}">${n} ks.</button>`).join('')}</div>
      <label>Notatka do miesiąca<input name="notatka" maxlength="200" value="${esc(wl.notatka || '')}" placeholder="Np. wyzwanie: tylko reportaże"></label>
      <div class="przyciski przyciski-koniec">${u.celeMiesiecy[ym] ? '<button type="button" class="btn btn-ryzyko" data-usun-cel>Przywróć domyślny</button>' : ''}
        <button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Zapisz</button></div>
    </form>`
  });
  const f = $('form', a.tresc), v = n => f.elements.namedItem(n).value;
  f.addEventListener('click', e => { const c = e.target.closest('[data-k]'); if (c) f.elements.namedItem('ksiazki').value = c.dataset.k; });
  const zapisz = (dane, komunikat) => {
    const nowy = v('ym');
    if (!poprawnyMiesiac(nowy)) { toast('Wybierz miesiąc.', { typ: 'blad' }); return; }
    const przed = JSON.parse(JSON.stringify(Z.ustawienia.celeMiesiecy));
    if (nowy !== ym) delete Z.ustawienia.celeMiesiecy[ym];
    ustawCelMiesiaca(nowy, dane);
    utrwalUstawienia();
    a.zamknij();
    odswiez();
    toast(komunikat(nowy), { akcja: 'Cofnij', onAkcja: () => { Z.ustawienia.celeMiesiecy = przed; utrwalUstawienia(); odswiez(); } });
  };
  f.addEventListener('submit', e => {
    e.preventDefault();
    zapisz({ ksiazki: v('ksiazki'), strony: v('strony'), notatka: v('notatka') }, n => `Zapisano cel: ${nazwaMiesiaca(n)}.`);
  });
  $('[data-usun-cel]', f)?.addEventListener('click', () => zapisz({}, n => `${nazwaMiesiaca(n).replace(/^./, c => c.toUpperCase())}: cel domyślny.`));
}

/* ---------- arkusz: plan książek na miesiąc ---------- */
function arkuszPlanu(ym) {
  const a = arkusz({
    tytul: `Plan: ${nazwaMiesiaca(ym)}`, klasa: 'arkusz-maly', odswiezalny: true,
    render: () => {
      const kandydaci = [...czytane(), ...kolejka()];
      const wybrane = kandydaci.filter(k => k.planMiesiac === ym);
      const stron = wybrane.reduce((s, k) => s + k.strony - (k.status === 'czytam' ? k.strona : 0), 0);
      const c = celMiesiaca(ym);
      if (!kandydaci.length) return '<p class="pusto">Dodaj książki do listy „Do przeczytania”, żeby ułożyć plan.</p>';
      return `<p class="plan-suma"><strong>${ile(wybrane.length, FORMY_KSIAZEK)}</strong>, ${ile(stron, FORMY_STRON)} do przeczytania
        ${c.ksiazki ? `<span class="${wybrane.length >= c.ksiazki ? 'ok' : 'cichy'}">· cel ${fmtCel(c.ksiazki)}</span>` : ''}</p>
        ${stron > c.strony * 1.15 ? `<p class="zle plan-ostrzezenie">To więcej niż twój cel stron na ten miesiąc (${liczba(c.strony)}). Plan jest ambitny.</p>` : ''}
        <ul class="plan-lista">${kandydaci.map(k => {
          const tu = k.planMiesiac === ym, gdzieIndziej = k.planMiesiac && !tu;
          return `<li><label class="plan-wybor${tu ? ' wybrana' : ''}"><input type="checkbox" data-plan="${k.id}"${tu ? ' checked' : ''}>
            ${okladka(k, 's')}<span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span>
            <span class="wiersz-autor">${k.status === 'czytam' ? `czytasz, zostało ${ile(k.strony - k.strona, FORMY_STRON)}` : ile(k.strony, FORMY_STRON)}${gdzieIndziej ? `, w planie na ${nazwaMiesiaca(k.planMiesiac, false)}` : ''}</span></span></label></li>`;
        }).join('')}</ul>
        <div class="przyciski przyciski-koniec"><button type="button" class="btn btn-glowny" data-zamknij>Gotowe</button></div>`;
    }
  });
  a.tresc.addEventListener('change', e => {
    const id = e.target.dataset.plan;
    if (!id) return;
    utrwal(zaplanujNaMiesiac(znajdz(id), e.target.checked ? ym : null));
    odswiez();
  });
}

function arkuszPlanuKsiazki(id) {
  const k = znajdz(id);
  if (!k) return;
  const opcje = Array.from({ length: 12 }, (_, i) => przesunMiesiac(miesiacTeraz(), i));
  if (k.planMiesiac && !opcje.includes(k.planMiesiac)) opcje.unshift(k.planMiesiac);
  const a = arkusz({
    tytul: 'Zaplanuj na miesiąc', klasa: 'arkusz-maly',
    render: () => `<div class="postep-ksiazka">${okladka(k, 's')}<span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">${ile(k.strony, FORMY_STRON)}</span></span></div>
      <fieldset class="segment"><legend class="sr">Miesiąc</legend>${opcje.map(ym => radio('plan', ym, nazwaMiesiaca(ym, ym.slice(0, 4) !== miesiacTeraz().slice(0, 4)), k.planMiesiac === ym)).join('')}</fieldset>
      <div class="przyciski przyciski-koniec">${k.planMiesiac ? '<button type="button" class="btn btn-ryzyko" data-bez-planu>Usuń z planu</button>' : ''}<button type="button" class="btn" data-zamknij>Zamknij</button></div>`
  });
  a.tresc.addEventListener('change', e => {
    if (e.target.name !== 'plan') return;
    utrwal(zaplanujNaMiesiac(k, e.target.value));
    a.zamknij();
    odswiez();
    toast(`„${k.tytul}” w planie na ${nazwaMiesiaca(e.target.value)}.`, { akcja: 'Pokaż miesiąc', onAkcja: () => arkuszMiesiaca(e.target.value) });
  });
  $('[data-bez-planu]', a.tresc)?.addEventListener('click', () => { utrwal(zaplanujNaMiesiac(k, null)); a.zamknij(); odswiez(); toast('Usunięto z planu.'); });
}

/* ---------- statystyki: lista miesięcy ---------- */
function htmlMiesiecy(m) {
  const lista = miesiaceZDanymi().filter(ym => ym <= miesiacTeraz());
  const pokaz = U.wszystkieMiesiace ? lista : lista.slice(0, 6);
  return `<ul class="miesiace-lista">${pokaz.map(ym => {
    const mc = danyMiesiac(ym, m);
    const okK = mc.cel.ksiazki && mc.ukonczone.length >= mc.cel.ksiazki, okS = mc.strony >= mc.cel.strony;
    return `<li><button type="button" class="miesiac-wiersz" data-akcja="miesiac" data-ym="${ym}">
      <span class="miesiac-nazwa">${nazwaMiesiaca(ym)}${ym === miesiacTeraz() ? ' <small>teraz</small>' : ''}</span>
      <span class="miesiac-dane"><span class="${okK ? 'ok' : ''}">${okK ? I.check : ''}${mc.ukonczone.length}${mc.cel.ksiazki ? `/${fmtCel(mc.cel.ksiazki)}` : ''} ks.</span>
        <span class="${okS ? 'ok' : ''}">${okS ? I.check : ''}${liczba(mc.strony)} str.</span></span>
      <span class="miesiac-pasek"><span style="width:${Math.min(100, mc.strony / mc.cel.strony * 100).toFixed(1)}%"></span></span>
    </button></li>`;
  }).join('')}</ul>
  ${lista.length > 6 ? `<button type="button" class="btn-tekst" data-akcja="miesiace-wiecej">${U.wszystkieMiesiace ? 'Pokaż mniej' : `Pokaż wszystkie (${lista.length})`}</button>` : ''}`;
}

/* ---------- ustawienia: cele na kolejne miesiące ---------- */
function htmlCelowMiesiecy() {
  const u = Z.ustawienia, mies = [];
  for (let ym = u.start.slice(0, 7); ym <= u.koniec.slice(0, 7) && mies.length < 24; ym = przesunMiesiac(ym, 1)) mies.push(ym);
  for (const ym of Object.keys(u.celeMiesiecy)) if (!mies.includes(ym)) mies.push(ym);
  mies.sort();
  const wOkresie = mies.filter(ym => ym >= u.start.slice(0, 7) && ym <= u.koniec.slice(0, 7));
  const suma = wOkresie.reduce((s, ym) => s + celMiesiaca(ym).ksiazki, 0);
  return `<p class="cichy">Każdy miesiąc ma cel wyliczony z celu rocznego albo stały z pola powyżej. Kliknij miesiąc, żeby wpisać mu własny cel, np. mniej w miesiącu z egzaminami.</p>
    <ul class="cele-mies">${mies.map(ym => {
      const c = celMiesiaca(ym);
      return `<li><button type="button" class="cel-mies${c.wlasny ? ' wlasny' : ''}${ym === miesiacTeraz() ? ' teraz' : ''}" data-akcja="cel-miesiaca" data-ym="${ym}">
        <span class="cel-mies-nazwa">${nazwaMiesiaca(ym)}</span>
        <span class="cel-mies-wart">${c.ksiazki ? `${fmtCel(c.ksiazki)} ks.` : '—'} · ${liczba(c.strony)} str.</span>
        <span class="cel-mies-zrodlo">${c.wlasny ? 'własny' : c.zrodloK === 'stale' ? 'stały' : 'auto'}</span>
        ${c.notatka ? `<span class="cel-mies-notatka">${esc(c.notatka)}</span>` : ''}</button></li>`;
    }).join('')}</ul>
    <p class="${suma >= u.cel ? 'ok' : 'zle'} cele-suma">Suma celów miesięcznych w okresie: ${ile(suma, FORMY_KSIAZEK)} ${suma >= u.cel ? `(cel roczny ${u.cel} jest pokryty)` : `(o ${ile(u.cel - suma, FORMY_KSIAZEK_B)} mniej niż cel roczny ${u.cel})`}.</p>
    <div class="przyciski"><button type="button" class="btn" data-akcja="cel-miesiaca" data-ym="${miesiacTeraz()}">${I.plus}Cel na inny miesiąc</button></div>`;
}

/* ---------- powiadomienie o zrobionym celu tygodnia lub miesiąca ---------- */
function sprawdzCele() {
  if (!Z.ksiazki.length) return;
  const m = mapaDni(), t = postepTygodnia(m), ym = miesiacTeraz(), mc = danyMiesiac(ym, m);
  const teraz = [];
  if (t.strony >= t.cel.strony) teraz.push([`T${t.od}s`, `Cel tygodnia zrobiony: ${ile(t.strony, FORMY_STRON)}!`]);
  if (t.cel.ksiazki && t.ksiazki >= t.cel.ksiazki) teraz.push([`T${t.od}k`, `Tygodniowy cel książek zrobiony: ${t.ksiazki}.`]);
  if (mc.strony >= mc.cel.strony) teraz.push([`M${ym}s`, `Cel stron na ${nazwaMiesiaca(ym, false)} zrobiony!`]);
  if (mc.cel.ksiazki && mc.ukonczone.length >= mc.cel.ksiazki) teraz.push([`M${ym}k`, `${ile(mc.ukonczone.length, FORMY_KSIAZEK)} w tym miesiącu: cel zrobiony!`]);
  const zapis = lsGet('zakladka-cele-zrobione');
  const znane = new Set(zapis ? JSON.parse(zapis) : []);
  const nowe = teraz.filter(([id]) => !znane.has(id));
  if (zapis != null) nowe.forEach(([, tekst], i) => setTimeout(() => toast(tekst, { czas: 5000 }), 600 + i * 900));
  if (zapis != null && nowe.length) setTimeout(() => konfetti({ ile: 90 }), 500);
  if (nowe.length || zapis == null) {
    const lista = [...znane, ...teraz.map(([id]) => id)];
    lsSet('zakladka-cele-zrobione', JSON.stringify([...new Set(lista)].slice(-60)));
  }
}

/* ================= cykle, pożyczki, grafiki, cel w czasie (2.5) ================= */
const tomTekst = t => t == null ? '' : `tom ${String(t).replace('.', ',')}`;

function htmlSerii(k) {
  if (!k.seria) return '';
  const lista = ksiazkiSerii(k.seria);
  const przecz = lista.filter(x => x.status === 'przeczytana').length;
  const nast = nastepnyTom(k);
  return `<section class="kd-sekcja kd-seria">
    <div class="sekcja-gora"><h3>Cykl: ${esc(k.seria)}</h3><span class="licznik">${przecz}/${lista.length}</span></div>
    <ol class="seria-lista">${lista.map(x => `<li class="${x === k ? 'ta' : ''} st-${x.status}">
      <button type="button" class="seria-wiersz" data-akcja="ksiazka" data-id="${x.id}"${x === k ? ' aria-current="true"' : ''}>
        <span class="seria-tom">${x.tom != null ? String(x.tom).replace('.', ',') : '·'}</span>
        <span class="seria-tytul">${esc(x.tytul)}</span>
        <span class="seria-stan">${x.status === 'przeczytana' ? I.check : x.status === 'czytam' ? `${Math.floor(x.strona / x.strony * 100)}%` : x.status === 'porzucona' ? '✕' : ''}</span>
      </button></li>`).join('')}</ol>
    ${nast && k.status === 'przeczytana' && nast.status === 'doPrzeczytania' ? `<div class="przyciski"><button type="button" class="btn btn-glowny btn-maly" data-akcja="zacznij" data-id="${nast.id}">Zacznij następny: ${esc(nast.tytul)}</button></div>` : ''}
  </section>`;
}

function htmlPozyczki(k) {
  const p = k.pozyczona;
  const hist = (k.historiaPozyczek || []).length;
  if (!p) return `<p class="kd-pozyczka">${I.reka}<button type="button" class="btn-tekst" data-akcja="pozyczka" data-id="${k.id}">Pożyczona? Zapisz komu, od kogo albo z biblioteki</button>${hist ? `<span class="cichy"> · pożyczana ${ile(hist, ['raz', 'razy', 'razy'])}</span>` : ''}</p>`;
  const dni = dniMiedzy(p.data, dzisISO()), dz = dniDoZwrotu(k);
  const stanT = dz == null ? '' : dz < 0 ? `<strong class="zle">po terminie ${ile(-dz, FORMY_DNI)}</strong>` : dz === 0 ? '<strong class="zle">oddać dziś</strong>' : dz <= 3 ? `<strong class="ostrzezenie">oddać za ${ile(dz, FORMY_DNI)}</strong>` : `oddać do ${dataDluga(p.termin, false)}`;
  const kto = p.typ === 'biblioteka' ? `z biblioteki: <strong>${esc(p.kto)}</strong>` : p.kierunek === 'komus' ? `pożyczona: <strong>${esc(p.kto)}</strong>` : `od: <strong>${esc(p.kto)}</strong>`;
  return `<div class="kd-pozyczka aktywna${dz != null && dz < 0 ? ' dawno' : dz != null && dz <= 3 ? ' blisko' : !p.termin && dni > 30 ? ' dawno' : ''}">
    <p>${I.reka}<span>${kto.replace(/^./, c => c.toUpperCase())}, od ${dataKrotka(p.data)} (${ile(dni, FORMY_DNI)})${stanT ? ` · ${stanT}` : ''}${p.prolongaty ? ` · prolongat: ${p.prolongaty}` : ''}</span></p>
    <div class="przyciski">
      ${p.termin ? `<button type="button" class="btn btn-maly" data-akcja="prolonguj" data-id="${k.id}" data-dni="${p.typ === 'biblioteka' ? 30 : 14}">Przedłuż o ${p.typ === 'biblioteka' ? 30 : 14} dni</button>` : ''}
      ${p.termin ? `<button type="button" class="btn btn-maly" data-akcja="ics-zwrot" data-id="${k.id}">${I.dzwonek}Do kalendarza</button>` : ''}
      <button type="button" class="btn btn-maly btn-glowny" data-akcja="zwrot" data-id="${k.id}">${p.kierunek === 'komus' ? 'Wróciła' : 'Oddana'}</button>
      <button type="button" class="btn-tekst" data-akcja="pozyczka" data-id="${k.id}">Zmień</button></div></div>`;
}

function arkuszPozyczki(id) {
  const k = znajdz(id);
  if (!k) return;
  const p = k.pozyczona || { kto: '', data: dzisISO(), kierunek: 'komus', typ: 'osoba', termin: null };
  const znani = [...new Set(Z.ksiazki.flatMap(x => [x.pozyczona && x.pozyczona.kto, ...(x.historiaPozyczek || []).map(h => h.kto)]).filter(Boolean))];
  let typ = p.typ === 'biblioteka' ? 'biblioteka' : p.kierunek === 'od' ? 'od' : 'komus';
  const a = arkusz({
    tytul: 'Pożyczona książka', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <div class="postep-ksiazka">${okladka(k, 's')}<span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">${esc(k.autor)}</span></span></div>
      <fieldset class="segment"><legend class="sr">Rodzaj</legend>${radio('typ', 'komus', 'Pożyczyłem komuś', typ === 'komus')}${radio('typ', 'od', 'Mam od kogoś', typ === 'od')}${radio('typ', 'biblioteka', 'Z biblioteki', typ === 'biblioteka')}</fieldset>
      <label><span data-kto-et>${typ === 'biblioteka' ? 'Która biblioteka' : typ === 'od' ? 'Od kogo' : 'Komu'}</span><input name="kto" value="${esc(p.kto)}" list="znani-pozyczajacy" autocomplete="off" required placeholder="${typ === 'biblioteka' ? 'np. Biblioteka Miejska, filia 3' : 'np. Ania'}"></label>
      <datalist id="znani-pozyczajacy">${znani.map(z => `<option value="${esc(z)}">`).join('')}</datalist>
      <div class="f-rzad"><label>Od kiedy<input name="data" type="date" max="${dzisISO()}" value="${p.data}"></label>
        <label>Oddać do<input name="termin" type="date" value="${p.termin || ''}"></label></div>
      <div class="szybkie" role="group" aria-label="Termin zwrotu">${[[7, 'tydzień'], [14, '2 tygodnie'], [30, 'miesiąc'], [60, '2 miesiące']].map(([d, n]) => `<button type="button" class="chip" data-termin="${d}">${n}</button>`).join('')}<button type="button" class="chip" data-termin="0">bez terminu</button></div>
      <p class="podpowiedz" data-podp-termin>${typ === 'biblioteka' ? 'Biblioteki zwykle dają 30 dni. Przypomnę 3 dni przed terminem, a „Przedłuż” doda kolejne 30 dni.' : 'Z terminem przypomnę 3 dni przed. Bez terminu przypomnę po 30 dniach.'}</p>
      <div class="przyciski przyciski-koniec">${k.pozyczona ? `<button type="button" class="btn btn-ryzyko" data-zwrot>${p.kierunek === 'komus' ? 'Wróciła' : 'Oddana'}</button>` : ''}
        <button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Zapisz</button></div>
    </form>`
  });
  const f = $('form', a.tresc);
  const od = () => poprawnaData(f.elements.data.value) ? f.elements.data.value : dzisISO();
  if (!k.pozyczona && typ === 'biblioteka') f.elements.termin.value = dodajDni(od(), 30);
  f.addEventListener('change', e => {
    if (e.target.name !== 'typ') return;
    typ = e.target.value;
    $('[data-kto-et]', f).textContent = typ === 'biblioteka' ? 'Która biblioteka' : typ === 'od' ? 'Od kogo' : 'Komu';
    f.elements.kto.placeholder = typ === 'biblioteka' ? 'np. Biblioteka Miejska, filia 3' : 'np. Ania';
    if (typ === 'biblioteka' && !f.elements.termin.value) f.elements.termin.value = dodajDni(od(), 30);
  });
  f.addEventListener('click', e => {
    const c = e.target.closest('[data-termin]');
    if (c) f.elements.termin.value = +c.dataset.termin ? dodajDni(od(), +c.dataset.termin) : '';
  });
  f.addEventListener('submit', e => {
    e.preventDefault();
    const kto = f.elements.kto.value.trim();
    if (!kto) { f.elements.kto.focus(); return; }
    const termin = poprawnaData(f.elements.termin.value) ? f.elements.termin.value : null;
    if (termin && termin < od()) { toast('Termin zwrotu musi być po dacie pożyczenia.', { typ: 'blad' }); return; }
    k.pozyczona = { kto: kto.slice(0, 60), data: od(), kierunek: typ === 'komus' ? 'komus' : 'od', typ: typ === 'biblioteka' ? 'biblioteka' : 'osoba', termin, prolongaty: (k.pozyczona && k.pozyczona.prolongaty) || 0 };
    utrwal(k); a.zamknij(); odswiez();
    toast(`Zapisano${termin ? `. Oddać do ${dataDluga(termin, false)}` : ''}.`, termin ? { akcja: 'Do kalendarza', onAkcja: () => AKCJE['ics-zwrot']({ id: k.id }) } : {});
  });
  $('[data-zwrot]', f)?.addEventListener('click', () => { a.zamknij(); zwrocKsiazke(k.id); });
}

function zwrocKsiazke(id) {
  const k = znajdz(id);
  if (!k || !k.pozyczona) return;
  const przed = { pozyczona: { ...k.pozyczona }, historiaPozyczek: [...(k.historiaPozyczek || [])] };
  utrwal(zwrocPozyczke(k)); odswiez();
  toast(przed.pozyczona.kierunek === 'komus' ? `„${k.tytul}” wróciła na półkę.` : `Oddano „${k.tytul}”.`, { akcja: 'Cofnij', onAkcja: () => { Object.assign(k, przed); utrwal(k); odswiez(); } });
}

function banerPozyczek() {
  const lista = pozyczoneKsiazki().map(k => ({ k, dz: dniDoZwrotu(k), dni: dniMiedzy(k.pozyczona.data, dzisISO()) }))
    .filter(x => (x.dz != null && x.dz <= 3) || (x.dz == null && x.dni > 30))
    .sort((a, b) => (a.dz ?? 99) - (b.dz ?? 99));
  if (!lista.length) return '';
  const { k, dz, dni } = lista[0], p = k.pozyczona;
  const tekst = dz != null
    ? (dz < 0 ? `„${esc(k.tytul)}” jest <strong>po terminie ${ile(-dz, FORMY_DNI)}</strong>${p.typ === 'biblioteka' ? ` (${esc(p.kto)})` : ''}.` : dz === 0 ? `Dziś trzeba oddać „${esc(k.tytul)}”${p.typ === 'biblioteka' ? ` do: ${esc(p.kto)}` : ''}.` : `Za ${ile(dz, FORMY_DNI)} trzeba oddać „${esc(k.tytul)}”${p.typ === 'biblioteka' ? ` (${esc(p.kto)})` : ''}.`)
    : p.kierunek === 'komus' ? `<strong>${esc(p.kto)}</strong> ma „${esc(k.tytul)}” od ${ile(dni, FORMY_DNI)}.` : `Masz „${esc(k.tytul)}” od <strong>${esc(p.kto)}</strong> już ${ile(dni, FORMY_DNI)}.`;
  return `<div class="baner baner-pozyczka${dz != null && dz < 0 ? ' baner-zle' : ''}"><p>${I.reka}<span>${tekst}${lista.length > 1 ? ` I ${ile(lista.length - 1, FORMY_KSIAZEK)} więcej.` : ''}</span></p>
    <div class="przyciski">${p.termin ? `<button type="button" class="btn btn-maly" data-akcja="prolonguj" data-id="${k.id}" data-dni="${p.typ === 'biblioteka' ? 30 : 14}">Przedłuż</button>` : ''}
      <button type="button" class="btn btn-maly" data-akcja="zwrot" data-id="${k.id}">${p.kierunek === 'komus' ? 'Już wróciła' : 'Już oddana'}</button>
      <button type="button" class="btn-tekst" data-akcja="idz" data-widok="biblioteka" data-pozyczone="1">Wszystkie pożyczone</button></div></div>`;
}

function icsZwrotu(k) {
  const p = k.pozyczona;
  if (!p || !p.termin) return '';
  return icsKalendarz([{
    uid: `zwrot-${k.id}-${p.termin}`, start: icsData(dodajDni(p.termin, -2), Z.ustawienia.przypomnienie.godzina || '18:00'), minuty: 15,
    tytul: `📚 Oddać za 2 dni: ${k.tytul}`, opis: `${p.typ === 'biblioteka' ? `Biblioteka: ${p.kto}` : p.kierunek === 'komus' ? `${p.kto} ma twoją książkę` : `Pożyczona od: ${p.kto}`}. Termin: ${p.termin}.`
  }, {
    uid: `zwrot-dzien-${k.id}-${p.termin}`, start: icsData(p.termin, '09:00'), minuty: 15,
    tytul: `📚 Dziś termin zwrotu: ${k.tytul}`, opis: p.kto
  }]);
}

/* ---------- wykres: cel roczny w czasie ---------- */
function wykresCeluWCzasie() {
  const c = celWCzasie(), u = Z.ustawienia;
  if (!c.doDzis) return '<p class="cichy">Wykres pojawi się, gdy zacznie się okres celu.</p>';
  const W = 340, H = 170, L = 26, D = 20, G = 12, sz = W - L - 8, wys = H - D - G;
  const max = Math.max(c.cel, c.prognoza, c.przeczytane, 1) * 1.05;
  const x = d => L + d / (c.dni - 1 || 1) * sz, y = v => G + wys - v / max * wys;
  const krok = Math.max(1, Math.floor(c.narast.length / 120));
  let sciezka = '';
  for (let d = 0; d < c.narast.length; d += krok) sciezka += `${sciezka ? 'L' : 'M'}${x(d).toFixed(1)},${y(c.narast[d]).toFixed(1)}`;
  const ost = c.narast.length - 1;
  sciezka += `L${x(ost).toFixed(1)},${y(c.narast[ost]).toFixed(1)}`;
  const obszar = `${sciezka}L${x(ost).toFixed(1)},${y(0).toFixed(1)}L${x(0).toFixed(1)},${y(0).toFixed(1)}Z`;
  const siatka = [0.25, 0.5, 0.75, 1].map(f => Math.round(c.cel * f)).map(v => `<line x1="${L}" x2="${W - 8}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="linia-siatki"/><text x="${L - 4}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" class="etykieta">${v}</text>`).join('');
  const mies = [];
  for (let ym = u.start.slice(0, 7); ym <= u.koniec.slice(0, 7); ym = przesunMiesiac(ym, 1)) {
    const d = dniMiedzy(u.start, ym + '-01');
    if (d >= 0) mies.push(`<text x="${x(d).toFixed(1)}" y="${H - 4}" class="etykieta">${MIES_KR[+ym.slice(5) - 1][0]}</text>`);
  }
  const ok = c.prognoza >= c.cel;
  return `<p class="cichy">${ok ? `Przy obecnym tempie skończysz okres z ok. <strong class="ok">${c.prognoza}</strong> książkami, więcej niż cel ${c.cel}.` : `Przy obecnym tempie wyjdzie ok. <strong class="zle">${c.prognoza}</strong> z ${c.cel} książek.`} Szara linia to równy plan, przerywana to prognoza.</p>
    <svg class="wykres" viewBox="0 0 ${W} ${H}" role="img" aria-label="Przeczytane książki narastająco na tle planu">
    ${siatka}<line x1="${L}" x2="${W - 8}" y1="${y(0)}" y2="${y(0)}" class="os"/>
    <line x1="${x(0)}" y1="${y(0)}" x2="${x(c.dni - 1).toFixed(1)}" y2="${y(c.cel).toFixed(1)}" class="linia-planu"/>
    <path d="${obszar}" class="obszar-postepu"/><path d="${sciezka}" class="linia-postepu"/>
    <line x1="${x(ost).toFixed(1)}" y1="${y(c.narast[ost]).toFixed(1)}" x2="${x(c.dni - 1).toFixed(1)}" y2="${y(c.prognoza).toFixed(1)}" class="linia-prognozy ${ok ? 'ok' : 'zle'}"/>
    <circle cx="${x(ost).toFixed(1)}" cy="${y(c.narast[ost]).toFixed(1)}" r="4" class="punkt-teraz"/>
    ${mies.join('')}</svg>`;
}

/* ---------- grafika z okładkami (miesiąc, rok) ---------- */
async function obrazPolki({ naglowek, podpis, ksiazki }) {
  const W = 1080, H = 1350, M = 80;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const serif = '"Literata", Georgia, serif', sans = '"Figtree", system-ui, sans-serif';
  try { await Promise.all([document.fonts.load(`600 72px ${serif}`), document.fonts.load(`600 34px ${sans}`)]); } catch { /* bez czcionek */ }
  ctx.fillStyle = '#1f4a3d';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.05; ctx.fillStyle = '#fff';
  for (let yy = 0; yy < H; yy += 3) ctx.fillRect(0, yy, W, 1);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(217, 182, 110, .55)'; ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.fillStyle = '#a3233a';
  ctx.beginPath(); ctx.moveTo(W - 190, 0); ctx.lineTo(W - 135, 0); ctx.lineTo(W - 135, 210); ctx.lineTo(W - 162, 185); ctx.lineTo(W - 190, 210); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f1ede0';
  ctx.font = `600 76px ${serif}`;
  ctx.fillText(naglowek, M, 175);
  ctx.font = `500 34px ${sans}`;
  ctx.fillStyle = '#d9b66e';
  ctx.fillText(podpis, M, 235);
  // siatka okładek
  const lista = ksiazki.slice(0, 30), n = lista.length || 1;
  const gora = 300, dol = H - 150, dostW = W - 2 * M, dostH = dol - gora;
  let kol = 1;
  for (let c = 1; c <= 8; c++) {
    const w = (dostW - (c - 1) * 24) / c, rz = Math.ceil(n / c);
    if (rz * (w * 1.5 + 24) - 24 <= dostH) { kol = c; break; }
    kol = c;
  }
  const kw = Math.min(300, (dostW - (kol - 1) * 24) / kol), kh = kw * 1.5;
  const rzedy = Math.ceil(n / kol);
  const startY = gora + Math.max(0, (dostH - (rzedy * (kh + 24) - 24)) / 2);
  const obrazy = await Promise.all(lista.map(k => k.okladka ? wczytajObraz(k.okladka, !k.okladka.startsWith('data:')).catch(() => null) : null));
  lista.forEach((k, i) => {
    const r = Math.floor(i / kol), c = i % kol;
    const wRz = Math.min(kol, n - r * kol);
    const x = M + (dostW - (wRz * (kw + 24) - 24)) / 2 + c * (kw + 24), y = startY + r * (kh + 24);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
    const img = obrazy[i];
    if (img) {
      try { ctx.drawImage(img, x, y, kw, kh); } catch { /* okładka bez zgody na rysowanie */ }
    } else {
      ctx.fillStyle = PLOTNA[hash(k.tytul + k.autor) % PLOTNA.length];
      ctx.fillRect(x, y, kw, kh);
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(217,182,110,.6)'; ctx.lineWidth = 2;
      ctx.strokeRect(x + 8, y + 8, kw - 16, kh - 16);
      ctx.fillStyle = '#f1ede0';
      const fs = Math.max(14, Math.round(kw / 9));
      ctx.font = `600 ${fs}px ${serif}`;
      zawijaj(ctx, k.tytul, kw - 30).slice(0, 4).forEach((l, j) => ctx.fillText(l, x + 15, y + 20 + fs * (j + 1.2)));
    }
    ctx.restore();
  });
  if (!ksiazki.length) {
    ctx.fillStyle = '#b7c6bb'; ctx.font = `500 36px ${sans}`;
    ctx.fillText('Jeszcze bez skończonej książki.', M, gora + 80);
  }
  if (ksiazki.length > lista.length) {
    ctx.fillStyle = '#b7c6bb'; ctx.font = `500 30px ${sans}`;
    ctx.fillText(`i jeszcze ${ksiazki.length - lista.length}…`, M, dol + 50);
  }
  ctx.font = `600 24px ${sans}`;
  ctx.fillStyle = 'rgba(217, 182, 110, .85)';
  ctx.textAlign = 'right';
  ctx.fillText('ZAKŁADKA', W - M, H - 80);
  let blob;
  try { blob = await new Promise(ok => cv.toBlob(ok, 'image/png')); } catch { blob = null; }
  if (!blob) throw new Error('Nie udało się utworzyć obrazka.');
  return blob;
}

async function udostepnijPolke(dane, nazwa) {
  try {
    toast('Przygotowuję obrazek…', { czas: 1500 });
    const blob = await obrazPolki(dane);
    if (await zapiszPlik(nazwa, blob, 'image/png')) toast('Obrazek gotowy.');
  } catch (e) { console.warn(e); toast('Nie udało się utworzyć obrazka.', { typ: 'blad' }); }
}

/* ================= plan tygodnia: zaawansowany (2.7) ================= */
const zakresTyg = pn => `${dataKrotka(pn)} – ${dataKrotka(dodajDni(pn, 6))}`;
const czasTekst = min => min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}` : `${min} min`;
const celWpisu = e => [e.strony ? `${e.strony} str.` : '', e.minuty ? czasTekst(e.minuty) : ''].filter(Boolean).join(' / ');

function arkuszTygodnia(start = poczatekTygodnia()) {
  let pn = start;
  const a = arkusz({
    tytul: 'Plan tygodnia', klasa: 'arkusz-tydzien', odswiezalny: true,
    render: () => {
      const dzis = dzisISO(), teraz = poczatekTygodnia();
      const wpisy = planTygodniaPelny(pn);
      const m = mapaDni(), t = postepTygodnia(m, pn);
      const naTydzien = wpisy.filter(e => !e.dzien);
      const dzienne = wpisy.filter(e => e.dzien);
      const zaplStron = dzienne.reduce((s, e) => s + (e.strony || stronZMinut(e.minuty || 0)), 0);
      const dni = Array.from({ length: 7 }, (_, i) => dodajDni(pn, i));
      const pojemnosc = dni.reduce((s, d) => s + czasDnia(d), 0);
      const zalegle = dzienne.filter(e => e.dzien < dzis && !e.zrobione && !e.staly).length;
      const rozlozone = new Set(dzienne.filter(e => !e.staly).map(e => e.id));
      return `<div class="mies-nawigacja">
        <button type="button" class="btn-ikona" data-tyg="-1" aria-label="Poprzedni tydzień">${I.wstecz}</button>
        <h3 class="mies-tytul tyg-tytul">${zakresTyg(pn)}${pn === teraz ? '<small>ten tydzień</small>' : ''}</h3>
        <button type="button" class="btn-ikona" data-tyg="1" aria-label="Następny tydzień">${I.dalej}</button>
      </div>
      ${pn !== teraz ? `<p class="mies-wroc"><button type="button" class="btn-tekst" data-tyg-teraz>Wróć do tego tygodnia</button></p>` : ''}
      <dl class="tyg-liczby">
        <div><dt>Przeczytane</dt><dd>${liczba(t.strony)}<small> / ${liczba(t.cel.strony)} str.</small></dd></div>
        <div><dt>Zaplanowane</dt><dd>${liczba(zaplStron)}<small> str.</small></dd></div>
        <div><dt>Twój czas</dt><dd>${czasTekst(pojemnosc)}<small> ≈ ${liczba(stronZMinut(pojemnosc))} str.</small></dd></div>
      </dl>
      ${zaplStron > stronZMinut(pojemnosc) * 1.1 && pojemnosc ? `<p class="zle tyg-ostrzezenie">Plan ma więcej stron, niż zdążysz przeczytać w swoim czasie (${czasTekst(minutZeStron(zaplStron))} przy ${Math.round(tempoPlanu())} str./h). <button type="button" class="btn-tekst" data-akcja="czas-czytania">Zmień swój czas</button></p>` : ''}
      ${zalegle && pn === teraz ? `<div class="baner tyg-zalegle"><p>Masz ${ile(zalegle, ['niezrobiony wpis', 'niezrobione wpisy', 'niezrobionych wpisów'])} z poprzednich dni.</p><button type="button" class="btn btn-maly" data-zalegle>Przenieś na dziś</button></div>` : ''}

      <section class="kd-sekcja">
        <div class="sekcja-gora"><h3>Książki na ten tydzień</h3>${t.cel.ksiazki ? `<span class="licznik tyg-cel-ks" title="Skończone / cel książek">${t.ksiazki}/${fmtCel(t.cel.ksiazki)}</span>` : ''}</div>
        ${pn >= teraz ? `<div class="przyciski tyg-cta"><button type="button" class="btn btn-glowny" data-akcja="kreator" data-pn="${pn}">${I.kalendarz}${naTydzien.length ? 'Zmień plan tygodnia' : 'Zaplanuj tydzień'}</button>
          <button type="button" class="btn btn-maly" data-akcja="tydzien-dodaj" data-pn="${pn}">${I.plus}Szybko dodaj</button></div>` : ''}
        ${naTydzien.length ? `<ul class="lista">${naTydzien.map(e => `<li class="wiersz${e.zrobione ? ' plan-zrobiona' : ''}">
          <button type="button" class="wiersz-glowny" data-akcja="ksiazka" data-id="${e.k.id}">${okladka(e.k, 's')}
            <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(e.k.tytul)}</span>
            <span class="wiersz-autor">${e.zrobione ? 'zrobione' : `${e.przecz ? `+${e.przecz} str. w tym tygodniu, ` : ''}zostało ${ile(zostaloStron(e.k), FORMY_STRON)}${rozlozone.has(e.id) ? '' : ', jeszcze nie rozłożona'}`}</span></span></button>
          ${e.zrobione ? `<span class="plan-check">${I.check}</span>` : `<button type="button" class="btn-ikona" data-usun-wpis="${e.i}" aria-label="Usuń z planu">${I.zamknij}</button>`}
        </li>`).join('')}</ul>
        `
        : '<p class="cichy">Kliknij „Zaplanuj tydzień”: wybierzesz cel (np. 3–4 książki), aplikacja dobierze książki i rozłoży strony na dni według twojego czasu.</p>'}
      </section>

      <section class="kd-sekcja"><div class="sekcja-gora"><h3>Dzień po dniu</h3><button type="button" class="btn-tekst" data-akcja="czas-czytania">${I.zegar}Mój czas</button></div>
        <ol class="tyg-dni">${dni.map((d, i) => {
          const dz = dzienne.filter(e => e.dzien === d), przecz = m.get(d) || 0;
          const cel = dz.reduce((s, e) => s + (e.strony || stronZMinut(e.minuty || 0)), 0);
          const poj = stronZMinut(czasDnia(d));
          const zapelnienie = poj ? Math.min(100, cel / poj * 100) : cel ? 100 : 0;
          return `<li class="tyg-dzien${d === dzis ? ' dzis' : ''}${d < dzis ? ' minal' : ''}${!czasDnia(d) ? ' wolny' : ''}" data-dzien="${d}">
            <div class="tyg-dzien-gora"><button type="button" class="tyg-dzien-nazwa" data-akcja="dzien" data-data="${d}"><strong>${DNI_PELNE[i]}</strong> <span>${dataKrotka(d)}</span></button>
              <span class="tyg-dzien-liczby">${przecz ? `<span class="${cel && przecz >= cel ? 'ok' : ''}">${przecz}${cel ? `/${cel}` : ''} str.</span>` : cel ? `${cel} str.` : ''}</span>
              <button type="button" class="btn-ikona maly" data-akcja="tydzien-dodaj" data-pn="${pn}" data-dzien="${d}" aria-label="Zaplanuj na ${DNI_PELNE[i]}">${I.plus}</button></div>
            <div class="tyg-pojemnosc" title="Zaplanowane względem twojego czasu"><span class="${zapelnienie >= 100 && cel > poj * 1.1 ? 'przeciazony' : ''}" style="width:${zapelnienie.toFixed(0)}%"></span></div>
            <p class="tyg-czas">${czasDnia(d) ? `${czasTekst(czasDnia(d))} ≈ ${poj} str.` : 'dzień bez czytania'}</p>
            ${dz.length ? `<ul class="tyg-wpisy">${dz.map(e => `<li class="${e.zrobione ? 'zrobione' : e.minal ? 'pominiete' : ''}">
              <span class="tyg-znak">${e.zrobione ? I.check : ''}</span>
              <span class="tyg-mini-okl">${okladka(e.k, 's')}</span>
              <button type="button" class="tyg-wpis${e.auto ? ' tyg-auto' : ''}" ${e.auto ? `data-akcja="bazowa" data-id="${e.k.id}" title="Norma książki bazowej, liczona z terminu"` : `data-wpis-planu="${e.staly ? `s:${e.staly}` : e.i}"`} data-dzien="${d}">
                <span class="tyg-ksiazka">${e.auto ? '<span class="tyg-bazowa" title="Książka bazowa">B</span>' : ''}${e.staly ? `<span class="tyg-staly" title="Stały plan">↻</span>` : ''}${esc(e.k.tytul)}</span>
                <span class="tyg-str">${e.przecz && e.strony ? `${e.przecz}/` : ''}${celWpisu(e) || (e.przecz ? `+${e.przecz} str.` : 'dowolnie')}</span></button>
              ${d >= dzis && !e.zrobione && !e.auto ? `<button type="button" class="btn-ikona maly" data-jutro="${e.staly ? `s:${e.staly}` : e.i}" data-dzien="${d}" aria-label="Przenieś na następny dzień" title="Na następny dzień">${I.dalej}</button>` : ''}
            </li>`).join('')}</ul>` : ''}
          </li>`;
        }).join('')}</ol>
      </section>

      <section class="kd-sekcja"><div class="sekcja-gora"><h3>Stałe plany</h3><button type="button" class="btn btn-maly" data-akcja="staly-plan">${I.plus}Dodaj</button></div>
        ${Z.ustawienia.stalePlany.length ? `<ul class="stale-lista">${Z.ustawienia.stalePlany.map(r => { const k = znajdz(r.id); return k ? `<li><button type="button" class="stale-wiersz" data-akcja="staly-plan" data-rid="${r.rid}">
          <span class="tyg-staly">↻</span><span class="stale-tytul">${esc(k.tytul)}</span>
          <span class="stale-opis">${r.dni.length === 7 ? 'codziennie' : r.dni.map(x => DNI_KR[x]).join(', ')}${celWpisu(r) ? ` · ${celWpisu(r)}` : ''}</span></button></li>` : ''; }).join('')}</ul>`
        : '<p class="cichy">Powtarzaj plan co tydzień, np. „Lalka: od poniedziałku do piątku po 30 stron” albo „Audiobook: weekendy po 45 minut”.</p>'}
      </section>
      <div class="przyciski przyciski-srodek">
        ${dzienne.some(e => e.dzien >= dzis) ? `<button type="button" class="btn" data-ics-tydzien>${I.dzwonek}Dodaj do kalendarza telefonu</button>` : ''}
        <button type="button" class="btn-tekst" data-do-przypomnien>Ustaw przypomnienia</button>
      </div>`;
    }
  });
  const otworzWpis = (klucz, dzien) => {
    if (String(klucz).startsWith('s:')) arkuszWpisuPlanu(pn, { staly: klucz.slice(2), dzien });
    else arkuszWpisuPlanu(pn, { i: +klucz });
  };
  a.tresc.addEventListener('click', async e => {
    const n = e.target.closest('[data-tyg]');
    if (n) { pn = dodajDni(pn, 7 * +n.dataset.tyg); a.rysuj(); a.el.scrollTop = 0; return; }
    if (e.target.closest('[data-tyg-teraz]')) { pn = poczatekTygodnia(); a.rysuj(); return; }
    const w = e.target.closest('[data-wpis-planu]');
    if (w) { otworzWpis(w.dataset.wpisPlanu, w.dataset.dzien); return; }
    const j = e.target.closest('[data-jutro]');
    if (j) {
      const przed = JSON.parse(JSON.stringify(Z.ustawienia.planyTygodni));
      const jutro = dodajDni(j.dataset.dzien, 1);
      if (j.dataset.jutro.startsWith('s:')) przeniesStaly(pn, j.dataset.jutro.slice(2), j.dataset.dzien, jutro);
      else przeniesWpis(pn, +j.dataset.jutro, jutro);
      utrwalUstawienia(); odswiez();
      toast(`Przeniesiono na ${DNI_PELNE[dzienTygodnia(jutro)]}.`, { akcja: 'Cofnij', onAkcja: () => { Z.ustawienia.planyTygodni = przed; utrwalUstawienia(); odswiez(); } });
      return;
    }
    const u = e.target.closest('[data-usun-wpis]');
    if (u) {
      const przed = JSON.parse(JSON.stringify(Z.ustawienia.planyTygodni[pn] || []));
      usunZPlanu(pn, +u.dataset.usunWpis);
      utrwalUstawienia(); odswiez();
      toast('Usunięto z planu.', { akcja: 'Cofnij', onAkcja: () => { Z.ustawienia.planyTygodni[pn] = przed; utrwalUstawienia(); odswiez(); } });
      return;
    }
    if (e.target.closest('[data-zalegle]')) {
      const przed = JSON.parse(JSON.stringify(Z.ustawienia.planyTygodni));
      const ileP = przeniesNiezrobione(pn);
      utrwalUstawienia(); odswiez();
      toast(`Przeniesiono na dziś: ${ileP}.`, { akcja: 'Cofnij', onAkcja: () => { Z.ustawienia.planyTygodni = przed; utrwalUstawienia(); odswiez(); } });
      return;
    }
    if (e.target.closest('[data-do-przypomnien]')) {
      while (otwarte.length) otwarte[otwarte.length - 1].zamknij();
      idz('ustawienia');
      setTimeout(() => { const c = $('#f-przypomnienia'); if (c) window.scrollTo({ top: c.getBoundingClientRect().top + window.scrollY - 70 }); }, 400);
      return;
    }
    if (e.target.closest('[data-ics-tydzien]')) {
      const ok = await zapiszPlik(`zakladka-plan-${pn}.ics`, icsPlanuTygodnia(pn), 'text/calendar');
      if (ok) toast('Otwórz plik, żeby dodać plan do kalendarza z przypomnieniami.', { czas: 6000 });
    }
  });
}

/** Stały plan na jeden dzień: ukryj go tego dnia i dodaj zwykły wpis na inny dzień. */
function przeniesStaly(pn, rid, zDnia, naDzien) {
  const r = Z.ustawienia.stalePlany.find(x => x.rid === rid);
  if (!r) return;
  const lista = planTygodnia(pn);
  lista.push({ id: r.id, dzien: zDnia, strony: 0, minuty: 0, ukryty: rid });
  zapiszPlanTygodnia(pn, lista);
  if (naDzien) {
    const pn2 = poczatekTygodnia(naDzien), l2 = planTygodnia(pn2);
    l2.push({ id: r.id, dzien: naDzien, strony: r.strony, minuty: r.minuty });
    zapiszPlanTygodnia(pn2, l2);
  }
}

/* ---------- arkusz: jeden wpis planu (zmień cel, przenieś, kopiuj, usuń) ---------- */
function arkuszWpisuPlanu(pn, { i = null, staly = null, dzien = null }) {
  const r = staly ? Z.ustawienia.stalePlany.find(x => x.rid === staly) : null;
  const e = staly ? (r && { id: r.id, dzien, strony: r.strony, minuty: r.minuty }) : planTygodnia(pn).find(x => x.i === i);
  const k = e && znajdz(e.id);
  if (!k) return;
  const st = stanWpisuPelny({ ...e, k }, pn);
  const a = arkusz({
    tytul: 'Wpis w planie', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <div class="postep-ksiazka">${okladka(k, 's')}<span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span>
        <span class="wiersz-autor">${DNI_PELNE[dzienTygodnia(e.dzien)]}, ${dataKrotka(e.dzien)}${st.przecz ? ` · przeczytane ${st.przecz} str.` : ''}${staly ? ' · stały plan' : ''}</span></span></div>
      ${staly ? `<p class="podpowiedz">To wpis ze stałego planu. Zmiany tutaj dotyczą tylko tego dnia, a cały plan zmienisz w „Stałe plany”.</p>` : ''}
      <div class="f-rzad"><label>Stron<input name="strony" type="number" inputmode="numeric" min="0" value="${e.strony || ''}" placeholder="dowolnie"></label>
        <label>albo do strony<input name="doStrony" type="number" inputmode="numeric" min="1" max="${k.strony}" placeholder="${k.status === 'czytam' ? k.strona + (e.strony || 0) : ''}"></label></div>
      <label>Minut czytania (opcjonalnie)<input name="minuty" type="number" inputmode="numeric" min="0" value="${e.minuty || ''}" placeholder="np. 30"></label>
      <p class="podpowiedz">Wpis jest zrobiony, gdy przeczytasz tyle stron albo spędzisz tyle minut w sesji z tą książką.</p>
      <label>Przenieś na dzień<input name="data" type="date" value="${e.dzien}"></label>
      <div class="przyciski"><button type="button" class="btn btn-maly" data-kopiuj-reszta>Powtórz do końca tygodnia</button>
        ${!staly ? `<button type="button" class="btn btn-maly" data-zrob-staly>Zrób z tego stały plan</button>` : ''}</div>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn btn-ryzyko" data-usun>${staly ? 'Pomiń ten dzień' : 'Usuń'}</button>
        <button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Zapisz</button></div>
    </form>`
  });
  const f = $('form', a.tresc), v = n => f.elements.namedItem(n).value;
  const zastosuj = (fn, komunikat) => {
    const przed = JSON.parse(JSON.stringify({ p: Z.ustawienia.planyTygodni, s: Z.ustawienia.stalePlany }));
    fn();
    utrwalUstawienia(); a.zamknij(); odswiez();
    toast(komunikat, { akcja: 'Cofnij', onAkcja: () => { Z.ustawienia.planyTygodni = przed.p; Z.ustawienia.stalePlany = przed.s; utrwalUstawienia(); odswiez(); } });
  };
  const nowyCel = () => {
    let strony = Math.max(0, Math.round(+v('strony')) || 0);
    const doS = Math.round(+v('doStrony')) || 0;
    if (doS > 0) strony = Math.max(1, doS - (k.status === 'czytam' ? k.strona : 0));
    return { strony, minuty: Math.max(0, Math.round(+v('minuty')) || 0) };
  };
  f.addEventListener('submit', ev => {
    ev.preventDefault();
    const cel = nowyCel(), data = poprawnaData(v('data')) ? v('data') : e.dzien;
    zastosuj(() => {
      if (staly) { przeniesStaly(pn, staly, e.dzien, null); const pn2 = poczatekTygodnia(data), l = planTygodnia(pn2); l.push({ id: e.id, dzien: data, ...cel }); zapiszPlanTygodnia(pn2, l); }
      else {
        const lista = planTygodnia(pn).filter(x => x.i !== i);
        zapiszPlanTygodnia(pn, lista);
        const pn2 = poczatekTygodnia(data), l = planTygodnia(pn2);
        l.push({ id: e.id, dzien: data, ...cel });
        zapiszPlanTygodnia(pn2, l);
      }
    }, data !== e.dzien ? `Przeniesiono na ${DNI_PELNE[dzienTygodnia(data)]}, ${dataKrotka(data)}.` : 'Zapisano wpis.');
  });
  $('[data-usun]', f).addEventListener('click', () => zastosuj(() => {
    if (staly) przeniesStaly(pn, staly, e.dzien, null); else usunZPlanu(pn, i);
  }, staly ? 'Pominięto ten dzień.' : 'Usunięto wpis.'));
  $('[data-kopiuj-reszta]', f).addEventListener('click', () => {
    const cel = nowyCel(), nd = dodajDni(pn, 6);
    zastosuj(() => {
      const l = planTygodnia(pn);
      for (let d = dodajDni(e.dzien, 1); d <= nd; d = dodajDni(d, 1)) if (czasDnia(d) > 0 && !l.some(x => x.id === e.id && x.dzien === d && !x.ukryty)) l.push({ id: e.id, dzien: d, ...cel });
      zapiszPlanTygodnia(pn, l);
    }, 'Powtórzono do niedzieli (bez dni bez czytania).');
  });
  $('[data-zrob-staly]', f)?.addEventListener('click', () => { a.zamknij(); arkuszStalegoPlanu(null, { id: e.id, dzien: e.dzien, ...nowyCel() }); });
}

/* ---------- arkusz: stały plan ---------- */
function arkuszStalegoPlanu(rid = null, wstepne = {}) {
  const r = rid ? Z.ustawienia.stalePlany.find(x => x.rid === rid) : null;
  const dane = r || { id: wstepne.id || '', dni: wstepne.dzien ? [dzienTygodnia(wstepne.dzien)] : [0, 1, 2, 3, 4], strony: wstepne.strony || 0, minuty: wstepne.minuty || 0 };
  const kandydaci = [...czytane(), ...kolejka(), ...naPozniej()].filter(k => !k.bazowa);
  const a = arkusz({
    tytul: r ? 'Stały plan' : 'Nowy stały plan', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <label>Książka<select name="id" required>${kandydaci.map(k => `<option value="${k.id}"${k.id === dane.id ? ' selected' : ''}>${esc(k.tytul)}</option>`).join('')}</select></label>
      <fieldset class="segment segment-dni"><legend>W które dni</legend>${DNI_KR.map((d, i) => `<label class="seg"><input type="checkbox" name="dni" value="${i}"${dane.dni.includes(i) ? ' checked' : ''}><span>${d}</span></label>`).join('')}</fieldset>
      <div class="f-rzad"><label>Stron dziennie<input name="strony" type="number" inputmode="numeric" min="0" value="${dane.strony || ''}" placeholder="dowolnie"></label>
        <label>albo minut<input name="minuty" type="number" inputmode="numeric" min="0" value="${dane.minuty || ''}" placeholder="np. 30"></label></div>
      <p class="podpowiedz">Plan powtarza się co tydzień, aż skończysz książkę. Pojedynczy dzień możesz pominąć albo przenieść w planie tygodnia.</p>
      <div class="przyciski przyciski-koniec">${r ? '<button type="button" class="btn btn-ryzyko" data-usun-staly>Usuń plan</button>' : ''}
        <button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Zapisz</button></div>
    </form>`
  });
  const f = $('form', a.tresc);
  f.addEventListener('submit', ev => {
    ev.preventDefault();
    const nowy = { rid: r ? r.rid : noweId(), id: f.elements.id.value, dni: $$('[name="dni"]:checked', f).map(x => +x.value), strony: Math.max(0, Math.round(+f.elements.strony.value) || 0), minuty: Math.max(0, Math.round(+f.elements.minuty.value) || 0) };
    if (!nowy.dni.length) { toast('Wybierz co najmniej jeden dzień.', { typ: 'blad' }); return; }
    Z.ustawienia.stalePlany = [...Z.ustawienia.stalePlany.filter(x => x.rid !== nowy.rid), nowy];
    utrwalUstawienia(); a.zamknij(); odswiez();
    toast('Zapisano stały plan.');
  });
  $('[data-usun-staly]', f)?.addEventListener('click', () => {
    const przed = [...Z.ustawienia.stalePlany];
    Z.ustawienia.stalePlany = Z.ustawienia.stalePlany.filter(x => x.rid !== rid);
    utrwalUstawienia(); a.zamknij(); odswiez();
    toast('Usunięto stały plan.', { akcja: 'Cofnij', onAkcja: () => { Z.ustawienia.stalePlany = przed; utrwalUstawienia(); odswiez(); } });
  });
}

/* ---------- arkusz: mój czas na czytanie ---------- */
function arkuszCzasu() {
  const c = Z.ustawienia.czasDni;
  const a = arkusz({
    tytul: 'Twój czas na czytanie', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <p class="cichy">Ile minut możesz zwykle czytać w każdy dzień? Plan rozłoży strony według tego czasu. 0 = dzień bez czytania.</p>
      <ul class="czas-dni">${DNI_PELNE.map((d, i) => `<li><span>${d}</span><input name="d${i}" type="number" inputmode="numeric" min="0" max="600" step="5" value="${c[i]}"><span class="cichy">min</span></li>`).join('')}</ul>
      <div class="szybkie">${[[15, '15 min'], [30, '30 min'], [45, '45 min'], [60, '1 h']].map(([v, n]) => `<button type="button" class="chip" data-wszystkie="${v}">wszystkie ${n}</button>`).join('')}</div>
      <p class="podpowiedz">Twoje tempo: ${Math.round(tempoPlanu())} stron na godzinę${tempoOgolne() ? ' (z sesji czytania)' : ' (zakładane, zmieni się po kilku sesjach ze stoperem)'}.</p>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Zapisz</button></div>
    </form>`
  });
  const f = $('form', a.tresc);
  f.addEventListener('click', e => { const b = e.target.closest('[data-wszystkie]'); if (b) for (let i = 0; i < 7; i++) f.elements[`d${i}`].value = b.dataset.wszystkie; });
  f.addEventListener('submit', e => {
    e.preventDefault();
    Z.ustawienia.czasDni = Array.from({ length: 7 }, (_, i) => ogranicz(Math.round(+f.elements[`d${i}`].value) || 0, 0, 600));
    utrwalUstawienia(); a.zamknij(); odswiez();
    toast('Zapisano twój czas na czytanie.');
  });
}

/* ---------- kreator tygodnia (2.8): cel książek, dobór, kolejność, czas, podgląd na żywo ---------- */
const KOLORY_PLANU = ['#1f4a3d', '#a3233a', '#a77a2b', '#22385c', '#4a2f52', '#24555a', '#7a5218', '#38474f'];

function arkuszKreatora(pn = poczatekTygodnia()) {
  const dzis = dzisISO(), nd = dodajDni(pn, 6);
  const od = pn > dzis ? pn : dzis;
  if (od > nd) { toast('Ten tydzień już minął. Zaplanuj następny.'); return; }
  const wczesniej = [...new Set(planTygodnia(pn).filter(e => !e.ukryty).map(e => e.id))].filter(id => { const k = znajdz(id); return k && zostaloStron(k) > 0 && !k.bazowa && !czyTechniczna(k); });
  const st = {
    cel: Z.ustawienia.celeTygodni[pn] || Math.max(wczesniej.length, 3),
    wybrane: [...wczesniej],
    czasy: czasyTygodnia(pn),
    tryb: Z.ustawienia.trybRozkladu,
    krotsze: false, picker: false, filtr: '', limit: !!Z.ustawienia.planujWCzasie
  };
  if (!st.wybrane.length) st.wybrane = dobierzKsiazki(st.cel).map(k => k.id);
  const kolor = id => KOLORY_PLANU[st.wybrane.indexOf(id) % KOLORY_PLANU.length];
  const dniTyg = Array.from({ length: 7 }, (_, i) => dodajDni(pn, i));
  const r = () => obliczRozklad(pn, st.wybrane, { od, tryb: st.tryb, czasy: st.czasy, limit: st.limit });

  const htmlKsiazek = w => st.wybrane.length ? `<ol class="kr-lista">${st.wybrane.map((id, i) => {
    const k = znajdz(id);
    if (!k) return '';
    const kon = w.koniec[id];
    return `<li class="kr-ksiazka" style="--kol:${kolor(id)}">
      <span class="kr-nr">${i + 1}</span>
      <span class="tyg-mini-okl">${okladka(k, 's')}</span>
      <span class="kr-tekst"><span class="kr-tytul">${esc(k.tytul)}</span>
        <span class="kr-opis">${k.status === 'czytam' ? `czytasz, zostało ${zostaloStron(k)} str.` : `${zostaloStron(k)} str.`}${kon ? ` · <strong>skończysz: ${DNI_KR[dzienTygodnia(kon)]}</strong>` : w.czesc && w.czesc[id] ? ` · <em>w tym tygodniu ${w.czesc[id]} str.</em>` : st.wybrane.length && w.strony ? ' · <em>nie zmieści się</em>' : ''}</span></span>
      ${st.tryb === 'kolejno' ? `<span class="kr-strzalki"><button type="button" class="btn-ikona maly" data-gora="${i}" aria-label="Wyżej"${i ? '' : ' disabled'}>${I.gora}</button><button type="button" class="btn-ikona maly" data-dol="${i}" aria-label="Niżej"${i < st.wybrane.length - 1 ? '' : ' disabled'}>${I.dol}</button></span>` : ''}
      <button type="button" class="btn-ikona maly" data-usun-kr="${id}" aria-label="Usuń z planu">${I.zamknij}</button>
    </li>`;
  }).join('')}</ol>` : '<p class="cichy">Nie wybrałeś jeszcze książek. Kliknij „Dobierz za mnie” albo dodaj je z listy.</p>';

  const htmlPodgladu = w => {
    if (!st.wybrane.length) return '';
    const maxS = Math.max(1, ...w.naDzien.map(x => x.strony + (x.baz || 0)), ...w.naDzien.map(x => stronZMinut(x.min)));
    const wiersze = dniTyg.map(d => {
      const x = w.naDzien.find(y => y.d === d);
      const min = st.czasy[dzienTygodnia(d)] || 0;
      if (!x) return `<li class="kr-dzien minal"><span class="kr-dzien-n">${DNI_KR[dzienTygodnia(d)]}</span><span class="kr-pasek"></span><span class="kr-dzien-l">minął</span></li>`;
      const czesci = w.wpisy.filter(e => e.dzien === d);
      const poj = stronZMinut(min);
      return `<li class="kr-dzien${!min && !w.bezCzasu ? ' wolny' : ''}"><span class="kr-dzien-n">${DNI_KR[dzienTygodnia(d)]}</span>
        <span class="kr-pasek">${x.baz ? `<span class="kr-seg-baz" style="width:${(x.baz / maxS * 100).toFixed(1)}%" title="Książka bazowa: ${x.baz} str."></span>` : ''}${czesci.map(e => `<span style="width:${(e.strony / maxS * 100).toFixed(1)}%;background:${kolor(e.id)}" title="${esc(znajdz(e.id).tytul)}: ${e.strony} str."></span>`).join('')}
          ${poj && !w.bezCzasu ? `<i class="kr-poj" style="left:${Math.min(100, poj / maxS * 100).toFixed(1)}%" title="Twój czas: ${poj} str."></i>` : ''}</span>
        <span class="kr-dzien-l">${x.strony ? `${x.strony} str.` : !min && !w.bezCzasu ? 'wolne' : '—'}${x.strony ? `<small>${czasTekst(minutZeStron(x.strony))}</small>` : x.baz ? '<small>tylko bazowa</small>' : ''}</span></li>`;
    }).join('');
    const skonczone = Object.keys(w.koniec).length;
    const ocena = w.bezCzasu ? `<p class="kr-ocena cichy">Nie ustawiłeś czasu na czytanie, więc dzielę równo na dni.</p>`
      : w.za_duzo && st.limit ? `<div class="kr-ocena"><p><strong>Plan w twoim czasie:</strong> zaplanowane ${ile(w.zaplanowane, FORMY_STRON)} z ${w.strony}. Skończysz ${skonczone} z ${st.wybrane.length} książek, reszta przejdzie na kolejny tydzień.</p>
          <div class="przyciski"><button type="button" class="btn btn-maly" data-dopasuj-czas>Chcę skończyć wszystkie: ${w.minutDziennie} min dziennie</button></div></div>`
      : w.za_duzo ? `<div class="kr-ocena zle"><p><strong>Za mało czasu.</strong> Ten plan to ok. ${czasTekst(w.potrzebaMin)} czytania, a masz ${czasTekst(w.maszMin)}${w.baz && w.baz.min ? ' (po odjęciu bazowej)' : ''}. Potrzebujesz ok. <strong>${w.minutDziennie} min dziennie</strong>.</p>
          <div class="przyciski"><button type="button" class="btn btn-maly" data-dopasuj-czas>Dodaj czas: ${w.minutDziennie} min dziennie${w.baz && w.baz.min ? ' + bazowa' : ''}</button><button type="button" class="btn btn-maly" data-tylko-czas>Planuj tylko w moim czasie</button>${st.wybrane.length > 1 ? '<button type="button" class="btn btn-maly" data-zamien-krotsze>Wybierz krótsze</button>' : ''}</div></div>`
      : `<p class="kr-ocena ok"><strong>Zmieścisz się.</strong> ok. ${czasTekst(w.potrzebaMin)} z ${czasTekst(w.maszMin)}${w.baz && w.baz.min ? ' wolnego po bazowej' : ''} (${Math.round(w.potrzebaMin / w.maszMin * 100)}% czasu).</p>`;
    return `<ol class="kr-dni">${wiersze}</ol>
      ${w.baz && w.baz.strony ? `<p class="kr-baz"><span class="tyg-bazowa">B</span><span>Książka bazowa „${esc(w.baz.k.tytul)}”: ${ile(w.baz.strony, FORMY_STRON)} w tym tygodniu (ok. ${ile(planBazowej(w.baz.k).norma, FORMY_STRON)} dziennie, do ${dataDluga(w.baz.k.celData, false)}). Liczę ją automatycznie i rezerwuję na nią ${czasTekst(w.baz.min)} z twojego czasu.</span></p>` : ''}
      ${w.bazowaZjada ? '<p class="kr-ocena zle"><strong>Cały twój czas zajmuje książka bazowa.</strong> Dodaj minut w dni czytania, żeby zmieściły się inne książki.</p>' : ''}
      <p class="kr-suma">${w.limit && w.zaplanowane < w.strony ? `${w.zaplanowane} z ${ile(w.strony, FORMY_STRON_D)}` : ile(w.strony, FORMY_STRON)} · ${skonczone} z ${st.wybrane.length} książek do końca tygodnia${st.cel ? ` · cel ${st.cel}` : ''}</p>
      ${ocena}
      <p class="legenda kr-legenda">${w.baz && w.baz.strony ? '<span><i class="kr-seg-baz"></i>bazowa</span>' : ''}${st.wybrane.map(id => `<span><i style="background:${kolor(id)}"></i>${esc(znajdz(id).tytul)}</span>`).join('')}${w.bezCzasu ? '' : '<span><i class="kr-poj-leg"></i>twój czas</span>'}</p>`;
  };

  const htmlPickera = () => {
    const q = st.filtr.trim().toLowerCase();
    const kand = [...czytane(), ...kolejka(), ...naPozniej()].filter(k => !st.wybrane.includes(k.id) && zostaloStron(k) > 0 && !k.bazowa)
      .filter(k => !q || `${k.tytul} ${k.autor} ${k.tagi.join(' ')}`.toLowerCase().includes(q));
    return `<label class="pole-szukaj">${I.szukaj}<input type="search" data-filtr-kr placeholder="Szukaj w swoich książkach" value="${esc(st.filtr)}"></label>
      <ul class="kr-picker">${kand.slice(0, 40).map(k => `<li><button type="button" class="kr-dodaj" data-dodaj-kr="${k.id}">${okladka(k, 's')}
        <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">${k.status === 'czytam' ? 'czytasz, ' : k.status === 'pozniej' ? 'na później, ' : ''}${zostaloStron(k)} str. ≈ ${czasTekst(minutZeStron(zostaloStron(k)))}</span></span>${I.plus}</button></li>`).join('') || '<li class="cichy">Brak pasujących książek.</li>'}</ul>`;
  };

  const a = arkusz({
    tytul: `Zaplanuj tydzień ${zakresTyg(pn)}`, klasa: 'arkusz-kreator',
    render: () => {
      const w = r();
      return `<section class="kr-sekcja"><h3>Ile książek chcesz przeczytać w tym tygodniu?</h3>
        <div class="kr-cel" role="group" aria-label="Cel książek">${[1, 2, 3, 4, 5, 6].map(n => `<button type="button" class="kr-cel-btn${st.cel === n ? ' wybrany' : ''}" data-cel="${n}">${n}</button>`).join('')}</div>
        ${st.wybrane.length < st.cel ? `<p class="cichy">Wybrane: ${st.wybrane.length} z ${st.cel}. <button type="button" class="btn-tekst" data-dobierz>Dobierz brakujące</button></p>` : ''}
      </section>
      <section class="kr-sekcja"><div class="sekcja-gora"><h3>Książki ${st.tryb === 'kolejno' ? '<small>w kolejności czytania</small>' : ''}</h3>
        <span class="sekcja-akcje"><button type="button" class="btn btn-maly" data-dobierz-wszystko>${I.kostka}Dobierz za mnie</button></span></div>
        <label class="przelacznik maly"><input type="checkbox" data-krotsze${st.krotsze ? ' checked' : ''}><span>Przy doborze wybieraj krótsze książki, żeby łatwiej dobić do celu</span></label>
        <div class="kr-ksiazki">${htmlKsiazek(w)}</div>
        <button type="button" class="btn-tekst kr-pokaz-picker" data-picker>${st.picker ? 'Schowaj listę' : `${I.plus}Dodaj z moich książek`}</button>
        ${st.picker ? `<div class="kr-picker-box">${htmlPickera()}</div>` : ''}
      </section>
      <section class="kr-sekcja"><div class="sekcja-gora"><h3>Twój czas w tym tygodniu</h3><button type="button" class="btn-tekst" data-czas-zwykly>Jak zwykle</button></div>
        <div class="kr-czasy">${dniTyg.map((d, i) => `<label class="kr-czas${d < od ? ' minal' : ''}${!st.czasy[i] ? ' zero' : ''}"><span>${DNI_KR[i]}</span>
          <input type="number" inputmode="numeric" min="0" max="600" step="5" data-czas="${i}" value="${st.czasy[i]}"${d < od ? ' disabled' : ''} aria-label="${DNI_PELNE[i]}, minut"><small>min</small></label>`).join('')}</div>
        <label class="przelacznik maly"><input type="checkbox" data-limit${st.limit ? ' checked' : ''}><span>Planuj tylko tyle, ile zdążę w tym czasie</span></label>
        <label class="kr-tempo">Twoje tempo<input type="number" inputmode="numeric" min="5" max="300" data-tempo value="${Math.round(tempoPlanu())}"><span>stron na godzinę</span></label>
        <p class="podpowiedz">Minuty czytania w każdy dzień, 0 = dzień wolny. Zmiana dotyczy tylko tego tygodnia. ${tempoOgolne() ? `Tempo z twoich sesji: ${Math.round(tempoOgolne())} str./h.` : 'Zmierz tempo sesją ze stoperem albo wpisz je sam.'}</p>
      </section>
      <section class="kr-sekcja"><h3>Jak czytać</h3>
        <fieldset class="segment"><legend class="sr">Tryb</legend>${radio('tryb-kr', 'kolejno', 'Jedna po drugiej', st.tryb === 'kolejno')}${radio('tryb-kr', 'rownolegle', 'Wszystkie naraz', st.tryb === 'rownolegle')}</fieldset>
        <p class="podpowiedz">${st.tryb === 'kolejno' ? 'Kończysz jedną książkę, potem bierzesz następną. Najlepsze, gdy chcesz skończyć 3–4 książki w tygodniu.' : 'Codziennie trochu z każdej. Wszystkie skończysz pod koniec tygodnia.'}</p>
      </section>
      <section class="kr-sekcja kr-podglad-box"><h3>Podgląd ${od > pn ? `<small>od ${DNI_PELNE[dzienTygodnia(od)]}</small>` : ''}</h3><div class="kr-podglad">${htmlPodgladu(w)}</div></section>
      <div class="przyciski przyciski-koniec kr-dol"><button type="button" class="btn" data-zamknij>Anuluj</button>
        <button type="button" class="btn btn-glowny" data-zapisz-kr${st.wybrane.length ? '' : ' disabled'}>Zapisz plan tygodnia</button></div>`;
    }
  });
  const odswiezCzesci = () => {
    const w = r();
    const ks = $('.kr-ksiazki', a.tresc), pg = $('.kr-podglad', a.tresc);
    if (ks) ks.innerHTML = htmlKsiazek(w);
    if (pg) pg.innerHTML = htmlPodgladu(w);
  };
  const przerysuj = () => { const y = a.el.scrollTop; a.rysuj(); a.el.scrollTop = y; };

  a.tresc.addEventListener('input', e => {
    if (e.target.dataset.czas != null) {
      st.czasy[+e.target.dataset.czas] = ogranicz(Math.round(+e.target.value) || 0, 0, 600);
      e.target.closest('.kr-czas').classList.toggle('zero', !st.czasy[+e.target.dataset.czas]);
      odswiezCzesci();
    }
    if (e.target.dataset.tempo != null && +e.target.value >= 5) {
      Z.ustawienia.tempoReczne = ogranicz(Math.round(+e.target.value), 5, 300);
      odswiezCzesci();
    }
    if (e.target.dataset.filtrKr != null) {
      st.filtr = e.target.value;
      const box = $('.kr-picker', a.tresc);
      if (box) box.outerHTML = htmlPickera().replace(/^[\s\S]*?(<ul class="kr-picker">)/, '$1');
    }
  });
  a.tresc.addEventListener('change', e => {
    if (e.target.name === 'tryb-kr') { st.tryb = e.target.value; przerysuj(); }
    if (e.target.dataset.krotsze != null) { st.krotsze = e.target.checked; }
    if (e.target.dataset.limit != null) { st.limit = e.target.checked; odswiezCzesci(); }
  });
  a.tresc.addEventListener('click', e => {
    const t = e.target;
    const c = t.closest('[data-cel]');
    if (c) {
      st.cel = +c.dataset.cel;
      if (st.wybrane.length < st.cel) st.wybrane.push(...dobierzKsiazki(st.cel - st.wybrane.length, { krotsze: st.krotsze, pomin: st.wybrane }).map(k => k.id));
      przerysuj(); return;
    }
    if (t.closest('[data-dobierz]')) { st.wybrane.push(...dobierzKsiazki(st.cel - st.wybrane.length, { krotsze: st.krotsze, pomin: st.wybrane }).map(k => k.id)); przerysuj(); return; }
    if (t.closest('[data-dobierz-wszystko]')) {
      st.wybrane = dobierzKsiazki(st.cel, { krotsze: st.krotsze }).map(k => k.id);
      if (!st.wybrane.length) toast('Dodaj książki do listy do przeczytania, żeby było z czego dobierać.');
      przerysuj(); return;
    }
    if (t.closest('[data-zamien-krotsze]')) {
      st.krotsze = true;
      const czyt = st.wybrane.filter(id => znajdz(id).status === 'czytam');
      st.wybrane = [...czyt, ...dobierzKsiazki(st.cel, { krotsze: true, pomin: czyt }).filter(k => k.status !== 'czytam').map(k => k.id)].slice(0, Math.max(st.cel, czyt.length));
      przerysuj(); return;
    }
    if (t.closest('[data-tylko-czas]')) { st.limit = true; przerysuj(); return; }
    if (t.closest('[data-dopasuj-czas]')) {
      st.limit = false;
      const w = r();
      const rez = d => { const b = bazowa(); return b ? minutZeStron(normaBazowejDnia(b, d)) : 0; };
      dniTyg.forEach((d, i) => { if (d >= od && st.czasy[i] > 0) st.czasy[i] = Math.max(st.czasy[i], Math.ceil((w.minutDziennie + rez(d)) / 5) * 5); });
      if (!dniTyg.some((d, i) => d >= od && st.czasy[i] > 0)) dniTyg.forEach((d, i) => { if (d >= od) st.czasy[i] = Math.ceil(w.minutDziennie / 5) * 5; });
      przerysuj(); return;
    }
    if (t.closest('[data-czas-zwykly]')) { st.czasy = Z.ustawienia.czasDni.slice(); przerysuj(); return; }
    if (t.closest('[data-picker]')) { st.picker = !st.picker; przerysuj(); return; }
    const d = t.closest('[data-dodaj-kr]');
    if (d) { st.wybrane.push(d.dataset.dodajKr); przerysuj(); return; }
    const u = t.closest('[data-usun-kr]');
    if (u) { st.wybrane = st.wybrane.filter(x => x !== u.dataset.usunKr); przerysuj(); return; }
    const g = t.closest('[data-gora]'), dl = t.closest('[data-dol]');
    if (g || dl) {
      const i = +(g ? g.dataset.gora : dl.dataset.dol), j = g ? i - 1 : i + 1;
      [st.wybrane[i], st.wybrane[j]] = [st.wybrane[j], st.wybrane[i]];
      przerysuj(); return;
    }
    if (t.closest('[data-zapisz-kr]')) {
      const przed = JSON.parse(JSON.stringify({ p: Z.ustawienia.planyTygodni, c: Z.ustawienia.czasTygodni, g: Z.ustawienia.celeTygodni, t: Z.ustawienia.trybRozkladu }));
      // książki usunięte w kreatorze znikają z planu od dziś
      const usuniete = wczesniej.filter(id => !st.wybrane.includes(id));
      zapiszPlanTygodnia(pn, planTygodnia(pn).filter(e => !(usuniete.includes(e.id) && (!e.dzien || e.dzien >= od))));
      // stara kolejność wpisów „na tydzień” → nowa, zgodnie z kreatorem
      zapiszPlanTygodnia(pn, [...planTygodnia(pn).filter(e => e.dzien || e.ukryty || !st.wybrane.includes(e.id)), ...st.wybrane.map(id => ({ id, dzien: null, strony: 0, minuty: 0 }))]);
      Z.ustawienia.trybRozkladu = st.tryb;
      Z.ustawienia.celeTygodni[pn] = st.cel;
      Z.ustawienia.planujWCzasie = st.limit;
      Z.ustawienia = normalizujUstawienia(Z.ustawienia);
      const w = rozlozPlan(pn, st.wybrane, od, st.tryb, st.czasy, st.limit);
      utrwalUstawienia(); a.zamknij(); odswiez();
      toast(`Plan gotowy: ${ile(st.wybrane.length, FORMY_KSIAZEK)}, ${ile(w.strony || 0, FORMY_STRON)}.`, { czas: 5000, akcja: 'Cofnij', onAkcja: () => {
        Object.assign(Z.ustawienia, { planyTygodni: przed.p, czasTygodni: przed.c, celeTygodni: przed.g, trybRozkladu: przed.t });
        utrwalUstawienia(); odswiez();
      } });
      if (!otwarte.some(x => x.el.classList.contains('arkusz-tydzien'))) arkuszTygodnia(pn);
    }
  });
}
// stara nazwa z 2.7 prowadzi teraz do kreatora
function arkuszRozkladu(pn) { arkuszKreatora(pn); }

function arkuszDodajDoTygodnia(pn, dzien = null) {
  const kandydaci = [...czytane(), ...kolejka(), ...naPozniej()].filter(k => !k.bazowa);
  const w = new Set(planTygodnia(pn).filter(e => (e.dzien || null) === dzien && !e.ukryty).map(e => e.id));
  const a = arkusz({
    tytul: dzien ? `Plan: ${DNI_PELNE[dzienTygodnia(dzien)]}, ${dataKrotka(dzien)}` : 'Co czytasz w tym tygodniu?', klasa: 'arkusz-maly',
    render: () => kandydaci.length ? `<p class="cichy">${dzien ? `Zaznacz książki na ten dzień i wpisz, ile stron. Twój czas tego dnia: ${czasTekst(czasDnia(dzien))} ≈ ${stronZMinut(czasDnia(dzien))} str.` : 'Zaznacz książki, które chcesz przeczytać albo ruszyć w tym tygodniu.'}</p>
      <div class="przyciski"><button type="button" class="btn btn-maly" data-losuj-tydz>${I.kostka}Wylosuj coś z kolejki</button></div>
      <ul class="plan-lista">${kandydaci.map(k => `<li><label class="plan-wybor${w.has(k.id) ? ' wybrana' : ''}"><input type="checkbox" data-wybor="${k.id}"${w.has(k.id) ? ' checked' : ''}>
        ${okladka(k, 's')}<span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span>
        <span class="wiersz-autor">${k.status === 'czytam' ? `czytasz, zostało ${ile(zostaloStron(k), FORMY_STRON)}` : k.status === 'pozniej' ? `na później, ${ile(zostaloStron(k), FORMY_STRON)}` : ile(k.strony, FORMY_STRON)}</span></span>
        ${dzien ? `<input type="number" class="plan-strony" inputmode="numeric" min="0" data-strony="${k.id}" value="${(planTygodnia(pn).find(e => e.id === k.id && e.dzien === dzien && !e.ukryty) || {}).strony || ''}" placeholder="str." aria-label="Stron">` : ''}</label></li>`).join('')}</ul>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Anuluj</button><button type="button" class="btn btn-glowny" data-zapisz-tydz>Zapisz plan</button></div>`
      : '<p class="pusto">Dodaj książki do listy „Do przeczytania”, żeby je zaplanować.</p>'
  });
  a.tresc.addEventListener('change', e => {
    if (e.target.dataset.wybor) e.target.closest('.plan-wybor').classList.toggle('wybrana', e.target.checked);
    if (e.target.dataset.strony && +e.target.value > 0) { const cb = $(`[data-wybor="${e.target.dataset.strony}"]`, a.tresc); cb.checked = true; cb.closest('.plan-wybor').classList.add('wybrana'); }
  });
  a.tresc.addEventListener('click', e => {
    if (e.target.closest('[data-losuj-tydz]')) {
      const wolne = kolejka().filter(k => !$(`[data-wybor="${k.id}"]`, a.tresc)?.checked);
      const k = losujWazone(wolne, x => wagaLosowania(x));
      if (!k) { toast('Nie ma już czego losować.'); return; }
      const cb = $(`[data-wybor="${k.id}"]`, a.tresc);
      cb.checked = true; cb.closest('.plan-wybor').classList.add('wybrana');
      cb.closest('li').scrollIntoView({ block: 'center', behavior: 'smooth' });
      toast(`Wylosowano: „${k.tytul}”.`);
    }
    if (e.target.closest('[data-zapisz-tydz]')) {
      const lista = planTygodnia(pn).filter(x => (x.dzien || null) !== dzien || x.ukryty);
      for (const cb of $$('[data-wybor]', a.tresc)) if (cb.checked) {
        const s = dzien ? Math.max(0, Math.round(+$(`[data-strony="${cb.dataset.wybor}"]`, a.tresc).value) || 0) : 0;
        lista.push({ id: cb.dataset.wybor, dzien, strony: s, minuty: 0 });
      }
      zapiszPlanTygodnia(pn, lista);
      utrwalUstawienia();
      a.zamknij(); odswiez();
      toast(dzien ? 'Zapisano plan dnia.' : 'Zapisano. Teraz rozłóż książki na dni.', dzien ? {} : { akcja: 'Rozłóż', onAkcja: () => arkuszKreatora(pn) });
    }
  });
}

function blokPlanuDnia() {
  const dzis = dzisISO(), wpisy = planDnia(dzis);
  const tydz = planTygodnia().filter(e => !e.dzien && !e.ukryty);
  if (!wpisy.length && !tydz.length) {
    return `<section class="sekcja plan-dnia pusty"><div class="sekcja-gora"><h2>Plan tygodnia</h2><button type="button" class="btn btn-maly btn-glowny" data-akcja="kreator">${I.kalendarz}Zaplanuj tydzień</button></div>
      <p class="cichy">Ustal, ile książek chcesz przeczytać w tym tygodniu (np. 3–4). Dobiorę je i rozłożę strony na dni według twojego czasu.</p></section>`;
  }
  const zrobione = wpisy.filter(e => e.zrobione).length;
  const suma = wpisy.reduce((s, e) => s + (e.strony || 0), 0);
  return `<section class="sekcja plan-dnia">
    <div class="sekcja-gora"><h2>Plan na dziś</h2><button type="button" class="btn-tekst" data-akcja="tydzien">${I.kalendarz}Cały tydzień</button></div>
    ${wpisy.length ? `<ul class="plan-dnia-lista">${wpisy.map(e => `<li class="${e.zrobione ? 'zrobione' : ''}">
      <span class="tyg-znak">${e.zrobione ? I.check : ''}</span>
      <span class="tyg-mini-okl">${okladka(e.k, 's')}</span>
      <button type="button" class="btn-tekst tyg-ksiazka" data-akcja="${e.k.status === 'czytam' ? 'postep' : 'ksiazka'}" data-id="${e.k.id}">${e.auto ? '<span class="tyg-bazowa" title="Książka bazowa: norma liczona automatycznie">B</span>' : ''}${e.staly ? '<span class="tyg-staly">↻</span>' : ''}${esc(e.k.tytul)}</button>
      <span class="tyg-str">${e.strony ? `${e.przecz}/${e.strony} str.` : e.minuty ? `${e.minPrzecz || 0}/${e.minuty} min` : e.przecz ? `+${e.przecz} str.` : ''}</span>
      ${!e.zrobione && e.k.status === 'czytam' ? `<button type="button" class="btn-ikona maly" data-akcja="sesja" data-id="${e.k.id}" aria-label="Sesja czytania">${I.zegar}</button>` : ''}
      ${!e.zrobione && e.k.status !== 'czytam' ? `<button type="button" class="btn btn-maly" data-akcja="zacznij" data-id="${e.k.id}">Zacznij</button>` : ''}</li>`).join('')}</ul>
      <p class="cichy">${zrobione === wpisy.length ? 'Plan na dziś zrobiony.' : `Zrobione ${zrobione} z ${wpisy.length}${suma ? `, razem ${ile(suma, FORMY_STRON)}` : ''}.`}</p>`
      : `<p class="cichy">Na dziś nic nie rozplanowane. W tym tygodniu: ${tydz.map(e => `„${esc(e.k.tytul)}”`).join(', ')}. <button type="button" class="btn-tekst" data-akcja="kreator">Rozłóż na dni</button></p>`}
  </section>`;
}

/* ================= passa (2.7) ================= */
function arkuszSerii() {
  const a = arkusz({
    tytul: 'Twoja passa', klasa: 'arkusz-maly arkusz-passa', odswiezalny: true,
    render: () => {
      const m = mapaDni(), s = seriaSzczegoly(m), u = Z.ustawienia.seria, naj = najdluzszaSeria(m);
      const dzis = dzisISO(), start = dodajDni(poczatekTygodnia(dzis), -28);
      const zam = new Set(s.zamrozone);
      let siatka = '';
      for (let i = 0; i < 35; i++) {
        const d = dodajDni(start, i), r = rodzajDnia(d, m, u);
        const kl = d > dzis ? 'przyszly' : r === 'czytal' ? 'czytal' : zam.has(d) ? 'zamrozony' : r === 'wolny' ? 'wolny' : d === dzis ? 'dzis-brak' : 'brak';
        siatka += `<span class="passa-dzien ${kl}${d === dzis ? ' dzis' : ''}" title="${dataKrotka(d)}: ${m.get(d) || 0} str.">${+d.slice(8)}</span>`;
      }
      return `<div class="passa-gora"><span class="passa-plomien">${I.plomien}</span><p class="passa-liczba">${s.dni}</p><p>${odmiana(s.dni, FORMY_DNI)} z rzędu</p></div>
        <p class="cichy passa-stan">${s.dzisZrobione ? 'Dzisiejszy dzień zaliczony.' : s.dzisWolny ? 'Dziś masz dzień wolny: passa się nie przerwie.' : `Dziś przeczytaj co najmniej ${ile(u.prog, FORMY_STRON_D)}, żeby passa trwała.`}
          Rekord: ${ile(naj, FORMY_DNI)}.${u.zamrozenia ? ` Zamrożenia w tym miesiącu: zostało ${s.zamrozeniaZostalo} z ${u.zamrozenia}.` : ''}</p>
        ${u.cel ? `<div class="cel-wiersz"><p class="cel-wiersz-gora"><span>Cel passy</span><span><strong>${Math.min(s.dni, u.cel)}</strong> z ${ile(u.cel, FORMY_DNI)}</span></p>${pasek(Math.min(100, s.dni / u.cel * 100))}</div>` : ''}
        <div class="passa-siatka">${DNI_KR.map(d => `<span class="kal-naglowek">${d}</span>`).join('')}${siatka}</div>
        <p class="legenda passa-legenda"><span class="passa-dzien czytal">1</span> czytanie <span class="passa-dzien wolny">1</span> dzień wolny <span class="passa-dzien zamrozony">1</span> zamrożenie <span class="passa-dzien brak">1</span> przerwa</p>
        <form class="formularz passa-ustawienia" novalidate><h3>Zasady passy</h3>
          <div class="f-rzad"><label>Minimum stron dziennie<input name="prog" type="number" inputmode="numeric" min="1" value="${u.prog}"></label>
            <label>Cel passy (dni)<input name="cel" type="number" inputmode="numeric" min="0" value="${u.cel || ''}" placeholder="np. 30"></label></div>
          <fieldset class="segment segment-dni"><legend>Dni wolne (nie przerywają passy)</legend>${DNI_KR.map((d, i) => `<label class="seg"><input type="checkbox" name="wolne" value="${i}"${u.dniWolne.includes(i) ? ' checked' : ''}><span>${d}</span></label>`).join('')}</fieldset>
          <label>Zamrożenia na miesiąc<input name="zamrozenia" type="number" inputmode="numeric" min="0" max="10" value="${u.zamrozenia}"></label>
          <p class="podpowiedz">Zamrożenie ratuje passę, gdy zapomnisz o jednym dniu. Zużywa się samo, do podanej liczby w każdym miesiącu.</p>
          <div class="przyciski przyciski-koniec"><button type="submit" class="btn btn-glowny">Zapisz zasady</button></div></form>`;
    }
  });
  a.tresc.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    Z.ustawienia = normalizujUstawienia({ ...Z.ustawienia, seria: { prog: f.elements.prog.value, cel: f.elements.cel.value, zamrozenia: f.elements.zamrozenia.value, dniWolne: $$('[name="wolne"]:checked', f).map(x => +x.value) } });
    utrwalUstawienia(); odswiez();
    toast('Zapisano zasady passy.');
  });
}

/* ================= lista życzeń i na później (2.7) ================= */
/* ================= kalendarz z okładkami (2.7) ================= */
function okladkiDni(od, doDnia) {
  const naj = {};
  for (const k of Z.ksiazki) for (const w of k.log) if (w.data >= od && w.data <= doDnia && (!naj[w.data] || w.strony > naj[w.data].s)) naj[w.data] = { k, s: w.strony };
  return naj;
}

/* ================= przypomnienia (2.6) ================= */
function htmlPrzypomnien() {
  const p = Z.ustawienia.przypomnienie;
  const wsparcie = 'Notification' in window && 'serviceWorker' in navigator;
  const zgoda = wsparcie ? Notification.permission : 'brak';
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return `<form id="f-przypomnienia" class="formularz grupa" novalidate>
    <h2>Przypomnienia</h2>
    <label class="przelacznik"><input type="checkbox" name="wlaczone"${p.wlaczone ? ' checked' : ''}><span>Przypominaj o czytaniu</span></label>
    <div class="f-rzad"><label>Godzina<input name="godzina" type="time" value="${p.godzina}"></label><span></span></div>
    <fieldset class="segment segment-dni"><legend>W które dni</legend>${DNI_KR.map((d, i) => `<label class="seg"><input type="checkbox" name="dni" value="${i}"${p.dni.includes(i) ? ' checked' : ''}><span>${d}</span></label>`).join('')}</fieldset>
    <p class="podpowiedz">Przypomnienie przyjdzie tylko w dni, w które nie zrobiłeś jeszcze dziennego celu. Pokaże też plan na dziś.</p>
    <div class="przyciski"><button type="submit" class="btn btn-glowny">Zapisz</button>
      ${wsparcie && zgoda !== 'granted' ? `<button type="button" class="btn" data-akcja="powiadomienia-zgoda">${I.dzwonek}Zezwól na powiadomienia</button>` : ''}
      ${wsparcie && zgoda === 'granted' ? `<button type="button" class="btn" data-akcja="powiadomienie-test">${I.dzwonek}Wyślij próbne</button>` : ''}</div>
    <p class="cichy stan-powiadomien">${!wsparcie ? (ios && !standalone ? 'Na iPhonie powiadomienia działają po dodaniu Zakładki do ekranu początkowego (Udostępnij → Do ekranu początkowego).' : 'Ta przeglądarka nie obsługuje powiadomień.')
      : zgoda === 'granted' ? 'Powiadomienia są włączone.' : zgoda === 'denied' ? 'Powiadomienia są zablokowane. Włącz je w ustawieniach przeglądarki dla tej strony.' : 'Powiadomienia nie są jeszcze włączone.'}</p>
    <div class="rada-zrodla"><p><strong>Najpewniejszy sposób:</strong> przypomnienie w kalendarzu telefonu. Działa zawsze, nawet gdy aplikacja jest zamknięta.</p>
      <button type="button" class="btn btn-maly" data-akcja="ics-przypomnienie">${I.kalendarz}Dodaj do kalendarza telefonu</button></div>
    <p class="podpowiedz">Powiadomienia z aplikacji przychodzą, gdy jest otwarta albo działa w tle. Na Androidzie zainstalowana aplikacja może też sprawdzać w tle co kilka godzin.</p>
  </form>`;
}

async function zarejestrujSprawdzanieWTle() {
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (!reg || !('periodicSync' in reg)) return;
    const st = await navigator.permissions.query({ name: 'periodic-background-sync' }).catch(() => null);
    if (st && st.state !== 'granted') return;
    if (Z.ustawienia.przypomnienie.wlaczone) await reg.periodicSync.register('zakladka-przypomnienie', { minInterval: 60 * 60 * 1000 });
    else await reg.periodicSync.unregister('zakladka-przypomnienie');
  } catch { /* nieobsługiwane */ }
}

function trescPrzypomnienia() {
  const m = mapaDni(), dzis = dzisISO(), cel = dziennyCel(m), juz = m.get(dzis) || 0;
  const plan = planDnia(dzis).filter(e => !e.zrobione);
  const seria = seriaAktualna(m);
  const linie = [];
  linie.push(juz ? `Dziś ${juz} z ${cel} stron. Brakuje ${cel - juz}.` : `Dzienny cel: ${cel} stron.${seria ? ` Seria: ${seria} dni. Nie przerywaj jej!` : ''}`);
  if (plan.length) linie.push('Plan: ' + plan.map(e => `${e.k.tytul}${e.strony ? ` (${e.strony} str.)` : ''}`).join(', '));
  return linie.join('\n');
}

async function pokazPowiadomienie(tytul, tresc, { test = false } = {}) {
  const reg = await navigator.serviceWorker?.getRegistration();
  const opcje = { body: tresc, icon: 'icons/icon-192.png', badge: 'icons/favicon-48.png', tag: test ? 'zakladka-test' : 'zakladka-przypomnienie', data: { url: './?akcja=postep' } };
  if (reg) await reg.showNotification(tytul, opcje);
  else new Notification(tytul, opcje);
}

async function sprawdzPrzypomnienie() {
  const p = Z.ustawienia.przypomnienie;
  if (!p.wlaczone || !('Notification' in window) || Notification.permission !== 'granted' || !Z.ksiazki.length) return;
  const teraz = new Date(), dzis = dzisISO();
  const [h, mm] = p.godzina.split(':').map(Number);
  if (teraz.getHours() * 60 + teraz.getMinutes() < h * 60 + mm || !p.dni.includes(dzienTygodnia(dzis))) return;
  const m = mapaDni();
  if ((m.get(dzis) || 0) >= dziennyCel(m)) return;
  let ost = null;
  try { ost = await Baza.wartosc('przypomnienie-ostatnie'); } catch { /* brak bazy */ }
  if (ost === dzis) return;
  try { await Baza.zapiszWartosc('przypomnienie-ostatnie', dzis); } catch { /* brak bazy */ }
  try { await pokazPowiadomienie('📖 Czas na czytanie', trescPrzypomnienia()); } catch (e) { console.warn(e); }
}

/* ================= dodawanie wielu książek (2.6) ================= */
function arkuszWielu({ pula = false } = {}) {
  const wiersze = []; // { zap, stan: 'szukam'|'ok'|'brak'|'blad'|'duplikat', w, wyniki, wybrane }
  let tryb = 'lista';
  const istnieje = w => Z.ksiazki.find(k => (w.isbn && k.isbn === w.isbn) || (`${k.tytul}|${k.autor}`.toLowerCase() === `${w.tytul}|${w.autor}`.toLowerCase()));
  const a = arkusz({
    tytul: pula ? 'Dodaj wiele do puli losowania' : 'Dodaj wiele książek', klasa: 'arkusz-wiele',
    render: () => `<fieldset class="segment"><legend class="sr">Sposób</legend>${radio('tryb', 'lista', 'Wklej listę', tryb === 'lista')}${radio('tryb', 'skan', 'Skanuj po kolei', tryb === 'skan')}</fieldset>
      ${tryb === 'lista' ? `<label class="wiele-pole">Jedna książka w linii: tytuł i autor albo numer ISBN
        <textarea name="lista" rows="6" placeholder="Lalka Prus&#10;9788308049396&#10;Solaris Lem"></textarea></label>
        <div class="przyciski"><button type="button" class="btn btn-glowny" data-szukaj-liste>${I.szukaj}Znajdź wszystkie</button></div>`
      : `<p class="cichy">Skanuj kody kreskowe jeden po drugim. Aparat zostaje włączony, a każda książka trafia na listę poniżej.</p>
        <div class="przyciski"><button type="button" class="btn btn-glowny" data-skanuj-serie>${I.skaner}Zacznij skanować</button></div>`}
      <div class="wiele-wyniki"></div>`
  });
  const rysujWyniki = () => {
    const box = $('.wiele-wyniki', a.tresc);
    if (!box) return;
    const doDodania = wiersze.filter(w => w.wybrane && w.w);
    box.innerHTML = wiersze.length ? `<ul class="wiele-lista">${wiersze.map((r, i) => `<li class="wiele-wiersz st-${r.stan}">
        ${r.w ? `<label class="wiele-wybor"><input type="checkbox" data-wiersz="${i}"${r.wybrane ? ' checked' : ''}${r.stan === 'szukam' ? ' disabled' : ''}>
          ${okladka({ tytul: r.w.tytul, autor: r.w.autor, okladka: r.w.okladka }, 's')}
          <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(r.w.tytul)}</span>
          <span class="wiersz-autor">${esc([r.w.autor, r.w.strony ? ile(r.w.strony, FORMY_STRON) : 'brak liczby stron', r.w.seria ? `${r.w.seria}${r.w.tom != null ? ' ' + r.w.tom : ''}` : ''].filter(Boolean).join(', '))}</span>
          ${r.stan === 'duplikat' ? '<span class="znacznik-wiele">już masz</span>' : ''}</span></label>
          ${r.wyniki && r.wyniki.length > 1 ? `<button type="button" class="btn-tekst wiele-inne" data-inne="${i}">Inne wydanie (${r.wyniki.length - 1})</button>` : ''}`
        : `<span class="wiele-szukam">${r.stan === 'szukam' ? `<span class="ladowanie">Szukam: ${esc(r.zap)}</span>` : `${I.zamknij}Nie znalazłem: <strong>${esc(r.zap)}</strong>`}</span>
          ${r.stan !== 'szukam' ? `<button type="button" class="btn-tekst" data-recznie="${i}">Dodaj ręcznie</button>` : ''}`}
      </li>`).join('')}</ul>
      <fieldset class="segment"><legend>Gdzie odłożyć</legend>${radio('gdzie-wiele', 'doPrzeczytania', 'Do przeczytania', true)}${radio('gdzie-wiele', 'przeczytana', 'Już przeczytane', false)}${radio('gdzie-wiele', 'zyczenia', 'Lista życzeń', false)}</fieldset>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Zamknij</button>
        <button type="button" class="btn btn-glowny" data-dodaj-wiele${doDodania.length ? '' : ' disabled'}>Dodaj ${doDodania.length ? ile(doDodania.length, FORMY_KSIAZEK_B) : ''}</button></div>` : '';
  };
  async function szukajWiersza(r) {
    try {
      const wyn = await Wyszukiwarka.szukajMadrze(r.zap);
      r.wyniki = wyn;
      // spośród najtrafniejszych wybierz wydanie z liczbą stron; okładkę dobierz z innego wydania tego samego tytułu
      const rdzen = t => t.toLowerCase().split(/[:.(]/)[0].trim();
      const top = wyn.slice(0, 4).filter(x => wyn[0] && rdzen(x.tytul) === rdzen(wyn[0].tytul));
      const best = top.find(x => x.strony && x.okladka) || top.find(x => x.strony) || wyn[0];
      r.w = best ? { ...best, okladka: best.okladka || (top.find(x => x.okladka) || {}).okladka || null } : null;
      r.stan = !r.w ? 'brak' : istnieje(r.w) ? 'duplikat' : 'ok';
      r.wybrane = r.stan === 'ok';
    } catch { r.stan = 'blad'; }
    rysujWyniki();
  }
  async function kolejkaSzukania(nowe) {
    const pula = [...nowe];
    const pracownik = async () => { while (pula.length) await szukajWiersza(pula.shift()); };
    await Promise.all([pracownik(), pracownik()]);
  }
  const dodajZapytania = lista => {
    const nowe = lista.map(z => z.trim()).filter(Boolean).filter(z => !wiersze.some(r => r.zap === z)).map(zap => ({ zap, stan: 'szukam', w: null, wyniki: [], wybrane: false }));
    wiersze.push(...nowe);
    rysujWyniki();
    return kolejkaSzukania(nowe);
  };
  a.tresc.addEventListener('change', e => {
    if (e.target.name === 'tryb') { const t = $('[name="lista"]', a.tresc)?.value; tryb = e.target.value; a.rysuj(); if (t && $('[name="lista"]', a.tresc)) $('[name="lista"]', a.tresc).value = t; rysujWyniki(); }
    if (e.target.dataset.wiersz) { wiersze[+e.target.dataset.wiersz].wybrane = e.target.checked; rysujWyniki(); }
  });
  a.tresc.addEventListener('click', async e => {
    if (e.target.closest('[data-szukaj-liste]')) {
      if (!navigator.onLine) { toast('Jesteś offline.', { typ: 'blad' }); return; }
      const pole = $('[name="lista"]', a.tresc);
      const linie = pole.value.split(/\n|;/).map(l => l.trim()).filter(Boolean).slice(0, 50);
      if (!linie.length) { pole.focus(); return; }
      pole.value = '';
      dodajZapytania(linie);
    }
    if (e.target.closest('[data-skanuj-serie]')) {
      arkuszSkanera(kod => { dodajZapytania([kod]); toast(`Zeskanowano ${kod}. Skanuj następną.`, { czas: 1800 }); }, { seria: true });
    }
    const inne = e.target.closest('[data-inne]');
    if (inne) {
      const r = wiersze[+inne.dataset.inne];
      const i = r.wyniki.indexOf(r.w);
      r.w = r.wyniki[(i + 1) % r.wyniki.length];
      r.stan = istnieje(r.w) ? 'duplikat' : 'ok';
      rysujWyniki();
    }
    const rec = e.target.closest('[data-recznie]');
    if (rec) {
      const r = wiersze[+rec.dataset.recznie];
      a.zamknij();
      arkuszFormularza();
      setTimeout(() => { const q = $('#f-q'); if (q) { q.value = r.zap; } const t = document.querySelector('.arkusz form [name="tytul"]'); if (t && !Wyszukiwarka.czyIsbn(r.zap)) t.value = r.zap; }, 50);
    }
    if (e.target.closest('[data-dodaj-wiele]')) {
      const gdzie = $('[name="gdzie-wiele"]:checked', a.tresc)?.value || 'doPrzeczytania';
      const wybrane = wiersze.filter(r => r.wybrane && r.w);
      const dodane = [];
      for (const r of wybrane) {
        const w = r.w;
        let okl = w.okladka;
        if (okl) okl = await urlNaOkladke(okl);
        const k = nowaKsiazka({ tytul: w.tytul, autor: w.autor, strony: w.strony || Z.ustawienia.srednia, isbn: w.isbn, okladka: okl, tagi: w.tagi || [], seria: w.seria || '', tom: w.tom });
        if (gdzie === 'przeczytana') oznaczPrzeczytana(k, dzisISO(), false);
        if (gdzie === 'zyczenia') naListeZyczen(k);
        if (pula) k.pula = true;
        dodane.push(k);
      }
      utrwal(dodane);
      a.zamknij(); odswiez();
      if (dodane.length === 1) poDodaniu(dodane[0]);
      const bezStron = wybrane.filter(r => !r.w.strony).length;
      toast(`Dodano ${ile(dodane.length, FORMY_KSIAZEK_B)}.${bezStron ? ` ${bezStron} bez liczby stron: wpisałem ${Z.ustawienia.srednia}, popraw w edycji.` : ''}`, { czas: 6000 });
    }
  });
}

/* ================= losowanie (2.6) ================= */
function arkuszLosowania() {
  const f = { dlugosc: 'dowolna', tag: '', format: '', zrodlo: 'kolejka', waga: true };
  const odrzucone = new Set();
  let wybrana = null, kreci = false;
  const pula = () => {
    let l = f.zrodlo === 'tydzien' ? planTygodnia().map(e => e.k).filter((k, i, t) => t.indexOf(k) === i && k.status !== 'przeczytana')
      : f.zrodlo === 'cykle' ? kolejka().filter(k => k.seria && (nastepnyTom(k) === k || ksiazkiSerii(k.seria).filter(x => x.tom != null && k.tom != null && x.tom < k.tom).every(x => x.status === 'przeczytana')))
      : kolejka();
    l = l.filter(k => (f.dlugosc === 'krotka' ? k.strony < 250 : f.dlugosc === 'srednia' ? k.strony >= 250 && k.strony < 450 : f.dlugosc === 'dluga' ? k.strony >= 450 : true)
      && (!f.tag || k.tagi.includes(f.tag)) && (!f.format || k.format === f.format));
    const bez = l.filter(k => !odrzucone.has(k.id));
    return bez.length ? bez : l;
  };
  const tagi = [...new Set(kolejka().flatMap(k => k.tagi))].sort((x, y) => x.localeCompare(y, 'pl'));
  const a = arkusz({
    tytul: 'Losowanie', klasa: 'arkusz-maly arkusz-los',
    render: () => {
      const p = pula();
      return `<div class="los-filtry">
        <label>Skąd<select name="zrodlo"><option value="kolejka"${f.zrodlo === 'kolejka' ? ' selected' : ''}>Cała lista do przeczytania</option><option value="tydzien"${f.zrodlo === 'tydzien' ? ' selected' : ''}>Plan tego tygodnia</option><option value="cykle"${f.zrodlo === 'cykle' ? ' selected' : ''}>Następne tomy cykli</option></select></label>
        <label>Długość<select name="dlugosc">${[['dowolna', 'Dowolna'], ['krotka', 'Krótka, do 250 s.'], ['srednia', 'Średnia, 250–450 s.'], ['dluga', 'Długa, od 450 s.']].map(([v, n]) => `<option value="${v}"${f.dlugosc === v ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
        ${tagi.length ? `<label>Tag<select name="tag"><option value="">Dowolny</option>${tagi.map(t => `<option${f.tag === t ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>` : ''}
        <label>Format<select name="format"><option value="">Dowolny</option>${Object.entries(FORMATY).map(([v, n]) => `<option value="${v}"${f.format === v ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      </div>
      <label class="przelacznik maly"><input type="checkbox" name="waga"${f.waga ? ' checked' : ''}><span>Większa szansa dla książek, które długo czekają, i następnych tomów</span></label>
      <div class="los-scena">${wybrana ? `<div class="los"><div class="los-okl">${okladka(wybrana, 'l')}</div>
        <p class="los-tytul">${esc(wybrana.tytul)}</p>
        <p class="cichy">${esc([wybrana.autor, ile(wybrana.strony, FORMY_STRON), wybrana.seria ? `${wybrana.seria}${wybrana.tom != null ? ', tom ' + wybrana.tom : ''}` : '', kolejka().includes(wybrana) ? `czeka od ${dataDluga(wybrana.dodano, false)}` : ''].filter(Boolean).join(' · '))}</p></div>`
        : `<p class="pusto">${p.length ? `W puli: ${ile(p.length, FORMY_KSIAZEK)}. Kliknij „Losuj”.` : 'Brak książek pasujących do filtrów.'}</p>`}</div>
      <div class="przyciski przyciski-srodek">
        <button type="button" class="btn${wybrana ? '' : ' btn-glowny'}" data-krec${p.length ? '' : ' disabled'}>${I.kostka}${wybrana ? 'Nie to, losuj dalej' : 'Losuj'}</button>
        ${wybrana ? `<button type="button" class="btn btn-glowny" data-start>Zacznij czytać</button>` : ''}</div>
      ${wybrana ? `<div class="przyciski przyciski-srodek los-dodatkowe"><button type="button" class="btn-tekst" data-do-tygodnia>Dodaj do planu tygodnia</button>
        <button type="button" class="btn-tekst" data-na-poczatek>Na początek kolejki</button></div>` : ''}
      ${odrzucone.size ? `<p class="cichy los-odrzucone">Pominięte w tym losowaniu: ${odrzucone.size}</p>` : ''}`;
    }
  });
  const krec = () => {
    const p = pula();
    if (!p.length || kreci) return;
    if (wybrana) odrzucone.add(wybrana.id);
    const pp = pula();
    const cel = f.waga ? losujWazone(pp, k => wagaLosowania(k)) : pp[Math.floor(Math.random() * pp.length)];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || pp.length < 2) { wybrana = cel; a.rysuj(); return; }
    kreci = true;
    // „bęben”: szybko przewijane okładki, coraz wolniej, aż zatrzymają się na wylosowanej
    let krok = 0;
    const kroki = 14;
    const tick = () => {
      krok++;
      wybrana = krok >= kroki ? cel : pp[Math.floor(Math.random() * pp.length)];
      a.rysuj();
      $('.los', a.tresc)?.classList.add(krok >= kroki ? 'animuj-los' : 'los-beben');
      if (krok < kroki) setTimeout(tick, 40 + krok * krok * 2.2);
      else { kreci = false; if (navigator.vibrate) navigator.vibrate(30); }
    };
    tick();
  };
  a.tresc.addEventListener('change', e => {
    const n = e.target.name;
    if (n in f) { f[n] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; wybrana = null; odrzucone.clear(); a.rysuj(); }
  });
  a.tresc.addEventListener('click', e => {
    if (e.target.closest('[data-krec]')) krec();
    if (!wybrana || kreci) return;
    const k = wybrana;
    if (e.target.closest('[data-start]')) { utrwal(zacznijCzytac(k)); a.zamknij(); odswiez(); toast(`Zaczynasz „${k.tytul}”.`); }
    if (e.target.closest('[data-do-tygodnia]')) { dodajDoPlanu(poczatekTygodnia(), k.id); utrwalUstawienia(); odswiez(); toast(`„${k.tytul}” w planie tygodnia.`, { akcja: 'Pokaż', onAkcja: () => arkuszTygodnia() }); }
    if (e.target.closest('[data-na-poczatek]')) { utrwal(naPoczatekKolejki(k)); odswiez(); toast('Przeniesiono na początek kolejki.'); }
  });
}

/* ================= widok: Losuj — pula moich książek i losowanie na tydzień (2.9) ================= */
const LOS = { pn: null, dlugosc: 'dowolna', kreci: false, szukam: false };

function widokLosowanie() {
  const tryb = U.losTryb || 'losuj';
  return `<div class="los-przelacznik" role="tablist">
    <button type="button" role="tab" aria-selected="${tryb === 'losuj'}" data-los-tryb="losuj">${I.kostka}Losowanie</button>
    <button type="button" role="tab" aria-selected="${tryb === 'odkrywaj'}" data-los-tryb="odkrywaj"><span class="los-serce">♥</span>Odkrywaj</button>
  </div>${tryb === 'odkrywaj' ? widokOdkrywaj() : widokLosowania()}`;
}

function widokLosowania() {
  const pula = pulaLosowania();
  const dzis = dzisISO(), teraz = poczatekTygodnia(), nast = dodajDni(teraz, 7);
  if (!LOS.pn || (LOS.pn !== teraz && LOS.pn !== nast)) LOS.pn = tydzienDoLosowania();
  const pn = LOS.pn, los = Z.ustawienia.losowania[pn];
  const wylosowane = los ? los.ids.map(znajdz).filter(Boolean) : [];
  const ileL = Z.ustawienia.losIle;
  const historia = Object.entries(Z.ustawienia.losowania).filter(([t]) => t < teraz).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8);
  const niedziela = dzienTygodnia(dzis) === 6;
  return `<section class="naglowek-widoku"><h1>Losowanie</h1><span class="licznik" title="Książek w puli">${pula.length}</span></section>

  <section class="los-karta">
    <div class="los-tydz" role="group" aria-label="Tydzień">
      <button type="button" class="${pn === teraz ? 'wybrany' : ''}" data-los-tydz="${teraz}">Ten tydzień<small>${zakresTyg(teraz)}</small></button>
      <button type="button" class="${pn === nast ? 'wybrany' : ''}" data-los-tydz="${nast}">Następny tydzień<small>${zakresTyg(nast)}</small></button>
    </div>
    ${niedziela && pn === nast && !los ? '<p class="los-niedziela">Niedziela to dobry moment na losowanie: wylosuj, co czytasz od poniedziałku.</p>' : ''}
    <div class="los-wyniki" data-los-wyniki>${wylosowane.length ? htmlWylosowanych(wylosowane, pn, los) : `<div class="los-puste">${I.kostka}<p>${pula.length ? `Wylosuj książki na ${pn === teraz ? 'ten' : 'następny'} tydzień z ${ile(pula.length, ['książki', 'książek', 'książek'])} w twojej puli.` : 'Najpierw dodaj do puli książki, które masz (niżej).'}</p></div>`}</div>
    ${!wylosowane.length || !los.zatwierdzone ? `<div class="los-ustaw">
      <div class="los-ile"><span>Ile książek?</span>${[1, 2, 3, 4, 5, 6].map(n => `<button type="button" class="kr-cel-btn${ileL === n ? ' wybrany' : ''}" data-los-ile="${n}">${n}</button>`).join('')}</div>
      <label class="los-dlugosc">Długość<select data-los-dlugosc>${[['dowolna', 'Dowolna'], ['krotka', 'Krótkie, do 250 s.'], ['srednia', 'Średnie, 250–450 s.'], ['dluga', 'Długie, od 450 s.']].map(([v, n]) => `<option value="${v}"${LOS.dlugosc === v ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      <button type="button" class="btn ${wylosowane.length ? '' : 'btn-glowny '}btn-duzy los-btn" data-los-start${pula.length ? '' : ' disabled'}>${I.kostka}${wylosowane.length ? 'Losuj wszystko od nowa' : `Losuj ${ile(ileL, FORMY_KSIAZEK_B)}`}</button>
    </div>` : ''}
  </section>

  <section class="sekcja">
    <div class="sekcja-gora"><h2>Moje książki do losowania</h2><span class="licznik">${pula.length}</span></div>
    <p class="cichy">Wpisz książki, które masz na półce. Wystarczy tytuł (i autor) albo numer ISBN. Resztę uzupełnię sam.</p>
    <form class="los-dodaj" data-los-dodaj novalidate>
      <input name="q" type="search" placeholder="np. Lalka Prus albo 9788308049396" autocomplete="off" enterkeyhint="done" aria-label="Tytuł, autor albo ISBN">
      <button type="submit" class="btn btn-glowny"${LOS.szukam ? ' disabled' : ''}>${LOS.szukam ? '<span class="ladowanie"></span>' : `${I.plus}<span class="sr">Dodaj</span>`}</button>
    </form>
    <div class="przyciski los-dodaj-inne">
      <button type="button" class="btn btn-maly" data-los-skan>${I.skaner}Skanuj kody</button>
      <button type="button" class="btn btn-maly" data-los-lista>Wklej listę</button>
      <button type="button" class="btn btn-maly" data-los-z-biblioteki>${I.biblioteka}Z biblioteki</button>
    </div>
    ${pula.length ? `<ul class="los-pula">${pula.map(k => `<li class="${wylosowane.includes(k) ? 'wylosowana' : ''}">
      <button type="button" class="los-pula-k" data-akcja="ksiazka" data-id="${k.id}">${okladka(k, 's')}
        <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">${esc([k.autor, ile(k.strony, FORMY_STRON), k.status === 'czytam' ? 'czytasz' : ''].filter(Boolean).join(' · '))}</span></span></button>
      <button type="button" class="btn-ikona maly" data-los-wyjmij="${k.id}" aria-label="Wyjmij z puli">${I.zamknij}</button></li>`).join('')}</ul>`
      : '<p class="pusto">Pula jest pusta.</p>'}
  </section>

  ${historia.length ? `<section class="sekcja"><h2>Historia losowań</h2><ul class="los-historia">${historia.map(([t, v]) => {
    const ks = v.ids.map(znajdz).filter(Boolean);
    const przecz = ks.filter(k => k.status === 'przeczytana').length;
    return `<li><span class="los-hist-tydz">${zakresTyg(t)}<small>${przecz}/${ks.length} przeczytane</small></span>
      <span class="los-hist-okl">${ks.map(k => `<button type="button" class="kafel${k.status === 'przeczytana' ? ' przecz' : ''}" data-akcja="ksiazka" data-id="${k.id}" aria-label="${esc(k.tytul)}">${okladka(k, 's')}</button>`).join('')}</span></li>`;
  }).join('')}</ul></section>` : ''}`;
}

function htmlWylosowanych(lista, pn, los) {
  return `<p class="los-naglowek">${los.zatwierdzone ? 'W planie na' : 'Wylosowane na'} ${pn === poczatekTygodnia() ? 'ten tydzień' : 'następny tydzień'}:</p>
    <ol class="los-karty">${lista.map((k, i) => `<li class="los-k" style="--i:${i}">
      <button type="button" class="los-k-okl" data-akcja="ksiazka" data-id="${k.id}">${okladka(k, 'm')}</button>
      <span class="los-k-tytul">${esc(k.tytul)}</span><span class="los-k-autor">${esc(k.autor)}${k.autor ? ' · ' : ''}${k.strony} s.</span>
      ${los.zatwierdzone ? '' : `<button type="button" class="btn-tekst los-zamien" data-los-zamien="${k.id}">${I.kostka}Zamień</button>`}
    </li>`).join('')}</ol>
    <p class="cichy los-suma">Razem ${ile(lista.reduce((s, k) => s + zostaloStron(k), 0), FORMY_STRON)}, ok. ${czasTekst(minutZeStron(lista.reduce((s, k) => s + zostaloStron(k), 0)))} czytania, czyli ok. ${Math.ceil(minutZeStron(lista.reduce((s, k) => s + zostaloStron(k), 0)) / 7)} min dziennie.</p>
    <div class="przyciski przyciski-srodek">${los.zatwierdzone
      ? `<button type="button" class="btn btn-glowny" data-akcja="kreator" data-pn="${pn}">${I.kalendarz}Rozpisz na dni</button><button type="button" class="btn" data-akcja="tydzien" data-pn="${pn}">Plan tygodnia</button><button type="button" class="btn-tekst" data-los-odnow>Losuj od nowa</button>`
      : `<button type="button" class="btn btn-glowny" data-los-zatwierdz>${I.check}Biorę! Zaplanuj tydzień</button>`}</div>`;
}

function htmlBebna(pula, ile) {
  return `<ol class="los-karty los-beben-karty">${Array.from({ length: ile }, (_, i) => `<li class="los-k kreci" data-slot="${i}">
    <span class="los-k-okl">${okladka(pula[Math.floor(Math.random() * pula.length)], 'm')}</span><span class="los-k-tytul">?</span></li>`).join('')}</ol>`;
}

/** Animacja: okładki migają w każdym okienku, okienka zatrzymują się po kolei. */
function animujLosowanie(wynik, gotowe) {
  const box = $('[data-los-wyniki]');
  const pula = pulaLosowania();
  if (!box || matchMedia('(prefers-reduced-motion: reduce)').matches || pula.length < 2) { gotowe(); return; }
  LOS.kreci = true;
  box.innerHTML = htmlBebna(pula, wynik.length);
  const sloty = $$('[data-slot]', box);
  let tik = 0;
  const stopy = wynik.map((_, i) => 12 + i * 7);
  const krok = () => {
    tik++;
    sloty.forEach((s, i) => {
      if (tik < stopy[i]) {
        $('.los-k-okl', s).innerHTML = okladka(pula[Math.floor(Math.random() * pula.length)], 'm');
      } else if (tik === stopy[i]) {
        s.classList.remove('kreci'); s.classList.add('stop');
        $('.los-k-okl', s).innerHTML = okladka(wynik[i], 'm');
        $('.los-k-tytul', s).textContent = wynik[i].tytul;
        if (navigator.vibrate) navigator.vibrate(25);
      }
    });
    if (tik < stopy[stopy.length - 1]) setTimeout(krok, 70 + tik * 2);
    else setTimeout(() => { LOS.kreci = false; gotowe(); }, 500);
  };
  krok();
}

function zapiszLosowanie(pn, ids, zatwierdzone = false) {
  Z.ustawienia.losowania[pn] = { ids, data: dzisISO(), zatwierdzone };
  utrwalUstawienia();
}

async function dodajDoPuli(q) {
  q = q.trim();
  if (!q) return;
  const istniejaca = Z.ksiazki.find(k => (Wyszukiwarka.czyIsbn(q) && k.isbn === Wyszukiwarka.czyIsbn(q)) || `${k.tytul} ${k.autor}`.toLowerCase() === q.toLowerCase() || k.tytul.toLowerCase() === q.toLowerCase());
  if (istniejaca) {
    if (istniejaca.pula) { toast(`„${istniejaca.tytul}” już jest w puli.`); return; }
    istniejaca.pula = true; utrwal(istniejaca); renderWidok(); toast(`„${istniejaca.tytul}” w puli.`); return;
  }
  let w = null;
  if (navigator.onLine) {
    LOS.szukam = true; renderWidok();
    try {
      const wyn = await Wyszukiwarka.szukajMadrze(q);
      const rdzen = t => t.toLowerCase().split(/[:.(]/)[0].trim();
      const top = wyn.slice(0, 4).filter(x => wyn[0] && rdzen(x.tytul) === rdzen(wyn[0].tytul));
      const best = top.find(x => x.strony && x.okladka) || top.find(x => x.strony) || wyn[0];
      if (best) w = { ...best, okladka: best.okladka || (top.find(x => x.okladka) || {}).okladka || null };
    } catch { /* offline albo wyszukiwarka nie odpowiada */ }
    LOS.szukam = false;
  }
  if (!w) {
    // bez wyniku: dodaj tak, jak wpisano; liczbę stron poprawisz w edycji
    const isbn = Wyszukiwarka.czyIsbn(q);
    w = { tytul: isbn ? `ISBN ${isbn}` : q, autor: '', strony: null, isbn: isbn || '', okladka: null };
  }
  const okl = w.okladka ? await urlNaOkladke(w.okladka) : null;
  const k = nowaKsiazka({ tytul: w.tytul, autor: w.autor, strony: w.strony || Z.ustawienia.srednia, isbn: w.isbn, okladka: okl, tagi: w.tagi || [], seria: w.seria || '', tom: w.tom, pula: true });
  utrwal(k);
  if (U.widok === 'losuj') renderWidok();
  toast(`Dodano do puli: „${k.tytul}”${w.strony ? '' : ' (sprawdź liczbę stron)'}.`, { akcja: 'Edytuj', onAkcja: () => arkuszFormularza(k.id) });
  poDodaniu(k);
}

function arkuszPuliZBiblioteki() {
  const kand = Z.ksiazki.filter(k => !['przeczytana', 'porzucona'].includes(k.status)).sort((a, b) => a.tytul.localeCompare(b.tytul, 'pl'));
  const a = arkusz({
    tytul: 'Dodaj do puli z biblioteki', klasa: 'arkusz-maly',
    render: () => kand.length ? `<p class="cichy">Zaznacz książki, które masz i chcesz losować.</p>
      <div class="przyciski"><button type="button" class="btn btn-maly" data-wszystkie-kolejka>Zaznacz całą kolejkę do przeczytania</button></div>
      <ul class="plan-lista">${kand.map(k => `<li><label class="plan-wybor${k.pula ? ' wybrana' : ''}"><input type="checkbox" data-pula="${k.id}"${k.pula ? ' checked' : ''}>
        ${okladka(k, 's')}<span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">${esc(statusKsiazki(k))}</span></span></label></li>`).join('')}</ul>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn btn-glowny" data-zamknij>Gotowe</button></div>`
      : '<p class="pusto">Biblioteka jest pusta.</p>'
  });
  a.tresc.addEventListener('change', e => {
    const id = e.target.dataset.pula;
    if (!id) return;
    const k = znajdz(id);
    k.pula = e.target.checked;
    e.target.closest('.plan-wybor').classList.toggle('wybrana', k.pula);
    utrwal(k); renderWidok();
  });
  a.tresc.addEventListener('click', e => {
    if (!e.target.closest('[data-wszystkie-kolejka]')) return;
    const zm = kolejka().filter(k => !k.pula);
    zm.forEach(k => { k.pula = true; const cb = $(`[data-pula="${k.id}"]`, a.tresc); if (cb) { cb.checked = true; cb.closest('.plan-wybor').classList.add('wybrana'); } });
    utrwal(zm); renderWidok();
    toast(`Dodano do puli: ${ile(zm.length, FORMY_KSIAZEK_B)}.`);
  });
}

function banerLosowania() {
  const dzis = dzisISO();
  if (dzienTygodnia(dzis) < 5) return ''; // sobota i niedziela
  const nast = dodajDni(poczatekTygodnia(), 7);
  if (Z.ustawienia.losowania[nast] || !pulaLosowania().length) return '';
  return `<div class="baner baner-los"><p>${I.kostka}<span>${dzienTygodnia(dzis) === 6 ? 'Niedziela' : 'Weekend'}: czas wylosować książki na przyszły tydzień.</span></p>
    <div class="przyciski"><button type="button" class="btn btn-glowny btn-maly" data-akcja="idz" data-widok="losuj">Losuj</button></div></div>`;
}

// zdarzenia widoku Losuj
document.addEventListener('click', e => {
  if (U.widok !== 'losuj' || !e.target.closest('#widok')) return;
  const t = e.target;
  const tyd = t.closest('[data-los-tydz]');
  if (tyd) { LOS.pn = tyd.dataset.losTydz; renderWidok(); return; }
  const ileB = t.closest('[data-los-ile]');
  if (ileB) { Z.ustawienia.losIle = +ileB.dataset.losIle; utrwalUstawienia(); renderWidok(); return; }
  if (t.closest('[data-los-start]') || t.closest('[data-los-odnow]')) {
    if (LOS.kreci) return;
    const pn = LOS.pn;
    if (t.closest('[data-los-odnow]')) {
      // odwołaj poprzednie zatwierdzenie: zdejmij wylosowane z planu tygodnia
      const stare = (Z.ustawienia.losowania[pn] || {}).ids || [];
      zapiszPlanTygodnia(pn, planTygodnia(pn).filter(x => !(stare.includes(x.id) && !x.dzien)));
    }
    const wynik = losujNaTydzien(Z.ustawienia.losIle, { dlugosc: LOS.dlugosc, pn });
    if (!wynik.length) { toast('W puli nie ma książek pasujących do filtra.'); return; }
    if (wynik.length < Z.ustawienia.losIle) toast(`W puli starczyło tylko na ${ile(wynik.length, FORMY_KSIAZEK_B)}.`);
    animujLosowanie(wynik, () => { zapiszLosowanie(pn, wynik.map(k => k.id)); renderWidok(); });
    return;
  }
  const zam = t.closest('[data-los-zamien]');
  if (zam) {
    const pn = LOS.pn, los = Z.ustawienia.losowania[pn];
    const [nowa] = losujNaTydzien(1, { dlugosc: LOS.dlugosc, pomin: los.ids, pn });
    if (!nowa) { toast('Nie ma już innych książek do wylosowania.'); return; }
    los.ids = los.ids.map(x => x === zam.dataset.losZamien ? nowa.id : x);
    zapiszLosowanie(pn, los.ids);
    renderWidok();
    toast(`Zamiast tego: „${nowa.tytul}”.`);
    return;
  }
  if (t.closest('[data-los-zatwierdz]')) {
    const pn = LOS.pn, los = Z.ustawienia.losowania[pn];
    for (const id of los.ids) dodajDoPlanu(pn, id);
    Z.ustawienia.celeTygodni[pn] = Math.max(Z.ustawienia.celeTygodni[pn] || 0, los.ids.length);
    zapiszLosowanie(pn, los.ids, true);
    renderWidok();
    arkuszKreatora(pn);
    toast('Książki są w planie tygodnia. Ustal czas i rozłóż je na dni.', { czas: 5000 });
    return;
  }
  const wyj = t.closest('[data-los-wyjmij]');
  if (wyj) {
    const k = znajdz(wyj.dataset.losWyjmij);
    k.pula = false; utrwal(k); renderWidok();
    toast(`Wyjęto z puli: „${k.tytul}”.`, { akcja: 'Cofnij', onAkcja: () => { k.pula = true; utrwal(k); renderWidok(); } });
    return;
  }
  if (t.closest('[data-los-skan]')) {
    arkuszSkanera(kod => { dodajDoPuli(kod); }, { seria: true });
    return;
  }
  if (t.closest('[data-los-lista]')) { arkuszWielu({ pula: true }); return; }
  if (t.closest('[data-los-z-biblioteki]')) { arkuszPuliZBiblioteki(); return; }
});
document.addEventListener('submit', e => {
  if (!e.target.matches('[data-los-dodaj]')) return;
  e.preventDefault();
  const q = e.target.elements.q.value;
  e.target.elements.q.value = '';
  dodajDoPuli(q).then(() => { const p = $('[data-los-dodaj] input'); if (p) p.focus(); });
});
document.addEventListener('change', e => {
  if (e.target.matches('[data-los-dlugosc]')) LOS.dlugosc = e.target.value;
});

/* ================= książki techniczne: rozdziały (2.9) ================= */
function htmlRozdzialow(k) {
  if (!czyTechniczna(k)) return '';
  const lista = rozdzialyK(k), zrobione = lista.filter(r => r.zrobiony).length;
  const p = prognozaTechnicznej(k), tyg = rozdzialyWTygodniu(k);
  const nast = nastepnyRozdzial(k);
  return `<section class="kd-sekcja kd-rozdzialy">
    <div class="sekcja-gora"><h3>Rozdziały</h3>${lista.length ? `<span class="licznik">${zrobione}/${lista.length}</span>` : ''}</div>
    ${lista.length ? `${pasek(zrobione / lista.length * 100)}
      <p class="cichy">${[
        k.celRozdzialow ? `w tym tygodniu ${tyg} z ${k.celRozdzialow}` : tyg ? `w tym tygodniu ${tyg}` : '',
        p.naTydzien ? `średnio ${ulamek(p.naTydzien)} na tydzień` : '',
        p.koniec ? `przy tym tempie skończysz ok. ${dataDluga(p.koniec, false)}` : ''
      ].filter(Boolean).join(', ').replace(/^./, c => c.toUpperCase()) || 'Odhaczaj rozdziały, gdy je skończysz. Strony zapiszą się same.'}</p>
      <ol class="rozdz-lista">${lista.map(r => `<li class="${r.zrobiony ? 'zrobiony' : ''}${nast && r.id === nast.id ? ' nastepny' : ''}">
        <label class="rozdz-wybor"><input type="checkbox" data-rozdzial="${r.id}" data-id="${k.id}"${r.zrobiony ? ' checked' : ''}>
          <span class="rozdz-tytul">${esc(r.tytul)}</span></label>
        <span class="rozdz-info">${r.od ? `s. ${r.od}` : ''}${r.zrobiony && r.data ? ` · ${dataKrotka(r.data)}` : ''}</span>
        <button type="button" class="btn-ikona maly" data-akcja="rozdzial-edytuj" data-id="${k.id}" data-rid="${r.id}" aria-label="Edytuj rozdział">${I.edytuj}</button>
      </li>`).join('')}</ol>` : '<p class="cichy">Dodaj spis treści, a będziesz odhaczać rozdziały zamiast liczyć strony. Strony zapiszą się same.</p>'}
    <div class="przyciski">
      <button type="button" class="btn btn-maly" data-akcja="rozdzialy-spis" data-id="${k.id}">${lista.length ? 'Edytuj spis treści' : 'Wklej spis treści'}</button>
      ${lista.length ? '' : `<button type="button" class="btn btn-maly" data-akcja="rozdzialy-podziel" data-id="${k.id}">Podziel na części</button>`}
    </div>
    <label class="rozdz-cel">Cel: rozdziałów na tydzień<select data-cel-rozdz="${k.id}">${[0, 1, 2, 3, 4, 5, 7, 10].map(n => `<option value="${n}"${k.celRozdzialow === n ? ' selected' : ''}>${n ? n : 'bez celu'}</option>`).join('')}</select></label>
  </section>`;
}

function arkuszSpisu(id) {
  const k = znajdz(id);
  if (!k) return;
  const obecny = rozdzialyK(k).map(r => `${r.tytul}${r.od ? ` ${r.od}` : ''}`).join('\n');
  const a = arkusz({
    tytul: 'Spis treści', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <p class="cichy">Jeden rozdział w linii. Numer strony na końcu linii jest opcjonalny, ale dzięki niemu odhaczenie rozdziału samo zapisze strony.</p>
      <label class="wiele-pole">Rozdziały<textarea name="spis" rows="10" placeholder="1. Wprowadzenie 1&#10;2. Zmienne i typy 23&#10;3. Funkcje 57&#10;Dodatek A 301">${esc(obecny)}</textarea></label>
      <p class="podpowiedz">Możesz wkleić spis skopiowany z księgarni internetowej albo PDF-a. Kropki i myślniki przed numerem strony zostaną pominięte.</p>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Zapisz</button></div>
    </form>`
  });
  const f = $('form', a.tresc);
  f.addEventListener('submit', e => {
    e.preventDefault();
    const nowe = parsujSpis(f.elements.spis.value);
    // zachowaj odhaczenia rozdziałów o tym samym tytule
    const stare = new Map(k.rozdzialy.map(r => [r.tytul.toLowerCase(), r]));
    k.rozdzialy = nowe.map(r => { const s = stare.get(r.tytul.toLowerCase()); return { id: s ? s.id : noweId(), tytul: r.tytul, od: r.od && r.od <= k.strony ? r.od : null, zrobiony: s ? s.zrobiony : (r.od != null && r.od <= k.strona && nowe.some(x => x.od > r.od && x.od - 1 <= k.strona)), data: s ? s.data : null }; });
    utrwal(k); a.zamknij(); odswiez();
    toast(`Zapisano ${ile(k.rozdzialy.length, ['rozdział', 'rozdziały', 'rozdziałów'])}.`);
  });
}

function arkuszPodzialu(id) {
  const k = znajdz(id);
  if (!k) return;
  const a = arkusz({
    tytul: 'Podziel na części', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <p class="cichy">Nie masz spisu treści? Podzielę ${ile(k.strony, FORMY_STRON)} na równe części, które będziesz odhaczać.</p>
      <div class="szybkie">${[5, 10, 12, 15, 20, 30].map(n => `<button type="button" class="chip" data-n="${n}">${n} części (po ok. ${Math.round(k.strony / n)} s.)</button>`).join('')}</div>
      <label>Albo co ile stron<input name="co" type="number" inputmode="numeric" min="5" placeholder="np. 25"></label>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Podziel</button></div>
    </form>`
  });
  const f = $('form', a.tresc);
  const podziel = n => { k.rozdzialy = podzielNaCzesci(k, n); utrwal(k); a.zamknij(); odswiez(); toast(`Podzielono na ${n} części.`); };
  f.addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (b) podziel(+b.dataset.n); });
  f.addEventListener('submit', e => { e.preventDefault(); const co = Math.round(+f.elements.co.value); if (co >= 5) podziel(Math.ceil(k.strony / co)); });
}

function arkuszRozdzialu(id, rid) {
  const k = znajdz(id), r = k && k.rozdzialy.find(x => x.id === rid);
  if (!r) return;
  const a = arkusz({
    tytul: 'Rozdział', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <label>Tytuł<input name="tytul" value="${esc(r.tytul)}" required></label>
      <div class="f-rzad"><label>Od strony<input name="od" type="number" inputmode="numeric" min="1" max="${k.strony}" value="${r.od ?? ''}"></label>
        <label>Przeczytany dnia<input name="data" type="date" max="${dzisISO()}" value="${r.data || ''}"${r.zrobiony ? '' : ' disabled'}></label></div>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn btn-ryzyko" data-usun-r>Usuń</button>
        <button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Zapisz</button></div>
    </form>`
  });
  const f = $('form', a.tresc);
  f.addEventListener('submit', e => {
    e.preventDefault();
    r.tytul = f.elements.tytul.value.trim().slice(0, 140) || r.tytul;
    r.od = +f.elements.od.value >= 1 ? Math.min(k.strony, Math.round(+f.elements.od.value)) : null;
    if (r.zrobiony && poprawnaData(f.elements.data.value)) r.data = f.elements.data.value;
    utrwal(k); a.zamknij(); odswiez();
  });
  $('[data-usun-r]', f).addEventListener('click', () => {
    const przed = k.rozdzialy.map(x => ({ ...x }));
    k.rozdzialy = k.rozdzialy.filter(x => x.id !== rid);
    utrwal(k); a.zamknij(); odswiez();
    toast('Usunięto rozdział.', { akcja: 'Cofnij', onAkcja: () => { k.rozdzialy = przed; utrwal(k); odswiez(); } });
  });
}

/** Odhacz rozdział z cofnięciem (strony i dziennik wracają do stanu sprzed). */
function odhaczZCofnieciem(k, rid, zrobiony) {
  const przed = JSON.parse(JSON.stringify({ rozdzialy: k.rozdzialy, strona: k.strona, log: k.log, status: k.status, koniec: k.koniec, start: k.start }));
  const r = k.rozdzialy.find(x => x.id === rid);
  utrwal(odhaczRozdzial(k, rid, zrobiony));
  odswiez();
  if (zrobiony) {
    const roznica = k.strona - przed.strona;
    toast(`Zrobione: ${r.tytul}${roznica > 0 ? ` (+${roznica} str.)` : ''}.${k.status === 'przeczytana' ? ' Cała książka przeczytana!' : ''}`, { akcja: 'Cofnij', onAkcja: () => { Object.assign(k, przed); utrwal(k); odswiez(); } });
    if (k.status === 'przeczytana') celebracja(k.id);
  }
}

/** Ekran Dziś: książki techniczne osobno — bez codziennej presji, z rozdziałami. */
function blokTechnicznych() {
  const lista = czytane().filter(czyTechniczna);
  if (!lista.length) return '';
  return `<section class="sekcja tech">
    <div class="sekcja-gora"><h2>Do nauki</h2><span class="licznik">${lista.length}</span></div>
    <ul class="lista">${lista.map(k => {
      const nast = nastepnyRozdzial(k), tyg = rozdzialyWTygodniu(k), dni = dniBezCzytania(k);
      const zrob = k.rozdzialy.filter(r => r.zrobiony).length;
      return `<li class="wiersz tech-wiersz">
        <button type="button" class="wiersz-glowny" data-akcja="ksiazka" data-id="${k.id}">${okladka(k, 's')}
          <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span>
          <span class="wiersz-autor">${k.rozdzialy.length ? `${zrob}/${k.rozdzialy.length} rozdz.` : `s. ${k.strona} z ${k.strony}`}${k.celRozdzialow ? ` · tydzień ${tyg}/${k.celRozdzialow}` : ''}</span>
          ${k.rozdzialy.length ? pasek(zrob / k.rozdzialy.length * 100) : pasek(k.strona / k.strony * 100)}
          <span class="wiersz-info">${nast ? `Dalej: ${esc(nast.tytul)}` : k.rozdzialy.length ? 'Wszystkie rozdziały odhaczone.' : 'Dodaj spis treści w szczegółach książki.'}${dni >= 7 ? ` <span class="zle">· nieruszana od ${ile(dni, FORMY_DNI)}</span>` : ''}</span></span>
        </button>
        <span class="wiersz-akcje">
          ${nast ? `<button type="button" class="btn-ikona" data-odhacz-nast="${nast.id}" data-id="${k.id}" aria-label="Odhacz: ${esc(nast.tytul)}" title="Odhacz następny rozdział">${I.check}</button>` : `<button type="button" class="btn-ikona" data-akcja="postep" data-id="${k.id}" aria-label="Zapisz postęp">${I.plus}</button>`}
          <button type="button" class="btn-ikona" data-akcja="sesja" data-id="${k.id}" aria-label="Sesja nauki">${I.zegar}</button>
        </span></li>`;
    }).join('')}</ul>
    <p class="cichy tech-podp">Książki techniczne nie liczą się do planu tygodnia ani losowania. Czytasz je w swoim rytmie, rozdział po rozdziale.</p>
  </section>`;
}

document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset && t.dataset.rozdzial) { const k = znajdz(t.dataset.id); if (k) odhaczZCofnieciem(k, t.dataset.rozdzial, t.checked); }
  if (t.dataset && t.dataset.celRozdz) { const k = znajdz(t.dataset.celRozdz); if (k) { k.celRozdzialow = +t.value || 0; utrwal(k); odswiez(); } }
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-odhacz-nast]');
  if (!b) return;
  const k = znajdz(b.dataset.id);
  if (k) odhaczZCofnieciem(k, b.dataset.odhaczNast, true);
});

const SKLEPY = [
  ['Ceneo', q => `https://www.ceneo.pl/;szukaj-${encodeURIComponent(q).replace(/%20/g, '+')}`],
  ['Allegro', q => `https://allegro.pl/listing?string=${encodeURIComponent(q)}`],
  ['Empik', q => `https://www.empik.com/szukaj/produkt?q=${encodeURIComponent(q)}`],
  ['TaniaKsiążka', q => `https://www.taniaksiazka.pl/Szukaj/q-${encodeURIComponent(q)}`],
  ['Bonito', q => `https://bonito.pl/szukaj?q=${encodeURIComponent(q)}`],
  ['Google Zakupy', q => `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`]
];
const SKLEPY_EBOOK = [
  ['Legimi', q => `https://www.legimi.pl/szukaj/?szukaj=${encodeURIComponent(q)}`],
  ['Woblink', q => `https://woblink.com/katalog?szukasz=${encodeURIComponent(q)}`],
  ['Lubimyczytać', q => `https://lubimyczytac.pl/szukaj/ksiazki?phrase=${encodeURIComponent(q)}`]
];
const OKAZJE = ['', 'urodziny', 'imieniny', 'Gwiazdka', 'Dzień Matki', 'Dzień Ojca', 'rocznica', 'kupię sam'];

function htmlZyczenia(k) {
  if (k.status !== 'zyczenia') return '';
  const fraza = `${k.tytul} ${k.autor ? k.autor.split(',')[0] : ''}`.trim();
  const qIsbn = k.isbn || fraza;
  const okaz = czyOkazja(k);
  const min = k.ceny.length ? Math.min(...k.ceny.map(c => c.cena)) : null;
  return `<section class="kd-sekcja kd-zyczenia"><div class="sekcja-gora"><h3>Lista życzeń</h3>${okaz ? '<span class="znacznik-okazja">okazja!</span>' : ''}</div>
    ${htmlListKsiazki(k)}
    <div class="f-rzad"><label>Aktualna cena (zł)<input type="number" inputmode="decimal" min="0" step="0.01" data-pole-zycz="cena" data-id="${k.id}" value="${k.cena ?? ''}" placeholder="np. 39,90"></label>
      <label>Kupię za max. (zł)<input type="number" inputmode="decimal" min="0" step="0.01" data-pole-zycz="cenaDocelowa" data-id="${k.id}" value="${k.cenaDocelowa ?? ''}" placeholder="cena docelowa"></label></div>
    <div class="f-rzad"><label>Priorytet<select data-pole-zycz="priorytet" data-id="${k.id}">${[[0, 'zwykły'], [1, '♥ chcę'], [2, '♥♥ bardzo chcę'], [3, '♥♥♥ muszę mieć']].map(([v, n]) => `<option value="${v}"${k.priorytet === v ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      <label>Okazja<select data-pole-zycz="okazja" data-id="${k.id}">${OKAZJE.map(o => `<option value="${o}"${k.okazja === o ? ' selected' : ''}>${o || 'bez okazji'}</option>`).join('')}</select></label></div>
    ${htmlCenCeneo(k)}
    <label>Link do sklepu<input type="url" data-pole-zycz="link" data-id="${k.id}" value="${esc(k.link)}" placeholder="https://… (wklej link do oferty)"></label>
    ${k.ceny.length ? `<details class="ceny-hist"><summary>Historia cen (${k.ceny.length})${min != null ? ` · najniżej ${zl(min)}` : ''}</summary>
      <ol>${[...k.ceny].reverse().map(c => `<li><span>${dataKrotka(c.data)}</span><strong>${zl(c.cena)}</strong>${c.sklep ? `<span class="cichy">${esc(c.sklep)}</span>` : ''}</li>`).join('')}</ol></details>` : ''}
    <p class="podpowiedz">Sprawdź ceny i wpisz najniższą. Zapamiętam historię, a gdy cena spadnie do twojego progu, oznaczę książkę jako okazję.</p>
    <div class="sklepy">${k.link ? `<a class="btn btn-maly btn-glowny" href="${esc(k.link)}" target="_blank" rel="noopener">Twój sklep</a>` : ''}
      ${SKLEPY.map(([n, u]) => `<a class="btn btn-maly" href="${esc(u(n === 'Ceneo' || n === 'Google Zakupy' ? qIsbn : fraza))}" target="_blank" rel="noopener">${n}</a>`).join('')}</div>
    <details class="sklepy-ebook"><summary>E-book i audiobook</summary><div class="sklepy">${SKLEPY_EBOOK.map(([n, u]) => `<a class="btn btn-maly" href="${esc(u(fraza))}" target="_blank" rel="noopener">${n}</a>`).join('')}
      <button type="button" class="btn btn-maly" data-akcja="cena-ebooka" data-id="${k.id}">Cena w Google Play</button></div><p class="cichy" data-cena-ebooka="${k.id}"></p></details>
  </section>`;
}

function naglowekPolki() {
  if (U.pozyczone) return '';
  if (U.polka === 'zyczenia') {
    const l = listaZyczen();
    if (!l.length) return '';
    const suma = l.reduce((s, k) => s + (k.cena || 0), 0), sumaDoc = l.reduce((s, k) => s + (k.cenaDocelowa || k.cena || 0), 0);
    const okazje = l.filter(czyOkazja).length;
    const dzis = dzisISO(), w = wydatki(dzis.slice(0, 8) + '01', dzis), b = Z.ustawienia.budzet;
    return `<div class="zycz-podsum">
      <p><strong>${ile(l.length, FORMY_KSIAZEK)}</strong>${suma ? ` · razem <strong>${zl(suma)}</strong>` : ''}${sumaDoc && sumaDoc < suma ? ` · w cenach docelowych ${zl(sumaDoc)}` : ''}${okazje ? ` · <span class="znacznik-okazja">${okazje} ${odmiana(okazje, ['okazja', 'okazje', 'okazji'])}</span>` : ''}</p>
      <p class="cichy">${b ? `Budżet na ten miesiąc: wydane ${zl(w.suma)} z ${zl(b)}${w.suma > b ? ' — <span class="zle">przekroczony</span>' : `, zostało ${zl(b - w.suma)}`}.` : `W tym miesiącu wydane na książki: ${zl(w.suma)}.`}
        <button type="button" class="btn-tekst" data-akcja="budzet">${b ? 'Zmień budżet' : 'Ustaw budżet'}</button></p>
      <div class="przyciski"><button type="button" class="btn btn-maly btn-glowny" data-akcja="sprawdz-ceny-wszystkie">${I.szukaj}Sprawdź ceny wszystkich</button><button type="button" class="btn btn-maly" data-akcja="udostepnij-zyczenia">${I.udostepnij}Udostępnij listę</button></div>
      <label class="przelacznik maly"><input type="checkbox" data-ceny-auto${Z.ustawienia.cenyAuto ? ' checked' : ''}><span>Sprawdzaj ceny automatycznie raz dziennie</span></label>
    </div>`;
  }
  if (U.polka === 'doPrzeczytania') return htmlKolejkiLiczby();
  if (U.polka === 'pozniej') return naPozniej().length ? '<p class="polka-info">Odłożone na później: nie zaśmiecają kolejki, a zapamiętują stronę, na której skończyłeś.</p>' : '';
  return '';
}

function tekstListyZyczen() {
  const lz = U.listaZ && Z.ustawienia.listyZyczen.find(x => x.id === U.listaZ);
  const l = listaZyczen().filter(k => !lz || k.listy.includes(lz.id));
  return [lz ? `${lz.emoji} ${lz.nazwa}` : 'Moja lista życzeń książkowych 📚', '', ...l.map(k => `• ${k.tytul}${k.autor ? ` — ${k.autor}` : ''}${k.cena ? ` (ok. ${zl(k.cena)})` : ''}${k.okazja && k.okazja !== 'kupię sam' ? ` [${k.okazja}]` : ''}${k.link ? `\n  ${k.link}` : ''}`), '', '— z aplikacji Zakładka'].join('\n');
}

function arkuszZakupu(id) {
  const k = znajdz(id);
  if (!k) return;
  const a = arkusz({
    tytul: 'Masz ją!', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <div class="postep-ksiazka">${okladka(k, 's')}<span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">${esc(k.autor)}</span></span></div>
      <fieldset class="segment"><legend class="sr">Skąd</legend>${radio('skad', 'kupiona', 'Kupiłem', true)}${radio('skad', 'prezent', 'Dostałem w prezencie', false)}</fieldset>
      <div class="f-rzad" data-zakup><label>Zapłaciłem (zł)<input name="cena" type="number" inputmode="decimal" min="0" step="0.01" value="${k.cena ?? ''}"></label>
        <label>Dnia<input name="data" type="date" max="${dzisISO()}" value="${dzisISO()}"></label></div>
      <p class="podpowiedz">Cena trafi do statystyki wydatków na książki.</p>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Anuluj</button>
        <button type="submit" class="btn" data-gdzie="kolejka">Do kolejki</button><button type="submit" class="btn btn-glowny" data-gdzie="czytaj">Zacznij czytać</button></div>
    </form>`
  });
  const f = $('form', a.tresc);
  f.addEventListener('change', e => { if (e.target.name === 'skad') $('[data-zakup]', f).hidden = e.target.value === 'prezent'; });
  f.addEventListener('submit', e => {
    e.preventDefault();
    const gdzie = e.submitter && e.submitter.dataset.gdzie;
    if (f.elements.skad.value === 'kupiona') {
      const c = +String(f.elements.cena.value).replace(',', '.');
      k.cenaZakupu = c > 0 ? Math.round(c * 100) / 100 : null;
      k.dataZakupu = poprawnaData(f.elements.data.value) ? f.elements.data.value : dzisISO();
    } else { k.cenaZakupu = null; k.dataZakupu = null; k.okazja = k.okazja || 'prezent'; }
    if (gdzie === 'czytaj') zacznijCzytac(k); else doKolejki(k);
    utrwal(k); a.zamknij(); odswiez();
    konfetti({ ile: 60 });
    toast(gdzie === 'czytaj' ? `Miłej lektury: „${k.tytul}”!` : `„${k.tytul}” w kolejce do przeczytania.`);
  });
}

function arkuszBudzetu() {
  const a = arkusz({
    tytul: 'Budżet na książki', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <label>Ile chcesz wydawać miesięcznie (zł)<input name="b" type="number" inputmode="numeric" min="0" step="10" value="${Z.ustawienia.budzet || ''}" placeholder="np. 100"></label>
      <p class="podpowiedz">Zostaw puste, żeby wyłączyć budżet. Wydatki liczą się z ceny wpisanej przy „Mam ją”.</p>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Zapisz</button></div></form>`
  });
  $('form', a.tresc).addEventListener('submit', e => {
    e.preventDefault();
    Z.ustawienia.budzet = Math.max(0, Math.round(+e.target.elements.b.value) || 0);
    utrwalUstawienia(); a.zamknij(); odswiez();
  });
}

function htmlWydatkow() {
  const dzis = dzisISO(), rok = dzis.slice(0, 4);
  const r = wydatki(`${rok}-01-01`, `${rok}-12-31`);
  if (!r.ile) return '';
  const m = wydatki(dzis.slice(0, 8) + '01', dzis);
  const top = [...r.lista].sort((a, b) => b.cenaZakupu - a.cenaZakupu)[0];
  return `<section class="sekcja"><h2>Wydatki na książki</h2><dl class="liczby">
    <div><dt>W tym miesiącu</dt><dd>${m.suma.toFixed(0)}<small> zł</small></dd></div>
    <div><dt>W ${rok}</dt><dd>${r.suma.toFixed(0)}<small> zł, ${ile(r.ile, FORMY_KSIAZEK)}</small></dd></div>
    <div><dt>Średnio za książkę</dt><dd>${(r.suma / r.ile).toFixed(2).replace('.', ',')}<small> zł</small></dd></div>
    <div><dt>Najdroższa</dt><dd><small>${esc(top.tytul)}, ${zl(top.cenaZakupu)}</small></dd></div>
  </dl></section>`;
}

/* ================= 2.22: wrażenia, porzucenia, pora czytania, kolejka, profil ================= */
/** Chipsy „Jaka była?”: do 3 nastrojów i tempo akcji. Klik zapisuje od razu. */
function odswiezWrazenia(k) {
  document.querySelectorAll(`[data-wrazenia="${k.id}"]`).forEach(el => { el.outerHTML = htmlWrazen(k); });
}
function htmlWrazen(k, { naglowek = 'Jaka była?' } = {}) {
  return `<div class="wrazenia" data-wrazenia="${k.id}">
    <p class="wrazenia-tytul">${naglowek} <span class="cichy">(do 3)</span></p>
    <div class="wrazenia-chipy">${NASTROJE.map(n => `<button type="button" class="wchip${k.nastroje.includes(n.id) ? ' wybrany' : ''}" data-akcja="nastroj" data-id="${k.id}" data-n="${n.id}" aria-pressed="${k.nastroje.includes(n.id)}">${n.emoji} ${n.nazwa}</button>`).join('')}</div>
    <div class="wrazenia-chipy wrazenia-tempo">${Object.entries(TEMPA_AKCJI).map(([id, n]) => `<button type="button" class="wchip wchip-tempo${k.tempoAkcji === id ? ' wybrany' : ''}" data-akcja="tempo-akcji" data-id="${k.id}" data-n="${id}" aria-pressed="${k.tempoAkcji === id}">${n}</button>`).join('')}</div>
  </div>`;
}

/** Porzucenie z powodem: wiesz potem, czego unikać. */
function arkuszPorzucenia(id) {
  const k = znajdz(id);
  if (!k) return;
  const a = arkusz({
    tytul: 'Porzucasz?', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <p>„${esc(k.tytul)}”${k.strona ? `, jesteś na stronie ${k.strona} z ${k.strony}` : ''}. Rzucenie książki, która nie siedzi, to nie porażka. Dlaczego?</p>
      <div class="wrazenia-chipy">${POWODY_PORZUCENIA.map((p, i) => `<label class="wchip-radio"><input type="radio" name="powod" value="${p.id}"${i === 0 ? ' checked' : ''}><span class="wchip">${p.nazwa}</span></label>`).join('')}</div>
      <p class="podpowiedz">Strona zostaje zapisana, więc możesz kiedyś wrócić do czytania.</p>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-ryzyko">Porzuć</button></div>
    </form>`
  });
  $('form', a.tresc).addEventListener('submit', e => {
    e.preventDefault();
    const kopia = JSON.parse(JSON.stringify(k));
    const zmienione = porzuc(k);
    k.powodPorzucenia = e.target.elements.powod.value;
    utrwal(zmienione);
    a.zamknij();
    odswiez();
    toast(`Porzucono „${k.tytul}”.`, { akcja: 'Cofnij', onAkcja: () => { Object.assign(k, kopia); utrwal(k); odswiez(); } });
  });
}

const PORY_CZYTANIA = [['rano', 'Rano', '🌅', h => h >= 5 && h < 12], ['popoludnie', 'Po południu', '☀️', h => h >= 12 && h < 17], ['wieczor', 'Wieczorem', '🌆', h => h >= 17 && h < 22], ['noc', 'W nocy', '🌙', h => h >= 22 || h < 5]];
/** Kiedy czytasz najwięcej i najszybciej (z sesji ze stoperem, od 2.22 zapisują godzinę startu). */
function htmlPoryCzytania() {
  const sesje = Z.ksiazki.flatMap(k => k.sesje).filter(s => s.godz != null && s.minuty > 0);
  if (sesje.length < 3) return `<section class="sekcja"><h2>Kiedy czytasz</h2><p class="cichy">Po kilku sesjach ze stoperem pokażę, o jakiej porze czytasz najwięcej i najszybciej.${sesje.length ? ` Masz już ${sesje.length} z 3.` : ''}</p></section>`;
  const dane = PORY_CZYTANIA.map(([id, nazwa, emoji, ok]) => {
    const l = sesje.filter(s => ok(s.godz)), min = l.reduce((a, s) => a + s.minuty, 0), str = l.reduce((a, s) => a + s.strony, 0);
    return { id, nazwa, emoji, ile: l.length, min, tempo: min >= 20 && str ? str / min * 60 : 0 };
  });
  const maxMin = Math.max(...dane.map(d => d.min), 1);
  const naj = [...dane].sort((a, b) => b.min - a.min)[0], szyb = [...dane].filter(d => d.tempo).sort((a, b) => b.tempo - a.tempo)[0];
  return `<section class="sekcja"><h2>Kiedy czytasz</h2>
    <p class="cichy">Najwięcej czytasz <strong>${naj.nazwa.toLowerCase()}</strong>${szyb && szyb.id !== naj.id ? `, a najszybciej ${szyb.nazwa.toLowerCase()} (${Math.round(szyb.tempo)} str./h)` : szyb ? `, w tempie ${Math.round(szyb.tempo)} str./h` : ''}.</p>
    <ol class="ranking pory">${dane.map(d => `<li><span class="ranking-nazwa">${d.emoji} ${d.nazwa}</span><span class="ranking-liczba">${d.min ? czasCzytania(d.min / 60) : '—'}${d.tempo ? ` <small class="cichy">· ${Math.round(d.tempo)} str./h</small>` : ''}</span><span class="ranking-pasek" style="--w:${d.min / maxMin * 100}%"></span></li>`).join('')}</ol></section>`;
}

/** Twój czytelniczy profil: gatunki, formaty, nastroje, tempo akcji i powody porzuceń. */
function htmlProfiluCzytelnika() {
  const przecz = Z.ksiazki.filter(k => k.status === 'przeczytana'), porz = Z.ksiazki.filter(k => k.status === 'porzucona');
  if (przecz.length + porz.length < 2) return '';
  const licz = (lista, f) => { const o = {}; for (const k of lista) for (const x of f(k)) o[x] = (o[x] || 0) + 1; return Object.entries(o).sort((a, b) => b[1] - a[1]); };
  const gatunki = licz(przecz, kategorieKsiazki).slice(0, 6).map(([id, v]) => { const c = kategoria(id); return [`${c.emoji} ${c.nazwa}`, v]; });
  const nastroje = licz(przecz, k => k.nastroje).slice(0, 5).map(([id, v]) => { const n = NASTROJE.find(x => x.id === id); return [`${n.emoji} ${n.nazwa}`, v]; });
  const formaty = licz(przecz, k => [k.format]).map(([f, v]) => `${FORMATY[f]} ${Math.round(v / przecz.length * 100)}%`);
  const tempa = licz(przecz, k => k.tempoAkcji ? [k.tempoAkcji] : []);
  const powody = licz(porz, k => k.powodPorzucenia ? [k.powodPorzucenia] : []).map(([id, v]) => [POWODY_PORZUCENIA.find(p => p.id === id).nazwa, v]);
  const srStron = przecz.length ? Math.round(przecz.reduce((a, k) => a + k.strony, 0) / przecz.length) : 0;
  const ocenione = przecz.filter(k => k.ocena && k.nastroje.length);
  const ulubiony = (() => { // nastrój, który daje ci najwyższe oceny
    const o = {};
    for (const k of ocenione) for (const n of k.nastroje) (o[n] = o[n] || []).push(k.ocena);
    const w = Object.entries(o).filter(([, l]) => l.length >= 2).map(([n, l]) => [n, l.reduce((a, b) => a + b, 0) / l.length]).sort((a, b) => b[1] - a[1])[0];
    return w ? NASTROJE.find(x => x.id === w[0]) : null;
  })();
  const odsetekPorz = Math.round(porz.length / (przecz.length + porz.length) * 100);
  return `<section class="sekcja profil"><h2>Twój czytelniczy profil</h2>
    <p class="profil-zdanie">${[
      srStron ? `Przeciętna przeczytana książka ma u ciebie ${ile(srStron, FORMY_STRON)}` : '',
      formaty.length ? `formaty: ${formaty.join(', ')}` : '',
      tempa.length ? `najczęściej wybierasz: ${TEMPA_AKCJI[tempa[0][0]].toLowerCase()}` : '',
      ulubiony ? `najwyżej oceniasz książki ${ulubiony.emoji} ${ulubiony.nazwa.toLowerCase()}` : ''
    ].filter(Boolean).join(', ')}.</p>
    <div class="dwie"><div><h3>Gatunki</h3>${ranking(gatunki, 'Dodaj kategorie albo tagi do książek, a pokażę, co czytasz najczęściej.')}</div>
    <div><h3>Nastroje</h3>${ranking(nastroje, 'Po skończeniu książki zaznacz, jaka była: wciągająca, zabawna, mroczna…')}</div></div>
    ${porz.length ? `<h3>Porzucone</h3><p class="cichy">${ile(porz.length, FORMY_KSIAZEK)} (${odsetekPorz}% zaczętych i zamkniętych).${powody.length ? ` Najczęstszy powód: <strong>${esc(powody[0][0].toLowerCase())}</strong>.` : ''}</p>${powody.length > 1 ? ranking(powody.slice(0, 4), '') : ''}` : ''}
  </section>`;
}

/** Kolejka do przeczytania w liczbach: strony, godziny i kiedy ją skończysz przy obecnym tempie. */
function htmlKolejkiLiczby() {
  const l = kolejka();
  if (l.length < 2) return '';
  const strony = l.reduce((a, k) => a + Math.max(0, k.strony - k.strona), 0);
  const godz = strony / tempoPlanu();
  const dziennie = sredniaDzienna(mapaDni(), 30);
  const wToku = czytane().reduce((a, k) => a + Math.max(0, k.strony - k.strona), 0);
  const dni = dziennie >= 1 ? Math.ceil((strony + wToku) / dziennie) : 0;
  return `<div class="kolejka-liczby">
    <p><strong>${ile(l.length, FORMY_KSIAZEK)}</strong> · ${liczba(strony)} stron · ok. ${czasCzytania(godz)} czytania</p>
    <p class="cichy">${dni ? `Przy twoim tempie (${Math.round(dziennie)} str. dziennie z 30 dni) przeczytasz całą kolejkę ok. <strong>${dataDluga(dodajDni(dzisISO(), dni))}</strong>${dni > 365 ? '. Może czas coś odłożyć na później?' : '.'}` : 'Zapisuj postęp przez kilka dni, a policzę, kiedy przeczytasz całą kolejkę.'}</p>
  </div>`;
}

/** Wyszukiwanie we wszystkich półkach i w cytatach, nie tylko na bieżącej półce. */
function htmlInnychPolek(q) {
  if (!q || q.length < 2) return '';
  const pasuje = k => `${k.tytul} ${k.autor} ${k.tagi.join(' ')} ${k.isbn} ${k.seria}`.toLowerCase().includes(q);
  const inne = Z.ksiazki.filter(k => (U.pozyczone || k.status !== U.polka) && pasuje(k)).slice(0, 12);
  const cyt = Z.ksiazki.reduce((a, k) => a + k.cytaty.filter(c => c.tekst.toLowerCase().includes(q)).length, 0);
  if (!inne.length && !cyt) return '';
  const nazwaPolki = s => (POLKI.find(([id]) => id === s) || [, s])[1];
  return `<section class="inne-polki"><h3>Na innych półkach</h3>
    ${inne.length ? `<ul class="lista">${inne.map(k => `<li><button type="button" class="wiersz-glowny" data-akcja="ksiazka" data-id="${k.id}">${okladka(k, 's')}<span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">${esc(k.autor)}</span><span class="wiersz-info">${esc(nazwaPolki(k.status))}</span></span></button></li>`).join('')}</ul>` : ''}
    ${cyt ? `<button type="button" class="btn-tekst" data-akcja="szukaj-w-cytatach">${I.szukaj}${cyt} ${odmiana(cyt, ['cytat pasuje', 'cytaty pasują', 'cytatów pasuje'])} do „${esc(q)}”</button>` : ''}
  </section>`;
}

/* ================= opis książki i podobne (2.11) ================= */
function arkuszOpisu(id) {
  const k = znajdz(id);
  const a = arkusz({
    tytul: 'Opis książki', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate><label>Opis<textarea name="opis" rows="9" placeholder="O czym jest ta książka?">${esc(k.opis)}</textarea></label>
      <div class="przyciski przyciski-koniec">${k.opis ? '<button type="button" class="btn btn-ryzyko" data-usun-opis>Usuń</button>' : ''}<button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Zapisz</button></div></form>`
  });
  const f = $('form', a.tresc);
  f.addEventListener('submit', e => { e.preventDefault(); k.opis = f.elements.opis.value.trim().slice(0, 4000); k.opisZrodlo = k.opis ? 'własny' : ''; utrwal(k); a.zamknij(); odswiez(); });
  $('[data-usun-opis]', f)?.addEventListener('click', () => { k.opis = ''; k.opisZrodlo = ''; utrwal(k); a.zamknij(); odswiez(); });
}

U.podobne = {};
function htmlPodobnych(k, { naglowek = 'Podobne książki', kompakt = false } = {}) {
  const st = U.podobne[k.id];
  const tresc = !st ? `<button type="button" class="btn btn-maly" data-akcja="podobne" data-id="${k.id}">${I.kostka}Pokaż podobne</button>`
    : st === 'laduje' ? '<p class="cichy ladowanie">Szukam podobnych książek…</p>'
    : !st.length ? '<p class="cichy">Nie znalazłem podobnych książek.</p>'
    : `<ul class="podobne-lista">${st.slice(0, kompakt ? 6 : 12).map((p, i) => `<li style="--i:${i}">
        <span class="podobne-okl">${okladka({ tytul: p.tytul, autor: p.autor, okladka: p.okladka }, 'm')}</span>
        <span class="podobne-tytul">${esc(p.tytul)}</span><span class="podobne-autor">${esc(p.autor)}</span>
        <span class="podobne-powod">${esc(p.powod)}</span>
        <span class="podobne-akcje"><button type="button" class="btn-ikona maly" data-dodaj-podobna="${i}" data-dla="${k.id}" data-gdzie="doPrzeczytania" aria-label="Do przeczytania" title="Do przeczytania">${I.plus}</button>
          <button type="button" class="btn-ikona maly" data-dodaj-podobna="${i}" data-dla="${k.id}" data-gdzie="zyczenia" aria-label="Na listę życzeń" title="Na listę życzeń">♥</button></span></li>`).join('')}</ul>`;
  return `<section class="kd-sekcja kd-podobne"><h3>${naglowek}</h3>${tresc}</section>`;
}

async function zaladujPodobne(id) {
  const k = znajdz(id);
  if (!k || U.podobne[id] === 'laduje' || Array.isArray(U.podobne[id])) return;
  if (!navigator.onLine) { toast('Jesteś offline.'); return; }
  U.podobne[id] = 'laduje'; odswiez();
  try { U.podobne[id] = await Wyszukiwarka.podobne(k, Z.ksiazki); } catch { U.podobne[id] = []; }
  odswiez();
}

/* ================= animacje i interakcje (2.11) ================= */
const bezRuchu = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Konfetti w kolorach aplikacji. */
function konfetti({ ile: n = 120, czas = 1800 } = {}) {
  Fx.graj('dzwonek');
  if (bezRuchu()) return;
  const c = document.createElement('canvas');
  c.className = 'konfetti';
  c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio;
  document.body.append(c);
  const ctx = c.getContext('2d'), s = devicePixelRatio;
  const kol = ['#a3233a', '#d9b66e', '#1f4a3d', '#7fa48e', '#f1ede0', '#22385c'];
  const cz = Array.from({ length: n }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .35, vx: (Math.random() - .5) * 11, vy: -Math.random() * 12 - 4, r: Math.random() * 6 + 4, k: kol[Math.floor(Math.random() * kol.length)], o: Math.random() * 6, w: Math.random() * .3 + .1 }));
  const t0 = performance.now();
  const klatka = t => {
    const dt = t - t0;
    ctx.clearRect(0, 0, c.width, c.height);
    for (const p of cz) {
      p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.o += p.w;
      ctx.save(); ctx.translate(p.x * s, p.y * s); ctx.rotate(p.o);
      ctx.globalAlpha = Math.max(0, 1 - dt / czas);
      ctx.fillStyle = p.k; ctx.fillRect(-p.r * s / 2, -p.r * s / 4, p.r * s, p.r * s / 2);
      ctx.restore();
    }
    if (dt < czas) requestAnimationFrame(klatka); else c.remove();
  };
  requestAnimationFrame(klatka);
}

/** Liczby „nabijają się” od zera do wartości. */
function animujLiczby(root = document) {
  if (bezRuchu()) return;
  $$('[data-licz]', root).forEach(el => {
    const cel = +el.dataset.licz;
    if (!(cel > 0) || el.dataset.zrobione) return;
    el.dataset.zrobione = '1';
    const t0 = performance.now(), czas = Math.min(900, 350 + cel * 4);
    const krok = t => { const f = Math.min(1, (t - t0) / czas), e = 1 - Math.pow(1 - f, 3); el.textContent = Math.round(cel * e).toLocaleString('pl-PL'); if (f < 1) requestAnimationFrame(krok); };
    el.textContent = '0';
    requestAnimationFrame(krok);
  });
}

/** Przeciągnij arkusz w dół, żeby go zamknąć. */
function przeciaganieArkusza(a) {
  let y0 = null, dy = 0, aktywne = false;
  const el = a.el;
  el.addEventListener('touchstart', e => {
    const t = e.target;
    if (el.scrollTop > 2 || t.closest('input, textarea, select, .kr-pasek, .kalendarz')) return;
    const r = el.getBoundingClientRect();
    if (e.touches[0].clientY - r.top > 90 && !t.closest('.arkusz-gora')) return;
    y0 = e.touches[0].clientY; dy = 0; aktywne = true; el.style.transition = 'none';
  }, { passive: true });
  el.addEventListener('touchmove', e => {
    if (!aktywne) return;
    dy = Math.max(0, e.touches[0].clientY - y0);
    el.style.transform = `translateY(${dy}px)`;
    a.tlo.style.setProperty('--zaslona-o', String(Math.max(.2, 1 - dy / 400)));
  }, { passive: true });
  el.addEventListener('touchend', () => {
    if (!aktywne) return;
    aktywne = false;
    el.style.transition = '';
    if (dy > 110) { if (navigator.vibrate) navigator.vibrate(10); a.zamknij(); } else el.style.transform = '';
    a.tlo.style.removeProperty('--zaslona-o');
  });
}

/* ---------- podpowiedzi przy pisaniu w wyszukiwarce ---------- */
function podlaczPodpowiedzi(input, { naWybor }) {
  if (!input) return;
  const box = document.createElement('ul');
  box.className = 'podpowiedzi';
  box.hidden = true;
  box.setAttribute('role', 'listbox');
  input.closest('.szukajka-rzad, .los-dodaj')?.after(box);
  let timer = null, ostatnie = [];
  const pokaz = lista => {
    ostatnie = lista;
    box.innerHTML = lista.map((p, i) => `<li role="option"><button type="button" data-podp="${i}">${p.lokalna ? '<span class="podp-moja">masz</span>' : ''}<span class="podp-tytul">${esc(p.tytul)}</span><span class="podp-autor">${esc(p.autor || '')}${p.rok ? ` · ${p.rok}` : ''}</span></button></li>`).join('');
    box.hidden = !lista.length;
  };
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 3 || Wyszukiwarka.czyIsbn(q)) { pokaz([]); return; }
    const norm = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
    const lok = Z.ksiazki.filter(k => norm(`${k.tytul} ${k.autor}`).includes(norm(q))).slice(0, 3).map(k => ({ tytul: k.tytul, autor: k.autor, lokalna: true }));
    pokaz(lok);
    if (!navigator.onLine) return;
    timer = setTimeout(async () => {
      try {
        const zew = await Wyszukiwarka.podpowiedzi(q);
        if (input.value.trim() !== q) return;
        const kl = new Set(lok.map(x => norm(x.tytul)));
        pokaz([...lok, ...zew.filter(x => !kl.has(norm(x.tytul)))].slice(0, 7));
      } catch { /* przerwane albo offline */ }
    }, 320);
  });
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-podp]');
    if (!b) return;
    const p = ostatnie[+b.dataset.podp];
    input.value = `${p.tytul}${p.autor ? ' ' + p.autor.split(',')[0] : ''}`;
    pokaz([]);
    naWybor(input.value, p);
  });
  input.addEventListener('keydown', e => { if (e.key === 'Escape' || e.key === 'Enter') pokaz([]); });
  input.addEventListener('blur', () => setTimeout(() => pokaz([]), 180));
}


document.addEventListener('click', async e => {
  const r = e.target.closest('[data-rozwin-opis]');
  if (r) { const t = r.previousElementSibling; t.classList.toggle('zwiniety'); r.textContent = t.classList.contains('zwiniety') ? 'Pokaż więcej' : 'Pokaż mniej'; return; }
  const b = e.target.closest('[data-dodaj-podobna]');
  if (!b) return;
  const lista = U.podobne[b.dataset.dla];
  const p = Array.isArray(lista) && lista[+b.dataset.dodajPodobna];
  if (!p) return;
  b.disabled = true;
  const okl = p.okladka ? await urlNaOkladke(p.okladka) : null;
  const k = nowaKsiazka({ tytul: p.tytul, autor: p.autor, strony: p.strony || Z.ustawienia.srednia, isbn: p.isbn, okladka: okl });
  if (b.dataset.gdzie === 'zyczenia') naListeZyczen(k);
  utrwal(k);
  U.podobne[b.dataset.dla] = lista.filter(x => x !== p);
  odswiez();
  toast(`„${k.tytul}” ${b.dataset.gdzie === 'zyczenia' ? 'na liście życzeń' : 'w kolejce do przeczytania'}.`, { akcja: 'Pokaż', onAkcja: () => arkuszKsiazki(k.id) });
  poDodaniu(k);
});
/** Najwyżej dwa przypomnienia naraz (od najważniejszego), reszta zwinięta. */
function stosBanerow(lista) {
  const b = lista.filter(Boolean);
  if (b.length <= 2) return b.join('');
  return `${b.slice(0, 2).join('')}<details class="banery-wiecej"><summary>Jeszcze ${ile(b.length - 2, ['przypomnienie', 'przypomnienia', 'przypomnień'])}</summary>${b.slice(2).join('')}</details>`;
}

/* ================= opis „pro” (2.12) ================= */
const FAKTY_ETYKIETY = [['gatunek', 'Gatunek'], ['wydanie', 'Pierwsze wydanie'], ['wydawca', 'Wydawca'], ['cykl', 'Cykl'], ['poprzednia', 'Poprzednia część'], ['nastepna', 'Następna część'], ['kraj', 'Kraj'], ['jezyk', 'Język oryginału'], ['tytulOryginalny', 'Tytuł oryginalny'], ['tlumacz', 'Tłumaczenie'], ['miejsceAkcji', 'Miejsce akcji'], ['temat', 'Tematy'], ['nagrody', 'Nagrody']];

function htmlOpisu(k) {
  const f = k.fakty || {};
  const ileFaktow = Object.keys(f).length;
  if (!k.opis && !ileFaktow) {
    return `<section class="kd-sekcja kd-opis"><h3>O książce</h3><p class="cichy" data-opis-stan="${k.id}">Brak opisu.</p>
      <div class="przyciski"><button type="button" class="btn btn-maly" data-akcja="opis-pobierz" data-id="${k.id}">${I.szukaj}Znajdź opis i fakty</button><button type="button" class="btn-tekst" data-akcja="opis-edytuj" data-id="${k.id}">Napisz własny</button></div></section>`;
  }
  const nast = f.nastepna && f.nastepna[0];
  const mamNast = nast && Z.ksiazki.find(x => kluczKsiazki(x.tytul) .startsWith(kluczKsiazki(nast).split('|')[0]));
  return `<section class="kd-sekcja kd-opis"><h3>O książce</h3>
    ${ileFaktow ? `<dl class="fakty">${FAKTY_ETYKIETY.filter(([n]) => f[n] && f[n].length).map(([n, e]) => `<div class="fakt fakt-${n}"><dt>${e}</dt><dd>${f[n].map(esc).join(', ')}</dd></div>`).join('')}</dl>` : ''}
    ${nast && !mamNast && k.status === 'przeczytana' ? `<div class="fakt-dalej">Następna część: <strong>${esc(nast)}</strong> <button type="button" class="btn btn-maly" data-dodaj-nastepna="${k.id}">♥ Na listę życzeń</button></div>` : ''}
    ${k.opis ? `<div class="opis-tekst${k.opis.length > 420 ? ' zwiniety' : ''}"><p>${esc(k.opis).replace(/\n+/g, '</p><p>')}</p></div>
      ${k.opis.length > 420 ? '<button type="button" class="btn-tekst" data-rozwin-opis>Pokaż więcej</button>' : ''}` : ''}
    ${k.fabula ? `<details class="fabula"><summary>Fabuła <span class="cichy">(może zdradzać zakończenie)</span></summary><div class="fabula-tekst spoiler" data-spoiler><p>${esc(k.fabula).replace(/\n+/g, '</p><p>')}</p><button type="button" class="spoiler-zaslona" data-odkryj-spoiler>Dotknij, żeby odsłonić</button></div></details>` : ''}
    <p class="cichy opis-zrodlo">${k.opisZrodlo ? `Źródło: ${esc(k.opisZrodlo)}${k.opisZrodlo === 'Open Library' ? ' (często po angielsku)' : ''} · ` : ''}${(k.opisLinki || []).map(l => `<a href="${esc(l.link)}" target="_blank" rel="noopener">${esc(l.nazwa)}</a>`).join(' · ')}${k.opisLinki && k.opisLinki.length ? ' · ' : ''}
      <button type="button" class="btn-tekst" data-akcja="opis-pobierz" data-id="${k.id}">${ileFaktow ? 'Odśwież' : 'Wzbogać o fakty'}</button> · <button type="button" class="btn-tekst" data-akcja="opis-edytuj" data-id="${k.id}">Edytuj</button></p>
    <p class="cichy" data-opis-stan="${k.id}"></p></section>`;
}

async function uzupelnijOpis(k, { cicho = false } = {}) {
  if (!k || !navigator.onLine) return false;
  const stan = $(`[data-opis-stan="${k.id}"]`);
  if (stan) { stan.textContent = 'Szukam w Wikipedii, Wikidata i bibliotekach…'; stan.classList.add('ladowanie'); }
  try {
    const w = await Wyszukiwarka.opisPro(k);
    if (w) {
      if (w.opis && (k.opisZrodlo !== 'własny' || !k.opis)) { k.opis = w.opis; k.opisZrodlo = w.zrodlo; }
      k.fabula = w.fabula || '';
      k.fakty = { ...w.fakty }; // zastępujemy, żeby zniknęły fakty z błędnie dopasowanego artykułu
      k.opisLinki = w.zrodla;
      // gatunek z Wikidata jako tag, cykl jako seria — jeśli ich jeszcze nie ma
      if (!k.tagi.length && w.fakty.gatunek) k.tagi = w.fakty.gatunek.slice(0, 2).map(t => t.toLowerCase()).filter(t => t.length < 30);
      if (!k.seria && w.fakty.cykl) k.seria = w.fakty.cykl[0];
      utrwal(k); odswiez();
      if (!cicho) toast(`Dodano opis${Object.keys(w.fakty).length ? ` i ${ile(Object.keys(w.fakty).length, ['fakt', 'fakty', 'faktów'])}` : ''} (${w.zrodlo || 'Wikidata'}).`);
      return true;
    }
  } catch (e) { console.warn(e); }
  if (!cicho && k.opisZrodlo !== 'własny' && (Object.keys(k.fakty || {}).length || k.fabula)) {
    // ręczne odświeżenie bez wyniku: usuń stare (prawdopodobnie błędne) dane z internetu
    k.fakty = {}; k.fabula = ''; k.opisLinki = [];
    if (k.opisZrodlo === 'Wikipedia') { k.opis = ''; k.opisZrodlo = ''; }
    utrwal(k); odswiez();
    toast('Nie znalazłem pewnego opisu tej książki, więc usunąłem poprzedni (mógł dotyczyć innej książki o tym tytule).', { czas: 6000 });
    return false;
  }
  if (stan) { stan.textContent = 'Nie znalazłem opisu w Wikipedii, Google Books ani Open Library.'; stan.classList.remove('ladowanie'); }
  return false;
}

/* ================= opinie czytelników z internetu (2.21) ================= */
/** Ocena w skali 0–1 (żeby porównywać Lubimyczytać /10 i Open Library /5). */
const ocenaProc = o => o && o.ocena ? o.ocena / (o.skala || 10) : null;
const ocenaTekst = o => `${String(o.ocena).replace('.', ',')}/${o.skala || 10}`;
function htmlOpinii(k) {
  const o = k.opinieNet;
  const gw = o ? Math.round(ocenaProc(o) * 5) : 0;
  return `<section class="kd-sekcja kd-opinie" data-opinie-box="${k.id}"><div class="sekcja-gora"><h3>Co mówią czytelnicy</h3>
      <button type="button" class="btn btn-maly" data-akcja="opinie-pobierz" data-id="${k.id}">${I.szukaj}${o ? 'Odśwież' : 'Sprawdź opinie'}</button></div>
    ${o ? `<p class="opinie-ocena"><strong>${ocenaTekst(o)}</strong> <span class="opinie-gwiazdki" aria-hidden="true">${'★'.repeat(gw)}${'☆'.repeat(5 - gw)}</span> <span class="cichy">${o.ocen ? `z ${o.ocen.toLocaleString('pl-PL')} ${odmiana(o.ocen, ['oceny', 'ocen', 'ocen'])} · ` : ''}${o.url ? `<a href="${esc(o.url)}" target="_blank" rel="noopener">${esc(o.zrodlo)}</a>` : esc(o.zrodlo)}</span></p>
      ${o.opinie.length ? `<ul class="opinie-lista">${o.opinie.map(x => `<li><blockquote>„${esc(x.tekst)}”</blockquote>${x.ocena ? `<span class="cichy">ocena czytelnika: ${x.ocena}/10</span>` : ''}</li>`).join('')}</ul>` : ''}
      <p class="cichy maly">Sprawdzone ${dataKrotka(o.data)}.</p>`
      : '<p class="cichy">Sprawdzę średnią ocen i kilka opinii z Lubimyczytać (a gdy się nie uda, z Open Library).</p>'}
    <p class="cichy" data-opinie-stan="${k.id}"></p></section>`;
}
async function pobierzOpinie(k, { cicho = false } = {}) {
  if (!k || !navigator.onLine) return null;
  const stan = $(`[data-opinie-stan="${k.id}"]`);
  if (stan) { stan.textContent = 'Czytam, co piszą inni…'; stan.classList.add('ladowanie'); }
  let o = null;
  try { o = await Wyszukiwarka.opinie(k); } catch (e) { console.warn(e); }
  if (o) { k.opinieNet = o; utrwal(k); odswiez(); }
  else if (stan) { stan.textContent = 'Nie znalazłem opinii o tej książce.'; stan.classList.remove('ladowanie'); }
  if (!cicho && o) toast(`Średnia ocen: ${ocenaTekst(o)} (${o.zrodlo}).`);
  return o;
}

/* ================= ceny z Ceneo dla listy życzeń (2.12) ================= */
function htmlCenCeneo(k) {
  const c = k.cenyCeneo;
  const wiersze = c ? [['papier', 'Papier'], ['ebook', 'E-book'], ['audio', 'Audiobook']].filter(([f]) => c[f]).map(([f, n]) => `<li class="${f === preferowanyFormat(k) ? 'pref' : ''}"><span>${n}</span><strong>${zl(c[f].cena)}</strong><a href="${esc(c[f].link)}" target="_blank" rel="noopener">porównaj oferty</a></li>`).join('') : '';
  return `<div class="ceny-teraz" data-ceny-box="${k.id}">
    <div class="sekcja-gora"><h4>Ceny w sklepach</h4><button type="button" class="btn btn-maly" data-akcja="sprawdz-ceny" data-id="${k.id}">${I.szukaj}${c ? 'Sprawdź ponownie' : 'Sprawdź ceny'}</button></div>
    ${c ? (wiersze ? `<ul class="ceny-lista">${wiersze}</ul><p class="cichy">Najniższe ceny z porównywarki Ceneo (wiele sklepów, m.in. Empik), sprawdzone ${dataKrotka(c.data)}.</p>` : `<p class="cichy">Ceneo nie ma teraz ofert tej książki (sprawdzone ${dataKrotka(c.data)}).</p>`)
      : '<p class="cichy">Sprawdzę najniższe ceny w wielu sklepach naraz i zapiszę je w historii.</p>'}
  </div>`;
}
const preferowanyFormat = k => k.format === 'ebook' ? 'ebook' : k.format === 'audio' ? 'audio' : 'papier';

async function sprawdzCeny(k, { cicho = false } = {}) {
  if (!k || !navigator.onLine) return null;
  const box = $(`[data-ceny-box="${k.id}"] h4`);
  if (box) box.classList.add('ladowanie');
  try {
    const c = await Wyszukiwarka.ceny(k);
    const przed = k.cena;
    k.cenyCeneo = { papier: c.papier, ebook: c.ebook, audio: c.audio, data: c.data };
    const naj = c[preferowanyFormat(k)] || c.papier || c.ebook || c.audio;
    if (naj) zapiszCene(k, naj.cena, 'Ceneo');
    utrwal(k); odswiez();
    const tanszej = naj && przed && naj.cena < przed ? przed - naj.cena : 0;
    if (czyOkazja(k)) { toast(`Okazja! „${k.tytul}” za ${zl(k.cena)}.`, { czas: 6000 }); konfetti({ ile: 50 }); }
    else if (!cicho) toast(naj ? `„${k.tytul}”: najtaniej ${zl(naj.cena)}${tanszej ? `, o ${zl(tanszej)} taniej niż ostatnio` : ''}.` : `Brak ofert „${k.tytul}” w Ceneo.`);
    return { k, naj, tanszej };
  } catch (e) {
    if (!cicho) bladCen(e);
    return { k, blad: e };
  } finally { if (box) box.classList.remove('ladowanie'); }
}

/** Raz dziennie (po starcie) sprawdza ceny całej listy życzeń. */
async function sprawdzCenyListy({ wymus = false } = {}) {
  const dzis = dzisISO();
  if (!wymus && (!Z.ustawienia.cenyAuto || lsGet('zakladka-ceny-dzien') === dzis || !navigator.onLine)) return;
  const lista = listaZyczen().filter(k => wymus || !k.cenyCeneo || k.cenyCeneo.data !== dzis).slice(0, 15);
  if (!lista.length) { if (wymus) toast('Ceny są aktualne.'); return; }
  lsSet('zakladka-ceny-dzien', dzis);
  if (wymus) toast(`Sprawdzam ceny ${ile(lista.length, FORMY_KSIAZEK_D)}…`);
  const wyniki = [];
  for (const k of lista) { wyniki.push(await sprawdzCeny(k, { cicho: true })); await new Promise(r => setTimeout(r, 700)); }
  const blad = wyniki.find(w => w && w.blad);
  if (blad && wyniki.every(w => !w || w.blad)) { if (wymus) bladCen(blad.blad); return; }
  const tansze = wyniki.filter(w => w && w.tanszej > 0), okazje = lista.filter(czyOkazja);
  if (tansze.length || okazje.length || wymus) {
    toast([`Sprawdziłem ceny ${ile(lista.length, FORMY_KSIAZEK_D)}.`, tansze.length ? `Taniej: ${tansze.map(w => `„${w.k.tytul}” (−${zl(w.tanszej)})`).join(', ')}.` : '', okazje.length ? `Okazje: ${okazje.length}!` : ''].filter(Boolean).join(' '),
      { czas: 8000, akcja: 'Pokaż', onAkcja: () => { U.polka = 'zyczenia'; U.pozyczone = false; idz('biblioteka'); } });
  }
}

/* ================= Odkrywaj: propozycje z serduszkami (2.12) ================= */
U.odk = { kolejka: [], laduje: false, opisy: {}, cofnij: [], zebrane: false };

async function zbierzPropozycje({ odNowa = false } = {}) {
  if (U.odk.laduje) return;
  if (!navigator.onLine) { toast('Odkrywanie potrzebuje internetu.'); return; }
  U.odk.laduje = true; if (U.widok === 'losuj') renderWidok();
  const zrodla = zrodlaGustu(6);
  const odrzucone = new Set([...Z.ustawienia.odkrywaj.nie, ...Z.ustawienia.odkrywaj.tak, ...Z.ksiazki.map(k => kluczKsiazki(k.tytul, k.autor))]);
  const tylkoTytul = new Set(Z.ksiazki.map(k => kluczKsiazki(k.tytul).split('|')[0]));
  const listy = U.odk.kat ? [await Wyszukiwarka.wKategorii(U.odk.kat, Z.ksiazki, U.odk.strona = odNowa ? 0 : (U.odk.strona || 0) + 1).catch(() => [])] : await Promise.all(zrodla.map(async s => {
    let p = U.podobne[s.id];
    if (!Array.isArray(p)) { try { p = await Wyszukiwarka.podobne(s, Z.ksiazki); U.podobne[s.id] = p; } catch { p = []; } }
    return p.map(x => ({ ...x, powod: s.ocena >= 4 ? `Bo ${'★'.repeat(s.ocena)} dla „${s.tytul}”` : `Podobne do „${s.tytul}”`, rodzaj: x.powod }));
  }));
  const wynik = [], widziane = new Set(odNowa ? [] : U.odk.kolejka.map(x => kluczKsiazki(x.tytul, x.autor)));
  for (let i = 0; i < 12; i++) for (const l of listy) {
    const x = l[i];
    if (!x) continue;
    const kl = kluczKsiazki(x.tytul, x.autor);
    if (odrzucone.has(kl) || widziane.has(kl) || tylkoTytul.has(kl.split('|')[0])) continue;
    widziane.add(kl); wynik.push(x);
  }
  U.odk.kolejka = odNowa ? wynik : [...U.odk.kolejka, ...wynik];
  U.odk.laduje = false; U.odk.zebrane = true;
  if (U.widok === 'losuj') renderWidok();
  dociagnijOpisy();
}

async function dociagnijOpisy() {
  for (const x of U.odk.kolejka.slice(0, 2)) {
    const kl = kluczKsiazki(x.tytul, x.autor);
    if (U.odk.opisy[kl] !== undefined) continue;
    U.odk.opisy[kl] = null;
    try { const o = await Wyszukiwarka.opis({ tytul: x.tytul, autor: x.autor, isbn: x.isbn }); U.odk.opisy[kl] = o ? o.tekst : ''; } catch { U.odk.opisy[kl] = ''; }
    if (U.widok === 'losuj' && U.losTryb === 'odkrywaj') { const el = $(`[data-odk-opis="${CSS.escape(kl)}"]`); if (el) { el.textContent = (U.odk.opisy[kl] || 'Brak opisu.').slice(0, 320) + ((U.odk.opisy[kl] || '').length > 320 ? '…' : ''); el.classList.remove('ladowanie'); } }
  }
}

function widokOdkrywaj() {
  if (!U.odk.zebrane && !U.odk.laduje) setTimeout(() => zbierzPropozycje(), 0);
  const zr = zrodlaGustu(6);
  const [x, nast] = U.odk.kolejka;
  const polubione = Z.ksiazki.filter(k => Z.ustawienia.odkrywaj.tak.includes(kluczKsiazki(k.tytul, k.autor))).slice(-12).reverse();
  const kl = x && kluczKsiazki(x.tytul, x.autor);
  return `<section class="naglowek-widoku"><h1>Odkrywaj</h1><button type="button" class="btn btn-maly" data-odk-odswiez${U.odk.laduje ? ' disabled' : ''}>${I.kostka}Nowe propozycje</button></section>
  <div class="kat-filtr odk-kat" role="group" aria-label="Szukaj w kategorii">
    <button type="button" class="kat-chip${!U.odk.kat ? ' wybrany' : ''}" data-odk-kat=""><span>♥</span>Dla ciebie</button>
    ${KATEGORIE.filter(c => c.id !== 'techniczna').map(c => `<button type="button" class="kat-chip${U.odk.kat === c.id ? ' wybrany' : ''}" data-odk-kat="${c.id}"><span>${c.emoji}</span>${c.nazwa}</button>`).join('')}
  </div>
  ${U.odk.kat ? `<p class="cichy odk-podstawa">${kategoria(U.odk.kat).emoji} ${kategoria(U.odk.kat).nazwa}: polskie wydania, od najpopularniejszych. Polub ♥ to, co cię ciekawi.</p>` : ''}
  <p class="cichy odk-podstawa"${U.odk.kat ? ' hidden' : ''}>${zr.length ? `Na podstawie: ${zr.slice(0, 4).map(k => `„${esc(k.tytul)}”`).join(', ')}${zr.length > 4 ? ' i innych' : ''}. Oceń więcej książek na 4–5 ★, a propozycje będą trafniejsze.` : 'Oceń kilka przeczytanych książek, a podsunę podobne.'}</p>
  <div class="odk-scena">
    ${x ? `${nast ? `<div class="odk-karta odk-nastepna" aria-hidden="true">${okladka({ tytul: nast.tytul, autor: nast.autor, okladka: nast.okladka }, 'l')}</div>` : ''}
      <article class="odk-karta" data-odk-karta tabindex="0" aria-label="${esc(x.tytul)}">
        <span class="odk-znak odk-tak">CHCĘ ♥</span><span class="odk-znak odk-nie">NIE ✕</span>
        <div class="odk-okl">${okladka({ tytul: x.tytul, autor: x.autor, okladka: x.okladka }, 'l')}</div>
        <h2 class="odk-tytul">${esc(x.tytul)}</h2>
        <p class="odk-autor">${esc(x.autor)}${x.strony ? ` · ${x.strony} s.` : ''}</p>
        <p class="odk-powod">${esc(x.powod)}${x.rodzaj && x.rodzaj.startsWith('Inna') ? ' · ten sam autor' : x.rodzaj ? ` · ${esc(x.rodzaj.replace(/^Podobny temat: |^Temat: /, 'temat: '))}` : ''}</p>
        <p class="odk-opis${U.odk.opisy[kl] == null ? ' ladowanie' : ''}" data-odk-opis="${esc(kl)}">${U.odk.opisy[kl] == null ? 'Szukam opisu…' : esc((U.odk.opisy[kl] || 'Brak opisu.').slice(0, 320)) + ((U.odk.opisy[kl] || '').length > 320 ? '…' : '')}</p>
      </article>` : `<div class="odk-pusto">${U.odk.laduje ? '<p class="ladowanie">Szukam książek dla ciebie…</p>' : `<p>${zr.length ? 'Na razie nie mam nowych propozycji.' : 'Nie znam jeszcze twojego gustu.'}</p><button type="button" class="btn" data-odk-odswiez>Szukaj jeszcze raz</button>`}</div>`}
  </div>
  ${x ? `<div class="odk-cel-listy"><span>♥ trafia na:</span>
    <button type="button" class="lista-chip maly${!U.odk.lista ? ' wybrany' : ''}" data-odk-lista="">listę życzeń</button>
    ${Z.ustawienia.listyZyczen.map(l => `<button type="button" class="lista-chip maly${U.odk.lista === l.id ? ' wybrany' : ''}" data-odk-lista="${l.id}">${l.emoji} ${esc(l.nazwa)}</button>`).join('')}
    <button type="button" class="lista-chip maly lista-nowa" data-akcja="lista-edytuj">+ nowa lista</button></div>
  <div class="odk-przyciski">
    <button type="button" class="odk-btn odk-btn-cofnij" data-odk="cofnij" aria-label="Cofnij"${U.odk.cofnij.length ? '' : ' disabled'}>↶</button>
    <button type="button" class="odk-btn odk-btn-nie" data-odk="nie" aria-label="Nie interesuje mnie">✕</button>
    <button type="button" class="odk-btn odk-btn-tak" data-odk="tak" aria-label="Chcę: na listę życzeń">♥</button>
    <button type="button" class="odk-btn odk-btn-mam" data-odk="mam" aria-label="Mam ją: do przeczytania">${I.biblioteka}</button>
  </div>
  <p class="cichy odk-podp">Przesuń kartę w prawo (♥ lista życzeń) albo w lewo (✕ pomiń). „Mam ją” dodaje do kolejki i puli losowania. Zostało propozycji: ${U.odk.kolejka.length}.</p>` : ''}
  ${polubione.length ? `<section class="sekcja"><div class="sekcja-gora"><h2>Polubione ♥</h2><button type="button" class="btn-tekst" data-akcja="idz" data-widok="biblioteka" data-polka="zyczenia">Wszystkie listy życzeń</button></div>
    <ul class="odk-polubione">${polubione.map(k => `<li><button type="button" class="kafel" data-akcja="ksiazka" data-id="${k.id}" aria-label="${esc(k.tytul)}">${okladka(k, 'm')}<span class="kafel-zycz">${k.cena ? zl(k.cena) : ''}</span></button></li>`).join('')}</ul></section>` : ''}`;
}

async function decyzjaOdkrywaj(rodzaj) {
  const x = U.odk.kolejka[0];
  if (!x) return;
  const kl = kluczKsiazki(x.tytul, x.autor);
  U.odk.kolejka.shift();
  const zapis = { x, rodzaj, id: null };
  if (rodzaj === 'nie') Z.ustawienia.odkrywaj.nie.push(kl);
  else {
    const k = nowaKsiazka({ tytul: x.tytul, autor: x.autor, strony: x.strony || Z.ustawienia.srednia, isbn: x.isbn, okladka: x.okladka, opis: U.odk.opisy[kl] || '', opisZrodlo: U.odk.opisy[kl] ? 'Wikipedia' : '' });
    if (rodzaj === 'tak') { naListeZyczen(k); Z.ustawienia.odkrywaj.tak.push(kl); if (U.odk.lista) k.listy = [U.odk.lista]; } else { k.pula = true; }
    zapis.id = k.id;
    utrwal(k);
    if (x.okladka) urlNaOkladke(x.okladka).then(o => { if (o !== k.okladka) { k.okladka = o; utrwal(k); } });
    setTimeout(() => { if (rodzaj === 'tak') { sprawdzCeny(k, { cicho: true }); poDodaniu(k); } else uzupelnijOpis(k, { cicho: true }); }, 400);
    if (navigator.vibrate) navigator.vibrate(rodzaj === 'tak' ? [15, 40, 15] : 20);
    if (rodzaj === 'tak') serduszka();
  }
  U.odk.cofnij = [zapis, ...U.odk.cofnij].slice(0, 10);
  utrwalUstawienia();
  renderWidok();
  dociagnijOpisy();
  if (U.odk.kolejka.length < 3) zbierzPropozycje();
}

function cofnijOdkrywaj() {
  const z = U.odk.cofnij.shift();
  if (!z) return;
  const kl = kluczKsiazki(z.x.tytul, z.x.autor);
  Z.ustawienia.odkrywaj.nie = Z.ustawienia.odkrywaj.nie.filter(v => v !== kl);
  Z.ustawienia.odkrywaj.tak = Z.ustawienia.odkrywaj.tak.filter(v => v !== kl);
  if (z.id) { Z.ksiazki = Z.ksiazki.filter(k => k.id !== z.id); Baza.usun(z.id).catch(() => {}); }
  U.odk.kolejka.unshift(z.x);
  utrwalUstawienia(); renderWidok();
}

/** Serduszka lecące w górę po polubieniu. */
function serduszka() {
  if (bezRuchu()) return;
  const kont = document.createElement('div');
  kont.className = 'serduszka';
  kont.innerHTML = Array.from({ length: 9 }, (_, i) => `<span style="--x:${(Math.random() * 160 - 80).toFixed(0)}px;--d:${(i * 60)}ms;--s:${(.7 + Math.random() * .8).toFixed(2)}">♥</span>`).join('');
  document.body.append(kont);
  setTimeout(() => kont.remove(), 1600);
}

/** Przesuwanie karty palcem albo myszą. */
document.addEventListener('pointerdown', e => {
  const karta = e.target.closest('[data-odk-karta]');
  if (!karta || e.button > 0) return;
  const x0 = e.clientX, y0 = e.clientY;
  let dx = 0, ruch = false;
  karta.setPointerCapture(e.pointerId);
  karta.style.transition = 'none';
  const tak = $('.odk-tak', karta), nie = $('.odk-nie', karta);
  const move = ev => {
    dx = ev.clientX - x0;
    if (!ruch && Math.abs(dx) < 6) return;
    if (!ruch && Math.abs(ev.clientY - y0) > Math.abs(dx)) return;
    ruch = true;
    karta.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    tak.style.opacity = Math.max(0, Math.min(1, dx / 90));
    nie.style.opacity = Math.max(0, Math.min(1, -dx / 90));
  };
  const up = () => {
    karta.removeEventListener('pointermove', move);
    karta.removeEventListener('pointerup', up);
    karta.removeEventListener('pointercancel', up);
    karta.style.transition = '';
    if (Math.abs(dx) > 100) {
      karta.classList.add(dx > 0 ? 'odlot-prawo' : 'odlot-lewo');
      setTimeout(() => decyzjaOdkrywaj(dx > 0 ? 'tak' : 'nie'), 220);
    } else { karta.style.transform = ''; tak.style.opacity = 0; nie.style.opacity = 0; }
  };
  karta.addEventListener('pointermove', move);
  karta.addEventListener('pointerup', up);
  karta.addEventListener('pointercancel', up);
});

document.addEventListener('click', e => {
  const t = e.target;
  const tr = t.closest('[data-los-tryb]');
  if (tr) { U.losTryb = tr.dataset.losTryb; lsSet('zakladka-los-tryb', U.losTryb); renderWidok(); return; }
  if (t.closest('[data-odk-odswiez]')) { U.odk.kolejka = []; U.podobne = {}; zbierzPropozycje({ odNowa: true }); return; }
  const ol = t.closest('[data-odk-lista]');
  if (ol) { U.odk.lista = ol.dataset.odkLista || null; renderWidok(); return; }
  const ok = t.closest('[data-odk-kat]');
  if (ok) { U.odk.kat = ok.dataset.odkKat || null; U.odk.kolejka = []; U.odk.strona = 0; zbierzPropozycje({ odNowa: true }); return; }
  const pl = t.closest('[data-przypisz-liste]');
  if (pl) { const k = znajdz(pl.dataset.id), id = pl.dataset.przypiszListe; k.listy = k.listy.includes(id) ? k.listy.filter(x => x !== id) : [...k.listy, id]; utrwal(k); odswiez(); return; }
  const o = t.closest('[data-odk]');
  if (o) {
    const r = o.dataset.odk;
    if (r === 'cofnij') { cofnijOdkrywaj(); return; }
    const karta = $('[data-odk-karta]');
    if (karta && !bezRuchu()) { karta.classList.add(r === 'nie' ? 'odlot-lewo' : r === 'tak' ? 'odlot-prawo' : 'odlot-gora'); setTimeout(() => decyzjaOdkrywaj(r), 220); }
    else decyzjaOdkrywaj(r);
    return;
  }
  const sp = t.closest('[data-odkryj-spoiler]');
  if (sp) { sp.closest('[data-spoiler]').classList.remove('spoiler'); sp.remove(); return; }
  const dn = t.closest('[data-dodaj-nastepna]');
  if (dn) {
    const k = znajdz(dn.dataset.dodajNastepna), tyt = k.fakty.nastepna[0];
    const n = nowaKsiazka({ tytul: tyt, autor: k.autor, strony: Z.ustawienia.srednia, seria: k.seria || (k.fakty.cykl || [''])[0], tom: k.tom != null ? k.tom + 1 : null });
    naListeZyczen(n); utrwal(n); odswiez();
    toast(`„${tyt}” na liście życzeń.`, { akcja: 'Pokaż', onAkcja: () => arkuszKsiazki(n.id) });
    sprawdzCeny(n, { cicho: true }); poDodaniu(n);
  }
});
document.addEventListener('keydown', e => {
  if (U.widok !== 'losuj' || U.losTryb !== 'odkrywaj' || otwarte.length || /input|textarea|select/i.test(e.target.tagName)) return;
  if (e.key === 'ArrowRight') decyzjaOdkrywaj('tak');
  if (e.key === 'ArrowLeft') decyzjaOdkrywaj('nie');
});

/* ---------- pomoc: aktualizacja workera Cloudflare (ceny) ---------- */
function bladCen(e) {
  const stary = /starą wersję|stara wersja/i.test(e.message);
  toast(stary ? 'Ceny potrzebują nowej wersji twojego workera Cloudflare. To 2 minuty.' : e.message,
    { typ: 'blad', czas: 9000, ...(stary ? { akcja: 'Jak naprawić', onAkcja: () => arkuszWorkera() } : {}) });
}

function arkuszWorkera() {
  const adres = (Z.ustawienia.posrednik || POSREDNIK_BN).replace(/\/+$/, '');
  const nazwa = (adres.match(/^https:\/\/([^.]+)\./) || [])[1] || 'twój worker';
  const a = arkusz({
    tytul: 'Zaktualizuj workera', klasa: 'arkusz-maly',
    render: () => `<p>Ceny z Ceneo przechodzą przez twojego workera Cloudflare (<strong>${esc(nazwa)}</strong>). Trzeba raz wkleić do niego nowy kod. Da się to zrobić z telefonu:</p>
      <ol class="kroki">
        <li><button type="button" class="btn btn-glowny btn-maly" data-kopiuj-kod>${I.kopiuj}Skopiuj nowy kod</button></li>
        <li>Otwórz <a href="https://dash.cloudflare.com/?to=/:account/workers-and-pages" target="_blank" rel="noopener">panel Cloudflare</a> i zaloguj się.</li>
        <li>Wejdź w <strong>Workers &amp; Pages</strong>, potem <strong>${esc(nazwa)}</strong>, a następnie <strong>Edit code</strong>.</li>
        <li>Zaznacz cały stary kod, usuń go i wklej skopiowany.</li>
        <li>Kliknij <strong>Deploy</strong>. Adres się nie zmienia.</li>
        <li>Wróć tutaj i kliknij: <button type="button" class="btn btn-maly" data-test-workera>Sprawdź, czy działa</button></li>
      </ol>
      <p class="cichy" data-wynik-workera></p>`
  });
  a.tresc.addEventListener('click', async e => {
    if (e.target.closest('[data-kopiuj-kod]')) {
      try {
        const r = await fetch('proxy/cloudflare-worker.js', { cache: 'no-store' });
        if (!r.ok) throw new Error();
        await navigator.clipboard.writeText(await r.text());
        toast('Skopiowano kod workera. Teraz wklej go w Cloudflare.');
      } catch { toast('Nie udało się skopiować. Otwórz plik proxy/cloudflare-worker.js z repozytorium i skopiuj go ręcznie.', { typ: 'blad', czas: 8000 }); }
    }
    if (e.target.closest('[data-test-workera]')) {
      const w = $('[data-wynik-workera]', a.tresc);
      w.textContent = 'Sprawdzam…'; w.classList.add('ladowanie');
      try {
        const r = await fetch(`${adres}?ceny=${encodeURIComponent('Lalka Prus')}`);
        const j = await r.json();
        w.classList.remove('ladowanie');
        if (Array.isArray(j.wyniki)) { w.innerHTML = `<span class="ok">${I.check}Działa! Ceneo zwróciło ${ile(j.wyniki.length, ['ofertę', 'oferty', 'ofert'])}.</span>`; konfetti({ ile: 60 }); lsSet('zakladka-ceny-dzien', null); }
        else w.innerHTML = '<span class="zle">Worker wciąż ma starą wersję. Sprawdź, czy kliknąłeś Deploy po wklejeniu kodu.</span>';
      } catch { w.classList.remove('ladowanie'); w.innerHTML = '<span class="zle">Worker nie odpowiada. Sprawdź adres w Ustawieniach → Wyszukiwanie książek.</span>'; }
    }
  });
}

/* ================= kategorie w Bibliotece (2.13) ================= */
function htmlFiltraKategorii(lista) {
  const licz = {};
  for (const k of lista) for (const c of kategorieKsiazki(k)) licz[c] = (licz[c] || 0) + 1;
  const dostepne = KATEGORIE.filter(c => licz[c.id]);
  if (!dostepne.length) return '';
  if (U.kategoria && !licz[U.kategoria]) U.kategoria = null;
  return `<div class="kat-filtr" role="group" aria-label="Kategorie">${dostepne.map(c => `<button type="button" class="kat-chip${U.kategoria === c.id ? ' wybrany' : ''}" data-akcja="kategoria" data-kat="${c.id}" aria-pressed="${U.kategoria === c.id}"><span>${c.emoji}</span>${c.nazwa}<small>${licz[c.id]}</small></button>`).join('')}</div>`;
}
function htmlWyboruKategorii(k) {
  const wyb = kategorieKsiazki(k);
  return `<fieldset class="kat-wybor"><legend>Kategorie <span class="cichy">(do 3; puste = rozpoznam same z gatunku)</span></legend>
    ${KATEGORIE.map(c => `<label class="kat-opcja"><input type="checkbox" name="kat" value="${c.id}"${wyb.includes(c.id) ? ' checked' : ''}><span>${c.emoji} ${c.nazwa}</span></label>`).join('')}</fieldset>`;
}

/* ================= wiele list życzeń (2.13) ================= */
const EMOJI_LIST = ['📚', '🎁', '🎄', '🎂', '💸', '⭐', '🐉', '🔍', '❤️', '🏖️', '🎓', '🧸'];
function htmlListZyczen() {
  const listy = Z.ustawienia.listyZyczen, wszystkie = listaZyczen();
  if (U.listaZ && !listy.some(l => l.id === U.listaZ)) U.listaZ = null;
  return `<div class="listy-zycz" role="tablist" aria-label="Listy życzeń">
    <button type="button" class="lista-chip${!U.listaZ ? ' wybrany' : ''}" data-akcja="lista-zycz" data-lista="">Wszystkie <small>${wszystkie.length}</small></button>
    ${listy.map(l => `<button type="button" class="lista-chip${U.listaZ === l.id ? ' wybrany' : ''}" data-akcja="lista-zycz" data-lista="${l.id}">${l.emoji} ${esc(l.nazwa)} <small>${wszystkie.filter(k => k.listy.includes(l.id)).length}</small></button>`).join('')}
    <button type="button" class="lista-chip lista-nowa" data-akcja="lista-edytuj">+ Nowa lista</button>
    ${U.listaZ ? `<button type="button" class="btn-tekst" data-akcja="lista-edytuj" data-id="${U.listaZ}">Zmień listę</button>` : ''}
  </div>`;
}
function arkuszListyZyczen(id = null) {
  const l = id ? Z.ustawienia.listyZyczen.find(x => x.id === id) : null;
  let emoji = l ? l.emoji : '🎁';
  const a = arkusz({
    tytul: l ? 'Zmień listę' : 'Nowa lista życzeń', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <label>Nazwa<input name="nazwa" value="${esc(l ? l.nazwa : '')}" maxlength="40" placeholder="np. Prezent na urodziny, Fantasy do kupienia" required autofocus></label>
      <fieldset class="emoji-wybor"><legend>Ikona</legend>${EMOJI_LIST.map(e => `<button type="button" class="emoji-opcja${e === emoji ? ' wybrany' : ''}" data-emoji="${e}">${e}</button>`).join('')}</fieldset>
      <div class="przyciski przyciski-koniec">${l ? '<button type="button" class="btn btn-ryzyko" data-usun-liste>Usuń listę</button>' : ''}<button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Zapisz</button></div></form>`
  });
  const f = $('form', a.tresc);
  f.addEventListener('click', e => { const b = e.target.closest('[data-emoji]'); if (b) { emoji = b.dataset.emoji; $$('.emoji-opcja', f).forEach(x => x.classList.toggle('wybrany', x === b)); } });
  f.addEventListener('submit', e => {
    e.preventDefault();
    const nazwa = f.elements.nazwa.value.trim();
    if (!nazwa) { f.elements.nazwa.focus(); return; }
    if (l) Object.assign(l, { nazwa, emoji });
    else { const n = { id: noweId(), nazwa, emoji }; Z.ustawienia.listyZyczen.push(n); U.listaZ = n.id; }
    utrwalUstawienia(); a.zamknij(); odswiez();
  });
  $('[data-usun-liste]', f)?.addEventListener('click', async () => {
    if (!(await potwierdz(`Usunąć listę „${esc(l.nazwa)}”? Książki zostaną na liście życzeń.`, { tak: 'Usuń listę', niebezpieczne: true }))) return;
    Z.ustawienia.listyZyczen = Z.ustawienia.listyZyczen.filter(x => x.id !== id);
    const zm = Z.ksiazki.filter(k => k.listy.includes(id)); zm.forEach(k => { k.listy = k.listy.filter(x => x !== id); });
    utrwal(zm); utrwalUstawienia(); U.listaZ = null; a.zamknij(); odswiez();
  });
}
function htmlListKsiazki(k) {
  const listy = Z.ustawienia.listyZyczen;
  return `<div class="ksiazka-listy"><span class="cichy">Na listach:</span>${listy.map(l => `<button type="button" class="lista-chip maly${k.listy.includes(l.id) ? ' wybrany' : ''}" data-przypisz-liste="${l.id}" data-id="${k.id}" aria-pressed="${k.listy.includes(l.id)}">${l.emoji} ${esc(l.nazwa)}</button>`).join('')}
    <button type="button" class="lista-chip maly lista-nowa" data-akcja="lista-edytuj">+ nowa</button></div>`;
}

/* ================= kilka książek bazowych (2.13) ================= */
function blokiBazowych() {
  const bz = bazowe();
  if (!bz.length) return blokBezBazowej();
  return bz.map(blokBazowej).join('') + (bz.length < MAKS_BAZOWYCH
    ? `<p class="bazowa-dodaj"><button type="button" class="btn-tekst" data-akcja="wybierz-bazowa">+ Dodaj kolejną książkę bazową</button> <span class="cichy">(np. druga gruba książka czytana równolegle; maks. ${MAKS_BAZOWYCH})</span></p>` : '');
}

/* ================= Dziś: pora dnia, muzyka, ciekawostki (2.13) ================= */
function poraDnia(h = new Date().getHours()) { return h < 5 ? 'noc' : h < 9 ? 'swit' : h < 17 ? 'dzien' : h < 21 ? 'zmierzch' : 'noc'; }
function scenaPory() {
  // duże, żywe niebo: słońce i księżyc wędrują po łuku zależnie od godziny
  const teraz = new Date(), h = teraz.getHours() + teraz.getMinutes() / 60;
  const p = poraDnia();
  const dzienF = ogranicz((h - 5) / 16, 0, 1); // 5:00 → 21:00
  const nocF = h >= 21 ? (h - 21) / 8 : (h + 3) / 8; // 21:00 → 5:00
  const f = p === 'noc' ? nocF : dzienF;
  const x = (8 + f * 74).toFixed(1), y = (62 - Math.sin(f * Math.PI) * 48).toFixed(1);
  const noc = p === 'noc' || p === 'zmierzch';
  const gwiazdy = noc ? Array.from({ length: 26 }, (_, i) => `<i class="gwiazda" style="--x:${(hash('g' + i) % 100)}%;--y:${(hash('h' + i) % 60)}%;--d:${((hash('d' + i) % 30) / 10).toFixed(1)}s;--r:${1 + hash('r' + i) % 2}px"></i>`).join('') : '';
  const ptaki = p === 'dzien' || p === 'swit' ? '<span class="ptaki"><i></i><i></i><i></i></span>' : '';
  const spadajaca = p === 'noc' ? '<i class="spadajaca"></i>' : '';
  return `<div class="niebo niebo-${p}" aria-hidden="true">${gwiazdy}${spadajaca}
    <span class="cialo" style="left:${x}%;top:${y}%"></span>${ptaki}
    <span class="chmura c1"></span><span class="chmura c2"></span><span class="chmura c3"></span>
    ${krajobrazPory(noc)}
    <span class="pora-etykieta">${{ swit: 'świt', dzien: 'dzień', zmierzch: 'wieczór', noc: 'noc' }[p]}</span></div>`;
}

/** Krajobraz jak w przygodach Sówki: wzgórza i miasteczko z książek (w nocy palą się w nim okna). */
function krajobrazPory(noc) {
  const ksiazki = [[236, 30, 13, '#a3233a'], [251, 40, 11, '#22385c'], [264, 24, 15, '#d9b66e'], [281, 46, 12, '#1f4a3d'], [295, 34, 14, '#7a5218'], [311, 52, 13, '#a3233a'], [326, 28, 12, '#22385c'], [340, 42, 15, '#1f4a3d'], [357, 33, 12, '#d9b66e'], [371, 48, 14, '#7a5218']];
  const baza = 96;
  const grzbiety = ksiazki.map(([x, h, w, k], i) => `<g class="k-ks"><rect x="${x}" y="${baza - h}" width="${w}" height="${h}" rx="2" fill="${k}"/><rect x="${x}" y="${baza - h + 5}" width="${w}" height="2.5" fill="rgba(255,255,255,.28)"/>
    ${noc ? `<rect class="k-okno" style="--d:${(i * .37 % 2).toFixed(2)}s" x="${x + w / 2 - 2}" y="${baza - h + 12}" width="4" height="5" rx="1"/>` : ''}</g>`).join('');
  const drzewa = [[34, 80], [52, 84], [96, 82], [150, 86], [182, 84]].map(([x, y]) => `<path class="k-drzewo" d="M${x} ${y} l7 -18 l7 18z"/>`).join('');
  return `<svg class="krajobraz" viewBox="0 0 400 110" preserveAspectRatio="xMidYMax slice">
    <path class="k1" d="M0 64 C50 46 92 58 140 50 C196 40 236 60 300 50 C344 42 378 50 400 46 V110 H0Z"/>
    ${grzbiety}
    <path class="k2" d="M0 86 C60 72 124 90 192 80 C252 72 322 92 400 84 V110 H0Z"/>${drzewa}
    <path class="k3" d="M0 102 C80 95 160 105 240 99 C310 94 360 101 400 98 V110 H0Z"/></svg>`;
}

const MUZYKA = {
  fantasy: [['Wiedźmin 3 – soundtrack', 'The Witcher 3 soundtrack'], ['Muzyka celtycka do czytania', 'celtic fantasy music for reading'], ['Epickie fantasy ambient', 'fantasy ambient music']],
  scifi: [['Blade Runner 2049 ambient', 'Blade Runner ambient'], ['Space ambient', 'space ambient music'], ['Interstellar – Hans Zimmer', 'Interstellar soundtrack']],
  kryminal: [['Noir jazz', 'noir jazz for reading'], ['Deszczowy jazz w kawiarni', 'rainy jazz cafe'], ['Sherlock – soundtrack', 'Sherlock BBC soundtrack']],
  thriller: [['Mroczny ambient', 'dark ambient music'], ['Suspense – soundtracki', 'suspense film score'], ['Noir jazz', 'noir jazz']],
  horror: [['Dark ambient', 'dark ambient horror'], ['Burza i deszcz', 'thunderstorm sounds'], ['Stranger Things synth', 'stranger things synthwave']],
  romans: [['Romantyczne pianino', 'romantic piano'], ['Acoustic love songs', 'acoustic love songs'], ['Paryska kawiarnia', 'paris cafe music']],
  humor: [['Swing i big band', 'swing music'], ['Wesoły jazz', 'happy jazz'], ['Lo-fi pogodne', 'happy lofi']],
  historia: [['Muzyka średniowieczna', 'medieval music'], ['Barok – Bach, Vivaldi', 'baroque music for reading'], ['Chopin – nokturny', 'Chopin nocturnes']],
  klasyka: [['Chopin – nokturny', 'Chopin nocturnes'], ['Muzyka klasyczna do czytania', 'classical music for reading'], ['Satie – Gymnopédies', 'Erik Satie Gymnopedies']],
  reportaz: [['Lo-fi do skupienia', 'lofi study'], ['Ambient do pracy', 'ambient focus'], ['Szum kawiarni', 'coffee shop ambience']],
  nauka: [['Lo-fi do nauki', 'lofi study'], ['Muzyka alfa do koncentracji', 'focus music alpha'], ['Ambient do pracy', 'deep focus ambient']],
  techniczna: [['Lo-fi do programowania', 'lofi coding'], ['Synthwave do kodowania', 'synthwave coding'], ['Deep focus', 'deep focus music']],
  poezja: [['Pianino solo', 'solo piano'], ['Ludovico Einaudi', 'Ludovico Einaudi'], ['Szum deszczu', 'rain sounds']],
  domyslne: [['Lo-fi do czytania', 'lofi reading'], ['Pianino do czytania', 'piano music for reading'], ['Szum deszczu i kominek', 'rain fireplace sounds']]
};
function htmlMuzyki() {
  const czyt = czytane();
  const kat = czyt.map(kategorieKsiazki).flat().find(c => MUZYKA[c]) || null;
  const pora = poraDnia();
  let lista = [...(MUZYKA[kat] || MUZYKA.domyslne)];
  if (pora === 'noc') lista = [['Spokojne pianino na noc', 'calm night piano'], ...lista.slice(0, 2)];
  const ks = kat ? czyt.find(k => kategorieKsiazki(k).includes(kat)) : czyt[0];
  return `<section class="sekcja muzyka"><div class="sekcja-gora"><h2>🎧 Muzyka do czytania</h2></div>
    <p class="cichy">${ks ? `Pasuje do tego, co czytasz: „${esc(ks.tytul)}”${kat ? ` (${kategoria(kat).nazwa.toLowerCase()})` : ''}` : 'Na dobry początek'}${pora === 'noc' ? '. Wieczorem trochę spokojniej' : ''}.</p>
    <ul class="muzyka-lista">${lista.map(([n, q], i) => `<li style="--i:${i}"><span class="muzyka-nazwa">${esc(n)}</span>
      <a class="btn btn-maly" href="https://open.spotify.com/search/${encodeURIComponent(q)}" target="_blank" rel="noopener">Spotify</a>
      <a class="btn btn-maly" href="https://www.youtube.com/results?search_query=${encodeURIComponent(q)}" target="_blank" rel="noopener">YouTube</a></li>`).join('')}</ul></section>`;
}

const CIEKAWOSTKI = [
  'Henryk Sienkiewicz pisał „Trylogię” w odcinkach do gazet. Czytelnicy pisali do niego listy z prośbą, żeby nie uśmiercał Podbipięty.',
  'Wisława Szymborska opublikowała za życia tylko ok. 350 wierszy. Była bardzo surowa wobec własnych tekstów.',
  'Stanisław Lem przewidział e-booki: w „Powrocie z gwiazd” (1961) opisał „optony”, czyli kryształowe książki czytane na ekranie.',
  'Najdłuższa powieść świata według Księgi Rekordów Guinnessa to „W poszukiwaniu straconego czasu” Prousta, ok. 1,2 miliona słów.',
  '„Pan Tadeusz” to ostatni wielki epos szlachecki. Mickiewicz pisał go na emigracji w Paryżu, tęskniąc za Litwą.',
  'Polska ma pięcioro literackich noblistów: Sienkiewicza (1905), Reymonta (1924), Miłosza (1980), Szymborską (1996) i Tokarczuk (2018).',
  'Andrzej Sapkowski napisał pierwsze opowiadanie o Wiedźminie na konkurs „Fantastyki” w 1986 roku. Zajęło 3. miejsce.',
  'Bolesław Prus naprawdę nazywał się Aleksander Głowacki. „Lalka” ukazywała się w odcinkach w „Kurierze Codziennym” w latach 1887–1889.',
  'Czytanie przez 6 minut może obniżyć poziom stresu nawet o 68%. Tak wyszło w badaniu Uniwersytetu w Sussex z 2009 roku.',
  'Słowo „bibliofil” oznacza miłośnika książek, a „bibliotaf” to ktoś, kto chowa książki i nikomu ich nie pożycza.',
  'Japończycy mają słowo „tsundoku”: kupowanie książek i odkładanie ich na stos bez czytania. Pewnie znasz to uczucie.',
  'Najstarsza zachowana drukowana książka z datą to buddyjska „Diamentowa Sutra” z 868 roku.',
  'Gutenberg wydrukował ok. 180 egzemplarzy swojej Biblii. Do dziś przetrwało 49, z czego 1 jest w Pelplinie.',
  'J.R.R. Tolkien wymyślił języki elfów, zanim napisał „Hobbita”. Mówił, że historie powstały, żeby języki miały w czym żyć.',
  'Agatha Christie to najczęściej tłumaczona autorka na świecie. Jej książki sprzedały się w ok. 2 miliardach egzemplarzy.',
  'Stephen King codziennie pisze ok. 2000 słów, także w święta i urodziny.',
  'Przeciętny czytelnik czyta ok. 200–250 słów na minutę, czyli mniej więcej 30–40 stron na godzinę.',
  'Dostojewski napisał „Gracza” w 26 dni, żeby nie stracić praw do swoich książek. Dyktował go stenotypistce, z którą potem się ożenił.',
  'Mary Shelley miała 18 lat, gdy zaczęła pisać „Frankensteina”, uważanego za jedną z pierwszych powieści science fiction.',
  '„Kordian” Słowackiego jest polemiką z III częścią „Dziadów” Mickiewicza. Rywalizacja obu poetów była legendarna.',
  '„Ferdydurke” Gombrowicza wydano w 1937 roku. Słowo „gęba” w znaczeniu narzuconej nam roli pochodzi właśnie stamtąd.',
  'Ryszard Kapuściński był najczęściej tłumaczonym polskim reporterem. „Cesarz” ukazał się w ponad 20 językach.',
  'Joanna Chmielewska napisała ponad 60 kryminałów i jest uważana za matkę polskiego kryminału z humorem.',
  'Badania sugerują, że czytanie powieści może zwiększać empatię: czytelnicy fikcji lepiej odczytują emocje innych.',
  'Pierwszą powieścią napisaną na maszynie do pisania były prawdopodobnie „Przygody Tomka Sawyera” Marka Twaina.',
  'Hemingway napisał 47 wersji zakończenia „Pożegnania z bronią”. Wszystkie wydano w 2012 roku.',
  'W Islandii co dziesiąta osoba wyda w życiu książkę. Islandczycy mają nawet „Jólabókaflóð”, czyli świąteczną powódź książek.',
  'Biblioteka Kongresu w Waszyngtonie ma ponad 170 milionów pozycji i jest największą biblioteką świata.',
  'Witkacy podpisywał portrety symbolami informującymi, co pił lub zażywał podczas malowania. Pisał też awangardowe powieści.',
  'Zapach starych książek ma nazwę: to wanilina i benzaldehyd z rozkładającego się papieru. Stare książki pachną lekko wanilią i migdałami.',
  '„Zły” Leopolda Tyrmanda (1955) to kultowy kryminał, w którym jednym z bohaterów jest powojenna Warszawa.',
  'Najkrótsze opowiadanie świata przypisywane Hemingwayowi ma 6 słów: „For sale: baby shoes, never worn”.',
  'Bruno Schulz zostawił po sobie tylko dwa zbiory opowiadań. Jego zaginiona powieść „Mesjasz” do dziś jest szukana.',
  'Harry Potter został odrzucony przez 12 wydawnictw, zanim przyjęło go Bloomsbury.',
  '„Quo vadis” przetłumaczono na ponad 50 języków. Właśnie za nią i za całokształt Sienkiewicz dostał Nobla w 1905 roku.',
  'Szacuje się, że od wynalezienia druku wydano ok. 130 milionów różnych tytułów książek.',
  'Czytanie przed snem z papierowej książki pomaga zasnąć szybciej niż czytanie z ekranu, bo nie ma niebieskiego światła.',
  'Słowo „książka” to dawne zdrobnienie od „księga”.',
  'Najdroższą sprzedaną książką jest „Codex Leicester” Leonarda da Vinci. Bill Gates kupił go w 1994 roku za 30,8 mln dolarów.',
  '„Lód” Jacka Dukaja ma ponad 1000 stron. To idealny kandydat na książkę bazową.',
  'Henryk Sienkiewicz dostał Nobla w 1905 roku jako wybitny autor powieści epickich. Na świecie najbardziej znane było „Quo vadis”.',
  'Juliusz Verne opisał lot na Księżyc już w 1865 roku, ponad sto lat przed lądowaniem Apollo 11.',
  'Arthur Conan Doyle uśmiercił Sherlocka Holmesa w 1893 roku, ale czytelnicy tak protestowali, że po latach musiał go wskrzesić.',
  'Lewis Carroll, autor „Alicji w Krainie Czarów”, naprawdę nazywał się Charles Lutwidge Dodgson i był matematykiem w Oksfordzie.',
  'Pierwszy tom „Harry’ego Pottera” odrzuciło kilkanaście wydawnictw, zanim przyjęło go małe wydawnictwo Bloomsbury.',
  'Ernest Hemingway napisał kilkadziesiąt wersji zakończenia „Pożegnania z bronią”, zanim wybrał tę jedną.',
  'Antoine de Saint-Exupéry, autor „Małego Księcia”, był pilotem. Zaginął podczas lotu nad Morzem Śródziemnym w 1944 roku.',
  '„Mały Książę” to jedna z najczęściej tłumaczonych książek świata. Ma przekłady na kilkaset języków i dialektów.',
  'Joseph Conrad, autor „Jądra ciemności”, urodził się jako Józef Teodor Konrad Korzeniowski. Po angielsku zaczął mówić dopiero jako dorosły.',
  'Olga Tokarczuk wydała „Księgi Jakubowe” z numeracją stron od końca, tak jak w księgach hebrajskich.',
  'Czesław Miłosz przez wiele lat wykładał literaturę słowiańską na Uniwersytecie Kalifornijskim w Berkeley.',
  'Jan Brzechwa naprawdę nazywał się Jan Wiktor Lesman i z zawodu był adwokatem od praw autorskich.',
  'Julian Tuwim napisał „Lokomotywę” tak, że jej rytm przypomina rozpędzający się pociąg.',
  'Adam Mickiewicz nigdy w życiu nie był ani w Warszawie, ani w Krakowie. Do Krakowa trafił dopiero po śmierci, na Wawel.',
  'Władysław Reymont, zanim został noblistą, pracował między innymi na kolei i był aktorem w wędrownej trupie.',
  'Tolkien i C. S. Lewis należeli do klubu literackiego Inklingowie i czytali sobie nawzajem fragmenty swoich książek.',
  'George Orwell to pseudonim. Autor „Roku 1984” nazywał się Eric Arthur Blair.',
  'Charles Dickens publikował swoje powieści w odcinkach w czasopismach. Na kolejny odcinek czekało się jak dziś na nowy serial.',
  'Agatha Christie pracowała w szpitalnej aptece. Dlatego tak dobrze znała się na truciznach w swoich kryminałach.',
  'Najstarsze zapisane zdanie po polsku pochodzi z Księgi henrykowskiej z XIII wieku: „Daj, ać ja pobruczę, a ty poczywaj”.',
  'Fiodor Dostojewski był skazany na śmierć. Wyrok zamieniono w ostatniej chwili, gdy stał już przed plutonem egzekucyjnym.',
  'Victor Hugo pisał „Nędzników” z przerwami przez kilkanaście lat.',
  'Hans Christian Andersen bał się, że ktoś pochowa go żywcem. Zostawiał przy łóżku kartkę: „Tylko wyglądam na martwego”.',
  'Bruno Schulz był też świetnym rysownikiem i uczył plastyki w gimnazjum w Drohobyczu.',
  'Wisława Szymborska uwielbiała pisać limeryki i robić kolaże z wycinanek, które wysyłała przyjaciołom jako kartki.',
  'Słowo „robot” wymyślił czeski pisarz Karel Čapek, a dokładniej podsunął mu je brat, Josef.',
  'Za pierwsze opowiadanie detektywistyczne uważa się „Zabójstwo przy rue Morgue” Edgara Allana Poe z 1841 roku.',
  'Ryszard Kapuściński jako korespondent opisał kilkadziesiąt rewolucji i przewrotów na różnych kontynentach.',
  'Stanisław Lem napisał „Solaris” w 1961 roku. Książkę ekranizowano kilka razy, najsłynniej zrobił to Andriej Tarkowski.',
  'Maria Konopnicka napisała słowa „Roty”. Pierwszy raz zaśpiewano ją publicznie w 1910 roku w Krakowie.'
];
function htmlCiekawostki() {
  const n = (hash(dzisISO()) + (U.ciekawostkaPrzes || 0)) % CIEKAWOSTKI.length;
  const ur = U.urodziny;
  if (ur === undefined) wczytajUrodziny();
  return `<section class="sekcja ciekawostki"><div class="sekcja-gora"><h2>✨ Ze świata książek</h2><button type="button" class="btn-tekst" data-akcja="ciekawostka">Kolejna</button></div>
    <blockquote class="ciekawostka" data-ciekawostka>${esc(CIEKAWOSTKI[n])}</blockquote>
    ${ur && ur.length ? `<div class="urodziny"><h3>🎂 Urodzili się ${dataDluga(dzisISO(), false)}</h3><ul>${ur.slice(0, 4).map(x => `<li><a href="https://pl.wikipedia.org/wiki/${encodeURIComponent(x.nazwa.replace(/ /g, '_'))}" target="_blank" rel="noopener"><strong>${esc(x.nazwa)}</strong></a> <span class="cichy">(${x.rok}) ${esc(x.opis)}</span></li>`).join('')}</ul></div>` : ''}
  </section>`;
}
/** Pisarze i poeci urodzeni tego dnia — z polskiej Wikipedii, raz dziennie. */
async function wczytajUrodziny() {
  U.urodziny = null;
  const dzis = dzisISO(), klucz = 'zakladka-urodziny';
  try { const z = JSON.parse(lsGet(klucz) || 'null'); if (z && z.dzien === dzis) { U.urodziny = z.lista; return; } } catch { /* brak */ }
  if (!navigator.onLine) { U.urodziny = []; return; }
  try {
    const d = new Date();
    const tytul = `${d.getDate()} ${['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'][d.getMonth()]}`;
    const r = await fetch(`https://pl.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(tytul)}&format=json&origin=*`);
    const t = Object.values((await r.json()).query.pages)[0].extract || '';
    const i = t.indexOf('Urodzili się'), j = t.indexOf('Zmarli', i);
    const linie = t.slice(i, j > 0 ? j : undefined).split('\n');
    const lista = [];
    let rok = '';
    for (const l of linie) {
      const m = l.match(/^(\d{3,4})\s*[–-]\s*(.+?),\s*(.+?)\s*\(zm\./) || l.match(/^()(.+?),\s*(.+?)\s*\(zm\./);
      const mr = l.match(/^(\d{3,4})\s*[–-]/); if (mr) rok = mr[1];
      if (!m) continue;
      const opis = m[3];
      if (!/pisar|poet|prozai|dramatopis|powieściopis|eseist|reportaż|tłumacz literat/.test(opis)) continue;
      lista.push({ rok: m[1] || rok, nazwa: m[2].trim(), opis: opis.trim(), polski: /polsk/.test(opis) });
    }
    lista.sort((a, b) => b.polski - a.polski || (+b.rok) - (+a.rok));
    U.urodziny = lista.slice(0, 6);
    lsSet(klucz, JSON.stringify({ dzien: dzis, lista: U.urodziny }));
  } catch { U.urodziny = []; }
  if (U.widok === 'dzis') renderWidok();
}

/* ================= niespodzianka: cytat ze zdjęcia strony (OCR) ================= */
let tesseractLadowanie = null;
function zaladujTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (!tesseractLadowanie) tesseractLadowanie = new Promise((ok, nie) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
    s.onload = () => ok(window.Tesseract);
    s.onerror = () => { tesseractLadowanie = null; nie(new Error('Nie udało się pobrać czytnika tekstu. Sprawdź internet.')); };
    document.head.append(s);
  });
  return tesseractLadowanie;
}
/** Rozpoznaje tekst ze zdjęcia strony: łączy przeniesienia, wyłapuje numer strony. */
async function tekstZeZdjecia(plik, naPostep) {
  const T = await zaladujTesseract();
  const { data } = await T.recognize(plik, 'pol', { logger: m => { if (m.status === 'recognizing text') naPostep(Math.round(m.progress * 100)); else naPostep(null, m.status); } });
  const linie = data.text.split('\n').map(l => l.trim()).filter(Boolean);
  let strona = null;
  const bezNumeru = linie.filter((l, i) => { if (/^\d{1,4}$/.test(l) && (i === 0 || i === linie.length - 1)) { strona = +l; return false; } return true; });
  const tekst = bezNumeru.join('\n').replace(/(\p{L})[-­]\n(\p{L})/gu, '$1$2').replace(/\n(?!\n)/g, ' ').replace(/\s{2,}/g, ' ').trim();
  return { tekst, strona, pewnosc: Math.round(data.confidence) };
}

/* ---------- przeniesienie na listę życzeń z wyborem listy (2.14) ---------- */
function arkuszNaListe(id) {
  const k = znajdz(id);
  if (!k) return;
  const listy = Z.ustawienia.listyZyczen;
  const zapisz = wybrane => {
    utrwal(naListeZyczen(k)); k.listy = wybrane; utrwal(k); odswiez();
    toast(`„${k.tytul}” na liście życzeń${wybrane.length ? `: ${wybrane.map(x => (listy.find(l => l.id === x) || {}).nazwa).join(', ')}` : ''}. Sprawdzam ceny…`);
    sprawdzCeny(k, { cicho: true });
  };
  if (!listy.length) { zapisz([]); return; }
  const a = arkusz({
    tytul: 'Na którą listę?', klasa: 'arkusz-maly',
    render: () => `<p class="cichy">„${esc(k.tytul)}” trafi na listę życzeń. Możesz też przypisać ją do swoich list:</p>
      <div class="ksiazka-listy">${listy.map(l => `<label class="kat-opcja"><input type="checkbox" value="${l.id}"${U.listaZ === l.id ? ' checked' : ''}><span>${l.emoji} ${esc(l.nazwa)}</span></label>`).join('')}</div>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-akcja="lista-edytuj">+ Nowa lista</button><button type="button" class="btn btn-glowny" data-ok>Dodaj</button></div>`
  });
  a.tresc.addEventListener('click', e => { if (e.target.closest('[data-ok]')) { const w = $$('input:checked', a.tresc).map(x => x.value); a.zamknij(); zapisz(w); } });
}

/* ---------- aktualizacja i „co nowego” (2.14) ---------- */
async function wymusAktualizacje() {
  toast('Pobieram najnowszą wersję…');
  try {
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for (const k of await caches.keys()) if (k !== 'zakladka-media') await caches.delete(k);
  } catch { /* przeglądarka bez service workera */ }
  lsSet('zakladka-widziana-wersja', null);
  setTimeout(() => location.reload(), 400);
}
const NOWOSCI = [
  ['🌦️', 'Sówka zna pogodę', 'Chmurka w karcie Sówki: podaj miasto, a Sówka powie, jaka jest pogoda i co w taką pogodę czytać. Rano mówi sama.', () => arkuszPogody()],
  ['🧠', 'Analiza twojego czytania', 'Sówka przegląda twoje półki i mówi, co lubisz, kiedy czytasz, czy idziesz z planem i co warto spróbować.', () => analizaSowki()],
  ['🆕', 'Nowości od Sówki', 'Najnowsze polskie książki w gatunkach, które czytasz, z oceną z Lubimyczytać. Sówka wskazuje tę najlepszą.', () => arkuszNowosci()],
  ['💬', 'Sówka pyta i pamięta', 'Sówka zadaje pytania (gdzie czytasz, na co masz ochotę…) i potem do tego wraca.', () => idz('dzis')],
  ['👗', 'Garderoba', '30 rzeczy dla Sówki i Zakładki: czapki, okulary, muszki, peleryna i kolory piór. Kupujesz za listki.', () => arkuszGarderoby()],
  ['🎮', 'Gry: Nocny lot i Quiz', 'Leć Sówką albo Zakładką między regałami albo odpowiedz na pytania o książkach. Za gry są listki.', () => arkuszGier()],
  ['🎤', 'Szybsze dodawanie', 'Dyktowanie tytułu, wklejanie linku z księgarni, ostrzeżenie, że już masz tę książkę, strona, na której jesteś, i „Dodaj i następną”.', () => arkuszFormularza()],
  ['🎭', 'Jaka była ta książka?', 'Po skończeniu zaznaczasz nastroje (wciągająca, zabawna, mroczna…) i tempo akcji. W Statystykach powstaje z tego twój czytelniczy profil.', () => idz('statystyki')],
  ['🔎', 'Szukanie na wszystkich półkach', 'Szukasz w Bibliotece, a pod spodem widzisz pasujące książki z innych półek i cytaty.', () => idz('biblioteka')],
  ['🕰️', 'Kiedy czytasz najlepiej', 'Sesje zapamiętują porę dnia. Statystyki pokazują, kiedy czytasz najwięcej i najszybciej.', () => idz('statystyki')],
  ['📦', 'Kolejka w liczbach i powód porzucenia', 'Ile stron i godzin ma twoja kolejka i kiedy ją skończysz. Porzucając książkę, zapisujesz dlaczego.', () => idz('biblioteka')],
  ['🎭', 'Goście z przygód', 'Smok, Przypis, Bibliotekarz Kurz, Kot Erratum i Wielka Gumka wpadają z wizytą, gadają z Sówką i Zakładką i znikają.', () => wizytaGoscia()],
  ['⭐', 'Recenzja z opiniami z sieci', 'Po dodaniu książki Sówka sprawdza ocenę i opinie czytelników z Lubimyczytać i na tej podstawie ocenia, czy to dobry wybór.', () => idz('biblioteka')],
  ['⏱️', 'Nowa sesja czytania', 'Cel z pierścieniem (też 25 min jak Pomodoro), dźwięki tła: deszcz, kominek, las, kawiarnia, a na koniec podsumowanie z rekordem.', () => idz('dzis')],
  ['🎯', 'Bingo i podsumowanie tygodnia', 'Co miesiąc nowa karta bingo w Statystykach, a w poniedziałek Sówka podsumowuje twój tydzień.', () => idz('statystyki')],
  ['💡', 'Ciekawostki z Wikipedii i 77 żartów', 'Świeże ciekawostki o autorach, których czytasz, i o znanych pisarzach. Żarty i ciekawostki nie powtarzają się, dopóki nie padną wszystkie.', () => opowiedzCiekawostke()],
  ['📕', 'Przygody: sezon 2', '6 nowych rozdziałów (Kot Erratum, Wielka Gumka, zamek bez słów) i więcej scen w starych rozdziałach. Wszystko z głosami.', () => arkuszHistorii()],
  ['🔊', 'Głosy słychać na iPhonie', 'Naprawione odtwarzanie rozmów Sówki i Zakładki, także przy wyciszonym telefonie i bez internetu.', () => sowkaMowi('Hu-hu, pięknie!')],
  ['⏱️', 'Jak często Sówka gada', 'Rzadko, normalnie albo często: ustawisz w Kąciku Sówki. Do tego 14 nowych żartów Sówki i 7 Zakładki.', () => arkuszSklepiku()],
  ['🦉', 'Sówka lata po aplikacji', 'Siada na zakładce, na której jesteś, śledzi palec oczami, komentuje, zasypia, gdy nic nie robisz. Dotknij ją, połaskocz albo przenieś palcem!', () => idz('biblioteka')],
  ['💡', 'Ciekawostki same z siebie', 'Sówka sama opowiada ciekawostki o literaturze swoim głosem, bez klikania.', () => opowiedzCiekawostke()],
  ['🎙️', 'Sówka ma prawdziwy głos', 'Koniec z robotem: Sówka, Zakładka, Narrator i Smok mówią nagranymi głosami (działa offline). Do tego hu-hu, szelest kartek i ba-dum-tss.', () => odtworzRozdzial(0)],
  ['🔞', 'Zakładka bez cenzury', 'Zakładka czasem rzuca swoje żarty, z przekleństwami. Wyłączysz w Kąciku Sówki, Sówka i dźwięk.', () => zartZakladki()],
  ['📚', 'Sówka recenzuje', 'Po dodaniu książki Sówka ją kartkuje, daje ciekawostkę i ocenę. A Zakładka lubi się z nią kłócić.', () => idz('dzis')],
  ['🎬', 'Historia jak w grach', 'Przygody Sówki i Zakładki lecą same: pełny ekran, pasy kinowe, głosy postaci, napisy i muzyka.', () => odtworzRozdzial(0)],
  ['😂', 'Żarty z zaskoczenia', 'Sówka sama wyskakuje z żartem, puentą i pochwałą za zapisane strony. Bez klikania.', () => idz('dzis')],
  ['🎬', 'Przygody Sówki i Zakładki', 'Pokładkowa historia w 10 rozdziałach, które odblokowujesz, czytając. Pierwszy rozdział już czeka!', () => arkuszHistorii()],
  ['😂', 'Sówka gada', 'Żarty (całkiem śmieszne), motywacja i podpowiedź, co czytać. A Zakładka się wtrąca!', () => idz('dzis')],
  ['🦉', 'Sówka', 'Na ekranie Dziś: towarzyszka czytania, bez presji. Dotknij ją! Pod nią: listki 🍃, poziomy, zadania dnia i sklepik.', () => idz('dzis')],
  ['👆', 'Przytrzymaj książkę', 'Przytrzymaj okładkę palcem (na komputerze prawy przycisk), a pojawi się menu: przenieś, usuń z listy, pożycz, usuń…', () => idz('biblioteka')],
  ['🛒', 'Listy przy dodawaniu', 'Dodając książkę na listę życzeń, od razu wybierasz listę, np. „Warto kupić”.', null],
  ['🌅', 'Niebo pory dnia', 'Na ekranie Dziś: świt, słońce wędrujące po niebie, zachód, noc z gwiazdami i spadającą gwiazdą.', () => idz('dzis')],
  ['📋', 'Wiele list życzeń', 'Biblioteka → Lista życzeń → „+ Nowa lista”, np. „🎂 Prezent na urodziny”. ♥ w Odkrywaj trafia od razu na wybraną listę.', () => { U.polka = 'zyczenia'; U.pozyczone = false; idz('biblioteka'); }],
  ['🏷️', 'Kategorie', 'Fantasy, kryminał, komedia i inne: filtr w Bibliotece i propozycje z kategorii w Odkrywaj.', () => idz('biblioteka')],
  ['💸', 'Ceny z Ceneo', 'Lista życzeń sama sprawdza najniższe ceny i zapisuje historię.', () => { U.polka = 'zyczenia'; U.pozyczone = false; idz('biblioteka'); }],
  ['♥', 'Odkrywaj', 'Losuj → Odkrywaj: propozycje po polsku, przesuwasz w prawo albo w lewo.', () => { U.losTryb = 'odkrywaj'; idz('losuj'); }],
  ['📚', 'Kilka książek bazowych', 'Do 3 grubych książek naraz, z normą dzienną liczoną automatycznie.', () => idz('dzis')],
  ['🎧', 'Muzyka i ciekawostki', 'Na ekranie Dziś: muzyka do czytania, ciekawostka dnia, pisarze urodzeni dziś.', () => idz('dzis')],
  ['📷', 'Cytat ze zdjęcia', 'W oknie cytatu: zrób zdjęcie strony, a tekst wpisze się sam.', null]
];
function arkuszCoNowego() {
  lsSet('zakladka-widziana-wersja', WERSJA);
  const a = arkusz({
    tytul: `Co nowego w ${WERSJA}`, klasa: 'arkusz-maly',
    render: () => `<ul class="nowosci">${NOWOSCI.map(([e, t, o, f], i) => `<li style="--i:${i}"><span class="nowosc-e">${e}</span><span class="nowosc-t"><strong>${t}</strong><span>${o}</span></span>${f ? `<button type="button" class="btn btn-maly" data-nowosc="${i}">Pokaż</button>` : ''}</li>`).join('')}</ul>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn btn-glowny" data-zamknij>Super</button></div>`
  });
  a.tresc.addEventListener('click', e => { const b = e.target.closest('[data-nowosc]'); if (b) { a.zamknij(); NOWOSCI[+b.dataset.nowosc][3](); } });
}

/** Listy życzeń w formularzu dodawania (np. „Warto kupić”), z szybkim tworzeniem nowej. */
function htmlListWFormularzu(zaznaczone = new Set(U.listaZ ? [U.listaZ] : [])) {
  const listy = Z.ustawienia.listyZyczen;
  return `<p class="f-listy-tytul">Na które listy życzeń?</p>
    ${listy.length ? `<div class="ksiazka-listy">${listy.map(l => `<label class="kat-opcja"><input type="checkbox" name="lista-f" value="${l.id}"${zaznaczone.has(l.id) ? ' checked' : ''}><span>${l.emoji} ${esc(l.nazwa)}</span></label>`).join('')}</div>` : ''}
    ${listy.some(l => /warto kupi/i.test(l.nazwa)) ? '' : '<button type="button" class="lista-chip maly" data-nowa-lista-f="Warto kupić" data-emoji="🛒">+ 🛒 Warto kupić</button>'}
    <div class="f-nowa-lista"><input data-nazwa-listy-f placeholder="Nowa lista, np. Prezent dla mamy" maxlength="40"><button type="button" class="btn btn-maly" data-nowa-lista-f>Utwórz</button></div>`;
}

/* ================= Sówka: towarzyszka czytania, bez presji (2.15) ================= */
function stanSowki() {
  const m = mapaDni(), dzis = dzisISO(), h = new Date().getHours();
  const strony = m.get(dzis) || 0, cel = dziennyCel(m), s = seriaSzczegoly(m);
  const ost = [...m.keys()].filter(d => m.get(d) > 0).sort().pop();
  const przerwa = ost ? dniMiedzy(ost, dzis) : null;
  const zad = zadaniaDnia(), doOdebrania = zad.filter(z => z.zrobione && !z.odebrane).length;
  const tryb = h >= 23 || h < 6 ? 'spi' : strony >= cel ? 'czyta' : strony > 0 ? 'zadowolona' : 'czeka';
  return { strony, cel, seria: s.dni, przerwa, h, tryb, doOdebrania };
}
function wiadomoscSowki(st) {
  const n = U.sowkaN || 0;
  const wybierz = l => l[(hashTekstu(dzisISO()) + n) % l.length];
  if (st.doOdebrania && n % 3 === 0) return `Psst… masz ${st.doOdebrania === 1 ? 'nagrodę' : `${st.doOdebrania} nagrody`} do odebrania 🍃 Zajrzyj do zadań!`;
  if (st.tryb === 'spi') return wybierz(['Zzz… już śpię. Ty też się wyśpij, książka poczeka do jutra 🌙', 'Zzz… śnię o bibliotece bez końca…', 'Cichutko… Dobranoc! Jutro razem poczytamy.']);
  if (st.przerwa >= 3 && !st.strony) return wybierz([`Hej, tęskniłam! Nic się nie stało, że była przerwa. Może jedna strona na rozgrzewkę?`, 'Witaj z powrotem! Bez presji, nawet 5 minut z książką to już coś miłego.']);
  if (st.tryb === 'czyta') return wybierz([`Cel zrobiony: ${st.strony} stron! Jestem z ciebie dumna 🦉`, 'Ale się dziś naczytałeś! Teraz możesz odpocząć z czystym sumieniem.', `${st.strony} stron! Ja też czytam, zobacz 📖`]);
  if (st.tryb === 'zadowolona') return wybierz([`Już ${st.strony} ${odmiana(st.strony, FORMY_STRON)} dzisiaj. Super! Jeśli masz ochotę, jeszcze trochę.`, 'Fajnie, że dziś czytałeś. Każda strona się liczy 💛', st.seria > 2 ? `${st.seria} dni z rzędu! Ale pamiętaj, odpoczynek też jest ok.` : 'Dobry początek dnia z książką!']);
  if (st.h < 11) return wybierz(['Dzień dobry! Może kilka stron do kawy? ☕ Bez pośpiechu.', 'Poranek z książką to najlepszy poranek. Ale jak nie dziś, to też dobrze.', 'Hu-hu! Masz dziś ochotę na jakąś historię?']);
  if (st.h < 18) return wybierz(['Hej, masz chwilkę? Nawet 5 minut się liczy 📖', 'Przerwa na kilka stron? Ja posiedzę obok.', 'Co tam czytasz? Jestem ciekawa, jak się skończy!']);
  return wybierz(['Wieczór to dobry moment na kilka stron przed snem 🌙', 'Może rozdział do herbaty? A jak jesteś zmęczony, to po prostu odpocznij.', 'Książka i koc? Brzmi jak plan na wieczór 🛋️']);
}

function svgSowki(tryb, zalozone = []) {
  const ma = id => zalozone.includes(id);
  const kol = SKLEP.find(x => x.slot === 'kolor' && x.postac === 's' && ma(x.id));
  const styl = kol ? ` style="--s-cialo:${kol.kolor[0]};--s-brzuch:${kol.kolor[1]};--s-ucho:${kol.kolor[2]}"` : '';
  const oczy = tryb === 'spi'
    ? '<path class="s-zamk" d="M34 44 q8 6 16 0 M60 44 q8 6 16 0"/>'
    : `<g class="s-oko"><circle cx="42" cy="44" r="11" class="s-bialko"/><circle cx="42" cy="45" r="5.5" class="s-zrenica"/><circle cx="44" cy="43" r="1.8" fill="#fff"/></g>
       <g class="s-oko"><circle cx="68" cy="44" r="11" class="s-bialko"/><circle cx="68" cy="45" r="5.5" class="s-zrenica"/><circle cx="70" cy="43" r="1.8" fill="#fff"/></g>
       <rect class="s-powieka" x="30" y="32" width="24" height="24" rx="12"/><rect class="s-powieka" x="56" y="32" width="24" height="24" rx="12"/>`;
  const glowa = ma('czapka') ? '<g class="s-czapka"><path d="M30 26 L55 -18 L80 26z"/><ellipse cx="55" cy="26" rx="30" ry="5"/><circle cx="50" cy="8" r="2" fill="#ffd34d"/><circle cx="60" cy="-2" r="1.6" fill="#ffd34d"/></g>'
    : ma('beret') ? '<g class="s-beret"><ellipse cx="50" cy="22" rx="27" ry="9" fill="#b3263a"/><ellipse cx="50" cy="25" rx="24" ry="4" fill="#8e1c2d"/><path d="M50 13 v-6" stroke="#8e1c2d" stroke-width="3" stroke-linecap="round"/></g>'
    : ma('cylinder') ? '<g class="s-cylinder"><rect x="38" y="-10" width="34" height="34" rx="3" fill="#24201f"/><rect x="38" y="14" width="34" height="5" fill="#b3263a"/><ellipse cx="55" cy="24" rx="29" ry="5" fill="#24201f"/></g>'
    : ma('detektyw') ? '<g class="s-detektyw"><path d="M27 26 q28 -30 56 0z" fill="#8b6a43"/><path d="M27 26 q28 -30 56 0" fill="none" stroke="#6b4f2e" stroke-width="1.5" stroke-dasharray="3 3"/><path d="M80 24 l12 4 l-12 2z" fill="#6b4f2e"/><path d="M30 24 l-12 4 l12 2z" fill="#6b4f2e"/></g>'
    : ma('sluchawki') ? '<g class="s-sluchawki"><path d="M22 46 q0 -40 33 -40 q33 0 33 40" fill="none" stroke="#2b2b33" stroke-width="5"/><rect x="15" y="40" width="12" height="18" rx="5" fill="#e04f5f"/><rect x="83" y="40" width="12" height="18" rx="5" fill="#e04f5f"/></g>'
    : ma('korona') ? '<path class="s-korona" d="M36 24 l4 -16 l8 10 l7 -14 l7 14 l8 -10 l4 16z"/>' : '';
  const naOczach = tryb === 'spi' ? ''
    : ma('okulary') ? '<g class="s-okulary"><circle cx="42" cy="44" r="13"/><circle cx="68" cy="44" r="13"/><path d="M55 44 h0"/></g>'
    : ma('monokl') ? '<g class="s-monokl"><circle cx="68" cy="44" r="13" fill="none" stroke="#c9982f" stroke-width="2.5"/><path d="M80 50 q8 14 -2 30" fill="none" stroke="#c9982f" stroke-width="1.2"/></g>'
    : ma('ciemne') ? '<g class="s-ciemne"><path d="M28 38 h28 v6 q0 12 -14 12 q-14 0 -14 -12z M54 38 h28 v6 q0 12 -14 12 q-14 0 -14 -12z" fill="#1d1d24"/><path d="M28 38 h54" stroke="#1d1d24" stroke-width="3"/><path d="M33 42 l6 -2" stroke="#fff" stroke-width="1.5" opacity=".6"/></g>' : '';
  const szyja = ma('szalik') ? '<g class="s-szalik"><path d="M26 82 q29 12 58 0 l0 7 q-29 12 -58 0z"/><path d="M70 88 l6 16 l7 -3 l-5 -14z"/></g>'
    : ma('muszka') ? '<g class="s-muszka"><path d="M55 84 l-12 -7 v14z M55 84 l12 -7 v14z" fill="#b3263a"/><circle cx="55" cy="84" r="3.2" fill="#8e1c2d"/></g>'
    : ma('medal') ? '<g class="s-medal"><path d="M47 78 l8 14 l8 -14" fill="none" stroke="#2f6fb5" stroke-width="5"/><circle cx="55" cy="96" r="7" fill="#e6b93c" stroke="#b08a22" stroke-width="1.5"/><path d="M55 92 l1.4 3 l3.2 .3 l-2.4 2.1 l.8 3.1 l-3 -1.7 l-3 1.7 l.8 -3.1 l-2.4 -2.1 l3.2 -.3z" fill="#fff6d8"/></g>' : '';
  const obok = ma('kubek') ? '<g class="s-kubek"><rect x="2" y="88" width="16" height="18" rx="3"/><path d="M18 92 q6 0 6 6 q0 5 -6 5" fill="none" stroke-width="2.5"/><path class="s-para" d="M7 84 q-3 -5 0 -10 M12 84 q-3 -5 0 -10" fill="none"/></g>'
    : ma('parasol') ? '<g class="s-parasol"><path d="M2 40 q13 -18 26 0 q-6.5 -4 -13 0 q-6.5 -4 -13 0z" fill="#2f6fb5"/><path d="M15 40 v34 q0 5 -5 5" fill="none" stroke="#5a3a24" stroke-width="2.5" stroke-linecap="round"/></g>'
    : ma('pioro') ? '<g class="s-pioro"><path d="M8 100 q2 -40 22 -56 q-6 26 -20 56z" fill="#f4efe4" stroke="#b9ad97" stroke-width="1"/><path d="M8 100 l14 -40" stroke="#b9ad97" stroke-width="1"/></g>'
    : ma('balon') ? '<g class="s-balon"><path d="M12 64 q4 20 -4 40" fill="none" stroke="#777" stroke-width="1"/><ellipse cx="12" cy="20" rx="12" ry="15" fill="#e04f5f"/><path d="M10 35 l2 4 l2 -4z" fill="#c23b4a"/><ellipse cx="7" cy="14" rx="3" ry="5" fill="#fff" opacity=".45"/><path d="M12 39 q2 12 0 25" fill="none" stroke="#777" stroke-width="1"/></g>' : '';
  return `<svg class="sowka-svg tryb-${tryb}" viewBox="0 0 110 120" aria-hidden="true"${styl}>
    ${ma('lampka') ? '<g class="s-lampka"><path d="M96 70 v34 M88 104 h16" stroke="#7a5218" stroke-width="3"/><path d="M86 70 h20 l-4 -12 h-12z" fill="#d9b66e"/><circle cx="96" cy="74" r="10" class="s-swiatlo"/></g>' : ''}
    ${ma('peleryna') ? '<path class="s-peleryna" d="M30 40 q-22 40 -12 70 q37 10 74 0 q10 -30 -12 -70z" fill="#7a3fb0"/>' : ''}
    <path class="s-ucho" d="M28 26 l-4 -16 l14 10z M82 26 l4 -16 l-14 10z"/>
    <ellipse class="s-cialo" cx="55" cy="62" rx="34" ry="40"/>
    <ellipse class="s-brzuch" cx="55" cy="74" rx="21" ry="24"/>
    <path class="s-piorka" d="M45 66 q5 4 10 0 M55 66 q5 4 10 0 M48 76 q5 4 10 0 M40 76 q4 3 8 0 M58 76 q4 3 8 0 M50 86 q5 4 10 0"/>
    <path class="s-skrz s-skrz-l" d="M22 58 q-8 18 6 34 q4 -18 -6 -34z"/>
    <path class="s-skrz s-skrz-p" d="M88 58 q8 18 -6 34 q-4 -18 6 -34z"/>
    ${oczy}
    <path class="s-dziob" d="M51 54 l4 7 l4 -7z"/>
    <path class="s-nozki" d="M45 101 l-3 5 M48 101 v6 M51 101 l3 5 M59 101 l-3 5 M62 101 v6 M65 101 l3 5"/>
    ${naOczach}${szyja}
    ${ma('kwiat') ? '<g class="s-kwiat"><circle cx="84" cy="26" r="4" fill="#ffd34d"/><circle cx="84" cy="19" r="4.5"/><circle cx="91" cy="25" r="4.5"/><circle cx="88" cy="32" r="4.5"/><circle cx="80" cy="32" r="4.5"/><circle cx="77" cy="25" r="4.5"/></g>' : ''}
    ${glowa}
    ${tryb === 'czyta' ? '<g class="s-ksiazka"><path d="M33 84 q11 -6 22 0 v16 q-11 -6 -22 0z" class="s-ks-l"/><path d="M77 84 q-11 -6 -22 0 v16 q11 -6 22 0z" class="s-ks-p"/></g>' : ''}
    ${obok}
    ${tryb === 'spi' ? '<g class="s-zzz"><text x="84" y="22">z</text><text x="92" y="12">z</text><text x="99" y="3">Z</text></g>' : ''}
  </svg>`;
}

function htmlSowki() {
  const st = stanSowki(), l = listkiStan(), p = poziom(l.razem);
  return `<section class="sowka-karta tryb-${st.tryb}">
    <div class="sowka-scena"><button type="button" class="sowka" data-sowka aria-label="Sówka, twoja towarzyszka czytania. Dotknij, żeby coś powiedziała">${svgSowki(st.tryb, Z.ustawienia.gra.zalozone)}</button>
      <button type="button" class="zakl-postac" data-zakl aria-label="Zakładka, przyjaciółka Sówki">${svgZakladki(st.tryb === 'spi' ? 'spi' : st.tryb === 'czyta' ? 'macha' : 'stoi')}</button>
      <p class="zakl-dymek" data-zakl-dymek hidden></p></div>
    <div class="sowka-dymek">
      <p class="sowka-tekst" data-sowka-tekst>${esc(wiadomoscSowki(st))}</p>
      <div class="sowka-opcje"><button type="button" class="chip-m chip-kino" data-sowka-opcja="historia">🎬 ${st.tryb === 'spi' ? 'Bajka na dobranoc' : 'Przygody Sówki i Zakładki'}${historiaStan().odblokowane > (Z.ustawienia.gra.historiaWidziane || 0) ? ' <b class="kropka">nowy!</b>' : ''}</button></div>
      ${st.tryb !== 'spi' && st.tryb !== 'czyta' && (bazowa() || czytane()[0]) ? `<div class="sowka-akcje"><button type="button" class="btn btn-maly" data-akcja="postep" data-id="${(bazowa() || czytane()[0]).id}">Zapisz strony</button><button type="button" class="btn-tekst" data-akcja="sesja" data-id="${(bazowa() || czytane()[0]).id}">10 minut?</button></div>` : ''}
    </div>
    ${typeof chipySowkiPlus === 'function' ? `<div class="sowka-menu">${chipySowkiPlus()}</div>` : ''}
    <button type="button" class="sowka-pasek" data-akcja="sklepik">
      <span class="listki">🍃 <strong data-licz="${l.saldo}">${l.saldo}</strong></span>
      <span class="poziom-tekst">Poziom ${p.n} · ${esc(p.nazwa)}</span>
      <span class="poziom-pasek"><span style="width:${p.proc.toFixed(1)}%"></span></span>
      <span class="sowka-zad">${st.doOdebrania ? `<b class="kropka">${st.doOdebrania}</b>` : ''}Zadania i sklepik ›</span>
    </button>
  </section>`;
}

function arkuszSklepiku() {
  const a = arkusz({
    tytul: 'Sówka, zadania i sklepik', klasa: 'arkusz-sklepik', odswiezalny: true,
    render: () => {
      const l = listkiStan(), p = poziom(l.razem), g = Z.ustawienia.gra, zad = zadaniaDnia();
      return `<div class="sklep-gora"><div class="sklep-sowka">${svgSowki(stanSowki().tryb === 'spi' ? 'spi' : 'zadowolona', g.zalozone)}</div>
        <div><p class="sklep-saldo">🍃 <strong>${l.saldo}</strong> listków</p><p class="cichy">Poziom ${p.n}: <strong>${esc(p.nazwa)}</strong></p>
        <span class="poziom-pasek duzy"><span style="width:${p.proc.toFixed(1)}%"></span></span><p class="cichy maly">${l.razem - p.prog} / ${p.nast - p.prog} do poziomu ${p.n + 1}</p></div></div>
      <section class="kd-sekcja"><h3>Zadania na dziś</h3><p class="cichy">Bez presji: to tylko miłe dodatki. Nowe zadania jutro.</p>
        <ul class="zadania">${zad.map(z => `<li class="${z.odebrane ? 'odebrane' : z.zrobione ? 'zrobione' : ''}"><span class="zad-znak">${z.odebrane ? '✓' : z.zrobione ? '★' : '○'}</span><span class="zad-nazwa">${esc(z.nazwa)}</span>
          ${z.odebrane ? '<span class="cichy">odebrane</span>' : z.zrobione ? `<button type="button" class="btn btn-maly btn-glowny" data-odbierz="${z.id}">+${z.nagroda} 🍃</button>` : `<span class="zad-nagroda">+${z.nagroda} 🍃</span>`}</li>`).join('')}</ul></section>
      <section class="kd-sekcja"><h3>Sklepik Sówki</h3>
        <div class="sklep-wejscia"><button type="button" class="btn btn-glowny" data-akcja="garderoba">👗 Garderoba Sówki i Zakładki</button><button type="button" class="btn" data-akcja="gry">🎮 Gry z Sówką</button></div>
        <ul class="sklep">${SKLEP.filter(x => x.zuzywalne).map(x => { const ma = !x.zuzywalne && g.kupione.includes(x.id), zal = g.zalozone.includes(x.id); return `<li class="${ma ? 'ma' : ''}"><span class="sklep-e">${x.emoji}</span><span class="sklep-n">${esc(x.nazwa)}${x.zuzywalne ? `<small>ratuje passę, gdy zapomnisz o jednym dniu${(g.zamrozeniaKupione[dzisISO().slice(0, 7)] || 0) ? ` · masz: ${g.zamrozeniaKupione[dzisISO().slice(0, 7)]}` : ''}</small>` : ''}</span>
          ${ma ? `<button type="button" class="btn btn-maly${zal ? ' btn-glowny' : ''}" data-zaloz="${x.id}">${zal ? 'Założone' : 'Załóż'}</button>` : `<button type="button" class="btn btn-maly" data-kup="${x.id}"${l.saldo < x.cena ? ' disabled' : ''}>${x.cena} 🍃</button>`}</li>`; }).join('')}</ul></section>
      <section class="kd-sekcja"><h3>Skąd masz listki</h3><dl class="rekordy">
        <div><dt>Strony (1 za 10)</dt><dd>${l.strony}</dd></div><div><dt>Dni czytania (5 za dzień)</dt><dd>${l.dni}</dd></div>
        <div><dt>Skończone książki (30)</dt><dd>${l.ksiazki}</dd></div><div><dt>Cytaty (3)</dt><dd>${l.cytaty}</dd></div>
        <div><dt>Bonusy za passę</dt><dd>${l.passa}</dd></div><div><dt>Zadania dnia</dt><dd>${l.zadania}</dd></div>
        <div><dt>Gry z Sówką</dt><dd>${l.gra}</dd></div>
        <div><dt>Wydane w sklepiku</dt><dd>−${g.wydane}</dd></div></dl></section>
      <section class="kd-sekcja"><h3>Sówka i dźwięk</h3>
      <label class="przelacznik maly"><input type="checkbox" data-sowka-wl${g.sowka ? ' checked' : ''}><span>Pokazuj Sówkę na ekranie Dziś</span></label>
      <label class="przelacznik maly"><input type="checkbox" data-gra-opcja="zarty"${g.zarty ? ' checked' : ''}><span>Żarty i teksty z zaskoczenia</span></label>
      <div class="czestosc"><span>Jak często Sówka sama gada (żarty, ciekawostki):</span><div class="segment-mini">${Object.entries(CZESTOSC_GADANIA).map(([k, v]) => `<button type="button" class="chip-m${(g.czestosc || 'normalnie') === k ? ' akt' : ''}" data-czestosc="${k}" title="${v.opis}">${v.nazwa}</button>`).join('')}</div><small class="cichy">${CZESTOSC_GADANIA[g.czestosc || 'normalnie'].opis}, tylko gdy korzystasz z aplikacji. Zawsze możesz ją też dotknąć.</small></div>
      <label class="przelacznik maly"><input type="checkbox" data-gra-opcja="glosSowki"${g.glosSowki ? ' checked' : ''}><span>Sówka i Zakładka mówią swoimi głosami</span></label>
      <label class="przelacznik maly"><input type="checkbox" data-gra-opcja="zakladka18"${g.zakladka18 ? ' checked' : ''}><span>Zakładka bez cenzury (żarty 18+, przeklina) 🔞</span></label>
      <label class="przelacznik maly"><input type="checkbox" data-gra-opcja="dzwieki"${g.dzwieki ? ' checked' : ''}><span>Efekty dźwiękowe (hu-hu, kartki, ba-dum-tss)</span></label>
      <label class="przelacznik maly"><input type="checkbox" data-gra-opcja="glos"${g.glos ? ' checked' : ''}><span>Głosy w historii</span></label>
      <label class="przelacznik maly"><input type="checkbox" data-gra-opcja="muzyka"${g.muzyka ? ' checked' : ''}><span>Muzyka w historii</span></label>
      <div class="przyciski"><button type="button" class="btn btn-maly" data-test-glosu>🔊 Sprawdź głos</button><span class="cichy maly" data-test-glosu-wynik></span></div>
      <p class="cichy maly">Głosy postaci są nagrane w aplikacji (działają bez internetu). Teksty, które się zmieniają, postaci „gaworzą” jak w grach.</p>
      <div class="przyciski"><button type="button" class="btn btn-maly" data-test-zartu>😂 Opowiedz żart teraz</button></div></section>`;
    }
  });
  a.tresc.addEventListener('click', e => {
    const o = e.target.closest('[data-odbierz]');
    if (o) {
      const d = dzisISO(), g = Z.ustawienia.gra;
      g.zadania[d] = [...new Set([...(g.zadania[d] || []), o.dataset.odbierz])];
      utrwalUstawienia(); lecaceListki(o); konfetti({ ile: 40 }); odswiez();
      return;
    }
    if (e.target.closest('[data-test-glosu]')) {
      const w = $('[data-test-glosu-wynik]', a.tresc);
      Glos.odblokuj(); Glos.stan = 'czekam…';
      w.textContent = 'Sówka mówi…';
      Glos.mow('Hu-hu, pięknie!', 's', { wl: true });
      setTimeout(() => {
        const g = Z.ustawienia.gra;
        w.textContent = !Glos.paczka ? 'Brak pliku audio/glosy.json albo paczki z nagraniami. Sprawdź, czy folder audio jest na GitHubie.'
          : `${Glos.stan || 'bez odpowiedzi'}${g.glosSowki ? '' : ' · wyłączone „mówią swoimi głosami”'}. Jeśli jest „gra”, a nic nie słychać, podgłośnij telefon.`;
      }, 1500);
      return;
    }
    const cz = e.target.closest('[data-czestosc]');
    if (cz) { Z.ustawienia.gra.czestosc = cz.dataset.czestosc; utrwalUstawienia(); odswiez(); return; }
    const k = e.target.closest('[data-kup]');
    if (k) {
      const w = kup(k.dataset.kup);
      if (w.blad) { toast(w.blad, { typ: 'blad' }); return; }
      utrwalUstawienia(); konfetti({ ile: 60 }); odswiez();
      toast(`${w.p.emoji} ${w.p.nazwa}${w.p.zuzywalne ? ': passa jest bezpieczniejsza w tym miesiącu.' : ': Sówka już to ma na sobie!'}`);
      return;
    }
    const z = e.target.closest('[data-zaloz]');
    if (z) { zaloz(z.dataset.zaloz); utrwalUstawienia(); odswiez(); }
  });
  a.tresc.addEventListener('change', e => {
    if (e.target.matches('[data-sowka-wl]')) { Z.ustawienia.gra.sowka = e.target.checked; utrwalUstawienia(); odswiez(); }
    if (e.target.dataset.graOpcja) { Z.ustawienia.gra[e.target.dataset.graOpcja] = e.target.checked; utrwalUstawienia(); if (e.target.dataset.graOpcja === 'glosSowki' && e.target.checked) { Glos.odblokuj(); Glos.mow('Hu-hu, pięknie!', 's'); } if (e.target.dataset.graOpcja === 'dzwieki' && e.target.checked) Fx.graj('huhu'); if (e.target.dataset.graOpcja === 'zakladka18' && e.target.checked) { Glos.odblokuj(); Glos.mow('E-book. Kurwa, bezrobocie.', 'z'); } }
  });
  a.tresc.addEventListener('click', e => { if (e.target.closest('[data-test-zartu]')) { Glos.odblokuj(); a.zamknij(); const [x, y] = losowyZart(); setTimeout(() => sowkaMowi(x, { puenta: y }), 350); } });
}

/** Listki lecą od przycisku do licznika. */
function lecaceListki(z) {
  if (bezRuchu()) return;
  const r = z.getBoundingClientRect();
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('span');
    s.className = 'listek-lot'; s.textContent = '🍃';
    s.style.left = `${r.left + r.width / 2}px`; s.style.top = `${r.top}px`;
    s.style.setProperty('--dx', `${(Math.random() - .5) * 160}px`); s.style.setProperty('--d', `${i * 50}ms`);
    document.body.append(s);
    setTimeout(() => s.remove(), 1400);
  }
}

document.addEventListener('click', e => {
  const s = e.target.closest('[data-sowka]');
  if (!s) return;
  U.sowkaN = (U.sowkaN || 0) + 1;
  Glos.odblokuj();
  s.classList.remove('skok'); void s.offsetWidth; s.classList.add('skok');
  if (navigator.vibrate) navigator.vibrate(12);
  Fx.graj('huhu');
  const teraz = Date.now();
  U.kartaKlik = [...(U.kartaKlik || []).filter(x => teraz - x < 2600), teraz];
  if (U.kartaKlik.length >= 3) {
    const l = losuj(SOWA_TEKSTY.laskotki);
    pokazDymek(l, { klasa: 'smieje' }); mowWKarcie(l, 's');
    if (U.kartaKlik.length >= 5) serduszka();
    return;
  }
  clearTimeout(U.kartaTimer);
  U.kartaTimer = setTimeout(() => {
    if ((U.kartaKlik || []).length >= 3) return;
    const n = U.sowkaN;
    // na zmianę: co u ciebie (w karcie), ciekawostka albo żart (Sówka wylatuje z karty i opowiada)
    if (n % 4 === 0 && typeof gadkaSowkiPlus === 'function' && gadkaSowkiPlus()) return;
    if (n % 3 === 1) {
      const m = wiadomoscSowki(stanSowki());
      pokazDymek(m, { klasa: 'skacze' }); mowWKarcie(m, 's');
    } else if (n % 3 === 2) opowiedzCiekawostke();
    else { const [a, b] = losowyZart(); sowkaMowi(a, { puenta: b }); }
  }, 420);
});

/* ================= menu po przytrzymaniu książki (2.15) ================= */
/** Animacja zniknięcia kafelka, potem akcja (np. usunięcie, przeniesienie). */
function animujZnikniecie(id, fn, kierunek = 'znika') {
  const el = !bezRuchu() && $(`#widok [data-akcja="ksiazka"][data-id="${CSS.escape(id)}"]`);
  const li = el && (el.closest('li') || el);
  if (!li) { fn(); return; }
  li.classList.add(kierunek);
  setTimeout(fn, 260);
}

/** Zmiana półki z cofnięciem: zapisuje stan sprzed zmiany. */
function zmienZCofnieciem(k, zmiana, komunikat) {
  const przed = JSON.parse(JSON.stringify(k));
  animujZnikniecie(k.id, () => {
    utrwal(zmiana(k));
    odswiez();
    toast(komunikat, { akcja: 'Cofnij', onAkcja: () => { Object.keys(k).forEach(x => delete k[x]); Object.assign(k, przed); utrwal(k); odswiez(); } });
  }, 'odlatuje');
}

function menuKsiazki(id) {
  const k = znajdz(id);
  if (!k) return;
  const lista = U.widok === 'biblioteka' && U.polka === 'zyczenia' && U.listaZ ? Z.ustawienia.listyZyczen.find(l => l.id === U.listaZ) : null;
  const poz = [];
  const dodaj = (ikona, tekst, akcja, opcje = {}) => poz.push({ ikona, tekst, akcja, ...opcje });
  dodaj('📖', 'Otwórz', 'otworz');
  if (k.status === 'czytam') { dodaj('➕', 'Zapisz postęp', 'postep'); dodaj('⏱️', 'Sesja czytania', 'sesja'); dodaj('✅', 'Skończona', 'skonczona'); dodaj('🕓', 'Odłóż na później', 'pozniej'); }
  if (k.status === 'doPrzeczytania') { dodaj('▶️', 'Zacznij czytać', 'zacznij'); dodaj('⬆️', 'Na początek kolejki', 'poczatek'); dodaj('🗓️', 'Na ten tydzień', 'tydzien'); dodaj('🕓', 'Na później', 'pozniej'); dodaj('♥', 'Na listę życzeń', 'zyczenia'); }
  if (k.status === 'pozniej') { dodaj('▶️', k.strona ? 'Wróć do czytania' : 'Zacznij czytać', 'zacznij'); dodaj('📚', 'Do kolejki', 'kolejka'); }
  if (k.status === 'zyczenia') {
    dodaj('🛍️', 'Mam ją (kupiona / prezent)', 'mam');
    dodaj('💸', 'Sprawdź ceny', 'ceny');
    if (lista) dodaj('➖', `Usuń z listy „${lista.nazwa}”`, 'zListy', { klasa: 'ryzyko-lekkie' });
    dodaj('📋', 'Listy, na których jest…', 'listy');
    dodaj('🕓', 'Na później', 'pozniej');
  }
  if (k.status === 'przeczytana') { dodaj('⭐', 'Oceń', 'otworz'); dodaj('💬', 'Dodaj cytat', 'cytat'); dodaj('🔁', 'Przeczytaj ponownie', 'ponownie'); }
  if (k.status === 'porzucona') dodaj('▶️', 'Wróć do czytania', 'zacznij');
  if (k.status !== 'przeczytana') dodaj('🎲', k.pula ? 'Wyjmij z puli losowania' : 'Do puli losowania', 'pula');
  dodaj('✏️', 'Edytuj', 'edytuj');
  if (k.status !== 'zyczenia' && k.status !== 'przeczytana') dodaj('🤝', k.pozyczona ? 'Pożyczka…' : 'Pożycz / z biblioteki', 'pozyczka');
  dodaj('🗑️', 'Usuń z biblioteki', 'usun', { klasa: 'ryzyko' });

  const a = arkusz({
    tytul: k.tytul, ukryjTytul: true, klasa: 'arkusz-maly arkusz-menu',
    render: () => `<div class="menu-ks">${okladka(k, 's')}<span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">${esc(statusKsiazki(k))}</span></span></div>
      <ul class="menu-lista">${poz.map((p, i) => `<li style="--i:${i}"><button type="button" class="menu-poz ${p.klasa || ''}" data-menu="${p.akcja}"><span class="menu-ik">${p.ikona}</span>${esc(p.tekst)}</button></li>`).join('')}</ul>`
  });
  a.tresc.addEventListener('click', async e => {
    const b = e.target.closest('[data-menu]');
    if (!b) return;
    const co = b.dataset.menu;
    a.zamknij();
    await new Promise(r => setTimeout(r, 120));
    const D = { id: k.id };
    switch (co) {
      case 'otworz': arkuszKsiazki(k.id); break;
      case 'postep': AKCJE.postep(D); break;
      case 'sesja': AKCJE.sesja(D); break;
      case 'skonczona': AKCJE.skonczona(D); break;
      case 'cytat': AKCJE['cytat-dodaj'](D); break;
      case 'edytuj': AKCJE.edytuj(D); break;
      case 'pozyczka': AKCJE.pozyczka(D); break;
      case 'mam': AKCJE['mam-ja'](D); break;
      case 'ceny': sprawdzCeny(k); break;
      case 'listy': arkuszNaListe(k.id); break;
      case 'zyczenia': zmienZCofnieciem(k, naListeZyczen, `„${k.tytul}” na liście życzeń.`); break;
      case 'tydzien': AKCJE['do-tygodnia'](D); break;
      case 'poczatek': utrwal(naPoczatekKolejki(k)); odswiez(); toast('Na początku kolejki.'); break;
      case 'kolejka': zmienZCofnieciem(k, x => doKolejki(x), `„${k.tytul}” wraca do kolejki.`); break;
      case 'pozniej': zmienZCofnieciem(k, odlozNaPozniej, `„${k.tytul}” odłożona na później.`); break;
      case 'zacznij': zmienZCofnieciem(k, zacznijCzytac, `Zaczynasz „${k.tytul}”.`); break;
      case 'ponownie': utrwal(czytajPonownie(k)); odswiez(); toast(`Czytasz „${k.tytul}” jeszcze raz.`); break;
      case 'pula': k.pula = !k.pula; utrwal(k); odswiez(); toast(k.pula ? 'W puli losowania.' : 'Wyjęta z puli losowania.'); break;
      case 'zListy': {
        const przed = [...k.listy];
        animujZnikniecie(k.id, () => { k.listy = k.listy.filter(x => x !== lista.id); utrwal(k); odswiez(); toast(`Usunięto z listy „${lista.nazwa}”. Książka zostaje na liście życzeń.`, { akcja: 'Cofnij', onAkcja: () => { k.listy = przed; utrwal(k); odswiez(); } }); });
        break;
      }
      case 'usun': animujZnikniecie(k.id, () => usunKsiazke(k.id)); break;
    }
  });
}

/* przytrzymanie palcem (telefon) albo prawy przycisk myszy (komputer) */
(() => {
  let timer = null, start = null, el = null;
  const anuluj = () => { clearTimeout(timer); timer = null; if (el) el.classList.remove('wcisk'); el = null; };
  document.addEventListener('pointerdown', e => {
    const t = e.target.closest('#widok [data-akcja="ksiazka"][data-id]');
    if (!t || e.button > 0) return;
    el = t; start = { x: e.clientX, y: e.clientY };
    el.classList.add('wcisk');
    timer = setTimeout(() => {
      const id = t.dataset.id;
      anuluj();
      U.dlugiePrzytrzymanie = Date.now();
      if (navigator.vibrate) navigator.vibrate(18);
      menuKsiazki(id);
    }, 480);
  });
  document.addEventListener('pointermove', e => { if (timer && start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 9) anuluj(); }, { passive: true });
  ['pointerup', 'pointercancel', 'scroll'].forEach(n => document.addEventListener(n, () => { if (timer) anuluj(); }, { passive: true, capture: true }));
  // po przytrzymaniu nie otwieraj od razu szczegółów (to byłby „klik”)
  document.addEventListener('click', e => {
    // blokujemy tylko „klik” po puszczeniu palca na okładce, nie kliknięcia w samym menu
    if (U.dlugiePrzytrzymanie && Date.now() - U.dlugiePrzytrzymanie < 700 && !e.target.closest('.arkusz')) { e.stopPropagation(); e.preventDefault(); U.dlugiePrzytrzymanie = 0; }
  }, true);
  document.addEventListener('contextmenu', e => {
    const t = e.target.closest('#widok [data-akcja="ksiazka"][data-id]');
    if (!t) return;
    e.preventDefault();
    if (U.dlugiePrzytrzymanie && Date.now() - U.dlugiePrzytrzymanie < 1200) return; // Android: menu już otwarte przez przytrzymanie
    anuluj(); U.dlugiePrzytrzymanie = Date.now(); menuKsiazki(t.dataset.id);
  });
})();

/* ================= świat Sówki i Zakładki (2.16) ================= */
// [pytanie albo pierwsza część, puenta] — puenta odsłania się po kliknięciu „No i?”
const ZARTY = [
  ['Czytam książkę o antygrawitacji.', 'Nie mogę jej odłożyć.'],
  ['Kupiłam poradnik „Jak rozwiązać połowę swoich problemów”.', 'Kupiłam dwa.'],
  ['— Poproszę książkę o paranoi.', '— A kto pyta?!'],
  ['Mój wujek czyta tylko książki o drabinach.', 'Mówi, że to literatura z wyższej półki.'],
  ['Słownik to jedyne miejsce, gdzie „lenistwo” jest przed „pracą”.', 'I wcale nie zamierzam tego zmieniać.'],
  ['Najkrótszy horror bibliofila?', '„Pożyczysz mi tę książkę? Oddam!”'],
  ['Sowa, która nie czyta…', '…to po prostu kura z dobrym PR-em.'],
  ['Czytam tak wolno…', '…że autor zdążył napisać kolejny tom.'],
  ['— Ile książek przeczytałaś w tym roku?', '— Wszystkie pierwsze rozdziały.'],
  ['Mam w domu 300 nieprzeczytanych książek.', 'To nie bałagan. To plan emerytalny.'],
  ['Tsundoku to kupowanie książek szybciej, niż się je czyta.', 'Jestem mistrzynią Polski. Trzy razy z rzędu.'],
  ['— Doktorze, nie mogę przestać czytać!', '— Spokojnie, to tylko faza. Rozdziałowa.'],
  ['Zrobiłam zakładkę w stylu ninja.', 'Niestety nie wiem, gdzie jest.'],
  ['Mówią, że czytanie przed snem pomaga zasnąć.', 'Po „jeszcze tylko jednym rozdziale” widziałam świt. Trzy razy.'],
  ['— Dlaczego kryminał nie mógł zasnąć?', '— Bo miał za dużo wątków.'],
  ['Bibliotekarka: — Ta książka jest przetrzymana pół roku!', 'Czytelnik: — Wiem. Czytałem ją bardzo, bardzo uważnie.'],
  ['— Czemu sowy nie chodzą do biblioteki w dzień?', '— Bo wypożyczają tylko nocne wydania.'],
  ['E-booki są super.', 'Tylko trudno nimi przytrzymać drzwi.'],
  ['Moja dieta: zero cukru, zero glutenu…', '…ale 300 stron dziennie.'],
  ['— Sówko, ile masz lat?', '— Według Wikipedii? Zależy, którą wersję edytowano ostatnio.'],
  ['Kupiłam książkę „Jak przestać odkładać rzeczy na później”.', 'Przeczytam ją jutro.'],
  ['Przeczytałam książkę o historii kleju.', 'Nie mogłam się od niej oderwać.'],
  ['— Zakładko, dlaczego jesteś taka zmęczona?', '— Bo trzymam miejsce od trzech miesięcy. Nikt mnie nie zmienia!'],
  ['Co mówi sowa, gdy skończy książkę?', 'Hu-hu! Znaczy: kto mi pożyczy drugi tom?'],
  ['Dlaczego Sówka nie czyta horrorów w nocy?', 'Bo w nocy to ona jest horrorem. Dla myszy.'],
  ['Mój plan czytelniczy jest bardzo prosty.', 'Poniedziałek: kupuję książkę. Od wtorku do niedzieli: patrzę na nią z miłością.'],
  ['Przeczytałam „Wojnę i pokój” w jeden weekend.', 'No dobra. Opis z tyłu okładki. Ale z uczuciem!'],
  ['Lekarz kazał mi się więcej ruszać.', 'Więc teraz przewracam strony dwa razy szybciej.'],
  ['Kupiłam nowy regał na książki.', 'Teraz potrzebuję drugiego. Na książki, które kupiłam przy okazji kupowania regału.'],
  ['— Sówko, czemu czytasz kryminał od końca?', '— Bo nie lubię niespodzianek. Lubię wiedzieć, komu nie ufać.'],
  ['Moja ulubiona pozycja do czytania?', 'Leżąca. Z kocem. A po trzech stronach: śpiąca.'],
  ['Słyszałeś o bibliotekarzu, który został didżejem?', 'Puszczał same ciche hity.'],
  ['Ile książek zmieści się w plecaku?', 'Zawsze o jedną więcej, niż myślisz.'],
  ['Wiesz, czemu poeci są tacy smutni?', 'Bo do słowa „szczęście” nie ma dobrego rymu.'],
  ['— Ile czasu zajmie ci ta książka?', '— Trzy dni czytania i dwa lata leżenia na szafce nocnej.'],
  ['Czemu słownik nigdy się nie nudzi?', 'Bo ma słowa na każdą okazję. Nawet na nudę.'],
  ['Książki są jak sowy.', 'Najmądrzejsze otwierają się w nocy.'],
  ['Dlaczego książka kucharska była smutna?', 'Bo miała mnóstwo przepisów, a żadnego życia osobistego.'],
  ['Co powiedziała jedna półka do drugiej?', 'Nie przejmuj się, wszystko się jakoś ułoży. Alfabetycznie.'],
  ['Czemu e-book nie chodzi na imprezy?', 'Bo zawsze kończy mu się bateria przed północą.'],
  ['— Czemu znowu czytasz po nocy? — pyta mama.', '— Bo w dzień książka udaje, że jest zwykłym przedmiotem.'],
  ['Jaka jest ulubiona litera sowy?', 'H. Bo bez niej zostaje samo „u-u”.'],
  ['Dlaczego słownik to najlepszy przyjaciel?', 'Bo zawsze ma dla ciebie dobre słowo.'],
  ['Co robi pisarz, kiedy jest mu zimno?', 'Siada w kącie. Tam jest dziewięćdziesiąt stopni.'],
  ['Dlaczego atlas jest taki pewny siebie?', 'Bo wie, gdzie jest jego miejsce na świecie.'],
  ['Kupiłam książkę o lęku wysokości.', 'Stoi na najniższej półce. Tak na wszelki wypadek.'],
  ['Wiesz, jak kończy się każdy kryminał w księgarni?', 'Ktoś zagląda na ostatnią stronę, zanim go kupi.'],
  ['Mój kalendarz jest pełen.', 'Od poniedziałku do niedzieli: jeszcze jeden rozdział.'],
  ['Co mówi bibliotekarka do głośnego czytelnika?', 'Ciii. Tu nawet przecinki robią pauzę.'],
  ['Dlaczego książka nie gra w chowanego?', 'Bo zawsze ją znajdą po zakładce.'],
  ['Spytałam audiobooka, czy mnie słyszy.', 'Odpowiedział, że to on tu mówi.'],
  ['Czym się różni optymista od pesymisty?', 'Pesymista mówi: gorzej być nie może. Optymista: może, zostało jeszcze czterysta stron.'],
  ['Moja biblioteczka ma trzy rodzaje książek.', 'Przeczytane, do przeczytania i takie, które udają, że ich nie widzę.'],
  ['Dlaczego Sówka nosi okulary do czytania?', 'Bo bez nich litery robią „hu-hu” i uciekają.'],
  ['Co mówi zeszyt do książki?', 'Ty to masz dobrze. Ciebie ktoś napisał do końca.'],
  ['Jak nazwać książkę, która ciągle płacze?', 'Tom łez.'],
  ['Dlaczego szkielet nie czyta horrorów?', 'Bo nie ma serca do takich historii.'],
  ['— Macie jakąś książkę o bumerangach?', '— Mieliśmy, ale ciągle do nas wraca.'],
  ['Czemu długopis nie lubi ołówka?', 'Bo ołówek wszystko może wymazać, a długopis musi żyć z konsekwencjami.'],
  ['Wiesz, jaka jest najstraszniejsza książka?', 'Instrukcja składania szafy. Bez obrazków.'],
  ['Dlaczego w bibliotece jest tak cicho?', 'Bo wszystkie książki trzymają język za zębami. Do pierwszej strony.'],
  ['Co jedzą sowy na śniadanie?', 'Płatki z mlekiem i jeden rozdział na deser.'],
  ['Mój pies zjadł mi dwa rozdziały „Pana Tadeusza”.', 'Teraz recytuje Inwokację i nie chce aportować.'],
  ['Czemu matematyk nie czyta powieści?', 'Bo ciągle liczy, ile stron zostało.'],
  ['Wiesz, co jest najtrudniejsze w czytaniu?', 'Powiedzieć sobie „to ostatni rozdział” i w to uwierzyć.'],
  ['Co powiedział pierwszy rozdział do ostatniego?', 'Spotkamy się na końcu. Jeśli czytelnik dotrwa.'],
  ['Sowa i kot czytają razem.', 'Kot śpi na stronie dwunastej, a sowa nie może przewrócić kartki. Typowy wieczór.'],
  ['Dlaczego Sówka zawsze wygrywa w kalambury?', 'Bo przeczytała cały słownik. Dwa razy.'],
  ['— Tato, co to jest biblioteka?', '— Taki internet, tylko z papieru i bez reklam.'],
  ['Wiesz, kiedy książka jest naprawdę dobra?', 'Kiedy kończysz ją o trzeciej w nocy i jesteś zły, że już.'],
  ['Mam problem z odkładaniem książek.', 'Lekarz powiedział, że to nieuleczalne. I kazał mi o tym poczytać.'],
  ['Czemu sowa nie została prawnikiem?', 'Bo zawsze pytała „kto?”, a nigdy „ile płacisz?”.'],
  ['Co robi zakładka na wakacjach?', 'To samo co zawsze. Leży i trzyma miejsce. Tylko na plaży.'],
  ['Dlaczego poeta spóźnił się do pracy?', 'Bo szukał rymu do słowa „budzik”.'],
  ['Jak się nazywa smok, który czyta?', 'Smok wawelski. Bo w wawelskiej bibliotece jest najcieplej.'],
  ['Przeczytałam książkę o złudzeniach optycznych.', 'Albo tak mi się tylko wydaje.'],
  ['Dlaczego książki nigdy nie są samotne?', 'Bo zawsze mają spis treści, a w nim pełno znajomych.']
];
// Zakładka ma swoje kwestie (czasem wtrąca się w rozmowę)
const KWESTIE_ZAKLADKI = [
  'Przeleżałam pół roku na stronie 37. To już nie zakładka, to lokatorka.',
  'Pamiętam, na czym skończyłaś. To moja supermoc!',
  'Wiesz, dlaczego jestem czerwona? Bo widziałam, jak zaginasz rogi stron. 😳',
  'Hej! Może dziś przesuniesz mnie o kilka stron dalej?',
  'Jestem tu, gdyby co. Trzymam miejsce. 🔖',
  'Psst… ta książka ma świetne zakończenie. Ale nic nie mówię!'
];

function motywacja() {
  const m = mapaDni(), dzis = dzisISO(), strony = m.get(dzis) || 0, cel = dziennyCel(m);
  const k = bazowa() || czytane()[0];
  const lin = [];
  if (k) {
    const zost = k.strony - k.strona;
    const wieczory = Math.max(1, Math.ceil(zost / 30));
    lin.push(`Do końca „${k.tytul}” zostało ${ile(zost, FORMY_STRON_D)}. To ${wieczory === 1 ? 'jeden wieczór' : `ok. ${wieczory} wieczorów po 30 stron`}. Dasz radę!`);
    const tempo = tempoKsiazki(k) || tempoOgolne();
    if (tempo) lin.push(`Czytasz ok. ${Math.round(tempo)} stron na godzinę. 15 minut to już ${Math.round(tempo / 4)} stron!`);
  }
  if (strony < cel) lin.push(strony ? `Brakuje ${ile(cel - strony, FORMY_STRON_D)} do celu. Ale cel to nie obowiązek, to podpowiedź. 💛` : 'Wystarczy jedna strona, żeby dzień się liczył. Jedna! Nawet stojąc w kolejce.');
  else lin.push('Cel zrobiony! Każda kolejna strona to już czysta przyjemność.');
  const s = seriaSzczegoly(m);
  if (s.dni > 1) lin.push(`Czytasz ${ile(s.dni, FORMY_DNI)} z rzędu. Jestem dumna, ale bez spiny, odpoczynek też się liczy.`);
  const h = historiaStan();
  if (h.nastepny) lin.push(`Za ${ile(h.doNastepnego, FORMY_STRON_D)} odblokujesz nowy rozdział naszej historii: „${h.nastepny.tytul}”. Ciekawa jestem, co się stanie!`);
  lin.push('Czytanie przez 6 minut potrafi mocno obniżyć stres. To jak drzemka, tylko z fabułą.');
  return lin[(U.sowkaN || 0) % lin.length];
}

function coCzytac() {
  const n = nastepnaKsiazka();
  const k = n ? n.k : null;
  if (!k) return 'Twoja kolejka jest pusta. Zajrzyj do „Losuj → Odkrywaj”, znajdę coś dla ciebie!';
  const krotka = kolejka().filter(x => x.strony < 250)[0];
  return (U.sowkaN || 0) % 2 && krotka && krotka !== k
    ? `Masz ochotę na coś krótkiego? „${krotka.tytul}” ma tylko ${krotka.strony} stron. Idealne na weekend!`
    : `Polecam „${k.tytul}”${k.autor ? ` (${k.autor})` : ''}, bo ${n.powod}. ${k.strony > 500 ? 'Gruba sztuka, ale wiesz… bazowe są dla odważnych.' : 'Wygląda na dobrą zabawę!'}`;
}

/* ---------- Zakładka: animowana postać ---------- */
function svgZakladki(poza = 'stoi', zal = (Z.ustawienia && Z.ustawienia.gra && Z.ustawienia.gra.zalozoneZ) || []) {
  const ma = id => zal.includes(id), kol = SKLEP.find(x => x.slot === 'kolor' && x.postac === 'z' && ma(x.id));
  // 2.21: zakładka z materiału: szew, cień, dziurka ze złotym sznureczkiem i chwostem, większe oczy
  const oczy = poza === 'spi' ? '<path d="M11 29 q4 4 8 0 M21 29 q4 4 8 0" class="z-zamk"/>'
    : poza === 'smutna' ? '<g class="z-oczy"><ellipse cx="15" cy="30" rx="4" ry="4.6" class="z-bialko"/><ellipse cx="25" cy="30" rx="4" ry="4.6" class="z-bialko"/><circle cx="15" cy="31.5" r="2.3" class="z-oko"/><circle cx="25" cy="31.5" r="2.3" class="z-oko"/></g><path d="M11 23.5 l6 2.2 M29 23.5 l-6 2.2" class="z-brew"/>'
    : '<g class="z-oczy"><ellipse cx="15" cy="30" rx="4.2" ry="5" class="z-bialko"/><ellipse cx="25" cy="30" rx="4.2" ry="5" class="z-bialko"/><circle cx="15.6" cy="30.6" r="2.6" class="z-oko"/><circle cx="25.6" cy="30.6" r="2.6" class="z-oko"/><circle cx="16.6" cy="29.2" r="1" fill="#fff"/><circle cx="26.6" cy="29.2" r="1" fill="#fff"/></g><path d="M11 23 q4 -2 7 0 M22 23 q4 -2 7 0" class="z-brew z-brew-luz"/>';
  const usta = poza === 'smutna' ? '<path d="M15.5 42 q4.5 -3.5 9 0" class="z-usta"/>' : poza === 'spi' ? '<ellipse cx="20" cy="40" rx="2" ry="1.5" class="z-oko"/>' : '<path d="M14.5 38 q5.5 6 11 0 z" class="z-usta-otw"/>';
  const dlon = (x, y) => `<circle cx="${x}" cy="${y}" r="2.6" class="z-dlon"/>`;
  const rece = poza === 'macha'
    ? `<g class="z-reka-mach"><path d="M3 46 q-6 -4 -6 -12" class="z-reka"/>${dlon(-3, 33)}</g><path d="M37 46 q5 3 5 9" class="z-reka"/>${dlon(42, 56)}`
    : poza === 'lata' ? `<path d="M3 44 q-8 -2 -10 -8" class="z-reka"/>${dlon(-7, 35)}<path d="M37 44 q8 -2 10 -8" class="z-reka"/>${dlon(47, 35)}`
    : `<path d="M3 46 q-5 3 -5 9" class="z-reka"/>${dlon(-2, 56)}<path d="M37 46 q5 3 5 9" class="z-reka"/>${dlon(42, 56)}`;
  const glowaZ = ma('z-kokarda') ? '<g class="zd-kokarda"><path d="M8 4 l-9 -6 v12z M8 4 l9 -6 v12z" fill="#f27aa6"/><circle cx="8" cy="4" r="2.6" fill="#d14f82"/></g>'
    : ma('z-kapelusz') ? '<g class="zd-kapelusz"><rect x="11" y="-9" width="18" height="12" rx="1.5" fill="#24201f"/><rect x="11" y="-1" width="18" height="2.5" fill="#e6b93c"/><ellipse cx="20" cy="4" rx="15" ry="2.6" fill="#24201f"/></g>'
    : ma('z-korona') ? '<path class="zd-korona" d="M9 5 l2 -11 l5 6 l4 -9 l4 9 l5 -6 l2 11z" fill="#f2c94c" stroke="#b8901f" stroke-width="1"/>' : '';
  const oczyZ = poza === 'spi' ? '' : ma('z-okulary') ? '<g class="zd-okulary" fill="none" stroke="#2a2420" stroke-width="1.4"><circle cx="15" cy="30" r="6"/><circle cx="25" cy="30" r="6"/><path d="M19 29 h2"/></g>'
    : ma('z-ciemne') ? '<g class="zd-ciemne"><path d="M8 26 h12 v3 q0 6 -6 6 q-6 0 -6 -6z M20 26 h12 v3 q0 6 -6 6 q-6 0 -6 -6z" fill="#1d1d24"/></g>' : '';
  const szyjaZ = ma('z-muszka') ? '<g class="zd-muszka"><path d="M20 47 l-7 -4 v8z M20 47 l7 -4 v8z" fill="#2f6fb5"/><circle cx="20" cy="47" r="2" fill="#21528a"/></g>'
    : ma('z-szalik') ? '<g class="zd-szalik"><path d="M3 44 h34 v5 h-34z" fill="#e6b93c"/><path d="M28 48 l3 14 l5 -1 l-3 -13z" fill="#e6b93c"/></g>' : '';
  const ozdobaZ = ma('z-gwiazdki') ? '<g class="zd-gwiazdki" fill="#ffe27a"><path d="M10 60 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 l3 -1z"/><path d="M29 66 l.8 2.4 l2.4 .8 l-2.4 .8 l-.8 2.4 l-.8 -2.4 l-2.4 -.8 l2.4 -.8z"/><circle cx="19" cy="56" r="1"/><circle cx="24" cy="74" r="1"/></g>' : '';
  return `<svg class="zakladka-svg poza-${poza}" viewBox="-12 -6 64 102" aria-hidden="true"${kol ? ` style="--z-cialo:${kol.kolor[0]};--z-cien:${kol.kolor[1]}"` : ''}>
    <g class="z-chwost-g"><path d="M20 9 q12 -10 18 6 q3 8 2 16" class="z-sznurek"/><path d="M37.5 29 h5 l2 12 h-9z" class="z-chwost"/><circle cx="40" cy="29" r="2.4" class="z-chwost-kulka"/></g>
    <g class="z-cialo-g"><path class="z-cialo" d="M6 4 h28 a4 4 0 0 1 4 4 v80 l-18 -13 l-18 13 v-80 a4 4 0 0 1 4 -4z"/>
    <path class="z-cien" d="M27 4 h7 a4 4 0 0 1 4 4 v80 l-11 -8z"/>
    <path class="z-szew" d="M8.5 8.5 h23 v72 l-11.5 -8.4 l-11.5 8.4z"/>
    <circle cx="20" cy="11" r="2.2" class="z-dziurka"/>
    ${rece}${oczy}${usta}<ellipse cx="9.5" cy="37" rx="3" ry="2" class="z-rumieniec"/><ellipse cx="30.5" cy="37" rx="3" ry="2" class="z-rumieniec"/>${oczyZ}${szyjaZ}${ozdobaZ}${glowaZ}</g>
    ${poza === 'spi' ? '<g class="s-zzz"><text x="36" y="16">z</text><text x="42" y="8">z</text></g>' : ''}
  </svg>`;
}

/* ---------- pokładkowa historia: 10 rozdziałów odblokowywanych stronami ---------- */
const HISTORIA = [
  { tytul: 'Spotkanie', progi: 0, klatki: [
    { tlo: 'pokoj', s: [70, 110, 'czyta'], z: null, r: [['💡', 40, 70]], t: 'Pewnej nocy Sówka czytała przy lampce, gdy coś zaszeleściło między stronami…' },
    { tlo: 'pokoj', s: [70, 110, 'czeka'], z: [200, 100, 'macha'], r: [['✨', 190, 80]], t: '— Cześć! Jestem Zakładka. Pilnuję, żebyś nigdy nie zgubiła miejsca w książce.', kto: ['z'] },
    { tlo: 'pokoj', s: [100, 110, 'zadowolona'], z: [190, 100, 'macha'], r: [['💛', 165, 70]], t: '— Hu-hu! Czyli od dziś czytamy razem? — zapytała Sówka.', kto: ['s'] },
    { tlo: 'pokoj', s: [80, 110, 'czeka'], z: [180, 100, 'stoi'], r: [['📚', 270, 100, 50]], t: '— A co ty właściwie robisz? — Trzymam miejsce. Czasem miesiącami. To bardzo odpowiedzialna praca.', kto: ['s', 'z'] },
    { tlo: 'pokoj', s: [90, 110, 'czyta'], z: [170, 115, 'stoi'], r: [['⭐', 300, 50]], t: 'I tak zaczęła się ich przyjaźń. Strona po stronie.' }] },
  { tytul: 'Zgubiona w księdze', progi: 50, klatki: [
    { tlo: 'ksiazka', s: [40, 120, 'czeka'], z: [190, 70, 'stoi'], r: [], t: 'Pewnego dnia Zakładka zajrzała zbyt głęboko w ogromną, starą księgę…' },
    { tlo: 'ksiazka', s: [40, 120, 'czeka'], z: [200, 120, 'lata'], r: [['💨', 230, 110]], t: 'Plusk! Wpadła między rozdziały i zniknęła.' },
    { tlo: 'ksiazka', s: [60, 115, 'czeka'], z: null, r: [['📖', 220, 90, 60], ['🌀', 230, 60]], t: 'Strony zaczęły się kręcić jak karuzela. Rozdział trzeci, rozdział dziewiąty, przypisy…' },
    { tlo: 'ksiazka', s: [120, 110, 'czeka'], z: null, r: [['❓', 200, 70], ['❓', 240, 90]], t: '— Zakładko?! Gdzie jesteś?! — zahuczała Sówka.', kto: ['s'] },
    { tlo: 'ksiazka', s: [170, 60, 'zadowolona'], z: null, r: [['💫', 230, 60]], t: 'Nie było wyjścia. Sówka wzięła głęboki oddech i wskoczyła za nią.' }] },
  { tytul: 'Kraina smoków', progi: 150, klatki: [
    { tlo: 'smok', s: [40, 120, 'czeka'], z: null, r: [['🐉', 250, 90, 70]], t: 'Wylądowała w krainie smoków. Smok ziewnął tak, że zgasły wszystkie pochodnie.' },
    { tlo: 'smok', s: [60, 120, 'zadowolona'], z: null, r: [['🐉', 230, 90, 70], ['🧦', 205, 85]], t: '— Szukam małej, czerwonej zakładki! — Takiej? — smok wyjął coś zza ucha. To była skarpetka.', kto: ['s', 'smok'] },
    { tlo: 'smok', s: [60, 120, 'zadowolona'], z: null, r: [['🐉', 230, 90, 70], ['👉', 180, 60]], t: '— Zakładki zawsze uciekają do kryminałów — mruknął smok. — Tam jest najwięcej tajemnic.', kto: ['smok', 'smok'] },
    { tlo: 'smok', s: [80, 120, 'czyta'], z: null, r: [['🐉', 230, 90, 70], ['📚', 190, 130, 40]], t: '— Czytasz? — zdziwiła się Sówka. — Oczywiście. Smoki śpią na złocie, ale marzą o bibliotekach — odparł smok.', kto: ['s', 'smok'] },
    { tlo: 'smok', s: [150, 110, 'czeka'], z: null, r: [['📄', 240, 60, 40]], t: 'Sówka podziękowała i przewróciła stronę.' }] },
  { tytul: 'Mroczny kryminał', progi: 300, klatki: [
    { tlo: 'deszcz', s: [60, 120, 'czeka'], z: null, r: [['🕯️', 260, 70]], t: 'W mieście kryminałów padał deszcz. Czcionka 10 punktów.' },
    { tlo: 'deszcz', s: [80, 115, 'zadowolona'], z: null, r: [['🎩', 103, 92], ['🔍', 150, 130]], t: 'Sówka założyła kapelusz detektywa. Trop: czerwona nitka na chodniku.' },
    { tlo: 'deszcz', s: [90, 115, 'czeka'], z: null, r: [['🔍', 140, 120], ['🧵', 230, 170]], t: 'Nitka prowadziła przez trzy rozdziały, dwie retrospekcje i jeden zwrot akcji, którego nikt się nie spodziewał.' },
    { tlo: 'deszcz', s: [60, 115, 'czeka'], z: null, r: [['🕵️', 230, 110, 50], ['*', 250, 80, 30]], t: 'Podejrzany numer jeden: Przypis. Zawsze kręci się na dole strony.' },
    { tlo: 'deszcz', s: [60, 115, 'zadowolona'], z: null, r: [['⛵', 240, 120, 44]], t: '— Dobra, przyznam się! Widziałem ją! Popłynęła na morską przygodę!', kto: ['przypis'] }] },
  { tytul: 'Morska przygoda', progi: 500, klatki: [
    { tlo: 'morze', s: [130, 70, 'zadowolona'], z: null, r: [['⛵', 160, 150, 80]], t: 'Sówka wsiadła na papierowy statek złożony z rozdziału siódmego.' },
    { tlo: 'morze', s: [130, 60, 'czeka'], z: null, r: [['🌊', 60, 150, 60], ['🌊', 280, 150, 60], ['⛈️', 70, 50]], t: 'Fale były tak wysokie, że sięgały aż do spisu treści.' },
    { tlo: 'morze', s: [120, 70, 'zadowolona'], z: null, r: [['🐙', 260, 150, 60], ['📖', 230, 110, 30]], t: 'Z wody wynurzyła się ośmiornica, która czytała osiem książek naraz. Po jednej na każdą mackę.' },
    { tlo: 'morze', s: [60, 110, 'zadowolona'], z: null, r: [['🍾', 200, 140, 44], ['📜', 240, 100, 36]], t: 'W butelce był list: „Jestem w kosmosie. Weź kanapki. Z.”' },
    { tlo: 'morze', s: [110, 100, 'czeka'], z: null, r: [['🥪', 200, 120], ['🚀', 270, 60, 44]], t: '— Oczywiście, że w kosmosie — westchnęła Sówka i spakowała kanapki.', kto: ['s'] }] },
  { tytul: 'Kosmiczna strona', progi: 800, klatki: [
    { tlo: 'kosmos', s: [60, 90, 'zadowolona'], z: null, r: [['🪐', 270, 60, 60], ['🚀', 30, 40]], t: 'Na stronie 400 zaczynał się kosmos. Bez grawitacji, za to z przypisami.' },
    { tlo: 'kosmos', s: [60, 100, 'czeka'], z: [240, 60, 'lata'], r: [['🪐', 290, 140, 50]], t: 'I tam była! Zakładka dryfowała obok planety Epilog.' },
    { tlo: 'kosmos', s: [90, 90, 'zadowolona'], z: [200, 80, 'macha'], r: [], t: '— Zakładko! — Sówko! Zgubiłam się, bo ktoś przewrócił pięćdziesiąt stron naraz!', kto: ['s', 'z'] },
    { tlo: 'kosmos', s: [90, 90, 'czeka'], z: [200, 80, 'stoi'], r: [['☄️', 270, 50, 40]], t: '— Jak tu jest? — Cicho, pięknie i nikt nie zagina rogów. Ale tęskniłam za tobą.', kto: ['s', 'z'] },
    { tlo: 'kosmos', s: [120, 90, 'zadowolona'], z: [180, 95, 'stoi'], r: [['💛', 165, 60, 36], ['✨', 100, 50], ['✨', 260, 60]], t: 'Przytuliły się tak mocno, że wszystkie planety zrobiły „ooooo”.' }] },
  { tytul: 'Droga powrotna', progi: 1200, klatki: [
    { tlo: 'ksiazka', s: [60, 110, 'czeka'], z: [180, 105, 'smutna'], r: [], t: 'Ale jak wrócić? Księga miała 1300 stron, a one utknęły w samym środku.' },
    { tlo: 'ksiazka', s: [60, 110, 'zadowolona'], z: [180, 100, 'macha'], r: [['💡', 205, 60]], t: '— Wiem! — krzyknęła Zakładka. — Trzeba czytać do przodu. Strona po stronie!', kto: ['z', 'z'] },
    { tlo: 'las', s: [70, 110, 'czyta'], z: [170, 115, 'stoi'], r: [['🌲', 260, 80, 60], ['🌵', 20, 100]], t: 'Czytały przez lasy, pustynie i jeden bardzo, bardzo nudny wstęp.' },
    { tlo: 'las', s: [70, 110, 'czeka'], z: [170, 110, 'smutna'], r: [['💤', 120, 60], ['📜', 230, 120, 40]], t: 'Najgorszy był wstęp. Czterdzieści stron o tym, jak autor wpadł na pomysł książki. Zakładka prawie zasnęła.' },
    { tlo: 'las', s: [70, 110, 'zadowolona'], z: [170, 105, 'macha'], r: [['🚪', 280, 90, 60]], t: 'Aż w oddali zaświeciła tylna okładka.' }] },
  { tytul: 'Bibliotekarz Kurz', progi: 1700, klatki: [
    { tlo: 'brama', s: [40, 120, 'czeka'], z: [110, 125, 'smutna'], r: [['🧓', 250, 100, 70]], t: 'Przy wyjściu stał Bibliotekarz Kurz. — Bez karty bibliotecznej nikt nie wyjdzie!', kto: ['kurz'] },
    { tlo: 'brama', s: [60, 115, 'zadowolona'], z: [130, 120, 'stoi'], r: [['🍃', 120, 80, 36], ['🧓', 260, 100, 70]], t: '— Mamy coś lepszego! — zawołała Sówka i pokazała listki za tysiące przeczytanych stron.', kto: ['s'] },
    { tlo: 'brama', s: [60, 115, 'czeka'], z: [130, 120, 'stoi'], r: [['🧓', 260, 100, 70], ['📋', 220, 80, 30]], t: '— Ile stron przeczytałyście? Tylko bez zaokrągleń! — mruknął Kurz i sięgnął po ogromną księgę rejestrów.', kto: ['kurz'] },
    { tlo: 'brama', s: [60, 115, 'zadowolona'], z: [130, 120, 'macha'], r: [['🤧', 260, 100, 70], ['💨', 220, 90]], t: 'Bibliotekarz Kurz kichnął z wrażenia. Brama się otworzyła.' },
    { tlo: 'brama', s: [200, 110, 'zadowolona'], z: [260, 110, 'lata'], r: [['✨', 300, 60]], t: '— Uciekamy, zanim zmieni zdanie!', kto: ['z'] }] },
  { tytul: 'Dom', progi: 2300, klatki: [
    { tlo: 'swit', s: [70, 110, 'zadowolona'], z: [170, 110, 'macha'], r: [['💡', 40, 70]], t: 'Wróciły do pokoju o świcie. Lampka wciąż się świeciła.' },
    { tlo: 'swit', s: [70, 110, 'czyta'], z: [170, 110, 'stoi'], r: [['☕', 40, 150], ['🍪', 210, 160]], t: 'Zrobiły sobie kakao i ciasteczka. Po takiej przygodzie należą się każdemu.' },
    { tlo: 'swit', s: [70, 110, 'czeka'], z: [170, 105, 'stoi'], r: [], t: '— Wiesz co? — powiedziała Zakładka. — Najlepsze przygody są w książkach.', kto: ['z', 'z'] },
    { tlo: 'swit', s: [80, 110, 'zadowolona'], z: [165, 105, 'stoi'], r: [['💛', 150, 60, 36]], t: '— A najlepsza przyjaciółka jest między stronami — dodała Sówka.', kto: ['s'] },
    { tlo: 'pokoj', s: [80, 110, 'spi'], z: [165, 115, 'spi'], r: [['🌙', 290, 40]], t: 'I zasnęły, zanim zdążyły powiedzieć „jeszcze tylko jeden rozdział”.' }] },
  { tytul: 'Nowa księga', progi: 3000, klatki: [
    { tlo: 'pokoj', s: [60, 110, 'czeka'], z: [150, 110, 'stoi'], r: [['📕', 260, 100, 60]], t: 'Rano na półce pojawiła się nowa księga. Gruba. Tajemnicza. Pachniała wanilią.' },
    { tlo: 'pokoj', s: [80, 110, 'zadowolona'], z: [160, 100, 'macha'], r: [['📕', 260, 100, 60], ['❓', 240, 60]], t: '— Czytamy? — zapytała Zakładka.', kto: ['z'] },
    { tlo: 'pokoj', s: [80, 110, 'czyta'], z: [170, 110, 'stoi'], r: [['✨', 260, 60], ['⭐', 40, 40]], t: '— Czytamy! — zahuczała Sówka.', kto: ['s'] },
    { tlo: 'pokoj', s: [80, 110, 'czyta'], z: [170, 110, 'stoi'], r: [['📕', 260, 100, 60], ['🐾', 240, 160]], t: 'Na pierwszej stronie ktoś zostawił ślad łapki. I napis: „Pomóżcie. Litery znikają.”' },
    { tlo: 'swit', s: [90, 105, 'zadowolona'], z: [180, 100, 'macha'], r: [['📖', 260, 90, 50]], t: 'A ty? Jaką przygodę przeczytasz następną? Ciąg dalszy pisze się z każdą twoją stroną.' }] },
  { tytul: 'Kot Erratum', progi: 3800, klatki: [
    { tlo: 'ksiazka', s: [50, 120, 'czeka'], z: [130, 120, 'stoi'], r: [['🐈', 250, 110, 64]], t: 'W środku nowej księgi siedział rudy kot w okularach i poprawiał literówki ołówkiem.' },
    { tlo: 'ksiazka', s: [50, 120, 'zadowolona'], z: [130, 120, 'stoi'], r: [['🐈', 250, 110, 64], ['✏️', 220, 70]], t: '— Jestem Kot Erratum. Poprawiam błędy w książkach. Ale od tygodnia nie nadążam.', kto: ['kot'] },
    { tlo: 'ksiazka', s: [50, 120, 'czeka'], z: [130, 115, 'macha'], r: [['🐈', 250, 110, 64], ['❓', 150, 60]], t: '— Co się dzieje? — zapytała Zakładka. — Litery znikają. Najpierw kropki, potem przecinki, a wczoraj zniknęło całe „ą”.', kto: ['z', 'kot'] },
    { tlo: 'ksiazka', s: [70, 120, 'czeka'], z: [140, 120, 'smutna'], r: [['📄', 220, 80, 44]], t: 'Sówka spojrzała na stronę. Było na niej napisane: „Ala ma kta”.' },
    { tlo: 'ksiazka', s: [50, 120, 'czeka'], z: [130, 120, 'smutna'], r: [['🐈', 250, 110, 64], ['🌫️', 200, 60]], t: '— To robota Wielkiej Gumki — szepnął kot. — Wymazuje wszystko, czego nikt nie czyta.', kto: ['kot', 'kot'] },
    { tlo: 'ksiazka', s: [90, 110, 'zadowolona'], z: [170, 105, 'macha'], r: [['🐈', 260, 110, 64], ['⭐', 40, 50]], t: '— Trzeba ją powstrzymać! — zahuczała Sówka. I tak zaczęła się nowa przygoda.', kto: ['s'] }] },
  { tytul: 'Znikające litery', progi: 4700, klatki: [
    { tlo: 'ksiazka', s: [50, 120, 'czeka'], z: [140, 120, 'stoi'], r: [['🔤', 250, 80, 40], ['💨', 290, 100]], t: 'Szły tropem znikających liter. Z każdym krokiem było ciszej, bo słowa wokół gubiły głoski.' },
    { tlo: 'ksiazka', s: [60, 120, 'czeka'], z: [150, 110, 'macha'], r: [['❗', 170, 60]], t: '— Ptrzcie! — zawołała Zakładka. I sama się przestraszyła, bo zgubiła dwie litery.', kto: ['z'] },
    { tlo: 'deszcz', s: [60, 120, 'czeka'], z: [140, 120, 'stoi'], r: [['🕯️', 260, 70], ['…', 220, 130, 40]], t: 'W mieście kryminałów detektywi nie mieli już czym pisać zeznań. Same kropki. Kropka, kropka, kropka.' },
    { tlo: 'deszcz', s: [60, 115, 'zadowolona'], z: [130, 120, 'stoi'], r: [['🕵️', 240, 110, 50], ['*', 260, 80, 30]], t: '— Widziałem ją! — krzyknął Przypis z dołu strony. — Wielka, różowa i pachnie truskawką!', kto: ['przypis', 'przypis'] },
    { tlo: 'deszcz', s: [70, 115, 'czeka'], z: [150, 120, 'smutna'], r: [['🍓', 240, 90, 40]], t: '— Gumka do mazania, która pachnie truskawką — powiedziała Sówka poważnie. — Najgroźniejsza ze wszystkich.', kto: ['s', 's'] },
    { tlo: 'pustynia', s: [60, 120, 'czeka'], z: [140, 120, 'stoi'], r: [['🔡', 260, 150, 30]], t: 'Ślady prowadziły na pustynię, gdzie kiedyś stała cała powieść. Teraz został tylko piasek i jedno samotne „i”.' }] },
  { tytul: 'Pustynia bez słów', progi: 5700, klatki: [
    { tlo: 'pustynia', s: [60, 120, 'czeka'], z: [150, 120, 'stoi'], r: [['☀️', 40, 50]], t: 'Na pustyni było gorąco i strasznie cicho. Nawet echo nie miało czego powtarzać.' },
    { tlo: 'pustynia', s: [60, 120, 'czeka'], z: [150, 125, 'smutna'], r: [['💧', 190, 70]], t: '— Pić mi się chce — jęknęła Zakładka. — A jestem z papieru, więc nie mogę pić. To podwójnie smutne.', kto: ['z', 'z'] },
    { tlo: 'pustynia', s: [50, 120, 'zadowolona'], z: [120, 120, 'stoi'], r: [['🐫', 250, 130, 80], ['📚', 260, 80, 30]], t: 'Nagle podszedł wielbłąd. Na garbach niósł dwa tomy encyklopedii.' },
    { tlo: 'pustynia', s: [50, 120, 'zadowolona'], z: [120, 120, 'macha'], r: [['🐫', 250, 130, 80], ['🐈', 270, 70, 36]], t: '— Wsiadajcie — powiedział Kot Erratum, wystawiając głowę z sakwy. — Wielbłąd zna skrót.', kto: ['kot', 'kot'] },
    { tlo: 'pustynia', s: [70, 110, 'zadowolona'], z: [150, 110, 'macha'], r: [['🐉', 240, 70, 70]], t: 'Nad wydmami przeleciał znajomy smok. — Hej, Sówko! Podwieźć was do zamku?', kto: ['smok'] },
    { tlo: 'pustynia', s: [60, 120, 'czeka'], z: [130, 120, 'stoi'], r: [['🏰', 270, 120, 70], ['🚫', 300, 70, 30]], t: 'Na horyzoncie wyrósł zamek z białych gumek. Nad bramą wisiał napis: „Zakaz czytania”.' }] },
  { tytul: 'Zamek Gumki', progi: 6800, klatki: [
    { tlo: 'zamek', s: [40, 120, 'czeka'], z: [110, 125, 'stoi'], r: [], t: 'Zamek był cały biały, wymazany do czysta. Żadnych obrazków, żadnych słów, żadnej zabawy.' },
    { tlo: 'zamek', s: [40, 120, 'czeka'], z: [110, 125, 'smutna'], g: [220, 120, 'zla'], r: [['💢', 300, 60]], t: '— Kto śmie czytać w moim zamku?! — zagrzmiała Wielka Gumka. Była różowo-niebieska i bardzo zła.', kto: ['gumka'] },
    { tlo: 'zamek', s: [60, 120, 'czeka'], z: [120, 125, 'stoi'], g: [220, 120, 'zla'], r: [], t: '— Czemu wymazujesz książki? — zapytała Sówka. — Bo nikt ich nie czyta! Leżą i się kurzą. Po co komu słowa, których nikt nie słucha?', kto: ['s', 'gumka'] },
    { tlo: 'zamek', s: [60, 120, 'czeka'], z: [120, 125, 'smutna'], g: [220, 120, 'zla'], r: [['📚', 160, 70, 30]], t: 'Zakładka spuściła głowę. Gumka trochę miała rację. Tyle książek czekało na półkach latami.' },
    { tlo: 'zamek', s: [70, 115, 'zadowolona'], z: [130, 125, 'stoi'], g: [230, 120, 'zla'], r: [['💛', 90, 50, 30]], t: '— Mylisz się — powiedziała Sówka. — Książki czekają, bo wiedzą, że ktoś w końcu przyjdzie.', kto: ['s', 's'] },
    { tlo: 'zamek', s: [60, 120, 'czeka'], z: [120, 125, 'stoi'], g: [220, 115, 'zla'], r: [['⏳', 300, 60, 36]], t: '— Udowodnij! — ryknęła Gumka. — Jeśli do świtu ktoś przeczyta choć jedną książkę do końca, oddam wszystkie litery!', kto: ['gumka', 'gumka'] }] },
  { tytul: 'Wielkie czytanie', progi: 8000, klatki: [
    { tlo: 'zamek', s: [140, 105, 'czeka'], z: null, r: [['👀', 230, 60]], t: 'Sówka spojrzała prosto na ciebie. Tak, na ciebie, który to oglądasz.' },
    { tlo: 'zamek', s: [140, 105, 'zadowolona'], z: null, r: [['📖', 230, 120, 44]], t: '— Pomożesz? Każda strona, którą przeczytasz, przywraca jedną literę — szepnęła.', kto: ['s'] },
    { tlo: 'zamek', s: [60, 115, 'czyta'], z: [130, 120, 'stoi'], r: [['✨', 230, 60], ['🔤', 280, 100, 36], ['✨', 310, 140]], t: 'I wtedy się zaczęło. Z każdą przeczytaną stroną na ścianach zamku pojawiały się słowa.' },
    { tlo: 'zamek', s: [60, 115, 'zadowolona'], z: [250, 40, 'lata'], r: [['🎉', 300, 30]], t: '— Ą! Wróciło „ą”! — piszczała Zakładka i tańczyła na wieży.', kto: ['z'] },
    { tlo: 'zamek', s: [60, 115, 'zadowolona'], z: [120, 125, 'macha'], g: [220, 120, 'mila'], r: [['🌈', 290, 50, 40]], t: 'Gumka patrzyła na to coraz łagodniej. Biały zamek nabierał kolorów.' },
    { tlo: 'swit', s: [60, 110, 'zadowolona'], z: [120, 115, 'macha'], g: [220, 115, 'mila'], r: [['💛', 200, 60, 30]], t: '— Nie wiedziałam, że ktoś jeszcze czyta — powiedziała cicho Gumka. — Przepraszam. Od dziś wymazuję tylko błędy.', kto: ['gumka', 'gumka'] }] },
  { tytul: 'Święto biblioteki', progi: 9500, klatki: [
    { tlo: 'pokoj', s: [50, 110, 'zadowolona'], z: [120, 110, 'macha'], r: [['🐉', 250, 100, 70], ['🎂', 200, 160, 40]], t: 'Wszyscy przyjaciele z przygód przyszli na wielkie święto. Smok przyniósł tort w kształcie książki.' },
    { tlo: 'pokoj', s: [50, 110, 'zadowolona'], z: [120, 110, 'stoi'], r: [['🐈', 250, 120, 64], ['🥂', 220, 80]], t: '— Wznoszę toast za świat bez literówek! — zamruczał Kot Erratum.', kto: ['kot'] },
    { tlo: 'pokoj', s: [50, 110, 'zadowolona'], z: [120, 110, 'stoi'], r: [['🧓', 250, 100, 70], ['📋', 220, 70, 30]], t: '— A ja wybaczam wszystkie przetrzymane książki. Na jeden dzień — dodał Bibliotekarz Kurz.', kto: ['kurz'] },
    { tlo: 'pokoj', s: [50, 110, 'czyta'], z: [120, 110, 'stoi'], g: [220, 120, 'mila'], r: [['✏️', 300, 80]], t: 'Wielka Gumka została pomocniczką Kota. Razem poprawiają błędy we wszystkich książkach świata.' },
    { tlo: 'swit', s: [80, 110, 'zadowolona'], z: [165, 105, 'macha'], r: [['💛', 150, 60, 36]], t: '— Wiesz, Sówko — powiedziała Zakładka. — Najlepsze w przygodach jest to, że zawsze jest następna strona.', kto: ['z', 'z'] },
    { tlo: 'swit', s: [90, 105, 'czyta'], z: [180, 100, 'stoi'], r: [['📖', 260, 90, 50], ['✨', 300, 50]], t: 'I tu kończy się ta historia. Ale twoja trwa dalej. Otwórz książkę, a my będziemy czekać między stronami.' }] }
];
const stronyRazem = () => [...mapaDni().values()].reduce((a, b) => a + b, 0);
function historiaStan() {
  const s = stronyRazem();
  const odbl = HISTORIA.filter(r => s >= r.progi).length;
  const nastepny = HISTORIA[odbl] || null;
  return { strony: s, odblokowane: odbl, nastepny, doNastepnego: nastepny ? nastepny.progi - s : 0 };
}

const TLA = {
  pustynia: '<rect width="360" height="220" fill="#f7d79a"/><circle cx="290" cy="50" r="26" fill="#fff1b8"/><path d="M0 150 Q90 110 180 150 T360 140 V220 H0Z" fill="#e7b96a"/><path d="M0 185 Q120 160 240 190 T360 180 V220 H0Z" fill="#d49b4f"/>',
  zamek: '<rect width="360" height="220" fill="#d9d3ec"/><g fill="#fbfaff" stroke="#c9c2e0" stroke-width="2"><rect x="200" y="70" width="120" height="120"/><rect x="190" y="40" width="30" height="150"/><rect x="300" y="40" width="30" height="150"/><path d="M190 40 l15 -25 l15 25z M300 40 l15 -25 l15 25z"/></g><path d="M245 190 v-40 a15 15 0 0 1 30 0 v40z" fill="#c9c2e0"/><rect y="185" width="360" height="35" fill="#efeaf8"/>',
  pokoj: '<rect width="360" height="220" fill="#2a1f3d"/><rect y="170" width="360" height="50" fill="#4a3426"/><g fill="#5b3f2e"><rect x="250" y="40" width="90" height="8"/><rect x="250" y="90" width="90" height="8"/></g><g><rect x="256" y="14" width="10" height="26" fill="#a3233a"/><rect x="268" y="18" width="9" height="22" fill="#22385c"/><rect x="279" y="12" width="12" height="28" fill="#d9b66e"/><rect x="293" y="20" width="8" height="20" fill="#1f4a3d"/><rect x="258" y="64" width="12" height="26" fill="#1f4a3d"/><rect x="272" y="68" width="9" height="22" fill="#a3233a"/><rect x="283" y="62" width="10" height="28" fill="#7a5218"/></g><circle cx="60" cy="40" r="22" fill="#ffe9a3" opacity=".25"/><rect x="20" y="30" width="60" height="40" rx="4" fill="#1b2a52" stroke="#5b3f2e" stroke-width="4"/>',
  ksiazka: '<rect width="360" height="220" fill="#efe6cf"/><path d="M0 200 Q180 150 360 200 V220 H0Z" fill="#d9caa0"/><g stroke="#c9b88a" stroke-width="1.5">' + Array.from({ length: 9 }, (_, i) => `<path d="M${20 + i * 12} ${40 + i * 4} h120" />`).join('') + Array.from({ length: 9 }, (_, i) => `<path d="M${200} ${40 + i * 12} h130" />`).join('') + '</g><path d="M180 20 V200" stroke="#b8a77a" stroke-width="3"/>',
  smok: '<rect width="360" height="220" fill="#f3b07a"/><circle cx="300" cy="50" r="24" fill="#ffe08a"/><path d="M0 170 L60 90 L120 160 L190 70 L260 150 L320 100 L360 140 V220 H0Z" fill="#8a4b3b"/><path d="M0 200 Q180 170 360 200 V220 H0Z" fill="#5b2f2a"/>',
  deszcz: '<rect width="360" height="220" fill="#1b2230"/><g fill="#2b3446"><rect x="10" y="60" width="60" height="160"/><rect x="80" y="30" width="50" height="190"/><rect x="290" y="50" width="70" height="170"/></g><g fill="#ffd34d" opacity=".7"><rect x="20" y="80" width="8" height="10"/><rect x="95" y="60" width="8" height="10"/><rect x="305" y="90" width="8" height="10"/></g><g class="krople" stroke="#7a8aa8" stroke-width="1.4">' + Array.from({ length: 22 }, (_, i) => `<path d="M${(i * 37) % 360} ${(i * 53) % 200} l-4 12"/>`).join('') + '</g><rect y="195" width="360" height="25" fill="#11161f"/>',
  morze: '<rect width="360" height="220" fill="#9fd1ec"/><circle cx="60" cy="45" r="20" fill="#fff3b0"/><path class="fala" d="M0 150 Q30 135 60 150 T120 150 T180 150 T240 150 T300 150 T360 150 V220 H0Z" fill="#2c7fb8"/><path class="fala f2" d="M0 170 Q30 158 60 170 T120 170 T180 170 T240 170 T300 170 T360 170 V220 H0Z" fill="#1f5f8f"/>',
  kosmos: '<rect width="360" height="220" fill="#0b1030"/>' + Array.from({ length: 40 }, (_, i) => `<circle class="gw" cx="${(i * 97) % 360}" cy="${(i * 61) % 220}" r="${1 + (i % 3) * .5}" fill="#fff" style="animation-delay:${(i % 7) * .4}s"/>`).join('') + '<circle cx="90" cy="180" r="70" fill="#3a2f7a" opacity=".5"/>',
  las: '<rect width="360" height="220" fill="#cfe8c7"/><g fill="#2f6a53">' + Array.from({ length: 8 }, (_, i) => `<path d="M${i * 50 - 10} 190 l25 -70 l25 70z"/>`).join('') + '</g><rect y="185" width="360" height="35" fill="#7a9a5a"/>',
  brama: '<rect width="360" height="220" fill="#3b3046"/><rect x="200" y="30" width="140" height="170" rx="70" fill="#1d1726" stroke="#d9b66e" stroke-width="6"/><g fill="#5b3f2e"><rect x="10" y="40" width="20" height="160"/><rect x="40" y="40" width="20" height="160"/></g><rect y="195" width="360" height="25" fill="#2a2233"/>',
  swit: '<rect width="360" height="220" fill="#f6c6a8"/><circle cx="300" cy="140" r="34" fill="#ffd36a"/><rect y="170" width="360" height="50" fill="#4a3426"/><g fill="#5b3f2e"><rect x="20" y="60" width="90" height="8"/></g><g><rect x="26" y="34" width="10" height="26" fill="#a3233a"/><rect x="38" y="38" width="9" height="22" fill="#22385c"/><rect x="49" y="32" width="12" height="28" fill="#d9b66e"/></g>'
};
const postac = (svg, x, y, w, h, klasa = '') => `<g class="kl-postac ${klasa}"><svg x="${x}" y="${y}" width="${w}" height="${h}" overflow="visible"${svg.replace(/^<svg class="[^"]*"/, '')}</g>`;
/* ---------- postacie z historii jako rysunki (2.21): ten sam styl w kinie i na wizytach ---------- */
function svgGoscia(kto, nastroj = '') {
  if (kto === 'gumka') return svgGumki(nastroj || 'mila');
  if (kto === 'kot') return `<svg class="gosc-svg gosc-kot" viewBox="0 0 80 84"><path d="M62 70 q18 -4 12 -24" fill="none" stroke="#e08a3c" stroke-width="7" stroke-linecap="round" class="g-ogon"/>
    <ellipse cx="40" cy="62" rx="22" ry="20" fill="#f29b4b"/><ellipse cx="40" cy="66" rx="12" ry="13" fill="#fde3c4"/>
    <path d="M20 22 l4 -16 l12 12z M60 22 l-4 -16 l-12 12z" fill="#f29b4b"/><path d="M23 18 l2 -7 l6 6z M57 18 l-2 -7 l-6 6z" fill="#ffc0a8"/>
    <circle cx="40" cy="32" r="21" fill="#f29b4b"/><path d="M30 16 l3 7 M40 13 v8 M50 16 l-3 7" stroke="#d7762a" stroke-width="3" stroke-linecap="round"/>
    <g class="g-oczy"><circle cx="32" cy="32" r="3.2" fill="#2b1d12"/><circle cx="48" cy="32" r="3.2" fill="#2b1d12"/></g>
    <g fill="none" stroke="#3a2a1c" stroke-width="2"><circle cx="32" cy="32" r="7.5"/><circle cx="48" cy="32" r="7.5"/><path d="M39.5 32 h1"/></g>
    <path d="M38 40 l2 2 l2 -2z" fill="#e5657d"/><path d="M36 44 q4 3 8 0" fill="none" stroke="#3a2a1c" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M16 38 h10 M16 43 l10 -2 M64 38 h-10 M64 43 l-10 -2" stroke="#fff" stroke-width="1.4" opacity=".8"/>
    <g transform="rotate(-35 62 16)"><rect x="54" y="13" width="18" height="4" rx="1" fill="#ffd34d"/><path d="M72 13 l5 2 l-5 2z" fill="#f3d2a2"/></g>
    <ellipse cx="30" cy="80" rx="7" ry="4" fill="#f29b4b"/><ellipse cx="50" cy="80" rx="7" ry="4" fill="#f29b4b"/></svg>`;
  if (kto === 'smok') return `<svg class="gosc-svg gosc-smok" viewBox="0 0 96 88"><path d="M70 66 q24 4 20 -18 q-4 10 -14 8" fill="#3f9d74"/>
    <path class="g-skrz" d="M30 40 q-26 -22 -28 8 q10 -6 16 2 q4 -8 12 -2z M66 40 q26 -22 28 8 q-10 -6 -16 2 q-4 -8 -12 -2z" fill="#2f7f5c"/>
    <ellipse cx="48" cy="60" rx="24" ry="22" fill="#4fb386"/><ellipse cx="48" cy="64" rx="14" ry="16" fill="#f6d99a"/><path d="M38 56 h20 M37 64 h22 M39 72 h18" stroke="#e5bf73" stroke-width="2"/>
    <path d="M32 16 l-4 -12 l10 8z M64 16 l4 -12 l-10 8z" fill="#f2c14e"/>
    <ellipse cx="48" cy="30" rx="24" ry="20" fill="#4fb386"/><ellipse cx="48" cy="38" rx="15" ry="9" fill="#6cc79b"/>
    <circle cx="43" cy="38" r="1.8" fill="#24543f"/><circle cx="53" cy="38" r="1.8" fill="#24543f"/>
    <g class="g-oczy"><circle cx="38" cy="24" r="5" fill="#fff"/><circle cx="58" cy="24" r="5" fill="#fff"/><circle cx="39" cy="25" r="2.6" fill="#1d2a24"/><circle cx="59" cy="25" r="2.6" fill="#1d2a24"/></g>
    <path d="M40 44 q8 5 16 0" fill="none" stroke="#24543f" stroke-width="2" stroke-linecap="round"/><path d="M30 6 q4 4 0 8 M66 6 q-4 4 0 8" fill="none" stroke="#ff9a5a" stroke-width="0" />
    <ellipse cx="38" cy="82" rx="8" ry="5" fill="#3f9d74"/><ellipse cx="58" cy="82" rx="8" ry="5" fill="#3f9d74"/></svg>`;
  if (kto === 'kurz') return `<svg class="gosc-svg gosc-kurz" viewBox="0 0 80 96"><path d="M18 92 v-30 q22 -14 44 0 v30z" fill="#7a5a3a"/><path d="M34 52 l6 30 l6 -30z" fill="#e9e2cf"/><path d="M38 54 h4 l-2 8z" fill="#a3233a"/>
    <path d="M14 70 q-6 10 2 18 M66 70 q6 10 -2 18" fill="none" stroke="#7a5a3a" stroke-width="7" stroke-linecap="round"/>
    <circle cx="40" cy="34" r="19" fill="#f1d3b8"/><path d="M20 30 q-2 -18 20 -20 q22 2 20 20 q-4 -8 -10 -9 q-10 4 -20 0 q-6 1 -10 9z" fill="#d9d6cf"/>
    <path d="M22 40 q-6 2 -4 8 M58 40 q6 2 4 8" fill="none" stroke="#d9d6cf" stroke-width="4" stroke-linecap="round"/>
    <g fill="none" stroke="#3b2f2a" stroke-width="2"><circle cx="33" cy="35" r="6"/><circle cx="47" cy="35" r="6"/><path d="M39 35 h2"/></g>
    <g class="g-oczy"><circle cx="33" cy="35" r="2" fill="#3b2f2a"/><circle cx="47" cy="35" r="2" fill="#3b2f2a"/></g>
    <path d="M28 27 l9 2 M52 27 l-9 2" stroke="#bdb8ae" stroke-width="3" stroke-linecap="round"/><path d="M36 46 q4 2 8 0" fill="none" stroke="#3b2f2a" stroke-width="2" stroke-linecap="round"/>
    <g class="g-kurz" fill="#cfc6b4" opacity=".7"><circle cx="8" cy="88" r="4"/><circle cx="14" cy="84" r="3"/><circle cx="72" cy="86" r="4"/></g></svg>`;
  if (kto === 'przypis') return `<svg class="gosc-svg gosc-przypis" viewBox="0 0 70 80"><g transform="translate(35 34)"><g class="g-gwiazdka" fill="#8fa6cf">
    ${[0, 60, 120, 180, 240, 300].map(a => `<rect x="-6" y="-30" width="12" height="30" rx="6" transform="rotate(${a})"/>`).join('')}</g>
    <circle r="15" fill="#5d73a0"/><g class="g-oczy"><circle cx="-5.5" cy="-2" r="4" fill="#fff"/><circle cx="5.5" cy="-2" r="4" fill="#fff"/><circle cx="-5" cy="-1.5" r="2" fill="#141b29"/><circle cx="6" cy="-1.5" r="2" fill="#141b29"/></g>
    <path d="M-5 7 q5 4 10 0" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M-16 -16 h32 l-4 -8 h-24z" fill="#1a2233"/><rect x="-18" y="-17" width="36" height="4" rx="2" fill="#1a2233"/></g>
    <path d="M28 66 v10 M42 66 v10" stroke="#8fa6cf" stroke-width="4" stroke-linecap="round"/></svg>`;
  return '';
}
const EMOJI_GOSCI = { '🐈': 'kot', '🐉': 'smok', '🧓': 'kurz', '🕵️': 'przypis', '🤧': 'kurz' };

/** Wielka Gumka: różowo-niebieska gumka do mazania (zła albo już miła). */
function svgGumki(nastroj = 'zla') {
  const twarz = nastroj === 'zla'
    ? '<path d="M11 20 l10 5 M41 20 l-10 5" stroke="#3a1f2b" stroke-width="2.6" stroke-linecap="round"/><path d="M17 41 q9 -7 18 0" stroke="#3a1f2b" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
    : '<circle cx="12" cy="35" r="3.5" fill="#ff5f8f" opacity=".5"/><circle cx="40" cy="35" r="3.5" fill="#ff5f8f" opacity=".5"/><path d="M17 37 q9 8 18 0" stroke="#3a1f2b" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
  return `<svg class="gumka-svg" viewBox="0 0 84 60"><g transform="rotate(-6 42 30)"><rect x="2" y="8" width="80" height="44" rx="9" fill="#5b8def"/><rect x="2" y="8" width="50" height="44" rx="9" fill="#ff8fb8"/><rect x="40" y="8" width="12" height="44" fill="#ff8fb8"/><path d="M4 48 h46" stroke="#e66f98" stroke-width="3"/>
    <circle cx="17" cy="28" r="5" fill="#fff"/><circle cx="35" cy="28" r="5" fill="#fff"/><circle cx="18" cy="29" r="2.4" fill="#3a1f2b"/><circle cx="36" cy="29" r="2.4" fill="#3a1f2b"/>${twarz}</g></svg>`;
}
function svgKlatki(kl) {
  // współrzędne w klatkach to miejsce stóp; +55 stawia postacie na ziemi tła
  const sowa = kl.s ? postac(svgSowki(kl.s[2], Z.ustawienia.gra.zalozone), kl.s[0], kl.s[1] - 85 + 55, 78, 85, 'kl-sowa') : '';
  const zakl = kl.z ? postac(svgZakladki(kl.z[2]), kl.z[0], kl.z[1] - 66 + 55, 44, 66, 'kl-zakl') : '';
  const gumka = kl.g ? postac(svgGumki(kl.g[2]), kl.g[0], kl.g[1] - 60 + 55, 84, 60, 'kl-gumka') : '';
  // postacie z historii rysujemy (ten sam styl co Sówka), resztę rekwizytów jako emoji
  const rek = (kl.r || []).map(([e, x, y, rozm = 28]) => EMOJI_GOSCI[e]
    ? postac(svgGoscia(EMOJI_GOSCI[e], e === '🤧' ? 'kicha' : ''), x - rozm * .15, y - rozm * 1.05, rozm * 1.3, rozm * 1.3, `kl-gosc kl-${EMOJI_GOSCI[e]}${e === '🤧' ? ' kicha' : ''}`)
    : `<text x="${x}" y="${y}" font-size="${rozm}" class="kl-rekw">${e}</text>`).join('');
  return `<svg class="klatka-svg tlo-${kl.tlo}" viewBox="0 0 360 220" role="img">${TLA[kl.tlo] || ''}${rek}${gumka}${sowa}${zakl}</svg>`;
}

function arkuszHistorii(otworz = null) {
  let rozdz = otworz, klatka = 0, auto = null;
  const stop = () => { clearInterval(auto); auto = null; };
  const a = arkusz({
    tytul: 'Przygody Sówki i Zakładki', klasa: 'arkusz-historia', onZamknij: stop,
    render: () => {
      const st = historiaStan();
      if (rozdz == null) {
        return `<p class="hist-intro">🎬 Animowane przerywniki z głosami i muzyką. Wybierz rozdział, a historia poleci sama.</p><p class="cichy">Każdy rozdział odblokowujesz, czytając. Liczą się wszystkie przeczytane strony: masz ich <strong>${liczba(st.strony)}</strong>.</p>
          ${st.nastepny ? `<div class="hist-postep"><span>Następny rozdział: „${esc(st.nastepny.tytul)}”</span><span class="poziom-pasek duzy"><span style="width:${Math.min(100, (st.strony - (HISTORIA[st.odblokowane - 1] || { progi: 0 }).progi) / (st.nastepny.progi - (HISTORIA[st.odblokowane - 1] || { progi: 0 }).progi) * 100).toFixed(1)}%"></span></span><small>za ${ile(st.doNastepnego, FORMY_STRON_D)}</small></div>` : '<p class="ok">Odblokowałeś całą historię! Jesteś legendą. 🦉🔖</p>'}
          <ol class="hist-lista">${HISTORIA.map((r, i) => { const ok = i < st.odblokowane; return `<li><button type="button" class="hist-rozdz${ok ? '' : ' zamkniety'}" ${ok ? `data-rozdz="${i}"` : 'disabled'}>
            <span class="hist-mini">${ok ? svgKlatki(r.klatki[0]) : '<span class="hist-klodka">🔒</span>'}</span>
            <span class="hist-tekst"><strong>${i + 1}. ${esc(r.tytul)}</strong><small>${ok ? ((Z.ustawienia.gra.historiaWidziane || 0) > i ? 'obejrzane' : '<b class="nowy-znak">nowy!</b>') : `od ${liczba(r.progi)} stron`}</small></span></button></li>`; }).join('')}</ol>`;
      }
      const r = HISTORIA[rozdz], kl = r.klatki[klatka];
      return `<div class="hist-widok">
        <p class="hist-naglowek"><button type="button" class="btn-tekst" data-wroc>‹ Rozdziały</button><span>Rozdział ${rozdz + 1}: ${esc(r.tytul)}</span></p>
        <div class="klatka" data-klatka>${svgKlatki(kl)}<p class="klatka-tekst">${esc(kl.t)}</p></div>
        <div class="hist-sterowanie"><button type="button" class="btn-ikona" data-kl="-1" aria-label="Poprzednia klatka"${klatka ? '' : ' disabled'}>${I.wstecz}</button>
          <span class="hist-kropki">${r.klatki.map((_, i) => `<i class="${i === klatka ? 'akt' : ''}"></i>`).join('')}</span>
          <button type="button" class="btn-ikona" data-auto aria-label="${auto ? 'Pauza' : 'Odtwarzaj'}">${auto ? I.pauza : I.graj}</button>
          <button type="button" class="btn-ikona" data-kl="1" aria-label="Następna klatka">${I.dalej}</button></div>
        ${klatka === r.klatki.length - 1 ? `<div class="przyciski przyciski-srodek">${rozdz + 1 < historiaStan().odblokowane ? `<button type="button" class="btn btn-glowny" data-rozdz="${rozdz + 1}">Następny rozdział ›</button>` : historiaStan().nastepny ? `<p class="cichy">Ciąg dalszy za ${ile(historiaStan().doNastepnego, FORMY_STRON_D)}… 📖</p>` : ''}</div>` : ''}
      </div>`;
    }
  });
  const pokaz = () => {
    const g = Z.ustawienia.gra;
    if (rozdz != null && (g.historiaWidziane || 0) < rozdz + 1 && klatka === HISTORIA[rozdz].klatki.length - 1) { g.historiaWidziane = rozdz + 1; utrwalUstawienia(); }
    a.rysuj();
  };
  const dalej = kier => {
    const r = HISTORIA[rozdz];
    const n = klatka + kier;
    if (n < 0 || n >= r.klatki.length) { stop(); a.rysuj(); return; }
    const el = $('[data-klatka]', a.tresc);
    if (el && !bezRuchu()) { el.classList.add(kier > 0 ? 'wyjscie-l' : 'wyjscie-p'); setTimeout(() => { klatka = n; pokaz(); $('[data-klatka]', a.tresc)?.classList.add(kier > 0 ? 'wejscie-p' : 'wejscie-l'); }, 180); }
    else { klatka = n; pokaz(); }
  };
  a.tresc.addEventListener('click', e => {
    const r = e.target.closest('[data-rozdz]');
    if (r) { stop(); a.zamknij(); odtworzRozdzial(+r.dataset.rozdz); return; }
    if (e.target.closest('[data-wroc]')) { stop(); rozdz = null; a.rysuj(); return; }
    const k = e.target.closest('[data-kl]');
    if (k) { stop(); dalej(+k.dataset.kl); return; }
    if (e.target.closest('[data-klatka]')) { stop(); dalej(1); return; }
    if (e.target.closest('[data-auto]')) {
      if (auto) { stop(); a.rysuj(); return; }
      auto = setInterval(() => { if (klatka >= HISTORIA[rozdz].klatki.length - 1) { stop(); a.rysuj(); } else dalej(1); }, 3200);
      a.rysuj();
    }
  });
}

/** Powiadomienie o nowym rozdziale historii. */
function sprawdzHistorie() {
  const st = historiaStan(), zap = lsGet('zakladka-historia-odbl');
  if (zap == null) { lsSet('zakladka-historia-odbl', String(st.odblokowane)); return; }
  if (st.odblokowane > +zap) {
    lsSet('zakladka-historia-odbl', String(st.odblokowane));
    const r = HISTORIA[st.odblokowane - 1];
    setTimeout(() => { toast(`🎬 Nowy rozdział historii: „${r.tytul}”!`, { czas: 7000, akcja: 'Oglądaj', onAkcja: () => odtworzRozdzial(st.odblokowane - 1) }); konfetti({ ile: 60 }); }, 1200);
  }
}


/* ---------- rozmowa z Sówką i Zakładką ---------- */
function pokazDymek(tekst, { puenta = false, klasa = '' } = {}) {
  const t = $('[data-sowka-tekst]');
  if (!t) return;
  t.classList.remove('nowy'); void t.offsetWidth;
  t.innerHTML = esc(tekst) + (puenta ? ' <button type="button" class="btn btn-maly sowka-puenta" data-puenta>No i? 😄</button>' : '');
  t.classList.add('nowy');
  const karta = t.closest('.sowka-karta');
  if (karta && klasa) { karta.classList.remove(klasa); void karta.offsetWidth; karta.classList.add(klasa); setTimeout(() => karta.classList.remove(klasa), 1400); }
}
function dymekZakladki(tekst, potem) {
  const d = $('[data-zakl-dymek]');
  if (!d) return;
  d.textContent = tekst; d.hidden = false;
  d.classList.remove('nowy'); void d.offsetWidth; d.classList.add('nowy');
  clearTimeout(U.zaklTimer);
  Fx.graj('zakl');
  mowWKarcie(tekst, 'z', () => { U.zaklTimer = setTimeout(() => { d.hidden = true; }, 3500); potem && potem(); });
}
/** Głos w karcie Sówki na ekranie Dziś (nagranie albo gaworzenie); mówiąca postać rusza dziobem. */
function mowWKarcie(tekst, kto, potem) {
  const post = $(kto === 'z' ? '#widok .zakl-postac' : '#widok .sowka-karta .sowka');
  if (post) post.classList.add('mowi');
  Glos.mow(tekst, kto, { wl: Z.ustawienia.gra.glosSowki, naKoniec: () => { if (post) post.classList.remove('mowi'); potem && potem(); } });
}
function kartaMowi(tekst, klasa = '', potem) { pokazDymek(tekst, { klasa }); mowWKarcie(tekst, 's', potem); }
/** Żart w karcie: pytanie, chwila ciszy, puenta, ba-dum-tss i czasem śmiech Zakładki. Wszystko na głos. */
function zartWKarcie() {
  const [a, b] = losowyZart();
  kartaMowi(a, 'mysli', () => setTimeout(() => {
    pokazDymek(`${a} ${b}`, { klasa: 'smieje' });
    mowWKarcie(b, 's', () => { Fx.graj('badum'); if (Math.random() < .5) setTimeout(() => dymekZakladki(losuj(SMIECH_ZAKLADKI)), 500); });
  }, 700));
}
document.addEventListener('click', e => {
  const t = e.target;
  const o = t.closest('[data-sowka-opcja]');
  if (o) {
    U.sowkaN = (U.sowkaN || 0) + 1;
    const co = o.dataset.sowkaOpcja;
    if (co === 'zart') {
      const lista = ZARTY.map((z, i) => i).filter(i => !(U.zartyUzyte || []).includes(i));
      const i = (lista.length ? lista : ZARTY.map((z, j) => j))[Math.floor(Math.random() * (lista.length || ZARTY.length))];
      U.zartyUzyte = [...(U.zartyUzyte || []), i].slice(-15);
      U.zart = i;
      pokazDymek(ZARTY[i][0], { puenta: true, klasa: 'mysli' });
      mowWKarcie(ZARTY[i][0], 's');
    }
    if (co === 'motywacja') { const m = motywacja(); pokazDymek(m, { klasa: 'skacze' }); mowWKarcie(m, 's'); }
    if (co === 'co') { const m = coCzytac(); pokazDymek(m, { klasa: 'mysli' }); mowWKarcie(m, 's'); }
    if (co === 'historia') arkuszHistorii();
    return;
  }
  if (t.closest('[data-puenta]')) {
    const z = ZARTY[U.zart] || ZARTY[0];
    pokazDymek(`${z[0]} ${z[1]}`, { klasa: 'smieje' });
    mowWKarcie(z[1], 's', () => { Fx.graj('badum'); if (Math.random() < .6) setTimeout(() => dymekZakladki(losuj(SMIECH_ZAKLADKI)), 500); });
    if (navigator.vibrate) navigator.vibrate([10, 40, 10]);
    return;
  }
  const zk = t.closest('[data-zakl]');
  if (zk) {
    zk.classList.remove('skok'); void zk.offsetWidth; zk.classList.add('skok');
    U.zaklN = (U.zaklN || 0) + 1;
    // co trzecie stuknięcie (gdy włączone 18+) Zakładka rzuca swój żart
    if (Z.ustawienia.gra.zakladka18 && U.zaklN % 3 === 0) { const [a, b] = losowyZartZakladki(); dymekZakladki(a, () => setTimeout(() => dymekZakladki(b, () => Fx.graj('badum')), 300)); }
    else dymekZakladki(KWESTIE_ZAKLADKI[U.zaklN % KWESTIE_ZAKLADKI.length]);
    if (navigator.vibrate) navigator.vibrate(10);
  }
});
/* ================= głosy postaci (2.17) ================= */
const POSTACIE = {
  n: { nazwa: 'Narrator', kolor: '#f1ede0', pitch: 1, rate: .96, glos: 0 },
  s: { nazwa: 'Sówka', kolor: '#e9b98a', pitch: 1.25, rate: 1.02, glos: 1 },
  z: { nazwa: 'Zakładka', kolor: '#ff8fa3', pitch: 1.65, rate: 1.1, glos: 2 },
  smok: { nazwa: 'Smok', kolor: '#ffb067', pitch: .45, rate: .82, glos: 0 },
  przypis: { nazwa: 'Przypis', kolor: '#b7c6bb', pitch: .85, rate: 1.2, glos: 0 },
  kurz: { nazwa: 'Bibliotekarz Kurz', kolor: '#cfc3a6', pitch: .6, rate: .8, glos: 0 },
  kot: { nazwa: 'Kot Erratum', kolor: '#ffb36b', pitch: 1, rate: 1, glos: 0 },
  gumka: { nazwa: 'Wielka Gumka', kolor: '#ff9ecb', pitch: 1, rate: 1, glos: 0 }
};
/* ---------- 2.18: nagrane głosy postaci (neuronowe, offline) + gaworzenie dla zmiennych tekstów ---------- */
/** Klucz nagrania: same litery i cyfry, małe litery (tak samo jak w skrypcie, który nagrywał). */
const normKwestii = t => String(t).toLowerCase().replace(/[^\p{L}\p{N}_]+/gu, ' ').trim();
const Glos = {
  spis: null, audio: null, nr: 0, odblokowany: false,
  get dostepny() { return typeof Audio !== 'undefined'; },
  /** Wszystkie nagrania są w jednej paczce (audio/glosy-….bin), a glosy.json mówi, gdzie w niej leży każda kwestia. */
  wczytaj() {
    if (!this.ladowanie) this.ladowanie = fetch('audio/glosy.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(d => {
      this.paczka = d; this.spis = d ? d.k : {};
      if (d) setTimeout(() => this.pobierzPaczke(), 5000); // w tle cała paczka, potem działa bez internetu
    }).catch(() => { this.spis = {}; });
    return this.ladowanie;
  },
  pobierzPaczke() {
    if (this.paczkaBlob || this.pobieranie || !this.paczka) return this.pobieranie;
    this.pobieranie = fetch(`audio/${this.paczka.plik}`).then(r => r.status === 200 ? r.blob() : null)
      .then(b => { if (b && b.size === this.paczka.rozmiar) this.paczkaBlob = b; }).catch(() => {}).finally(() => { this.pobieranie = null; });
    return this.pobieranie;
  },
  /** Jedno nagranie z paczki: z pobranej całości albo (zanim się pobierze) tylko potrzebny kawałek przez Range. */
  async kawalek([od, dl]) {
    const typ = 'audio/mpeg';
    if (this.paczkaBlob) return this.paczkaBlob.slice(od, od + dl, typ);
    this.kawalki = this.kawalki || new Map();
    if (this.kawalki.has(od)) return this.kawalki.get(od);
    const r = await fetch(`audio/${this.paczka.plik}`, { headers: { Range: `bytes=${od}-${od + dl - 1}` } });
    let b;
    if (r.status === 206) b = new Blob([await r.arrayBuffer()], { type: typ });
    else if (r.ok) { const cala = await r.blob(); if (cala.size !== this.paczka.rozmiar) throw new Error('zła paczka'); this.paczkaBlob = cala; b = cala.slice(od, od + dl, typ); }
    else throw new Error('brak nagrania');
    if (this.kawalki.size > 40) this.kawalki.clear();
    this.kawalki.set(od, b);
    return b;
  },
  plik(tekst, kto) { return this.spis && this.spis[`${kto}|${normKwestii(tekst)}`]; },
  ma(tekst, kto) { return !!this.plik(tekst, kto); },
  /** iOS/Safari: dźwięk musi zacząć się od dotknięcia. Przy dotknięciu odtwarzamy (głośno, nie wyciszony!) krótką ciszę,
   *  co odblokowuje ten sam odtwarzacz na później, i budzimy WebAudio. Na iPhonie dźwięk gra też przy wyciszonym przełączniku. */
  odblokuj() {
    Fx.kontekst();
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* starsze przeglądarki */ }
    if (this.odblokowany || this.odblokowuje || !this.dostepny) return;
    try {
      this.audio = this.audio || new Audio();
      const a = this.audio;
      if (!a.paused && a.src && !a.src.endsWith('cisza.mp3')) { this.odblokowany = true; return; } // właśnie coś gra, więc już działa
      this.odblokowuje = true;
      a.muted = false;
      a.src = 'audio/cisza.mp3';
      const p = a.play();
      const ok = () => { this.odblokowany = true; this.odblokowuje = false; };
      if (p) p.then(ok).catch(() => { this.odblokowuje = false; }); else ok();
    } catch { this.odblokowuje = false; }
  },
  /** Mówi kwestię głosem postaci: nagranie, gdy jest, a gdy nie (zmienny tekst) — gaworzenie jak w grach. */
  mow(tekst, kto = 'n', { naKoniec, wl } = {}) {
    const nr = ++this.nr;
    this.przerwij();
    let skonczone = false;
    const koniec = () => { if (skonczone || nr !== this.nr) return; skonczone = true; clearTimeout(this.zapas); naKoniec && naKoniec(); };
    const naCzas = ms => { this.zapas = setTimeout(koniec, ms); };
    if (!(wl ?? Z.ustawienia.gra.glos) || !this.dostepny) { naCzas(Math.min(9000, 900 + tekst.length * 55)); return; }
    const nagr = this.plik(tekst, kto);
    if (!nagr) { naCzas(Fx.gaworz(tekst, kto) + 250); return; }
    this.audio = this.audio || new Audio();
    const a = this.audio;
    const gaworzZamiast = () => { if (nr !== this.nr) return; clearTimeout(this.zapas); naCzas(Fx.gaworz(tekst, kto) + 250); };
    // zapas: gdy przeglądarka nie zgłosi końca nagrania, i tak idziemy dalej
    naCzas(5000 + tekst.length * 110);
    this.kawalek(nagr).then(blob => {
      if (nr !== this.nr) return;
      if (this.url) URL.revokeObjectURL(this.url);
      this.url = URL.createObjectURL(blob);
      a.muted = false; a.onended = koniec; a.onerror = gaworzZamiast;
      a.src = this.url;
      const p = a.play();
      if (p) p.then(() => { this.stan = 'gra'; }).catch(err => {
        if (nr !== this.nr) return;
        // <audio> zablokowane (np. iPhone bez dotknięcia): gramy to samo nagranie przez WebAudio
        this.stan = `blokada audio (${err && err.name}), próbuję WebAudio`;
        this.grajWebAudio(blob, nr).then(ok => {
          if (nr !== this.nr) return;
          if (ok) { clearTimeout(this.zapas); this.stan = 'gra przez WebAudio'; this.zrodlo.onended = koniec; }
          else { this.stan = `zablokowane: ${err && err.name}`; clearTimeout(this.zapas); naCzas(Math.min(9000, 900 + tekst.length * 55)); }
        });
      });
    }).catch(e => { this.stan = `nie mogę pobrać nagrania (${e && e.message})`; gaworzZamiast(); });
  },
  async grajWebAudio(blob, nr) {
    try {
      const c = Fx.kontekst();
      if (!c) return false;
      if (c.state !== 'running') await c.resume().catch(() => {});
      if (c.state !== 'running' || nr !== this.nr) return false;
      const buf = await c.decodeAudioData(await blob.arrayBuffer());
      if (nr !== this.nr) return false;
      const s = c.createBufferSource(); s.buffer = buf; s.connect(c.destination); s.start();
      this.zrodlo = s;
      return true;
    } catch { return false; }
  },
  przerwij() { if (this.zrodlo) { try { this.zrodlo.onended = null; this.zrodlo.stop(); } catch { /* już skończone */ } this.zrodlo = null; } clearTimeout(this.zapas); if (this.audio) { this.audio.onended = null; this.audio.onerror = null; try { this.audio.pause(); } catch { /* nic */ } } Fx.ucisz(); },
  stop() { this.nr++; this.przerwij(); }
};
Glos.wczytaj();
['pointerdown', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, () => Glos.odblokuj(), { capture: true, passive: true }));

/* ---------- efekty dźwiękowe (WebAudio, bez plików) ---------- */
const BARWY_GAWORZENIA = { s: [330, 85, 'triangle'], z: [560, 70, 'square'], n: [190, 105, 'triangle'], smok: [95, 130, 'sawtooth'], przypis: [420, 65, 'square'], kurz: [150, 120, 'triangle'] };
const Fx = {
  ctx: null, wezly: [],
  kontekst() {
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    } catch { return null; }
  },
  ton(f1, f2, t, dl, { typ = 'sine', gl = .15, filtr = 0 } = {}) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = typ;
    o.frequency.setValueAtTime(f1, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dl);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(gl, t + Math.min(.02, dl / 3));
    g.gain.exponentialRampToValueAtTime(.0001, t + dl);
    let wyj = g;
    if (filtr) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filtr; g.connect(f); wyj = f; }
    o.connect(g); wyj.connect(c.destination);
    o.start(t); o.stop(t + dl + .05);
    return o;
  },
  szum(t, dl, { f = 2000, f2 = 0, q = 1, gl = .12, typ = 'bandpass' } = {}) {
    const c = this.ctx, n = Math.ceil(c.sampleRate * dl), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; fl.type = typ; fl.Q.value = q;
    fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dl);
    g.gain.setValueAtTime(gl, t); g.gain.exponentialRampToValueAtTime(.0001, t + dl);
    s.connect(fl).connect(g).connect(c.destination);
    s.start(t); s.stop(t + dl);
  },
  /** huhu (Sówka), kartka (zmiana kadru), badum (po puencie), dzwonek (nagroda), pyk (przycisk), zakl (Zakładka). */
  graj(co) {
    if (Z.ustawienia.gra.dzwieki === false) return;
    const c = this.kontekst();
    if (!c || c.state !== 'running') return;
    const t = c.currentTime + .02;
    try {
      if (co === 'huhu') { this.ton(470, 380, t, .26, { gl: .12, filtr: 1400 }); this.ton(450, 340, t + .34, .4, { gl: .11, filtr: 1300 }); }
      if (co === 'kartka') { this.szum(t, .26, { f: 900, f2: 5200, q: .7, gl: .09 }); this.szum(t + .05, .18, { f: 3500, q: 2, gl: .04 }); }
      if (co === 'badum') {
        this.ton(190, 70, t, .16, { gl: .32 }); this.szum(t, .05, { f: 1800, q: 1, gl: .08 });
        this.ton(170, 65, t + .2, .16, { gl: .3 }); this.szum(t + .2, .05, { f: 1800, q: 1, gl: .08 });
        this.szum(t + .42, .9, { f: 7000, q: .4, gl: .07, typ: 'highpass' });
      }
      if (co === 'dzwonek') [880, 1174.7, 1568, 2093].forEach((f, i) => this.ton(f, 0, t + i * .08, .7, { gl: .07 }));
      if (co === 'pyk') this.ton(520, 980, t, .07, { gl: .06 });
      if (co === 'zakl') { this.ton(900, 1400, t, .08, { gl: .07, typ: 'triangle' }); this.ton(1300, 1700, t + .09, .08, { gl: .06, typ: 'triangle' }); }
    } catch { /* bez dźwięku */ }
  },
  /** Gaworzenie: krótkie „sylaby” w barwie postaci (jak w grach). Zwraca czas trwania w ms. */
  gaworz(tekst, kto = 's') {
    const slowa = String(tekst).replace(/[\p{Extended_Pictographic}]/gu, '').split(/\s+/).filter(Boolean);
    const c = this.kontekst();
    const [baza, krok, typ] = BARWY_GAWORZENIA[kto] || BARWY_GAWORZENIA.s;
    let t0 = c ? c.currentTime + .03 : 0, t = t0, sylab = 0;
    for (const w of slowa) {
      const ile = Math.max(1, Math.min(4, (w.match(/[aeiouyąęó]+/gi) || []).length));
      for (let i = 0; i < ile && sylab < 34; i++, sylab++) {
        const pyt = /\?$/.test(w) && i === ile - 1;
        const f = baza * (0.86 + Math.random() * .34) * (pyt ? 1.3 : 1);
        if (c && c.state === 'running') { try { this.wezly.push(this.ton(f, f * (pyt ? 1.25 : 1.06), t, krok * .75 / 1000 + .02, { typ, gl: .05, filtr: 2400 })); } catch { /* nic */ } }
        t += krok / 1000;
      }
      if (/[.,!?…:;]$/.test(w)) t += .14;
      if (sylab >= 34) break;
    }
    this.wezly = this.wezly.slice(-60);
    return Math.max(700, (t - t0) * 1000);
  },
  ucisz() { this.wezly.forEach(o => { try { o.stop(); } catch { /* już zatrzymany */ } }); this.wezly = []; },
  /* ---------- 2.21: dźwięki tła do czytania (generowane na żywo, bez plików) ---------- */
  szumBufor(rodzaj = 'bialy') {
    const c = this.ctx, n = c.sampleRate * 4, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    let ost = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      if (rodzaj === 'brazowy') { ost = (ost + .02 * w) / 1.02; d[i] = ost * 3.5; } else d[i] = w;
    }
    return b;
  },
  petla(bufor, filtr, czest, q, glosnosc) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = bufor; s.loop = true; f.type = filtr; f.frequency.value = czest; f.Q.value = q;
    g.gain.value = 0; g.gain.setTargetAtTime(glosnosc, c.currentTime, 1.2);
    s.connect(f).connect(g).connect(this.tloWyj); s.start();
    this.tloWezly.push(s);
    return g;
  },
  tlo(rodzaj) {
    this.tloStop();
    if (!rodzaj) return;
    const c = this.kontekst();
    if (!c) return;
    this.tloRodzaj = rodzaj; this.tloWezly = []; this.tloTimery = [];
    this.tloWyj = c.createGain(); this.tloWyj.gain.value = .9; this.tloWyj.connect(c.destination);
    const bialy = this.szumBufor('bialy'), braz = this.szumBufor('brazowy');
    const losowo = (fn, od, doMs) => { const krok = () => { if (this.tloRodzaj !== rodzaj) return; fn(); this.tloTimery.push(setTimeout(krok, od + Math.random() * (doMs - od))); }; this.tloTimery.push(setTimeout(krok, od)); };
    const trzask = (czest, gl, dl) => { const t0 = c.currentTime; const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = bialy; f.type = 'bandpass'; f.frequency.value = czest; f.Q.value = 1.5; g.gain.setValueAtTime(gl, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dl); s.connect(f).connect(g).connect(this.tloWyj); s.start(t0, Math.random() * 3, dl + .02); };
    const ton = (f1, f2, dl, gl, typ = 'sine') => { const t0 = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = typ; o.frequency.setValueAtTime(f1, t0); o.frequency.exponentialRampToValueAtTime(f2, t0 + dl); g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(gl, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + dl); o.connect(g).connect(this.tloWyj); o.start(t0); o.stop(t0 + dl + .05); };
    if (rodzaj === 'deszcz') {
      this.petla(bialy, 'bandpass', 1400, .4, .16); this.petla(braz, 'lowpass', 500, .5, .22);
      losowo(() => trzask(2500 + Math.random() * 4000, .05 + Math.random() * .06, .03), 20, 90);
    }
    if (rodzaj === 'kominek') {
      this.petla(braz, 'lowpass', 320, .6, .38);
      losowo(() => trzask(1500 + Math.random() * 3500, .1 + Math.random() * .25, .02 + Math.random() * .05), 60, 420);
      losowo(() => { for (let i = 0; i < 4; i++) setTimeout(() => trzask(3000, .15, .015), i * 40); }, 2500, 7000);
    }
    if (rodzaj === 'las') {
      const wiatr = this.petla(braz, 'lowpass', 700, .4, .2);
      losowo(() => wiatr.gain.setTargetAtTime(.1 + Math.random() * .22, c.currentTime, 2), 3000, 6000);
      losowo(() => { const f = 2400 + Math.random() * 1800, n = 2 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) setTimeout(() => ton(f, f * (1.2 + Math.random() * .4), .09, .035), i * 130); }, 1500, 5500);
    }
    if (rodzaj === 'kawiarnia') {
      this.petla(braz, 'bandpass', 450, .7, .5); this.petla(bialy, 'bandpass', 900, 1.2, .025);
      losowo(() => { ton(2200 + Math.random() * 600, 2150, .5, .02); ton(3300, 3250, .35, .012); }, 4000, 11000);
    }
    if (rodzaj === 'szum') this.petla(braz, 'lowpass', 900, .5, .45);
  },
  tloStop() {
    this.tloRodzaj = null;
    (this.tloTimery || []).forEach(clearTimeout); this.tloTimery = [];
    const wyj = this.tloWyj, wezly = this.tloWezly || [];
    if (wyj && this.ctx) { wyj.gain.setTargetAtTime(0, this.ctx.currentTime, .3); setTimeout(() => { wezly.forEach(s => { try { s.stop(); } catch { /* nic */ } }); try { wyj.disconnect(); } catch { /* nic */ } }, 1500); }
    this.tloWezly = []; this.tloWyj = null;
  }
};

/* ================= muzyka w tle scen (generowana, bez plików) ================= */
const AKORDY = {
  pokoj: [261.6, 329.6, 392, 587.3], swit: [293.7, 370, 440, 659.3], ksiazka: [261.6, 311.1, 392, 466.2],
  smok: [146.8, 220, 293.7, 349.2], deszcz: [220, 261.6, 329.6, 392], morze: [174.6, 220, 261.6, 349.2],
  kosmos: [164.8, 246.9, 329.6, 493.9], pustynia: [220, 277.2, 329.6, 415.3], zamek: [196, 233.1, 293.7, 349.2], las: [196, 246.9, 293.7, 392], brama: [123.5, 185, 246.9, 293.7]
};
const Muzyka = {
  ctx: null, glosnosc: null, glosy: [],
  start(tlo) {
    if (!Z.ustawienia.gra.muzyka) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      if (!this.glosnosc) { this.glosnosc = this.ctx.createGain(); this.glosnosc.gain.value = .0001; this.glosnosc.connect(this.ctx.destination); }
      this.zmien(tlo);
    } catch { /* bez dźwięku */ }
  },
  zmien(tlo) {
    if (!this.ctx || !Z.ustawienia.gra.muzyka) return;
    const t = this.ctx.currentTime, ak = AKORDY[tlo] || AKORDY.pokoj;
    this.glosy.forEach(g => { g.g.gain.setTargetAtTime(0, t, .8); g.o.stop(t + 4); });
    this.glosy = ak.map((f, i) => {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
      o.type = i === 3 ? 'triangle' : 'sine'; o.frequency.value = f;
      lfo.frequency.value = .08 + i * .03; lg.gain.value = f * .004; lfo.connect(lg); lg.connect(o.frequency);
      g.gain.value = 0; g.gain.setTargetAtTime(i === 3 ? .12 : .22, t + i * .25, 1.2);
      o.connect(g); g.connect(this.glosnosc); o.start(t); lfo.start(t);
      return { o, g };
    });
    this.glosnosc.gain.setTargetAtTime(.07, t, 1.5);
  },
  stop() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.glosnosc && this.glosnosc.gain.setTargetAtTime(.0001, t, .6);
    this.glosy.forEach(g => g.o.stop(t + 3));
    this.glosy = [];
  }
};

/* ================= kinowy odtwarzacz historii (2.17) ================= */
/** Dzieli tekst klatki na kwestie: narracja i dialogi (z przypisanym mówcą). */
function segmentyKlatki(kl) {
  const czesci = kl.t.split(/\s—\s/);
  const wyn = [];
  let ki = 0;
  czesci.forEach((c, i) => {
    let tekst = c.trim(), dialog;
    if (i === 0) { dialog = tekst.startsWith('— '); if (dialog) tekst = tekst.slice(2); }
    else dialog = /^[A-ZĄĆĘŁŃÓŚŹŻ]/.test(tekst);
    if (!dialog && i > 0) tekst = tekst[0].toUpperCase() + tekst.slice(1); // „mruknął smok.” → „Mruknął smok.”
    if (tekst) wyn.push({ kto: dialog ? ((kl.kto && kl.kto[ki++]) || 's') : 'n', tekst });
  });
  return wyn;
}
const PORZADKOWE = ['pierwszy', 'drugi', 'trzeci', 'czwarty', 'piąty', 'szósty', 'siódmy', 'ósmy', 'dziewiąty', 'dziesiąty', 'jedenasty', 'dwunasty', 'trzynasty', 'czternasty', 'piętnasty', 'szesnasty'];

function odtworzRozdzial(nr) {
  Glos.odblokuj();
  const r = HISTORIA[nr];
  if (!r) return;
  const el = document.createElement('div');
  el.className = 'kino';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', `Rozdział ${nr + 1}: ${r.tytul}`);
  el.innerHTML = `<div class="kino-pasek kino-gora"></div><div class="kino-scena"></div><div class="kino-pasek kino-dol"></div>
    <div class="kino-napis" aria-live="polite"><span class="kino-kto"></span><span class="kino-tekst"></span></div>
    <div class="kino-postep"><span></span></div>
    <div class="kino-ster">
      <button type="button" class="kino-btn" data-k="glos" aria-label="Głos">${Z.ustawienia.gra.glos ? '🔊' : '🔇'}</button>
      <button type="button" class="kino-btn" data-k="muzyka" aria-label="Muzyka">${Z.ustawienia.gra.muzyka ? '🎵' : '🔕'}</button>
      <button type="button" class="kino-btn" data-k="pauza" aria-label="Pauza">⏸</button>
      <button type="button" class="kino-btn" data-k="zamknij" aria-label="Zamknij">✕</button></div>
    <p class="kino-podp">Dotknij, żeby przyspieszyć</p>`;
  document.body.append(el);
  document.body.classList.add('kino-otwarte');
  requestAnimationFrame(() => el.classList.add('widoczne'));
  const scena = $('.kino-scena', el), napis = $('.kino-napis', el), kto = $('.kino-kto', el), tekstEl = $('.kino-tekst', el), postep = $('.kino-postep span', el);
  let klatka = -1, seg = 0, pauza = false, zamkniete = false, pisz = null, segmenty = [], czekaj = null;
  const wszystkich = r.klatki.reduce((s, k) => s + segmentyKlatki(k).length, 0);
  let zrobione = 0;

  const zamknij = () => {
    if (zamkniete) return;
    zamkniete = true;
    Glos.stop(); Muzyka.stop(); clearInterval(pisz); clearTimeout(czekaj);
    el.classList.remove('widoczne');
    document.body.classList.remove('kino-otwarte');
    setTimeout(() => el.remove(), 500);
    odswiez();
  };
  const plansza = (gora, dol, potem) => {
    scena.innerHTML = `<div class="kino-plansza"><p class="kino-plansza-gora">${esc(gora)}</p><h2 class="kino-plansza-tytul">${esc(dol)}</h2></div>`;
    napis.classList.remove('widoczny');
    Glos.mow(`Rozdział ${PORZADKOWE[nr] || nr + 1}. ${r.tytul}.`, 'n', { naKoniec: () => { czekaj = setTimeout(potem, 500); } });
  };
  const nastepnaKlatka = () => {
    if (zamkniete) return;
    klatka++;
    if (klatka >= r.klatki.length) { koniec(); return; }
    const kl = r.klatki[klatka];
    const nowa = document.createElement('div');
    nowa.className = `kino-kadr kb-${(nr + klatka) % 4}`;
    // tło: rozmyta kopia sceny na cały ekran (jak w grach), z przodu ostra scena
    const sc = svgKlatki(kl);
    nowa.innerHTML = `<div class="kadr-tlo">${sc.replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ')}</div><div class="kadr-przod">${sc}</div>`;
    scena.querySelectorAll('.kino-kadr, .kino-plansza').forEach(s => { s.classList.add('znika-kadr'); setTimeout(() => s.remove(), 900); });
    scena.append(nowa);
    Fx.graj('kartka');
    if (klatka === 0) Muzyka.start(kl.tlo); else if (r.klatki[klatka - 1].tlo !== kl.tlo) Muzyka.zmien(kl.tlo);
    segmenty = segmentyKlatki(kl); seg = 0;
    czekaj = setTimeout(mowKwestie, 700);
  };
  const mowKwestie = () => {
    if (zamkniete || pauza) return;
    if (seg >= segmenty.length) { czekaj = setTimeout(nastepnaKlatka, 900); return; }
    const s = segmenty[seg], p = POSTACIE[s.kto] || POSTACIE.n;
    kto.textContent = s.kto === 'n' ? '' : p.nazwa;
    kto.style.color = p.kolor;
    napis.classList.toggle('narracja', s.kto === 'n');
    napis.classList.add('widoczny');
    // napis pojawia się litera po literze
    clearInterval(pisz);
    let i = 0;
    tekstEl.textContent = '';
    const tempo = Math.max(18, Math.min(45, 2600 / s.tekst.length));
    pisz = setInterval(() => { i += 2; tekstEl.textContent = s.tekst.slice(0, i); if (i >= s.tekst.length) clearInterval(pisz); }, tempo);
    const postac = scena.querySelector(`.kino-kadr:last-child`);
    if (postac) { postac.classList.remove('mowi-s', 'mowi-z'); if (s.kto === 's' || s.kto === 'z') postac.classList.add(`mowi-${s.kto}`); }
    Glos.mow(s.tekst, s.kto, {
      naKoniec: () => {
        clearInterval(pisz); tekstEl.textContent = s.tekst;
        zrobione++; postep.style.width = `${(zrobione / wszystkich * 100).toFixed(1)}%`;
        seg++;
        czekaj = setTimeout(mowKwestie, s.kto === 'n' ? 450 : 650);
      }
    });
  };
  const koniec = () => {
    const st = historiaStan();
    napis.classList.remove('widoczny');
    const dalej = nr + 1 < st.odblokowane;
    if (Z.ustawienia.gra.historiaWidziane < nr + 1) { Z.ustawienia.gra.historiaWidziane = nr + 1; utrwalUstawienia(); }
    scena.insertAdjacentHTML('beforeend', `<div class="kino-plansza kino-koniec"><p class="kino-plansza-gora">Koniec rozdziału ${nr + 1}</p>
      <h2 class="kino-plansza-tytul">${dalej ? 'Ciąg dalszy czeka!' : st.nastepny ? `Następny za ${ile(st.doNastepnego, FORMY_STRON_D)}` : 'Koniec przygody… na razie! 🦉🔖'}</h2>
      <div class="przyciski przyciski-srodek">${dalej ? '<button type="button" class="btn btn-zloty" data-k="dalej">Następny rozdział ›</button>' : ''}<button type="button" class="btn btn-na-plotnie" data-k="zamknij">Zamknij</button></div></div>`);
    Glos.mow(dalej ? 'Ciąg dalszy nastąpi.' : st.nastepny ? 'Czytaj dalej, a przygoda będzie trwać.' : 'Koniec. Na razie!', 'n');
  };
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-k]');
    if (b) {
      const k = b.dataset.k;
      if (k === 'zamknij') zamknij();
      if (k === 'dalej') { zamknij(); setTimeout(() => odtworzRozdzial(nr + 1), 550); }
      if (k === 'glos') { Z.ustawienia.gra.glos = !Z.ustawienia.gra.glos; utrwalUstawienia(); b.textContent = Z.ustawienia.gra.glos ? '🔊' : '🔇'; if (!Z.ustawienia.gra.glos) Glos.stop(); }
      if (k === 'muzyka') { Z.ustawienia.gra.muzyka = !Z.ustawienia.gra.muzyka; utrwalUstawienia(); b.textContent = Z.ustawienia.gra.muzyka ? '🎵' : '🔕'; if (Z.ustawienia.gra.muzyka) Muzyka.start(r.klatki[Math.max(0, klatka)].tlo); else Muzyka.stop(); }
      if (k === 'pauza') {
        pauza = !pauza; b.textContent = pauza ? '▶' : '⏸'; el.classList.toggle('pauza', pauza);
        if (pauza) { Glos.stop(); clearTimeout(czekaj); clearInterval(pisz); } else mowKwestie();
      }
      return;
    }
    // dotknięcie sceny: przeskocz do następnej kwestii
    if (pauza || klatka < 0 || klatka >= r.klatki.length) return;
    Glos.stop(); clearTimeout(czekaj); clearInterval(pisz);
    if (segmenty[seg]) { tekstEl.textContent = segmenty[seg].tekst; zrobione++; seg++; }
    czekaj = setTimeout(mowKwestie, 150);
  });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { zamknij(); document.removeEventListener('keydown', esc); } });
  plansza(`Rozdział ${nr + 1}`, r.tytul, nastepnaKlatka);
}

/* ================= Sówka z zaskoczenia: żarty, teksty i kłótnie same wyskakują (2.17, głosy 2.18) ================= */
const losuj = l => l[Math.floor(Math.random() * l.length)];
/**
 * Wyskakująca scenka: Sówka i Zakładka mówią po kolei swoimi głosami.
 * kwestie: [{ kto: 's'|'z', tekst, mowa? (gdy mówi co innego niż napis), dopisz? (pod poprzednią), puenta?, smiech? }]
 */
function rozmowa(kwestie, { czasKonca = 5500, gosc = null } = {}) {
  const g = Z.ustawienia.gra;
  kwestie = kwestie.filter(Boolean);
  if (!g.sowka || !kwestie.length || document.body.classList.contains('kino-otwarte')) return false;
  let el = $('#sowka-wyskok');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sowka-wyskok';
    el.className = 'sowka-wyskok';
    el.innerHTML = `<div class="wyskok-postacie"><button type="button" class="wyskok-sowa" aria-label="Schowaj">${svgSowki('zadowolona', g.zalozone)}</button><span class="wyskok-zakl">${svgZakladki('macha')}</span></div>
      <div class="wyskok-gosc" aria-hidden="true"></div>
      <div class="wyskok-dymek" aria-live="polite"><button type="button" class="wyskok-x" aria-label="Zamknij">✕</button><p class="wyskok-kto"></p><p class="wyskok-tekst"></p><p class="wyskok-puenta" hidden></p></div>`;
    document.body.append(el);
    // dotknięcie dymka przewija do następnej kwestii (jak w grach), ✕ albo dotknięcie po ostatniej kwestii zamyka
    el.addEventListener('click', e => {
      if (e.target.closest('.wyskok-x') || !U.rozmowaPomin || !U.rozmowaPomin()) schowajRozmowe();
    });
  }
  const nr = U.rozmowaNr = (U.rozmowaNr || 0) + 1;
  clearTimeout(U.wyskokTimer); clearTimeout(U.puentaTimer);
  $('.wyskok-sowa', el).innerHTML = svgSowki('czeka', g.zalozone);
  el.classList.toggle('z-zakladka', kwestie.some(k => k.kto === 'z'));
  el.classList.toggle('sama-zakladka', kwestie.every(k => k.kto === 'z'));
  document.body.classList.toggle('zakl-w-rozmowie', kwestie.some(k => k.kto === 'z'));
  el.classList.toggle('z-towarzyszka', !!Sowa.el);
  const goscEl = $('.wyskok-gosc', el);
  goscEl.className = 'wyskok-gosc'; goscEl.innerHTML = gosc ? svgGoscia(gosc) : '';
  el.classList.toggle('z-gosciem', !!gosc);
  if (gosc) { goscEl.classList.add(`gosc-${gosc}`); requestAnimationFrame(() => goscEl.classList.add('wchodzi')); Fx.graj(gosc === 'smok' ? 'kartka' : 'pyk'); }
  Sowa.doRozmowy(kwestie.some(k => k.kto === 's'));
  el.classList.remove('widoczny', 'smieje'); void el.offsetWidth; el.classList.add('widoczny');
  Fx.graj(kwestie[0].kto === 'z' ? 'zakl' : 'huhu');
  const ktoEl = $('.wyskok-kto', el), tEl = $('.wyskok-tekst', el), pEl = $('.wyskok-puenta', el);
  let i = 0;
  U.rozmowaPomin = () => {
    if (nr !== U.rozmowaNr || i >= kwestie.length) return false;
    clearTimeout(U.puentaTimer); Glos.stop(); dalej();
    return true;
  };
  const dalej = () => {
    if (nr !== U.rozmowaNr) return;
    if (i >= kwestie.length) { U.wyskokTimer = setTimeout(schowajRozmowe, czasKonca); return; }
    const k = kwestie[i++], p = POSTACIE[k.kto] || POSTACIE.s;
    el.dataset.mowi = gosc && k.kto === gosc ? 'g' : k.kto;
    if (gosc) $('.wyskok-gosc', el).classList.toggle('mowi', k.kto === gosc);
    if (k.wyjscie && gosc) { const ge = $('.wyskok-gosc', el); ge.classList.remove('wchodzi', 'mowi'); ge.classList.add('wychodzi'); }
    Sowa.mowiTeraz(k.kto === 's');
    if (k.dopisz) { pEl.textContent = k.tekst; pEl.hidden = false; pEl.classList.remove('nowy'); void pEl.offsetWidth; pEl.classList.add('nowy'); }
    else {
      ktoEl.textContent = p.nazwa; ktoEl.style.color = p.kolor;
      tEl.textContent = k.tekst; pEl.hidden = true;
      const d = $('.wyskok-dymek', el); d.classList.remove('nowy'); void d.offsetWidth; d.classList.add('nowy');
    }
    if (k.fx) Fx.graj(k.fx);
    if (k.puenta || k.smiech) { el.classList.add('smieje'); setTimeout(() => el.classList.remove('smieje'), 1300); if (navigator.vibrate) navigator.vibrate([10, 40, 10]); }
    if (k.kto === 's') $('.wyskok-sowa', el).innerHTML = svgSowki(k.puenta || k.smiech ? 'zadowolona' : 'czeka', g.zalozone);
    const start = Date.now(), minCzas = k.czytaj ? Math.min(11000, k.tekst.length * 48) : 0;
    Glos.mow(k.mowa ?? k.tekst, k.kto, {
      wl: g.glosSowki && !k.cicho,
      naKoniec: () => {
        if (nr !== U.rozmowaNr) return;
        if (k.puenta) Fx.graj('badum');
        U.puentaTimer = setTimeout(dalej, Math.max(k.puenta ? 1000 : 550, minCzas - (Date.now() - start)));
      }
    });
  };
  dalej();
  U.ostatniWyskok = Date.now();
  return true;
}
function schowajRozmowe() {
  const el = $('#sowka-wyskok');
  U.rozmowaNr = (U.rozmowaNr || 0) + 1;
  clearTimeout(U.wyskokTimer); clearTimeout(U.puentaTimer);
  Glos.stop();
  if (el) el.classList.remove('widoczny');
  document.body.classList.remove('zakl-w-rozmowie');
  Sowa.poRozmowie();
}
/** Sówka (albo Zakładka) mówi jedną kwestię, czasem z puentą żartu. */
function sowkaMowi(tekst, { puenta = null, glosem = true, czas = 9000, mowa, kto = 's', smiech = true } = {}) {
  const k = [{ kto, tekst, mowa, cicho: !glosem, czytaj: !puenta }];
  if (puenta) {
    k.push({ kto, tekst: puenta, dopisz: true, puenta: true, cicho: !glosem });
    // Zakładka czasem się śmieje z żartu Sówki
    if (kto === 's' && smiech && Math.random() < .5) k.push({ kto: 'z', tekst: losuj(SMIECH_ZAKLADKI), smiech: true });
  }
  return rozmowa(k, { czasKonca: puenta ? 5000 : Math.max(2500, czas - 4000) });
}
/** Losowanie bez powtórek: przetasowana kolejka zapisana w telefonie. Nic się nie powtórzy, dopóki nie padnie wszystko. */
function zKolejki(klucz, lista) {
  let k = [];
  try { k = JSON.parse(lsGet(`zakladka-kolejka-${klucz}`) || '[]'); } catch { k = []; }
  k = k.filter(i => i < lista.length);
  if (!k.length) {
    k = lista.map((_, i) => i);
    for (let i = k.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [k[i], k[j]] = [k[j], k[i]]; }
  }
  const i = k.shift();
  lsSet(`zakladka-kolejka-${klucz}`, JSON.stringify(k));
  return lista[i];
}
const losowyZart = () => zKolejki('zarty', ZARTY);
const losowyZartZakladki = () => zKolejki('zarty18', ZARTY_ZAKLADKI_18);
/** Zakładka rzuca swój (nieocenzurowany) żart, a Sówka czasem ją ochrzani. */
function zartZakladki() {
  const [a, b] = losowyZartZakladki();
  const klotnia = Math.random() < .45;
  return rozmowa([
    { kto: 'z', tekst: a }, { kto: 'z', tekst: b, dopisz: true, puenta: true },
    klotnia && { kto: 's', tekst: losuj(RECENZJA.ripostaS) },
    klotnia && Math.random() < .6 && { kto: 'z', tekst: losuj(RECENZJA.ripostaZ) }
  ], { czasKonca: 4500 });
}
/** Jak często Sówka sama coś mówi: minimalna przerwa między wyskokami (sprawdzamy co 30 s, z losowością). */
const CZESTOSC_GADANIA = {
  rzadko: { nazwa: 'Rzadko', opis: 'mniej więcej co 8–10 minut', przerwa: 8 * 60 * 1000 },
  normalnie: { nazwa: 'Normalnie', opis: 'mniej więcej co 3–4 minuty', przerwa: 3 * 60 * 1000 },
  czesto: { nazwa: 'Często', opis: 'mniej więcej co minutę', przerwa: 60 * 1000 }
};
/** Co jakiś czas, gdy jesteś w aplikacji, ktoś sam coś mówi: żart Sówki, żart Zakładki, motywację albo ciekawostkę. */
function niespodziankaSowki(powod = 'losowo') {
  const g = Z.ustawienia.gra;
  if (!g.sowka || !g.zarty || otwarte.length || document.hidden || document.body.classList.contains('kino-otwarte')) return;
  const h = new Date().getHours();
  if (powod === 'losowo' && (h >= 23 || h < 6)) return;
  if (powod === 'losowo' && U.ostatniWyskok && Date.now() - U.ostatniWyskok < (CZESTOSC_GADANIA[g.czestosc] || CZESTOSC_GADANIA.normalnie).przerwa) return;
  if (powod === 'losowo' && Date.now() - Sowa.ostatniaAktywnosc > 5 * 60 * 1000) return; // nie gadamy do pustego ekranu
  const los = Math.random();
  // nowy gość (świeżo odblokowany rozdział) wpada od razu, potem co jakiś czas
  const nowyGosc = Object.keys(GOSCIE).find(k => historiaStan().odblokowane >= GOSCIE[k].od && !(lsGet('zakladka-goscie') || '').split(',').includes(k));
  if (nowyGosc) { lsSet('zakladka-goscie', [lsGet('zakladka-goscie') || '', nowyGosc].filter(Boolean).join(',')); wizytaGoscia(nowyGosc); return; }
  if (los < .17 && wizytaGoscia()) return;
  if (los < .45) opowiedzCiekawostke();
  else if (g.zakladka18 && los < .55) zartZakladki();
  else if (los < .82) { const [a, b] = losowyZart(); sowkaMowi(a, { puenta: b }); }
  else sowkaMowi(motywacja());
}
/** Reakcja na zapisane strony: nagrana pochwała, czasem z żartem na deser. */
function reakcjaNaStrony(roznica) {
  if (!Z.ustawienia.gra.sowka || roznica <= 0) return;
  Sowa.salto();
  const pochwala = losuj(POCHWALY_NAGRANE), napis = `+${roznica} ${odmiana(roznica, FORMY_STRON)}! ${pochwala}`;
  if (Math.random() < .4 && Z.ustawienia.gra.zarty) {
    const [a, b] = losowyZart();
    setTimeout(() => rozmowa([{ kto: 's', tekst: napis, mowa: pochwala }, { kto: 's', tekst: a }, { kto: 's', tekst: b, dopisz: true, puenta: true }]), 600);
  } else setTimeout(() => sowkaMowi(napis, { mowa: pochwala, czas: 6000 }), 600);
}

/* ---------- recenzja Sówki po dodaniu książki (2.18) ---------- */
function ciekawostkaOKsiazce(k) {
  const f = k.fakty || {}, kand = [], rok = parseInt((f.wydanie || [])[0], 10), teraz = new Date().getFullYear();
  if (f.nagrody) kand.push(`Ciekawostka: ta książka zdobyła ${f.nagrody.length > 1 ? `aż ${f.nagrody.length} nagrody, m.in.` : 'nagrodę'} ${f.nagrody[0]}.`);
  if (rok > 0 && rok <= teraz) kand.push(teraz - rok >= 50 ? `Ciekawostka: pierwsze wydanie było w ${rok} roku. Ma ${teraz - rok} lat i dalej ludzie ją czytają, to się nazywa klasyk!` : `Ciekawostka: pierwszy raz wydano ją w ${rok} roku.`);
  if (f.miejsceAkcji) kand.push(`Ciekawostka: akcja dzieje się tu: ${f.miejsceAkcji.slice(0, 2).join(', ')}.`);
  if (f.tytulOryginalny && normKwestii(f.tytulOryginalny[0]) !== normKwestii(k.tytul)) kand.push(`Ciekawostka: w oryginale nazywa się „${f.tytulOryginalny[0]}”.`);
  if (f.cykl) kand.push(`Ciekawostka: to część cyklu „${f.cykl[0]}”. Będzie co czytać!`);
  if (f.gatunek) kand.push(`To ${f.gatunek.slice(0, 2).join(' i ')}.`);
  if (!kand.length && k.opis) { const zd = k.opis.split(/(?<=[.!?])\s+/)[0]; if (zd && zd.length > 20) kand.push(zd.length > 170 ? `${zd.slice(0, 167)}…` : zd); }
  const dni = Math.max(1, Math.ceil(k.strony / 30));
  kand.push(`${k.strony} ${odmiana(k.strony, FORMY_STRON)}. Przy 30 stronach dziennie to ${ile(dni, ['dzień', 'dni', 'dni'])} czytania.`);
  // fakty z internetu są ciekawsze niż liczenie stron
  return kand.length > 1 && Math.random() < .8 ? losuj(kand.slice(0, -1)) : losuj(kand);
}
/** Ocena Sówki 1–5: czy pasuje do książek, które oceniłeś wysoko, plus nagrody i „klasyczność”. */
function ocenaSowki(k) {
  const lubiane = {}, oceniane = Z.ksiazki.filter(x => x.id !== k.id && x.ocena >= 4);
  oceniane.forEach(x => kategorieKsiazki(x).forEach(c => { lubiane[c] = (lubiane[c] || 0) + 1; }));
  const kat = kategorieKsiazki(k), trafione = kat.filter(c => lubiane[c]).length;
  const pasujeGust = !oceniane.length || !kat.length || trafione > 0;
  const siec = ocenaProc(k.opinieNet); // opinie z internetu: 0–1
  // bez opinii z sieci: gust + nagrody; z opiniami: średnia czytelników poprawiona o twój gust
  let o = siec != null ? siec * 5 + (trafione ? .4 : 0) - (oceniane.length && kat.length && !trafione ? .4 : 0)
    : 3.5 + (trafione ? 1 : 0) + (k.fakty && k.fakty.nagrody ? .5 : 0) + (oceniane.length && kat.length && !trafione ? -.5 : 0) + (!oceniane.length ? .5 : 0);
  if (siec != null && k.fakty && k.fakty.nagrody) o += .2;
  const gwiazdki = Math.max(1, Math.min(5, Math.round(o)));
  return { gwiazdki, pasuje: siec != null ? (siec >= .75 || (pasujeGust && siec >= .64)) : pasujeGust, siec };
}
/* opinie mówione nagranym głosem: każda możliwa średnia, liczba ocen, wydźwięk i tematy z opinii */
const LICZBY_SLOWNIE = ['zero', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć', 'dziesięć'];
function zdanieOceny(o) {
  const [c, d] = (Math.round(o.ocena * 10) / 10).toFixed(1).split('.');
  return `${o.zrodlo === 'Lubimyczytać' ? 'Na Lubimyczytać' : 'W Open Library'} ma średnią ${LICZBY_SLOWNIE[+c]}${d !== '0' ? ` przecinek ${LICZBY_SLOWNIE[+d]}` : ''} na ${o.skala === 5 ? 'pięć' : 'dziesięć'}.`;
}
const ZDANIA_ILOSCI = [[50, 'Ocen jest na razie niewiele.'], [100, 'Oceniło ją kilkadziesiąt osób.'], [1000, 'Oceniło ją kilkaset osób.'], [10000, 'Oceniło ją kilka tysięcy osób.'], [20000, 'Oceniło ją kilkanaście tysięcy osób.'], [100000, 'Oceniło ją kilkadziesiąt tysięcy osób!'], [Infinity, 'Oceniło ją ponad sto tysięcy osób!']];
const zdanieIlosci = n => ZDANIA_ILOSCI.find(([g]) => n < g)[1];
const ZDANIA_TEMATOW = { wciaga: 'Ludzie piszą, że bardzo wciąga.', nudna: 'Niektórzy narzekają, że się dłuży.', klimat: 'Chwalą klimat.', humor: 'Dużo osób śmiało się przy czytaniu.', jezyk: 'Chwalą styl i język.', emocje: 'Piszą, że mocno porusza.', polecam: 'Wiele osób poleca ją dalej.', rozczarowanie: 'Kilka osób jest rozczarowanych.', bohaterowie: 'Czytelnicy dużo piszą o bohaterach.', zakonczenie: 'Wiele osób wspomina zakończenie.' };
const ZDANIA_WYDZWIEKU = ['Opinie, które przeczytałam, są zachwycone.', 'Opinie, które przeczytałam, są mieszane.', 'W opiniach jest sporo narzekania.'];
/** Kwestie Sówki o opiniach z sieci: wszystko mówione z nagrań, oprócz samego cytatu. */
function kwestieOpinii(o) {
  const siec = ocenaProc(o), kw = [{ kto: 's', tekst: losuj(RECENZJA.siec) }];
  kw.push({ kto: 's', tekst: `${o.zrodlo}: ${ocenaTekst(o)}${o.ocen ? `, ${o.ocen.toLocaleString('pl-PL')} ${odmiana(o.ocen, ['ocena', 'oceny', 'ocen'])}` : ''} ${'★'.repeat(Math.round(siec * 5))}`, mowa: zdanieOceny(o) });
  if (o.ocen) kw.push({ kto: 's', tekst: zdanieIlosci(o.ocen) });
  kw.push({ kto: 's', tekst: losuj(siec >= .76 ? RECENZJA.wysoko : siec >= .62 ? RECENZJA.srednio : RECENZJA.nisko) });
  if (o.opinieSrednia && (o.opinie || []).length) kw.push({ kto: 's', tekst: ZDANIA_WYDZWIEKU[o.opinieSrednia >= 8 ? 0 : o.opinieSrednia >= 6 ? 1 : 2] });
  const tematy = Object.entries(o.tematy || {}).filter(([t, n]) => n >= 2 && ZDANIA_TEMATOW[t]).sort((a, b) => b[1] - a[1]).slice(0, 2);
  tematy.forEach(([t]) => kw.push({ kto: 's', tekst: ZDANIA_TEMATOW[t] }));
  const cyt = (o.opinie || []).length ? losuj(o.opinie) : null;
  if (cyt) { kw.push({ kto: 's', tekst: losuj(RECENZJA.cytat) }); kw.push({ kto: 's', tekst: `„${cyt.tekst}”${cyt.ocena ? ` (${cyt.ocena}/10)` : ''}`, czytaj: true }); }
  return kw;
}
/** Po dodaniu książki (każdą drogą): opis, opinie z sieci i recenzja Sówki. */
function poDodaniu(k, { opisGotowy = null } = {}) {
  if (!k) return;
  const opis = opisGotowy || (!k.opis ? uzupelnijOpis(k, { cicho: true }) : null);
  const opinie = pobierzOpinie(k, { cicho: true });
  recenzjaKsiazki(k, opis, opinie);
}
async function recenzjaKsiazki(k, opisGotowy, opinieGotowe) {
  const g = Z.ustawienia.gra;
  if (!g.sowka || !k) return;
  // chwilę czekamy na opis, fakty i opinie z internetu (najwyżej 9 s)
  if (U.recenzjaTrwa && Date.now() - U.recenzjaTrwa < 60000) return; // jedna recenzja naraz (np. przy Odkrywaj)
  U.recenzjaTrwa = Date.now();
  await Promise.race([Promise.all([opisGotowy, opinieGotowe].map(p => p || Promise.resolve())), new Promise(r => setTimeout(r, 10000))]);
  // nie przerywamy, tylko czekamy, aż zamkniesz okna (do 40 s)
  for (let i = 0; i < 80 && (otwarte.length || document.body.classList.contains('kino-otwarte') || document.hidden); i++) await new Promise(r => setTimeout(r, 500));
  if (otwarte.length || document.body.classList.contains('kino-otwarte')) { U.recenzjaTrwa = 0; return; }
  setTimeout(() => { U.recenzjaTrwa = 0; }, 30000);
  const { gwiazdki, pasuje, siec } = ocenaSowki(k);
  const werdykt = losuj(pasuje ? RECENZJA.dobryWybor : RECENZJA.ryzyko);
  const o = k.opinieNet;
  const kwestie = [
    { kto: 's', tekst: losuj(RECENZJA.start) },
    { kto: 's', tekst: `*kartkuje „${k.tytul}”* Hm… hm… hu-hu…`, fx: 'kartka' }
  ];
  if (o) {
    kwestie.push(...kwestieOpinii(o));
    if (Math.random() < .35) kwestie.push({ kto: 's', tekst: ciekawostkaOKsiazce(k), czytaj: true });
  } else kwestie.push({ kto: 's', tekst: ciekawostkaOKsiazce(k), czytaj: true });
  kwestie.push({ kto: 's', tekst: `${werdykt} Moja ocena: ${'★'.repeat(gwiazdki)}${'☆'.repeat(5 - gwiazdki)}`, mowa: werdykt });
  // czasem Zakładka się nie zgadza i robi się kłótnia
  if (Math.random() < .55) {
    kwestie.push({ kto: 'z', tekst: losuj(o && Math.random() < .5 ? RECENZJA.opinieZ : k.strony > 500 ? RECENZJA.grubaZ : k.strony < 200 ? RECENZJA.krotkaZ : RECENZJA.zaczepkaZ) });
    kwestie.push({ kto: 's', tekst: losuj(RECENZJA.ripostaS) });
    if (Math.random() < .7) kwestie.push({ kto: 'z', tekst: losuj(RECENZJA.ripostaZ), smiech: false });
    kwestie.push({ kto: 's', tekst: losuj(RECENZJA.koniecS) });
  }
  rozmowa(kwestie, { czasKonca: 6000 });
}

/* ================= Sówka-towarzyszka: lata po aplikacji i reaguje na to, co robisz (2.19) ================= */
const Sowa = {
  el: null, cialo: null, dymek: null, x: 0, y: 0, W: 58, H: 64,
  spi: false, lata: false, wlasna: false, gada: false, schowana: false,
  klik: [], ostatniaAktywnosc: Date.now(), ostatniKomentarz: 0, widok: null,
  get wl() { return Z.ustawienia.gra.sowka && !bezRuchu(); },
  init() {
    if (this.el || !Z.ustawienia.gra.sowka) return;
    const el = document.createElement('button');
    el.type = 'button'; el.id = 'sowa-lot'; el.className = 'sowa-lot';
    el.setAttribute('aria-label', 'Sówka. Dotknij, żeby coś powiedziała. Możesz ją też przenieść.');
    el.innerHTML = `<span class="sowa-cialo">${svgSowki('czeka', Z.ustawienia.gra.zalozone)}</span>`;
    const d = document.createElement('p');
    d.className = 'sowa-dymek'; d.hidden = true; d.setAttribute('aria-live', 'polite');
    document.body.append(el, d);
    this.el = el; this.cialo = $('.sowa-cialo', el); this.dymek = d;
    const p = this.grzeda(); this.ustaw(p.x, p.y);
    this.wyglad();
    this.podlaczDotyk();
    // oczy śledzą palec / kursor, przewijanie i bezczynność
    let raf = 0, px = innerWidth / 2, py = innerHeight / 2;
    document.addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(() => { raf = 0; this.patrz(px, py); }); }, { passive: true });
    document.addEventListener('pointerdown', e => { this.patrz(e.clientX, e.clientY); this.aktywnosc(e); }, { capture: true, passive: true });
    let ostY = scrollY, ostT = performance.now(), przewTimer = 0;
    addEventListener('scroll', () => {
      const t = performance.now(), v = (scrollY - ostY) / Math.max(1, t - ostT) * 1000;
      ostY = scrollY; ostT = t;
      this.aktywnosc();
      this.el.classList.toggle('patrzy-dol', v > 0); this.el.classList.toggle('patrzy-gora', v < 0);
      this.patrz(this.x + this.W / 2, v > 0 ? innerHeight : 0);
      clearTimeout(przewTimer); przewTimer = setTimeout(() => this.el.classList.remove('patrzy-dol', 'patrzy-gora'), 400);
      if (Math.abs(v) > 4500 && Math.random() < .5) this.powiedz(losuj(SOWA_TEKSTY.szybko), { cooldown: 45000 });
      if (scrollY + innerHeight > document.documentElement.scrollHeight - 40 && document.documentElement.scrollHeight > innerHeight * 3.5 && U.sowaDlugo !== this.widok) {
        U.sowaDlugo = this.widok; this.powiedz(SOWA_TEKSTY.dlugo[0], { cooldown: 30000 });
      }
    }, { passive: true });
    addEventListener('resize', () => { if (!this.lata && !this.gada && !this.schowana) { const g = this.wlasna ? this.wPolu(this.x, this.y) : this.grzeda(); this.ustaw(g.x, g.y); } });
    // drobne zachowania: przechyla głowę, rozgląda się, podskakuje; po długiej bezczynności zasypia
    setInterval(() => this.zycie(), 6000);
  },
  /** Grzęda: Sówka siedzi na aktywnej zakładce dolnego menu. */
  grzeda() {
    const b = $('#nawigacja [aria-current="page"]'), r = b && b.getBoundingClientRect();
    if (!r || !r.width) return this.wPolu(innerWidth - this.W - 14, innerHeight - this.H - 90);
    return this.wPolu(r.left + r.width / 2 - this.W / 2, r.top - this.H + 16);
  },
  /** Miejsce obok dymka rozmowy (lewy dół). */
  domek() {
    const n = $('#nawigacja'), top = n ? n.getBoundingClientRect().top : innerHeight - 70;
    const lewy = Math.max(12, (innerWidth - 520) / 2);
    return { x: lewy + 8, y: top - 14 - this.H - 12 };
  },
  wPolu(x, y) { return { x: Math.max(4, Math.min(innerWidth - this.W - 4, x)), y: Math.max(56, Math.min(innerHeight - this.H - 4, y)) }; },
  ustaw(x, y, s = 1) { this.x = x; this.y = y; this.s = s; this.el.style.transform = `translate(${x}px, ${y}px) scale(${s})`; this.pozycjaDymka(); },
  wyglad(tryb) {
    tryb = tryb || (this.spi ? 'spi' : this.gada ? 'zadowolona' : 'czeka');
    if (this.cialo.dataset.tryb === tryb && this.cialo.dataset.zal === String(Z.ustawienia.gra.zalozone)) return;
    this.cialo.dataset.tryb = tryb; this.cialo.dataset.zal = String(Z.ustawienia.gra.zalozone);
    this.cialo.innerHTML = svgSowki(tryb, Z.ustawienia.gra.zalozone);
    this.el.classList.toggle('spi', tryb === 'spi');
  },
  /** Zrenice patrzą w stronę palca/kursora (też u Sówki w karcie na ekranie Dziś). */
  patrz(px, py) {
    $$('.sowa-lot .sowka-svg, .sowka-karta .sowka .sowka-svg').forEach(svg => {
      const r = svg.getBoundingClientRect();
      if (!r.width) return;
      const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height * .37), d = Math.hypot(dx, dy) || 1, s = Math.min(1, d / 160) * 3.2;
      svg.querySelectorAll('.s-zrenica').forEach(z => { z.style.transform = `translate(${(dx / d * s).toFixed(2)}px, ${(dy / d * s).toFixed(2)}px)`; });
    });
  },
  /** Lot po łuku z machaniem skrzydłami. */
  lec(x, y, { wysoko = 70, czas, skala = 1, bezGranic = false } = {}) {
    if (!this.el) return Promise.resolve();
    const cel = bezGranic ? { x, y } : this.wPolu(x, y), x0 = this.x, y0 = this.y, s0 = this.s || 1, dyst = Math.hypot(cel.x - x0, cel.y - y0);
    if (this.anim) { this.anim.oncancel = this.anim.onfinish = null; this.anim.cancel(); this.anim = null; this.lata = false; }
    if (dyst < 6 || !this.wl) { this.ustaw(cel.x, cel.y, skala); return Promise.resolve(); }
    if (this.spi) this.obudz(false);
    this.lata = true;
    this.el.style.setProperty('--kier', cel.x < x0 ? -1 : 1);
    this.el.classList.add('leci'); this.el.classList.remove('laduje');
    this.schowajDymek();
    const t = czas || (dyst < 40 ? 200 : Math.max(520, Math.min(1300, dyst * 2.1))), gora = Math.min(y0, cel.y) - (dyst < 40 ? 0 : Math.min(wysoko, 40 + dyst * .25));
    const sk = f => (s0 + (skala - s0) * f).toFixed(3);
    this.anim = this.el.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(${s0})` },
      { transform: `translate(${x0 + (cel.x - x0) * .3}px, ${gora + 10}px) scale(${sk(.3)})`, offset: .35 },
      { transform: `translate(${x0 + (cel.x - x0) * .7}px, ${gora}px) scale(${sk(.7)})`, offset: .65 },
      { transform: `translate(${cel.x}px, ${cel.y}px) scale(${skala})` }
    ], { duration: t, easing: 'cubic-bezier(.45, .05, .35, 1)' });
    if (Math.random() < .12) Fx.graj('huhu');
    return new Promise(ok => {
      this.anim.onfinish = this.anim.oncancel = () => {
        this.anim = null; this.lata = false;
        this.ustaw(cel.x, cel.y, skala);
        this.el.classList.remove('leci');
        void this.el.offsetWidth; this.el.classList.add('laduje');
        setTimeout(() => this.el && this.el.classList.remove('laduje'), 500);
        ok();
      };
    });
  },
  /** Fikołek w powietrzu (np. za zapisane strony). */
  salto() {
    if (!this.el || !this.wl || this.lata) return;
    if (this.spi) this.obudz(false);
    this.el.classList.add('leci');
    this.cialo.animate([{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-70px) rotate(-180deg)', offset: .5 }, { transform: 'translateY(0) rotate(-360deg)' }], { duration: 900, easing: 'ease-in-out' })
      .onfinish = () => { this.el.classList.remove('leci'); this.el.classList.add('laduje'); setTimeout(() => this.el.classList.remove('laduje'), 500); };
  },
  wroc() {
    if (!this.el || this.gada || this.schowana) return;
    const g = this.grzeda();
    this.lec(g.x, g.y);
    this.wlasna = false;
  },
  /** Wywoływane po każdym renderze widoku: przelot na nową zakładkę i czasem komentarz. */
  poZmianieWidoku(widok) {
    if (!Z.ustawienia.gra.sowka) { this.usun(); return; }
    this.init();
    const pierwszy = this.widok == null, nowy = this.widok !== widok;
    this.widok = widok;
    if (nowy) { this.wlasna = false; U.sowaDlugo = null; this.zmianaWidoku = Date.now(); }
    // wychodzimy z ekranu Dziś: Sówka wylatuje z miejsca, gdzie była jej karta
    if (nowy && this.schowana) {
      const r = this.kartaRect;
      this.schowana = false; this.el.classList.remove('w-karcie');
      if (r) this.ustaw(r.left, r.top, r.width / this.W);
    }
    const karta = this.karta();
    this.obserwujKarte(karta, pierwszy);
    if (!nowy || pierwszy || this.gada) return;
    if (karta && this.widacKarte(karta)) return; // obserwator sam wprowadzi Sówkę do karty
    requestAnimationFrame(() => {
      const g = this.grzeda();
      this.lec(g.x, g.y).then(() => {
        const teksty = SOWA_TEKSTY.ekran[widok];
        if (teksty && Z.ustawienia.gra.zarty && Math.random() < .45) this.powiedz(losuj(teksty), { cooldown: 70000 });
      });
    });
  },
  karta() { return $('#widok .sowka-karta .sowka'); },
  widacKarte(k) { const r = k.getBoundingClientRect(); return r.bottom > 70 && r.top < innerHeight - 90; },
  /** Na ekranie Dziś Sówka mieszka w swojej karcie. Wylatuje, gdy karta zniknie z ekranu, i wraca, gdy się pojawi. */
  obserwujKarte(k, odRazu = false) {
    if (this.io) { this.io.disconnect(); this.io = null; }
    if (!k || !('IntersectionObserver' in window)) return;
    if (this.schowana) { this.kartaRect = this.rectKarty(k); return this.patrzKarte(k); }
    k.classList.add('pusta'); // miejsce w karcie czeka, aż Sówka doleci
    if (odRazu && this.widacKarte(k)) { this.wKarcie(k); return this.patrzKarte(k); }
    this.patrzKarte(k);
  },
  patrzKarte(k) {
    this.io = new IntersectionObserver(([w]) => {
      if (this.gada) return;
      if (w.isIntersecting && w.intersectionRatio > .45) this.doKarty(k);
      else if (!w.isIntersecting || w.intersectionRatio < .2) this.zKarty(k);
    }, { threshold: [0, .2, .45, 1] });
    this.io.observe(k);
  },
  rectKarty(k) { const s = k.querySelector('.sowka-svg') || k; return s.getBoundingClientRect(); },
  /** Przelot do karty: rośnie po drodze do jej rozmiaru i siada dokładnie na swoim miejscu. */
  doKarty(k, proba = 0) {
    if (this.schowana || this.wDrodzeDoKarty || !k.isConnected) return;
    // ekran jeszcze wjeżdża (animacja wejścia), więc karta się przesuwa: chwilę czekamy
    const czekaj = 480 - (Date.now() - (this.zmianaWidoku || 0));
    if (czekaj > 0) { clearTimeout(this.kartaTimer); this.kartaTimer = setTimeout(() => this.doKarty(k, proba), czekaj); return; }
    this.wDrodzeDoKarty = true;
    k.classList.add('pusta');
    const r = this.rectKarty(k);
    this.lec(r.left, r.top, { skala: r.width / this.W, bezGranic: true, wysoko: 50 }).then(() => {
      this.wDrodzeDoKarty = false;
      if (!k.isConnected || this.gada) return;
      const r2 = this.rectKarty(k);
      if (proba < 3 && Math.hypot(r2.top - r.top, r2.left - r.left) > 2) { this.doKarty(k, proba + 1); return; } // karta się przesunęła w trakcie lotu: dolatujemy
      this.wKarcie(k);
      k.classList.remove('skok'); void k.offsetWidth; k.classList.add('skok');
    });
  },
  wKarcie(k) {
    this.kartaRect = this.rectKarty(k);
    this.schowana = true; this.el.classList.add('w-karcie'); this.schowajDymek();
    k.classList.remove('pusta');
  },
  /** Karta zniknęła z ekranu: Sówka wylatuje z niej na grzędę. */
  zKarty(k) {
    if (!this.schowana) return;
    const r = this.rectKarty(k);
    k.classList.add('pusta');
    this.schowana = false; this.el.classList.remove('w-karcie');
    this.ustaw(r.left, r.top, r.width / this.W);
    const g = this.grzeda();
    this.lec(g.x, g.y, { wysoko: 40 });
  },
  schowaj(tak) { this.schowana = tak; this.el && this.el.classList.toggle('w-karcie', tak); if (tak) this.schowajDymek(); },
  /** Krótki dymek nad Sówką, jej głosem (nagranie albo gaworzenie). */
  powiedz(tekst, { cooldown = 0, potem } = {}) {
    if (!this.el || this.schowana || this.gada || document.body.classList.contains('kino-otwarte') || otwarte.length) return false;
    if (cooldown && Date.now() - this.ostatniKomentarz < cooldown) return false;
    if (this.spi) this.obudz(false);
    this.ostatniKomentarz = Date.now();
    const d = this.dymek;
    d.textContent = tekst; d.hidden = false;
    d.classList.remove('nowy'); void d.offsetWidth; d.classList.add('nowy');
    this.pozycjaDymka();
    this.el.classList.add('mowi');
    clearTimeout(this.dymekTimer);
    Glos.mow(tekst, 's', { wl: Z.ustawienia.gra.glosSowki, naKoniec: () => { this.el.classList.remove('mowi'); this.dymekTimer = setTimeout(() => this.schowajDymek(), 2200); potem && potem(); } });
    return true;
  },
  schowajDymek() { if (!this.dymek) return; clearTimeout(this.dymekTimer); this.dymek.hidden = true; this.el && this.el.classList.remove('mowi'); },
  pozycjaDymka() {
    const d = this.dymek;
    if (!d || d.hidden) return;
    const w = d.offsetWidth, h = d.offsetHeight;
    const lewo = Math.max(8, Math.min(innerWidth - w - 8, this.x + this.W / 2 - w / 2));
    const gora = this.y - h - 8 < 50 ? this.y + this.H + 8 : this.y - h - 8;
    d.style.transform = `translate(${lewo}px, ${gora}px)`;
    d.style.setProperty('--ogon', `${Math.max(14, Math.min(w - 14, this.x + this.W / 2 - lewo))}px`);
    d.classList.toggle('pod', gora > this.y);
  },
  aktywnosc(e) {
    this.ostatniaAktywnosc = Date.now();
    if (this.spi && !(e && e.target && e.target.closest && e.target.closest('#sowa-lot'))) this.obudz(Math.random() < .3);
  },
  zasnij() {
    if (this.spi || this.gada || this.lata || !this.el) return;
    if (this.schowana) { this.spi = true; return; }
    this.powiedz(losuj(SOWA_TEKSTY.zasypia), { potem: () => { this.spi = true; this.wyglad(); } });
  },
  obudz(zKomentarzem) {
    if (!this.spi) return;
    this.spi = false; this.wyglad();
    this.el.classList.remove('budzi'); void this.el.offsetWidth; this.el.classList.add('budzi');
    setTimeout(() => this.el.classList.remove('budzi'), 700);
    if (zKomentarzem) setTimeout(() => this.powiedz(losuj(SOWA_TEKSTY.pobudka)), 350);
  },
  zycie() {
    if (!this.el || this.lata || this.gada || document.hidden) return;
    const h = new Date().getHours(), nocka = h >= 23 || h < 6;
    if (!this.spi && Date.now() - this.ostatniaAktywnosc > (nocka ? 30000 : 80000)) { this.zasnij(); return; }
    if (this.spi) return;
    const r = Math.random();
    const klasa = r < .25 ? 'przechyl' : r < .45 ? 'rozglada' : r < .58 ? 'podskok' : r < .68 ? 'czysci' : '';
    if (!klasa) return;
    this.el.classList.remove('przechyl', 'rozglada', 'podskok', 'czysci'); void this.el.offsetWidth;
    this.el.classList.add(klasa);
    if (klasa === 'rozglada') { this.patrz(0, this.y); setTimeout(() => this.patrz(innerWidth, this.y), 700); }
    setTimeout(() => this.el && this.el.classList.remove(klasa), 1700);
  },
  /** Dotknięcie: mówi coś, kilka szybkich dotknięć to łaskotki, a za dużo: obrażona odlatuje. Można ją też przeciągnąć. */
  podlaczDotyk() {
    let start = null, ciagnie = false, dx = 0, dy = 0;
    this.el.addEventListener('pointerdown', e => {
      start = { x: e.clientX, y: e.clientY, t: Date.now() }; ciagnie = false;
      dx = e.clientX - this.x; dy = e.clientY - this.y;
      try { this.el.setPointerCapture(e.pointerId); } catch { /* nic */ }
    });
    this.el.addEventListener('pointermove', e => {
      if (!start) return;
      if (!ciagnie && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 9) {
        ciagnie = true;
        if (this.anim) this.anim.cancel();
        if (this.spi) this.obudz(false);
        this.el.classList.add('trzymana', 'leci');
        this.powiedz(losuj(SOWA_TEKSTY.trzymana), { cooldown: 20000 });
      }
      if (ciagnie) { const p = this.wPolu(e.clientX - dx, e.clientY - dy); this.ustaw(p.x, p.y); }
    });
    const koniec = e => {
      if (!start) return;
      const byl = ciagnie; start = null; ciagnie = false;
      this.el.classList.remove('trzymana', 'leci');
      if (byl) {
        this.wlasna = true;
        this.el.classList.add('laduje'); setTimeout(() => this.el.classList.remove('laduje'), 500);
        setTimeout(() => this.powiedz(losuj(SOWA_TEKSTY.puszczona), { cooldown: 15000 }), 400);
        e.preventDefault();
        U.sowaPrzeciagnieta = Date.now();
      }
    };
    this.el.addEventListener('pointerup', koniec);
    this.el.addEventListener('pointercancel', koniec);
    this.el.addEventListener('click', e => {
      e.stopPropagation();
      if (U.sowaPrzeciagnieta && Date.now() - U.sowaPrzeciagnieta < 400) return;
      Glos.odblokuj();
      this.dotyk();
    });
  },
  dotyk() {
    const t = Date.now();
    this.klik = this.klik.filter(x => t - x < 2600); this.klik.push(t);
    if (navigator.vibrate) navigator.vibrate(10);
    if (this.spi) { this.obudz(true); return; }
    this.el.classList.remove('podskok'); void this.el.offsetWidth; this.el.classList.add('podskok');
    setTimeout(() => this.el.classList.remove('podskok'), 700);
    Fx.graj('huhu');
    if (this.klik.length >= 6) {
      this.klik = [];
      this.gada = false; this.schowajDymek();
      this.powiedz(losuj(SOWA_TEKSTY.zla));
      this.el.classList.add('obrazona');
      setTimeout(() => {
        const x = this.x < innerWidth / 2 ? innerWidth - this.W - 10 : 10;
        this.lec(x, 90 + Math.random() * (innerHeight * .4), { wysoko: 120 }).then(() => { this.wlasna = true; setTimeout(() => this.el.classList.remove('obrazona'), 4000); });
      }, 1300);
      return;
    }
    if (this.klik.length >= 3) {
      this.schowajDymek();
      this.el.classList.add('smieje'); setTimeout(() => this.el.classList.remove('smieje'), 1200);
      this.powiedz(losuj(SOWA_TEKSTY.laskotki));
      return;
    }
    // pojedyncze dotknięcie: chwilę czekamy, czy nie będzie łaskotek
    clearTimeout(this.dotykTimer);
    this.dotykTimer = setTimeout(() => { if (this.klik.length < 3) this.cosPowiedz(); }, 420);
  },
  /** Co mówi po dotknięciu: na zmianę przywitanie, ciekawostka, żart, motywacja, a czasem wtrąci się Zakładka. */
  cosPowiedz() {
    const n = U.sowaRozm = (U.sowaRozm || 0) + 1, g = Z.ustawienia.gra;
    const kolej = ['dotyk', 'ciekawostka', 'zart', 'dotyk', 'ciekawostka', g.zakladka18 ? 'zakladka' : 'zart', 'motywacja'];
    const co = kolej[(n - 1) % kolej.length];
    if (co === 'dotyk') this.powiedz(losuj(SOWA_TEKSTY.dotyk));
    if (co === 'ciekawostka') opowiedzCiekawostke();
    if (co === 'zart') { const [a, b] = losowyZart(); sowkaMowi(a, { puenta: b }); }
    if (co === 'zakladka') zartZakladki();
    if (co === 'motywacja') sowkaMowi(motywacja());
  },
  /** Przed rozmową w dużym dymku Sówka podlatuje na swoje miejsce obok niego. */
  doRozmowy(sowaMowi) {
    if (!this.el) return;
    this.gada = true; this.schowajDymek();
    if (this.spi) this.obudz(false);
    if (this.schowana) { const k = this.karta(); if (k) { const r = this.rectKarty(k); k.classList.add('pusta'); this.ustaw(r.left, r.top, r.width / this.W); } this.schowaj(false); }
    this.el.classList.add('w-rozmowie');
    if (sowaMowi) { const d = this.domek(); this.lec(d.x, d.y, { czas: 650 }); }
    else if (this.s !== 1) { const g = this.grzeda(); this.lec(g.x, g.y, { czas: 500 }); }
  },
  mowiTeraz(tak) { this.el && this.el.classList.toggle('mowi', tak); },
  poRozmowie() {
    if (!this.el) return;
    this.gada = false;
    this.el.classList.remove('w-rozmowie', 'mowi');
    setTimeout(() => {
      if (this.gada) return;
      const k = this.karta();
      if (k && this.widacKarte(k)) { this.obserwujKarte(k); this.doKarty(k); } else this.wroc();
    }, 250);
  },
  usun() { if (this.io) this.io.disconnect(); this.el && this.el.remove(); this.dymek && this.dymek.remove(); this.el = null; this.widok = null; }
};
/** Ciekawostka „sama z siebie”: na zmianę nagrana z bazy i świeża z Wikipedii (o autorach z twojej biblioteki albo losowych pisarzach). */
function opowiedzCiekawostke() {
  const zSieci = CiekawostkiSieci.wez();
  CiekawostkiSieci.dobierz();
  if (zSieci && (U.ciekN = (U.ciekN || 0) + 1) % 2 === 0) {
    return rozmowa([{ kto: 's', tekst: zSieci.oAutorze ? SOWA_TEKSTY.wstepSiec[2] : losuj(SOWA_TEKSTY.wstepSiec.slice(0, 2)) }, { kto: 's', tekst: zSieci.tekst, czytaj: true, link: zSieci.link }], { czasKonca: 5000 });
  }
  if (zSieci) CiekawostkiSieci.bufor.unshift(zSieci);
  return rozmowa([{ kto: 's', tekst: losuj(SOWA_TEKSTY.wstep) }, { kto: 's', tekst: zKolejki('ciekawostki', CIEKAWOSTKI), czytaj: true }], { czasKonca: 4000 });
}
/** Świeże ciekawostki z polskiej Wikipedii: o autorach z twojej biblioteki i o losowych pisarzach, poetach, powieściach. */
const CiekawostkiSieci = {
  bufor: [], trwa: false,
  KATEGORIE: ['Laureaci Nagrody Nobla w dziedzinie literatury', 'Polscy prozaicy', 'Polscy poeci', 'Polskie powieści', 'Powieści fantastycznonaukowe', 'Angielscy pisarze', 'Amerykańscy pisarze', 'Francuscy pisarze', 'Rosyjscy pisarze', 'Polscy autorzy fantastyki'],
  CIEKAWE: /nagrod|ekraniz|film|przetłumacz|przekład|język|pierwsz|najbardziej|najczęściej|debiut|bestseller|milion|sprzeda|pseudonim|zadebiutował|zadebiutowała|rekord|zakaz|cenzur|więzi|emigr|podróż|zmarł|urodził|inspir|serial|gra|komiks|tysi|\d{4}/i,
  wez() { return this.bufor.shift() || null; },
  async api(param) { return (await fetch(`https://pl.wikipedia.org/w/api.php?${new URLSearchParams({ ...param, format: 'json', origin: '*', formatversion: '2' })}`)).json(); },
  /** Najciekawsze 1–2 zdania z początku hasła (bez pierwszego, definicyjnego). */
  wybierzZdania(tytul, tekst) {
    tekst = tekst.split(/={2,}\s*(Przypisy|Bibliografia|Linki zewnętrzne|Zobacz też)\s*={2,}/)[0].replace(/={2,}[^=\n]*={2,}/g, '. ');
    const zd = tekst.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ„])/).map(x => x.trim()).filter(x => x.length > 25 && x.length < 260 && !/\b(pt|ur|zm|m\.in|tzw|ok|im|św|dr|prof|ks|gen|płk|ang|łac|niem|ros|fr)\.$/i.test(x) && /[.!?”]$/.test(x));
    const kand = zd.slice(1).map((x, i) => ({ x, i, pkt: (this.CIEKAWE.test(x) ? 2 : 0) + (x.length > 60 ? 1 : 0) - (/^(Jest|Był|Była|Był to)\b/.test(x) ? 1 : 0) }));
    if (!kand.length) return null;
    const naj = kand.sort((a, b) => b.pkt - a.pkt || a.i - b.i)[0];
    if (naj.pkt < 2) return null;
    const nast = zd[naj.i + 2];
    let wyn = naj.x + (nast && (naj.x + ' ' + nast).length < 240 && this.CIEKAWE.test(nast) ? ` ${nast}` : '');
    const nazw = tytul.split(' ').pop();
    if (!wyn.includes(nazw)) wyn = `${tytul}: ${wyn.replace(/^(On|Ona|Ono)\s/, '')}`;
    return wyn.replace(/\s+([.,;:])/g, '$1').replace(/\.{2,}$/, '.');
  },
  async dobierz() {
    if (this.trwa || this.bufor.length >= 3 || !navigator.onLine) return;
    this.trwa = true;
    try {
      let uzyte = [];
      try { uzyte = JSON.parse(lsGet('zakladka-ciek-siec') || '[]'); } catch { uzyte = []; }
      const autorzy = [...new Set(Z.ksiazki.map(k => (k.autor || '').split(',')[0].trim()).filter(a => a.split(' ').length >= 2))].filter(a => !uzyte.includes(a));
      for (let proba = 0; proba < 7 && this.bufor.length < 3; proba++) {
        const oAutorze = autorzy.length > 0 && Math.random() < .45;
        let tytul = null;
        if (oAutorze) { tytul = autorzy.splice(Math.floor(Math.random() * autorzy.length), 1)[0]; }
        else {
          // z kategorii bierzemy najdłuższe (czyli najbardziej znane) hasła
          // z kategorii bierzemy najpopularniejsze hasła (odsłony z 30 dni), czyli znanych pisarzy i książki
          const j = await this.api({ action: 'query', generator: 'categorymembers', gcmtitle: `Kategoria:${losuj(this.KATEGORIE)}`, gcmtype: 'page', gcmlimit: '500', prop: 'pageviews', pvipdays: '30' });
          const odslony = p => Object.values(p.pageviews || {}).reduce((s, v) => s + (v || 0), 0);
          const strony = ((j.query || {}).pages || []).filter(p => !uzyte.includes(p.title) && !/^Lista/.test(p.title)).sort((a, b) => odslony(b) - odslony(a)).slice(0, 40);
          tytul = strony.length ? losuj(strony).title : null;
        }
        if (!tytul) continue;
        uzyte = [...uzyte, tytul].slice(-400);
        lsSet('zakladka-ciek-siec', JSON.stringify(uzyte));
        const e = await this.api({ action: 'query', prop: 'extracts|info|description', explaintext: '1', exsentences: '10', inprop: 'url', redirects: '1', titles: tytul });
        const p = ((e.query || {}).pages || [])[0];
        if (!p || p.missing || !p.extract) continue;
        if (oAutorze && !/pisar|poet|prozai|autor|powieś|dramat|eseist|reportaż|tłumacz|scenarzyst/i.test(`${p.description || ''} ${p.extract.slice(0, 300)}`)) continue;
        const tekst = this.wybierzZdania(p.title, p.extract);
        if (!tekst) continue;
        this.bufor.push({ tekst, oAutorze, link: p.fullurl || '' });
      }
    } catch (e) { console.warn('ciekawostki z sieci', e); }
    this.trwa = false;
  }
};


/* ================= goście z historii wpadają do aplikacji (2.21) ================= */
// od: ile rozdziałów musi być odblokowanych, żeby postać mogła wpaść
const GOSCIE = {
  smok: { od: 3, sceny: [
    [['smok', 'Hej, Sówko! Wpadłem tylko na chwilkę.'], ['s', 'Smoku! Co cię sprowadza?'], ['smok', 'Szukam czegoś do czytania. Coś z happy endem. I bez rycerzy.'], ['z', 'Mamy cały regał. Tylko nie zioń na niego, proszę.'], ['smok', 'Obiecuję. No, prawie.']],
    [['smok', 'Znalazłem drugą skarpetkę!'], ['z', 'To dalej nie jestem ja!'], ['smok', 'Szkoda. Pasowałaby do pierwszej.']],
    [['smok', 'Ile stron dziś przeczytałeś? Ja zjadłem trzy. Przez przypadek.'], ['s', 'Smoku, książek się nie je!'], ['smok', 'Te były z czekolady. Chyba.']]
  ] },
  przypis: { od: 4, sceny: [
    [['przypis', 'Psst! Mała uwaga na dole strony.'], ['s', 'Przypis! Co tym razem?'], ['przypis', 'Nic ważnego. Po prostu lubię się wtrącać.'], ['z', 'Zauważyliśmy.']],
    [['przypis', 'Czy wiecie, że nikt nie czyta przypisów?'], ['s', 'Ja czytam!'], ['przypis', 'Naprawdę? Wzruszyłem się. Jestem tylko małą gwiazdką, a ty mnie czytasz.']]
  ] },
  kurz: { od: 8, sceny: [
    [['kurz', 'Kontrola biblioteczna! Czy wszystkie książki są oddane?'], ['s', 'Hu-hu, prawie wszystkie.'], ['kurz', 'Prawie robi wielką różnicę. Ale dziś jestem w dobrym humorze.'], ['z', 'On ma dobry humor? Pierwszy raz od trzystu lat.']],
    [['kurz', 'Apsik! Przepraszam. Ktoś tu dawno nie odkurzał półek.'], ['z', 'Przecież ty jesteś Kurz!'], ['kurz', 'No właśnie. Dlatego kicham sam na siebie.']]
  ] },
  kot: { od: 11, sceny: [
    [['kot', 'Mrrr. Przechodziłem i zauważyłem literówkę w twojej bibliotece.'], ['z', 'Gdzie?!'], ['kot', 'Żartuję. Chciałem tylko zobaczyć, co czytasz.'], ['s', 'Kocie Erratum, ty kłamczuchu!']],
    [['kot', 'Wiecie, że koty śpią szesnaście godzin dziennie?'], ['s', 'A co robią przez resztę czasu?'], ['kot', 'Leżą na otwartych książkach. Żeby nikt inny ich nie czytał.']]
  ] },
  gumka: { od: 14, sceny: [
    [['gumka', 'Cześć! Już nie wymazuję książek, słowo!'], ['z', 'A co wymazujesz?'], ['gumka', 'Tylko błędy. I czasem rysunki na marginesach. Ale ładnie proszę.'], ['s', 'Dobra gumka. Grzeczna gumka.']],
    [['gumka', 'Pachnę dziś malinami. Nowy szampon.'], ['z', 'Gumka używa szamponu?'], ['gumka', 'Przecież muszę jakoś wyglądać na randce z temperówką!']]
  ] }
};
const WYJSCIA_GOSCI = { smok: ['s', 'Pa, smoku! Leć ostrożnie!'], przypis: ['z', 'I zniknął. Typowy przypis.'], kurz: ['s', 'Do widzenia, panie Kurzu!'], kot: ['z', 'Poszedł spać na mojej książce. Znowu.'], gumka: ['s', 'Pa, Gumko! Wpadaj częściej.'] };
/** Któryś z bohaterów historii wpada w odwiedziny, gada z Sówką i Zakładką i znika. */
function wizytaGoscia(kto) {
  const odbl = historiaStan().odblokowane;
  const mozliwi = Object.keys(GOSCIE).filter(g => odbl >= GOSCIE[g].od);
  if (!mozliwi.length) return false;
  kto = kto && mozliwi.includes(kto) ? kto : zKolejki('goscie', mozliwi);
  const scena = zKolejki(`gosc-${kto}`, GOSCIE[kto].sceny);
  const [wk, wt] = WYJSCIA_GOSCI[kto];
  return rozmowa([...scena.map(([k, tekst]) => ({ kto: k, tekst })), { kto: wk, tekst: wt, wyjscie: true }], { czasKonca: 2500, gosc: kto });
}

/* ================= Sówka-towarzyszka: teksty nagrane jej głosem (2.19) ================= */
const SOWA_TEKSTY = {
  dotyk: ['Hu-hu! Co tam?', 'Jestem, jestem! Czytamy coś?', 'O, cześć! Właśnie myślałam o książkach.', 'Hu? Wołałeś mnie?', 'Jestem tu, gdybyś mnie potrzebował.'],
  laskotki: ['Hi-hi! Łaskocze!', 'Hej! Tam mam piórka łaskotkowe!', 'Ha-ha-ha! Przestań, bo spadnę!'],
  zla: ['Dobra, dość tego! Odlatuję!', 'Pióra mi powyrywasz! Lecę stąd!'],
  pobudka: ['Hę?! Nie śpię! Czytałam!', 'Ojej, przysnęłam nad książką.', 'Mmm… już jestem. Tylko na chwilkę zamknęłam oczy.'],
  zasypia: ['Ziew… Chyba się zdrzemnę.', 'Zamknę oczy na minutkę. Obudź mnie, jak coś.'],
  trzymana: ['Hej! Gdzie mnie niesiesz?', 'Wiii! Latam bez skrzydeł!'],
  puszczona: ['Hu! Tu mi dobrze.', 'Ładny widok z tego miejsca.'],
  szybko: ['Wolniej! Nie nadążam czytać!', 'Ojej, ale pędzisz! Aż mi pióra stanęły.'],
  dlugo: ['Ale długa ta lista! Aż mi się w głowie kręci.'],
  wstep: ['Wiesz, co ostatnio wyczytałam?', 'Hu-hu, mam ciekawostkę!', 'Słuchaj, to cię zaskoczy!'],
  wstepSiec: ['Wyczytałam coś ciekawego w Wikipedii!', 'Świeża ciekawostka prosto z internetu!', 'Hu-hu, znalazłam coś o autorze, którego czytasz!'],
  bingo: ['Bingo! Cała linia! Hu-hu!', 'Pełna karta bingo! Jesteś niesamowity!'],
  tydzien: ['Hu-hu! Podsumujmy twój tydzień!', 'Lepiej niż tydzień temu! Brawo!', 'Trochę mniej niż tydzień temu. Ale każda strona się liczy.', 'Ten tydzień dopiero się zaczyna. Może kilka stron na dobry start?'],
  ekran: {
    dzis: ['Wróciliśmy do domu!', 'Zobaczmy, co dziś czytamy.'],
    biblioteka: ['Ooo, biblioteka! Moje ulubione miejsce.', 'Tyle książek! Którą dziś otworzymy?', 'Pachnie tu papierem. Uwielbiam.'],
    losuj: ['Losujemy? Trzymam kciuki. To znaczy pióra.', 'Niech los wybierze coś pięknego!'],
    statystyki: ['Liczby! Sprawdźmy, ile już przeczytałeś.', 'Hu-hu, ale wykresy! Jestem pod wrażeniem.'],
    cytaty: ['Cytaty! Lubię zbierać mądre zdania.', 'Zapisuj ładne zdania, żeby nie uciekły.'],
    ustawienia: ['Ustawienia? Tylko mnie nie wyłączaj, proszę.', 'Tu nic nie dotykam. Ja tylko patrzę.']
  }
};

/* ================= teksty nagrane głosami (2.18) ================= */
// Zakładka bez cenzury (18+, można wyłączyć w Sówka i dźwięk)
const ZARTY_ZAKLADKI_18 = [
  ['Najgorsze, co może spotkać zakładkę?', 'E-book. Kurwa, bezrobocie.'],
  ['Ktoś mnie kiedyś użył jako wykałaczki.', 'Wykałaczki, do jasnej cholery! Mam maturę z polskiego!'],
  ['Wiesz, jak się czuje zakładka w „Ulissesie”?', 'Jak w dupie. Siedzę tam trzeci rok i nadal nikt nie wie, o co chodzi.'],
  ['Czytelnicy dzielą się na dwie grupy.', 'Tych z zakładkami i tych, co zaginają rogi. Tych drugich niech szlag trafi.'],
  ['Pożyczyłaś kiedyś książkę ze mną w środku?', 'Wróciłam po roku. Z plamą po winie i traumą. Nie pytaj.'],
  ['Wiesz, czemu jestem czerwona?', 'Bo widziałam, co ludzie czytają przed snem. Pięćdziesiąt twarzy… dobra, nie powiem.'],
  ['Najlepsza scena erotyczna w literaturze?', 'Spis treści. Konkretnie, bez gadania i od razu wiesz, gdzie dojść.'],
  ['Mój były był zakładką w Biblii.', 'Mówił, że to stały związek. Cholera, potem ktoś otworzył Apokalipsę.'],
  ['Co krzyczy zakładka, gdy książka spada z półki?', 'O kurwa, strona trzydzieści siedem! Trzymam się jak małpa!'],
  ['Sówka mówi, że czytanie to przygoda.', 'Przygoda to jest, jak ktoś zaśnie na książce twarzą. Cała w ślinie byłam, do cholery.'],
  ['Wiesz, jaki jest mój ulubiony gatunek?', 'Opowiadania. Szybko wchodzę, szybko wychodzę i nikt mnie nie zostawia na pół roku jak ostatnią sierotę.'],
  ['Sówka jest mądra, bo czyta.', 'Ja czytam razem z nią i co? Dalej jestem kawałkiem tektury. Życie jest do dupy.'],
  ['Wiesz, co jest gorsze od zaginania rogów?', 'Kurwa, zakreślacz. Ktoś mnie raz pomalował na żółto. Do dziś świecę w ciemności.'],
  ['Byłam kiedyś w audiobooku.', 'Nie pytaj jak. Cholernie ciemno i ktoś ciągle gadał.'],
  ['Ludzie mówią, że książka to najlepszy przyjaciel.', 'A zakładka co? Kawałek tektury? No dobra, kurwa, technicznie tak.'],
  ['Wiesz, co robię, jak czytasz w wannie?', 'Modlę się. Do jasnej cholery, ja nie umiem pływać!'],
  ['Ktoś mnie kiedyś użył jako podkładki pod kubek.', 'Kawa z mlekiem, bez cukru. Do dziś śmierdzę jak poniedziałek w biurze.'],
  ['Co powiedziałam paragonowi, który udawał zakładkę?', 'Spieprzaj, amatorze. Tu pracują profesjonaliści.'],
  ['Wiesz, czemu nie lubię romansów?', 'Bo zawsze zostawiasz mnie przed sceną łóżkową. Cholerna cenzura.'],
  ['Wiesz, co mnie wkurza?', 'Jak ktoś z czytnikiem mówi, że też ma zakładki. Kurwa, to są ikonki!'],
  ['Raz przeleżałam rok w poradniku o odchudzaniu.', 'Nikt go nie otworzył. Ja przytyłam od samego kurzu.'],
  ['Wiesz, gdzie ginie najwięcej zakładek?', 'W pierwszych rozdziałach. Padamy tam, kurwa, jak bohaterowie wojenni.'],
  ['Ktoś mnie raz użył do czyszczenia paznokci.', 'Do dziś mam koszmary. Brud spod paznokcia, do cholery!'],
  ['Mówią, że jestem płaska.', 'Jestem zakładką, kurwa! Mam być płaska!'],
  ['Wiesz, co robię nocami?', 'Liczę strony do końca i przeklinam autorów, którzy piszą po tysiąc stron.'],
  ['Najgorsze książki to poradniki.', 'Cholera, nawet ja nie chcę wiedzieć, jak być lepszą wersją siebie.'],
  ['Byłam kiedyś w książeczce dla dzieci.', 'Trzy strony, a i tak mnie zgubili. Dzieciaki są bezlitosne, do jasnej cholery.'],
  ['Wiesz, czemu nie lubię kotów?', 'Bo jak kot się położy na książce, mam bezpłatny urlop na tydzień. Kurwa mać.'],
  ['Pytasz, czy jestem szczęśliwa?', 'Jestem kawałkiem tektury w świecie czytników. Domyśl się, cholera.'],
  ['Ostatnio ktoś mnie zastąpił skarpetką.', 'Brudną skarpetką! I wiesz co? Lepiej trzymała miejsce. Pieprzona skarpeta.'],
  ['Wiesz, jak wygląda moja emerytura?', 'Szuflada z długopisami bez wkładów. Kurwa, dom spokojnej starości.']
];
const SMIECH_ZAKLADKI = ['Ha! Dobre!', 'Hahaha! Zapiszę to sobie na marginesie!', 'Słyszałam lepsze. Ale nie dziś.', 'Ała, aż mnie zgięło. Dosłownie, jestem z papieru.'];
// scenka po dodaniu książki: stałe kwestie (nagrane) + zmienne (gaworzenie)
const RECENZJA = {
  start: ['Hu-hu! Nowa książka na półce!', 'Ooo, co tam przyniosłeś? Pokaż, pokaż!', 'Hu-hu! Świeża dostawa do biblioteki!'],
  dobryWybor: ['Moim zdaniem to świetny wybór.', 'Hu-hu, to może być twoja nowa ulubiona!', 'Dobry wybór. Jestem dumna.'],
  ryzyko: ['Hm, nowy gatunek dla ciebie. Warto spróbować!', 'Trochę ryzykownie, ale najlepsze książki są z zaskoczenia.'],
  grubaZ: ['Ile?! Ja się w tym zgubię! Kto mnie potem znajdzie?!', 'Toż to cegła! Tym można kogoś zabić!'],
  krotkaZ: ['Krótka? To na jeden wieczór. Ledwo się rozgrzeję.', 'Taka chudzinka? Nawet nie zdążę się przyzwyczaić.'],
  zaczepkaZ: ['Dobry wybór? Ostatnio mówiłaś to o książce kucharskiej.', 'A ja bym wolała coś z większą ilością przygód.', 'Znowu? Ja jeszcze nie skończyłam poprzedniej!'],
  ripostaS: ['Nie marudź, Zakładko.', 'Ciszej tam, papierku. Ja tu recenzuję.', 'Zakładko, nikt cię nie pytał.'],
  ripostaZ: ['Sama nie marudź, sowo jedna!', 'Pierzasta mądralo!', 'Dobra, dobra. Ale jak się zgubię, to twoja wina.'],
  koniecS: ['Dobra, zgoda. Czytamy?', 'Hu-hu, pogódźmy się przy nowej książce.'],
  // 2.21: opinie z internetu
  siec: ['Zajrzałam do internetu, co piszą inni.', 'Sprawdziłam opinie czytelników. Hu-hu!'],
  wysoko: ['Czytelnicy ją uwielbiają!', 'Hu-hu, ludzie dają jej bardzo wysokie oceny.'],
  srednio: ['Opinie są podzielone. Sprawdźmy sami!', 'Średnio, ale wiesz… gusta są różne.'],
  nisko: ['Hm, czytelnicy kręcą nosem. Ale może to ukryty skarb?', 'Słabe oceny. Może trzeba ją czytać pod innym kątem.'],
  cytat: ['Ktoś napisał tak:', 'Posłuchaj tej opinii:'],
  opinieZ: ['Ja tam nie wierzę recenzjom. Pisze się je w nocy, po winie.', 'Ludzie w internecie dają jedynki nawet za złą pogodę.', 'Wysoka ocena? Pewnie autor ma dużą rodzinę.']
};
const POCHWALY_NAGRANE = ['Hu-hu, pięknie!', 'Brawo! Każda strona się liczy.', 'Super! Zakładka już się przesunęła.', 'Pięknie czytasz! Tak trzymaj.'];

/* ================= kopia, import, eksport ================= */
async function eksportujKopie() {
  const ok = await zapiszPlik(`zakladka-kopia-${dzisISO()}.json`, JSON.stringify(daneDoKopii()), 'application/json');
  if (!ok) return;
  lsSet('zakladka-kopia', dzisISO());
  toast('Kopia zapasowa gotowa.');
  odswiez();
}

async function importujKopie() {
  const plik = await wybierzPlik('.json,application/json');
  if (!plik) return;
  let dane;
  try { dane = JSON.parse(await plik.text()); } catch { toast('Ten plik nie jest kopią Zakładki.', { typ: 'blad' }); return; }
  if (!dane || !Array.isArray(dane.ksiazki)) { toast('W pliku nie ma listy książek.', { typ: 'blad' }); return; }
  const ok = !Z.ksiazki.length || await potwierdz(
    `Kopia ma ${ile(dane.ksiazki.length, FORMY_KSIAZEK_B)}. Obecne dane na tym urządzeniu (${ile(Z.ksiazki.length, FORMY_KSIAZEK)}) zostaną zastąpione.`,
    { tytul: 'Wczytać kopię?', tak: 'Wczytaj kopię', niebezpieczne: true });
  if (!ok) return;
  const lista = dane.ksiazki.map(normalizujKsiazke);
  try {
    await Baza.zastap(lista);
    Z.ksiazki = lista;
    Z.ustawienia = normalizujUstawienia(dane.ustawienia);
    await utrwalUstawienia();
    zastosujMotyw();
    odswiez();
    toast(`Wczytano ${ile(lista.length, FORMY_KSIAZEK_B)}.`);
  } catch (e) { bladZapisu(e); }
}

async function importujGoodreads() {
  const plik = await wybierzPlik('.csv,text/csv');
  if (!plik) return;
  let lista;
  try { lista = czytajGoodreads(await plik.text()); } catch (e) { toast(e.message, { typ: 'blad' }); return; }
  const znane = new Set(Z.ksiazki.map(k => (k.tytul + k.autor).toLowerCase()));
  const nowe = lista.filter(k => !znane.has((k.tytul + k.autor).toLowerCase()));
  if (!nowe.length) { toast('Wszystkie książki z pliku już są w bibliotece.'); return; }
  const licz = s => nowe.filter(k => k.status === s).length;
  const ok = await potwierdz(`Znalazłem ${ile(nowe.length, FORMY_KSIAZEK_B)}: przeczytane ${licz('przeczytana')}, w trakcie ${licz('czytam')}, do przeczytania ${licz('doPrzeczytania')}.${lista.length > nowe.length ? ` Pominę ${lista.length - nowe.length}, które już masz.` : ''}`,
    { tytul: 'Import z Goodreads', tak: 'Importuj' });
  if (!ok) return;
  let nr = Z.ksiazki.reduce((m, k) => Math.max(m, k.kolejnosc), 0);
  const gotowe = nowe.map(k => normalizujKsiazke({ ...k, id: noweId(), kolejnosc: ++nr }));
  Z.ksiazki.push(...gotowe);
  await utrwal(gotowe);
  odswiez();
  toast(`Zaimportowano ${ile(gotowe.length, FORMY_KSIAZEK_B)}.`);
}

/* ================= akcje ================= */
async function usunKsiazke(id) {
  const k = znajdz(id);
  if (!k) return;
  const s = sesjaAktywna();
  Z.ksiazki = Z.ksiazki.filter(x => x !== k);
  if (s && s.id === id) lsSet('zakladka-sesja', null);
  try { await Baza.usun(id); } catch (e) { bladZapisu(e); }
  odswiez();
  toast(`Usunięto „${k.tytul}”.`, { akcja: 'Cofnij', onAkcja: () => { Z.ksiazki.push(k); utrwal(k); odswiez(); } });
}

function znajdzCytat(d) {
  const k = znajdz(d.id);
  return k && k.cytaty.find(c => c.id === d.cid) ? { k, c: k.cytaty.find(c => c.id === d.cid) } : null;
}
const tekstCytatu = ({ k, c }) => `„${c.tekst}”\n— ${k.autor ? k.autor + ', ' : ''}${k.tytul}${c.strona ? `, s. ${c.strona}` : ''}`;

const AKCJE = {
  idz: d => { U.pozyczone = !!d.pozyczone; idz(d.widok, d.polka); },
  pozyczka: d => arkuszPozyczki(d.id),
  zwrot: d => zwrocKsiazke(d.id),
  'pozyczone-filtr': () => { U.pozyczone = !U.pozyczone; renderWidok(); },
  'obraz-miesiaca': d => {
    const mc = danyMiesiac(d.ym);
    udostepnijPolke({ naglowek: nazwaMiesiaca(d.ym).replace(/^./, c => c.toUpperCase()), podpis: `${ile(mc.ukonczone.length, FORMY_KSIAZEK)} · ${ile(mc.strony, FORMY_STRON)} · ${ile(mc.dniCzytania, FORMY_DNI)} z czytaniem`, ksiazki: mc.ukonczone.map(x => x.k) }, `zakladka-${d.ym}.png`);
  },
  'obraz-roku': d => {
    const r = podsumowanieRoku(+d.rok);
    udostepnijPolke({ naglowek: `Mój rok ${r.rok}`, podpis: `${ile(r.ksiazki.length, FORMY_KSIAZEK)} · ${ile(r.strony, FORMY_STRON)}`, ksiazki: r.ksiazki.map(x => x.k) }, `zakladka-rok-${r.rok}.png`);
  },
  ksiazka: d => arkuszKsiazki(d.id),
  dodaj: d => arkuszFormularza(null, { jako: d.jako || (U.widok === 'biblioteka' && ['czytam', 'zyczenia', 'pozniej'].includes(U.polka) ? U.polka : 'doPrzeczytania') }),
  edytuj: d => arkuszFormularza(d.id),
  postep: d => arkuszPostepu(d.id),
  sesja: d => otworzSesje(d.id),
  bazowa: d => arkuszBazowej(d.id),
  'wybierz-bazowa': () => arkuszWyboruBazowej(),
  'zdejmij-bazowa': d => { const k = znajdz(d.id); utrwal(zdejmijBazowa(k)); odswiez(); toast('To już zwykła czytana książka.'); },
  zacznij: d => { const k = znajdz(d.id); utrwal(zacznijCzytac(k)); odswiez(); toast(`Zaczynasz „${k.tytul}”.`); },
  wznow: d => { const k = znajdz(d.id); utrwal(zacznijCzytac(k)); odswiez(); toast(`Wracasz do „${k.tytul}”.`); },
  ponownie: d => { const k = znajdz(d.id); utrwal(czytajPonownie(k)); odswiez(); toast(`Czytasz „${k.tytul}” jeszcze raz.`); },
  skonczona: d => arkuszZakonczenia(d.id),
  porzuc: d => arkuszPorzucenia(d.id),
  nastroj: d => {
    const k = znajdz(d.id);
    if (!k) return;
    if (k.nastroje.includes(d.n)) k.nastroje = k.nastroje.filter(x => x !== d.n);
    else { if (k.nastroje.length >= 3) { toast('Wybierz najwyżej 3 nastroje. Odznacz któryś.'); return; } k.nastroje.push(d.n); }
    utrwal(k); odswiezWrazenia(k);
    if (navigator.vibrate) navigator.vibrate(10);
  },
  'tempo-akcji': d => { const k = znajdz(d.id); if (!k) return; k.tempoAkcji = k.tempoAkcji === d.n ? '' : d.n; utrwal(k); odswiezWrazenia(k); },
  'szukaj-w-cytatach': () => { U.szukajCytat = U.szukaj; U.szukaj = ''; idz('cytaty'); },
  kolejka: d => { utrwal(przesunWKolejce(znajdz(d.id), +d.kierunek)); odswiez(); },
  'na-poczatek': d => { utrwal(naPoczatekKolejki(znajdz(d.id))); odswiez(); toast('Przeniesiono na początek kolejki.'); },
  usun: d => usunKsiazke(d.id),
  ocena: d => {
    const k = znajdz(d.id); k.ocena = k.ocena === +d.n ? 0 : +d.n; utrwal(k); odswiez();
    if (navigator.vibrate) navigator.vibrate(12);
    // wysoka ocena: od razu podsuń podobne książki
    if (k.ocena >= 4) { if (k.ocena === 5 && $('.arkusz-brawo')) konfetti({ ile: 70 }); zaladujPodobne(k.id); }
  },
  'cytat-dodaj': d => arkuszCytatu(d.id),
  'cytat-edytuj': d => arkuszCytatu(d.id, d.cid),
  'cytat-kopiuj': async d => {
    const x = znajdzCytat(d);
    if (!x) return;
    try { await navigator.clipboard.writeText(tekstCytatu(x)); toast('Skopiowano cytat.'); } catch { toast('Nie udało się skopiować.', { typ: 'blad' }); }
  },
  'cytat-obraz': async d => {
    const x = znajdzCytat(d);
    if (!x) return;
    try {
      const blob = await obrazCytatu(x);
      const nazwa = `cytat-${x.k.tytul.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40) || 'zakladka'}.png`;
      if (await zapiszPlik(nazwa, blob, 'image/png')) toast('Obrazek z cytatem gotowy.');
    } catch (e) { console.warn(e); toast('Nie udało się utworzyć obrazka.', { typ: 'blad' }); }
  },
  'cytat-udostepnij': async d => {
    const x = znajdzCytat(d);
    if (x) try { await navigator.share({ text: tekstCytatu(x) }); } catch { /* anulowano */ }
  },
  dzien: d => arkuszDnia(d.data),
  wpis: d => arkuszWpisu(d.id, d.data),
  losuj: () => idz('losuj'),
  'losuj-jedna': () => arkuszLosowania(),
  'rozdzialy-spis': d => arkuszSpisu(d.id),
  'rozdzialy-podziel': d => arkuszPodzialu(d.id),
  'rozdzial-edytuj': d => arkuszRozdzialu(d.id, d.rid),
  rok: () => arkuszRoku(),
  prolonguj: d => { const k = znajdz(d.id), przed = { ...k.pozyczona }; utrwal(prolonguj(k, +d.dni || 14)); odswiez(); toast(`Przedłużono do ${dataDluga(k.pozyczona.termin, false)}.`, { akcja: 'Cofnij', onAkcja: () => { k.pozyczona = przed; utrwal(k); odswiez(); } }); },
  'ics-zwrot': async d => { const k = znajdz(d.id); if (k && k.pozyczona && k.pozyczona.termin && await zapiszPlik(`zwrot-${k.pozyczona.termin}.ics`, icsZwrotu(k), 'text/calendar')) toast('Otwórz plik, żeby dodać termin zwrotu do kalendarza.'); },
  budzet: () => arkuszBudzetu(),
  'udostepnij-zyczenia': async () => {
    const t = tekstListyZyczen();
    if (navigator.share) { try { await navigator.share({ title: 'Moja lista życzeń', text: t }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(t); toast('Skopiowano listę życzeń.'); } catch { toast('Nie udało się skopiować.', { typ: 'blad' }); }
  },
  'cena-ebooka': async d => {
    const k = znajdz(d.id), el = $(`[data-cena-ebooka="${d.id}"]`);
    if (el) { el.textContent = 'Sprawdzam…'; el.classList.add('ladowanie'); }
    try {
      const c = await Wyszukiwarka.cenaEbooka(k);
      if (el) { el.classList.remove('ladowanie'); el.innerHTML = c ? `E-book w Google Play: <strong>${zl(c.cena)}</strong>${c.link ? ` · <a href="${esc(c.link)}" target="_blank" rel="noopener">kup</a>` : ''}` : 'Google Play nie sprzedaje tej książki w Polsce.'; }
    } catch (e) { if (el) { el.classList.remove('ladowanie'); el.textContent = e.message; } }
  },
  'opis-pobierz': d => uzupelnijOpis(znajdz(d.id)),
  'sprawdz-ceny': d => sprawdzCeny(znajdz(d.id)),
  worker: () => arkuszWorkera(),
  sklepik: () => arkuszSklepiku(),
  'tydzien-podsumowanie': () => arkuszTygodnia(0),
  'opinie-pobierz': d => pobierzOpinie(znajdz(d.id)),
  aktualizuj: () => wymusAktualizacje(),
  'co-nowego': () => arkuszCoNowego(),
  historia: () => arkuszHistorii(),
  'sprawdz-ceny-wszystkie': () => sprawdzCenyListy({ wymus: true }),
  'opis-edytuj': d => arkuszOpisu(d.id),
  podobne: d => zaladujPodobne(d.id),
  tydzien: d => arkuszTygodnia(d.pn || poczatekTygodnia()),
  'tydzien-dodaj': d => arkuszDodajDoTygodnia(d.pn || poczatekTygodnia(), d.dzien || null),
  'do-tygodnia': d => { const k = znajdz(d.id); if (k.bazowa) { toast('Książka bazowa ma normę dzienną liczoną automatycznie.'); return; } dodajDoPlanu(poczatekTygodnia(), k.id); utrwalUstawienia(); odswiez(); toast(`„${k.tytul}” w planie tygodnia.`, { akcja: 'Pokaż', onAkcja: () => arkuszTygodnia() }); },
  'dodaj-wiele': () => arkuszWielu(),
  rozloz: d => arkuszKreatora(d.pn || poczatekTygodnia()),
  kreator: d => arkuszKreatora(d.pn || poczatekTygodnia()),
  'czas-czytania': () => arkuszCzasu(),
  'staly-plan': d => arkuszStalegoPlanu(d.rid || null),
  passa: () => arkuszSerii(),
  'na-pozniej': d => { const k = znajdz(d.id), przed = { status: k.status, bazowa: k.bazowa, odlozono: k.odlozono }; utrwal(odlozNaPozniej(k)); odswiez(); toast(`„${k.tytul}” odłożona na później.`, { akcja: 'Cofnij', onAkcja: () => { Object.assign(k, przed); utrwal(k); odswiez(); } }); },
  'do-kolejki': d => { const k = znajdz(d.id); utrwal(doKolejki(k, !!d.poczatek)); odswiez(); toast(`„${k.tytul}” wraca do kolejki${d.poczatek ? ' na początek' : ''}.`); },
  zyczenia: d => arkuszNaListe(d.id),
  'mam-ja': d => arkuszZakupu(d.id),
  'powiadomienia-zgoda': async () => {
    try {
      const w = await Notification.requestPermission();
      if (w === 'granted') {
        if (!Z.ustawienia.przypomnienie.wlaczone) { Z.ustawienia.przypomnienie.wlaczone = true; utrwalUstawienia(); }
        zarejestrujSprawdzanieWTle();
        toast('Powiadomienia włączone.');
      } else toast('Nie zezwolono na powiadomienia. Możesz użyć kalendarza telefonu.', { czas: 5000 });
    } catch { toast('Ta przeglądarka nie pozwala na powiadomienia.', { typ: 'blad' }); }
    renderWidok();
  },
  'powiadomienie-test': async () => { try { await pokazPowiadomienie('📖 Zakładka', trescPrzypomnienia(), { test: true }); } catch { toast('Nie udało się wysłać powiadomienia.', { typ: 'blad' }); } },
  'ics-przypomnienie': async () => {
    if (await zapiszPlik('zakladka-przypomnienie.ics', icsPrzypomnienia(), 'text/calendar')) toast('Otwórz plik i dodaj wydarzenie do kalendarza. Przypomnienie będzie się powtarzać.', { czas: 6000 });
  },
  'test-zrodel': async (d, btn) => {
    const el = $('#stan-zrodel');
    if (!el) return;
    if (!navigator.onLine) { toast('Jesteś offline.', { typ: 'blad' }); return; }
    btn.disabled = true;
    el.hidden = false;
    el.innerHTML = '<li class="cichy ladowanie">Sprawdzam…</li>';
    try {
      const w = await Wyszukiwarka.test();
      const ok = t => t.startsWith('działa');
      el.innerHTML = [['Google Books', w.google], ['Open Library', w.openLibrary], ['Biblioteka Narodowa', w.bn]]
        .map(([n, t]) => `<li class="${ok(t) ? 'ok' : 'zle'}">${ok(t) ? I.check : I.zamknij}<strong>${n}</strong>: ${esc(t)}</li>`).join('');
    } finally { btn.disabled = false; }
  },
  miesiac: d => arkuszMiesiaca(d.ym || miesiacTeraz()),
  'cel-miesiaca': d => arkuszCeluMiesiaca(d.ym || miesiacTeraz()),
  'plan-miesiaca': d => arkuszPlanu(d.ym || miesiacTeraz()),
  'plan-ksiazki': d => arkuszPlanuKsiazki(d.id),
  'miesiace-wiecej': () => { U.wszystkieMiesiace = !U.wszystkieMiesiace; renderWidok(); },
  'odznaki-wiecej': () => { U.wszystkieOdznaki = !U.wszystkieOdznaki; renderWidok(); },
  kategoria: d => { U.kategoria = U.kategoria === d.kat ? null : d.kat; renderWidok(); },
  'lista-zycz': d => { U.listaZ = d.lista || null; renderWidok(); },
  'lista-edytuj': d => arkuszListyZyczen(d.id || null),
  ciekawostka: () => { U.ciekawostkaPrzes = (U.ciekawostkaPrzes || 0) + 1; const el = $('[data-ciekawostka]'); if (el) { el.classList.remove('nowa'); void el.offsetWidth; el.textContent = CIEKAWOSTKI[(hash(dzisISO()) + U.ciekawostkaPrzes) % CIEKAWOSTKI.length]; el.classList.add('nowa'); } },
  polka: d => { U.pozyczone = false; U.kategoria = null; U.polka = d.polka; U.tag = null; U.sort = 'domyslnie'; renderWidok(); },
  tag: d => { U.tag = U.tag === d.tag ? null : d.tag; renderWidok(); },
  kopia: () => eksportujKopie(),
  'kopia-pozniej': () => { lsSet('zakladka-kopia-odloz', dodajDni(dzisISO(), 3)); renderWidok(); },
  'import-json': () => importujKopie(),
  'import-goodreads': () => importujGoodreads(),
  'eksport-csv': async () => {
    if (!Z.ksiazki.length) { toast('Biblioteka jest pusta.'); return; }
    if (await zapiszPlik(`zakladka-goodreads-${dzisISO()}.csv`, '﻿' + csvGoodreads(Z.ksiazki), 'text/csv')) toast('Plik CSV gotowy.');
  },
  'usun-wszystko': async () => {
    if (!(await potwierdz('Usunę wszystkie książki, cytaty i ustawienia z tego urządzenia. Tego nie da się cofnąć.', { tytul: 'Usunąć wszystko?', tak: 'Usuń wszystko', niebezpieczne: true }))) return;
    try {
      await Baza.zastap([]);
      Z.ksiazki = [];
      Z.ustawienia = { ...DOMYSLNE };
      await utrwalUstawienia();
      ['zakladka-sesja', 'zakladka-kopia', 'zakladka-kopia-odloz'].forEach(k => lsSet(k, null));
      zastosujMotyw();
      idz('dzis');
      toast('Usunięto wszystkie dane.');
    } catch (e) { bladZapisu(e); }
  },
  pamiec: async () => {
    try {
      const ok = await navigator.storage.persist();
      toast(ok ? 'Trwała pamięć włączona.' : 'Przeglądarka odmówiła. Zainstaluj aplikację i spróbuj ponownie.');
    } catch { toast('Nie udało się poprosić o pamięć.'); }
    pokazStanPamieci();
  },
  instaluj: async () => {
    if (!U.instalacja) return;
    U.instalacja.prompt();
    await U.instalacja.userChoice.catch(() => {});
    U.instalacja = null;
    renderWidok();
  }
};

/* ================= zdarzenia ================= */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-akcja]');
  if (!t || t.disabled) return;
  const f = AKCJE[t.dataset.akcja];
  if (!f) return;
  e.preventDefault();
  f(t.dataset, t);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && otwarte.length) { e.preventDefault(); otwarte[otwarte.length - 1].zamknij(); }
});

document.addEventListener('input', e => {
  if (e.target.id === 'szukaj-bib') { U.szukaj = e.target.value; $('#siatka-bib').innerHTML = htmlSiatki(); }
  if (e.target.id === 'szukaj-cyt') { U.szukajCytat = e.target.value; $('#lista-cyt').innerHTML = htmlCytatow(); }
});

document.addEventListener('change', e => {
  if (e.target.matches && e.target.matches('[data-ceny-auto]')) { Z.ustawienia.cenyAuto = e.target.checked; utrwalUstawienia(); toast(e.target.checked ? 'Będę sprawdzać ceny raz dziennie.' : 'Automatyczne sprawdzanie cen wyłączone.'); return; }
  const pz = e.target.dataset && e.target.dataset.poleZycz;
  if (pz) {
    const k = znajdz(e.target.dataset.id);
    if (!k) return;
    const v = e.target.value.trim().replace(',', '.');
    if (pz === 'cena') zapiszCene(k, v);
    if (pz === 'cenaDocelowa') k.cenaDocelowa = +v > 0 ? Math.round(+v * 100) / 100 : null;
    if (pz === 'okazja') k.okazja = e.target.value;
    if (pz === 'priorytet') k.priorytet = ogranicz(+v || 0, 0, 3);
    if (pz === 'link') { if (v && !/^https?:\/\//.test(v)) { toast('Link musi zaczynać się od https://', { typ: 'blad' }); return; } k.link = v; }
    utrwal(k); odswiez();
    if (czyOkazja(k) && (pz === 'cena' || pz === 'cenaDocelowa')) { toast(`Okazja! „${k.tytul}” za ${zl(k.cena)}, czyli w twojej cenie.`); konfetti({ ile: 50 }); }
    return;
  }
  if (e.target.id === 'sort-bib') { U.sort = e.target.value; $('#siatka-bib').innerHTML = htmlSiatki(); }
  if (e.target.name === 'motyw' && e.target.closest('#widok')) {
    Z.ustawienia.motyw = e.target.value;
    utrwalUstawienia();
    zastosujMotyw();
  }
});

document.addEventListener('submit', e => {
  if (e.target.id !== 'f-przypomnienia') return;
  e.preventDefault();
  const f = e.target;
  Z.ustawienia = normalizujUstawienia({ ...Z.ustawienia, przypomnienie: {
    wlaczone: f.elements.wlaczone.checked, godzina: f.elements.godzina.value,
    dni: $$('[name="dni"]:checked', f).map(x => +x.value)
  } });
  utrwalUstawienia();
  zarejestrujSprawdzanieWTle();
  const p = Z.ustawienia.przypomnienie;
  toast(p.wlaczone ? `Przypomnienie o ${p.godzina}.${'Notification' in window && Notification.permission !== 'granted' ? ' Zezwól jeszcze na powiadomienia albo dodaj je do kalendarza.' : ''}` : 'Przypomnienia wyłączone.', { czas: 5000 });
  renderWidok();
});

document.addEventListener('submit', e => {
  if (e.target.id !== 'f-wyszukiwanie') return;
  e.preventDefault();
  const f = e.target, v = n => f.elements.namedItem(n).value.trim();
  if (v('posrednik') && !/^https:\/\//.test(v('posrednik'))) { toast('Adres pośrednika musi zaczynać się od https://', { typ: 'blad' }); return; }
  Z.ustawienia = normalizujUstawienia({ ...Z.ustawienia, googleKlucz: v('googleKlucz'), posrednik: v('posrednik') });
  utrwalUstawienia();
  toast('Zapisano ustawienia wyszukiwania.');
});

document.addEventListener('submit', e => {
  if (e.target.id !== 'f-ustawienia') return;
  e.preventDefault();
  const f = e.target, v = n => f.elements.namedItem(n).value;
  const nowe = normalizujUstawienia({ ...Z.ustawienia, cel: v('cel'), srednia: v('srednia'), start: v('start'), koniec: v('koniec'), dziennyCel: v('dziennyCel') || 0, imie: v('imie'), tydzienStrony: v('tydzienStrony') || 0, tydzienKsiazki: v('tydzienKsiazki') || 0, miesiacStrony: v('miesiacStrony') || 0, miesiacKsiazki: v('miesiacKsiazki') || 0 });
  if (!(v('koniec') > v('start'))) { toast('Data końca musi być po dacie startu.', { typ: 'blad' }); return; }
  Z.ustawienia = nowe;
  utrwalUstawienia();
  renderWidok();
  toast('Zapisano ustawienia.');
});

matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', zastosujMotyw);

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  U.instalacja = e;
  if (U.widok === 'ustawienia') renderWidok();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  if (U.dzien !== dzisISO()) { U.dzien = dzisISO(); odswiez(); }
  else renderPigulka();
  sprawdzPrzypomnienie();
});

/* ================= start ================= */
async function start() {
  try {
    await Baza.otworz();
    const [ks, us] = await Promise.all([Baza.wszystkie(), Baza.ustawienia()]);
    const surowe = ks || [];
    Z.ksiazki = surowe.map(normalizujKsiazke);
    Z.ustawienia = normalizujUstawienia(us);
    // dopasuj dane z wersji 1 do nowego formatu
    const doPoprawy = Z.ksiazki.filter((k, i) => JSON.stringify(k) !== JSON.stringify(surowe[i]));
    if (doPoprawy.length) utrwal(doPoprawy);
    lsSet('zakladka-motyw', Z.ustawienia.motyw);
  } catch (e) {
    console.error(e);
    toast(`Nie mogę otworzyć bazy na urządzeniu (${e.message}). Zmiany nie będą zapisywane.`, { typ: 'blad', czas: 10000 });
  }
  zastosujMotyw();
  renderWidok();
  renderPigulka();
  sprawdzOdznaki();
  sprawdzCele();
  sprawdzPrzypomnienie();
  zarejestrujSprawdzanieWTle();
  if (Z.ksiazki.length && lsGet('zakladka-widziana-wersja') !== WERSJA) setTimeout(() => arkuszCoNowego(), 900);
  else lsSet('zakladka-widziana-wersja', WERSJA);
  setInterval(sprawdzPrzypomnienie, 60 * 1000);
  setTimeout(() => sprawdzCenyListy(), 6000);
  U.stronyPoprz = stronyRazem();
  // Sówka: raz dziennie przywitanie z niespodzianką, potem co jakiś czas sama coś powie
  setTimeout(() => { if (lsGet('zakladka-sowka-dzien') !== dzisISO() && Z.ksiazki.length) { lsSet('zakladka-sowka-dzien', dzisISO()); niespodziankaSowki('start'); } }, 3500);
  setInterval(() => { if (Math.random() < .5) niespodziankaSowki(); }, 30 * 1000);
  // Sówka w karcie na ekranie Dziś co jakiś czas sama coś mówi (na głos), tempo z ustawienia „jak często gada”
  const kartaGada = () => {
    const g = Z.ustawienia.gra, co = { rzadko: 90, normalnie: 45, czesto: 22 }[g.czestosc] || 45;
    setTimeout(kartaGada, co * 1000);
    const k = Sowa.karta && Sowa.karta();
    if (U.widok !== 'dzis' || document.hidden || otwarte.length || !k || Sowa.gada || document.body.classList.contains('kino-otwarte')) return;
    if (Sowa.widacKarte && !Sowa.widacKarte(k)) return;
    if (Date.now() - Sowa.ostatniaAktywnosc > 5 * 60 * 1000) return; // nikt nie patrzy
    const st = stanSowki();
    if (st.tryb === 'spi') return;
    U.sowkaN = (U.sowkaN || 0) + 1;
    const r = U.sowkaN % 6;
    if (r === 5 && typeof gadkaSowkiPlus === 'function' && gadkaSowkiPlus()) return;
    if (r === 1 && g.zarty) zartWKarcie();
    else if (r === 2) kartaMowi(motywacja(), 'skacze');
    else if (r === 3) kartaMowi(coCzytac(), 'mysli');
    else if (r === 4 && g.zarty && g.zakladka18 && Math.random() < .5) { const [a, b] = losowyZartZakladki(); dymekZakladki(a, () => setTimeout(() => dymekZakladki(b, () => Fx.graj('badum')), 300)); }
    else kartaMowi(wiadomoscSowki(st));
  };
  setTimeout(kartaGada, 25 * 1000);
  setTimeout(() => CiekawostkiSieci.dobierz(), 8000);
  podsumowanieWPoniedzialek();
  setInterval(() => {
    const el = $('#pigulka [data-czas]'), s = sesjaAktywna();
    if (el && s) el.textContent = stoper(czasSesji(s));
  }, 1000);

  const akcja = new URLSearchParams(location.search).get('akcja');
  if (akcja) {
    history.replaceState(null, '', location.pathname);
    if (akcja === 'dodaj') arkuszFormularza();
    if (akcja === 'tydzien') arkuszTygodnia();
    if (akcja === 'wiele') arkuszWielu();
    if (akcja === 'postep') { const b = bazowa() || czytane()[0]; if (b) arkuszPostepu(b.id); }
  }
  const par = new URLSearchParams(location.search), udost = par.get('link') || par.get('tekst') || par.get('tytul');
  if (udost) {
    history.replaceState(null, '', location.pathname);
    const fraza = (String(udost).match(/https?:\/\/\S+/) || [udost])[0];
    arkuszFormularza();
    setTimeout(() => { const q = $('#f-q'); if (q) { q.value = fraza.slice(0, 300); $('[data-szukaj]')?.click(); } }, 150);
  }

  Skaner.dostepny().then(v => { U.skaner = v; });
  try {
    if (navigator.storage && navigator.storage.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch { /* nieobsługiwane */ }
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    const mialKontroler = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (mialKontroler && !U.przeladowano) { U.przeladowano = true; location.reload(); } });
    navigator.serviceWorker.register('sw.js').then(r => r.update()).catch(e => console.warn('Service worker:', e));
  }
}

start();
