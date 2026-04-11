-- Migration: Add beschreibung column and introduce Industrie buildings

-- 1. Add beschreibung column if it does not exist yet
ALTER TABLE gebaeude_typen ADD COLUMN IF NOT EXISTS beschreibung TEXT NOT NULL DEFAULT '';

-- 2. Move Kraftwerk from Versorgung to Industrie and update its stats
UPDATE gebaeude_typen
SET
    kategorie         = 'Industrie',
    beschreibung      = 'Das Kraftwerk ist zur Versorgung nahezu sämtlicher Gebäude notwendig!',
    kosten_geld       = 100000,
    kosten_stein      = 50,
    kosten_eisen      = 20,
    kosten_treibstoff = 0,
    einkommen_geld    = 0,
    produktion_stein  = 0,
    produktion_eisen  = 0,
    produktion_treibstoff = 0,
    strom_produktion  = 50,
    strom_verbrauch   = 0
WHERE name = 'Kraftwerk';

-- 3. Insert new Industrie buildings (skip if already present)
INSERT INTO gebaeude_typen (name, kategorie, beschreibung, kosten_geld, kosten_stein, kosten_eisen, kosten_treibstoff, einkommen_geld, produktion_stein, produktion_eisen, produktion_treibstoff, strom_produktion, strom_verbrauch, bewohner)
VALUES
    ('Steinbruch',
     'Industrie',
     'Stein wird zum Bau von Gebäuden benötigt. Jeder Steinbruch produziert pro Tick 75 t Stein.',
     150000, 50, 75, 0, 0, 75, 0, 0, 0, 2, 0),

    ('Metallwerk',
     'Industrie',
     'Metall wird zum Bau von Gebäuden und zur Produktion von Panzern, Schiffen, Flugzeugen und Verteidigungsanlagen benötigt. Jedes Metallwerk produziert 60 t Eisen.',
     150000, 75, 50, 0, 0, 0, 60, 0, 0, 2, 0),

    ('Bohrturm',
     'Industrie',
     'Der Bohrturm fördert Rohöl, welches in der Öl-Raffinerie zu Treibstoff umgewandelt werden kann.',
     200000, 20, 100, 0, 0, 0, 0, 0, 0, 3, 0),

    ('Öl-Raffinerie',
     'Industrie',
     'Die Öl-Raffinerie wandelt Rohöl in Treibstoff um. Treibstoff benötigst du zum Angreifen oder Spionieren. Jede Öl-Raffinerie produziert 50 l Treibstoff.',
     300000, 100, 100, 0, 0, 0, 0, 50, 0, 3, 0)
ON CONFLICT (name) DO UPDATE SET
    kategorie             = EXCLUDED.kategorie,
    beschreibung          = EXCLUDED.beschreibung,
    kosten_geld           = EXCLUDED.kosten_geld,
    kosten_stein          = EXCLUDED.kosten_stein,
    kosten_eisen          = EXCLUDED.kosten_eisen,
    kosten_treibstoff     = EXCLUDED.kosten_treibstoff,
    einkommen_geld        = EXCLUDED.einkommen_geld,
    produktion_stein      = EXCLUDED.produktion_stein,
    produktion_eisen      = EXCLUDED.produktion_eisen,
    produktion_treibstoff = EXCLUDED.produktion_treibstoff,
    strom_produktion      = EXCLUDED.strom_produktion,
    strom_verbrauch       = EXCLUDED.strom_verbrauch,
    bewohner              = EXCLUDED.bewohner;
