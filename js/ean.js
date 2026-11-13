/* Zakładka — własny odczyt kodów EAN-13 (ISBN) z obrazu.
   Działa w każdej przeglądarce, także w Safari na iPhonie, bez BarcodeDetector i bez internetu.
   Obraz → linie skanowania (poziome i pionowe) → progowanie → szerokości pasków → cyfry → suma kontrolna. */
const EAN = (() => {
  // szerokości (w modułach) czterech pasków cyfry: zestaw L, G (lustrzany) — R ma te same szerokości co L
  const L = ['3211', '2221', '2122', '1411', '1132', '1231', '1114', '1312', '1213', '3112'].map(s => [...s].map(Number));
  const G = L.map(w => w.slice().reverse());
  // wzór parzystości 6 lewych cyfr (0 = L, 1 = G) → pierwsza cyfra kodu
  const PARZ = { '000000': 0, '001011': 1, '001101': 2, '001110': 3, '010011': 4, '011001': 5, '011100': 6, '010101': 7, '010110': 8, '011010': 9 };

  function cyfra(runy, i, zestawy) {
    const suma = runy[i] + runy[i + 1] + runy[i + 2] + runy[i + 3];
    let naj = null;
    for (const [nazwa, wzory] of zestawy) {
      for (let d = 0; d < 10; d++) {
        const w = wzory[d];
        let blad = 0;
        for (let k = 0; k < 4; k++) blad += Math.abs(runy[i + k] * 7 / suma - w[k]);
        if (!naj || blad < naj.blad) naj = { d, zestaw: nazwa, blad };
      }
    }
    return naj && naj.blad < 1.6 ? naj : null;
  }

  const okolo = (x, m, lo = 0.4, hi = 2.1) => x >= m * lo && x <= m * hi;

  function sumaKontrolnaOk(kod) {
    let s = 0;
    for (let i = 0; i < 12; i++) s += (+kod[i]) * (i % 2 ? 3 : 1);
    return (10 - s % 10) % 10 === +kod[12];
  }

  /** runy: szerokości kolejnych odcinków, pierwszy to kolor `pierwszyCiemny` */
  function zRunow(runy, pierwszyCiemny) {
    const wyniki = [];
    for (let i = pierwszyCiemny ? 0 : 1; i + 59 <= runy.length; i += 2) { // i = pierwszy ciemny pasek strażnika
      const m = (runy[i] + runy[i + 1] + runy[i + 2]) / 3;
      if (!okolo(runy[i], m) || !okolo(runy[i + 1], m) || !okolo(runy[i + 2], m)) continue;
      if (i > 0 && runy[i - 1] < m * 3) continue; // przed kodem musi być jasny margines
      let szer = 0;
      for (let k = i; k < i + 59; k++) szer += runy[k];
      const mod = szer / 95;
      if (!okolo(m, mod, 0.5, 1.8)) continue;
      // środkowy strażnik
      const sr = i + 3 + 24;
      let ok = true;
      for (let k = 0; k < 5; k++) if (!okolo(runy[sr + k], mod, 0.35, 2.2)) { ok = false; break; }
      if (!ok) continue;
      const kon = i + 56;
      for (let k = 0; k < 3; k++) if (!okolo(runy[kon + k], mod, 0.35, 2.2)) { ok = false; break; }
      if (!ok) continue;
      const LG = [['L', L], ['G', G]];
      const lewa = [], prawa = [];
      for (let c = 0; c < 6 && ok; c++) {
        const a = cyfra(runy, i + 3 + c * 4, LG), b = cyfra(runy, sr + 5 + c * 4, LG);
        if (!a || !b) ok = false; else { lewa.push(a); prawa.push(b); }
      }
      if (!ok) continue;
      let kod = null;
      if (prawa.every(r => r.zestaw === 'L')) {
        // kod czytany normalnie (od lewej)
        const parz = lewa.map(r => r.zestaw === 'G' ? '1' : '0').join('');
        if (parz in PARZ) kod = PARZ[parz] + lewa.map(r => r.d).join('') + prawa.map(r => r.d).join('');
      } else if (lewa.every(r => r.zestaw === 'G')) {
        // kod czytany od tyłu (książka do góry nogami): połówki zamienione, cyfry odwrócone
        const orygLewa = prawa.slice().reverse();
        const parz = orygLewa.map(r => r.zestaw === 'L' ? '1' : '0').join('');
        if (parz in PARZ) kod = PARZ[parz] + orygLewa.map(r => r.d).join('') + lewa.slice().reverse().map(r => r.d).join('');
      }
      if (kod && sumaKontrolnaOk(kod)) wyniki.push(kod);
    }
    return wyniki;
  }

  /** Jedna linia jasności (Uint8Array/Array) → kody. Próbuje dwóch sposobów progowania i obu kierunków. */
  function zLinii(linia) {
    const n = linia.length;
    if (n < 95) return [];
    // kopia linii (bez wygładzania: przy małych paskach rozmycie szkodzi bardziej niż szum)
    const g = new Float32Array(n);
    for (let x = 0; x < n; x++) g[x] = linia[x];
    let min = 255, max = 0;
    for (let x = 0; x < n; x++) { if (g[x] < min) min = g[x]; if (g[x] > max) max = g[x]; }
    if (max - min < 30) return [];
    const wyniki = [];
    // 1) próg lokalny (średnia w oknie) — odporny na nierówne światło
    const okno = Math.max(16, n >> 4);
    const calka = new Float64Array(n + 1);
    for (let x = 0; x < n; x++) calka[x + 1] = calka[x] + g[x];
    const progi = [
      x => {
        const a = Math.max(0, x - okno), b = Math.min(n, x + okno);
        const sr = (calka[b] - calka[a]) / (b - a);
        return Math.min(sr, min + (max - min) * 0.72);
      },
      () => (min + max) / 2
    ];
    for (const prog of progi) {
      // szerokości z dokładnością do ułamka piksela: krawędź tam, gdzie jasność przecina próg
      const runy = [];
      let ciemny = g[0] < prog(0), poczatek = 0;
      const pierwszy = ciemny;
      for (let x = 1; x < n; x++) {
        const p = prog(x), c = g[x] < p;
        if (c === ciemny) continue;
        const a = g[x - 1] - p, b = g[x] - p;
        const krawedz = x - 1 + (a === b ? 0.5 : a / (a - b));
        runy.push(krawedz - poczatek);
        poczatek = krawedz;
        ciemny = c;
      }
      runy.push(n - poczatek);
      wyniki.push(...zRunow(runy, pierwszy));
    }
    return wyniki;
  }

  /**
   * Szuka kodów na obrazie w skali szarości.
   * szary: Uint8Array w*h; zwraca mapę kod → liczba linii, w których go znaleziono.
   */
  function zSzarego(szary, w, h, { krokY = 6, krokX = 8, pion = true, pas = 1 } = {}) {
    const glosy = new Map();
    const dodaj = kody => new Set(kody).forEach(k => glosy.set(k, (glosy.get(k) || 0) + 1));
    const y0 = Math.floor(h * (1 - pas) / 2), y1 = h - y0;
    for (let y = y0; y < y1; y += krokY) dodaj(zLinii(szary.subarray(y * w, y * w + w)));
    if (pion) {
      const x0 = Math.floor(w * (1 - pas) / 2), x1 = w - x0;
      const kol = new Uint8Array(h);
      for (let x = x0; x < x1; x += krokX) {
        for (let y = 0; y < h; y++) kol[y] = szary[y * w + x];
        dodaj(zLinii(kol));
      }
    }
    return glosy;
  }

  /** RGBA (ImageData.data) → skala szarości */
  function naSzary(rgba, w, h) {
    const s = new Uint8Array(w * h);
    for (let i = 0, j = 0; i < s.length; i++, j += 4) s[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
    return s;
  }

  /** Najpewniejszy ISBN (978/979…) z mapy głosów albo null */
  function najlepszyIsbn(glosy, minGlosow = 1) {
    let naj = null, ile = 0;
    for (const [k, v] of glosy) if (/^97[89]/.test(k) && v > ile) { naj = k; ile = v; }
    return ile >= minGlosow ? naj : null;
  }

  return { zLinii, zSzarego, naSzary, najlepszyIsbn, sumaKontrolnaOk };
})();

if (typeof module !== 'undefined') module.exports = EAN;
