'use strict';

const pool = require('../db');
const buildingRepo = require('../repositories/building.repository');
const resourcesRepo = require('../repositories/resources.repository');
const economyService = require('../services/economy.service');
const playerService = require('../services/player.service');

async function getTypes(req, res) {
  const types = await buildingRepo.findAllTypes();
  res.json(types);
}

async function build(req, res) {
  const client = await pool.connect();
  try {
    const spielerId = req.session.spieler.id;
    const { gebaeudeTypId } = req.body;

    await client.query('BEGIN');

    /* Erst alte Produktion verrechnen */
    await economyService.applyProductionTicks(spielerId, client);

    const gebaeude = await buildingRepo.findTypById(gebaeudeTypId, client);
    if (!gebaeude) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Gebäudetyp nicht gefunden' });
    }

    if (gebaeude.name === 'Hauptgebäude') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Hauptgebäude kann nicht gebaut werden' });
    }

    const ressourcen = await resourcesRepo.findBySpielerIdLocked(spielerId, client);
    if (!ressourcen) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Ressourcen nicht gefunden' });
    }

    if (Number(ressourcen.geld) < Number(gebaeude.kosten_geld)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Zu wenig Geld' });
    }
    if (Number(ressourcen.stein) < Number(gebaeude.kosten_stein)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Zu wenig Stein' });
    }
    if (Number(ressourcen.eisen) < Number(gebaeude.kosten_eisen)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Zu wenig Eisen' });
    }
    if (Number(ressourcen.treibstoff) < Number(gebaeude.kosten_treibstoff)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Zu wenig Treibstoff' });
    }

    const statusVorher = await economyService.getGebaeudeStatus(spielerId, client);
    const neueFreieLeistung =
      statusVorher.strom.produktion +
      Number(gebaeude.strom_produktion) -
      (statusVorher.strom.verbrauch + Number(gebaeude.strom_verbrauch));

    if (neueFreieLeistung < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Nicht genug Strom für dieses Gebäude' });
    }

    await resourcesRepo.deductResources(
      spielerId,
      gebaeude.kosten_geld,
      gebaeude.kosten_stein,
      gebaeude.kosten_eisen,
      gebaeude.kosten_treibstoff,
      client
    );

    await buildingRepo.upsertSpielerGebaeude(spielerId, gebaeudeTypId, client);

    const statusNeu = await playerService.getSpielerStatus(spielerId, client);

    await client.query('COMMIT');

    res.json({ message: `${gebaeude.name} erfolgreich gebaut`, status: statusNeu });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { getTypes, build };
