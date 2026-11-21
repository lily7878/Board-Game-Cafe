-- Date demo pentru dezvoltare: mese, categorii de jocuri, jocuri, exemplare si meniu.
-- Se poate rula de oricate ori: nu dubleaza nimic si nu modifica randurile existente.
-- Nu este o migrare Flyway, deci nu ajunge automat in nicio alta baza de date.
-- Rulare: powershell -ExecutionPolicy Bypass -File .\scripts\seed-dev-data.ps1

SET client_encoding = 'UTF8';
BEGIN;

-- Mese
INSERT INTO cafe_tables (table_number, capacity, active, created_at)
SELECT n, cap, TRUE, now()
FROM (VALUES (1, 4), (2, 4), (3, 6), (4, 2), (5, 8), (6, 4)) AS t(n, cap)
WHERE NOT EXISTS (SELECT 1 FROM cafe_tables WHERE table_number = t.n);

-- Categorii de jocuri ("Cooperativ" e folosita si de recomandari pentru atmosfera "Jucam in echipa")
INSERT INTO game_categories (name, description, active) VALUES
    ('Strategie', 'Planificare si decizii pe termen lung.', TRUE),
    ('Cooperativ', 'Toti jucatorii castiga sau pierd impreuna.', TRUE),
    ('Party', 'Jocuri rapide pentru grupuri mari, cu multe rasete.', TRUE),
    ('Familie', 'Reguli simple, potrivite pentru toate varstele.', TRUE),
    ('Abstract', 'Fara poveste, doar forme, culori si logica.', TRUE),
    ('Carti', 'Jocuri jucate in principal cu carti.', TRUE)
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
        'Fiecare alege 2 cărți pe rundă; inițiativa decide ordinea. Scenarii cu obiective.', 1, 4, 90, 120, 14, 'HARD')
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
    ('Gloomhaven: Jaws of the Lion', 'Cooperativ'), ('Gloomhaven: Jaws of the Lion', 'Strategie')
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
    ('Gloomhaven: Jaws of the Lion', 'BG-GH-1', 'USABLE', NULL)
) AS c(title, code, status, notes)
JOIN games g ON lower(g.title) = lower(c.title)
ON CONFLICT (inventory_code) DO NOTHING;

-- Meniu
INSERT INTO menu_categories (name, description, active, sort_order) VALUES
    ('Cafea', 'Espresso și băuturi pe bază de cafea.', TRUE, 1),
    ('Băuturi reci', 'Răcoritoare, limonade și apă.', TRUE, 2),
    ('Ceai', 'Ceaiuri la plic și infuzii.', TRUE, 3),
    ('Gustări', 'Ceva de ronțăit în timpul jocului.', TRUE, 4),
    ('Deserturi', 'Prăjituri și dulciuri.', TRUE, 5)
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
    ('Deserturi', 'Înghețată', 'Două cupe, vanilie și ciocolată.', 13.00, TRUE, 'ice-cream-cone', '')
) AS i(category, name, description, price, available, icon, tags)
JOIN menu_categories c ON lower(c.name) = lower(i.category)
WHERE NOT EXISTS (SELECT 1 FROM menu_items m WHERE lower(m.name) = lower(i.name));

COMMIT;

SELECT 'mese' AS ce, count(*) FROM cafe_tables
UNION ALL SELECT 'categorii jocuri', count(*) FROM game_categories
UNION ALL SELECT 'jocuri', count(*) FROM games
UNION ALL SELECT 'exemplare', count(*) FROM game_copies
UNION ALL SELECT 'categorii meniu', count(*) FROM menu_categories
UNION ALL SELECT 'produse meniu', count(*) FROM menu_items;
