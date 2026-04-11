ALTER TABLE spieler
    ADD COLUMN IF NOT EXISTS koordinate_x INTEGER,
    ADD COLUMN IF NOT EXISTS koordinate_y INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'spieler_koordinate_x_koordinate_y_key'
          AND conrelid = 'spieler'::regclass
    ) THEN
        ALTER TABLE spieler ADD CONSTRAINT spieler_koordinate_x_koordinate_y_key UNIQUE (koordinate_x, koordinate_y);
    END IF;
END;
$$;
