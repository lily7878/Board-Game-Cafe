-- Alignment with the FE design handoff v1.

-- Menu categories are ordered by the manager (participant menu and admin lists follow this order).
ALTER TABLE menu_categories ADD COLUMN sort_order INTEGER;
UPDATE menu_categories category SET sort_order = ranked.position
FROM (SELECT id, row_number() OVER (ORDER BY lower(name), id) AS position FROM menu_categories) ranked
WHERE category.id = ranked.id;
ALTER TABLE menu_categories ALTER COLUMN sort_order SET NOT NULL;
ALTER TABLE menu_categories ADD CONSTRAINT chk_menu_category_sort_order CHECK (sort_order >= 0);

-- Products have a thematic icon (Lucide name, no photos in v1) and short informative tags
-- such as "Conține lactoză", stored as a '|' separated list.
ALTER TABLE menu_items ADD COLUMN icon VARCHAR(40) NOT NULL DEFAULT 'coffee';
ALTER TABLE menu_items ADD COLUMN tags VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE menu_items ADD CONSTRAINT chk_menu_item_icon CHECK (icon ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Game duration is shown as a range ("60–120 min"); duration_minutes stays the minimum.
ALTER TABLE games ADD COLUMN max_duration_minutes INTEGER;
ALTER TABLE games ADD CONSTRAINT chk_games_max_duration
    CHECK (max_duration_minutes IS NULL OR max_duration_minutes >= duration_minutes);
