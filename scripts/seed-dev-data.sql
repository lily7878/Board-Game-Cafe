-- Date demo pentru dezvoltare: mese, categorii de jocuri, jocuri, exemplare, meniu si conturi de personal.
-- Istoricul de zile (sesiuni, comenzi, rapoarte) este in seed-dev-history.sql.
-- Se poate rula de oricate ori: nu dubleaza nimic si nu modifica randurile existente.
-- Nu este o migrare Flyway, deci nu ajunge automat in nicio alta baza de date.
-- Rulare: powershell -ExecutionPolicy Bypass -File .\scripts\seed-dev-data.ps1

SET client_encoding = 'UTF8';
BEGIN;

-- Mese
INSERT INTO cafe_tables (table_number, capacity, active, created_at)
SELECT n, cap, TRUE, now()
FROM (VALUES (1, 4), (2, 4), (3, 6), (4, 2), (5, 8), (6, 4), (7, 4), (8, 2), (9, 6), (10, 4), (11, 2)) AS t(n, cap)
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = t.n);

-- O masa scoasa din uz, ca sa se vada si starea asta
INSERT INTO cafe_tables (table_number, capacity, active, created_at)
SELECT 12, 4, FALSE, now()
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = 12);

-- Categorii de jocuri ("Cooperativ" e folosita si de recomandari pentru atmosfera "Jucam in echipa")
INSERT INTO game_categories (name, description, active) VALUES
    ('Strategie', 'Planificare si decizii pe termen lung.', TRUE),
    ('Cooperativ', 'Toti jucatorii castiga sau pierd impreuna.', TRUE),
    ('Party', 'Jocuri rapide pentru grupuri mari, cu multe rasete.', TRUE),
    ('Familie', 'Reguli simple, potrivite pentru toate varstele.', TRUE),
    ('Abstract', 'Fara poveste, doar forme, culori si logica.', TRUE),
    ('Carti', 'Jocuri jucate in principal cu carti.', TRUE),
    ('Doi jucatori', 'Dueluri gandite pentru exact doi jucatori.', TRUE),
    ('Zaruri', 'Noroc cu zarurile si decizii rapide.', TRUE),
    ('Deductie', 'Ghiciti, deduceti si blufati.', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Jocuri
INSERT INTO games (title, description, short_rules, min_players, max_players, duration_minutes,
                   max_duration_minutes, minimum_age, difficulty, active, created_at)
SELECT g.title, g.description, g.short_rules, g.min_p, g.max_p, g.dur, g.max_dur, g.age, g.diff, TRUE, now()
FROM (VALUES
    ('Catan', 'Colonizați o insulă, strângeți resurse și negociați cu ceilalți ca să construiți drumuri și orașe.',
        'Aruncați zarurile, primiți resurse, construiți. Primul la 10 puncte câștigă.', 3, 4, 60, 90, 10, 'MEDIUM'),
    ('Pandemic', 'O echipă de specialiști oprește patru epidemii care se răspândesc în lume.',
        'Fiecare jucător are 4 acțiuni pe tură. Găsiți cele 4 leacuri înainte să se termine cărțile.', 2, 4, 45, NULL, 8, 'MEDIUM'),
    ('Dixit', 'Cărți ilustrate și povești: descrieți o imagine astfel încât doar unii să o ghicească.',
        'Povestitorul dă un indiciu, ceilalți aleg o carte potrivită, apoi toți votează.', 3, 6, 30, NULL, 8, 'EASY'),
    ('Codenames', 'Două echipe și doi spioni-șefi care dau indicii dintr-un singur cuvânt.',
        'Spionul-șef spune un cuvânt și un număr; echipa ghicește agenții de pe masă.', 4, 8, 15, 30, 10, 'EASY'),
    ('Ticket to Ride', 'Construiți rute de tren între orașe și îndepliniți bilete de destinație.',
        'Pe tură: luați cărți, construiți o rută sau luați bilete noi.', 2, 5, 45, 60, 8, 'EASY'),
    ('Carcassonne', 'Puneți piese pe rând și construiți împreună un peisaj medieval.',
        'Trageți o piesă, puneți-o lângă celelalte și, opțional, așezați un omuleț.', 2, 5, 35, NULL, 7, 'EASY'),
    ('Azul', 'Alegeți plăci colorate și decorați peretele palatului cu modele frumoase.',
        'Luați toate plăcile de o culoare dintr-un cerc, completați rânduri pe tablă.', 2, 4, 30, 45, 8, 'MEDIUM'),
    ('Splendor', 'Negustori de pietre prețioase care cumpără mine și atrag nobili.',
        'Pe tură: luați jetoane sau cumpărați o carte. Primul la 15 puncte câștigă.', 2, 4, 30, NULL, 10, 'EASY'),
    ('Terraforming Mars', 'Corporații care transformă Marte într-o planetă locuibilă, pas cu pas.',
        'Jucați cărți de proiect, creșteți producția și ridicați temperatura și oxigenul.', 1, 5, 120, 150, 12, 'HARD'),
    ('7 Wonders', 'Conduceți o civilizație antică și construiți una dintre cele șapte minuni ale lumii.',
        'Toți aleg simultan o carte și trec restul vecinului. 3 epoci.', 3, 7, 30, NULL, 10, 'MEDIUM'),
    ('The Crew', 'Joc de cărți cooperativ: echipajul îndeplinește misiuni comunicând foarte puțin.',
        'Câștigați levate conform misiunii, fără să vorbiți despre cărțile din mână.', 2, 5, 20, NULL, 10, 'MEDIUM'),
    ('Forbidden Island', 'Exploratori care salvează patru comori de pe o insulă care se scufundă.',
        'Cooperativ: 3 acțiuni pe tură, apoi insula se inundă mai mult.', 2, 4, 30, NULL, 10, 'EASY'),
    ('Wingspan', 'Iubitori de păsări care atrag specii în rezervațiile lor.',
        'Pe tură: puneți o pasăre, luați hrană, depuneți ouă sau trageți cărți.', 1, 5, 40, 70, 10, 'MEDIUM'),
    ('Exploding Kittens', 'Ruletă cu pisici explozive: trageți cărți și sperați să nu explodați.',
        'Jucați câte cărți vreți, apoi trageți una. Dacă e pisica explozivă, ieșiți.', 2, 5, 15, NULL, 7, 'EASY'),
    ('Gloomhaven: Jaws of the Lion', 'Aventură cooperativă de tip campanie, cu lupte tactice și povești.',
        'Fiecare alege 2 cărți pe rundă; inițiativa decide ordinea. Scenarii cu obiective.', 1, 4, 90, 120, 14, 'HARD'),
    ('Kingdomino', 'Construiți un regat de 5x5 din domino-uri cu terenuri și coroane.',
        'Alegeți un domino nou, apoi îl lipiți de castel sau de un teren la fel. Teritoriu × coroane.', 2, 4, 15, 20, 8, 'EASY'),
    ('Sushi Go!', 'Alegeți cele mai bune feluri de sushi din mâna care trece pe la toți.',
        'Toți aleg o carte deodată și dau restul la stânga. 3 runde, combinații de puncte.', 2, 5, 15, NULL, 8, 'EASY'),
    ('Love Letter', 'Joc mic de deducție: scrisoarea de dragoste trebuie să ajungă la prințesă.',
        'Trageți o carte și jucați una din cele două. Cartea cea mai mare sau ultimul rămas câștigă runda.', 2, 6, 20, NULL, 10, 'EASY'),
    ('King of Tokyo', 'Monștri uriași se bat pentru Tokyo cu zaruri, energie și puteri speciale.',
        'Aruncați 6 zaruri de până la 3 ori. 20 de puncte sau ultimul monstru în viață câștigă.', 2, 6, 30, NULL, 8, 'EASY'),
    ('Dobble', 'Joc de reflexe: oricare două cărți au exact un simbol comun. Găsiți-l primul!',
        'Mai multe mini-jocuri; cine spune primul simbolul comun ia sau dă cartea.', 2, 8, 15, NULL, 6, 'EASY'),
    ('Jaipur', 'Duel între doi negustori din Jaipur care schimbă și vând mărfuri.',
        'Pe tură: luați cărți din piață sau vindeți un tip de marfă. Două runde câștigate = victorie.', 2, 2, 30, NULL, 10, 'EASY'),
    ('Patchwork', 'Duel de puzzle: coaseți cea mai frumoasă pătură din petice.',
        'Cumpărați petice cu nasturi și timp sau avansați pentru nasturi. Pătrățelele goale costă puncte.', 2, 2, 30, NULL, 8, 'EASY'),
    ('Hanabi', 'Joc cooperativ cu artificii: vedeți cărțile tuturor, mai puțin pe ale voastre.',
        'Dați indicii, aruncați sau jucați o carte. Construiți 5 artificii în ordine de la 1 la 5.', 2, 5, 25, NULL, 8, 'MEDIUM'),
    ('Dominion', 'Jocul care a inventat deck-building-ul: construiți-vă pachetul tură cu tură.',
        'Acțiune, cumpărare, curățenie. Provinciile dau cele mai multe puncte.', 2, 4, 30, NULL, 13, 'MEDIUM'),
    ('Small World', 'Rase fantastice cu puteri speciale se înghesuie pe o lume prea mică.',
        'Cuceriți regiuni, adunați monede, puneți rasa în declin și alegeți alta.', 2, 5, 40, 80, 8, 'MEDIUM'),
    ('Cascadia', 'Construiți un ecosistem din plăci de habitat și animale sălbatice.',
        'Luați o placă și un animal, așezați-le în ecosistem. Punctați modele și habitate mari.', 1, 4, 30, 45, 10, 'EASY'),
    ('Just One', 'Party cooperativ: ajutați un coleg să ghicească un cuvânt cu indicii de un singur cuvânt.',
        'Indiciile identice se anulează. Echipa încearcă să ghicească cât mai multe din 13 cărți.', 3, 7, 20, NULL, 8, 'EASY'),
    ('Santorini', 'Joc abstract de construit: urcați un muncitor pe nivelul 3 ca să câștigați.',
        'Mutați un muncitor, apoi construiți lângă el. Se urcă cel mult un nivel pe mutare.', 2, 4, 20, NULL, 8, 'EASY'),
    ('Hive', 'Duel abstract fără tablă, cu insecte: încercuiți regina adversarului.',
        'Puneți sau mutați o piesă; stupul trebuie să rămână legat. Fiecare insectă se mișcă altfel.', 2, 2, 20, NULL, 9, 'MEDIUM'),
    ('Spirit Island', 'Spirite cooperative apără o insulă de invadatori, cu ajutorul localnicilor.',
        'Creștere, puteri rapide, invadatori, puteri lente. Frica îi alungă pe invadatori.', 1, 4, 90, 120, 13, 'HARD')
) AS g(title, description, short_rules, min_p, max_p, dur, max_dur, age, diff)
WHERE NOT EXISTS (SELECT 1 FROM games WHERE lower(games.title) = lower(g.title));

-- Legaturi joc - categorie
INSERT INTO game_category_links (game_id, category_id)
SELECT g.id, c.id
FROM (VALUES
    ('Catan', 'Strategie'), ('Catan', 'Familie'),
    ('Pandemic', 'Cooperativ'), ('Pandemic', 'Strategie'),
    ('Dixit', 'Party'), ('Dixit', 'Familie'),
    ('Codenames', 'Party'),
    ('Ticket to Ride', 'Familie'), ('Ticket to Ride', 'Strategie'),
    ('Carcassonne', 'Familie'), ('Carcassonne', 'Strategie'),
    ('Azul', 'Abstract'), ('Azul', 'Familie'),
    ('Splendor', 'Strategie'), ('Splendor', 'Carti'),
    ('Terraforming Mars', 'Strategie'),
    ('7 Wonders', 'Strategie'), ('7 Wonders', 'Carti'),
    ('The Crew', 'Cooperativ'), ('The Crew', 'Carti'),
    ('Forbidden Island', 'Cooperativ'), ('Forbidden Island', 'Familie'),
    ('Wingspan', 'Strategie'), ('Wingspan', 'Carti'),
    ('Exploding Kittens', 'Party'), ('Exploding Kittens', 'Carti'),
    ('Gloomhaven: Jaws of the Lion', 'Cooperativ'), ('Gloomhaven: Jaws of the Lion', 'Strategie'),
    ('Catan', 'Zaruri'), ('Codenames', 'Deductie'), ('Dixit', 'Deductie'),
    ('Kingdomino', 'Familie'), ('Kingdomino', 'Strategie'),
    ('Sushi Go!', 'Carti'), ('Sushi Go!', 'Familie'), ('Sushi Go!', 'Party'),
    ('Love Letter', 'Carti'), ('Love Letter', 'Deductie'), ('Love Letter', 'Party'),
    ('King of Tokyo', 'Zaruri'), ('King of Tokyo', 'Party'), ('King of Tokyo', 'Familie'),
    ('Dobble', 'Party'), ('Dobble', 'Familie'), ('Dobble', 'Carti'),
    ('Jaipur', 'Doi jucatori'), ('Jaipur', 'Carti'), ('Jaipur', 'Strategie'),
    ('Patchwork', 'Doi jucatori'), ('Patchwork', 'Abstract'),
    ('Hanabi', 'Cooperativ'), ('Hanabi', 'Carti'), ('Hanabi', 'Deductie'),
    ('Dominion', 'Strategie'), ('Dominion', 'Carti'),
    ('Small World', 'Strategie'), ('Small World', 'Familie'),
    ('Cascadia', 'Familie'), ('Cascadia', 'Abstract'),
    ('Just One', 'Party'), ('Just One', 'Cooperativ'),
    ('Santorini', 'Abstract'), ('Santorini', 'Doi jucatori'),
    ('Hive', 'Abstract'), ('Hive', 'Doi jucatori'),
    ('Spirit Island', 'Cooperativ'), ('Spirit Island', 'Strategie')
) AS l(title, category)
JOIN games g ON lower(g.title) = lower(l.title)
JOIN game_categories c ON c.name = l.category
ON CONFLICT DO NOTHING;

-- Exemplare: 2 pentru jocurile populare, 1 pentru restul; unul in mentenanta, ca sa se vada si starea asta.
INSERT INTO game_copies (game_id, inventory_code, condition_status, notes, created_at)
SELECT g.id, c.code, c.status, c.notes, now()
FROM (VALUES
    ('Catan', 'BG-CATAN-1', 'USABLE', NULL), ('Catan', 'BG-CATAN-2', 'USABLE', NULL),
    ('Pandemic', 'BG-PANDEMIC-1', 'USABLE', NULL),
    ('Dixit', 'BG-DIXIT-1', 'USABLE', NULL), ('Dixit', 'BG-DIXIT-2', 'USABLE', NULL),
    ('Codenames', 'BG-CODENAMES-1', 'USABLE', NULL), ('Codenames', 'BG-CODENAMES-2', 'USABLE', NULL),
    ('Ticket to Ride', 'BG-TTR-1', 'USABLE', NULL),
    ('Carcassonne', 'BG-CARC-1', 'USABLE', NULL),
    ('Azul', 'BG-AZUL-1', 'USABLE', NULL),
    ('Splendor', 'BG-SPLENDOR-1', 'USABLE', NULL),
    ('Terraforming Mars', 'BG-TM-1', 'USABLE', NULL),
    ('7 Wonders', 'BG-7W-1', 'USABLE', NULL),
    ('The Crew', 'BG-CREW-1', 'USABLE', NULL),
    ('Forbidden Island', 'BG-FI-1', 'USABLE', NULL),
    ('Wingspan', 'BG-WINGSPAN-1', 'UNDER_MAINTENANCE', 'Lipsesc câteva ouă de lemn.'),
    ('Exploding Kittens', 'BG-EK-1', 'USABLE', NULL),
    ('Gloomhaven: Jaws of the Lion', 'BG-GH-1', 'USABLE', NULL),
    ('Pandemic', 'BG-PANDEMIC-2', 'USABLE', NULL),
    ('Azul', 'BG-AZUL-2', 'USABLE', NULL),
    ('Ticket to Ride', 'BG-TTR-2', 'USABLE', NULL),
    ('Exploding Kittens', 'BG-EK-2', 'UNAVAILABLE', 'Pachet pierdut, de înlocuit.'),
    ('Kingdomino', 'BG-KINGDOMINO-1', 'USABLE', NULL),
    ('Sushi Go!', 'BG-SUSHIGO-1', 'USABLE', NULL), ('Sushi Go!', 'BG-SUSHIGO-2', 'USABLE', NULL),
    ('Love Letter', 'BG-LOVELETTER-1', 'USABLE', NULL),
    ('King of Tokyo', 'BG-KOT-1', 'USABLE', NULL), ('King of Tokyo', 'BG-KOT-2', 'USABLE', NULL),
    ('Dobble', 'BG-DOBBLE-1', 'USABLE', NULL), ('Dobble', 'BG-DOBBLE-2', 'USABLE', NULL),
    ('Jaipur', 'BG-JAIPUR-1', 'USABLE', NULL),
    ('Patchwork', 'BG-PATCHWORK-1', 'USABLE', NULL),
    ('Hanabi', 'BG-HANABI-1', 'USABLE', NULL),
    ('Dominion', 'BG-DOMINION-1', 'USABLE', NULL),
    ('Small World', 'BG-SMALLWORLD-1', 'UNDER_MAINTENANCE', 'Cutia de rase trebuie reorganizată.'),
    ('Small World', 'BG-SMALLWORLD-2', 'USABLE', NULL),
    ('Cascadia', 'BG-CASCADIA-1', 'USABLE', NULL),
    ('Just One', 'BG-JUSTONE-1', 'USABLE', NULL),
    ('Santorini', 'BG-SANTORINI-1', 'USABLE', NULL),
    ('Hive', 'BG-HIVE-1', 'USABLE', NULL),
    ('Spirit Island', 'BG-SPIRIT-1', 'USABLE', NULL)
) AS c(title, code, status, notes)
JOIN games g ON lower(g.title) = lower(c.title)
ON CONFLICT (inventory_code) DO NOTHING;

-- Meniu
INSERT INTO menu_categories (name, description, active, sort_order) VALUES
    ('Cafea', 'Espresso și băuturi pe bază de cafea.', TRUE, 1),
    ('Băuturi reci', 'Răcoritoare, limonade și apă.', TRUE, 2),
    ('Ceai', 'Ceaiuri la plic și infuzii.', TRUE, 3),
    ('Gustări', 'Ceva de ronțăit în timpul jocului.', TRUE, 4),
    ('Deserturi', 'Prăjituri și dulciuri.', TRUE, 5),
    ('Ciocolată & chai', 'Băuturi calde cu lapte, fără cafea.', TRUE, 6),
    ('Fresh & smoothie', 'Fructe stoarse pe loc și smoothie-uri.', TRUE, 7),
    ('Bere & vin', 'Doar pentru clienții de peste 18 ani.', TRUE, 8),
    ('Mâncare caldă', 'Pizza, sandvișuri calde, supe și salate.', TRUE, 9),
    ('Platouri de împărțit', 'Porții mari pentru toată masa.', TRUE, 10)
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (category_id, name, description, price, available, active, created_at, icon, tags)
SELECT c.id, i.name, i.description, i.price, i.available, TRUE, now(), i.icon, i.tags
FROM (VALUES
    ('Cafea', 'Espresso', 'Shot simplu de espresso.', 9.00, TRUE, 'coffee', ''),
    ('Cafea', 'Cappuccino', 'Espresso cu lapte spumat.', 13.00, TRUE, 'coffee', 'Popular'),
    ('Cafea', 'Latte', 'Espresso cu mult lapte.', 14.00, TRUE, 'milk', ''),
    ('Cafea', 'Flat White', 'Dublu espresso cu lapte catifelat.', 15.00, TRUE, 'coffee', ''),
    ('Băuturi reci', 'Limonadă de casă', 'Lămâie, mentă și miere.', 16.00, TRUE, 'glass-water', 'Popular|De casă'),
    ('Băuturi reci', 'Coca-Cola', '330 ml.', 10.00, TRUE, 'cup-soda', ''),
    ('Băuturi reci', 'Apă plată', '500 ml.', 7.00, TRUE, 'glass-water', ''),
    ('Băuturi reci', 'Bere artizanală', 'IPA locală, 330 ml.', 18.00, TRUE, 'beer', '18+'),
    ('Ceai', 'Ceai verde', 'Ceai verde la ceainic.', 11.00, TRUE, 'leaf', ''),
    ('Ceai', 'Ceai de fructe', 'Infuzie de fructe de pădure.', 11.00, TRUE, 'leaf', ''),
    ('Gustări', 'Popcorn', 'Bol mare, sărat.', 12.00, TRUE, 'popcorn', 'Pentru grup'),
    ('Gustări', 'Nachos cu salsa', 'Nachos cu sos de roșii picant.', 19.00, TRUE, 'popcorn', 'Pentru grup|Picant'),
    ('Gustări', 'Sandviș cu mozzarella', 'Mozzarella, roșii și busuioc.', 22.00, TRUE, 'sandwich', 'Vegetarian'),
    ('Gustări', 'Pizza margherita (felie)', 'Felie mare, la cuptor.', 14.00, FALSE, 'pizza', ''),
    ('Deserturi', 'Brownie', 'Cu ciocolată neagră.', 14.00, TRUE, 'cake-slice', 'Popular'),
    ('Deserturi', 'Cookie cu ciocolată', 'Copt în casă.', 8.00, TRUE, 'cookie', ''),
    ('Deserturi', 'Înghețată', 'Două cupe, vanilie și ciocolată.', 13.00, TRUE, 'ice-cream-cone', ''),
    ('Cafea', 'Espresso dublu', 'Două shot-uri de espresso.', 13.00, TRUE, 'coffee', ''),
    ('Cafea', 'Americano', 'Espresso lungit cu apă fierbinte.', 10.00, TRUE, 'coffee', ''),
    ('Cafea', 'Mocha', 'Espresso, ciocolată și lapte.', 16.00, TRUE, 'coffee', 'Conține lactoză'),
    ('Cafea', 'Caramel macchiato', 'Lapte, espresso și sirop de caramel.', 17.00, TRUE, 'milk', 'Conține lactoză'),
    ('Cafea', 'Frappé', 'Cafea rece bătută cu gheață și lapte.', 16.00, TRUE, 'cup-soda', ''),
    ('Cafea', 'Cold brew', 'Cafea extrasă la rece 18 ore.', 15.00, TRUE, 'cup-soda', 'De casă'),
    ('Ceai', 'Ceai de mentă', 'Mentă proaspătă la ceainic.', 11.00, TRUE, 'leaf', ''),
    ('Ceai', 'Earl Grey', 'Ceai negru cu bergamotă.', 11.00, TRUE, 'leaf', ''),
    ('Ceai', 'Ghimbir, lămâie și miere', 'Infuzie fierbinte, bună pentru iarnă.', 13.00, TRUE, 'leaf', 'De casă'),
    ('Ciocolată & chai', 'Ciocolată caldă', 'Ciocolată neagră topită în lapte.', 15.00, TRUE, 'milk', 'Popular|Conține lactoză'),
    ('Ciocolată & chai', 'Ciocolată albă caldă', 'Cu vanilie și frișcă.', 16.00, TRUE, 'milk', 'Conține lactoză'),
    ('Ciocolată & chai', 'Chai latte', 'Ceai negru cu condimente și lapte.', 15.00, TRUE, 'milk', ''),
    ('Ciocolată & chai', 'Matcha latte', 'Ceai verde matcha cu lapte vegetal.', 17.00, FALSE, 'leaf', 'Vegan'),
    ('Fresh & smoothie', 'Fresh de portocale', '300 ml, stors pe loc.', 18.00, TRUE, 'glass-water', ''),
    ('Fresh & smoothie', 'Fresh de grepfrut', '300 ml, stors pe loc.', 18.00, TRUE, 'glass-water', ''),
    ('Fresh & smoothie', 'Smoothie căpșuni-banane', 'Căpșuni, banană și lapte de ovăz.', 19.00, TRUE, 'cup-soda', 'Vegan'),
    ('Fresh & smoothie', 'Smoothie verde', 'Spanac, măr, kiwi și ghimbir.', 20.00, TRUE, 'cup-soda', 'Vegan'),
    ('Fresh & smoothie', 'Milkshake de vanilie', 'Înghețată de vanilie și lapte.', 17.00, TRUE, 'milk', 'Conține lactoză'),
    ('Băuturi reci', 'Limonadă cu zmeură', 'Lămâie, zmeură și apă minerală.', 17.00, TRUE, 'glass-water', 'De casă'),
    ('Băuturi reci', 'Ice tea de casă', 'Ceai negru rece cu piersici.', 14.00, TRUE, 'cup-soda', 'De casă'),
    ('Băuturi reci', 'Apă minerală', '500 ml.', 7.00, TRUE, 'glass-water', ''),
    ('Băuturi reci', 'Fanta', '330 ml.', 10.00, TRUE, 'cup-soda', ''),
    ('Băuturi reci', 'Sprite', '330 ml.', 10.00, TRUE, 'cup-soda', ''),
    ('Bere & vin', 'Bere blondă', 'La halbă, 400 ml.', 12.00, TRUE, 'beer', '18+'),
    ('Bere & vin', 'Bere fără alcool', '330 ml.', 11.00, TRUE, 'beer', ''),
    ('Bere & vin', 'Cidru de mere', '330 ml.', 15.00, TRUE, 'beer', '18+'),
    ('Bere & vin', 'Vin roșu (pahar)', 'Fetească neagră, 150 ml.', 18.00, TRUE, 'wine', '18+'),
    ('Bere & vin', 'Vin alb (pahar)', 'Sauvignon blanc, 150 ml.', 18.00, TRUE, 'wine', '18+'),
    ('Bere & vin', 'Spritz', 'Aperitiv, prosecco și apă minerală.', 22.00, TRUE, 'wine', '18+'),
    ('Mâncare caldă', 'Pizza quattro formaggi', 'Patru brânzeturi, 30 cm.', 39.00, TRUE, 'pizza', 'Vegetarian|Pentru grup'),
    ('Mâncare caldă', 'Pizza diavola', 'Salam picant și ardei iute, 30 cm.', 41.00, TRUE, 'pizza', 'Picant|Pentru grup'),
    ('Mâncare caldă', 'Toast cu șuncă și cașcaval', 'Pâine prăjită, servit cald.', 19.00, TRUE, 'sandwich', 'Popular'),
    ('Mâncare caldă', 'Wrap cu pui', 'Pui la grătar, salată și sos de iaurt.', 27.00, TRUE, 'sandwich', ''),
    ('Mâncare caldă', 'Supă cremă de linte', 'Cu crutoane.', 18.00, TRUE, 'soup', 'Vegan'),
    ('Mâncare caldă', 'Salată Caesar', 'Pui, parmezan, crutoane și dressing Caesar.', 29.00, TRUE, 'salad', ''),
    ('Mâncare caldă', 'Salată grecească', 'Roșii, castraveți, măsline și feta.', 26.00, TRUE, 'salad', 'Vegetarian'),
    ('Platouri de împărțit', 'Platou cu brânzeturi', 'Cinci brânzeturi, struguri și nuci.', 45.00, TRUE, 'salad', 'Pentru grup|Vegetarian'),
    ('Platouri de împărțit', 'Platou cu mezeluri', 'Prosciutto, salam, cârnați afumați și murături.', 48.00, TRUE, 'salad', 'Pentru grup'),
    ('Platouri de împărțit', 'Cartofi prăjiți', 'Porție mare, cu ketchup și maioneză.', 15.00, TRUE, 'popcorn', 'Pentru grup'),
    ('Platouri de împărțit', 'Covrigei și alune', 'Bol de ronțăit.', 10.00, TRUE, 'popcorn', ''),
    ('Deserturi', 'Cheesecake', 'Cu sos de fructe de pădure.', 18.00, TRUE, 'cake-slice', 'Popular'),
    ('Deserturi', 'Tiramisu', 'Rețeta clasică, cu mascarpone.', 19.00, TRUE, 'cake-slice', ''),
    ('Deserturi', 'Papanași', 'Cu smântână și dulceață de afine.', 24.00, TRUE, 'donut', 'De casă'),
    ('Deserturi', 'Gogoși cu gem', 'Trei gogoși mici.', 14.00, TRUE, 'donut', ''),
    ('Deserturi', 'Croissant cu ciocolată', 'Copt în fiecare dimineață.', 10.00, TRUE, 'croissant', ''),
    ('Deserturi', 'Clătite cu Nutella', 'Două clătite.', 17.00, TRUE, 'cake-slice', ''),
    ('Deserturi', 'Muffin cu afine', 'Copt în casă.', 11.00, TRUE, 'cake-slice', '')
) AS i(category, name, description, price, available, icon, tags)
JOIN menu_categories c ON lower(c.name) = lower(i.category)
WHERE NOT EXISTS (SELECT 1 FROM menu_items m WHERE lower(m.name) = lower(i.name));

-- Conturi de personal demo. Toate au aceeasi parola de test: Demo-Cafe-2026
-- (hash BCrypt facut cu BCryptPasswordEncoder, ca in aplicatie). Doar pentru baza locala de dezvoltare.
INSERT INTO staff_users (full_name, email, password_hash, role, active, created_at)
SELECT s.full_name, s.email, '$2a$10$GYGtCNOvVBjOAQHygq4K3ug3SCaKg4ZGtug5bwlPDemnHAyjmOFxW', s.role, s.active, now()
FROM (VALUES
    ('Maria Ionescu', 'manager@bgc.test', 'MANAGER', TRUE),
    ('Bogdan Georgescu', 'bogdan.georgescu@bgc.test', 'MANAGER', TRUE),
    ('Andrei Popescu', 'andrei.popescu@bgc.test', 'STAFF', TRUE),
    ('Elena Dumitrescu', 'elena.dumitrescu@bgc.test', 'STAFF', TRUE),
    ('Mihai Stan', 'mihai.stan@bgc.test', 'STAFF', TRUE),
    ('Ioana Marin', 'ioana.marin@bgc.test', 'STAFF', TRUE),
    ('Radu Constantin', 'radu.constantin@bgc.test', 'STAFF', TRUE),
    ('Cristina Pavel', 'cristina.pavel@bgc.test', 'STAFF', FALSE)
) AS s(full_name, email, role, active)
WHERE NOT EXISTS (SELECT 1 FROM staff_users u WHERE lower(u.email) = lower(s.email));

COMMIT;

SELECT 'mese' AS ce, count(*) FROM cafe_tables
UNION ALL SELECT 'categorii jocuri', count(*) FROM game_categories
UNION ALL SELECT 'jocuri', count(*) FROM games
UNION ALL SELECT 'exemplare', count(*) FROM game_copies
UNION ALL SELECT 'categorii meniu', count(*) FROM menu_categories
UNION ALL SELECT 'produse meniu', count(*) FROM menu_items
UNION ALL SELECT 'personal', count(*) FROM staff_users;
