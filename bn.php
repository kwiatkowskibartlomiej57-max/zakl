<?php
// Zakładka: pośrednik do katalogu Biblioteki Narodowej (data.bn.org.pl).
// Serwer BN nie pozwala przeglądarce pytać go bezpośrednio (brak CORS), więc aplikacja pyta ten plik.
// Działa na każdym serwerze z PHP (np. Apache). Na GitHub Pages PHP nie działa: wtedy użyj proxy/cloudflare-worker.js.
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=86400');

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
