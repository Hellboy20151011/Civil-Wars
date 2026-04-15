(function attachMilitaerViewRenderer(global) {
  'use strict';

  const MAX_KASERNE_STUFE = 4;
  let aktiverFabrikTyp = 'Kaserne';
  let letzterMilitaerStatus = null;

  function renderFabrikTabs(data) {
    const tabsContainer = document.getElementById('fabrikTabs');
    if (!tabsContainer) return;

    const fabriken = [
      { typ: 'Kaserne', label: 'Kaserne', verfuegbar: data.kaserneStufe > 0 },
      { typ: 'Fahrzeugfabrik', label: 'Fahrzeugfabrik', verfuegbar: (data.fahrzeugfabrikAnzahl || 0) > 0 },
    ];

    tabsContainer.innerHTML = fabriken.map((fabrik) => `
      <button
        class="bau-tab ${aktiverFabrikTyp === fabrik.typ ? 'active' : ''}"
        data-fabrik-typ="${escapeHtml(fabrik.typ)}"
        ${fabrik.verfuegbar ? '' : 'disabled'}
        ${fabrik.verfuegbar ? '' : `title="${escapeHtml(fabrik.label)} noch nicht gebaut"`}
      >${escapeHtml(fabrik.label)}</button>
    `).join('');
  }

  function renderKaserneStatus(data) {
    const container = document.getElementById('kaserneStatus');
    if (!container) return;

    const { kaserneStufe, maxStufe, nextUpgrade, ressourcen } = data;

    if (kaserneStufe === 0) {
      container.innerHTML = `
        <p class="empty-state">
          Du hast noch keine Kaserne gebaut.<br>
          Baue zuerst eine Kaserne im
          <a href="bauzentrum.html" class="nav-link" style="display:inline">Bauzentrum</a>
          (Kategorie Militär).
        </p>`;
      return;
    }

    const sterne = '★'.repeat(kaserneStufe) + '☆'.repeat(maxStufe - kaserneStufe);
    let upgradeHtml = '<p class="mil-max-stufe">Kaserne ist auf maximaler Stufe.</p>';

    if (nextUpgrade) {
      const canAfford = ressourcen.geld >= Number(nextUpgrade.kosten_geld)
        && ressourcen.stein >= Number(nextUpgrade.kosten_stein)
        && ressourcen.eisen >= Number(nextUpgrade.kosten_eisen);

      upgradeHtml = `
        <div class="mil-upgrade-box">
          <div class="bau-card-section-title"><u>Upgrade auf Stufe ${nextUpgrade.stufe}</u></div>
          <table class="bau-cost-table">
            <tr><td>Geld</td><td>${Number(nextUpgrade.kosten_geld).toLocaleString('de-DE')} €</td></tr>
            <tr><td>Stein</td><td>${Number(nextUpgrade.kosten_stein).toLocaleString('de-DE')} t</td></tr>
            <tr><td>Eisen</td><td>${Number(nextUpgrade.kosten_eisen).toLocaleString('de-DE')} t</td></tr>
            <tr><td>Bauzeit</td><td>${nextUpgrade.bauzeit_minuten} Minuten</td></tr>
          </table>
          <button class="bau-btn-bauen" data-upgrade-kaserne ${canAfford ? '' : 'disabled'}>Kaserne ausbauen</button>
          ${canAfford ? '' : '<p class="mil-not-possible">Nicht genug Ressourcen</p>'}
        </div>`;
    }

    container.innerHTML = `
      <div class="mil-kaserne-status">
        <div class="mil-stufe-row">
          <span class="mil-stufe-label">Aktuelle Stufe:</span>
          <span class="mil-stufe-val">Stufe ${kaserneStufe} von ${maxStufe} &nbsp; ${sterne}</span>
        </div>
        ${upgradeHtml}
      </div>`;
  }

  function formatAusbildungszeit(minuten) {
    const stunden = Math.floor(minuten / 60);
    const restMinuten = minuten % 60;
    return `${String(stunden).padStart(2, '0')}:${String(restMinuten).padStart(2, '0')}:00 h`;
  }

  function renderEinheitenListe(data) {
    const container = document.getElementById('einheitenListe');
    if (!container) return;

    const gebaeudeVerfuegbar = aktiverFabrikTyp === 'Kaserne'
      ? data.kaserneStufe > 0
      : (data.fahrzeugfabrikAnzahl || 0) > 0;

    if (!gebaeudeVerfuegbar) {
      container.innerHTML = `<p class="empty-state">Keine ${escapeHtml(aktiverFabrikTyp)} vorhanden – Einheiten nicht verfügbar.</p>`;
      return;
    }

    const gefilterteEinheiten = (data.einheiten || []).filter(
      (einheit) => (einheit.fabrik_typ || 'Kaserne') === aktiverFabrikTyp
    );

    if (gefilterteEinheiten.length === 0) {
      container.innerHTML = '<p class="empty-state">Keine Einheitentypen verfügbar.</p>';
      return;
    }

    container.innerHTML = gefilterteEinheiten.map((einheit) => {
      const verfuegbar = aktiverFabrikTyp === 'Kaserne'
        ? data.kaserneStufe >= Number(einheit.kaserne_stufe_min)
        : (data.fahrzeugfabrikAnzahl || 0) > 0;

      return `
        <div class="mil-einheit-row ${verfuegbar ? '' : 'mil-einheit-locked'}">
          <div class="mil-einheit-img"><div class="bau-img-placeholder mil-einheit-placeholder"></div></div>
          <div class="mil-einheit-info">
            <div class="mil-einheit-name">${escapeHtml(einheit.name)}</div>
            <div class="mil-einheit-stats">
              <span>Angriff: <strong>${escapeHtml(String(einheit.angriff))}</strong></span>
              <span>Abwehr: <strong>${escapeHtml(String(einheit.abwehr))}</strong></span>
              <span>Ausbildungszeit: <strong>${escapeHtml(formatAusbildungszeit(Number(einheit.reisezeit_minuten)))}</strong></span>
            </div>
            <div class="mil-einheit-vorhanden">Vorhanden: ${Number(einheit.anzahl).toLocaleString('de-DE')}</div>
            ${aktiverFabrikTyp === 'Kaserne' && !verfuegbar ? `<div class="mil-not-possible">Benötigt Kaserne Stufe ${escapeHtml(String(einheit.kaserne_stufe_min))}</div>` : ''}
          </div>
          <div class="mil-einheit-kosten">
            <div class="bau-card-section-title"><u>Kosten</u></div>
            <table class="bau-cost-table">
              <tr><td>Geld</td><td>${Number(einheit.kosten_geld).toLocaleString('de-DE')} €</td></tr>
              <tr><td>Stein</td><td>${Number(einheit.kosten_stein).toLocaleString('de-DE')} t</td></tr>
              <tr><td>Eisen</td><td>${Number(einheit.kosten_eisen).toLocaleString('de-DE')} t</td></tr>
            </table>
          </div>
          <div class="mil-einheit-ausbilden">
            <div class="bau-card-section-title"><u>Ausbilden</u></div>
            ${verfuegbar
    ? `<div class="bau-anzahl-row">
                  <input type="number" id="anzahl-einheit-${parseInt(einheit.id, 10)}" class="bau-anzahl-input" min="1" value="1">
                  <button class="bau-btn-bauen" data-train-id="${parseInt(einheit.id, 10)}">Ausbilden</button>
               </div>`
    : '<span class="mil-not-possible">Noch nicht möglich</span>'}
          </div>
        </div>`;
    }).join('');
  }

  function renderMilitaerStatus(data) {
    letzterMilitaerStatus = data;
    renderKaserneStatus(data);
    renderFabrikTabs(data);
    renderEinheitenListe(data);
  }

  async function loadMilitaerStatus() {
    const container = document.getElementById('kaserneStatus');
    try {
      const status = await global.CoreApi.getMilitaryStatus();
      if (!status) return;
      renderMilitaerStatus(status);
    } catch (error) {
      if (container) {
        container.innerHTML = '<p class="empty-state">Militärstatus konnte nicht geladen werden.</p>';
      }
    }
  }

  async function doUpgradeKaserne() {
    const message = document.getElementById('message');
    const result = await global.CoreApi.upgradeKaserne();
    if (message) message.textContent = result.message || '';
    await global.LiveState.refreshNow();
    await loadMilitaerStatus();
  }

  async function doTrainEinheit(einheitTypId) {
    const input = document.getElementById(`anzahl-einheit-${einheitTypId}`);
    const anzahl = input ? Math.max(1, parseInt(input.value, 10) || 1) : 1;
    const message = document.getElementById('message');

    const result = await global.CoreApi.trainEinheit(einheitTypId, anzahl);
    if (message) message.textContent = result.message || '';
    await global.LiveState.refreshNow();
    await loadMilitaerStatus();
  }

  function attachEvents() {
    const tabsContainer = document.getElementById('fabrikTabs');
    if (tabsContainer) {
      tabsContainer.addEventListener('click', (event) => {
        const button = event.target.closest('[data-fabrik-typ]');
        if (!button) return;
        aktiverFabrikTyp = button.dataset.fabrikTyp;
        if (letzterMilitaerStatus) {
          renderMilitaerStatus(letzterMilitaerStatus);
        }
      });
    }

    const kaserneStatus = document.getElementById('kaserneStatus');
    if (kaserneStatus) {
      kaserneStatus.addEventListener('click', async (event) => {
        if (!event.target.closest('[data-upgrade-kaserne]')) return;
        await doUpgradeKaserne();
      });
    }

    const einheitenListe = document.getElementById('einheitenListe');
    if (einheitenListe) {
      einheitenListe.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-train-id]');
        if (!button) return;
        await doTrainEinheit(parseInt(button.dataset.trainId, 10));
      });
    }
  }

  async function init() {
    const panel = document.getElementById('kaserneStatus');
    if (!panel) return;
    attachEvents();
    await loadMilitaerStatus();
  }

  global.MilitaerViewRenderer = {
    init,
    loadMilitaerStatus,
    MAX_KASERNE_STUFE,
  };
}(window));
