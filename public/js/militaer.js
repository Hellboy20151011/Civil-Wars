/**
 * militaer.js – Militärseite: Kaserne-Status, Upgrade, Einheiten ausbilden
 * Benötigt: utils.js (escapeHtml, setEl, postData), dashboard.js (renderStatus, loadDashboard)
 * API-Verknüpfung:
 * - GET /api/military/status -> military.routes -> military.controller.getStatus
 * - POST /api/military/upgrade -> military.routes -> military.controller.upgradeKaserne
 * - POST /api/military/train -> military.routes -> military.controller.trainEinheit
 */

const MAX_KASERNE_STUFE = 4;

let aktiverFabrikTyp = 'Kaserne';
let letzterMilitaerStatus = null;

/* ── Militärstatus laden ───────────────────────────────────── */

async function loadMilitaerStatus() {
  const kaserneStatus  = document.getElementById('kaserneStatus');
  const einheitenListe = document.getElementById('einheitenListe');
  if (!kaserneStatus) return;

  // Holt den vollständigen Militärstatus (Kaserne, Einheiten, Ressourcen) aus dem Backend.
  const response = await fetch('/api/military/status');
  if (!response.ok) {
    kaserneStatus.innerHTML = '<p class="empty-state">Militärstatus konnte nicht geladen werden.</p>';
    return;
  }

  const data = await response.json();
  letzterMilitaerStatus = data;
  renderKaserneStatus(data, kaserneStatus);
  renderFabrikTabs(data);
  if (einheitenListe) {
    renderEinheitenListe(data, einheitenListe, aktiverFabrikTyp);
  }
}

/* ── Fabrik-Tabs rendern ───────────────────────────────────── */

function renderFabrikTabs(data) {
  const tabsContainer = document.getElementById('fabrikTabs');
  if (!tabsContainer) return;

  const fabriken = [
    { typ: 'Kaserne',        label: 'Kaserne',        verfuegbar: data.kaserneStufe > 0 },
    { typ: 'Fahrzeugfabrik', label: 'Fahrzeugfabrik', verfuegbar: (data.fahrzeugfabrikAnzahl || 0) > 0 },
  ];

  tabsContainer.innerHTML = fabriken.map((f) => {
    const disabledAttr = !f.verfuegbar ? 'disabled' : '';
    const titleAttr = !f.verfuegbar ? `title="${escapeHtml(f.label)} noch nicht gebaut"` : '';
    return `
      <button
        class="bau-tab ${aktiverFabrikTyp === f.typ ? 'active' : ''}"
        onclick="selectFabrikTyp('${f.typ}')"
        ${disabledAttr}
        ${titleAttr}
      >${escapeHtml(f.label)}</button>
    `;
  }).join('');
}

/* ── Fabrik-Tab wechseln ───────────────────────────────────── */

function selectFabrikTyp(fabrikTyp) {
  aktiverFabrikTyp = fabrikTyp;
  if (!letzterMilitaerStatus) return;
  renderFabrikTabs(letzterMilitaerStatus);
  const einheitenListe = document.getElementById('einheitenListe');
  if (einheitenListe) {
    renderEinheitenListe(letzterMilitaerStatus, einheitenListe, fabrikTyp);
  }
}

/* ── Kaserne-Status rendern ────────────────────────────────── */

function renderKaserneStatus(data, container) {
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

  const stufenSterne = '★'.repeat(kaserneStufe) + '☆'.repeat(maxStufe - kaserneStufe);

  let upgradeHtml = '';
  if (nextUpgrade) {
    const canAfford =
      ressourcen.geld  >= Number(nextUpgrade.kosten_geld)  &&
      ressourcen.stein >= Number(nextUpgrade.kosten_stein) &&
      ressourcen.eisen >= Number(nextUpgrade.kosten_eisen);

    upgradeHtml = `
      <div class="mil-upgrade-box">
        <div class="bau-card-section-title"><u>Upgrade auf Stufe ${nextUpgrade.stufe}</u></div>
        <table class="bau-cost-table">
          <tr><td>Geld</td><td>${Number(nextUpgrade.kosten_geld).toLocaleString('de-DE')} €</td></tr>
          <tr><td>Stein</td><td>${Number(nextUpgrade.kosten_stein).toLocaleString('de-DE')} t</td></tr>
          <tr><td>Eisen</td><td>${Number(nextUpgrade.kosten_eisen).toLocaleString('de-DE')} t</td></tr>
          <tr><td>Bauzeit</td><td>${nextUpgrade.bauzeit_minuten} Minuten</td></tr>
        </table>
        <button
          class="bau-btn-bauen"
          id="btnUpgradeKaserne"
          onclick="doUpgradeKaserne()"
          ${canAfford ? '' : 'disabled'}
        >Kaserne ausbauen</button>
        ${canAfford ? '' : '<p class="mil-not-possible">Nicht genug Ressourcen</p>'}
      </div>`;
  } else {
    upgradeHtml = '<p class="mil-max-stufe">Kaserne ist auf maximaler Stufe.</p>';
  }

  container.innerHTML = `
    <div class="mil-kaserne-status">
      <div class="mil-stufe-row">
        <span class="mil-stufe-label">Aktuelle Stufe:</span>
        <span class="mil-stufe-val">Stufe ${kaserneStufe} von ${maxStufe} &nbsp; ${stufenSterne}</span>
      </div>
      ${upgradeHtml}
    </div>`;
}

/* ── Einheitenliste rendern ────────────────────────────────── */

function renderEinheitenListe(data, container, fabrikTyp = 'Kaserne') {
  const { kaserneStufe, fahrzeugfabrikAnzahl, einheiten } = data;

  // Prüft, ob die aktuell ausgewählte Ausbildungsstätte bereits gebaut wurde.
  let gebaeudeDa = false;
  if (fabrikTyp === 'Kaserne') {
    gebaeudeDa = kaserneStufe > 0;
  } else if (fabrikTyp === 'Fahrzeugfabrik') {
    gebaeudeDa = (fahrzeugfabrikAnzahl || 0) > 0;
  }

  if (!gebaeudeDa) {
    container.innerHTML = `<p class="empty-state">Keine ${escapeHtml(fabrikTyp)} vorhanden – Einheiten nicht verfügbar.</p>`;
    return;
  }

  const gefilterteEinheiten = (einheiten || []).filter(
    (e) => (e.fabrik_typ || 'Kaserne') === fabrikTyp
  );

  if (gefilterteEinheiten.length === 0) {
    container.innerHTML = '<p class="empty-state">Keine Einheitentypen verfügbar.</p>';
    return;
  }

  container.innerHTML = gefilterteEinheiten.map((e) => {
    let verfuegbar = false;
    if (fabrikTyp === 'Kaserne') {
      verfuegbar = kaserneStufe >= Number(e.kaserne_stufe_min);
    } else if (fabrikTyp === 'Fahrzeugfabrik') {
      verfuegbar = (fahrzeugfabrikAnzahl || 0) > 0;
    }
    const ausbildungszeit = formatAusbildungszeit(Number(e.reisezeit_minuten));

    return `
      <div class="mil-einheit-row ${verfuegbar ? '' : 'mil-einheit-locked'}">
        <div class="mil-einheit-img">
          <div class="bau-img-placeholder mil-einheit-placeholder"></div>
        </div>
        <div class="mil-einheit-info">
          <div class="mil-einheit-name">${escapeHtml(e.name)}</div>
          <div class="mil-einheit-stats">
            <span>Angriff: <strong>${escapeHtml(String(e.angriff))}</strong></span>
            <span>Abwehr: <strong>${escapeHtml(String(e.abwehr))}</strong></span>
            <span>Ausbildungszeit: <strong>${escapeHtml(ausbildungszeit)}</strong></span>
          </div>
          <div class="mil-einheit-vorhanden">Vorhanden: ${Number(e.anzahl).toLocaleString('de-DE')}</div>
          ${fabrikTyp === 'Kaserne' && !verfuegbar ? `<div class="mil-not-possible">Benötigt Kaserne Stufe ${escapeHtml(String(e.kaserne_stufe_min))}</div>` : ''}
        </div>
        <div class="mil-einheit-kosten">
          <div class="bau-card-section-title"><u>Kosten</u></div>
          <table class="bau-cost-table">
            <tr><td>Geld</td><td>${Number(e.kosten_geld).toLocaleString('de-DE')} €</td></tr>
            <tr><td>Stein</td><td>${Number(e.kosten_stein).toLocaleString('de-DE')} t</td></tr>
            <tr><td>Eisen</td><td>${Number(e.kosten_eisen).toLocaleString('de-DE')} t</td></tr>
          </table>
        </div>
        <div class="mil-einheit-ausbilden">
          <div class="bau-card-section-title"><u>Ausbilden</u></div>
          ${verfuegbar
            ? `<div class="bau-anzahl-row">
                <input
                  type="number"
                  id="anzahl-einheit-${parseInt(e.id, 10)}"
                  class="bau-anzahl-input"
                  min="1"
                  value="1"
                >
                <button class="bau-btn-bauen" onclick="doTrainEinheit(${parseInt(e.id, 10)})">Ausbilden</button>
              </div>`
            : `<span class="mil-not-possible">Noch nicht möglich</span>`
          }
        </div>
      </div>`;
  }).join('');
}

/* ── Kaserne upgraden ──────────────────────────────────────── */

async function doUpgradeKaserne() {
  const message = document.getElementById('message');
  const btn = document.getElementById('btnUpgradeKaserne');
  if (btn) btn.disabled = true;

  // Triggert das Kaserne-Upgrade im Backend.
  const result = await postData('/api/military/upgrade', {});
  if (message) message.textContent = result.message;

  if (result.status) {
    renderStatus(result.status);
  }

  await loadMilitaerStatus();
}

/* ── Einheit ausbilden ─────────────────────────────────────── */

async function doTrainEinheit(einheitTypId) {
  const message = document.getElementById('message');
  const input = document.getElementById(`anzahl-einheit-${einheitTypId}`);
  const anzahl = input ? Math.max(1, parseInt(input.value, 10) || 1) : 1;

  // Triggert die Ausbildung/Produktion der gewählten Einheit im Backend.
  const result = await postData('/api/military/train', { einheitTypId, anzahl });
  if (message) message.textContent = result.message;

  if (result.status) {
    renderStatus(result.status);
  }

  await loadMilitaerStatus();
}

/* ── Hilfsfunktion: Ausbildungszeit formatieren ───────────── */

function formatAusbildungszeit(minuten) {
  const h = Math.floor(minuten / 60);
  const m = minuten % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00 h`;
}

/* ── Initialisierung ───────────────────────────────────────── */

loadMilitaerStatus();
