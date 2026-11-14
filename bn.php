<?php
// Zakładka: pośrednik do katalogu Biblioteki Narodowej (data.bn.org.pl).
// Serwer BN nie pozwala przeglądarce pytać go bezpośrednio (brak CORS), więc aplikacja pyta ten plik.
// Działa na każdym serwerze z PHP (np. Apache). Na GitHub Pages PHP nie działa: wtedy użyj proxy/cloudflare-worker.js.
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=86400');

// ?ceny=fraza → najniższe ceny książek z porównywarki Ceneo (lista życzeń)
if (isset($_GET['ceny']) && trim($_GET['ceny']) !== '') {
  $fraza = mb_substr(trim((string)$_GET['ceny']), 0, 120);
  $ctx = stream_context_create(['http' => ['timeout' => 15, 'header' => "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36\r\nAccept-Language: pl-PL,pl;q=0.9\r\n"]]);
  $html = @file_get_contents('https://www.ceneo.pl/;szukaj-' . str_replace('%20', '+', rawurlencode($fraza)), false, $ctx);
  if ($html === false) { http_response_code(502); echo json_encode(['blad' => 'Ceneo nie odpowiada.']); exit; }
  $wyniki = [];
  preg_match_all('/<div class="\s*cat-prod-row[\s\S]*?>/', $html, $m);
  foreach ($m[0] as $tag) {
    $a = function ($n) use ($tag) { return preg_match('/data-' . $n . '="([^"]*)"/i', $tag, $x) ? $x[1] : ''; };
    $nazwa = html_entity_decode($a('productName'));
    $cena = (float)($a('productminprice') ?: $a('Price'));
    $pid = $a('pid') ?: $a('productid');
    if ($nazwa && $cena > 0 && $pid) $wyniki[] = ['nazwa' => $nazwa, 'cena' => $cena, 'link' => 'https://www.ceneo.pl/' . $pid, 'kategoria' => $a('GACategoryName')];
    if (count($wyniki) >= 15) break;
  }
  header('Cache-Control: public, max-age=21600');
  echo json_encode(['zrodlo' => 'Ceneo', 'fraza' => $fraza, 'wyniki' => $wyniki], JSON_UNESCAPED_UNICODE);
  exit;
}

$dozwolone = ['isbnIssn', 'title', 'author', 'limit'];
$parametry = [];
foreach ($dozwolone as $p) {
  if (isset($_GET[$p]) && $_GET[$p] !== '') $parametry[$p] = mb_substr((string)$_GET[$p], 0, 200);
}
if (!isset($parametry['isbnIssn']) && !isset($parametry['title']) && !isset($parametry['author'])) {
  http_response_code(400);
  echo json_encode(['blad' => 'Podaj isbnIssn, title albo author.']);
  exit;
}
$parametry['limit'] = min(20, max(1, (int)($parametry['limit'] ?? 15)));

$url = 'https://data.bn.org.pl/api/institutions/bibs.json?' . http_build_query($parametry);
$ctx = stream_context_create(['http' => ['timeout' => 12, 'header' => "User-Agent: Zakladka/2.4\r\nAccept: application/json\r\n"]]);
$odp = @file_get_contents($url, false, $ctx);
if ($odp === false) {
  http_response_code(502);
  echo json_encode(['blad' => 'Biblioteka Narodowa nie odpowiada.']);
  exit;
}
echo $odp;
