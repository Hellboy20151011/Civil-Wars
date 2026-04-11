CREATE TABLE IF NOT EXISTS spieler (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    passwort_hash TEXT NOT NULL,
    erstellt_am TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    bewohner BIGINT NOT NULL DEFAULT 0
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

INSERT INTO gebaeude_typen (name, kategorie, beschreibung, kosten_geld, kosten_stein, kosten_eisen, kosten_treibstoff, einkommen_geld, produktion_stein, produktion_eisen, produktion_treibstoff, strom_produktion, strom_verbrauch, bewohner)
VALUES
    ('Hauptgebäude',    'Basis',      '',                                                                                                                                                                                                                      0,      0,   0,   0,  0,    0,  0,  0, 10, 0, 0),
    ('Mine',            'Produktion', '',                                                                                                                                                                                                                      3000,   30,  10,  0,  0,    5,  0,  0, 0,  3, 0),
    ('Eisenhütte',      'Produktion', '',                                                                                                                                                                                                                      4000,   40,  15,  0,  0,    0,  5,  0, 0,  4, 0),
    ('Raffinerie',      'Produktion', '',                                                                                                                                                                                                                      6000,   60,  25,  10, 0,    0,  0,  3, 0,  5, 0),
    ('Marktplatz',      'Wirtschaft', '',                                                                                                                                                                                                                      8000,   80,  30,  5,  500,  0,  0,  0, 0,  3, 0),
    ('Kaserne',         'Militär',    '',                                                                                                                                                                                                                      10000,  100, 50,  20, 0,    0,  0,  0, 0,  6, 0),
    ('Wohnhaus',        'Unterkunft', '',                                                                                                                                                                                                                      100000, 50,  10,  0,  5000, 0,  0,  0, 0,  1, 4),
    ('Reihenhaus',      'Unterkunft', '',                                                                                                                                                                                                                      170000, 100, 10,  0,  9000, 0,  0,  0, 0,  2, 12),
    ('Mehrfamilienhaus','Unterkunft', '',                                                                                                                                                                                                                      230000, 150, 15,  0,  12500,0,  0,  0, 0,  3, 25),
    ('Hochhaus',        'Unterkunft', '',                                                                                                                                                                                                                      320000, 200, 20,  0,  17500,0,  0,  0, 0,  4, 50),
    ('Kraftwerk',       'Industrie',  'Das Kraftwerk ist zur Versorgung nahezu sämtlicher Gebäude notwendig!',                                                                                                                                                 100000, 50,  20,  0,  0,    0,  0,  0, 50, 0, 0),
    ('Steinbruch',      'Industrie',  'Stein wird zum Bau von Gebäuden benötigt. Jeder Steinbruch produziert pro Tick 75 t Stein.',                                                                                                                           150000, 50,  75,  0,  0,    75, 0,  0, 0,  2, 0),
    ('Metallwerk',      'Industrie',  'Metall wird zum Bau von Gebäuden und zur Produktion von Panzern, Schiffen, Flugzeugen und Verteidigungsanlagen benötigt. Jedes Metallwerk produziert 60 t Eisen.',                                                     150000, 75,  50,  0,  0,    0,  60, 0, 0,  2, 0),
    ('Bohrturm',        'Industrie',  'Der Bohrturm fördert Rohöl, welches in der Öl-Raffinerie zu Treibstoff umgewandelt werden kann.',                                                   200000, 20,  100, 0,  0,    0,  0,  0, 0,  3, 0),
    ('Öl-Raffinerie',   'Industrie',  'Die Öl-Raffinerie wandelt Rohöl in Treibstoff um. Treibstoff benötigst du zum Angreifen oder Spionieren. Jede Öl-Raffinerie produziert 50 l Treibstoff.',                                                              300000, 100, 100, 0,  0,    0,  0,  50, 0,  3, 0)
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
    bewohner             = EXCLUDED.bewohner;
