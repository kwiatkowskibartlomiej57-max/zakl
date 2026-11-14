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
  pierwszyRender: true, instalacja: null, skaner: false, dzien: dzisISO()
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
  const nast = kolejka()[0];
  const brak = cel - dzisStron;
  const doZapisu = baz || czytane()[0];
  const ss = seriaSzczegoly(m);
  const zagrozona = !ss.dzisZrobione && !ss.dzisWolny && seria > 0 && new Date().getHours() >= 17
    ? `<div class="baner baner-seria"><p>${I.plomien}<span>Twoja seria <strong>${ile(seria, FORMY_DNI)}</strong> skończy się o północy. Wystarczy jedna strona, żeby ją utrzymać.</span></p>
      ${doZapisu ? `<div class="przyciski"><button type="button" class="btn btn-glowny" data-akcja="postep" data-id="${doZapisu.id}">Zapisz postęp</button><button type="button" class="btn" data-akcja="sesja" data-id="${doZapisu.id}">${I.zegar}Sesja</button></div>` : ''}</div>` : '';
  return `${banery()}${zagrozona}${banerPozyczek()}${banerLosowania()}
  <section class="powitanie">
    <p class="powitanie-data">${dataDzis()}</p>
    <h1>${powitanie()}</h1>
  </section>
  <section class="dzien" aria-label="Dzisiejsze czytanie">
    <div class="dzien-pierscien">${pierscien(dzisStron, cel)}
      <div class="dzien-liczba"><strong>${dzisStron}</strong><span>z ${ile(cel, FORMY_STRON_D)}</span></div></div>
    <div class="dzien-boki">
      <p class="dzien-seria${seria ? ' aktywna' : ''}" data-akcja="passa" role="button" tabindex="0" title="Twoja passa">${I.plomien}<span>${seria ? `<strong>${ile(seria, FORMY_DNI)}</strong> z rzędu` : 'Przeczytaj dziś choć stronę, żeby zacząć serię'}</span></p>
      <p>W tym tygodniu <strong>${ile(tydzien, FORMY_STRON)}</strong></p>
      <p class="cichy">${brak <= 0 ? 'Dzienny cel zrobiony.' : `Do dziennego celu brakuje ${ile(brak, FORMY_STRON_D)}.`}</p>
    </div>
  </section>
  ${baz ? blokBazowej(baz) : blokBezBazowej()}
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
    <div class="sekcja-gora"><h2>Następna w kolejce</h2><span class="sekcja-akcje">${kolejka().length > 1 ? `<button type="button" class="btn-tekst" data-akcja="losuj">Losuj</button>` : ''}<button type="button" class="btn-tekst" data-akcja="idz" data-widok="biblioteka" data-polka="doPrzeczytania">Cała lista</button></span></div>
    <div class="nastepna"><button type="button" class="wiersz-glowny" data-akcja="ksiazka" data-id="${nast.id}">${okladka(nast, 's')}
      <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(nast.tytul)}</span><span class="wiersz-autor">${esc(nast.autor)}${nast.autor ? ', ' : ''}${ile(nast.strony, FORMY_STRON)}</span></span></button>
      <button type="button" class="btn" data-akcja="zacznij" data-id="${nast.id}">Zacznij</button></div>
  </section>` : ''}
  ${cytatDnia()}`;
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
  if (!U.pozyczone) lista = sortuj(lista);
  if (!lista.length) {
    if (q || U.tag) return '<p class="pusto">Nic nie pasuje do wyszukiwania.</p>';
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
  return `<ul class="siatka">${lista.map((k, i) => `<li><button type="button" class="kafel" data-akcja="ksiazka" data-id="${k.id}">
      ${okladka(k, 'm')}${kolejkowa ? `<span class="kafel-nr" aria-label="Pozycja w kolejce">${i + 1}</span>` : ''}${k.bazowa ? '<span class="kafel-wstazka" aria-label="Książka bazowa"></span>' : ''}
      ${k.pozyczona ? `<span class="kafel-pozyczka" title="${k.pozyczona.kierunek === 'komus' ? 'Pożyczona: ' : 'Od: '}${esc(k.pozyczona.kto)}">${I.reka}${esc(k.pozyczona.kto)}</span>` : ''}
      <span class="kafel-tytul">${esc(k.tytul)}</span><span class="kafel-autor">${esc(k.autor)}${k.seria ? `<span class="kafel-seria">${esc(k.seria)}${k.tom != null ? ` ${String(k.tom).replace('.', ',')}` : ''}</span>` : ''}</span>
      ${k.status === 'czytam' || (k.status === 'pozniej' && k.strona) ? pasek(k.strona / k.strony * 100) : ''}
      ${k.status === 'zyczenia' && (k.cena || k.priorytet) ? `<span class="kafel-zycz">${k.priorytet ? `<span class="kafel-prio">${'♥'.repeat(k.priorytet)}</span>` : ''}${k.cena ? `${k.cena.toFixed(2).replace('.', ',')} zł` : ''}</span>` : ''}
      ${k.status === 'przeczytana' && k.ocena ? `<span class="kafel-ocena" aria-label="Ocena ${k.ocena} na 5">${'★'.repeat(k.ocena)}<span class="kafel-ocena-reszta">${'★'.repeat(5 - k.ocena)}</span></span>` : ''}
    </button></li>`).join('')}</ul>`;
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
    <span class="naglowek-akcje"><button type="button" class="btn" data-akcja="miesiac" data-ym="${miesiacTeraz()}">${I.kalendarz}Miesiąc</button><button type="button" class="btn" data-akcja="rok">${I.rok}Twój rok</button></span></section>
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
    <div class="przyciski"><button type="submit" class="btn btn-glowny">Zapisz</button><button type="button" class="btn" data-akcja="test-zrodel">Sprawdź źródła</button></div>
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
  U.pierwszyRender = false;
}

function idz(widok, polka) {
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
  ${k.status === 'przeczytana' ? `<div class="kd-ocena"><p>Twoja ocena</p>${gwiazdki(k)}</div>` : ''}
  <div class="przyciski kd-akcje">${akcje}</div>
  ${htmlZyczenia(k)}
  ${htmlRozdzialow(k)}
  ${['czytam', 'doPrzeczytania', 'pozniej'].includes(k.status) ? `<p class="kd-plan">${I.kalendarz}${k.planMiesiac
    ? `<span>W planie na <button type="button" class="btn-tekst" data-akcja="miesiac" data-ym="${k.planMiesiac}">${nazwaMiesiaca(k.planMiesiac)}</button></span><button type="button" class="btn-tekst" data-akcja="plan-ksiazki" data-id="${k.id}">Zmień</button>`
    : `<button type="button" class="btn-tekst" data-akcja="plan-ksiazki" data-id="${k.id}">Zaplanuj na miesiąc</button>`}
    ${planTygodnia().some(e => e.id === k.id) ? '<span class="kd-plan-tydz">· w planie tego tygodnia</span>' : `<button type="button" class="btn-tekst" data-akcja="do-tygodnia" data-id="${k.id}">Na ten tydzień</button>`}</p>` : ''}
  ${k.status === 'przeczytana' || k.recenzja ? `<label class="kd-recenzja">Twoje wrażenia<textarea name="recenzja" rows="3" placeholder="Co zostanie ci z tej książki?">${esc(k.recenzja)}</textarea></label>` : ''}
  ${htmlPozyczki(k)}
  ${htmlSerii(k)}
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
function arkuszFormularza(id = null, { jako = 'doPrzeczytania' } = {}) {
  const edytowana = id ? znajdz(id) : null;
  const k = edytowana || { tytul: '', autor: '', strony: '', isbn: '', format: 'papier', tagi: [], okladka: null, seria: '', tom: null };
  let okl = k.okladka;
  let wyniki = [];
  const a = arkusz({
    tytul: edytowana ? 'Edytuj książkę' : 'Dodaj książkę',
    render: () => `<form class="formularz" novalidate>
      ${edytowana ? '' : `<div class="szukajka">
        <label for="f-q">Znajdź w internecie</label>
        <div class="szukajka-rzad"><input id="f-q" type="search" placeholder="Tytuł, autor albo ISBN" enterkeyhint="search" autocomplete="off">
          <button type="button" class="btn" data-szukaj>${I.szukaj}<span class="sr">Szukaj</span></button>
          ${U.skaner ? `<button type="button" class="btn" data-skanuj aria-label="Skanuj kod kreskowy">${I.skaner}</button>` : ''}</div>
        <div class="wyniki" aria-live="polite"></div>
        <p class="podpowiedz">Albo wpisz dane ręcznie poniżej. Masz kilka książek? <button type="button" class="btn-tekst" data-wiele>Dodaj wiele naraz</button></p>
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
      ${edytowana ? '' : `<fieldset class="segment"><legend>Gdzie odłożyć</legend>
        ${radio('gdzie', 'doPrzeczytania', 'Do przeczytania', jako === 'doPrzeczytania')}${radio('gdzie', 'czytam', 'Czytam teraz', jako === 'czytam')}${radio('gdzie', 'bazowa', 'Jako bazową', jako === 'bazowa')}${radio('gdzie', 'zyczenia', 'Lista życzeń', jako === 'zyczenia')}${radio('gdzie', 'pozniej', 'Na później', jako === 'pozniej')}</fieldset>
        <label class="f-miesiace"${jako === 'bazowa' ? '' : ' hidden'}>Na ile miesięcy?<input name="miesiace" type="number" inputmode="decimal" min="0.5" step="0.5" value="2"></label>`}
      <p class="blad" hidden></p>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Anuluj</button>
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
    const q = $('#f-q', f).value.trim();
    const box = $('.wyniki', f);
    if (!q) { $('#f-q', f).focus(); return; }
    if (!navigator.onLine) { box.innerHTML = '<p class="cichy">Jesteś offline. Wpisz dane ręcznie albo spróbuj, gdy wróci internet.</p>'; return; }
    box.innerHTML = '<p class="cichy ladowanie">Szukam…</p>';
    try {
      wyniki = await Wyszukiwarka.szukaj(q);
      box.innerHTML = wyniki.length
        ? `<ul class="wyniki-lista">${wyniki.slice(0, 12).map((w, i) => `<li><button type="button" class="wynik" data-wynik="${i}">
            ${okladka({ tytul: w.tytul, autor: w.autor, okladka: w.okladka }, 's')}
            <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(w.tytul)}</span>
            <span class="wiersz-autor">${esc([w.autor, w.rok, w.strony ? ile(w.strony, FORMY_STRON) : ''].filter(Boolean).join(', '))}</span></span></button></li>`).join('')}</ul>`
        : bezWynikow(q);
      if (wyniki.length) box.insertAdjacentHTML('beforeend', `<p class="cichy zrodla-info">Źródło: ${esc([...new Set(wyniki.map(w => w.zrodlo))].join(', '))}.</p>`);
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
    if (e.target.closest('[data-wiele]')) { a.zamknij(); arkuszWielu(); return; }
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
      if (r.strony) el('strony').value = r.strony;
      if (r.isbn) el('isbn').value = r.isbn;
      if (r.seria) { el('seria').value = r.seria; el('tom').value = r.tom ?? ''; }
      if (r.tagi && r.tagi.length && !el('tagi').value.trim()) el('tagi').value = r.tagi.join(', ');
      okl = r.okladka;
      podglad();
      $('.wyniki', f).innerHTML = `<p class="ok">Wybrano: ${esc(r.tytul)}.${r.strony ? '' : ' Uzupełnij liczbę stron.'}</p>`;
      if (!r.strony) el('strony').focus();
      if (r.okladka) {
        const zapisana = await urlNaOkladke(r.okladka);
        if (okl === r.okladka) { okl = zapisana; }
      }
    }
  });
  $('#f-q', f)?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); szukaj(); } });
  $('[data-plik]', f).addEventListener('change', async e => {
    const plik = e.target.files[0];
    if (!plik) return;
    try { okl = await plikNaOkladke(plik); podglad(); } catch { toast('Nie udało się wczytać zdjęcia.', { typ: 'blad' }); }
  });
  f.addEventListener('change', e => {
    if (e.target.name === 'gdzie') $('.f-miesiace', f).hidden = e.target.value !== 'bazowa';
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
    if (gdzie === 'zyczenia') naListeZyczen(nowa);
    if (gdzie === 'pozniej') odlozNaPozniej(nowa);
    if (gdzie === 'bazowa') {
      const mies = Math.max(0.5, parseFloat(String(el('miesiace').value).replace(',', '.')) || 2);
      zmienione = ustawBazowa(nowa, dodajDni(dzisISO(), Math.round(mies * 30.44) - 1));
    }
    await utrwal(zmienione);
    a.zamknij();
    if (U.widok === 'biblioteka') U.polka = nowa.status;
    odswiez();
    toast(`Dodano „${nowa.tytul}”.`);
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
    lsSet('zakladka-sesja', JSON.stringify({ id, start: Date.now(), strona: k.strona }));
  }
  arkuszSesji(id);
}

function arkuszSesji(id) {
  const k = znajdz(id), s = sesjaAktywna();
  if (!k || !s) return;
  let blokada = null;
  const zwolnij = () => { if (blokada) { blokada.release().catch(() => {}); blokada = null; } };
  const godzina = new Date(s.start).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  const a = arkusz({
    tytul: 'Sesja czytania', klasa: 'arkusz-sesja', onZamknij: () => { clearInterval(t); zwolnij(); },
    render: () => `<div class="sesja${s.pauzaOd ? ' sesja-pauza' : ''}">
      ${okladka(k, 'l')}
      <p class="sesja-tytul">${esc(k.tytul)}</p>
      <p class="sesja-czas" data-czas role="timer" aria-live="off">${stoper(czasSesji(s))}</p>
      <p class="sesja-start">${s.pauzaOd ? 'Pauza. ' : ''}Od ${godzina}, start na stronie ${s.strona}</p>
      <button type="button" class="btn btn-na-plotnie sesja-pauza-btn" data-pauza>${s.pauzaOd ? `${I.graj}Wznów` : `${I.pauza}Pauza`}</button>
      ${'wakeLock' in navigator ? '<label class="przelacznik"><input type="checkbox" data-blokada> Nie wygaszaj ekranu</label>' : ''}
      <form class="formularz sesja-koniec" novalidate>
        <label class="pole-duze"><span>Skończyłem na stronie</span><input name="strona" type="number" inputmode="numeric" min="0" max="${k.strony}" value="${k.strona}"></label>
        <div class="przyciski"><button type="submit" class="btn btn-zloty">Zakończ sesję</button>
          <button type="button" class="btn btn-na-plotnie" data-zamknij>Zwiń</button>
          <button type="button" class="btn-tekst" data-odrzuc>Odrzuć sesję</button></div>
      </form></div>`
  });
  const t = setInterval(() => { const c = $('[data-czas]', a.tresc); if (c) c.textContent = stoper(czasSesji(s)); }, 1000);
  a.tresc.addEventListener('click', e => {
    if (!e.target.closest('[data-pauza]')) return;
    if (s.pauzaOd) { s.pauzaMs = (s.pauzaMs || 0) + Date.now() - s.pauzaOd; s.pauzaOd = null; }
    else s.pauzaOd = Date.now();
    lsSet('zakladka-sesja', JSON.stringify(s));
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
    a.zamknij();
    toast('Odrzucono sesję.');
  });
  $('form', a.tresc).addEventListener('submit', e => {
    e.preventDefault();
    const wartosc = e.target.elements.namedItem('strona').value;
    lsSet('zakladka-sesja', null);
    a.zamknij();
    zakonczSesje(k, s, wartosc === '' ? k.strona : wartosc);
  });
  renderPigulka();
}

function zakonczSesje(k, s, wartosc) {
  const minuty = Math.max(1, Math.round(czasSesji(s) / 60000));
  const { skonczona } = ustawStrone(k, wartosc, dzisISO());
  const strony = Math.max(0, k.strona - s.strona);
  k.sesje.push({ data: dzisISO(), minuty, strony });
  utrwal(k);
  odswiez();
  toast(`Sesja: ${minuty} min, ${ile(strony, FORMY_STRON)}${strony && minuty >= 5 ? `, ${Math.round(strony / minuty * 60)} str./h` : ''}.`);
  if (skonczona) celebracja(k.id);
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
      ${k.bazowa ? '' : (bazowa() ? `<p class="podpowiedz">Obecna bazowa, „${esc(bazowa().tytul)}”, zostanie zwykłą czytaną książką.</p>` : '')}
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
    render: () => lista.length ? `<p class="cichy">Najlepiej sprawdza się długa książka, którą chcesz czytać po trochu każdego dnia.</p>
      <ul class="lista">${lista.map(k => `<li class="wiersz"><button type="button" class="wiersz-glowny" data-wybierz="${k.id}">${okladka(k, 's')}
        <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">${esc(k.autor)}${k.autor ? ', ' : ''}${ile(k.strony, FORMY_STRON)}${k.status === 'czytam' ? ', czytasz' : ''}</span></span></button></li>`).join('')}</ul>`
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
      <label class="pole-waskie">Strona<input name="strona" type="number" inputmode="numeric" min="1" max="${k.strony}" value="${c ? (c.strona || '') : (k.strona || '')}"></label>
      <div class="przyciski przyciski-koniec">${c ? '<button type="button" class="btn btn-ryzyko" data-usun-cytat>Usuń</button>' : ''}
        <button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Zapisz</button></div>
    </form>`
  });
  const f = $('form', a.tresc);
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
  if (!p) return `<p class="kd-pozyczka">${I.reka}<button type="button" class="btn-tekst" data-akcja="pozyczka" data-id="${k.id}">Pożyczona? Zapisz komu albo od kogo</button></p>`;
  const dni = dniMiedzy(p.data, dzisISO());
  return `<p class="kd-pozyczka aktywna${dni > 30 ? ' dawno' : ''}">${I.reka}<span>${p.kierunek === 'komus' ? `Pożyczona: <strong>${esc(p.kto)}</strong>` : `Pożyczona od: <strong>${esc(p.kto)}</strong>`}, od ${dataDluga(p.data, false)} (${ile(dni, FORMY_DNI)})</span>
    <button type="button" class="btn-tekst" data-akcja="pozyczka" data-id="${k.id}">Zmień</button>
    <button type="button" class="btn-tekst" data-akcja="zwrot" data-id="${k.id}">${p.kierunek === 'komus' ? 'Wróciła' : 'Oddana'}</button></p>`;
}

function arkuszPozyczki(id) {
  const k = znajdz(id);
  if (!k) return;
  const p = k.pozyczona || { kto: '', data: dzisISO(), kierunek: 'komus' };
  const znani = [...new Set(Z.ksiazki.map(x => x.pozyczona && x.pozyczona.kto).filter(Boolean))];
  const a = arkusz({
    tytul: 'Pożyczona książka', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <div class="postep-ksiazka">${okladka(k, 's')}<span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">${esc(k.autor)}</span></span></div>
      <fieldset class="segment"><legend class="sr">Kierunek</legend>${radio('kierunek', 'komus', 'Pożyczyłem komuś', p.kierunek === 'komus')}${radio('kierunek', 'od', 'Pożyczyłem od kogoś', p.kierunek === 'od')}</fieldset>
      <label><span data-kto-et>${p.kierunek === 'od' ? 'Od kogo' : 'Komu'}</span><input name="kto" value="${esc(p.kto)}" list="znani-pozyczajacy" autocomplete="off" required placeholder="np. Ania" autofocus></label>
      <datalist id="znani-pozyczajacy">${znani.map(z => `<option value="${esc(z)}">`).join('')}</datalist>
      <label>Od kiedy<input name="data" type="date" max="${dzisISO()}" value="${p.data}"></label>
      <p class="podpowiedz">Po 30 dniach ekran Dziś przypomni o tej książce.</p>
      <div class="przyciski przyciski-koniec">${k.pozyczona ? `<button type="button" class="btn btn-ryzyko" data-zwrot>${p.kierunek === 'komus' ? 'Wróciła' : 'Oddana'}</button>` : ''}
        <button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Zapisz</button></div>
    </form>`
  });
  const f = $('form', a.tresc);
  f.addEventListener('change', e => { if (e.target.name === 'kierunek') $('[data-kto-et]', f).textContent = e.target.value === 'od' ? 'Od kogo' : 'Komu'; });
  f.addEventListener('submit', e => {
    e.preventDefault();
    const kto = f.elements.kto.value.trim();
    if (!kto) { f.elements.kto.focus(); return; }
    k.pozyczona = { kto: kto.slice(0, 60), data: poprawnaData(f.elements.data.value) ? f.elements.data.value : dzisISO(), kierunek: f.elements.kierunek.value };
    utrwal(k); a.zamknij(); odswiez();
    toast(k.pozyczona.kierunek === 'komus' ? `Zapisano: „${k.tytul}” ma ${kto}.` : `Zapisano: „${k.tytul}” od ${kto}.`);
  });
  $('[data-zwrot]', f)?.addEventListener('click', () => { a.zamknij(); zwrocKsiazke(k.id); });
}

function zwrocKsiazke(id) {
  const k = znajdz(id);
  if (!k || !k.pozyczona) return;
  const przed = { ...k.pozyczona };
  k.pozyczona = null;
  utrwal(k); odswiez();
  toast(przed.kierunek === 'komus' ? `„${k.tytul}” wróciła na półkę.` : `Oddano „${k.tytul}”.`, { akcja: 'Cofnij', onAkcja: () => { k.pozyczona = przed; utrwal(k); odswiez(); } });
}

function banerPozyczek() {
  const dawno = pozyczoneKsiazki().filter(k => dniMiedzy(k.pozyczona.data, dzisISO()) > 30);
  if (!dawno.length) return '';
  const k = dawno[0], p = k.pozyczona, dni = dniMiedzy(p.data, dzisISO());
  return `<div class="baner baner-pozyczka"><p>${I.reka}<span>${p.kierunek === 'komus'
    ? `<strong>${esc(p.kto)}</strong> ma „${esc(k.tytul)}” od ${ile(dni, FORMY_DNI)}.`
    : `Masz „${esc(k.tytul)}” od <strong>${esc(p.kto)}</strong> już ${ile(dni, FORMY_DNI)}.`}${dawno.length > 1 ? ` I ${ile(dawno.length - 1, FORMY_KSIAZEK)} więcej.` : ''}</span></p>
    <div class="przyciski"><button type="button" class="btn btn-maly" data-akcja="zwrot" data-id="${k.id}">${p.kierunek === 'komus' ? 'Już wróciła' : 'Już oddana'}</button>
      <button type="button" class="btn-tekst" data-akcja="idz" data-widok="biblioteka" data-pozyczone="1">Wszystkie pożyczone</button></div></div>`;
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
              <button type="button" class="tyg-wpis" data-wpis-planu="${e.staly ? `s:${e.staly}` : e.i}" data-dzien="${d}">
                <span class="tyg-ksiazka">${e.staly ? `<span class="tyg-staly" title="Stały plan">↻</span>` : ''}${esc(e.k.tytul)}</span>
                <span class="tyg-str">${e.przecz && e.strony ? `${e.przecz}/` : ''}${celWpisu(e) || (e.przecz ? `+${e.przecz} str.` : 'dowolnie')}</span></button>
              ${d >= dzis && !e.zrobione ? `<button type="button" class="btn-ikona maly" data-jutro="${e.staly ? `s:${e.staly}` : e.i}" data-dzien="${d}" aria-label="Przenieś na następny dzień" title="Na następny dzień">${I.dalej}</button>` : ''}
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
  const kandydaci = [...czytane(), ...kolejka(), ...naPozniej()];
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
  const wczesniej = [...new Set(planTygodnia(pn).filter(e => !e.ukryty).map(e => e.id))].filter(id => { const k = znajdz(id); return k && zostaloStron(k) > 0; });
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
    const maxS = Math.max(1, ...w.naDzien.map(x => x.strony), ...w.naDzien.map(x => stronZMinut(x.min)));
    const wiersze = dniTyg.map(d => {
      const x = w.naDzien.find(y => y.d === d);
      const min = st.czasy[dzienTygodnia(d)] || 0;
      if (!x) return `<li class="kr-dzien minal"><span class="kr-dzien-n">${DNI_KR[dzienTygodnia(d)]}</span><span class="kr-pasek"></span><span class="kr-dzien-l">minął</span></li>`;
      const czesci = w.wpisy.filter(e => e.dzien === d);
      const poj = stronZMinut(min);
      return `<li class="kr-dzien${!min && !w.bezCzasu ? ' wolny' : ''}"><span class="kr-dzien-n">${DNI_KR[dzienTygodnia(d)]}</span>
        <span class="kr-pasek">${czesci.map(e => `<span style="width:${(e.strony / maxS * 100).toFixed(1)}%;background:${kolor(e.id)}" title="${esc(znajdz(e.id).tytul)}: ${e.strony} str."></span>`).join('')}
          ${poj && !w.bezCzasu ? `<i class="kr-poj" style="left:${Math.min(100, poj / maxS * 100).toFixed(1)}%" title="Twój czas: ${poj} str."></i>` : ''}</span>
        <span class="kr-dzien-l">${x.strony ? `${x.strony} str.` : !min && !w.bezCzasu ? 'wolne' : '—'}${x.strony ? `<small>${czasTekst(minutZeStron(x.strony))}</small>` : ''}</span></li>`;
    }).join('');
    const skonczone = Object.keys(w.koniec).length;
    const ocena = w.bezCzasu ? `<p class="kr-ocena cichy">Nie ustawiłeś czasu na czytanie, więc dzielę równo na dni.</p>`
      : w.za_duzo && st.limit ? `<div class="kr-ocena"><p><strong>Plan w twoim czasie:</strong> zaplanowane ${ile(w.zaplanowane, FORMY_STRON)} z ${w.strony}. Skończysz ${skonczone} z ${st.wybrane.length} książek, reszta przejdzie na kolejny tydzień.</p>
          <div class="przyciski"><button type="button" class="btn btn-maly" data-dopasuj-czas>Chcę skończyć wszystkie: ${w.minutDziennie} min dziennie</button></div></div>`
      : w.za_duzo ? `<div class="kr-ocena zle"><p><strong>Za mało czasu.</strong> Ten plan to ok. ${czasTekst(w.potrzebaMin)} czytania, a masz ${czasTekst(w.maszMin)}. Potrzebujesz ok. <strong>${w.minutDziennie} min dziennie</strong>.</p>
          <div class="przyciski"><button type="button" class="btn btn-maly" data-dopasuj-czas>Ustaw ${w.minutDziennie} min w dni czytania</button><button type="button" class="btn btn-maly" data-tylko-czas>Planuj tylko w moim czasie</button>${st.wybrane.length > 1 ? '<button type="button" class="btn btn-maly" data-zamien-krotsze>Wybierz krótsze</button>' : ''}</div></div>`
      : `<p class="kr-ocena ok"><strong>Zmieścisz się.</strong> ok. ${czasTekst(w.potrzebaMin)} z twoich ${czasTekst(w.maszMin)} (${Math.round(w.potrzebaMin / w.maszMin * 100)}% czasu).</p>`;
    return `<ol class="kr-dni">${wiersze}</ol>
      <p class="kr-suma">${w.limit && w.zaplanowane < w.strony ? `${w.zaplanowane} z ${ile(w.strony, FORMY_STRON_D)}` : ile(w.strony, FORMY_STRON)} · ${skonczone} z ${st.wybrane.length} książek do końca tygodnia${st.cel ? ` · cel ${st.cel}` : ''}</p>
      ${ocena}
      <p class="legenda kr-legenda">${st.wybrane.map(id => `<span><i style="background:${kolor(id)}"></i>${esc(znajdz(id).tytul)}</span>`).join('')}${w.bezCzasu ? '' : '<span><i class="kr-poj-leg"></i>twój czas</span>'}</p>`;
  };

  const htmlPickera = () => {
    const q = st.filtr.trim().toLowerCase();
    const kand = [...czytane(), ...kolejka(), ...naPozniej()].filter(k => !st.wybrane.includes(k.id) && zostaloStron(k) > 0)
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
      dniTyg.forEach((d, i) => { if (d >= od && st.czasy[i] > 0) st.czasy[i] = Math.max(st.czasy[i], Math.ceil(w.minutDziennie / 5) * 5); });
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
  const kandydaci = [...czytane(), ...kolejka(), ...naPozniej()];
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
      <button type="button" class="btn-tekst tyg-ksiazka" data-akcja="${e.k.status === 'czytam' ? 'postep' : 'ksiazka'}" data-id="${e.k.id}">${e.staly ? '<span class="tyg-staly">↻</span>' : ''}${esc(e.k.tytul)}</button>
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
function htmlZyczenia(k) {
  if (k.status !== 'zyczenia') return '';
  const q = encodeURIComponent(`${k.tytul} ${k.autor} ${k.isbn || ''} cena`.trim());
  return `<section class="kd-sekcja kd-zyczenia"><h3>Lista życzeń</h3>
    <div class="f-rzad"><label>Cena (zł)<input type="number" inputmode="decimal" min="0" step="0.01" data-pole-zycz="cena" data-id="${k.id}" value="${k.cena ?? ''}" placeholder="np. 39,90"></label>
      <label>Priorytet<select data-pole-zycz="priorytet" data-id="${k.id}">${[[0, 'zwykły'], [1, 'chcę'], [2, 'bardzo chcę'], [3, 'muszę mieć']].map(([v, n]) => `<option value="${v}"${k.priorytet === v ? ' selected' : ''}>${n}</option>`).join('')}</select></label></div>
    <label>Link do sklepu<input type="url" data-pole-zycz="link" data-id="${k.id}" value="${esc(k.link)}" placeholder="https://…"></label>
    <div class="przyciski">${k.link ? `<a class="btn btn-maly" href="${esc(k.link)}" target="_blank" rel="noopener">Otwórz sklep</a>` : ''}
      <a class="btn btn-maly" href="https://www.google.com/search?tbm=shop&q=${q}" target="_blank" rel="noopener">${I.szukaj}Porównaj ceny</a></div>
  </section>`;
}

function naglowekPolki() {
  if (U.pozyczone) return '';
  if (U.polka === 'zyczenia') {
    const l = listaZyczen(), suma = l.reduce((s, k) => s + (k.cena || 0), 0);
    return l.length ? `<p class="polka-info">${ile(l.length, FORMY_KSIAZEK)} na liście${suma ? `, razem ok. <strong>${suma.toFixed(2).replace('.', ',')} zł</strong>` : ''}. Kupiłeś? Otwórz książkę i kliknij „Mam ją”.</p>` : '';
  }
  if (U.polka === 'pozniej') return naPozniej().length ? '<p class="polka-info">Odłożone na później: nie zaśmiecają kolejki, a zapamiętują stronę, na której skończyłeś.</p>' : '';
  return '';
}

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
      const wyn = await Wyszukiwarka.szukaj(r.zap);
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
      const wyn = await Wyszukiwarka.szukaj(q);
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
  porzuc: d => {
    const k = znajdz(d.id), kopia = JSON.parse(JSON.stringify(k));
    utrwal(porzuc(k));
    odswiez();
    toast(`Porzucono „${k.tytul}”.`, { akcja: 'Cofnij', onAkcja: () => { Object.assign(k, kopia); utrwal(k); odswiez(); } });
  },
  kolejka: d => { utrwal(przesunWKolejce(znajdz(d.id), +d.kierunek)); odswiez(); },
  'na-poczatek': d => { utrwal(naPoczatekKolejki(znajdz(d.id))); odswiez(); toast('Przeniesiono na początek kolejki.'); },
  usun: d => usunKsiazke(d.id),
  ocena: d => { const k = znajdz(d.id); k.ocena = k.ocena === +d.n ? 0 : +d.n; utrwal(k); odswiez(); },
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
  tydzien: d => arkuszTygodnia(d.pn || poczatekTygodnia()),
  'tydzien-dodaj': d => arkuszDodajDoTygodnia(d.pn || poczatekTygodnia(), d.dzien || null),
  'do-tygodnia': d => { const k = znajdz(d.id); dodajDoPlanu(poczatekTygodnia(), k.id); utrwalUstawienia(); odswiez(); toast(`„${k.tytul}” w planie tygodnia.`, { akcja: 'Pokaż', onAkcja: () => arkuszTygodnia() }); },
  'dodaj-wiele': () => arkuszWielu(),
  rozloz: d => arkuszKreatora(d.pn || poczatekTygodnia()),
  kreator: d => arkuszKreatora(d.pn || poczatekTygodnia()),
  'czas-czytania': () => arkuszCzasu(),
  'staly-plan': d => arkuszStalegoPlanu(d.rid || null),
  passa: () => arkuszSerii(),
  'na-pozniej': d => { const k = znajdz(d.id), przed = { status: k.status, bazowa: k.bazowa, odlozono: k.odlozono }; utrwal(odlozNaPozniej(k)); odswiez(); toast(`„${k.tytul}” odłożona na później.`, { akcja: 'Cofnij', onAkcja: () => { Object.assign(k, przed); utrwal(k); odswiez(); } }); },
  'do-kolejki': d => { const k = znajdz(d.id); utrwal(doKolejki(k, !!d.poczatek)); odswiez(); toast(`„${k.tytul}” wraca do kolejki${d.poczatek ? ' na początek' : ''}.`); },
  zyczenia: d => { const k = znajdz(d.id); utrwal(naListeZyczen(k)); odswiez(); toast(`„${k.tytul}” na liście życzeń.`); },
  'mam-ja': d => { const k = znajdz(d.id); utrwal(doKolejki(k)); odswiez(); toast(`„${k.tytul}” w kolejce do przeczytania.`, { akcja: 'Na początek', onAkcja: () => { utrwal(doKolejki(k, true)); odswiez(); } }); },
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
  polka: d => { U.pozyczone = false; U.polka = d.polka; U.tag = null; U.sort = 'domyslnie'; renderWidok(); },
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
  const pz = e.target.dataset && e.target.dataset.poleZycz;
  if (pz) {
    const k = znajdz(e.target.dataset.id);
    if (!k) return;
    const v = e.target.value.trim().replace(',', '.');
    if (pz === 'cena') k.cena = +v > 0 ? Math.round(+v * 100) / 100 : null;
    if (pz === 'priorytet') k.priorytet = ogranicz(+v || 0, 0, 3);
    if (pz === 'link') { if (v && !/^https?:\/\//.test(v)) { toast('Link musi zaczynać się od https://', { typ: 'blad' }); return; } k.link = v; }
    utrwal(k); odswiez();
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
  setInterval(sprawdzPrzypomnienie, 60 * 1000);
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

  Skaner.dostepny().then(v => { U.skaner = v; });
  try {
    if (navigator.storage && navigator.storage.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch { /* nieobsługiwane */ }
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('Service worker:', e));
  }
}

start();
