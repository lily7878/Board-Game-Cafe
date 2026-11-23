-- Istoric demo: 14 zile de lucru FINALIZATE cu sesiuni inchise, participanti, comenzi, cereri de jocuri,
-- plati si rapoartele de sfarsit de zi (calculate ca in DayFiguresCalculator).
-- Zilele existente sunt renumerotate dupa istoric (ex. "Ziua 1" devine "Ziua 15"), ca ordinea sa ramana
-- cronologica. Ziua deschisa primeste si cateva sesiuni deja inchise, ca sa nu fie goala.
-- Ruleaza dupa seed-dev-data.sql (are nevoie de mese, jocuri, exemplare, meniu si personal).
-- Se aplica o singura data: daca istoricul exista deja (sesiuni "seed-"), nu face nimic.
-- Rulare: powershell -ExecutionPolicy Bypass -File .\scripts\seed-dev-data.ps1

SET client_encoding = 'UTF8';
BEGIN;

-- Sesiunile inchise ale unei zile: fiecare masa activa are 0..4 sesiuni care nu se suprapun.
-- p_busy = sansa ca masa sa fie ocupata intr-un interval; p_from / p_until = fereastra zilei.
CREATE FUNCTION pg_temp.seed_sessions(p_day_id BIGINT, p_from TIMESTAMPTZ, p_until TIMESTAMPTZ, p_busy NUMERIC)
RETURNS VOID LANGUAGE plpgsql AS $fn$
DECLARE
    names TEXT[] := ARRAY['Ana', 'Andrei', 'Ioana', 'Mihai', 'Elena', 'Vlad', 'Maria', 'Alex', 'Diana', 'Radu',
        'Bianca', 'Cristi', 'Larisa', 'Tudor', 'Irina', 'Paul', 'Raluca', 'Stefan', 'Teodora', 'Matei',
        'Sorina', 'Darius', 'Oana', 'Victor', 'Carmen', 'Sebi', 'Alina', 'George', 'Roxana', 'Luca'];
    staff_ids BIGINT[] := ARRAY(SELECT id FROM staff_users ORDER BY id);
    -- Popularitate: jocurile si produsele de la inceputul listei sunt alese mai des.
    game_ids BIGINT[] := ARRAY(
        SELECT g.id FROM games g
        WHERE g.active AND EXISTS (SELECT 1 FROM game_copies c WHERE c.game_id = g.id AND c.condition_status = 'USABLE')
        ORDER BY array_position(ARRAY['Catan', 'Codenames', 'Dixit', 'Ticket to Ride', 'Sushi Go!', 'King of Tokyo',
            'Azul', 'Exploding Kittens', 'Dobble', 'Carcassonne', 'Just One', 'Splendor', 'Pandemic'], g.title)
            NULLS LAST, md5(g.title));
    item_ids BIGINT[] := ARRAY(
        SELECT m.id FROM menu_items m
        WHERE m.active AND m.available
        ORDER BY (m.tags LIKE '%Popular%') DESC, md5(m.name));
    fee NUMERIC(10, 2) := (SELECT access_fee_price FROM cafe_settings WHERE id = 1);
    t RECORD;
    cur TIMESTAMPTZ; s_end TIMESTAMPTZ; ts TIMESTAMPTZ;
    sid BIGINT; ord_id BIGINT; pid BIGINT; copy_id BIGINT; g_id BIGINT; item_id BIGINT;
    parts BIGINT[];
    people INT; n_part INT; n_orders INT; n_lines INT; n_req INT; accepted INT; i INT; j INT;
    r DOUBLE PRECISION; menu_total NUMERIC(10, 2); payer BIGINT;
BEGIN
    FOR t IN SELECT ct.id, ct.capacity FROM cafe_tables ct
            WHERE ct.active AND NOT EXISTS (SELECT 1 FROM table_sessions o
                WHERE o.table_id = ct.id AND o.status <> 'CLOSED' AND o.started_at < p_until)
            ORDER BY ct.table_number LOOP
        cur := p_from + make_interval(mins => floor(random() * 60)::INT);
        LOOP
            IF random() > p_busy THEN  -- masa sta libera o vreme
                cur := cur + make_interval(mins => 45 + floor(random() * 90)::INT);
                EXIT WHEN cur > p_until - INTERVAL '70 minutes';
                CONTINUE;
            END IF;
            s_end := cur + make_interval(mins => 70 + floor(random() * 170)::INT);
            EXIT WHEN s_end > p_until;

            INSERT INTO table_sessions (table_id, status, join_token_digest, pin_hash, failed_join_attempts,
                started_at, closed_at, opened_by_id, business_day_id, access_fee_unit_price, fees_locked, version)
            VALUES (t.id, 'CLOSED', 'seed-' || md5(random()::TEXT || t.id || cur), '$2a$10$seed.demo.session.no.pin',
                0, cur, s_end, staff_ids[1 + floor(random() * array_length(staff_ids, 1))::INT], p_day_id, fee, TRUE, 3)
            RETURNING id INTO sid;

            -- Oamenii de la masa; nu toti intra cu telefonul.
            people := least(t.capacity, greatest(1, 2 + floor(random() * (t.capacity - 1))::INT));
            n_part := greatest(1, people - floor(random() * 2)::INT);
            parts := ARRAY[]::BIGINT[];
            FOR i IN 1..n_part LOOP
                INSERT INTO session_participants (session_id, display_name, access_token_hash, active, joined_at)
                VALUES (sid, names[1 + floor(random() * array_length(names, 1))::INT],
                    md5(random()::TEXT || sid || i) || md5(random()::TEXT || i || sid), TRUE,
                    cur + make_interval(mins => floor(random() * 12)::INT, secs => floor(random() * 60)::INT))
                RETURNING id INTO pid;
                parts := parts || pid;
            END LOOP;

            INSERT INTO session_fees (session_id, quantity, updated_at, updated_by_participant_id)
            VALUES (sid, people, cur + INTERVAL '6 minutes', parts[1]);

            -- Cereri de jocuri: majoritatea livrate si returnate, cateva respinse sau anulate.
            n_req := floor(random() * 3)::INT + CASE WHEN random() < 0.85 THEN 1 ELSE 0 END;
            FOR i IN 1..n_req LOOP
                g_id := game_ids[1 + floor(power(random(), 1.7) * array_length(game_ids, 1))::INT];
                ts := cur + make_interval(mins => 5 + floor(random() * greatest(1, EXTRACT(EPOCH FROM s_end - cur) / 60 - 45))::INT);
                pid := parts[1 + floor(random() * n_part)::INT];
                r := random();
                IF r < 0.82 THEN
                    SELECT c.id INTO copy_id FROM game_copies c
                    WHERE c.game_id = g_id AND c.condition_status = 'USABLE'
                    ORDER BY random() LIMIT 1;
                    INSERT INTO game_requests (session_id, participant_id, game_id, game_copy_id, status, requested_at,
                        reserved_at, delivered_at, returned_at, processed_by_id, version)
                    VALUES (sid, pid, g_id, copy_id, 'RETURNED', ts, ts + INTERVAL '2 minutes',
                        ts + INTERVAL '5 minutes', least(s_end - INTERVAL '3 minutes', ts + make_interval(mins => 35 + floor(random() * 80)::INT)),
                        staff_ids[1 + floor(random() * array_length(staff_ids, 1))::INT], 3);
                ELSIF r < 0.91 THEN
                    INSERT INTO game_requests (session_id, participant_id, game_id, status, requested_at, cancelled_at,
                        resolution_reason, processed_by_id, version)
                    VALUES (sid, pid, g_id, 'REJECTED', ts, ts + INTERVAL '3 minutes',
                        'Toate exemplarele sunt la alte mese.', staff_ids[1 + floor(random() * array_length(staff_ids, 1))::INT], 1);
                ELSE
                    INSERT INTO game_requests (session_id, participant_id, game_id, status, requested_at, cancelled_at, version)
                    VALUES (sid, pid, g_id, 'CANCELLED', ts, ts + INTERVAL '1 minute', 1);
                END IF;
            END LOOP;

            -- Comenzi: livrate in general, unele anulate de client, rar un produs respins.
            n_orders := floor(random() * (n_part + 2))::INT;
            FOR i IN 1..n_orders LOOP
                ts := cur + make_interval(mins => 4 + floor(random() * greatest(1, EXTRACT(EPOCH FROM s_end - cur) / 60 - 35))::INT);
                INSERT INTO food_orders (session_id, participant_id, status, placed_at, version)
                VALUES (sid, parts[1 + floor(random() * n_part)::INT], 'PLACED', ts, 0)
                RETURNING id INTO ord_id;

                n_lines := 1 + floor(power(random(), 1.5) * 3)::INT;
                accepted := 0;
                FOR j IN 1..n_lines LOOP
                    item_id := item_ids[1 + floor(power(random(), 1.6) * array_length(item_ids, 1))::INT];
                    CONTINUE WHEN EXISTS (SELECT 1 FROM order_items WHERE order_id = ord_id AND menu_item_id = item_id);
                    IF random() < 0.05 THEN
                        INSERT INTO order_items (order_id, menu_item_id, product_name_snapshot, quantity, unit_price, status, rejection_reason)
                        SELECT ord_id, m.id, m.name, 1, m.price, 'REJECTED', 'Stoc epuizat.' FROM menu_items m WHERE m.id = item_id;
                    ELSE
                        INSERT INTO order_items (order_id, menu_item_id, product_name_snapshot, quantity, unit_price, status)
                        SELECT ord_id, m.id, m.name, CASE WHEN random() < 0.22 THEN 2 ELSE 1 END, m.price, 'ACCEPTED'
                        FROM menu_items m WHERE m.id = item_id;
                        accepted := accepted + 1;
                    END IF;
                END LOOP;

                IF random() < 0.07 THEN
                    UPDATE order_items SET status = 'PENDING', rejection_reason = NULL WHERE order_id = ord_id;
                    UPDATE food_orders SET status = 'CANCELLED', cancellation_reason = 'CUSTOMER_CANCELLED',
                        cancelled_at = ts + INTERVAL '1 minute', version = 1 WHERE id = ord_id;
                ELSIF accepted = 0 THEN
                    UPDATE food_orders SET status = 'CANCELLED', cancellation_reason = 'ALL_ITEMS_REJECTED',
                        accepted_at = NULL, cancelled_at = ts + INTERVAL '3 minutes',
                        processed_by_id = staff_ids[1 + floor(random() * array_length(staff_ids, 1))::INT], version = 1
                    WHERE id = ord_id;
                ELSE
                    UPDATE food_orders SET status = 'DELIVERED',
                        processed_by_id = staff_ids[1 + floor(random() * array_length(staff_ids, 1))::INT],
                        accepted_at = ts + INTERVAL '2 minutes',
                        ready_at = ts + make_interval(mins => 8 + floor(random() * 12)::INT),
                        delivered_at = ts + make_interval(mins => 22 + floor(random() * 6)::INT),
                        version = 4
                    WHERE id = ord_id;
                END IF;
            END LOOP;

            -- Plata intregii note: produse acceptate din comenzi livrate + taxa de acces.
            SELECT coalesce(sum(oi.quantity * oi.unit_price), 0) INTO menu_total
            FROM order_items oi JOIN food_orders fo ON fo.id = oi.order_id
            WHERE fo.session_id = sid AND fo.status = 'DELIVERED' AND oi.status = 'ACCEPTED';
            payer := parts[1 + floor(random() * n_part)::INT];
            IF random() < 0.06 THEN
                INSERT INTO payments (session_id, initiated_by_id, amount, status, method, idempotency_key, created_at,
                    completed_at, failure_reason)
                VALUES (sid, payer, menu_total + people * fee, 'FAILED', 'SIMULATED', gen_random_uuid(),
                    s_end - INTERVAL '4 minutes', s_end - INTERVAL '4 minutes', 'Plata a fost refuzată (simulare).');
            END IF;
            INSERT INTO payments (session_id, initiated_by_id, amount, status, method, idempotency_key, created_at, completed_at)
            VALUES (sid, payer, menu_total + people * fee, 'SUCCEEDED', 'SIMULATED', gen_random_uuid(),
                s_end - INTERVAL '1 minute', s_end);

            cur := s_end + make_interval(mins => 10 + floor(random() * 75)::INT);
        END LOOP;
    END LOOP;
END
$fn$;

-- Raportul de sfarsit de zi, cu aceleasi reguli ca DayFiguresCalculator / DayStatisticsRepository.
CREATE FUNCTION pg_temp.seed_report(p_day_id BIGINT, p_at TIMESTAMPTZ)
RETURNS VOID LANGUAGE plpgsql AS $fn$
DECLARE
    rid BIGINT;
BEGIN
    INSERT INTO daily_reports (business_day_id, total_revenue, menu_revenue, access_fee_revenue, closed_sessions_count,
        delivered_orders_count, products_sold_count, games_delivered_count, generated_at)
    SELECT p_day_id,
        (SELECT coalesce(sum(p.amount), 0) FROM payments p JOIN table_sessions s ON s.id = p.session_id
            WHERE s.business_day_id = p_day_id AND p.status = 'SUCCEEDED'),
        (SELECT coalesce(sum(oi.quantity * oi.unit_price), 0) FROM order_items oi
            JOIN food_orders fo ON fo.id = oi.order_id JOIN table_sessions s ON s.id = fo.session_id
            WHERE s.business_day_id = p_day_id AND s.status = 'CLOSED' AND fo.status = 'DELIVERED' AND oi.status = 'ACCEPTED'),
        (SELECT coalesce(sum(f.quantity * s.access_fee_unit_price), 0) FROM session_fees f
            JOIN table_sessions s ON s.id = f.session_id WHERE s.business_day_id = p_day_id AND s.status = 'CLOSED'),
        (SELECT count(*) FROM table_sessions s WHERE s.business_day_id = p_day_id AND s.status = 'CLOSED'),
        (SELECT count(*) FROM food_orders fo JOIN table_sessions s ON s.id = fo.session_id
            WHERE s.business_day_id = p_day_id AND s.status = 'CLOSED' AND fo.status = 'DELIVERED'),
        (SELECT coalesce(sum(oi.quantity), 0) FROM order_items oi
            JOIN food_orders fo ON fo.id = oi.order_id JOIN table_sessions s ON s.id = fo.session_id
            WHERE s.business_day_id = p_day_id AND s.status = 'CLOSED' AND fo.status = 'DELIVERED' AND oi.status = 'ACCEPTED'),
        (SELECT count(*) FROM game_requests gr JOIN table_sessions s ON s.id = gr.session_id
            WHERE s.business_day_id = p_day_id AND gr.delivered_at IS NOT NULL),
        p_at
    RETURNING id INTO rid;

    INSERT INTO daily_product_stats (report_id, menu_item_id, product_name_snapshot, quantity_sold, revenue)
    SELECT rid, m.id, m.name, sum(oi.quantity), sum(oi.quantity * oi.unit_price)
    FROM order_items oi JOIN food_orders fo ON fo.id = oi.order_id JOIN table_sessions s ON s.id = fo.session_id
    JOIN menu_items m ON m.id = oi.menu_item_id
    WHERE s.business_day_id = p_day_id AND s.status = 'CLOSED' AND fo.status = 'DELIVERED' AND oi.status = 'ACCEPTED'
    GROUP BY m.id, m.name;

    INSERT INTO daily_game_stats (report_id, game_id, game_title_snapshot, times_requested, times_delivered)
    SELECT rid, g.id, g.title, count(*), count(gr.delivered_at)
    FROM game_requests gr JOIN table_sessions s ON s.id = gr.session_id JOIN games g ON g.id = gr.game_id
    WHERE s.business_day_id = p_day_id
    GROUP BY g.id, g.title;
END
$fn$;

DO $$
DECLARE
    history_days CONSTANT INT := 14;
    tz CONSTANT TEXT := 'Europe/Bucharest';
    first_date DATE;
    managers BIGINT[];
    d DATE; day_id BIGINT; open_day RECORD; busy NUMERIC; window_end TIMESTAMPTZ;
BEGIN
    IF EXISTS (SELECT 1 FROM table_sessions WHERE join_token_digest LIKE 'seed-%') THEN
        RAISE NOTICE 'Istoricul demo exista deja; nu adaug nimic.';
        RETURN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM staff_users WHERE role = 'MANAGER' AND active) OR NOT EXISTS (SELECT 1 FROM menu_items)
            OR NOT EXISTS (SELECT 1 FROM game_copies) THEN
        RAISE EXCEPTION 'Ruleaza mai intai seed-dev-data.sql (lipsesc manageri, meniu sau exemplare).';
    END IF;

    PERFORM setseed(0.2026);
    managers := ARRAY(SELECT id FROM staff_users WHERE role = 'MANAGER' AND active ORDER BY id);
    first_date := (SELECT (min(opened_at) AT TIME ZONE tz)::DATE FROM business_days);

    -- Zilele existente trec dupa istoric (in doi pasi, ca indexul unic pe day_number sa nu se loveasca).
    UPDATE business_days SET day_number = day_number + 100000;
    UPDATE business_days SET day_number = day_number - 100000 + history_days,
        label = CASE WHEN label = 'Ziua ' || (day_number - 100000) THEN 'Ziua ' || (day_number - 100000 + history_days)
                     ELSE label END;

    FOR n IN 1..history_days LOOP
        d := first_date - (history_days - n + 1);
        busy := CASE EXTRACT(ISODOW FROM d) WHEN 6 THEN 0.75 WHEN 7 THEN 0.65 WHEN 5 THEN 0.45 ELSE 0.22 END;
        INSERT INTO business_days (day_number, label, status, opened_at, finalized_at, finalized_by_id, version)
        VALUES (n, 'Ziua ' || n, 'FINALIZED', (d + TIME '09:40') AT TIME ZONE tz, (d + TIME '23:05') AT TIME ZONE tz,
            managers[1 + floor(random() * array_length(managers, 1))::INT], 1)
        RETURNING id INTO day_id;
        PERFORM pg_temp.seed_sessions(day_id, (d + TIME '10:00') AT TIME ZONE tz, (d + TIME '22:45') AT TIME ZONE tz, busy);
        PERFORM pg_temp.seed_report(day_id, (d + TIME '23:05') AT TIME ZONE tz);
    END LOOP;

    -- Ziua deschisa: cateva sesiuni deja platite si inchise, pe intervalul de ieri (daca ziua era deschisa atunci).
    SELECT id, opened_at INTO open_day FROM business_days WHERE status = 'OPEN';
    d := (now() AT TIME ZONE tz)::DATE - 1;
    IF open_day.id IS NOT NULL AND (d + TIME '12:00') AT TIME ZONE tz >= open_day.opened_at THEN
        window_end := least((d + TIME '22:45') AT TIME ZONE tz, now() - INTERVAL '30 minutes');
        PERFORM pg_temp.seed_sessions(open_day.id, (d + TIME '12:00') AT TIME ZONE tz, window_end, 0.2);
    END IF;
END
$$;

COMMIT;

SELECT d.day_number AS zi, d.label, d.status, to_char(d.opened_at AT TIME ZONE 'Europe/Bucharest', 'Dy DD.MM') AS data,
    (SELECT count(*) FROM table_sessions s WHERE s.business_day_id = d.id AND s.status = 'CLOSED') AS sesiuni_inchise,
    r.total_revenue AS incasari
FROM business_days d LEFT JOIN daily_reports r ON r.business_day_id = d.id
ORDER BY d.day_number;
