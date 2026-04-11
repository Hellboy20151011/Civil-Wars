-- Migration: Add bauzeit_minuten, fix categories/descriptions, add missing buildings,
--            remove legacy buildings not in the current design spec.

-- 1. Add bauzeit_minuten column if it does not exist yet
ALTER TABLE gebaeude_typen ADD COLUMN IF NOT EXISTS bauzeit_minuten INTEGER NOT NULL DEFAULT 0;

-- 2. Fix Hauptgebäude: move from 'Basis' to 'Regierung' and add description
UPDATE gebaeude_typen
SET
    kategorie    = 'Regierung',
    beschreibung = 'Das Hauptgebäude ist das erste Gebäude und schaltet weitere Gebäude frei.'
WHERE name = 'Hauptgebäude';

-- 3. Fix Kaserne: add description
UPDATE gebaeude_typen
SET beschreibung = 'Dort wird die Infanterie ausgebildet.'
WHERE name = 'Kaserne';

-- 4. Fix Bohrturm: extend description with the 5-refinery limit
UPDATE gebaeude_typen
SET beschreibung = 'Der Bohrturm fördert Rohöl, welches in der Öl-Raffinerie zu Treibstoff umgewandelt werden kann. Jeder Bohrturm kann maximal 5 Öl-Raffinerien mit Rohöl versorgen.'
WHERE name = 'Bohrturm';

-- 5. Add beschreibung to Unterkunft buildings
UPDATE gebaeude_typen
SET beschreibung = 'Das Wohnhaus bietet Platz für 4 Bewohner. Für jedes Wohnhaus erhältst du eine Grundmiete von 5.000 €.'
WHERE name = 'Wohnhaus' AND beschreibung = '';

UPDATE gebaeude_typen
SET beschreibung = 'Das Reihenhaus bietet Platz für 12 Bewohner. Für jedes Reihenhaus erhältst du eine Grundmiete von 9.000 €.'
WHERE name = 'Reihenhaus' AND beschreibung = '';

UPDATE gebaeude_typen
SET beschreibung = 'Das Mehrfamilienhaus bietet Platz für 25 Bewohner. Für jedes Mehrfamilienhaus erhältst du eine Grundmiete von 12.500 €.'
WHERE name = 'Mehrfamilienhaus' AND beschreibung = '';

UPDATE gebaeude_typen
SET beschreibung = 'Das Hochhaus bietet Platz für 50 Bewohner. Für jedes Hochhaus erhältst du eine Grundmiete von 17.500 €.'
WHERE name = 'Hochhaus' AND beschreibung = '';

-- 6. Set bauzeit_minuten for all buildings with specified build times
UPDATE gebaeude_typen SET bauzeit_minuten = 5  WHERE name = 'Kraftwerk';
UPDATE gebaeude_typen SET bauzeit_minuten = 6  WHERE name = 'Wohnhaus';
UPDATE gebaeude_typen SET bauzeit_minuten = 8  WHERE name = 'Reihenhaus';
UPDATE gebaeude_typen SET bauzeit_minuten = 8  WHERE name = 'Steinbruch';
UPDATE gebaeude_typen SET bauzeit_minuten = 8  WHERE name = 'Metallwerk';
UPDATE gebaeude_typen SET bauzeit_minuten = 8  WHERE name = 'Bohrturm';
UPDATE gebaeude_typen SET bauzeit_minuten = 8  WHERE name = 'Öl-Raffinerie';
UPDATE gebaeude_typen SET bauzeit_minuten = 10 WHERE name = 'Mehrfamilienhaus';
UPDATE gebaeude_typen SET bauzeit_minuten = 12 WHERE name = 'Hochhaus';
UPDATE gebaeude_typen SET bauzeit_minuten = 15 WHERE name = 'Kaserne';

-- 7. Remove legacy buildings that are not part of the current design spec
--    (ON DELETE CASCADE in spieler_gebaeude will clean up player data automatically)
DELETE FROM gebaeude_typen WHERE name IN ('Mine', 'Eisenhütte', 'Marktplatz');

-- 8. Add missing Militär buildings
INSERT INTO gebaeude_typen (name, kategorie, beschreibung, kosten_geld, kosten_stein, kosten_eisen, kosten_treibstoff, einkommen_geld, produktion_stein, produktion_eisen, produktion_treibstoff, strom_produktion, strom_verbrauch, bewohner, bauzeit_minuten)
VALUES
    ('Fahrzeugfabrik',      'Militär',    'Dort werden sämtliche Fahrzeuge produziert.',                                                                   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Flughafen',           'Militär',    'Hier werden sämtliche Lufteinheiten gebaut.',                                                                   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Schiffswerft',        'Militär',    'Hier werden alle Schiffe gebaut.',                                                                              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
ON CONFLICT (name) DO UPDATE SET
    kategorie    = EXCLUDED.kategorie,
    beschreibung = EXCLUDED.beschreibung;

-- 9. Add missing Versorgung building
INSERT INTO gebaeude_typen (name, kategorie, beschreibung, kosten_geld, kosten_stein, kosten_eisen, kosten_treibstoff, einkommen_geld, produktion_stein, produktion_eisen, produktion_treibstoff, strom_produktion, strom_verbrauch, bewohner, bauzeit_minuten)
VALUES
    ('Forschungslabor',     'Versorgung', 'Im Forschungslabor werden Forschungen zur Verbesserung durchgeführt. Mit Forschungen können neue Gebäude entsperrt werden.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
ON CONFLICT (name) DO UPDATE SET
    kategorie    = EXCLUDED.kategorie,
    beschreibung = EXCLUDED.beschreibung;

-- 10. Add missing Regierung buildings
INSERT INTO gebaeude_typen (name, kategorie, beschreibung, kosten_geld, kosten_stein, kosten_eisen, kosten_treibstoff, einkommen_geld, produktion_stein, produktion_eisen, produktion_treibstoff, strom_produktion, strom_verbrauch, bewohner, bauzeit_minuten)
VALUES
    ('Bank',                'Regierung',  'In der Bank kann Geld für bestimmte Zeit gelagert werden, um Zinsen zu erhalten. Maximale Summe: 100.000.000 €.', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    ('Geheimdienstzentrum', 'Regierung',  'Das Geheimdienstzentrum dient der Spionage anderer Spieler.',                                                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
ON CONFLICT (name) DO UPDATE SET
    kategorie    = EXCLUDED.kategorie,
    beschreibung = EXCLUDED.beschreibung;
