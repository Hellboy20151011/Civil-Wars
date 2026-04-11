-- Migration: Remove Raffinerie building from the game

-- Remove all player instances of this building first
DELETE FROM spieler_gebaeude
USING gebaeude_typen
WHERE spieler_gebaeude.gebaeude_typ_id = gebaeude_typen.id
  AND gebaeude_typen.name = 'Raffinerie';

-- Remove the building type itself
DELETE FROM gebaeude_typen WHERE name = 'Raffinerie';
