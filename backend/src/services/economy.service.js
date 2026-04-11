'use strict';

const config = require('../config');
const buildingRepo = require('../repositories/building.repository');
const resourcesRepo = require('../repositories/resources.repository');

async function getGebaeudeStatus(spielerId, client) {
  const gebaeude = await buildingRepo.findBySpieler(spielerId, client);

  let stromProduktion = 0;
  let stromVerbrauch = 0;
  let mieteinnahmen = 0;
  let steuerBasisBewohner = 0;
  let einnahmenSonstige = 0;
  let gesamtBewohner = 0;
  let produktionStein = 0;
  let produktionEisen = 0;
  let produktionTreibstoff = 0;

  for (const geb of gebaeude) {
    const anzahl = Number(geb.anzahl);
    stromProduktion += Number(geb.strom_produktion) * anzahl;
    stromVerbrauch += Number(geb.strom_verbrauch) * anzahl;
    produktionStein += Number(geb.produktion_stein) * anzahl;
    produktionEisen += Number(geb.produktion_eisen) * anzahl;
    produktionTreibstoff += Number(geb.produktion_treibstoff) * anzahl;

    if (geb.kategorie === 'Unterkunft') {
      mieteinnahmen += Number(geb.einkommen_geld) * anzahl;
      gesamtBewohner += Number(geb.bewohner) * anzahl;
    } else {
      einnahmenSonstige += Number(geb.einkommen_geld) * anzahl;
    }
  }

  /* Jeder Bewohner zahlt 1 € Steuern pro Tick */
  steuerBasisBewohner = 10 * gesamtBewohner;
  const produktionGeld = mieteinnahmen + steuerBasisBewohner + einnahmenSonstige;

  return {
    gebaeude,
    bewohner: gesamtBewohner,
    strom: {
      produktion: stromProduktion,
      verbrauch: stromVerbrauch,
      frei: stromProduktion - stromVerbrauch,
    },
    einnahmen: {
      gesamt: produktionGeld,
      miete: mieteinnahmen,
      steuern: steuerBasisBewohner,
      sonstige: einnahmenSonstige,
    },
    produktion: {
      geld: produktionGeld,
      stein: produktionStein,
      eisen: produktionEisen,
      treibstoff: produktionTreibstoff,
    },
  };
}

async function applyProductionTicks(spielerId, client) {
  const ressourcen = await resourcesRepo.findBySpielerIdLocked(spielerId, client);

  if (!ressourcen) {
    throw new Error('Ressourcen des Spielers nicht gefunden');
  }

  const gebaeudeStatus = await getGebaeudeStatus(spielerId, client);

  const letzteAktualisierung = new Date(ressourcen.letzte_aktualisierung);
  const jetzt = new Date();
  const vergangeneSekunden = Math.floor((jetzt - letzteAktualisierung) / 1000);
  const vergangeneTicks = Math.floor(vergangeneSekunden / config.tickDurationSeconds);

  if (vergangeneTicks <= 0) {
    return {
      ticks: 0,
      ressourcen: {
        geld: Number(ressourcen.geld),
        stein: Number(ressourcen.stein),
        eisen: Number(ressourcen.eisen),
        treibstoff: Number(ressourcen.treibstoff),
      },
      bewohner: gebaeudeStatus.bewohner,
      strom: gebaeudeStatus.strom,
      einnahmen: gebaeudeStatus.einnahmen,
      produktion: gebaeudeStatus.produktion,
      gebaeude: gebaeudeStatus.gebaeude,
      letzteAktualisierung,
    };
  }

  const addGeld = gebaeudeStatus.produktion.geld * vergangeneTicks;
  const addStein = gebaeudeStatus.produktion.stein * vergangeneTicks;
  const addEisen = gebaeudeStatus.produktion.eisen * vergangeneTicks;
  const addTreibstoff = gebaeudeStatus.produktion.treibstoff * vergangeneTicks;

  const neueLetzteAktualisierung = new Date(
    letzteAktualisierung.getTime() + vergangeneTicks * config.tickDurationSeconds * 1000
  );

  const neueRessourcen = await resourcesRepo.addResources(
    spielerId,
    addGeld,
    addStein,
    addEisen,
    addTreibstoff,
    neueLetzteAktualisierung,
    client
  );

  return {
    ticks: vergangeneTicks,
    ressourcen: {
      geld: Number(neueRessourcen.geld),
      stein: Number(neueRessourcen.stein),
      eisen: Number(neueRessourcen.eisen),
      treibstoff: Number(neueRessourcen.treibstoff),
    },
    bewohner: gebaeudeStatus.bewohner,
    strom: gebaeudeStatus.strom,
    einnahmen: gebaeudeStatus.einnahmen,
    produktion: gebaeudeStatus.produktion,
    gebaeude: gebaeudeStatus.gebaeude,
    letzteAktualisierung: neueRessourcen.letzte_aktualisierung,
  };
}

async function processFertigeBauauftraege(spielerId, client) {
  const fertige = await buildingRepo.findFertigeBauauftraege(spielerId, client);
  for (const auftrag of fertige) {
    await buildingRepo.upsertSpielerGebaeude(spielerId, auftrag.gebaeude_typ_id, auftrag.anzahl, client);
    await buildingRepo.deleteBauauftrag(auftrag.id, client);
  }
}

module.exports = { getGebaeudeStatus, applyProductionTicks, processFertigeBauauftraege };
