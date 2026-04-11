'use strict';

const config = require('../config');
const playerRepo = require('../repositories/player.repository');
const economyService = require('./economy.service');

async function getSpielerStatus(spielerId, client) {
  const spieler = await playerRepo.findById(spielerId, client);

  if (!spieler) {
    throw new Error('Spieler nicht gefunden');
  }

  const tickStatus = await economyService.applyProductionTicks(spielerId, client);

  return {
    id: spieler.id,
    name: spieler.name,
    email: spieler.email,
    ressourcen: tickStatus.ressourcen,
    strom: tickStatus.strom,
    produktion: tickStatus.produktion,
    gebaeude: tickStatus.gebaeude,
    ticksVerrechnet: tickStatus.ticks,
    tickDauerSekunden: config.tickDurationSeconds,
    letzteAktualisierung: tickStatus.letzteAktualisierung,
  };
}

module.exports = { getSpielerStatus };
