/* =====================================================================
   Zakładka 2.23: mądrzejsza Sówka
   pogoda, analiza czytania, nowości z sieci, pytania do ciebie (i pamięć odpowiedzi),
   garderoba Sówki i Zakładki, Quiz Sówki i gra „Nocny lot”.
   Stałe zdania są nagrane głosami postaci (audio/glosy-*.bin), zmienne (tytuły) postaci „gaworzą”.
   ===================================================================== */

/* ---------------- liczebniki do zdań o temperaturze ---------------- */
function stopnieTekst(t) {
  const n = Math.abs(t), forma = n === 1 ? 'stopień' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'stopnie' : 'stopni';
  return `${t < 0 ? 'minus ' : ''}${n} ${forma}`;
}

/* ---------------- odtwarzanie kolejnych kwestii w karcie Sówki ---------------- */
/** Kwestie po kolei w karcie na ekranie Dziś: Sówka w swoim dymku, Zakładka w swoim. Gdy karty nie widać, w okienku rozmowy. */
function kartaSekwencja(kwestie, { klasa = 'mysli', potem } = {}) {
  kwestie = kwestie.filter(Boolean);
  if (!kwestie.length) return;
  if (!$('#widok [data-sowka-tekst]') || U.widok !== 'dzis') { rozmowa(kwestie.map(k => ({ kto: k.kto || 's', tekst: k.tekst }))); return; }
  let i = 0, zebrane = [];
  const dalej = () => {
    if (i >= kwestie.length) { potem && potem(); return; }
    const k = kwestie[i++];
    if (k.kto === 'z') { dymekZakladki(k.tekst, () => setTimeout(dalej, 250)); return; }
    zebrane = k.nowy ? [k.tekst] : [...zebrane, k.tekst].slice(-2);
    pokazDymek(zebrane.join(' '), { klasa: i === 1 ? klasa : '' });
    mowWKarcie(k.tekst, 's', () => setTimeout(dalej, 260));
  };
  dalej();
}

/* =====================================================================
   POGODA (Open-Meteo, bez klucza; wysyłamy tylko zaokrąglone współrzędne miasta)
   ===================================================================== */
const POGODA_OPIS = {
  slonce: ['Hu-hu, za oknem świeci słońce.', 'Dziś jest słonecznie i pogodnie.'],
  chmury: ['Dziś jest pochmurno.', 'Niebo jest dziś zachmurzone.'],
  mgla: ['Za oknem mgła, jak w powieści grozy.', 'Dziś jest mglisto.'],
  mzawka: ['Za oknem mży.', 'Dziś pada drobny deszczyk.'],
  deszcz: ['Za oknem pada deszcz.', 'Dziś leje. Zostańmy w domu z książką.'],
  snieg: ['Hu-hu, pada śnieg!', 'Za oknem sypie śniegiem.'],
  burza: ['Uwaga, za oknem burza!', 'Grzmi i błyska. Burza.']
};
const POGODA_NOC = ['Jest już ciemno, gwiazdy pilnują nieba.', 'Na dworze noc i spokój.'];
const POGODA_RADA = {
  slonce: ['Słońce to dobry moment na czytanie na balkonie albo w parku.', 'Weź książkę na spacer. Ławka w słońcu to świetna czytelnia.'],
  chmury: ['Szara pogoda? Idealna na długi rozdział z herbatą.', 'Chmury nie przeszkadzają. Lampka, koc i czytamy.'],
  mgla: ['Mgła to pogoda na kryminał albo opowieść z dreszczykiem.', 'W taką pogodę najlepiej czyta się coś tajemniczego.'],
  mzawka: ['Mżawka to pogoda na herbatę i powieść obyczajową.', 'Taki deszczyk aż prosi o kilka stron pod kocem.'],
  deszcz: ['Deszcz to najlepsza pogoda na kryminał pod kocem.', 'Krople o szybę i dobra książka. Lepiej się nie da.'],
  snieg: ['Śnieg za oknem, kakao w kubku, książka w łapkach. Plan idealny.', 'Zimowa pogoda to czas na grubą powieść.'],
  burza: ['Przy burzy czytaj w domu, z dala od okna.', 'Burza? To pora na najbardziej wciągającą książkę, jaką masz.']
};
const POGODA_TEMP_RADA = { zimno: 'Brr, zimno. Ciepła herbata i czytamy w środku.', mroz: 'Mróz! Ubierz się ciepło, a czytaj najlepiej pod kocem.', upal: 'Upał! Czytaj w cieniu i pij dużo wody.', cieplo: 'Ciepło i przyjemnie.' };
const POGODA_JUTRO = { deszcz: 'Jutro ma padać. Przygotuj parasol i książkę na drogę.', snieg: 'Jutro ma padać śnieg.', slonce: 'Jutro zapowiadają słońce.', burza: 'Jutro mogą być burze.', chmury: 'Jutro będzie raczej pochmurno.' };
const POGODA_ZAKL = ['W taką pogodę to ja wolę siedzieć w książce. Tam zawsze jest sucho.', 'A ja tam się pogodą nie przejmuję. Mieszkam między stronami.', 'Byle mnie nikt nie zostawił na mokrej ławce.'];
const POGODA_BEZ_MIASTA = 'Hu-hu, powiedz mi, gdzie mieszkasz, a sprawdzę pogodę.';

function rodzajPogody(kod) {
  if (kod <= 1) return 'slonce';
  if (kod <= 3) return 'chmury';
  if (kod === 45 || kod === 48) return 'mgla';
  if (kod >= 51 && kod <= 57) return 'mzawka';
  if ((kod >= 61 && kod <= 67) || (kod >= 80 && kod <= 82)) return 'deszcz';
  if ((kod >= 71 && kod <= 77) || kod === 85 || kod === 86) return 'snieg';
  if (kod >= 95) return 'burza';
  return 'chmury';
}
const IKONY_POGODY = { slonce: '☀️', chmury: '☁️', mgla: '🌫️', mzawka: '🌦️', deszcz: '🌧️', snieg: '❄️', burza: '⛈️' };

const Pogoda = {
  dane: null,
  async pobierz({ wymus = false } = {}) {
    const m = Z.ustawienia.gra.miasto;
    if (!m) return null;
    try {
      const c = JSON.parse(lsGet('zakladka-pogoda') || 'null');
      if (!wymus && c && c.lat === m.lat && c.lon === m.lon && Date.now() - c.czas < 45 * 60 * 1000) { this.dane = c; return c; }
    } catch { /* brak pamięci */ }
    if (!navigator.onLine) return this.dane;
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${m.lat}&longitude=${m.lon}&current=temperature_2m,weather_code,is_day,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=2`);
      const d = await r.json();
      if (!d.current) return this.dane;
      this.dane = {
        lat: m.lat, lon: m.lon, czas: Date.now(),
        temp: Math.round(d.current.temperature_2m), kod: d.current.weather_code, dzien: !!d.current.is_day, wiatr: Math.round(d.current.wind_speed_10m),
        max: Math.round(d.daily.temperature_2m_max[0]), min: Math.round(d.daily.temperature_2m_min[0]), opady: d.daily.precipitation_probability_max[0],
        jutroKod: d.daily.weather_code[1], jutroMax: Math.round(d.daily.temperature_2m_max[1]), jutroMin: Math.round(d.daily.temperature_2m_min[1])
      };
      lsSet('zakladka-pogoda', JSON.stringify(this.dane));
      return this.dane;
    } catch { return this.dane; }
  },
  /** Kwestie Sówki (i czasem Zakładki) o pogodzie, wszystkie z nagranych zdań. */
  kwestie(d) {
    const r = rodzajPogody(d.kod), k = [];
    k.push({ kto: 's', tekst: !d.dzien && (r === 'slonce' || r === 'chmury') ? losuj(POGODA_NOC) : losuj(POGODA_OPIS[r]), nowy: true });
    k.push({ kto: 's', tekst: `Na dworze ${stopnieTekst(d.temp)}.` });
    if (d.temp <= -5) k.push({ kto: 's', tekst: POGODA_TEMP_RADA.mroz });
    else if (d.temp <= 5) k.push({ kto: 's', tekst: POGODA_TEMP_RADA.zimno });
    else if (d.temp >= 28) k.push({ kto: 's', tekst: POGODA_TEMP_RADA.upal });
    k.push({ kto: 's', tekst: losuj(POGODA_RADA[r]), nowy: true });
    const j = rodzajPogody(d.jutroKod);
    if (new Date().getHours() >= 16 && POGODA_JUTRO[j]) k.push({ kto: 's', tekst: POGODA_JUTRO[j], nowy: true });
    if (Math.random() < .35) k.push({ kto: 'z', tekst: losuj(POGODA_ZAKL) });
    return k;
  }
};

async function powiedzPogode() {
  const g = Z.ustawienia.gra;
  if (!g.miasto) { kartaSekwencja([{ kto: 's', tekst: POGODA_BEZ_MIASTA, nowy: true }]); arkuszPogody(); return; }
  const d = await Pogoda.pobierz();
  if (!d) { toast('Nie udało się sprawdzić pogody. Sprawdź internet.'); return; }
  lsSet('zakladka-pogoda-dzien', dzisISO());
  kartaSekwencja(Pogoda.kwestie(d), { klasa: 'skacze' });
  odswiezChipPogody();
}
function chipPogody() {
  const g = Z.ustawienia.gra;
  if (!g.pogoda) return '';
  const d = Pogoda.dane || (() => { try { return JSON.parse(lsGet('zakladka-pogoda') || 'null'); } catch { return null; } })();
  const ok = d && g.miasto && d.lat === g.miasto.lat && d.lon === g.miasto.lon;
  return `<button type="button" class="chip-m chip-pogoda" data-sowka-plus="pogoda">${ok ? `${IKONY_POGODY[rodzajPogody(d.kod)]} ${d.temp}°` : '🌦️ Pogoda'}</button>`;
}
function odswiezChipPogody() { const c = $('#widok .chip-pogoda'); if (c) c.outerHTML = chipPogody(); }

function arkuszPogody() {
  const g = Z.ustawienia.gra;
  let wyniki = [];
  const a = arkusz({
    tytul: 'Pogoda u Sówki', klasa: 'arkusz-maly',
    render: () => {
      const d = Pogoda.dane;
      return `<div class="pogoda-ark">
        ${g.miasto ? `<p>Sprawdzam pogodę dla: <strong>${esc(g.miasto.nazwa)}</strong></p>` : '<p>Gdzie mieszkasz? Sówka sprawdzi pogodę i dobierze do niej czytanie.</p>'}
        ${d && g.miasto ? `<div class="pogoda-teraz"><span class="pogoda-ikona">${IKONY_POGODY[rodzajPogody(d.kod)]}</span><div><strong>${d.temp}°C</strong><p class="cichy">dziś ${d.min}° do ${d.max}°, opady ${d.opady ?? 0}%, wiatr ${d.wiatr} km/h</p><p class="cichy">jutro ${IKONY_POGODY[rodzajPogody(d.jutroKod)]} ${d.jutroMin}° do ${d.jutroMax}°</p></div></div>` : ''}
        <form class="formularz" data-miasto-f novalidate><label>Miasto<div class="szukajka-rzad"><input name="miasto" placeholder="np. Kraków" autocomplete="off" enterkeyhint="search"><button type="submit" class="btn">${I.szukaj}<span class="sr">Szukaj</span></button></div></label></form>
        <div class="pogoda-wyniki">${wyniki.map((w, i) => `<button type="button" class="btn btn-maly" data-miasto="${i}">${esc(w.name)}${w.admin1 ? `, ${esc(w.admin1)}` : ''}${w.country_code && w.country_code !== 'PL' ? ` (${esc(w.country_code)})` : ''}</button>`).join('')}</div>
        ${navigator.geolocation ? '<button type="button" class="btn-tekst" data-gdzie-jestem>📍 Użyj mojej lokalizacji</button>' : ''}
        <label class="przelacznik maly"><input type="checkbox" data-pogoda-wl${g.pogoda ? ' checked' : ''}><span>Sówka mówi o pogodzie (rano i po dotknięciu chmurki)</span></label>
        <p class="cichy maly">Pogoda pochodzi z Open-Meteo. Wysyłam tylko przybliżone współrzędne miasta, nic więcej.</p>
        ${g.miasto ? '<div class="przyciski"><button type="button" class="btn btn-glowny" data-powiedz-pogode>🦉 Sówko, jaka pogoda?</button></div>' : ''}
      </div>`;
    }
  });
  const zapisz = (nazwa, lat, lon) => {
    g.miasto = { nazwa, lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100 };
    utrwalUstawienia();
    Pogoda.pobierz({ wymus: true }).then(() => { if (!a.zamkniety) a.rysuj(); odswiezChipPogody(); });
  };
  a.tresc.addEventListener('submit', async e => {
    e.preventDefault();
    const q = e.target.elements.miasto.value.trim();
    if (!q) return;
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=pl&format=json`);
      wyniki = (await r.json()).results || [];
      if (!wyniki.length) toast('Nie znalazłam takiego miasta.');
      a.rysuj();
    } catch { toast('Brak połączenia z wyszukiwarką miast.'); }
  });
  a.tresc.addEventListener('click', e => {
    const m = e.target.closest('[data-miasto]');
    if (m) { const w = wyniki[+m.dataset.miasto]; wyniki = []; zapisz(w.name, w.latitude, w.longitude); return; }
    if (e.target.closest('[data-gdzie-jestem]')) {
      navigator.geolocation.getCurrentPosition(p => zapisz('Twoja okolica', p.coords.latitude, p.coords.longitude), () => toast('Nie mam dostępu do lokalizacji. Wpisz miasto.'), { maximumAge: 3600000, timeout: 10000 });
      return;
    }
    if (e.target.closest('[data-powiedz-pogode]')) { a.zamknij(); setTimeout(powiedzPogode, 300); }
  });
  a.tresc.addEventListener('change', e => { if (e.target.matches('[data-pogoda-wl]')) { g.pogoda = e.target.checked; utrwalUstawienia(); odswiez(); } });
}

/* =====================================================================
   ANALIZA CZYTANIA (same nagrane zdania, dobierane z twoich danych)
   ===================================================================== */
const ANALIZA = {
  wstep: ['Hu-hu! Przejrzałam twoje półki. Oto, co widzę.', 'Usiądź wygodnie. Zrobiłam analizę twojego czytania.'],
  zaMalo: 'Mam jeszcze za mało danych. Przeczytaj kilka książek i zapisuj strony, a powiem ci więcej.',
  gatunek: {
    fantasy: 'Najczęściej czytasz fantasy. Smoki cię lubią.', scifi: 'Najczęściej czytasz science fiction. Głowa w gwiazdach!',
    kryminal: 'Najczęściej czytasz kryminały. Mały detektyw z ciebie.', thriller: 'Najczęściej czytasz thrillery. Lubisz, jak serce bije szybciej.',
    horror: 'Najczęściej czytasz horrory. Odważna z ciebie dusza.', romans: 'Najczęściej czytasz romanse. Serce masz na dłoni.',
    humor: 'Najczęściej czytasz książki z humorem. I bardzo dobrze.', obyczaj: 'Najczęściej czytasz powieści obyczajowe. Lubisz historie o zwykłym życiu.',
    historia: 'Najczęściej czytasz o historii. Prawdziwy podróżnik w czasie.', przygoda: 'Najczęściej czytasz powieści przygodowe. Plecak zawsze spakowany.',
    reportaz: 'Najczęściej czytasz reportaże. Lubisz prawdziwe historie.', biografia: 'Najczęściej czytasz biografie. Ciekawią cię ludzie.',
    nauka: 'Najczęściej czytasz książki popularnonaukowe. Głodny wiedzy!', poradnik: 'Najczęściej czytasz poradniki. Ciągle się rozwijasz.',
    mlodziez: 'Najczęściej czytasz literaturę młodzieżową.', dzieci: 'Najczęściej czytasz książki dla dzieci. To najpiękniejsze historie.',
    poezja: 'Najczęściej czytasz poezję. Masz duszę poety.', klasyka: 'Najczęściej czytasz klasykę. Elegancko!',
    techniczna: 'Najczęściej czytasz książki techniczne. Umysł inżyniera.'
  },
  nastroj: {
    wciaga: 'Lubisz książki, które wciągają tak, że nie da się ich odłożyć.', napiecie: 'Lubisz, gdy książka trzyma w napięciu do ostatniej strony.',
    wzrusza: 'Lubisz książki, które wzruszają. Chusteczki zawsze pod ręką.', zabawna: 'Lubisz książki, przy których można się pośmiać.',
    mroczna: 'Ciągnie cię do mrocznych historii.', pouczajaca: 'Lubisz książki, z których można się czegoś nauczyć.',
    relaks: 'Czytanie to dla ciebie relaks i odpoczynek.', inspiruje: 'Szukasz w książkach inspiracji.',
    trudna: 'Nie boisz się wymagających książek.', romantyczna: 'Lubisz romantyczne historie.'
  },
  dlugosc: { krotkie: 'Wolisz krótsze książki, do trzystu stron.', srednie: 'Czytasz książki średniej długości.', grube: 'Lubisz grube tomiska. Szacunek!' },
  pora: { rano: 'Najwięcej czytasz rano. Ranny ptaszek!', popoludnie: 'Najwięcej czytasz po południu.', wieczor: 'Najwięcej czytasz wieczorem.', noc: 'Najwięcej czytasz w nocy. Prawdziwa z ciebie sowa!' },
  trend: { wiecej: 'W tym tygodniu czytasz więcej niż w poprzednim. Brawo!', mniej: 'W tym tygodniu czytasz mniej niż w poprzednim. Może krótka sesja dziś?', rowno: 'Czytasz równo, tydzień w tydzień. Tak trzymaj.' },
  cel: { przed: 'Jesteś przed planem rocznym. Hu-hu, pięknie!', rowno: 'Idziesz równo z planem rocznym.', za: 'Jesteś trochę za planem rocznym, ale spokojnie, da się to nadrobić.' },
  porzucenie: {
    nudna: 'Porzucasz książki najczęściej z nudów. Wybieraj te, które szybko wciągają.', styl: 'Porzucasz książki, gdy styl ci nie pasuje. Czytaj fragment przed zakupem.',
    trudna: 'Porzucasz zbyt trudne książki. Przeplataj je lżejszymi.', nieTeraz: 'Porzucasz książki, bo to nie ich czas. Wrócisz do nich.',
    rozczarowanie: 'Często się rozczarowujesz. Sprawdzaj opinie, zanim zaczniesz.', inne: 'Czasem porzucasz książki. To normalne, życie jest za krótkie na złe książki.'
  },
  roznorodnosc: { malo: 'Trzymasz się kilku gatunków. Może spróbujesz czegoś nowego?', duzo: 'Czytasz bardzo różnorodnie. Ciekawość świata!' },
  rada: {
    fantasy: 'Moja rada: skoro lubisz fantasy, spróbuj kiedyś science fiction albo powieści przygodowej.', scifi: 'Moja rada: skoro lubisz science fiction, sięgnij po książkę popularnonaukową o kosmosie.',
    kryminal: 'Moja rada: skoro lubisz kryminały, spróbuj reportażu kryminalnego. Prawda bywa ciekawsza.', thriller: 'Moja rada: skoro lubisz thrillery, spróbuj klasycznego kryminału.',
    horror: 'Moja rada: skoro lubisz horrory, spróbuj mrocznej fantasy.', romans: 'Moja rada: skoro lubisz romanse, spróbuj powieści historycznej z wątkiem miłosnym.',
    humor: 'Moja rada: skoro lubisz humor, spróbuj satyrycznej fantastyki.', obyczaj: 'Moja rada: skoro lubisz obyczajówki, spróbuj dobrego reportażu.',
    historia: 'Moja rada: skoro lubisz historię, spróbuj biografii.', przygoda: 'Moja rada: skoro lubisz przygody, spróbuj literatury podróżniczej.',
    reportaz: 'Moja rada: skoro lubisz reportaże, spróbuj powieści opartej na faktach.', biografia: 'Moja rada: skoro lubisz biografie, spróbuj powieści historycznej.',
    nauka: 'Moja rada: skoro lubisz naukę, spróbuj ambitnej science fiction.', poradnik: 'Moja rada: między poradnikami przeczytaj coś dla przyjemności.',
    mlodziez: 'Moja rada: spróbuj fantasy dla dorosłych. Spodoba ci się.', dzieci: 'Moja rada: książki dla dzieci są super, a może teraz klasyka przygodowa?',
    poezja: 'Moja rada: skoro lubisz poezję, spróbuj prozy poetyckiej.', klasyka: 'Moja rada: skoro lubisz klasykę, sprawdź współczesnych noblistów.',
    techniczna: 'Moja rada: po książce technicznej daj głowie odpocząć przy dobrej powieści.'
  },
  koniec: ['Tyle ode mnie. Hu-hu!', 'To wszystko. Jestem z ciebie dumna.'],
  zakl: ['Ja bym dodała: mniej telefonu, więcej czytania. Sorry, taka prawda.', 'Analiza, analiza. Ja tam wiem jedno: lubisz mnie przekładać.', 'Mądrala z tej Sówki. Ale ma rację.']
};

function analizaKwestie() {
  const przecz = Z.ksiazki.filter(k => k.status === 'przeczytana'), zacz = Z.ksiazki.filter(k => ['przeczytana', 'czytam', 'porzucona'].includes(k.status));
  const m = mapaDni();
  const k = [{ kto: 's', tekst: losuj(ANALIZA.wstep) }];
  if (zacz.length < 2 && m.size < 3) { k.push({ kto: 's', tekst: ANALIZA.zaMalo }); return k; }
  const licz = (lista, f) => { const o = {}; for (const x of lista) for (const v of f(x)) o[v] = (o[v] || 0) + 1; return Object.entries(o).sort((a, b) => b[1] - a[1]); };
  const gat = licz(zacz.filter(x => x.status !== 'porzucona'), kategorieKsiazki);
  if (gat.length && ANALIZA.gatunek[gat[0][0]]) k.push({ kto: 's', tekst: ANALIZA.gatunek[gat[0][0]] });
  const nas = licz(przecz, x => x.nastroje || []);
  if (nas.length) k.push({ kto: 's', tekst: ANALIZA.nastroj[nas[0][0]] });
  if (przecz.length >= 2) {
    const sr = przecz.reduce((a, x) => a + x.strony, 0) / przecz.length;
    k.push({ kto: 's', tekst: ANALIZA.dlugosc[sr < 300 ? 'krotkie' : sr > 450 ? 'grube' : 'srednie'] });
  }
  const sesje = Z.ksiazki.flatMap(x => x.sesje).filter(s => s.godz != null);
  if (sesje.length >= 3) {
    const p = { rano: 0, popoludnie: 0, wieczor: 0, noc: 0 };
    for (const s of sesje) { const h = s.godz; p[h >= 5 && h < 12 ? 'rano' : h >= 12 && h < 17 ? 'popoludnie' : h >= 17 && h < 22 ? 'wieczor' : 'noc'] += s.minuty; }
    k.push({ kto: 's', tekst: ANALIZA.pora[Object.entries(p).sort((a, b) => b[1] - a[1])[0][0]] });
  }
  const dzis = dzisISO(), pon = dodajDni(dzis, -dzienTygodnia(dzis));
  let ten = 0, pop = 0;
  for (let d = pon; d <= dzis; d = dodajDni(d, 1)) ten += m.get(d) || 0;
  for (let i = 0; i <= dzienTygodnia(dzis); i++) pop += m.get(dodajDni(pon, i - 7)) || 0; // ten sam kawałek poprzedniego tygodnia
  if (ten || pop) k.push({ kto: 's', tekst: ANALIZA.trend[ten > pop * 1.1 ? 'wiecej' : ten < pop * .9 ? 'mniej' : 'rowno'] });
  const c = postepCelu(m);
  if (!c.przedStartem && !c.poKoncu) k.push({ kto: 's', tekst: ANALIZA.cel[c.roznica > 0 ? 'przed' : c.roznica < 0 ? 'za' : 'rowno'] });
  const porz = Z.ksiazki.filter(x => x.status === 'porzucona' && x.powodPorzucenia);
  if (porz.length >= 2) k.push({ kto: 's', tekst: ANALIZA.porzucenie[licz(porz, x => [x.powodPorzucenia])[0][0]] });
  const ostatnie = przecz.slice().sort((a, b) => (b.koniec || '').localeCompare(a.koniec || '')).slice(0, 10);
  if (ostatnie.length >= 5) {
    const rozne = new Set(ostatnie.flatMap(kategorieKsiazki)).size;
    if (rozne <= 2) k.push({ kto: 's', tekst: ANALIZA.roznorodnosc.malo });
    else if (rozne >= 5) k.push({ kto: 's', tekst: ANALIZA.roznorodnosc.duzo });
  }
  if (Math.random() < .6) k.push({ kto: 'z', tekst: losuj(ANALIZA.zakl) });
  if (gat.length && ANALIZA.rada[gat[0][0]]) k.push({ kto: 's', tekst: ANALIZA.rada[gat[0][0]] });
  k.push({ kto: 's', tekst: losuj(ANALIZA.koniec) });
  return k;
}
function analizaSowki() { Glos.odblokuj(); rozmowa(analizaKwestie(), { czasKonca: 5000 }); }

/* =====================================================================
   NOWOŚCI (Lubimyczytać przez pośrednika: najnowsze polskie wydania w twoich gatunkach)
   ===================================================================== */
const LC_KATEGORIE = { fantasy: 41, scifi: 41, kryminal: 53, thriller: 53, horror: 43, romans: 51, humor: 52, obyczaj: 51, historia: 42, przygoda: 49, reportaz: 46, biografia: 40, nauka: 68, poradnik: 69, mlodziez: 94, dzieci: 45, poezja: 48, klasyka: 44, techniczna: 70 };
const OCHOTA_KATEGORIE = { lekkie: [51, 52], mroczne: [53, 43], madre: [68, 46], przygoda: [41, 49] };
const NOWOSCI_TEKSTY = {
  wstep: ['Hu-hu! Znalazłam nowości w twoim klimacie.', 'Zerknij, co nowego wyszło w gatunkach, które lubisz.'],
  polecam: ['Ta wygląda najbardziej obiecująco:', 'Gdybym miała wybrać jedną, wzięłabym tę:'],
  zaczepka: 'Hu-hu! Znalazłam nowe książki w twoim klimacie. Zajrzysz?',
  brakWorkera: 'Żeby szukać nowości, zaktualizuj pośrednika na Cloudflare.',
  zakl: ['Tylko nie kupuj wszystkiego naraz. Ja się nie rozdwoję.', 'Nowa książka to nowa przygoda. Biorę!']
};
function kategorieNowosci() {
  const g = Z.ustawienia.gra, o = {};
  for (const k of Z.ksiazki.filter(x => ['przeczytana', 'czytam', 'doPrzeczytania', 'zyczenia'].includes(x.status))) for (const c of kategorieKsiazki(k)) o[c] = (o[c] || 0) + (k.status === 'przeczytana' ? 2 : 1) + (k.ocena >= 4 ? 2 : 0);
  const ulub = Object.entries(o).sort((a, b) => b[1] - a[1]).map(([c]) => LC_KATEGORIE[c]).filter(Boolean);
  const z = [...(OCHOTA_KATEGORIE[g.odpowiedzi.ochota] || []), ...ulub];
  return [...new Set(z.length ? z : [39, 53])].slice(0, 3);
}
async function pobierzNowosci() {
  const kat = kategorieNowosci();
  const klucz = `zakladka-nowosci-${kat.join(',')}`;
  try { const c = JSON.parse(lsGet(klucz) || 'null'); if (c && Date.now() - c.czas < 6 * 3600 * 1000) return c.lista; } catch { /* nic */ }
  const posr = (Z.ustawienia.posrednik || POSREDNIK_BN || '').trim().replace(/\/+$/, '');
  if (!posr || posr.includes('{url}')) throw new Error('brak pośrednika');
  const r = await fetch(`${posr}?nowosci=${kat.join(',')}`);
  const d = await r.json();
  if (!Array.isArray(d.ksiazki)) throw new Error('stary pośrednik');
  const bez = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const mam = new Set(Z.ksiazki.map(k => bez(k.tytul)));
  const lista = d.ksiazki.filter((x, i, a) => !mam.has(bez(x.tytul)) && a.findIndex(y => y.url === x.url) === i && !/vol\.|deluxe/i.test(x.tytul));
  lsSet(klucz, JSON.stringify({ czas: Date.now(), lista }));
  return lista;
}
/** Książka, którą Sówka poleca najbardziej: dobra średnia przy sensownej liczbie ocen, potem najnowsze. */
const ocenaNowosci = x => (x.ocen >= 15 ? x.ocena : x.ocen >= 3 ? x.ocena - 1 : 5) + Math.min(1.5, Math.log10(1 + x.ocen) / 2);
function arkuszNowosci() {
  Glos.odblokuj();
  let lista = null, blad = '';
  const a = arkusz({
    tytul: 'Nowości od Sówki', klasa: 'arkusz-nowosci',
    render: () => {
      if (blad) return `<div class="pusto-duze"><p>${esc(blad)}</p><p class="cichy">Nowości pobieram z Lubimyczytać przez twojego pośrednika na Cloudflare. Wklej nowy kod z pliku <code>proxy/cloudflare-worker.js</code> (wersja 4) i kliknij Deploy.</p></div>`;
      if (!lista) return '<p class="cichy ladowanie">Sówka przegląda półki z nowościami…</p>';
      if (!lista.length) return '<p class="pusto">Nie ma nic nowego, czego jeszcze nie masz. Zajrzyj za kilka dni.</p>';
      const naj = [...lista].sort((x, y) => ocenaNowosci(y) - ocenaNowosci(x))[0];
      const ochota = Z.ustawienia.gra.odpowiedzi.ochota;
      return `<p class="cichy">Najnowsze polskie wydania w gatunkach, które czytasz${ochota ? ' i na które masz ochotę' : ''}. Źródło: Lubimyczytać.</p>
        <ul class="lista nowosci">${[naj, ...lista.filter(x => x !== naj)].slice(0, 24).map(x => `<li class="${x === naj ? 'polecana' : ''}">
          ${x === naj ? '<p class="nowosc-znak">🦉 Sówka poleca</p>' : ''}
          <div class="wiersz-glowny">${okladka({ tytul: x.tytul, autor: x.autor, okladka: x.okladka }, 's')}
            <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(x.tytul)}</span><span class="wiersz-autor">${esc(x.autor)}</span>
            <span class="wiersz-info">${x.ocen ? `★ ${String(x.ocena).replace('.', ',')} · ${x.ocen} ocen` : 'jeszcze bez ocen'}${x.cykl ? ` · ${esc(x.cykl)}` : ''}</span></span></div>
          <div class="przyciski"><button type="button" class="btn btn-maly" data-nowosc="${esc(x.url)}" data-gdzie="doPrzeczytania">${I.plus}Do przeczytania</button><button type="button" class="btn btn-maly" data-nowosc="${esc(x.url)}" data-gdzie="zyczenia">🎁 Lista życzeń</button><a class="btn-tekst" href="${esc(x.url)}" target="_blank" rel="noopener">Lubimyczytać</a></div></li>`).join('')}</ul>`;
    }
  });
  pobierzNowosci().then(l => {
    lista = l;
    if (a.zamkniety) return;
    a.rysuj();
    if (l.length) {
      const naj = [...l].sort((x, y) => ocenaNowosci(y) - ocenaNowosci(x))[0];
      Glos.mow(losuj(NOWOSCI_TEKSTY.wstep), 's', { wl: Z.ustawienia.gra.glosSowki, naKoniec: () => setTimeout(() => { if (!a.zamkniety) Glos.mow(`${losuj(NOWOSCI_TEKSTY.polecam)}`, 's', { wl: Z.ustawienia.gra.glosSowki, naKoniec: () => !a.zamkniety && Glos.mow(naj.tytul, 's', { wl: Z.ustawienia.gra.glosSowki }) }); }, 300) });
    }
    Z.ustawienia.gra.nowosciWidziane = [...new Set([...Z.ustawienia.gra.nowosciWidziane, ...l.map(x => x.url)])].slice(-300); utrwalUstawienia();
  }).catch(() => { blad = NOWOSCI_TEKSTY.brakWorkera; if (!a.zamkniety) a.rysuj(); });
  a.tresc.addEventListener('click', e => {
    const b = e.target.closest('[data-nowosc]');
    if (!b) return;
    const x = (lista || []).find(y => y.url === b.dataset.nowosc);
    if (!x) return;
    a.zamknij();
    // formularz dodawania z wyszukaniem po tytule i autorze: uzupełni strony, ISBN i okładkę
    arkuszFormularza(null, { jako: b.dataset.gdzie });
    setTimeout(() => { const q = $('#f-q'); if (q) { q.value = `${x.tytul} ${x.autor.split(',')[0]}`.trim(); $('[data-szukaj]')?.click(); } }, 120);
  });
}
/** Raz na kilka dni Sówka sama zagaduje o nowościach (tylko gdy coś nowego naprawdę jest). */
async function zaczepkaNowosci() {
  const ost = +lsGet('zakladka-nowosci-zaczepka') || 0;
  if (Date.now() - ost < 4 * 86400000 || !navigator.onLine || Z.ksiazki.length < 3) return;
  try {
    const l = await pobierzNowosci();
    const nowe = l.filter(x => !Z.ustawienia.gra.nowosciWidziane.includes(x.url));
    if (nowe.length < 3 || U.widok !== 'dzis' || otwarte.length) return;
    lsSet('zakladka-nowosci-zaczepka', String(Date.now()));
    kartaSekwencja([{ kto: 's', tekst: NOWOSCI_TEKSTY.zaczepka, nowy: true }], { klasa: 'skacze', potem: () => dodajOdpowiedzi([['Pokaż!', () => arkuszNowosci()], ['Nie teraz', () => kartaSekwencja([{ kto: 's', tekst: 'Dobrze, przypomnę ci innym razem.', nowy: true }])]]) });
  } catch { /* bez pośrednika: cisza */ }
}

/* =====================================================================
   PYTANIA DO CIEBIE I PAMIĘĆ ODPOWIEDZI
   ===================================================================== */
const PYTANIA = [
  { id: 'samopoczucie', p: 'Hu-hu, jak ci się dziś czyta?', o: [
    ['😍 Świetnie', 'super', [{ kto: 's', tekst: 'Cudownie! To czytamy dalej, ile się da.' }, { kto: 'z', tekst: 'Super. Tylko nie zaginaj mi rogów z radości.' }]],
    ['😐 Tak sobie', 'tak', [{ kto: 's', tekst: 'Rozumiem. Może zmień książkę na lżejszą albo przeczytaj tylko dziesięć stron.' }]],
    ['⏳ Nie mam czasu', 'czas', [{ kto: 's', tekst: 'Wystarczy pięć minut. Jedna strona też się liczy.' }, { kto: 'z', tekst: 'A w kolejce do lekarza to co? Książka, mówię ci.' }]]] },
  { id: 'ochota', p: 'Na co masz teraz ochotę?', o: [
    ['🌸 Coś lekkiego', 'lekkie', [{ kto: 's', tekst: 'Zapamiętam. Coś lekkiego i przyjemnego. Poszukam takich nowości.' }]],
    ['🌑 Coś mrocznego', 'mroczne', [{ kto: 's', tekst: 'Hu-hu, mroczne klimaty. Poszukam kryminałów i grozy.' }, { kto: 'z', tekst: 'Tylko nie czytaj tego w nocy, bo potem ja się boję.' }]],
    ['🧠 Coś mądrego', 'madre', [{ kto: 's', tekst: 'Mądra decyzja! Poszukam reportaży i nauki.' }]],
    ['🐉 Przygodę', 'przygoda', [{ kto: 's', tekst: 'Przygoda! Poszukam fantastyki i powieści przygodowych.' }]]] },
  { id: 'miejsce', p: 'Gdzie najlepiej ci się czyta?', o: [
    ['🛏️ W łóżku', 'lozko', [{ kto: 's', tekst: 'W łóżku najprzyjemniej. Tylko nie zasypiaj na książce.' }, { kto: 'z', tekst: 'Właśnie. Ostatnio obudziłam się pod poduszką.' }]],
    ['🛋️ Na kanapie', 'kanapa', [{ kto: 's', tekst: 'Kanapa, koc i kubek kakao. Klasyka.' }]],
    ['🚌 W drodze', 'droga', [{ kto: 's', tekst: 'Czytanie w drodze to sprytny sposób na nudę.' }]],
    ['🌳 Na dworze', 'dwor', [{ kto: 's', tekst: 'Na świeżym powietrzu! Sowy też lubią drzewa.' }]]] },
  { id: 'format', p: 'Wolisz papier czy ekran?', o: [
    ['📖 Papier', 'papier', [{ kto: 's', tekst: 'Papier pachnie najlepiej. Zgadzam się.' }, { kto: 'z', tekst: 'No ba! Na ekranie nie mam pracy.' }]],
    ['📱 Ekran', 'ekran', [{ kto: 's', tekst: 'Czytnik jest lekki i mieści całą bibliotekę. Mądrze.' }, { kto: 'z', tekst: 'Zdrajca. Ja tu jestem, wiesz?' }]],
    ['🎧 Słuchanie', 'audio', [{ kto: 's', tekst: 'Audiobooki to też czytanie. Uszami!' }]]] },
  { id: 'ulubiona', p: 'Powiedz szczerze: kogo lubisz bardziej, mnie czy Zakładkę?', o: [
    ['🦉 Sówkę', 'sowka', [{ kto: 's', tekst: 'Hu-hu! Wiedziałam!' }, { kto: 'z', tekst: 'Phi. Kupione za listki.' }]],
    ['🔖 Zakładkę', 'zakladka', [{ kto: 'z', tekst: 'Ha! Słyszałaś, pierzasta?' }, { kto: 's', tekst: 'Hmpf. Zapamiętam to sobie.' }]],
    ['💛 Obie', 'obie', [{ kto: 's', tekst: 'Dyplomata z ciebie.' }, { kto: 'z', tekst: 'Dobra odpowiedź. Przeżyjesz.' }]]] },
  { id: 'wieczor', p: 'Czytasz przed snem?', o: [
    ['🌙 Zawsze', 'zawsze', [{ kto: 's', tekst: 'Najlepszy rytuał na dobranoc.' }]],
    ['🌗 Czasem', 'czasem', [{ kto: 's', tekst: 'Spróbuj codziennie, choć kilka stron. Lepiej się śpi.' }]],
    ['📵 Nigdy', 'nigdy', [{ kto: 's', tekst: 'Zamiast telefonu przed snem weź książkę. Zobaczysz różnicę.' }]]] },
  { id: 'tempo', p: 'Jak czytasz: powoli i dokładnie, czy szybko i łapczywie?', o: [
    ['🐢 Powoli', 'powoli', [{ kto: 's', tekst: 'Smakujesz każde zdanie. Piękny sposób czytania.' }]],
    ['🐇 Szybko', 'szybko', [{ kto: 's', tekst: 'Pożeracz książek! Hu-hu!' }, { kto: 'z', tekst: 'Ledwo nadążam z przeskakiwaniem.' }]]] },
  { id: 'cel', p: 'Co jest dla ciebie najważniejsze w czytaniu?', o: [
    ['😌 Odpoczynek', 'odpoczynek', [{ kto: 's', tekst: 'Czytanie to najlepszy odpoczynek dla głowy.' }]],
    ['📚 Wiedza', 'wiedza', [{ kto: 's', tekst: 'Wiedza to supermoc. Mądra sowa to potwierdza.' }]],
    ['✨ Przygody', 'przygody', [{ kto: 's', tekst: 'Każda książka to bilet do innego świata.' }]],
    ['🏆 Wyzwanie', 'wyzwanie', [{ kto: 's', tekst: 'Lubisz wyzwania? To pilnuj celu rocznego!' }]]] }
];
const PAMIEC_SOWKI = {
  miejsce: { lozko: 'Pamiętam, że najlepiej czyta ci się w łóżku. Może dziś też?', kanapa: 'Pamiętam, że lubisz czytać na kanapie. Koc gotowy?', droga: 'Pamiętam, że czytasz w drodze. Książka spakowana?', dwor: 'Pamiętam, że lubisz czytać na dworze.' },
  ochota: { lekkie: 'Pamiętam, że masz ochotę na coś lekkiego.', mroczne: 'Pamiętam, że masz ochotę na coś mrocznego.', madre: 'Pamiętam, że masz ochotę na coś mądrego.', przygoda: 'Pamiętam, że masz ochotę na przygodę.' },
  wieczor: { zawsze: 'Pamiętam, że czytasz przed snem. Jaki rozdział dziś?', nigdy: 'Wiem, że nie czytasz przed snem. Może dziś spróbujesz?' },
  samopoczucie: { czas: 'Ostatnio mówiłeś, że nie masz czasu. Pięć minut się znajdzie?' }
};
const ZGADYWANKA = { p: 'Zgadniesz, ile stron przeczytałeś w tym miesiącu?', dobrze: 'Brawo, zgadza się!', zle: 'Pudło! Ale blisko. Zajrzyj do statystyk.' };

/** Przyciski odpowiedzi pod dymkiem Sówki w karcie. */
function dodajOdpowiedzi(opcje) {
  const t = $('#widok [data-sowka-tekst]');
  if (!t) return;
  t.querySelector('.sowka-odp')?.remove();
  const box = document.createElement('div');
  box.className = 'sowka-odp';
  box.innerHTML = opcje.map(([l], i) => `<button type="button" class="chip-m" data-odp="${i}">${esc(l)}</button>`).join('');
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-odp]');
    if (!b) return;
    box.remove();
    if (navigator.vibrate) navigator.vibrate(10);
    opcje[+b.dataset.odp][1]();
  });
  t.append(box);
}
function zadajPytanie({ bezZgadywanki = false } = {}) {
  const g = Z.ustawienia.gra;
  // najpierw pytania, na które jeszcze nie ma odpowiedzi; samopoczucie i ochota mogą wracać
  const nowe = PYTANIA.filter(p => !g.odpowiedzi[p.id]);
  const powtarzalne = PYTANIA.filter(p => ['samopoczucie', 'ochota'].includes(p.id));
  if (!bezZgadywanki && Math.random() < .25) return zgadywanka();
  const p = losuj(nowe.length ? nowe : powtarzalne);
  kartaSekwencja([{ kto: 's', tekst: p.p, nowy: true }], { klasa: 'mysli', potem: () => dodajOdpowiedzi(p.o.map(([l, v, rep]) => [l, () => {
    g.odpowiedzi[p.id] = v; utrwalUstawienia();
    kartaSekwencja(rep.map((r, i) => ({ ...r, nowy: i === 0 })), { klasa: 'skacze', potem: p.id === 'ochota' ? () => dodajOdpowiedzi([['🆕 Pokaż nowości', () => arkuszNowosci()]]) : null });
  }])) });
}
function zgadywanka() {
  const m = mapaDni(), mies = dzisISO().slice(0, 7);
  let ile = 0;
  for (const [d, v] of m) if (d.startsWith(mies)) ile += v;
  if (ile < 20) { zadajPytanie({ bezZgadywanki: true }); return; }
  const zaokr = x => Math.max(5, Math.round(x / 5) * 5);
  const opcje = [ile, zaokr(ile * (1.3 + Math.random() * .3)), zaokr(ile * (.55 + Math.random() * .15))].filter((v, i, a) => a.indexOf(v) === i);
  opcje.sort(() => Math.random() - .5);
  kartaSekwencja([{ kto: 's', tekst: ZGADYWANKA.p, nowy: true }], { potem: () => dodajOdpowiedzi(opcje.map(v => [`${v} stron`, () => {
    kartaSekwencja([{ kto: 's', tekst: v === ile ? ZGADYWANKA.dobrze : ZGADYWANKA.zle, nowy: true }], { klasa: v === ile ? 'skacze' : '' });
    if (v === ile) { konfetti({ ile: 40 }); Fx.graj('dzwonek'); }
  }])) });
}
/** Zdanie z pamięci Sówki (czasem zamiast zwykłego komentarza). */
function wspomnienieSowki() {
  const g = Z.ustawienia.gra, h = new Date().getHours(), mozliwe = [];
  for (const [id, mapa] of Object.entries(PAMIEC_SOWKI)) {
    const t = mapa[g.odpowiedzi[id]];
    if (!t) continue;
    if (id === 'wieczor' && h < 18) continue;
    mozliwe.push(t);
  }
  return mozliwe.length ? losuj(mozliwe) : null;
}

/* =====================================================================
   GARDEROBA SÓWKI I ZAKŁADKI
   ===================================================================== */
const GARDEROBA_TEKSTY = {
  s: ['Hu-hu, pasuje mi!', 'Wyglądam bosko.', 'Elegancka sowa to szczęśliwa sowa.', 'Muszę się pokazać innym sowom.'],
  z: ['No, teraz to jestem zakładka premium.', 'Ale ze mnie gwiazda!', 'Nareszcie ktoś docenił mój styl.', 'Wyglądam lepiej niż okładka.'],
  zdejmij: { s: 'Naturalny wygląd też jest piękny.', z: 'Klasyczna czerwień. Ponadczasowa.' },
  brak: 'Brakuje listków. Poczytaj trochę albo zagraj w grę!',
  losowa: ['Ciekawa stylizacja!', 'Odważnie! Podoba mi się.']
};
function arkuszGarderoby(start = 's') {
  Glos.odblokuj();
  let kto = start, slot = 'wszystko';
  const g = Z.ustawienia.gra;
  const powiedz = (tekst, k = kto) => {
    const d = $('.gar-dymek', a.tresc);
    if (d) { d.textContent = tekst; d.hidden = false; d.classList.remove('nowy'); void d.offsetWidth; d.classList.add('nowy'); }
    const post = $('.gar-postac', a.tresc);
    post?.classList.add('mowi');
    Glos.mow(tekst, k, { wl: g.glosSowki, naKoniec: () => post?.classList.remove('mowi') });
  };
  const a = arkusz({
    tytul: 'Garderoba', klasa: 'arkusz-garderoba',
    render: () => {
      const l = listkiStan(), rzeczy = SKLEP.filter(x => x.postac === kto && (slot === 'wszystko' || x.slot === slot));
      const zal = kto === 'z' ? g.zalozoneZ : g.zalozone;
      const sloty = [...new Set(SKLEP.filter(x => x.postac === kto).map(x => x.slot))];
      return `<div class="gar-przelacznik" role="tablist">${[['s', '🦉 Sówka'], ['z', '🔖 Zakładka']].map(([k, n]) => `<button type="button" role="tab" class="${kto === k ? 'akt' : ''}" aria-selected="${kto === k}" data-gar-kto="${k}">${n}</button>`).join('')}</div>
        <div class="gar-scena"><div class="gar-postac gar-${kto}">${kto === 'z' ? svgZakladki('macha', zal) : svgSowki('zadowolona', zal)}</div><p class="gar-dymek" hidden></p>
          <p class="gar-saldo">🍃 <strong>${l.saldo}</strong></p></div>
        <div class="przyciski gar-akcje"><button type="button" class="btn btn-maly" data-gar-losuj>🎲 Losowa stylizacja</button><button type="button" class="btn-tekst" data-gar-zdejmij>Zdejmij wszystko</button></div>
        <div class="gar-sloty">${['wszystko', ...sloty].map(s => `<button type="button" class="chip-m${slot === s ? ' akt' : ''}" data-gar-slot="${s}">${s === 'wszystko' ? 'Wszystko' : SLOTY_GARDEROBY[s]}</button>`).join('')}</div>
        <ul class="gar-lista">${rzeczy.map(x => {
          const ma = g.kupione.includes(x.id), on = zal.includes(x.id);
          return `<li class="${on ? 'zal' : ma ? 'ma' : ''}"><button type="button" class="gar-rzecz" data-gar="${x.id}">
            <span class="gar-e">${x.kolor ? `<span class="gar-kolor" style="background:${x.kolor[0]}"></span>` : x.emoji}</span>
            <span class="gar-n">${esc(x.nazwa)}</span>
            <span class="gar-c">${on ? '✓ założone' : ma ? 'załóż' : `${x.cena} 🍃`}</span></button></li>`;
        }).join('')}</ul>
        <p class="cichy maly">Listki zbierasz za czytanie, zadania dnia, bingo i gry z Sówką. W każdym miejscu (głowa, oczy, szyja…) jedna rzecz naraz.</p>`;
    }
  });
  a.tresc.addEventListener('click', e => {
    const k = e.target.closest('[data-gar-kto]');
    if (k) { kto = k.dataset.garKto; slot = 'wszystko'; a.rysuj(); powiedz(kto === 'z' ? 'Moja kolej! Ubierz mnie ładnie.' : 'Hu-hu, co dziś założymy?'); return; }
    const s = e.target.closest('[data-gar-slot]');
    if (s) { slot = s.dataset.garSlot; a.rysuj(); return; }
    if (e.target.closest('[data-gar-zdejmij]')) {
      if (kto === 'z') g.zalozoneZ = []; else g.zalozone = [];
      utrwalUstawienia(); a.rysuj(); odswiez(); powiedz(GARDEROBA_TEKSTY.zdejmij[kto]); return;
    }
    if (e.target.closest('[data-gar-losuj]')) {
      const mam = SKLEP.filter(x => x.postac === kto && g.kupione.includes(x.id));
      if (mam.length < 2) { toast('Kup najpierw kilka rzeczy, żeby było z czego losować.'); return; }
      const nowe = [];
      for (const sl of new Set(mam.map(x => x.slot))) { if (Math.random() < .7) nowe.push(losuj(mam.filter(x => x.slot === sl)).id); }
      if (kto === 'z') g.zalozoneZ = nowe; else g.zalozone = nowe;
      utrwalUstawienia(); a.rysuj(); odswiez(); powiedz(losuj(GARDEROBA_TEKSTY.losowa)); return;
    }
    const r = e.target.closest('[data-gar]');
    if (!r) return;
    const x = SKLEP.find(y => y.id === r.dataset.gar);
    if (!g.kupione.includes(x.id)) {
      if (listkiStan().saldo < x.cena) { powiedz(GARDEROBA_TEKSTY.brak, 's'); return; }
      const w = kup(x.id);
      if (w.blad) { toast(w.blad, { typ: 'blad' }); return; }
      utrwalUstawienia(); konfetti({ ile: 50 }); Fx.graj('dzwonek');
      a.rysuj(); odswiez(); powiedz(losuj(GARDEROBA_TEKSTY[kto]));
      return;
    }
    const on = zaloz(x.id);
    utrwalUstawienia(); a.rysuj(); odswiez();
    if (on) powiedz(losuj(GARDEROBA_TEKSTY[kto]));
  });
}

/* =====================================================================
   GRY: Quiz Sówki i Nocny lot. Listki z gier: najwyżej 50 dziennie.
   ===================================================================== */
const LIMIT_LISTKOW_GIER = 50;
function nagrodzGra(ile) {
  const g = Z.ustawienia.gra, d = dzisISO();
  if (g.graDzien.data !== d) g.graDzien = { data: d, ile: 0 };
  const dodaj = Math.max(0, Math.min(ile, LIMIT_LISTKOW_GIER - g.graDzien.ile));
  g.graDzien.ile += dodaj; g.graListki += dodaj;
  utrwalUstawienia();
  return dodaj;
}
const zostaloListkowGier = () => { const g = Z.ustawienia.gra; return LIMIT_LISTKOW_GIER - (g.graDzien.data === dzisISO() ? g.graDzien.ile : 0); };

function arkuszGier() {
  Glos.odblokuj();
  const g = Z.ustawienia.gra;
  const a = arkusz({
    tytul: 'Gry z Sówką', klasa: 'arkusz-maly arkusz-gry',
    render: () => `<p class="cichy">Za gry dostajesz listki do garderoby: dziś możesz zdobyć jeszcze <strong>${zostaloListkowGier()}</strong> 🍃.</p>
      <div class="gry-lista">
        <button type="button" class="gra-karta gra-lot-k" data-gra="lot"><span class="gra-ikona">${svgSowki('zadowolona', g.zalozone)}</span><span><strong>Nocny lot</strong><small>Leć między regałami, zbieraj listki i litery. Uważaj na kleksy i Wielką Gumkę!</small><small class="gra-rek">Rekord: ${g.graRekord.lot}</small></span></button>
        <button type="button" class="gra-karta gra-quiz-k" data-gra="quiz"><span class="gra-ikona">🎓</span><span><strong>Quiz Sówki</strong><small>Dziesięć pytań o książkach i pisarzach. Zakładka raz podpowie.</small><small class="gra-rek">Rekord: ${g.graRekord.quiz} / 10</small></span></button>
        <button type="button" class="gra-karta" data-gra="garderoba"><span class="gra-ikona">👗</span><span><strong>Garderoba</strong><small>Wydaj listki na stroje dla Sówki i Zakładki.</small></span></button>
      </div>`
  });
  a.tresc.addEventListener('click', e => {
    const b = e.target.closest('[data-gra]');
    if (!b) return;
    a.zamknij();
    setTimeout(() => ({ lot: grajLot, quiz: grajQuiz, garderoba: () => arkuszGarderoby() })[b.dataset.gra](), 250);
  });
}

/* ---------------- Quiz Sówki ---------------- */
const QUIZ = [
  ['Kto napisał „Pana Tadeusza”?', ['Adam Mickiewicz', 'Juliusz Słowacki', 'Henryk Sienkiewicz'], '„Pana Tadeusza” napisał Adam Mickiewicz.'],
  ['Jak ma na imię wiedźmin z sagi Andrzeja Sapkowskiego?', ['Geralt', 'Jaskier', 'Vesemir'], 'Wiedźmin to Geralt z Rivii.'],
  ['Który polski pisarz dostał Nagrodę Nobla w tysiąc dziewięćset piątym roku?', ['Henryk Sienkiewicz', 'Bolesław Prus', 'Władysław Reymont'], 'To był Henryk Sienkiewicz.'],
  ['Kto napisał „Lalkę”?', ['Bolesław Prus', 'Eliza Orzeszkowa', 'Stefan Żeromski'], '„Lalkę” napisał Bolesław Prus.'],
  ['Ile tomów ma główna seria o Harrym Potterze?', ['Siedem', 'Pięć', 'Dziewięć'], 'Główna seria o Harrym Potterze ma siedem tomów.'],
  ['Kto niesie Pierścień we „Władcy Pierścieni”?', ['Frodo', 'Bilbo', 'Gandalf'], 'Pierścień niesie hobbit Frodo.'],
  ['Kto napisał powieść „Rok 1984”?', ['George Orwell', 'Aldous Huxley', 'Ray Bradbury'], 'Napisał ją George Orwell.'],
  ['Kto wymyślił Sherlocka Holmesa?', ['Arthur Conan Doyle', 'Agatha Christie', 'Edgar Allan Poe'], 'Sherlocka Holmesa wymyślił Arthur Conan Doyle.'],
  ['Jak nazywa się belgijski detektyw z powieści Agathy Christie?', ['Herkules Poirot', 'Philip Marlowe', 'Sherlock Holmes'], 'To Herkules Poirot, ten z wąsami.'],
  ['Kto napisał „Solaris”?', ['Stanisław Lem', 'Janusz Zajdel', 'Andrzej Sapkowski'], '„Solaris” napisał Stanisław Lem.'],
  ['Jak nazywa się chłopiec, który nie chciał dorosnąć?', ['Piotruś Pan', 'Mały Książę', 'Pinokio'], 'To Piotruś Pan.'],
  ['Kto napisał „Małego Księcia”?', ['Antoine de Saint-Exupéry', 'Victor Hugo', 'Juliusz Verne'], '„Małego Księcia” napisał Antoine de Saint-Exupéry.'],
  ['Jak nazywał się wieloryb ścigany przez kapitana Ahaba?', ['Moby Dick', 'Willy', 'Nemo'], 'To był Moby Dick.'],
  ['Ilu muszkieterów jest w tytule powieści Aleksandra Dumasa?', ['Trzech', 'Czterech', 'Pięciu'], 'W tytule jest trzech muszkieterów, choć d’Artagnan to czwarty.'],
  ['Kto napisał „Zbrodnię i karę”?', ['Fiodor Dostojewski', 'Lew Tołstoj', 'Antoni Czechow'], '„Zbrodnię i karę” napisał Fiodor Dostojewski.'],
  ['W jakim mieście dzieje się większość akcji „Mistrza i Małgorzaty”?', ['W Moskwie', 'W Petersburgu', 'W Kijowie'], 'Większość akcji dzieje się w Moskwie.'],
  ['Jak dzieci dostały się do Narnii w „Lwie, czarownicy i starej szafie”?', ['Przez szafę', 'Przez lustro', 'Przez studnię'], 'Weszły przez starą szafę.'],
  ['Kto napisał „Alicję w Krainie Czarów”?', ['Lewis Carroll', 'Charles Dickens', 'Roald Dahl'], 'Napisał ją Lewis Carroll.'],
  ['Jak nazywa się szkoła magii, do której chodzi Harry Potter?', ['Hogwart', 'Durmstrang', 'Beauxbatons'], 'Harry Potter chodzi do Hogwartu.'],
  ['Kto napisał „Ferdydurke”?', ['Witold Gombrowicz', 'Bruno Schulz', 'Sławomir Mrożek'], '„Ferdydurke” napisał Witold Gombrowicz.'],
  ['Kto napisał „Chłopów”?', ['Władysław Reymont', 'Stefan Żeromski', 'Bolesław Prus'], '„Chłopów” napisał Władysław Reymont, dostał za nich Nobla.'],
  ['Kto napisał „Krzyżaków”?', ['Henryk Sienkiewicz', 'Józef Ignacy Kraszewski', 'Bolesław Prus'], '„Krzyżaków” napisał Henryk Sienkiewicz.'],
  ['Po którym kocie zostaje tylko uśmiech?', ['Po kocie z Cheshire', 'Po kocie w butach', 'Po Behemocie'], 'To kot z Cheshire z „Alicji w Krainie Czarów”.'],
  ['Kto napisał „Dumę i uprzedzenie”?', ['Jane Austen', 'Charlotte Brontë', 'Virginia Woolf'], 'Napisała ją Jane Austen.'],
  ['Jak nazywa się smok z „Hobbita”?', ['Smaug', 'Drogon', 'Smok Wawelski'], 'Smok z „Hobbita” to Smaug.'],
  ['Kto napisał „Sto lat samotności”?', ['Gabriel García Márquez', 'Jorge Luis Borges', 'Mario Vargas Llosa'], 'Napisał ją Gabriel García Márquez.'],
  ['Jak ma na imię osiołek, przyjaciel Kubusia Puchatka?', ['Kłapouchy', 'Prosiaczek', 'Tygrysek'], 'Osiołek to Kłapouchy.'],
  ['Kto napisał „Dziady”?', ['Adam Mickiewicz', 'Juliusz Słowacki', 'Cyprian Kamil Norwid'], '„Dziady” napisał Adam Mickiewicz.'],
  ['Co oznacza numer ISBN na książce?', ['Numer wydania książki', 'Nazwę drukarni', 'Liczbę stron'], 'ISBN to międzynarodowy numer, który ma każde wydanie książki.'],
  ['Jak nazywa się przyjaciel Robinsona Crusoe z wyspy?', ['Piętaszek', 'Niedziela', 'Wtorek'], 'To Piętaszek.'],
  ['Kto napisał „Kod Leonarda da Vinci”?', ['Dan Brown', 'John Grisham', 'Stephen King'], 'Napisał go Dan Brown.'],
  ['W jakim fikcyjnym miasteczku dzieje się „To” Stephena Kinga?', ['W Derry', 'W Springfield', 'W Twin Peaks'], '„To” dzieje się w Derry.'],
  ['Kto napisał cykl „Pieśń lodu i ognia”?', ['George R. R. Martin', 'J. R. R. Tolkien', 'Terry Pratchett'], 'Napisał go George R. R. Martin.'],
  ['Jak nazywa się świat z powieści Terry’ego Pratchetta?', ['Świat Dysku', 'Śródziemie', 'Ziemiomorze'], 'To Świat Dysku, który leży na grzbietach słoni.'],
  ['Która książka jest najczęściej tłumaczona na świecie?', ['Biblia', 'Mały Książę', 'Pinokio'], 'Najczęściej tłumaczona jest Biblia.'],
  ['Kto napisał „Przeminęło z wiatrem”?', ['Margaret Mitchell', 'Harper Lee', 'Toni Morrison'], 'Napisała je Margaret Mitchell.'],
  ['Kto napisał „Zabić drozda”?', ['Harper Lee', 'Truman Capote', 'John Steinbeck'], 'Napisała ją Harper Lee.'],
  ['Z jakiego kraju pochodzi Pippi Pończoszanka?', ['Ze Szwecji', 'Z Norwegii', 'Z Danii'], 'Pippi jest ze Szwecji, wymyśliła ją Astrid Lindgren.'],
  ['Kto napisał „Quo vadis”?', ['Henryk Sienkiewicz', 'Zygmunt Krasiński', 'Juliusz Słowacki'], '„Quo vadis” napisał Henryk Sienkiewicz.'],
  ['Jak nazywa się kapitan łodzi podwodnej Nautilus?', ['Kapitan Nemo', 'Kapitan Hak', 'Kapitan Ahab'], 'To kapitan Nemo z powieści Juliusza Verne’a.'],
  ['Która polska pisarka dostała literackiego Nobla za rok dwa tysiące osiemnasty?', ['Olga Tokarczuk', 'Wisława Szymborska', 'Eliza Orzeszkowa'], 'To Olga Tokarczuk.'],
  ['Kto z tych poetów dostał Nagrodę Nobla?', ['Wisława Szymborska', 'Julian Tuwim', 'Jan Brzechwa'], 'Nobla dostała Wisława Szymborska.']
];
const QUIZ_TEKSTY = {
  start: 'Hu-hu! Dziesięć pytań. Zobaczmy, ile wiesz o książkach.',
  dobrze: ['Brawo!', 'Dokładnie tak!', 'Hu-hu, mądra głowa!', 'Świetnie!', 'Zgadza się!'],
  zle: ['Pudło!', 'Niestety nie.', 'Ojej, nie tym razem.'],
  podpowiedz: ['Psst! Na pewno nie to.', 'Ja bym tego nie zaznaczała.', 'Podpowiem ci. Ta odpada.'],
  koniec: { super: 'Wow! Jesteś prawdziwym molem książkowym!', dobrze: 'Dobry wynik! Jeszcze trochę czytania i będzie komplet.', slabo: 'Nie szkodzi. Każda książka to nowa wiedza. Spróbuj jeszcze raz!' },
  rekord: 'Nowy rekord w quizie! Hu-hu!'
};
function grajQuiz() {
  Glos.odblokuj();
  const g = Z.ustawienia.gra;
  const pytania = Array.from({ length: 10 }, () => zKolejki('quiz', QUIZ.map((q, i) => i))).map(i => QUIZ[i]);
  let nr = 0, wynik = 0, jokerUzyty = false, odp = null, kolej = [], odrzucone = new Set();
  const mow = (t, k = 's', potem) => { const p = $(`.quiz-${k === 'z' ? 'zakl' : 'sowa'}`, a.tresc); p?.classList.add('mowi'); Glos.mow(t, k, { wl: g.glosSowki, naKoniec: () => { p?.classList.remove('mowi'); potem && potem(); } }); };
  const tasuj = () => { kolej = [0, 1, 2].sort(() => Math.random() - .5); odrzucone = new Set(); odp = null; };
  tasuj();
  const a = arkusz({
    tytul: 'Quiz Sówki', klasa: 'arkusz-quiz',
    render: () => {
      if (nr >= pytania.length) {
        return `<div class="quiz-koniec"><div class="quiz-sowa">${svgSowki('zadowolona', g.zalozone)}</div>
          <p class="quiz-wynik">${wynik} / 10</p><p data-quiz-kom></p><p class="cichy" data-quiz-nagroda></p>
          <div class="przyciski"><button type="button" class="btn btn-glowny" data-quiz-znowu>Jeszcze raz</button><button type="button" class="btn" data-zamknij>Koniec</button></div></div>`;
      }
      const [p, o] = pytania[nr];
      return `<div class="quiz-gora"><span class="quiz-sowa">${svgSowki('czeka', g.zalozone)}</span><span class="quiz-zakl">${svgZakladki(jokerUzyty ? 'stoi' : 'macha')}</span>
        <span class="quiz-licznik">Pytanie ${nr + 1} z 10 · wynik ${wynik}</span></div>
        <p class="quiz-pytanie">${esc(p)}</p>
        <div class="quiz-odp">${kolej.map(i => `<button type="button" class="quiz-o${odp != null ? (i === 0 ? ' dobra' : i === odp ? ' zla' : '') : ''}${odrzucone.has(i) ? ' odrzucona' : ''}" data-quiz-o="${i}"${odp != null || odrzucone.has(i) ? ' disabled' : ''}>${esc(o[i])}</button>`).join('')}</div>
        ${odp != null ? `<p class="quiz-wyjasn">${esc(pytania[nr][2])}</p><div class="przyciski"><button type="button" class="btn btn-glowny" data-quiz-dalej>${nr === 9 ? 'Wynik' : 'Dalej'}</button></div>`
          : `<button type="button" class="btn-tekst" data-quiz-joker${jokerUzyty ? ' disabled' : ''}>🔖 ${jokerUzyty ? 'Zakładka już podpowiadała' : 'Zakładko, podpowiedz!'}</button>`}`;
    }
  });
  const czytaj = () => mow(pytania[nr][0]);
  mow(QUIZ_TEKSTY.start, 's', czytaj);
  a.tresc.addEventListener('click', e => {
    const o = e.target.closest('[data-quiz-o]');
    if (o && odp == null) {
      odp = +o.dataset.quizO;
      const ok = odp === 0;
      if (ok) { wynik++; Fx.graj('dzwonek'); if (navigator.vibrate) navigator.vibrate(15); } else if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
      a.rysuj();
      mow(losuj(ok ? QUIZ_TEKSTY.dobrze : QUIZ_TEKSTY.zle), 's', () => mow(pytania[nr][2]));
      return;
    }
    if (e.target.closest('[data-quiz-joker]') && !jokerUzyty) {
      jokerUzyty = true;
      odrzucone.add(Math.random() < .5 ? 1 : 2);
      a.rysuj(); mow(losuj(QUIZ_TEKSTY.podpowiedz), 'z');
      return;
    }
    if (e.target.closest('[data-quiz-dalej]')) {
      nr++; tasuj(); a.rysuj();
      if (nr < pytania.length) czytaj(); else koniec();
      return;
    }
    if (e.target.closest('[data-quiz-znowu]')) { a.zamknij(); setTimeout(grajQuiz, 250); }
  });
  function koniec() {
    const rekord = wynik > g.graRekord.quiz;
    if (rekord) g.graRekord.quiz = wynik;
    const dostal = nagrodzGra(wynik * 2);
    const kom = wynik >= 8 ? QUIZ_TEKSTY.koniec.super : wynik >= 5 ? QUIZ_TEKSTY.koniec.dobrze : QUIZ_TEKSTY.koniec.slabo;
    $('[data-quiz-kom]', a.tresc).textContent = kom;
    $('[data-quiz-nagroda]', a.tresc).textContent = dostal ? `+${dostal} 🍃 do garderoby${rekord ? ' · nowy rekord!' : ''}` : `Dzisiejszy limit listków z gier już wykorzystany.${rekord ? ' Ale rekord jest!' : ''}`;
    if (wynik >= 8 || rekord) konfetti({ ile: 80 });
    mow(rekord && wynik ? QUIZ_TEKSTY.rekord : kom, 's', rekord && wynik ? () => mow(kom) : null);
    odswiez();
  }
}

/* ---------------- Nocny lot (gra zręcznościowa) ---------------- */
const LOT_SLOWA = ['SOWA', 'KSIĘGA', 'BAJKA', 'SMOK', 'LEKTURA', 'POWIEŚĆ', 'ROZDZIAŁ', 'PRZYGODA', 'ZAKŁADKA', 'KRYMINAŁ', 'WIERSZ', 'MAPA'];
const LOT_TEKSTY = {
  start: ['Hu-hu! Lecimy! Dotknij ekranu, żeby machnąć skrzydłami.', 'Gotowa do lotu! Zbieraj listki i litery.'],
  startZ: 'Zakładka leci! Ja szybuję jak papierowy samolot.',
  slowo: ['Brawo, całe słowo!', 'Hu-hu, słowo zebrane!'],
  rekord: 'Nowy rekord lotu! Hu-hu!',
  koniec: ['Ups! Jeszcze raz?', 'Ała, regał! Spróbujmy znowu.', 'Prawie! Następnym razem polecimy dalej.'],
  gumka: 'Uciekaj, Wielka Gumka!',
  tarcza: 'Lampka mnie ochroniła!'
};
function grajLot() {
  Glos.odblokuj();
  const g = Z.ustawienia.gra;
  const ov = document.createElement('div');
  ov.className = 'gra-lot';
  ov.innerHTML = `<div class="gl-niebo"><span class="gl-ksiezyc"></span>${Array.from({ length: 26 }, () => `<i style="left:${Math.random() * 100}%;top:${Math.random() * 70}%;animation-delay:${(Math.random() * 3).toFixed(1)}s"></i>`).join('')}</div>
    <div class="gl-swiat"></div>
    <div class="gl-hud"><span class="gl-wynik">0</span><span class="gl-slowo"></span><span class="gl-listki">🍃 0</span><button type="button" class="gl-x" aria-label="Zamknij grę">✕</button></div>
    <div class="gl-panel"></div>`;
  document.body.append(ov);
  document.body.classList.add('gra-otwarta');
  const swiat = $('.gl-swiat', ov), panel = $('.gl-panel', ov);
  let postac = 's', stan = 'menu', raf = 0, ostatni = 0;
  let W = 0, H = 0, gracz, vy = 0, y = 0, x = 0, obiekty = [], czas = 0, dalejSpawn = 0, wynik = 0, listki = 0, slowo = '', litera = 0, slow = 0, wolno = 0, tarcza = false, nastGumka = 0;
  const mow = (t, k = 's') => Glos.mow(t, k, { wl: g.glosSowki });
  const dzwiek = (f1, f2, dl, typ = 'sine', gl = .08) => { const c = Fx.kontekst(); if (!c || c.state !== 'running' || g.dzwieki === false) return; try { Fx.ton(f1, f2, c.currentTime + .01, dl, { typ, gl }); } catch { /* nic */ } };
  const rozmiar = () => { W = ov.clientWidth; H = ov.clientHeight; };
  rozmiar();
  const onResize = () => rozmiar();
  window.addEventListener('resize', onResize);

  function menu() {
    stan = 'menu';
    panel.hidden = false;
    panel.innerHTML = `<h2>Nocny lot</h2><p>Kto leci?</p>
      <div class="gl-wybor"><button type="button" class="${postac === 's' ? 'akt' : ''}" data-gl-postac="s">${svgSowki('zadowolona', g.zalozone)}<span>Sówka<small>mocne skrzydła</small></span></button>
        <button type="button" class="${postac === 'z' ? 'akt' : ''}" data-gl-postac="z">${svgZakladki('lata')}<span>Zakładka<small>lekka, szybuje</small></span></button></div>
      <p class="cichy">Dotknij ekranu (albo spacja), żeby się wznieść. Zbieraj 🍃 i litery słowa. 👓 zwalnia czas, 💡 chroni przed jednym zderzeniem. Rekord: <strong>${g.graRekord.lot}</strong></p>
      <p class="cichy maly">Dziś do zdobycia jeszcze ${zostaloListkowGier()} 🍃.</p>
      <button type="button" class="btn btn-glowny btn-duzy" data-gl-start>Start!</button>`;
  }
  function start() {
    rozmiar();
    swiat.innerHTML = '';
    obiekty = []; czas = 0; dalejSpawn = 1.2; wynik = 0; listki = 0; slow = 0; wolno = 0; tarcza = false; nastGumka = 18;
    x = W * .26; y = H * .42; vy = 0;
    nowySlowo();
    gracz = document.createElement('div');
    gracz.className = `gl-gracz gl-${postac}`;
    gracz.innerHTML = postac === 'z' ? svgZakladki('lata') : svgSowki('zadowolona', g.zalozone);
    swiat.append(gracz);
    panel.hidden = true;
    stan = 'gra';
    hud();
    mow(postac === 'z' ? LOT_TEKSTY.startZ : losuj(LOT_TEKSTY.start), postac);
    ostatni = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(petla);
  }
  function nowySlowo() { slowo = losuj(LOT_SLOWA.filter(w => w !== slowo)); litera = 0; }
  function hud() {
    $('.gl-wynik', ov).textContent = wynik;
    $('.gl-listki', ov).textContent = `🍃 ${listki}`;
    $('.gl-slowo', ov).innerHTML = [...slowo].map((l, i) => `<b class="${i < litera ? 'ma' : ''}">${l}</b>`).join('');
  }
  function dodaj(typ, px, py, w, h, ext = {}) {
    const el = document.createElement('div');
    el.className = `gl-o gl-${typ}`;
    swiat.append(el);
    const o = { typ, x: px, y: py, w, h, el, ...ext };
    if (typ === 'regal') el.innerHTML = '<span></span>';
    if (typ === 'listek') el.textContent = '🍃';
    if (typ === 'litera') el.textContent = ext.l;
    if (typ === 'okulary') el.textContent = '👓';
    if (typ === 'lampka') el.textContent = '💡';
    if (typ === 'kleks') el.innerHTML = '<i></i><i></i>';
    if (typ === 'gumka') el.innerHTML = svgGoscia('gumka');
    el.style.width = `${w}px`; el.style.height = `${h}px`;
    obiekty.push(o);
    return o;
  }
  function spawn() {
    const trud = Math.min(1, czas / 90);
    const luka = H * (.36 - .1 * trud), szer = Math.max(46, W * .13);
    const srodek = H * .18 + luka / 2 + Math.random() * (H * .64 - luka);
    dodaj('regal', W + 10, -10, szer, srodek - luka / 2 + 10, { gora: true, liczony: false });
    dodaj('regal', W + 10, srodek + luka / 2, szer, H - (srodek + luka / 2) + 10, { gora: false });
    const r = Math.random();
    const cx = W + 10 + szer / 2;
    if (r < .38) dodaj('litera', cx - 17, srodek - 17, 34, 34, { l: slowo[litera] });
    else if (r < .82) dodaj('listek', cx - 15, srodek - 15 + (Math.random() - .5) * luka * .4, 30, 30);
    else if (r < .91) dodaj('okulary', cx - 16, srodek - 16, 32, 32);
    else dodaj('lampka', cx - 16, srodek - 16, 32, 32);
    if (czas > 12 && Math.random() < .35 + trud * .3) dodaj('kleks', W + szer * 2.2, H * (.2 + Math.random() * .6), 34, 30, { baza: 0, faza: Math.random() * 6 });
  }
  const zderzenie = (o, r) => { const cx = Math.max(o.x, Math.min(x, o.x + o.w)), cy = Math.max(o.y, Math.min(y, o.y + o.h)); return (x - cx) ** 2 + (y - cy) ** 2 < r * r; };
  function petla(t) {
    if (stan !== 'gra') return;
    const dt = Math.min(.033, (t - ostatni) / 1000);
    ostatni = t;
    czas += dt;
    if (wolno > 0) wolno -= dt;
    const tempo = (165 + Math.min(110, czas * 2.2)) * (wolno > 0 ? .55 : 1);
    const grawitacja = postac === 'z' ? 1250 : 1650;
    vy = Math.min(vy + grawitacja * dt, 640);
    y += vy * dt;
    dalejSpawn -= dt * (wolno > 0 ? .55 : 1);
    if (dalejSpawn <= 0) { spawn(); dalejSpawn = Math.max(1.05, 1.75 - czas / 120); }
    // Wielka Gumka co jakiś czas przejeżdża przez ekran
    if (czas > nastGumka) { nastGumka = czas + 16 + Math.random() * 10; dodaj('gumka', W + 20, Math.max(20, Math.min(H - 90, y - 35)), 70, 70, { gumka: true }); mow(LOT_TEKSTY.gumka, postac); }
    const r = postac === 'z' ? 13 : 16;
    for (const o of obiekty) {
      const v = o.typ === 'gumka' ? tempo * 1.9 : o.typ === 'kleks' ? tempo * 1.15 : tempo;
      o.x -= v * dt;
      if (o.typ === 'kleks') { o.faza += dt * 2.4; o.y += Math.sin(o.faza) * 70 * dt; }
      if (o.typ === 'regal' && o.gora && !o.liczony && o.x + o.w < x) { o.liczony = true; wynik++; dzwiek(660, 880, .06, 'triangle', .04); hud(); }
      if (o.zebrany) continue;
      if (zderzenie(o, r * (o.typ === 'regal' ? .82 : 1.1))) {
        if (o.typ === 'listek') { o.zebrany = true; listki++; dzwiek(880, 1320, .09); hud(); }
        else if (o.typ === 'litera') {
          o.zebrany = true;
          if (o.l === slowo[litera]) {
            litera++; dzwiek(990, 1480, .1, 'triangle');
            if (litera >= slowo.length) { slow++; wynik += 10; listki += 5; mow(losuj(LOT_TEKSTY.slowo)); Fx.graj('dzwonek'); nowySlowo(); }
            hud();
          }
        } else if (o.typ === 'okulary') { o.zebrany = true; wolno = 5; dzwiek(500, 300, .3); }
        else if (o.typ === 'lampka') { o.zebrany = true; tarcza = true; gracz.classList.add('tarcza'); dzwiek(400, 900, .25); }
        else if (tarcza) { tarcza = false; gracz.classList.remove('tarcza'); o.zebrany = true; o.el.classList.add('trafiony'); dzwiek(300, 120, .2, 'square', .05); mow(LOT_TEKSTY.tarcza); if (o.typ === 'regal') { vy = -300; } }
        else { koniec(); return; }
        if (o.zebrany && o.typ !== 'regal' && o.typ !== 'gumka' && o.typ !== 'kleks') o.el.classList.add('zebrany');
      }
    }
    if (y > H - r || y < r * .5) { if (y < r * .5) { y = r * .5; vy = 0; } else if (tarcza) { tarcza = false; gracz.classList.remove('tarcza'); vy = -520; } else { koniec(); return; } }
    obiekty = obiekty.filter(o => { if (o.x + o.w < -40 || (o.zebrany && o.typ !== 'regal' && o.zebranyCzas && czas - o.zebranyCzas > .4)) { o.el.remove(); return false; } if (o.zebrany && !o.zebranyCzas) o.zebranyCzas = czas; return true; });
    for (const o of obiekty) o.el.style.transform = `translate(${o.x.toFixed(1)}px,${o.y.toFixed(1)}px)`;
    gracz.style.transform = `translate(${(x - 30).toFixed(1)}px,${(y - 32).toFixed(1)}px) rotate(${Math.max(-25, Math.min(55, vy / 11)).toFixed(1)}deg)`;
    ov.classList.toggle('wolno', wolno > 0);
    raf = requestAnimationFrame(petla);
  }
  function machnij() {
    if (stan !== 'gra') return;
    vy = postac === 'z' ? -430 : -500;
    gracz.classList.remove('mach'); void gracz.offsetWidth; gracz.classList.add('mach');
    dzwiek(postac === 'z' ? 700 : 420, postac === 'z' ? 900 : 520, .07, 'triangle', .035);
  }
  function koniec() {
    stan = 'koniec';
    cancelAnimationFrame(raf);
    gracz.classList.add('upadek');
    dzwiek(260, 80, .4, 'sawtooth', .06);
    if (navigator.vibrate) navigator.vibrate([40, 50, 40]);
    const rekord = wynik > g.graRekord.lot;
    if (rekord) g.graRekord.lot = wynik;
    const dostal = nagrodzGra(listki);
    odswiez();
    setTimeout(() => {
      panel.hidden = false;
      panel.innerHTML = `<h2>${rekord ? '🏆 Nowy rekord!' : 'Koniec lotu'}</h2>
        <p class="gl-duzy">${wynik}</p><p class="cichy">regały: ${wynik - slow * 10} · słowa: ${slow} · listki: ${listki}</p>
        <p>${dostal ? `+${dostal} 🍃 do garderoby` : listki ? 'Dzisiejszy limit listków z gier już wykorzystany.' : 'Następnym razem zbieraj 🍃!'}</p>
        <p class="cichy">Rekord: ${g.graRekord.lot}</p>
        <div class="przyciski"><button type="button" class="btn btn-glowny" data-gl-start>Jeszcze raz</button><button type="button" class="btn" data-gl-menu>Zmień postać</button><button type="button" class="btn-tekst" data-gl-wyjdz>Wyjdź</button></div>`;
      if (rekord && wynik > 0) { konfetti({ ile: 80 }); mow(LOT_TEKSTY.rekord); } else mow(losuj(LOT_TEKSTY.koniec), postac);
    }, 650);
  }
  function zamknij() {
    stan = 'zamknieta';
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('keydown', klawisz);
    document.removeEventListener('visibilitychange', ukryta);
    ov.remove();
    document.body.classList.remove('gra-otwarta');
  }
  const klawisz = e => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); if (stan === 'gra') machnij(); else if (stan !== 'zamknieta' && !panel.hidden && $('[data-gl-start]', panel)) start(); } if (e.key === 'Escape') zamknij(); };
  const ukryta = () => { if (document.hidden && stan === 'gra') { stan = 'pauza'; cancelAnimationFrame(raf); panel.hidden = false; panel.innerHTML = '<h2>Pauza</h2><div class="przyciski"><button type="button" class="btn btn-glowny" data-gl-wznow>Wznów</button><button type="button" class="btn-tekst" data-gl-wyjdz>Wyjdź</button></div>'; } };
  document.addEventListener('keydown', klawisz);
  document.addEventListener('visibilitychange', ukryta);
  ov.addEventListener('pointerdown', e => {
    if (e.target.closest('.gl-x')) { zamknij(); return; }
    if (stan === 'gra' && !e.target.closest('button')) { e.preventDefault(); machnij(); }
  });
  ov.addEventListener('click', e => {
    const p = e.target.closest('[data-gl-postac]');
    if (p) { postac = p.dataset.glPostac; menu(); Glos.mow(postac === 'z' ? 'Moja kolej! Ubierz mnie ładnie.' : 'Hu-hu, co dziś założymy?', postac, { wl: g.glosSowki }); return; }
    if (e.target.closest('[data-gl-start]')) start();
    if (e.target.closest('[data-gl-menu]')) menu();
    if (e.target.closest('[data-gl-wyjdz]')) zamknij();
    if (e.target.closest('[data-gl-wznow]')) { panel.hidden = true; stan = 'gra'; ostatni = performance.now(); raf = requestAnimationFrame(petla); }
  });
  menu();
}

/* =====================================================================
   Podpięcie do karty Sówki, akcji i startu aplikacji
   ===================================================================== */
function chipySowkiPlus() {
  return `${chipPogody()}<button type="button" class="chip-m" data-sowka-plus="analiza">🧠 Analiza</button><button type="button" class="chip-m" data-sowka-plus="nowosci">🆕 Nowości</button><button type="button" class="chip-m" data-sowka-plus="pytanie">💬 Pogadaj</button><button type="button" class="chip-m" data-sowka-plus="gry">🎮 Gry</button><button type="button" class="chip-m" data-sowka-plus="garderoba">👗 Garderoba</button>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-sowka-plus]');
  if (!b) return;
  Glos.odblokuj();
  const co = b.dataset.sowkaPlus;
  if (co === 'pogoda') { if (Z.ustawienia.gra.miasto && !e.target.closest('.arkusz')) powiedzPogode(); else arkuszPogody(); }
  if (co === 'analiza') analizaSowki();
  if (co === 'nowosci') arkuszNowosci();
  if (co === 'pytanie') zadajPytanie();
  if (co === 'gry') arkuszGier();
  if (co === 'garderoba') arkuszGarderoby();
});
// przytrzymanie chmurki pogody: ustawienia miasta
document.addEventListener('contextmenu', e => { if (e.target.closest('.chip-pogoda')) { e.preventDefault(); arkuszPogody(); } });
Object.assign(AKCJE, { garderoba: () => arkuszGarderoby(), gry: () => arkuszGier(), pogoda: () => arkuszPogody(), nowosci: () => arkuszNowosci() });

/** Co Sówka może powiedzieć sama z siebie (dodatki 2.23): pytanie, wspomnienie, pogoda. */
function gadkaSowkiPlus() {
  const g = Z.ustawienia.gra, r = Math.random();
  if (r < .4) { zadajPytanie(); return true; }
  const w = wspomnienieSowki();
  if (r < .7 && w) { kartaSekwencja([{ kto: 's', tekst: w, nowy: true }]); return true; }
  if (g.miasto && g.pogoda && lsGet('zakladka-pogoda-dzien') !== dzisISO()) { powiedzPogode(); return true; }
  return false;
}
setTimeout(() => {
  const g = Z.ustawienia.gra;
  if (g.miasto) Pogoda.pobierz().then(odswiezChipPogody);
  // rano (do 12) przy pierwszym wejściu na Dziś Sówka mówi, jaka jest pogoda
  setTimeout(() => {
    if (g.miasto && g.pogoda && g.sowka && U.widok === 'dzis' && !otwarte.length && new Date().getHours() < 12 && lsGet('zakladka-pogoda-dzien') !== dzisISO()) powiedzPogode();
  }, 9000);
  setTimeout(zaczepkaNowosci, 40000);
}, 1500);

/** Lista stałych kwestii do nagrania (używana przy przygotowaniu paczki głosów). */
function kwestiePlus() {
  const w = [], s = t => w.push({ kto: 's', tekst: t }), z = t => w.push({ kto: 'z', tekst: t });
  Object.values(POGODA_OPIS).flat().forEach(s); POGODA_NOC.forEach(s); Object.values(POGODA_RADA).flat().forEach(s);
  Object.values(POGODA_TEMP_RADA).forEach(s); Object.values(POGODA_JUTRO).forEach(s); POGODA_ZAKL.forEach(z); s(POGODA_BEZ_MIASTA);
  for (let t = -30; t <= 42; t++) s(`Na dworze ${stopnieTekst(t)}.`);
  ANALIZA.wstep.forEach(s); s(ANALIZA.zaMalo); ['gatunek', 'nastroj', 'dlugosc', 'pora', 'trend', 'cel', 'porzucenie', 'roznorodnosc', 'rada'].forEach(k => Object.values(ANALIZA[k]).forEach(s));
  ANALIZA.koniec.forEach(s); ANALIZA.zakl.forEach(z);
  NOWOSCI_TEKSTY.wstep.forEach(s); NOWOSCI_TEKSTY.polecam.forEach(s); s(NOWOSCI_TEKSTY.zaczepka); s(NOWOSCI_TEKSTY.brakWorkera); NOWOSCI_TEKSTY.zakl.forEach(z); s('Dobrze, przypomnę ci innym razem.');
  for (const p of PYTANIA) { s(p.p); for (const [, , rep] of p.o) rep.forEach(r => w.push({ kto: r.kto, tekst: r.tekst })); }
  Object.values(PAMIEC_SOWKI).forEach(m => Object.values(m).forEach(s)); s(ZGADYWANKA.p); s(ZGADYWANKA.dobrze); s(ZGADYWANKA.zle);
  GARDEROBA_TEKSTY.s.forEach(s); GARDEROBA_TEKSTY.z.forEach(z); s(GARDEROBA_TEKSTY.zdejmij.s); z(GARDEROBA_TEKSTY.zdejmij.z); s(GARDEROBA_TEKSTY.brak);
  GARDEROBA_TEKSTY.losowa.forEach(s); GARDEROBA_TEKSTY.losowa.forEach(z); z('Moja kolej! Ubierz mnie ładnie.'); s('Hu-hu, co dziś założymy?');
  QUIZ.forEach(q => { s(q[0]); s(q[2]); }); s(QUIZ_TEKSTY.start); QUIZ_TEKSTY.dobrze.forEach(s); QUIZ_TEKSTY.zle.forEach(s); QUIZ_TEKSTY.podpowiedz.forEach(z);
  Object.values(QUIZ_TEKSTY.koniec).forEach(s); s(QUIZ_TEKSTY.rekord);
  LOT_TEKSTY.start.forEach(s); z(LOT_TEKSTY.startZ); LOT_TEKSTY.slowo.forEach(s); s(LOT_TEKSTY.rekord); LOT_TEKSTY.koniec.forEach(s); LOT_TEKSTY.koniec.forEach(z);
  s(LOT_TEKSTY.gumka); z(LOT_TEKSTY.gumka); s(LOT_TEKSTY.tarcza);
  s('Książka zapisana. Hu-hu!'); s('Uwaga, tę książkę już masz na półce.');
  const klucze = new Set();
  return w.filter(k => { const kl = `${k.kto}|${normKwestii(k.tekst)}`; if (klucze.has(kl)) return false; klucze.add(kl); return true; });
}
