# Zakładka: dziennik czytania

Aplikacja na telefon (PWA) do śledzenia czytania. Działa w przeglądarce, instaluje się na ekranie głównym jak zwykła aplikacja, działa bez internetu, a wszystkie dane trzyma w bazie na urządzeniu.

## Co umie

**Ekran Dziś**
- Pierścień z dzisiejszymi stronami i dziennym celem. Cel wylicza się z celu rocznego albo ustawiasz go ręcznie.
- Seria dni z czytaniem i suma stron z bieżącego tygodnia.
- **Książka bazowa**: jedna długa książka z terminem, np. „Europa” na 2 miesiące. Pasek wygląda jak brzeg kartek: czerwona wstążka pokazuje, gdzie jesteś, a złota kreska, gdzie powinieneś być na koniec dnia. Widzisz też normę na dziś, wynik względem planu („33 strony przed planem”), termin i ile godzin czytania zostało.
- **Czytam też**: poboczne książki z szybkim zapisem postępu i prognozą, kiedy je skończysz.
- **Cel roczny** (domyślnie 200 książek od 1.09.2026): ile książek tygodniowo i stron dziennie potrzebujesz, czy masz zapas, czy brakuje ci do planu, oraz prognoza przy obecnym tempie.
- Następna książka w kolejce i codziennie inny cytat z twoich notatek.

**Zapis postępu**
- Wpisujesz „Jestem na stronie…” albo klikasz +5, +10, +25, +50.
- Możesz zapisać stronę na wczoraj albo na dowolny dzień, jeśli zapomniałeś.
- Pomyłkę poprawiasz, wpisując niższą stronę. Statystyki same się skorygują.

**Sesje czytania**
- Stoper na cały ekran z opcją „Nie wygaszaj ekranu”.
- Po zakończeniu sesji wpisujesz stronę, a aplikacja liczy tempo w stronach na godzinę.
- Gdy sesja trwa w tle, na dole widać pigułkę z czasem.

**Biblioteka**
- Półki: Czytam, Do przeczytania (kolejka, którą układasz strzałkami), Przeczytane (z oceną i wrażeniami), Porzucone.
- Wyszukiwanie, sortowanie i filtrowanie po tagach.
- **Dodawanie z internetu**: szukasz po tytule, autorze albo ISBN (Google Books i Open Library). Tytuł, autor, liczba stron i okładka uzupełnią się same.
- **Skaner kodu kreskowego** (każdy telefon, także iPhone): aparat na żywo odczyta ISBN z tyłu książki. Gdy aparat nie łapie ostrości, zrób zdjęcie kodu i aplikacja odczyta numer ze zdjęcia. Na Androidzie jest też przycisk latarki.
- **Zdjęcie okładki** z aparatu albo galerii. Jeśli książka nie ma okładki, aplikacja tworzy płócienną okładkę z tytułem.
- Ponowne czytanie książki z zachowaną historią.

**Cytaty i notatki**: zapisujesz zdanie albo własną myśl z numerem strony. Możesz je wyszukiwać, kopiować i udostępniać.

**Statystyki**: strony z ostatnich 30 dni, mapa dni czytania z pół roku, książki w kolejnych miesiącach na tle planu, rekordy oraz ranking autorów i tagów.

**Dane**
- Wszystko jest w bazie IndexedDB na telefonie. Przy starcie aplikacja prosi o trwałą pamięć, żeby system nie skasował danych przy braku miejsca.
- Kopię zapasową JSON zapiszesz przez „Udostępnij”, np. na Dysku Google. Co 7 dni pojawi się przypomnienie.
- Import i eksport CSV w formacie Goodreads.
- Jasny i ciemny motyw (albo taki jak w systemie).
- Usunięcie książki czy cytatu możesz cofnąć.

## Wrzucenie na GitHub Pages

1. Załóż repozytorium, np. `zakladka`, i wrzuć do niego **zawartość** tego folderu: `index.html` ma leżeć w głównym katalogu repo.
2. Wejdź w **Settings → Pages → Build and deployment**, wybierz **Deploy from a branch**, potem gałąź `main` i folder `/ (root)`, i kliknij **Save**.
3. Po minucie aplikacja będzie dostępna pod adresem `https://<twój-login>.github.io/zakladka/`.

Możesz też skopiować folder na swój serwer Apache, np. do `/var/www/html/zakladka`. Tryb offline i instalacja na telefonie wymagają **HTTPS** albo `localhost`.

## Instalacja na telefonie

- **Android (Chrome):** otwórz adres, potem menu ⋮ i **Zainstaluj aplikację**. Możesz też użyć przycisku w Ustawieniach aplikacji.
- **iPhone (Safari):** otwórz adres, potem **Udostępnij** i **Do ekranu początkowego**.

Po instalacji przytrzymaj ikonę, żeby dostać skróty „Zapisz postęp” i „Dodaj książkę” (Android).

## Przeniesienie danych z wersji 1 („Półka”)

Jeśli wersja 1 działała pod tym samym adresem, dane wczytają się same, bo baza ma tę samą nazwę. Jeśli adres był inny, w starej wersji zrób kopię JSON, a w Zakładce wybierz **Ustawienia → Wczytaj kopię**. Format jest zgodny.

## Aktualizacja

Po zmianie plików podbij numer w `sw.js` (np. `const WERSJA = 'zakladka-2.4.0'`). Telefon pobierze wtedy nową wersję przy następnym uruchomieniu z internetem.

## Pliki

| Plik | Co robi |
| --- | --- |
| `index.html` | Szkielet strony |
| `css/app.css` | Wygląd, jasny i ciemny motyw |
| `js/db.js` | Baza IndexedDB na urządzeniu |
| `js/core.js` | Model danych, plan książki bazowej, cel roczny, statystyki |
| `js/ean.js` | Własny odczyt kodów kreskowych EAN-13 (ISBN) z obrazu |
| `js/extras.js` | Wyszukiwarka książek, skaner ISBN, okładki, CSV Goodreads |
| `js/ui.js` | Ekrany, okna i obsługa kliknięć |
| `sw.js` | Service worker, czyli tryb offline |
| `bn.php` | Pośrednik do katalogu Biblioteki Narodowej (serwer z PHP) |
| `proxy/cloudflare-worker.js` | To samo jako darmowy Cloudflare Worker (dla GitHub Pages) |
| `manifest.webmanifest` | Dane do instalacji: nazwa, ikony, skróty |
| `icons/` | Logo i ikony aplikacji |

## Wersja 2.20.1: nagrania w jednej paczce

- Wszystkie 382 nagrania głosów są w **jednym pliku** `audio/glosy-<hash>.bin` (ok. 8,7 MB), plus spis `audio/glosy.json` i `audio/cisza.mp3`. Folder `audio` ma więc 3 pliki zamiast kilkuset, co mieści się w limicie 100 plików na jedno wgranie przez stronę GitHuba.
- Przy pierwszym uruchomieniu aplikacja pobiera z paczki tylko kawałek z potrzebną kwestią (zapytanie `Range`), a po kilku sekundach ściąga w tle całą paczkę do pamięci, żeby głosy działały offline. Nazwa paczki zmienia się razem z treścią, więc po aktualizacji telefon pobierze nową, a starą usunie.
- Folder `audio/glos/` z poprzednich wersji nie jest już potrzebny. Jeśli masz go na GitHubie, możesz go usunąć.

## Wersja 2.20: Sówka wraca do domu, sezon 2 przygód, dźwięk na iPhonie

- **Powrót do karty**: gdy wracasz na ekran Dziś albo przewijasz do góry, Sówka przylatuje do swojej karty, po drodze rośnie do jej rozmiaru i siada dokładnie na swoim miejscu. Puste miejsce w karcie czeka na nią, więc nigdy nie ma dwóch sów naraz. Przy wyjściu z ekranu Dziś wylatuje z karty.
- **Dźwięk w rozmowach**: odblokowanie dźwięku przy dotknięciu odtwarza prawdziwą (niewyciszoną) ciszę, więc iOS nie blokuje później rozmów. Przeglądarka dostaje też tryb `audioSession: playback`, dzięki czemu głosy grają przy wyciszonym przełączniku. Service worker obsługuje zapytania o fragment pliku (`Range`, odpowiedź 206), o które Safari prosi przy nagraniach, i trzyma nagrania w pamięci offline.
- **Jak często Sówka gada**: do wyboru rzadko (ok. 8–10 min), normalnie (ok. 3–4 min) albo często (ok. 1 min), tylko gdy korzystasz z aplikacji. Do tego 14 nowych żartów Sówki i 7 nowych żartów Zakładki 18+.
- **Przygody, sezon 2**: 6 nowych rozdziałów po 6 scen (Kot Erratum, Znikające litery, Pustynia bez słów, Zamek Gumki, Wielkie czytanie, Święto biblioteki), odblokowywanych od 3800 do 9500 stron. Doszły nowe postacie z własnymi głosami (Kot Erratum, Wielka Gumka) i nowe tła (pustynia, biały zamek). Każdy z pierwszych 10 rozdziałów ma jedną nową scenę. Razem 382 nagrane kwestie.

## Wersja 2.19: Sówka lata po aplikacji

- **Sówka-towarzyszka** siedzi na aktywnej zakładce dolnego menu i przelatuje po łuku, machając skrzydłami, gdy zmieniasz ekran. Czasem skomentuje miejsce, do którego trafiłeś.
- Oczy śledzą palec albo kursor. Przy przewijaniu patrzy w górę lub w dół, a przy szybkim przewijaniu marudzi.
- Ma drobne zachowania: przechyla głowę, rozgląda się, czyści piórka i podskakuje. Po minucie bez ruchu zasypia, a dotyk ją budzi.
- **Dotyk**: zwykłe dotknięcie to na zmianę przywitanie, ciekawostka, żart albo motywacja. Trzy szybkie dotknięcia to łaskotki, sześć to obraza i odlot. Sówkę można też przenieść palcem.
- Na ekranie Dziś siedzi w swojej karcie. Gdy przewiniesz w dół, wylatuje z karty. Sówka w karcie też mówi po dotknięciu.
- **Ciekawostki same z siebie**: 40 ciekawostek nagranych głosem Sówki, opowiadanych z zaskoczenia, częściej niż wcześniej. Gdy nikt nie korzysta z aplikacji, Sówka nic nie mówi.
- Za zapisane strony Sówka robi fikołka w powietrzu.

## Wersja 2.18: prawdziwe głosy, Zakładka bez cenzury, recenzje Sówki

- **Nagrane głosy postaci** zamiast syntezatora przeglądarki. Polskie głosy neuronowe (Piper) zostały nagrane z osobną barwą dla każdej postaci: Narrator, Sówka, Zakładka, Smok, Przypis i Bibliotekarz Kurz. Od wersji 2.20.1 wszystkie nagrania są sklejone w jedną paczkę `audio/glosy-<hash>.bin`, a `audio/glosy.json` mówi, gdzie w niej leży każda kwestia. Działają bez internetu.
- Teksty, które się zmieniają (liczby stron, tytuły, ciekawostki), postaci **gaworzą** swoją barwą, tak jak w grach.
- **Efekty dźwiękowe** generowane w przeglądarce: hu-hu Sówki, szelest kartek w historii, ba-dum-tss po puencie i dzwonek przy nagrodach.
- **Zakładka bez cenzury (18+)**: rzuca własne, przeklinające żarty, z zaskoczenia albo co trzecie stuknięcie, a Sówka czasem ją ochrzani. Wyłączysz to w Kąciku Sówki, w sekcji Sówka i dźwięk.
- **Recenzja po dodaniu książki**: Sówka kartkuje nową książkę i podaje ciekawostkę z Wikidata (nagrody, rok wydania, miejsce akcji, cykl). Mówi też, czy to dobry wybór względem książek ocenionych na 4–5, i wystawia ocenę w gwiazdkach. Zakładka czasem się z nią kłóci.

## Wersja 2.17: historia jak w grach, Sówka z zaskoczenia

- **Kinowe przerywniki:** rozdziały „Przygód Sówki i Zakładki” odtwarzają się same, na pełnym ekranie.
  - Pasy kinowe wjeżdżają, a plansza tytułowa („Rozdział 3 · Kraina smoków”) pojawia się z głosem narratora.
  - Kamera powoli najeżdża na każdą scenę (efekt Kena Burnsa, 4 kierunki). Kadry przenikają się przez ciemność, a postacie wchodzą z animacją.
  - Za sceną jest rozmyte, przyciemnione tło na cały ekran, także w pionie na telefonie.
  - Pasek postępu u góry. Dotknięcie przyspiesza, a w rogu są pauza, wyciszenie głosu i muzyki oraz zamknięcie.
  - Na końcu jest plansza „Ciąg dalszy” z przyciskiem „Następny rozdział”.
- **Głosy postaci** z syntezy mowy w telefonie (polski głos). Narrator, Sówka, Zakładka, Smok, Przypis i Bibliotekarz Kurz mają różną wysokość i tempo głosu, a gdy telefon ma kilka polskich głosów, także różne głosy. Dialogi są rozpoznawane automatycznie: kto mówi, a co jest narracją. Napisy pojawiają się litera po literze, z kolorowym imieniem mówiącego, a postać, która mówi, „podskakuje”.
- **Muzyka w tle** generowana na żywo (bez plików): spokojne akordy dopasowane do sceny, inne w pokoju, w krainie smoków, w deszczowym kryminale, na morzu i w kosmosie.
- **Sówka z zaskoczenia, bez przycisków:**
  - raz dziennie przywitanie z żartem albo ciekawostką;
  - co jakiś czas sama wyskakuje z dołu ekranu z żartem, a puenta pojawia się po chwili;
  - po zapisaniu stron chwali („Brawo! 15 stron więcej przygód”), czasem z żartem na deser;
  - na karcie na ekranie Dziś sama zmienia teksty co ok. 20 sekund: żart, motywacja, „co czytać”.
  
  Na karcie został tylko przycisk „🎬 Przygody Sówki i Zakładki” (w nocy „Bajka na dobranoc”).
- **Ustawienia** (Zadania i sklepik → Sówka i dźwięk): żarty z zaskoczenia, czytanie żartów na głos (domyślnie wyłączone, żeby nie zaskoczyć w autobusie), głosy i muzyka w historii.

## Wersja 2.16: świat Sówki i Zakładki

- **Zakładka**: nowa animowana postać obok Sówki. Czerwona zakładka z buzią, która się kołysze, mruga i macha ręką. Dotknięta podskakuje i mówi swoje kwestie, np. „Przeleżałam pół roku na stronie 37. To już nie zakładka, to lokatorka”. Wtrąca się też do żartów Sówki.
- **Sówka gada**, czyli przyciski rozmowy na karcie:
  - 😂 **Żart**: 23 żarty o książkach i czytaniu. Najpierw wstęp, a po „No i? 😄” puenta. Sówka się śmieje, a Zakładka komentuje.
  - 💪 **Zmotywuj**: personalnie, np. „Do końca «Lalki» zostało 280 stron, to ok. 10 wieczorów po 30”, tempo czytania, passa, ile stron do kolejnego rozdziału historii. Zawsze łagodnie, bez presji.
  - 📚 **Co czytać?**: następna zaplanowana książka albo coś krótkiego na weekend.
  - 🎬 **Historia** (w nocy: „Bajka na dobranoc”).
- **„Przygody Sówki i Zakładki”**: pokładkowa historia w 10 rozdziałach po 4 klatki (40 animowanych scen). Zakładka wpada do ogromnej księgi, a Sówka szuka jej w krainie smoków, w kryminale, na morzu i w kosmosie, potem obie wracają przez Bibliotekarza Kurza do domu. Rozdziały **odblokowujesz, czytając**: 0, 50, 150, 300, 500, 800, 1200, 1700, 2300 i 3000 przeczytanych stron.
  - Animacje: postacie się kołyszą, pada deszcz, fale falują, gwiazdy migają, a klatki przesuwają się przy przewijaniu. Jest też automatyczne odtwarzanie ▶.
  - Gdy odblokujesz rozdział, pojawia się powiadomienie z konfetti i przyciskiem „Oglądaj”.

## Wersja 2.15: Sówka, listki za czytanie, menu po przytrzymaniu

- **Sówka 🦉** na ekranie Dziś: animowana sowa, która mruga, kołysze się i podskakuje po dotknięciu. Mówi łagodnie, bez presji, zależnie od pory dnia i tego, ile przeczytałeś, np. „Może kilka stron do kawy? Bez pośpiechu”. W nocy śpi (z „Zzz”), po zrobieniu celu czyta własną książeczkę, a po przerwie mówi „tęskniłam, nic się nie stało”. Można ją wyłączyć w sklepiku.
- **Listki 🍃 za czytanie:** 1 za 10 stron, 5 za dzień czytania, 30 za skończoną książkę, 3 za cytat, bonusy za passę (7, 30, 100, 365 dni) i za zadania dnia. Liczą się z twoich danych, więc nigdy nie przepadają. Z sumy wynika **poziom** (od „Nowy czytelnik” do „Legenda czytelnictwa”) z paskiem postępu.
- **Zadania dnia:** codziennie 3 inne, np. „Przeczytaj 10 stron”, „Sesja 15 minut”, „Zapisz cytat”, „Skończ rozdział”. Za każde odbierasz listki z animacją.
- **Sklepik Sówki:** okulary, szalik, kakao, kwiatek, czapka czarodzieja, lampka, korona. Sówka nosi je na sobie i można je zakładać i zdejmować. W sklepiku jest też **zamrożenie passy 🧊**, które ratuje passę w danym miesiącu.
- **Przytrzymaj książkę** (palcem; na komputerze prawy przycisk), a pojawi się menu z akcjami zależnymi od półki: zapisz postęp, zacznij, skończona, na później, do kolejki, na listę życzeń, **usuń z tej listy życzeń**, listy, mam ją, sprawdź ceny, do puli losowania, pożycz, edytuj, usuń. Każda zmiana ma animację (książka znika albo odlatuje) i „Cofnij”.
- **Listy przy dodawaniu książki:** po wybraniu „Lista życzeń” w formularzu zaznaczasz listy. Jest gotowy przycisk „+ 🛒 Warto kupić” i pole do utworzenia nowej listy od ręki.

## Wersja 2.14: duże niebo, listy wszędzie, pewna aktualizacja

- **Niebo pory dnia na ekranie Dziś** w nowej, dużej wersji. Słońce wędruje po łuku zależnie od godziny. Rano jest różowy świt, w dzień niebieskie niebo z chmurami i ptakami, wieczorem fioletowy zachód, a w nocy granat z księżycem, migającymi gwiazdami i spadającą gwiazdą. Na dole są wzgórza w kolorze pory dnia.
- **Listy życzeń wszędzie:** w Odkrywaj wybierasz, na którą listę trafia ♥. Przy „Na listę życzeń” w książce pojawia się wybór list. Nowa lista powstaje z każdego z tych miejsc.
- **Pewna aktualizacja na telefonie:** gdy pobierze się nowa wersja, aplikacja sama się przeładuje. W Ustawieniach → Wersja aplikacji widać numer wersji i jest przycisk **„Wymuś aktualizację”** (czyści pamięć podręczną aplikacji, książki zostają).
- **„Co nowego”:** po aktualizacji pojawia się okno z nowościami i przyciskami „Pokaż”, które prowadzą prosto do każdej funkcji.

## Wersja 2.13: kategorie, listy życzeń, kilka bazowych, pora dnia, muzyka, ciekawostki, cytat ze zdjęcia

- **Kategorie:** fantasy, sci-fi, kryminał, thriller, horror, romans, komedia, obyczajowa, historyczna, przygodowa, reportaż, biografia, popularnonaukowa, poradnik, młodzieżowa, dla dzieci, poezja, klasyka, techniczna. Rozpoznają się same z tagów i gatunku z Wikidata. Możesz je też wybrać ręcznie w formularzu książki. W Bibliotece jest pasek filtrów kategorii z liczbą książek.
- **Wiele list życzeń:** np. „🎂 Prezent na urodziny”, „🐉 Fantasy do kupienia”. Każda lista ma nazwę i ikonę. Książkę przypisujesz do jednej albo kilku list w jej szczegółach. Półka „Lista życzeń” filtruje się po wybranej liście, a „Udostępnij listę” wysyła tylko ją.
- **Kilka książek bazowych (do 3):** dwie albo trzy grube książki czytane równolegle, każda z własnym terminem i normą. Normy sumują się w planie dnia, a kreator rezerwuje na nie czas. Przy wyborze bazowej książki od 500 stron są oznaczone jako „gruba, idealna na bazową”.
- **Odkrywaj po polsku i po kategoriach:** propozycje to tylko polskie wydania. Tytuły bierze z Biblioteki Narodowej albo z polskich wydań w Open Library, zamiast angielskich nazw dzieł. Inny autor o tym samym nazwisku już nie trafia do propozycji. Na górze są kategorie, np. „🔍 Kryminał” daje polskie wydania kryminałów.
- **Ekran Dziś:**
  - **animowane niebo** zależne od pory dnia: wschód, słońce i chmury, zachód, księżyc i migające gwiazdy;
  - **🎧 Muzyka do czytania** dopasowana do kategorii czytanej książki i pory dnia, z linkami do Spotify i YouTube;
  - **✨ Ze świata książek:** codzienna ciekawostka literacka (przycisk „Kolejna”) i pisarze urodzeni tego dnia, z polskiej Wikipedii.
- **Niespodzianka: cytat ze zdjęcia strony.** W oknie dodawania cytatu przycisk „📷 Tekst ze zdjęcia strony” odczytuje tekst ze zdjęcia (OCR, polski słownik). Łączy przeniesienia wyrazów i sam wpisuje numer strony. Przy pierwszym użyciu pobiera czytnik tekstu (kilka MB).

## Wersja 2.12: opisy pro, ceny z Ceneo, Odkrywaj

- **Opisy pro:** pełny wstęp i tło z polskiej Wikipedii, osobna **fabuła** zasłonięta przed spoilerami (dotknij, żeby odsłonić) i **fakty z Wikidata**: gatunek, pierwsze wydanie, wydawca, cykl, poprzednia i następna część, kraj, język, miejsce akcji, nagrody, tłumacz. Do tego linki do źródeł. Gatunek trafia do tagów, a cykl do serii. Przy przeczytanej książce jest przycisk „Następna część → na listę życzeń”.
- **Ceny książek (lista życzeń):** aplikacja sama sprawdza najniższe ceny w porównywarce Ceneo (wiele sklepów, m.in. Empik), osobno dla papieru, e-booka i audiobooka. Robi to raz dziennie, po dodaniu książki na listę i na przycisk „Sprawdź ceny wszystkich”. Zapisuje historię cen i powiadamia, gdy coś stanieje albo pojawi się okazja. **Wymaga zaktualizowania workera:** wklej nowy kod z `proxy/cloudflare-worker.js` w Cloudflare (Edit code → Deploy). Adres zostaje ten sam. `bn.php` też to obsługuje.
- **Odkrywaj ♥** (zakładka Losuj, przełącznik u góry): karty z propozycjami na podstawie książek ocenionych na 4–5 ★, z polskim opisem. Przesuń w prawo albo kliknij ♥, żeby dodać na listę życzeń (ceny i opis uzupełnią się same). W lewo, żeby pominąć. „Mam ją” dodaje do kolejki i puli losowania. Jest też „Cofnij” i lista polubionych.
- **„Następna do czytania”** na ekranie Dziś to teraz książka faktycznie zaplanowana jako następna: najpierw z planu tygodnia (najbliższy dzień), potem z losowania, z planu miesiąca, a dopiero na końcu pierwsza w kolejce. Pod tytułem widać, skąd pochodzi.

## Wersja 2.11: mądrzejsza wyszukiwarka, opisy, podobne, pożyczki i lista życzeń 2.0, animacje

**Wyszukiwarka**
- **Literówki i brak polskich znaków:** gdy wyników jest mało, aplikacja szuka drugi raz po rdzeniach słów („sapkowsky” → „sapkow*”) i sama ocenia podobieństwo każdego wyniku. Przykład: „sapkowsky krew elfow” znajduje „Krew elfów”, a „tokarczk bieguni” znajduje „Biegunów”.
- **„Czy chodziło ci o…?”:** gdy wynik pasuje dopiero z poprawką, podsuwa poprawne zapytanie jednym kliknięciem.
- **Podpowiedzi przy pisaniu:** od 3 liter pod polem wyszukiwania pojawiają się pasujące tytuły. Najpierw te z twojej biblioteki (oznaczone „masz”), potem z internetu. Działa w formularzu dodawania i w zakładce Losuj.
- Słabo pasujące wyniki są odsiewane, a polskie wydania idą wyżej.

**Opis i podobne książki**
- **Opis książki** pobiera się sam po dodaniu. Źródła po kolei: polska Wikipedia, Google Books, streszczenie z Biblioteki Narodowej, Open Library (często po angielsku). Opis jest zwinięty z przyciskiem „Pokaż więcej”. Możesz go edytować albo napisać własny.
- **Podobne książki:** inne książki tego samego autora i książki o podobnym temacie, z okładkami. Każdą dodasz jednym kliknięciem do kolejki albo na listę życzeń.
- **Po ocenie 4–5 gwiazdek** okno „Przeczytane” od razu podsuwa „Skoro ci się podobała, może też…”.

**Pożyczki 2.0**
- Trzy rodzaje: pożyczyłem komuś, mam od kogoś, **z biblioteki**. Dla biblioteki termin ustawia się na 30 dni.
- **Termin zwrotu** wpisujesz datą albo szybkim wyborem (tydzień, 2 tygodnie, miesiąc, 2 miesiące, bez terminu).
- Stan terminu jest zawsze widoczny: „oddać za 2 dni”, „po terminie 3 dni” (na czerwono, także na okładce w Bibliotece).
- **Przedłuż** dodaje 30 dni dla biblioteki i 14 dla osoby, z licznikiem prolongat.
- **Do kalendarza:** przypomnienie 2 dni przed terminem i w dniu zwrotu.
- Ekran Dziś przypomina 3 dni przed terminem i gdy minie termin.
- **Historia pożyczek** przy książce, a półka „Pożyczone” jest ułożona według terminu.

**Lista życzeń 2.0**
- Aktualna cena, **cena docelowa** („kupię za max.”), **historia cen** z najniższą ceną. Gdy cena spadnie do progu, książka dostaje oznaczenie **„okazja!”** z powiadomieniem.
- **Okazja prezentowa:** urodziny, imieniny, Gwiazdka…
- **Porównanie cen jednym kliknięciem:** Ceneo, Allegro, Empik, TaniaKsiążka, Bonito, Google Zakupy, a dla e-booków Legimi, Woblink i Lubimyczytać. „Cena w Google Play” sprawdza cenę e-booka, gdy Google ją udostępnia.
- **„Mam ją”:** zapisujesz, ile zapłaciłeś albo że to prezent, i od razu wybierasz „do kolejki” albo „zacznij czytać”.
- **Budżet miesięczny** na książki z licznikiem wydanych pieniędzy. „Udostępnij listę” wysyła tekst z tytułami, cenami i linkami, np. dla rodziny przed urodzinami.
- W Statystykach jest nowa sekcja **Wydatki na książki**: miesiąc, rok, średnia cena i najdroższa książka.

**Animacje i interaktywność**
- Płynne przejścia między zakładkami (View Transitions). Sekcje i okładki pojawiają się kolejno, a paski postępu „rosną”.
- Przyciski i okładki reagują na dotyk. Ikona w dolnym pasku podskakuje przy wyborze.
- **Konfetti:** po skończeniu książki, przy ocenie 5, po zrobieniu celu tygodnia albo miesiąca, przy zakupie z listy życzeń i przy okazji cenowej.
- Liczba stron na ekranie Dziś „nabija się” od zera.
- **Okna da się zamknąć przeciągnięciem w dół** (na telefonie).
- Gdy ktoś wyłączy animacje w systemie, wszystkie animacje są wyłączone.

**Przegląd i poprawki**
- Każdy ekran, każda półka, każdy rodzaj książki i każde z ponad 20 okien zostały otwarte automatycznie na danych testowych. Kopia JSON, eksport CSV i pliki kalendarza też zostały sprawdzone.
- Eksport CSV wpisywał „undefined” jako półkę dla książek z „Na później” i „Listy życzeń”.
- Plik kalendarza dla zwrotu wywracał się przy pożyczce bez terminu.
- Ekran Dziś pokazywał do 4 banerów naraz. Teraz są najwyżej 2 najważniejsze (przeterminowana pożyczka przed passą), a reszta jest zwinięta.

## Wersja 2.10: książka bazowa w planie tygodnia

Książkę bazową (długą, czytaną codziennie przez wyznaczony okres) planuje system, nie ty.
- **Nie da się jej wybrać** w kreatorze tygodnia, w „Szybko dodaj”, w stałych planach ani w losowaniu. Nie da się więc ustawić np. „600 stron w tym tygodniu”. Stare ręczne wpisy bazowej w planie są pomijane.
- **Automatyczna norma na każdy dzień** (oznaczona „B” i „auto”): pozostałe strony dzielone przez dni do terminu, a dla minionych dni według planu od startu. Norma pojawia się w planie tygodnia, w „Planie na dziś” i w kalendarzu telefonu. Kliknięcie otwiera zmianę terminu.
- **Kreator rezerwuje czas na bazową:** jej minuty są odejmowane od twojego czasu w każdym dniu, a inne książki rozkładają się w tym, co zostaje. Podgląd pokazuje bazową jako szary, kreskowany pasek z opisem, np. „105 stron w tym tygodniu, ok. 15 dziennie, rezerwuję 2 h 41 min”. Gdy bazowa zajmuje cały twój czas, kreator ostrzega.

## Wersja 2.9: zakładka Losuj i książki techniczne

**Zakładka „Losuj” w dolnym pasku.** Ustawienia przeniosłem do ikony suwaków w nagłówku.
- **Moje książki do losowania (pula):** wpisujesz książki, które masz, np. „Lalka Prus” albo numer ISBN, a aplikacja sama uzupełnia okładkę, autora i liczbę stron. Są też przyciski:
  - **Skanuj kody:** skanujesz po kolei, aparat zostaje włączony;
  - **Wklej listę:** wiele tytułów naraz;
  - **Z biblioteki:** zaznaczasz książki, które już są w aplikacji, także całą kolejkę jednym przyciskiem.

  Książka wypada z puli sama, gdy ją przeczytasz. Możesz ją też wyjąć ręcznie.
- **Losowanie na tydzień:** wybierasz tydzień (ten albo następny), liczbę książek (1–6) i długość, a potem klikasz „Losuj”. Okładki przewijają się, a okienka zatrzymują po kolei.
  - Od piątku aplikacja sama proponuje następny tydzień.
  - W sobotę i niedzielę ekran Dziś przypomina, żeby wylosować książki na przyszły tydzień.
- **Zamień** losuje inną książkę na miejsce jednej z wylosowanych.
- **„Biorę! Zaplanuj tydzień”** dodaje wylosowane książki do planu tygodnia i otwiera kreator, w którym rozkładasz je na dni.
- Losowanie pomija książki wylosowane w dwóch poprzednich tygodniach, jeśli w puli jest z czego wybierać. Książki, które długo czekają, mają większą szansę.
- **Historia losowań** pokazuje, ile z wylosowanych książek przeczytałeś.

**Książki techniczne i do nauki**, czytane po kawałku, nie codziennie:
- W formularzu książki zaznaczasz „Książka techniczna / do nauki”.
- **Rozdziały:** wklejasz spis treści (np. „3. Funkcje ..... 31”), a numery stron rozpoznają się same. Bez spisu możesz podzielić książkę na równe części.
- **Odhaczasz rozdziały:** bieżąca strona przesuwa się na koniec rozdziału, a strony trafiają do dziennika i statystyk. Każde odhaczenie możesz cofnąć.
- **Cel: rozdziałów na tydzień**, tempo w rozdziałach na tydzień i prognoza końca.
- Na ekranie Dziś książki techniczne mają osobną sekcję „Do nauki”: następny rozdział, postęp tygodnia, przycisk ✓ do odhaczenia i ostrzeżenie „nieruszana od 9 dni”.
- Książki techniczne nie trafiają do „Czytam też”, do doboru w kreatorze tygodnia ani do losowania.

## Wersja 2.8: kreator tygodnia

Planowanie tygodnia odbywa się teraz w jednym oknie. Otwierasz je przyciskiem **„Zaplanuj tydzień”**, który jest w planie tygodnia i na ekranie Dziś. Podgląd odświeża się przy każdej zmianie.

1. **Cel:** ile książek chcesz przeczytać w tym tygodniu (1–6, np. 3–4). Cel zapisuje się dla tego tygodnia, a widok tygodnia pokazuje „skończone / cel”.
2. **Książki:**
   - „Dobierz za mnie” wybiera najpierw książki, które już czytasz (te najbliżej końca), potem kolejne z kolejki.
   - Opcja „krótsze najpierw” ułatwia dobicie do celu.
   - Dodasz też dowolną książkę z wyszukiwarki, a strzałkami ustawisz kolejność czytania.
   - Przy każdej książce widać, w który dzień ją skończysz, ile stron zrobisz w tym tygodniu albo że się nie zmieści.
3. **Twój czas w tym tygodniu:** minuty na każdy dzień (0 = wolne), z przyciskiem „Jak zwykle”. Zmiana dotyczy tylko tego tygodnia. Dochodzi pole **tempo** (stron na godzinę), wpisane ręcznie albo wzięte z sesji.
4. **Jak czytać:** jedna po drugiej albo wszystkie naraz.
5. **Podgląd:** paski stron na każdy dzień w kolorach książek, kreska twojego czasu, suma stron i liczba książek skończonych do niedzieli. Do tego ocena wykonalności:
   - „Zmieścisz się” z procentem wykorzystanego czasu;
   - „Za mało czasu”, z wyliczeniem, ile minut dziennie potrzebujesz, i trzema rozwiązaniami: ustaw tyle minut, planuj tylko w moim czasie, wybierz krótsze;
   - **„Planuj tylko tyle, ile zdążę”**: każdy dzień dostaje dokładnie tyle stron, ile zmieści twój czas, a reszta przechodzi na kolejny tydzień.

Zapis zastępuje wcześniejszy rozkład tych książek od dziś. Można go cofnąć.

## Wersja 2.7: zaawansowane planowanie, nowe półki, passa

**Planowanie tygodnia, dzień po dniu**
- **Twój czas na czytanie:** ustawiasz, ile minut możesz czytać w każdy dzień tygodnia (0 = dzień bez czytania). Aplikacja przelicza to na strony według twojego tempa z sesji, a bez sesji zakłada 30 str./h.
- **Rozłóż na dni:** strony rozkładają się proporcjonalnie do twojego czasu. Możesz czytać „jedna po drugiej” (kończysz pierwszą, potem następna) albo „wszystkie naraz, po trochu”. Możesz też wybrać dzień, od którego zacząć. Gdy plan przekracza twój czas, aplikacja ostrzega.
- **Każdy dzień** ma pasek zapełnienia (zaplanowane strony względem twojego czasu), mini okładki i stan każdego wpisu.
- **Edycja wpisu:** zmieniasz liczbę stron, cel „do strony X” albo cel w minutach i przenosisz wpis na inny dzień. Strzałka „›” przenosi wpis na następny dzień. „Powtórz do końca tygodnia” kopiuje wpis, a „Zrób z tego stały plan” zamienia go w stały plan.
- **Stałe plany** powtarzają się co tydzień, np. „Lalka: pn–pt po 30 stron” albo „Audiobook: weekendy po 45 minut”. Pojedynczy dzień możesz pominąć albo przenieść.
- **Zaległe wpisy:** niezrobione z minionych dni przeniesiesz na dziś jednym przyciskiem, z odjęciem tego, co już przeczytałeś.
- Wpis z celem w minutach zalicza się po sesji ze stoperem.

**Nowe półki**
- **Na później:** książki odłożone „kiedyś”, które nie zajmują miejsca w kolejce. Przerwana lektura pamięta stronę („Wróć do czytania (s. 120)”). Książkę przenosisz z powrotem przyciskiem „Do kolejki” albo „Na początek kolejki”.
- **Lista życzeń:** książki do kupienia albo dostania, z ceną, priorytetem (♥ do ♥♥♥), linkiem do sklepu i przyciskiem „Porównaj ceny”. Na górze półki jest suma cen. „Mam ją” przenosi książkę do kolejki.
- Formularz dodawania i dodawanie wielu książek mają teraz opcje „Lista życzeń” i „Na później”.

**Passa (seria) z własnymi zasadami.** Okno passy otwierasz, klikając płomyk na ekranie Dziś albo „Obecna passa” w Statystykach.
- **Minimum stron dziennie**, żeby dzień się liczył.
- **Dni wolne**, np. niedziela: nie przerywają passy.
- **Zamrożenia na miesiąc:** ratują passę, gdy zapomnisz o jednym dniu.
- **Cel passy** z paskiem postępu.
- Kalendarz 5 tygodni pokazuje dni czytania, dni wolne, zamrożenia i przerwy.

**Kalendarz miesiąca z okładkami:** na każdym dniu okładka książki, którą wtedy czytałeś najwięcej, tak jak w Bookmory. Przycisk przełącza między okładkami a kolorami.

## Wersja 2.6: plan tygodnia, przypomnienia, dodawanie wielu książek, losowanie

- **Plan tygodnia.** Otwierasz go z karty „Plan na dziś” na ekranie Dziś, przyciskiem „Plan tygodnia” albo skrótem na ikonie aplikacji (Android). Strzałkami przechodzisz między tygodniami.
  - **Do przeczytania w tym tygodniu:** wybierasz książki z listy do przeczytania i z czytanych. Jest też przycisk „Wylosuj coś z kolejki”.
  - **Rozłóż strony na dni:** aplikacja dzieli pozostałe strony wybranych książek równo na dni do niedzieli.
  - **Dzień po dniu:** każdy dzień ma swoje książki z liczbą stron. Plusem dodasz coś na konkretny dzień. Zrobione wpisy dostają ptaszek, a pominięte w minionych dniach są wyróżnione.
  - **Plan na dziś** na ekranie Dziś pokazuje dzisiejsze wpisy z postępem („50/100 str.”).
  - Z książki możesz ją dodać przyciskiem „Na ten tydzień”.
- **Przypomnienia** (Ustawienia → Przypomnienia): godzina i dni tygodnia. Przypomnienie przychodzi tylko wtedy, gdy dzienny cel nie jest jeszcze zrobiony, i pokazuje plan na dziś.
  - **Kalendarz telefonu (najpewniejsze):** przycisk tworzy plik `.ics` z powtarzającym się wydarzeniem z alarmem. Działa na iPhonie i Androidzie, nawet gdy aplikacja jest zamknięta. Plan tygodnia też da się wyeksportować do kalendarza, jako osobne wydarzenie na każdy dzień.
  - **Powiadomienia aplikacji:** przychodzą, gdy aplikacja jest otwarta albo działa w tle. Na Androidzie zainstalowana aplikacja może też sprawdzać w tle co kilka godzin (Periodic Background Sync). Na iPhonie powiadomienia działają tylko po dodaniu aplikacji do ekranu początkowego (iOS 16.4+).
- **Dodawanie wielu książek** (Biblioteka → „Wiele” albo link w formularzu dodawania):
  - **Wklej listę:** jedna książka w linii, jako tytuł i autor albo ISBN. Aplikacja wyszukuje wszystkie naraz, wybiera wydanie z liczbą stron i okładką, oznacza książki, które już masz, i pozwala zmienić wydanie.
  - **Skanuj po kolei:** aparat zostaje włączony, a każdy kolejny kod trafia na listę. Gotowe? Dodajesz wszystko jednym przyciskiem, do „Do przeczytania” albo jako „Już przeczytane”.
- **Nowe losowanie:** filtry skąd (cała lista, plan tygodnia, następne tomy cykli), długość, tag i format. Animacja przewijania okładek. Książki, które długo czekają, i następne tomy mają większą szansę. „Nie to, losuj dalej” pomija odrzucone. Wylosowaną książkę możesz zacząć, dodać do planu tygodnia albo przesunąć na początek kolejki.
- Wyszukiwanie w Bibliotece Narodowej rozumie teraz zapytania typu „Empuzjon Tokarczuk” i „Lem Solaris”: dzieli je na tytuł i autora.

## Wersja 2.5: cykle, pożyczki i grafiki

- **Biblioteka Narodowa działa od razu.** Domyślny pośrednik (Cloudflare Worker) jest wpisany w aplikację (`POSREDNIK_BN` w `js/core.js`), więc wyszukiwanie polskich książek działa także na GitHub Pages. W Ustawieniach można podać inny adres.
- **Wyszukiwanie po autorze w BN.** Wpisany tekst jest sprawdzany i jako tytuł, i jako nazwisko autora.
- **Cykle książek.** Książka ma pole „Cykl” i „Tom”, np. Wiedźmin, tom 2. Po zeskanowaniu kodu cykl i tom uzupełniają się same z danych Biblioteki Narodowej. Dla znanego cyklu aplikacja podpowiada numer kolejnego tomu.
  - Szczegóły książki pokazują wszystkie tomy cyklu z postępem.
  - Po skończeniu tomu pojawia się przycisk „Zacznij następny tom”.
  - W Bibliotece cykl jest widoczny pod autorem i można go wyszukiwać.
- **Pożyczone książki.** Zapisujesz, komu pożyczyłeś książkę albo od kogo ją masz, i od kiedy.
  - W Bibliotece jest filtr „Pożyczone”, a na okładce plakietka z imieniem.
  - Po 30 dniach ekran Dziś przypomina o książce. „Wróciła” albo „Oddana” zamyka pożyczkę, z opcją „Cofnij”.
- **Grafika z okładkami.** W oknie miesiąca i w podsumowaniu roku jest przycisk „Obrazek”. Tworzy grafikę 1080×1350 z okładkami przeczytanych książek, liczbą książek i stron, gotową do udostępnienia.
- **Cel roczny w czasie.** Nowy wykres w Statystykach pokazuje przeczytane książki narastająco, równy plan i przerywaną prognozę przy obecnym tempie.

## Wersja 2.4: polskie książki po kodzie kreskowym

**Dlaczego wcześniej nie działało.** Google Books bez klucza dzieli jeden limit zapytań z całym internetem i zwykle odpowiada „limit wyczerpany” (błąd 429). Aplikacja przechodziła wtedy na Open Library, która ma niewiele polskich wydań.

**Co się zmieniło**
- **Biblioteka Narodowa.** Jej katalog ma prawie każdą książkę wydaną w Polsce, z tytułem, autorem i liczbą stron. Serwer BN nie odpowiada przeglądarce bezpośrednio, więc aplikacja pyta przez małego pośrednika:
  - **Własny serwer z PHP (np. Apache):** wystarczy wrzucić plik `bn.php` razem z aplikacją. Działa sam, niczego nie trzeba ustawiać.
  - **GitHub Pages:** załóż darmowy Cloudflare Worker z pliku `proxy/cloudflare-worker.js` (instrukcja jest na początku pliku). Jego adres wklej w **Ustawienia → Wyszukiwanie książek → Adres pośrednika**.
- **Własny klucz Google Books** (opcjonalny, darmowy) w **Ustawienia → Wyszukiwanie książek**. Z nim Google przestaje odmawiać. Instrukcja, jak go zdobyć, jest w aplikacji.
- **Wszystkie źródła naraz.** Google Books, Open Library (nowe API wydań po ISBN) i Biblioteka Narodowa są odpytywane równocześnie. Wynik powstaje z najlepszych danych każdego źródła: tytuł i strony z BN, okładka z Google albo Open Library.
- **Szybsze dodawanie.** Po zeskanowaniu kodu z jednym pewnym wynikiem formularz uzupełnia się sam, bez wybierania z listy.
- **Brak wyniku.** Numer ISBN zostaje w formularzu, a aplikacja proponuje szukanie po tytule. Mówi też, czego brakuje, np. klucza Google albo włączonej BN.
- Obsługa ISBN-10 i ISBN-13 (zamiana w obie strony).
- Wyniki wyszukiwania po tytule są ułożone według trafności, a artykuły i recenzje z czasopism są odfiltrowane.
- Przycisk **Sprawdź źródła** w Ustawieniach pokazuje, które wyszukiwarki działają.

## Wersja 2.3: cele tygodniowe, miesięczne i plan miesiąca

- **Tydzień i miesiąc na ekranie Dziś.** Dwie karty z paskami dla stron i książek. Złota kreska pokazuje, gdzie powinieneś być dzisiaj. Pod paskiem widać, czy jesteś przed planem, czy za nim, i ile stron dziennie trzeba czytać do końca tygodnia albo miesiąca.
- **Cele tygodniowe i miesięczne w Ustawieniach.** Ustawiasz strony i książki na tydzień oraz na miesiąc. Puste pole liczy się samo z celu rocznego.
- **Własny cel dla konkretnego miesiąca.** Ustawienia mają listę wszystkich miesięcy z okresu celu. Kliknij miesiąc i wpisz mu własną liczbę książek i stron oraz notatkę, np. „sesja egzaminacyjna, mniej czytania”. Na dole lista pokazuje, czy suma celów miesięcznych pokrywa cel roczny. Automatyczne cele miesięcy sumują się dokładnie do celu rocznego.
- **Okno miesiąca.** Otwierasz je przyciskiem „Miesiąc” w Statystykach, z karty na ekranie Dziś albo klikając słupek na wykresie miesięcy. Strzałkami przechodzisz do innych miesięcy. Pokazuje:
  - postęp celów,
  - dni z czytaniem, średnią dzienną, serię i porównanie z poprzednim miesiącem,
  - kalendarz dni (kliknięty dzień otwiera jego szczegóły),
  - przeczytane książki z datami,
  - książki czytane w tym miesiącu: ile stron i przez ile dni.
- **Plan miesiąca.** Wybierasz książki, które chcesz przeczytać w danym miesiącu. Aplikacja liczy, ile stron dziennie to wymaga, i ostrzega, gdy plan przekracza cel. Książkę możesz też zaplanować z jej szczegółów („Zaplanuj na miesiąc”).
- **Miesiąc po miesiącu w Statystykach.** Lista miesięcy z liczbą książek i stron na tle celu.
- **Powiadomienia.** Gdy zrobisz cel tygodnia albo miesiąca, pojawia się gratulacja.

## Wersja 2.2: nowe funkcje

- **Pauza w sesji czytania.** Przycisk Pauza/Wznów; czas pauzy nie wlicza się do sesji ani tempa. Pigułka na dole pokazuje, że sesja stoi.
- **Dziennik czytania w książce.** W szczegółach książki lista wszystkich dziennych wpisów. Każdy wpis można poprawić (liczba stron, inny dzień) albo usunąć, z opcją „Cofnij”. Dla czytanej książki poprawka przesuwa też bieżącą stronę.
- **Postęp w procentach.** W „Zapisz postęp” przełącznik Strona/Procent (e-booki i audiobooki domyślnie w procentach). Wybór zapamiętuje się dla każdej książki.
- **Szczegóły dnia.** Kliknij słupek na wykresie albo kratkę na mapie dni w Statystykach: zobaczysz, co i ile czytałeś tego dnia, i od razu poprawisz wpis.
- **Dni tygodnia.** Nowy wykres: średnio stron w każdy dzień tygodnia z ostatnich 12 tygodni.
- **Odznaki.** 17 odznak (serie, maratony, cegły, kolekcja cytatów, cel roczny…) z paskiem postępu. Gdy zdobędziesz nową, pojawia się powiadomienie.
- **Twój rok w książkach.** Podsumowanie wybranego roku: okładki przeczytanych, strony w miesiącach, rekordy, ulubione. Można je udostępnić jako tekst.
- **Losuj z kolejki.** „Nie wiem, co czytać” losuje książkę z listy do przeczytania, z filtrem krótka/długa.
- **Cytat jako obrazek.** Każdy cytat zapiszesz albo udostępnisz jako grafikę 1080×1350 w stylu aplikacji (np. na Instagram).
- **Ostrzeżenie o serii.** Po 17:00, jeśli dziś nic nie przeczytałeś, ekran Dziś przypomina, że seria przepadnie o północy.

## Wersja 2.1: nowy skaner

- Skaner nie odczytywał kodów, bo polegał tylko na czytniku wbudowanym w Chrome. Na iPhonie go nie ma, a na części Androidów działa słabo. Teraz aplikacja ma własny odczyt kodu EAN-13 (`js/ean.js`), który działa w każdej przeglądarce i bez internetu.
- Aparat pracuje w wyższej rozdzielczości i z ciągłym ustawianiem ostrości, a ramka na ekranie pokazuje, jak blisko trzymać kod.
- Nowy przycisk **Zrób zdjęcie kodu**: zwykłe zdjęcie z aparatu jest ostrzejsze niż podgląd na żywo, więc to pewny sposób, gdy podgląd nie łapie kodu.
- Na Androidzie jest przycisk latarki.

## Co poprawiono względem wersji 1

- Kliknięcie „Skończona” nie doliczało pozostałych stron do statystyk. Teraz pyta, czy wliczyć je do dzisiejszego dnia.
- Systemowe okienka (`alert`, `prompt`, `confirm`) blokowały aplikację zainstalowaną na telefonie. Zastąpiły je własne okna.
- Nie dało się poprawić tytułu ani liczby stron. Jest teraz edycja.
- Nie dało się zapisać stron za wczoraj. Teraz można wybrać dowolny dzień.
- Uszkodzona albo stara kopia JSON mogła wysypać aplikację. Dane są teraz sprawdzane i naprawiane przy wczytaniu.
- Service worker nie miał numeru wersji, więc telefon trzymał stare pliki. Teraz każda wersja ma swój numer.
- Sesja czytania zostawała aktywna po skończeniu albo usunięciu książki. Teraz się zamyka.
