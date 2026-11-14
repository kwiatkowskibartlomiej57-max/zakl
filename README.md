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
