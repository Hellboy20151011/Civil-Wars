(function attachBauzentrumViewRenderer(global) {
  'use strict';

  const RERENDER_DEBOUNCE_MS = 120;

  let allBuildingTypes = [];
  let latestSnapshot = null;
  let rerenderTimerId = null;

  function getActiveKategorie() {
    const activeTab = document.querySelector('.bau-tab.active');
    return activeTab ? activeTab.dataset.kategorie : 'Unterkunft';
  }

  function renderGebaeudeListe(gebaeude) {
    const container = document.getElementById('meineGebaeudeListe');
    if (!container) return;

    if (!Array.isArray(gebaeude) || gebaeude.length === 0) {
      container.innerHTML = '<span class="empty-state">- Noch keine Gebäude gebaut! -</span>';
      return;
    }

    container.innerHTML = gebaeude.map((building) => `
      <div class="gebaeude-item">
        <span class="gebaeude-name">${escapeHtml(building.name)}</span>
        <span class="gebaeude-info">(${escapeHtml(building.kategorie)}) &times; ${escapeHtml(String(building.anzahl))}</span>
        <span class="gebaeude-strom">⚡ +${escapeHtml(String(building.strom_produktion))} / -${escapeHtml(String(building.strom_verbrauch))}</span>
      </div>
    `).join('');
  }

  function berechneDerzeitBaubar(building, spielerGebaeude, ressourcen, stromFrei, aktiveQueue) {
    if (!ressourcen) {
      return { anzahlGebaut: 0, bereitsInQueue: false, derzeitBaubar: 0 };
    }

    const gebautEintrag = spielerGebaeude.find((g) => Number(g.id) === Number(building.id));
    const anzahlGebaut = gebautEintrag ? Number(gebautEintrag.anzahl) : 0;
    const serverNowMs = global.CoreClock.getServerNowMs();
    const bereitsInQueue = aktiveQueue.some(
      (auftrag) => Number(auftrag.gebaeude_typ_id) === Number(building.id)
        && new Date(auftrag.fertig_am).getTime() > serverNowMs
    );

    const maxGeld = Number(building.kosten_geld) > 0
      ? Math.floor(Number(ressourcen.geld) / Number(building.kosten_geld))
      : Infinity;
    const maxStein = Number(building.kosten_stein) > 0
      ? Math.floor(Number(ressourcen.stein) / Number(building.kosten_stein))
      : Infinity;
    const maxEisen = Number(building.kosten_eisen) > 0
      ? Math.floor(Number(ressourcen.eisen) / Number(building.kosten_eisen))
      : Infinity;
    const maxStrom = Number(building.strom_verbrauch) > 0
      ? Math.floor(stromFrei / Number(building.strom_verbrauch))
      : Infinity;

    const limits = [maxGeld, maxStein, maxEisen, maxStrom].filter((value) => value !== Infinity);
    let derzeitBaubar = limits.length > 0 ? Math.max(0, Math.min(...limits)) : 0;

    if (building.name === 'Kaserne') {
      derzeitBaubar = Math.min(derzeitBaubar, Math.max(0, 1 - anzahlGebaut));
    }

    if (building.name === 'Öl-Raffinerie') {
      const bohrturm = spielerGebaeude.find((g) => g.name === 'Bohrturm');
      const bohrturmAnzahl = bohrturm ? Number(bohrturm.anzahl) : 0;
      derzeitBaubar = Math.min(derzeitBaubar, Math.max(0, bohrturmAnzahl * 5 - anzahlGebaut));
    }

    return { anzahlGebaut, bereitsInQueue, derzeitBaubar };
  }

  function beschreibungLines(building) {
    const bewohner = Number(building.bewohner || 0);
    const miete = Number(building.einkommen_geld || 0);
    const stein = Number(building.produktion_stein || 0);
    const eisen = Number(building.produktion_eisen || 0);
    const treibstoff = Number(building.produktion_treibstoff || 0);
    const strom = Number(building.strom_produktion || 0);
    let text = '';

    if (building.beschreibung) {
      text += `<p class="bau-desc-line">${escapeHtml(building.beschreibung)}</p>`;
    }
    if (bewohner > 0) {
      text += `<p class="bau-desc-line">Bietet Platz für ${bewohner.toLocaleString('de-DE')} Bewohner.</p>`;
      text += `<p class="bau-desc-line">Mieteinnahmen: ${miete.toLocaleString('de-DE')} € / Tick</p>`;
      text += `<p class="bau-desc-line">Steuereinnahmen: ${bewohner.toLocaleString('de-DE')} € / Tick</p>`;
    } else if (miete > 0) {
      text += `<p class="bau-desc-line">Einnahmen: ${miete.toLocaleString('de-DE')} € / Tick</p>`;
    }
    if (strom > 0) text += `<p class="bau-desc-line">Produziert: ${strom.toLocaleString('de-DE')} MWh Strom / Tick</p>`;
    if (stein > 0) text += `<p class="bau-desc-line">Produziert: ${stein.toLocaleString('de-DE')} t Stein / Tick</p>`;
    if (eisen > 0) text += `<p class="bau-desc-line">Produziert: ${eisen.toLocaleString('de-DE')} t Eisen / Tick</p>`;
    if (treibstoff > 0) text += `<p class="bau-desc-line">Produziert: ${treibstoff.toLocaleString('de-DE')} l Treibstoff / Tick</p>`;
    return text;
  }

  function renderBuildingCards() {
    const container = document.getElementById('buildingTypes');
    if (!container || !latestSnapshot) return;

    const activeKategorie = getActiveKategorie();
    const buildingTypes = allBuildingTypes.filter((building) => building.kategorie === activeKategorie);
    if (buildingTypes.length === 0) {
      container.innerHTML = '<p class="empty-state">Keine Gebäude in dieser Kategorie.</p>';
      return;
    }

    const spielerGebaeude = latestSnapshot.gebaeude || [];
    const ressourcen = latestSnapshot.ressourcen || null;
    const stromFrei = Number((latestSnapshot.strom && latestSnapshot.strom.frei) || 0);
    const aktiveQueue = latestSnapshot.bauauftraege || [];

    container.innerHTML = buildingTypes.map((building) => {
      const bauStatus = berechneDerzeitBaubar(building, spielerGebaeude, ressourcen, stromFrei, aktiveQueue);
      const disabled = bauStatus.bereitsInQueue || bauStatus.derzeitBaubar === 0;
      const maxAnzahl = Math.max(0, bauStatus.derzeitBaubar);
      return `
        <div class="bau-card">
          <div class="bau-card-header">${escapeHtml(building.name)}</div>
          <div class="bau-card-body">
            <div class="bau-card-left">
              <div class="bau-card-section-title"><u>Beschreibung</u></div>
              <div class="bau-card-desc">${beschreibungLines(building)}</div>
              <div class="bau-card-bauzeit">Bauzeit &nbsp;&nbsp; ${Number(building.bauzeit_minuten) > 0 ? `${escapeHtml(String(building.bauzeit_minuten))} Minuten` : '–'}</div>
            </div>
            <div class="bau-card-right">
              <div class="bau-card-section-title"><u>Kosten:</u></div>
              <table class="bau-cost-table">
                <tr><td>Geld</td><td>${Number(building.kosten_geld).toLocaleString('de-DE')} €</td></tr>
                <tr><td>Stein</td><td>${Number(building.kosten_stein).toLocaleString('de-DE')} t</td></tr>
                <tr><td>Eisen</td><td>${Number(building.kosten_eisen).toLocaleString('de-DE')} t</td></tr>
                <tr><td>Strom</td><td>${Number(building.strom_verbrauch).toLocaleString('de-DE')} MW</td></tr>
              </table>
              <table class="bau-cost-table bau-cost-table-sm">
                <tr><td>Bereits gebaut</td><td>${escapeHtml(String(bauStatus.anzahlGebaut))} Stück</td></tr>
                <tr><td>Derzeit baubar</td><td>${bauStatus.bereitsInQueue ? 'In Warteschlange' : `${escapeHtml(String(bauStatus.derzeitBaubar))} Stück`}</td></tr>
              </table>
            </div>
            <div class="bau-card-img">
              <div class="bau-img-placeholder"></div>
              <div class="bau-anzahl-row">
                <input
                  type="number"
                  id="anzahl-${parseInt(building.id, 10)}"
                  class="bau-anzahl-input"
                  min="1"
                  max="${maxAnzahl}"
                  value="${disabled ? 0 : 1}"
                  ${disabled ? 'disabled' : ''}
                >
                <button class="bau-btn-bauen" data-build-id="${parseInt(building.id, 10)}" ${disabled ? 'disabled' : ''}>Bauen</button>
              </div>
              <p class="bau-anzahl-max">${bauStatus.bereitsInQueue ? 'Bereits in Warteschlange' : `${escapeHtml(String(bauStatus.derzeitBaubar))} maximal`}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function scheduleRenderBuildingCards() {
    if (rerenderTimerId) {
      clearTimeout(rerenderTimerId);
    }
    rerenderTimerId = setTimeout(() => {
      renderBuildingCards();
      rerenderTimerId = null;
    }, RERENDER_DEBOUNCE_MS);
  }

  async function onBuildButtonClick(event) {
    const button = event.target.closest('[data-build-id]');
    if (!button) return;

    const gebaeudeTypId = parseInt(button.dataset.buildId, 10);
    if (!Number.isFinite(gebaeudeTypId)) return;

    const input = document.getElementById(`anzahl-${gebaeudeTypId}`);
    const anzahl = input ? Math.max(1, parseInt(input.value, 10) || 1) : 1;
    const message = document.getElementById('message');

    button.disabled = true;
    try {
      const result = await global.CoreApi.buildBuilding(gebaeudeTypId, anzahl);
      if (message) message.textContent = result.message || '';
      await global.LiveState.refreshNow();
      scheduleRenderBuildingCards();
    } catch (error) {
      console.error('Fehler beim Bauen:', error);
      if (message) message.textContent = 'Fehler beim Bauen. Bitte erneut versuchen.';
    } finally {
      button.disabled = false;
    }
  }

  async function onTabClick(event) {
    if (!event.target.classList.contains('bau-tab')) return;
    document.querySelectorAll('.bau-tab').forEach((tab) => tab.classList.remove('active'));
    event.target.classList.add('active');
    scheduleRenderBuildingCards();
  }

  async function init() {
    const container = document.getElementById('buildingTypes');
    if (!container) return;

    container.addEventListener('click', onBuildButtonClick);
    document.addEventListener('click', onTabClick);

    try {
      allBuildingTypes = await global.CoreApi.getBuildingTypes();
    } catch (error) {
      container.innerHTML = '<p class="empty-state">Gebäudetypen konnten nicht geladen werden.</p>';
      return;
    }

    renderBuildingCards();
  }

  function render(snapshot) {
    latestSnapshot = snapshot;
    renderGebaeudeListe(snapshot.gebaeude || []);
    global.BauQueueRenderer.renderBauQueue(snapshot.bauauftraege || []);
    scheduleRenderBuildingCards();
  }

  global.BauzentrumViewRenderer = {
    init,
    render,
  };
}(window));
