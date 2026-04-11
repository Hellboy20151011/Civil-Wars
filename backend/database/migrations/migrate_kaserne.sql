-- Migration: Kaserne level system, unit types, and player units
-- Implements the Kaserne building with 4 upgradeable levels and infantry training.

-- 1. Add stufe (level) column to spieler_gebaeude if it does not exist yet
ALTER TABLE spieler_gebaeude ADD COLUMN IF NOT EXISTS stufe INTEGER NOT NULL DEFAULT 1;

-- 2. Update Kaserne costs in gebaeude_typen to match Stufe 1 spec
UPDATE gebaeude_typen
SET
    kosten_geld       = 500000,
    kosten_stein      = 150,
    kosten_eisen      = 200,
    kosten_treibstoff = 0,
    strom_verbrauch   = 10
WHERE name = 'Kaserne';

-- 3. Create kaserne_stufen table (upgrade costs per level)
CREATE TABLE IF NOT EXISTS kaserne_stufen (
    stufe             INTEGER PRIMARY KEY,
    kosten_geld       BIGINT  NOT NULL DEFAULT 0,
    kosten_stein      BIGINT  NOT NULL DEFAULT 0,
    kosten_eisen      BIGINT  NOT NULL DEFAULT 0,
    bauzeit_minuten   INTEGER NOT NULL DEFAULT 0
);

INSERT INTO kaserne_stufen (stufe, kosten_geld, kosten_stein, kosten_eisen, bauzeit_minuten)
VALUES
    (1,   500000,   150,   200, 15),
    (2,  1000000,   200,   500, 20),
    (3,  2500000,   500,   800, 30),
    (4, 10000000,  1000,  1500, 45)
ON CONFLICT (stufe) DO UPDATE SET
    kosten_geld     = EXCLUDED.kosten_geld,
    kosten_stein    = EXCLUDED.kosten_stein,
    kosten_eisen    = EXCLUDED.kosten_eisen,
    bauzeit_minuten = EXCLUDED.bauzeit_minuten;

-- 4. Create einheiten_typen table (unit definitions)
CREATE TABLE IF NOT EXISTS einheiten_typen (
    id                  SERIAL  PRIMARY KEY,
    name                VARCHAR(100) NOT NULL UNIQUE,
    kaserne_stufe_min   INTEGER NOT NULL DEFAULT 1,
    angriff             INTEGER NOT NULL DEFAULT 0,
    abwehr              INTEGER NOT NULL DEFAULT 0,
    kosten_geld         BIGINT  NOT NULL DEFAULT 0,
    kosten_stein        BIGINT  NOT NULL DEFAULT 0,
    kosten_eisen        BIGINT  NOT NULL DEFAULT 0,
    reisezeit_minuten   INTEGER NOT NULL DEFAULT 0
);

INSERT INTO einheiten_typen (name, kaserne_stufe_min, angriff, abwehr, kosten_geld, kosten_stein, kosten_eisen, reisezeit_minuten)
VALUES
    ('Panzergrenadier',  1, 3,  3,  20000,  30,  50, 1440),
    ('Kampftaucher',     2, 6,  7,  40000,  60, 120, 1440),
    ('Fallschirmjäger',  3, 13, 10, 75000, 150, 200, 1440),
    ('Elitesoldat',      4, 25, 20, 200000, 300, 500, 1440)
ON CONFLICT (name) DO UPDATE SET
    kaserne_stufe_min = EXCLUDED.kaserne_stufe_min,
    angriff           = EXCLUDED.angriff,
    abwehr            = EXCLUDED.abwehr,
    kosten_geld       = EXCLUDED.kosten_geld,
    kosten_stein      = EXCLUDED.kosten_stein,
    kosten_eisen      = EXCLUDED.kosten_eisen,
    reisezeit_minuten = EXCLUDED.reisezeit_minuten;

-- 5. Create spieler_einheiten table (player units)
CREATE TABLE IF NOT EXISTS spieler_einheiten (
    spieler_id      INTEGER NOT NULL REFERENCES spieler(id) ON DELETE CASCADE,
    einheit_typ_id  INTEGER NOT NULL REFERENCES einheiten_typen(id) ON DELETE CASCADE,
    anzahl          INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (spieler_id, einheit_typ_id)
);
