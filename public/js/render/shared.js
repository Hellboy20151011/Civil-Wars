(function attachSharedRenderer(global) {
  'use strict';

  function setIfExists(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
  }

  function updateMilitaerNav(gebaeude) {
    const navMilitaer = document.getElementById('navMilitaer');
    if (!navMilitaer) return;

    const hasMilitaer = Array.isArray(gebaeude) && gebaeude.some(
      (eintrag) => eintrag.kategorie === 'Militär' && Number(eintrag.anzahl) > 0
    );

    if (hasMilitaer) {
      navMilitaer.href = 'militaer.html';
      navMilitaer.classList.remove('nav-italic');
    } else {
      navMilitaer.href = '#';
    }
  }

  function renderShared(snapshot) {
    if (!snapshot) return;

    global.CoreClock.startHeaderClock();

    setIfExists('spielerName', snapshot.name || '-');
    const koordinateX = snapshot.koordinate_x != null ? snapshot.koordinate_x : '-';
    const koordinateY = snapshot.koordinate_y != null ? snapshot.koordinate_y : '-';
    setIfExists('spielerKoord', `${koordinateX}:${koordinateY}`);

    const ressourcen = snapshot.ressourcen || {};
    setIfExists('geld', `${Number(ressourcen.geld || 0).toLocaleString('de-DE')} €`);
    setIfExists('stein', Number(ressourcen.stein || 0).toLocaleString('de-DE'));
    setIfExists('eisen', Number(ressourcen.eisen || 0).toLocaleString('de-DE'));
    setIfExists('treibstoff', Number(ressourcen.treibstoff || 0).toLocaleString('de-DE'));
    setIfExists('bewohner', Number(snapshot.bewohner || 0).toLocaleString('de-DE'));

    const strom = snapshot.strom || {};
    setIfExists('stromProduktion', Number(strom.produktion || 0).toLocaleString('de-DE'));
    setIfExists('stromVerbrauch', Number(strom.verbrauch || 0).toLocaleString('de-DE'));
    setIfExists('stromFrei', Number(strom.frei || 0).toLocaleString('de-DE'));

    const einnahmen = snapshot.einnahmen || {};
    setIfExists('einBauzentrale', `${Number(einnahmen.sonstige || 0).toLocaleString('de-DE')} €`);
    setIfExists('einMieteinnahmen', `${Number(einnahmen.miete || 0).toLocaleString('de-DE')} €`);
    setIfExists('einSteuern', `${Number(einnahmen.steuern || 0).toLocaleString('de-DE')} €`);
    setIfExists('gesamtGeld', `${Number(einnahmen.gesamt || 0).toLocaleString('de-DE')} €`);

    const produktion = snapshot.produktion || {};
    setIfExists('prodGeld', `${Number(produktion.geld || 0).toLocaleString('de-DE')} €`);
    setIfExists('prodStein', `${Number(produktion.stein || 0).toLocaleString('de-DE')} t`);
    setIfExists('prodEisen', `${Number(produktion.eisen || 0).toLocaleString('de-DE')} t`);
    setIfExists('prodTreibstoff', `${Number(produktion.treibstoff || 0).toLocaleString('de-DE')} Barrel`);

    if (snapshot.tickDauerSekunden != null) {
      setIfExists('tickDauer', snapshot.tickDauerSekunden);
    }
    if (snapshot.ticksVerrechnet != null) {
      setIfExists('ticksVerrechnet', snapshot.ticksVerrechnet);
    }
    if (snapshot.letzteAktualisierung) {
      setIfExists('letzteAktualisierung', new Date(snapshot.letzteAktualisierung).toLocaleString('de-DE'));
    }

    const nextTickTimer = document.getElementById('nextTickTimer');
    if (nextTickTimer) {
      const nextTickEndTime = global.CoreClock.getNextTickEndTime(snapshot);
      if (nextTickEndTime) {
        nextTickTimer.setAttribute('data-endtime', nextTickEndTime);
        nextTickTimer.setAttribute('data-done-text', '0s');
      } else {
        nextTickTimer.textContent = '--:--';
      }
    }

    updateMilitaerNav(snapshot.gebaeude || []);
    global.CountdownLoop.refresh();
  }

  global.SharedRenderer = { renderShared };
}(window));
