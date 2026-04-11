-- Migration: Add fabrik_typ column to einheiten_typen and add Fahrzeugfabrik units
-- This allows units to be associated with a specific military building type.

-- 1. Add fabrik_typ column if not exists (defaults to 'Kaserne' for backward compatibility)
ALTER TABLE einheiten_typen
    ADD COLUMN IF NOT EXISTS fabrik_typ VARCHAR(100) NOT NULL DEFAULT 'Kaserne';

-- 2. Update existing units to have explicit fabrik_typ = 'Kaserne'
UPDATE einheiten_typen SET fabrik_typ = 'Kaserne'
WHERE name IN ('Panzergrenadier', 'Kampftaucher', 'Fallschirmjäger', 'Elitesoldat');

-- 3. Add Fahrzeugfabrik units
INSERT INTO einheiten_typen (name, kaserne_stufe_min, angriff, abwehr, kosten_geld, kosten_stein, kosten_eisen, reisezeit_minuten, fabrik_typ)
VALUES
    ('Geländewagen',   0,  4,  3,  30000, 20,  80, 1440, 'Fahrzeugfabrik'),
    ('Schützenpanzer', 0, 10, 12,  80000, 50, 200, 1440, 'Fahrzeugfabrik'),
    ('Kampfpanzer',    0, 22, 25, 200000, 100, 500, 1440, 'Fahrzeugfabrik')
ON CONFLICT (name) DO UPDATE SET
    kaserne_stufe_min = EXCLUDED.kaserne_stufe_min,
    angriff           = EXCLUDED.angriff,
    abwehr            = EXCLUDED.abwehr,
    kosten_geld       = EXCLUDED.kosten_geld,
    kosten_stein      = EXCLUDED.kosten_stein,
    kosten_eisen      = EXCLUDED.kosten_eisen,
    reisezeit_minuten = EXCLUDED.reisezeit_minuten,
    fabrik_typ        = EXCLUDED.fabrik_typ;
