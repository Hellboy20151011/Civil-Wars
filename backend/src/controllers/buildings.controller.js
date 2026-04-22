'use strict';

/*
 * Buildings-Controller:
 * Liefert Gebäudetypen/Warteschlange und verarbeitet Bauanfragen.
 * Nutzt Services für Tick-Logik und Repositories für DB-Zugriffe.
 */

const pool = require('../db');
const buildingRepo = require('../repositories/building.repository');
const resourcesRepo = require('../repositories/resources.repository');
const economyService = require('../services/economy.service');
const playerService = require('../services/player.service');

async function getTypes(req, res) {
  // Gibt alle im Spiel konfigurierten Gebäudetypen zurück.
  const types = await buildingRepo.findAllTypes();
  res.json(types);
}

async function getQueue(req, res) {
  const spielerId = req.session.spieler.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Vor Ausgabe werden fertige Aufträge ins Gebäudekonto übertragen.
    await economyService.processFertigeBauauftraege(spielerId, client);
    const queue = await buildingRepo.findBauauftraegeBySpielerId(spielerId, client);
    await client.query('COMMIT');
    res.json(queue);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function build(req, res) {
  const client = await pool.connect();
  try {
    const spielerId = req.session.spieler.id;
    const { gebaeudeTypId, anzahl = 1 } = req.body;

    await client.query('BEGIN');

    // Erst den Wirtschaftsstand auf den aktuellen Tick-Zeitpunkt bringen.
    await economyService.applyProductionTicks(spielerId, client);

    // Danach alle inzwischen fertig gewordenen Aufträge einbuchen.
    await economyService.processFertigeBauauftraege(spielerId, client);

    const gebaeude = await buildingRepo.findTypById(gebaeudeTypId, client);
    if (!gebaeude) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Gebäudetyp nicht gefunden' });
    }

    // Spielregeln: Hauptgebäude nicht baubar, Kaserne nur einmal.
    if (gebaeude.name === 'Hauptgebäude') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Hauptgebäude kann nicht gebaut werden' });
    }

    if (gebaeude.name === 'Kaserne') {
      const kaserneAnzahl = await buildingRepo.findSpielerGebaeudeAnzahlByName(spielerId, 'Kaserne', client);
      if (kaserneAnzahl >= 1) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Die Kaserne ist bereits gebaut. Upgrade im Militär-Menü möglich.' });
      }
    }

    // Spielregel: Maximal 5 Raffinerien pro vorhandenem Bohrturm.
    if (gebaeude.name === 'Öl-Raffinerie') {
      // Bohrturm- und Raffinerie-Anzahl in einem einzigen DB-Roundtrip ermitteln.
      const anzahlen = await buildingRepo.findBohrturmUndRaffinerie(spielerId, client);
      const bohrturmAnzahl = anzahlen['Bohrturm'];
      const raffinerieAnzahl = anzahlen['Öl-Raffinerie'];
      const maxRaffinerie = bohrturmAnzahl * 5;
      if (raffinerieAnzahl + anzahl > maxRaffinerie) {
        await client.query('ROLLBACK');
        if (bohrturmAnzahl === 0) {
          return res.status(400).json({ message: 'Du musst zuerst einen Bohrturm bauen, um Öl-Raffinerien bauen zu können.' });
        }
        const bohrturmLabel = bohrturmAnzahl === 1 ? '1 Bohrturm' : `${bohrturmAnzahl} Bohrtürme`;
        return res.status(400).json({ message: `Maximal ${maxRaffinerie} Öl-Raffinerie(n) erlaubt (5 pro Bohrturm). Du hast ${bohrturmLabel}.` });
      }
    }

    // Ressourcen werden per FOR UPDATE gesperrt gelesen (konkurrenzsicher).
    const ressourcen = await resourcesRepo.findBySpielerIdLocked(spielerId, client);
    if (!ressourcen) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Ressourcen nicht gefunden' });
    }

    if (Number(ressourcen.geld) < Number(gebaeude.kosten_geld) * anzahl) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Zu wenig Geld' });
    }
    if (Number(ressourcen.stein) < Number(gebaeude.kosten_stein) * anzahl) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Zu wenig Stein' });
    }
    if (Number(ressourcen.eisen) < Number(gebaeude.kosten_eisen) * anzahl) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Zu wenig Eisen' });
    }
    if (Number(ressourcen.treibstoff) < Number(gebaeude.kosten_treibstoff) * anzahl) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Zu wenig Treibstoff' });
    }

    // Vor dem Bau wird geprüft, ob nach dem Bau genug freie Stromleistung bleibt.
    const statusVorher = await economyService.getGebaeudeStatus(spielerId, client);
    const neueFreieLeistung =
      statusVorher.strom.produktion +
      Number(gebaeude.strom_produktion) * anzahl -
      (statusVorher.strom.verbrauch + Number(gebaeude.strom_verbrauch) * anzahl);

    if (neueFreieLeistung < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Nicht genug Strom für dieses Gebäude' });
    }

    // Kosten werden sofort abgezogen; der Effekt des Baus folgt je nach Bauzeit sofort oder verzögert.
    await resourcesRepo.deductResources(
      spielerId,
      Number(gebaeude.kosten_geld) * anzahl,
      Number(gebaeude.kosten_stein) * anzahl,
      Number(gebaeude.kosten_eisen) * anzahl,
      Number(gebaeude.kosten_treibstoff) * anzahl,
      client
    );

    const label = anzahl > 1 ? `${anzahl}x ${gebaeude.name}` : gebaeude.name;

    if (Number(gebaeude.bauzeit_minuten) > 0) {
      // Pro Gebäudetyp darf nur ein aktiver Auftrag parallel in der Warteschlange liegen.
      const existingOrder = await buildingRepo.findExistingBauauftrag(spielerId, gebaeudeTypId, client);
      if (existingOrder) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `${gebaeude.name} ist bereits in der Bauwarteschlange. Erst abwarten, bis der aktuelle Auftrag fertig ist.` });
      }

      const auftrag = await buildingRepo.createBauauftrag(spielerId, gebaeudeTypId, anzahl, gebaeude.bauzeit_minuten, client);

      const statusNeu = await playerService.getSpielerStatus(spielerId, client);

      await client.query('COMMIT');

      const fertigAmStr = new Date(auftrag.fertig_am).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      res.json({ message: `${label} wird gebaut (fertig um ${fertigAmStr})`, status: statusNeu });
    } else {
      await buildingRepo.upsertSpielerGebaeude(spielerId, gebaeudeTypId, anzahl, client);

      const statusNeu = await playerService.getSpielerStatus(spielerId, client);

      await client.query('COMMIT');

      res.json({ message: `${label} erfolgreich gebaut`, status: statusNeu });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { getTypes, getQueue, build };
