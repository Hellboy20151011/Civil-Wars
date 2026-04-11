CREATE TABLE IF NOT EXISTS spieler (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    passwort_hash TEXT NOT NULL,
    erstellt_am TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    koordinate_x INTEGER,
    koordinate_y INTEGER,
    UNIQUE (koordinate_x, koordinate_y)
);

CREATE TABLE IF NOT EXISTS spieler_ressourcen (
    id SERIAL PRIMARY KEY,
    spieler_id INTEGER NOT NULL UNIQUE REFERENCES spieler(id) ON DELETE CASCADE,
    geld BIGINT NOT NULL DEFAULT 500000,
    stein BIGINT NOT NULL DEFAULT 500,
    eisen BIGINT NOT NULL DEFAULT 200,
    strom BIGINT NOT NULL DEFAULT 100,
    treibstoff BIGINT NOT NULL DEFAULT 50,
    letzte_aktualisierung TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gebaeude_typen (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    kategorie VARCHAR(50) NOT NULL DEFAULT '',
    beschreibung TEXT NOT NULL DEFAULT '',
    kosten_geld BIGINT NOT NULL DEFAULT 0,
    kosten_stein BIGINT NOT NULL DEFAULT 0,
    kosten_eisen BIGINT NOT NULL DEFAULT 0,
    kosten_treibstoff BIGINT NOT NULL DEFAULT 0,
    einkommen_geld BIGINT NOT NULL DEFAULT 0,
    produktion_stein BIGINT NOT NULL DEFAULT 0,
    produktion_eisen BIGINT NOT NULL DEFAULT 0,
    produktion_treibstoff BIGINT NOT NULL DEFAULT 0,
    strom_produktion BIGINT NOT NULL DEFAULT 0,
    strom_verbrauch BIGINT NOT NULL DEFAULT 0,
    bewohner BIGINT NOT NULL DEFAULT 0,
    bauzeit_minuten INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS spieler_gebaeude (
    spieler_id INTEGER NOT NULL REFERENCES spieler(id) ON DELETE CASCADE,
    gebaeude_typ_id INTEGER NOT NULL REFERENCES gebaeude_typen(id) ON DELETE CASCADE,
    anzahl INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (spieler_id, gebaeude_typ_id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS user_sessions_expire_idx ON user_sessions (expire);

INSERT INTO gebaeude_typen (name, kategorie, beschreibung, kosten_geld, kosten_stein, kosten_eisen, kosten_treibstoff, einkommen_geld, produktion_stein, produktion_eisen, produktion_treibstoff, strom_produktion, strom_verbrauch, bewohner, bauzeit_minuten)
VALUES
    ('Hauptgebäude',        'Regierung',  'Das Hauptgebäude ist das erste Gebäude und schaltet weitere Gebäude frei.',                                                                                                                                            0,      0,   0,   0,  0,    0,  0,  0, 10, 0, 0,  0),
    ('Wohnhaus',            'Unterkunft', 'Das Wohnhaus bietet Platz für 4 Bewohner. Für jedes Wohnhaus erhältst du eine Grundmiete von 5.000 €.',                                                                                                               100000, 50,  10,  0,  5000, 0,  0,  0, 0,  1, 4,  6),
    ('Reihenhaus',          'Unterkunft', 'Das Reihenhaus bietet Platz für 12 Bewohner. Für jedes Reihenhaus erhältst du eine Grundmiete von 9.000 €.',                                                                                                          170000, 100, 10,  0,  9000, 0,  0,  0, 0,  2, 12, 8),
    ('Mehrfamilienhaus',    'Unterkunft', 'Das Mehrfamilienhaus bietet Platz für 25 Bewohner. Für jedes Mehrfamilienhaus erhältst du eine Grundmiete von 12.500 €.',                                                                                             230000, 150, 15,  0,  12500,0,  0,  0, 0,  3, 25, 10),
    ('Hochhaus',            'Unterkunft', 'Das Hochhaus bietet Platz für 50 Bewohner. Für jedes Hochhaus erhältst du eine Grundmiete von 17.500 €.',                                                                                                            320000, 200, 20,  0,  17500,0,  0,  0, 0,  4, 50, 12),
    ('Kraftwerk',           'Industrie',  'Das Kraftwerk ist zur Versorgung nahezu sämtlicher Gebäude notwendig!',                                                                                                                                               100000, 50,  20,  0,  0,    0,  0,  0, 50, 0, 0,  5),
    ('Steinbruch',          'Industrie',  'Stein wird zum Bau von Gebäuden benötigt. Jeder Steinbruch produziert pro Tick 75 t Stein.',                                                                                                                          150000, 50,  75,  0,  0,    75, 0,  0, 0,  2, 0,  8),
    ('Metallwerk',          'Industrie',  'Metall wird zum Bau von Gebäuden und zur Produktion von Panzern, Schiffen, Flugzeugen und Verteidigungsanlagen benötigt. Jedes Metallwerk produziert 60 t Eisen.',                                                    150000, 75,  50,  0,  0,    0,  60, 0, 0,  2, 0,  8),
    ('Bohrturm',            'Industrie',  'Der Bohrturm fördert Rohöl, welches in der Öl-Raffinerie zu Treibstoff umgewandelt werden kann. Jeder Bohrturm kann maximal 5 Öl-Raffinerien mit Rohöl versorgen.',                                                  200000, 20,  100, 0,  0,    0,  0,  0, 0,  3, 0,  8),
    ('Öl-Raffinerie',       'Industrie',  'Die Öl-Raffinerie wandelt Rohöl in Treibstoff um. Treibstoff benötigst du zum Angreifen oder Spionieren. Jede Öl-Raffinerie produziert 50 l Treibstoff.',                                                             300000, 100, 100, 0,  0,    0,  0,  50, 0,  3, 0,  8),
    ('Kaserne',             'Militär',    'Dort wird die Infanterie ausgebildet.',                                                                                                                                                                                10000,  100, 50,  20, 0,    0,  0,  0, 0,  6, 0,  15),
    -- Costs and build times for the following buildings are not yet defined in the design spec (placeholder values).
    ('Fahrzeugfabrik',      'Militär',    'Dort werden sämtliche Fahrzeuge produziert.',                                                                                                                                                                          0,      0,   0,   0,  0,    0,  0,  0, 0,  0, 0,  0),
    ('Flughafen',           'Militär',    'Hier werden sämtliche Lufteinheiten gebaut.',                                                                                                                                                                          0,      0,   0,   0,  0,    0,  0,  0, 0,  0, 0,  0),
    ('Schiffswerft',        'Militär',    'Hier werden alle Schiffe gebaut.',                                                                                                                                                                                     0,      0,   0,   0,  0,    0,  0,  0, 0,  0, 0,  0),
    ('Forschungslabor',     'Versorgung', 'Im Forschungslabor werden Forschungen zur Verbesserung durchgeführt. Mit Forschungen können neue Gebäude entsperrt werden.',                                                                                          0,      0,   0,   0,  0,    0,  0,  0, 0,  0, 0,  0),
    ('Bank',                'Regierung',  'In der Bank kann Geld für bestimmte Zeit gelagert werden, um Zinsen zu erhalten. Maximale Summe: 100.000.000 €.',                                                                                                     0,      0,   0,   0,  0,    0,  0,  0, 0,  0, 0,  0),
    ('Geheimdienstzentrum', 'Regierung',  'Das Geheimdienstzentrum dient der Spionage anderer Spieler.',                                                                                                                                                         0,      0,   0,   0,  0,    0,  0,  0, 0,  0, 0,  0)
ON CONFLICT (name) DO UPDATE SET
    kategorie            = EXCLUDED.kategorie,
    beschreibung         = EXCLUDED.beschreibung,
    kosten_geld          = EXCLUDED.kosten_geld,
    kosten_stein         = EXCLUDED.kosten_stein,
    kosten_eisen         = EXCLUDED.kosten_eisen,
    kosten_treibstoff    = EXCLUDED.kosten_treibstoff,
    einkommen_geld       = EXCLUDED.einkommen_geld,
    produktion_stein     = EXCLUDED.produktion_stein,
    produktion_eisen     = EXCLUDED.produktion_eisen,
    produktion_treibstoff= EXCLUDED.produktion_treibstoff,
    strom_produktion     = EXCLUDED.strom_produktion,
    strom_verbrauch      = EXCLUDED.strom_verbrauch,
    bewohner             = EXCLUDED.bewohner,
    bauzeit_minuten      = EXCLUDED.bauzeit_minuten;
