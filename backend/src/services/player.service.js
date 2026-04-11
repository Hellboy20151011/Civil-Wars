'use strict';

const config = require('../config');
const playerRepo = require('../repositories/player.repository');
const buildingRepo = require('../repositories/building.repository');
const economyService = require('./economy.service');

async function getSpielerStatus(spielerId, client) {
  const spieler = await playerRepo.findById(spielerId, client);

  if (!spieler) {
    throw new Error('Spieler nicht gefunden');
  }

  await economyService.processFertigeBauauftraege(spielerId, client);

  const tickStatus = await economyService.applyProductionTicks(spielerId, client);

  const bauauftraege = await buildingRepo.findBauauftraegeBySpielerId(spielerId, client);

  return {
    id: spieler.id,
    name: spieler.name,
    email: spieler.email,
    koordinate_x: spieler.koordinate_x,
    koordinate_y: spieler.koordinate_y,
    ressourcen: tickStatus.ressourcen,
    bewohner: tickStatus.bewohner,
    strom: tickStatus.strom,
    einnahmen: tickStatus.einnahmen,
    produktion: tickStatus.produktion,
    gebaeude: tickStatus.gebaeude,
    bauauftraege,
    ticksVerrechnet: tickStatus.ticks,
    tickDauerSekunden: config.tickDurationSeconds,
    letzteAktualisierung: tickStatus.letzteAktualisierung,
  };
}

module.exports = { getSpielerStatus };
