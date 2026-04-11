-- Migration: Add bewohner column to gebaeude_typen
ALTER TABLE gebaeude_typen ADD COLUMN IF NOT EXISTS bewohner BIGINT NOT NULL DEFAULT 0;

-- Update housing buildings with resident counts
UPDATE gebaeude_typen SET bewohner = 4  WHERE name = 'Wohnhaus';
UPDATE gebaeude_typen SET bewohner = 12 WHERE name = 'Reihenhaus';
UPDATE gebaeude_typen SET bewohner = 25 WHERE name = 'Mehrfamilienhaus';
UPDATE gebaeude_typen SET bewohner = 50 WHERE name = 'Hochhaus';
