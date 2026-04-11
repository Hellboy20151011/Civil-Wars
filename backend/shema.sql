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
    kosten_geld BIGINT NOT NULL DEFAULT 0,
    kosten_stein BIGINT NOT NULL DEFAULT 0,
    kosten_eisen BIGINT NOT NULL DEFAULT 0,
    kosten_treibstoff BIGINT NOT NULL DEFAULT 0,
    einkommen_geld BIGINT NOT NULL DEFAULT 0,
    produktion_stein BIGINT NOT NULL DEFAULT 0,
    produktion_eisen BIGINT NOT NULL DEFAULT 0,
    produktion_treibstoff BIGINT NOT NULL DEFAULT 0,
    strom_produktion BIGINT NOT NULL DEFAULT 0,
    strom_verbrauch BIGINT NOT NULL DEFAULT 0
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

INSERT INTO gebaeude_typen (name, kategorie, kosten_geld, kosten_stein, kosten_eisen, kosten_treibstoff, einkommen_geld, produktion_stein, produktion_eisen, produktion_treibstoff, strom_produktion, strom_verbrauch)
VALUES
    ('Hauptgebäude',   'Basis',       0,      0,   0,  0,  0,    0,  0,  0, 10, 0),
    ('Kraftwerk',      'Versorgung',  5000,   50,  20, 0,  0,    0,  0,  0, 20, 2),
    ('Mine',           'Produktion',  3000,   30,  10, 0,  0,    5,  0,  0, 0,  3),
    ('Eisenhütte',     'Produktion',  4000,   40,  15, 0,  0,    0,  5,  0, 0,  4),
    ('Raffinerie',     'Produktion',  6000,   60,  25, 10, 0,    0,  0,  3, 0,  5),
    ('Marktplatz',     'Wirtschaft',  8000,   80,  30, 5,  500,  0,  0,  0, 0,  3),
    ('Kaserne',        'Militär',     10000,  100, 50, 20, 0,    0,  0,  0, 0,  6)
ON CONFLICT (name) DO NOTHING;
