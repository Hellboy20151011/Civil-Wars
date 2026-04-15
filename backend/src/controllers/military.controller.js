'use strict';

/*
 * Military-Controller:
 * Verarbeitet Militärstatus, Kaserne-Upgrades und Einheitenausbildung.
 * Die eigentliche Datenhaltung läuft über Repositories; Tick-Berechnung über economy.service.
 */

const pool = require('../db');
const buildingRepo = require('../repositories/building.repository');
const resourcesRepo = require('../repositories/resources.repository');
const einheitenRepo = require('../repositories/einheiten.repository');
const economyService = require('../services/economy.service');
const playerService = require('../services/player.service');

const MAX_KASERNE_STUFE = 4;

// GET /api/military/status: Liefert Kaserne, verfügbare Fabriken, Einheiten und Ressourcen.
async function getStatus(req, res) {
  const spielerId = req.session.spieler.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await economyService.applyProductionTicks(spielerId, client);

    const kaserneStufe = await buildingRepo.findKaserneStufe(spielerId, client);
    const kaserneStufen = await buildingRepo.findKaserneStufen(client);
    const fahrzeugfabrikAnzahl = await buildingRepo.findSpielerGebaeudeAnzahlByName(spielerId, 'Fahrzeugfabrik', client);
    const einheiten = await einheitenRepo.findSpielerEinheiten(spielerId, client);
    const ressourcen = await resourcesRepo.findBySpielerIdLocked(spielerId, client);

    await client.query('COMMIT');

    // Nächste Upgrade-Stufe inklusive Kosten für das Frontend vorbereiten.
    const nextStufe = kaserneStufe < MAX_KASERNE_STUFE ? kaserneStufe + 1 : null;
    const nextUpgrade = nextStufe
      ? kaserneStufen.find((s) => Number(s.stufe) === nextStufe) || null
      : null;

    res.json({
      kaserneStufe,
      maxStufe: MAX_KASERNE_STUFE,
      nextUpgrade,
      fahrzeugfabrikAnzahl,
      einheiten,
      ressourcen: {
        geld: Number(ressourcen.geld),
        stein: Number(ressourcen.stein),
        eisen: Number(ressourcen.eisen),
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// POST /api/military/upgrade: Prüft Regeln/Kosten und erhöht die Kaserne-Stufe um 1.
async function upgradeKaserne(req, res) {
  const spielerId = req.session.spieler.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await economyService.applyProductionTicks(spielerId, client);

    const kaserneStufe = await buildingRepo.findKaserneStufe(spielerId, client);

    if (kaserneStufe === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Du hast noch keine Kaserne gebaut.' });
    }

    if (kaserneStufe >= MAX_KASERNE_STUFE) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Die Kaserne ist bereits auf der maximalen Stufe ${MAX_KASERNE_STUFE}.` });
    }

    const nextStufe = kaserneStufe + 1;
    const upgradeKosten = await buildingRepo.findKaserneStufenById(nextStufe, client);
    if (!upgradeKosten) {
      await client.query('ROLLBACK');
      return res.status(500).json({ message: 'Upgrade-Kosten nicht gefunden.' });
    }

    const ressourcen = await resourcesRepo.findBySpielerIdLocked(spielerId, client);
    if (!ressourcen) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Ressourcen nicht gefunden.' });
    }

    if (Number(ressourcen.geld) < Number(upgradeKosten.kosten_geld)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Zu wenig Geld für das Upgrade.' });
    }
    if (Number(ressourcen.stein) < Number(upgradeKosten.kosten_stein)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Zu wenig Stein für das Upgrade.' });
    }
    if (Number(ressourcen.eisen) < Number(upgradeKosten.kosten_eisen)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Zu wenig Eisen für das Upgrade.' });
    }

    await resourcesRepo.deductResources(
      spielerId,
      Number(upgradeKosten.kosten_geld),
      Number(upgradeKosten.kosten_stein),
      Number(upgradeKosten.kosten_eisen),
      0, // Kaserne-Upgrades kosten keinen Treibstoff.
      client
    );

    await buildingRepo.upgradeKaserneStufe(spielerId, client);

    const statusNeu = await playerService.getSpielerStatus(spielerId, client);
    await client.query('COMMIT');

    res.json({
      message: `Kaserne erfolgreich auf Stufe ${nextStufe} ausgebaut.`,
      kaserneStufe: nextStufe,
      status: statusNeu,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// POST /api/military/train: Bildet Einheiten aus und bucht Ressourcen ab.
async function trainEinheit(req, res) {
  const spielerId = req.session.spieler.id;
  const { einheitTypId, anzahl = 1 } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await economyService.applyProductionTicks(spielerId, client);

    const einheitTyp = await einheitenRepo.findEinheitTypById(einheitTypId, client);
    if (!einheitTyp) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Einheitentyp nicht gefunden.' });
    }

    // Einheit bestimmt, ob Kaserne oder Fahrzeugfabrik als Voraussetzung gilt.
    const fabrikTyp = einheitTyp.fabrik_typ || 'Kaserne';

    if (fabrikTyp === 'Kaserne') {
      const kaserneStufe = await buildingRepo.findKaserneStufe(spielerId, client);
      if (kaserneStufe === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Du hast noch keine Kaserne gebaut.' });
      }
      if (kaserneStufe < Number(einheitTyp.kaserne_stufe_min)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `Für ${einheitTyp.name} wird Kaserne Stufe ${einheitTyp.kaserne_stufe_min} benötigt. Aktuelle Stufe: ${kaserneStufe}.`,
        });
      }
    } else if (fabrikTyp === 'Fahrzeugfabrik') {
      const fahrzeugfabrikAnzahl = await buildingRepo.findSpielerGebaeudeAnzahlByName(spielerId, 'Fahrzeugfabrik', client);
      if (fahrzeugfabrikAnzahl === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Du hast noch keine Fahrzeugfabrik gebaut.' });
      }
    }

    const ressourcen = await resourcesRepo.findBySpielerIdLocked(spielerId, client);
    if (!ressourcen) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Ressourcen nicht gefunden.' });
    }

    const gesamtGeld  = Number(einheitTyp.kosten_geld)  * anzahl;
    const gesamtStein = Number(einheitTyp.kosten_stein) * anzahl;
    const gesamtEisen = Number(einheitTyp.kosten_eisen) * anzahl;

    if (Number(ressourcen.geld)  < gesamtGeld)  {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Zu wenig Geld.' });
    }
    if (Number(ressourcen.stein) < gesamtStein) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Zu wenig Stein.' });
    }
    if (Number(ressourcen.eisen) < gesamtEisen) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Zu wenig Eisen.' });
    }

    await resourcesRepo.deductResources(spielerId, gesamtGeld, gesamtStein, gesamtEisen, 0, client);
    await einheitenRepo.upsertSpielerEinheiten(spielerId, einheitTypId, anzahl, client);

    const statusNeu = await playerService.getSpielerStatus(spielerId, client);
    await client.query('COMMIT');

    const label = anzahl > 1 ? `${anzahl}x ${einheitTyp.name}` : einheitTyp.name;
    res.json({
      message: `${label} erfolgreich ausgebildet.`,
      status: statusNeu,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { getStatus, upgradeKaserne, trainEinheit };
