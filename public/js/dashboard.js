/**
 * dashboard.js – Dashboard, Gebäudeverwaltung & Logout
 * Benötigt: utils.js (escapeHtml, setEl, postData)
 */

/* ── Militär-Navigationslink aktualisieren ─────────────────── */

function updateMilitaerNav(gebaeude) {
  const hasMilitaer = gebaeude && gebaeude.some(
    (g) => g.kategorie === 'Militär' && Number(g.anzahl) > 0
  );
  const navMilitaer = document.getElementById('navMilitaer');
  if (navMilitaer) {
    if (hasMilitaer) {
      navMilitaer.href = 'militaer.html';
      navMilitaer.classList.remove('nav-italic');
    } else {
      navMilitaer.href = '#';
    }
  }
}

/* ── Gebäudeliste ──────────────────────────────────────────── */

function renderGebaeudeListe(gebaeude) {
  const container = document.getElementById("meineGebaeudeListe");
  if (!container) return;

  if (!gebaeude || gebaeude.length === 0) {
    container.innerHTML = '<span class="empty-state">- Noch keine Gebäude gebaut! -</span>';
    return;
  }

  container.innerHTML = gebaeude
    .map(
      (g) => `
        <div class="gebaeude-item">
          <span class="gebaeude-name">${escapeHtml(g.name)}</span>
          <span class="gebaeude-info">(${escapeHtml(g.kategorie)}) &times; ${escapeHtml(String(g.anzahl))}</span>
          <span class="gebaeude-strom">⚡ +${escapeHtml(String(g.strom_produktion))} / -${escapeHtml(String(g.strom_verbrauch))}</span>
        </div>
      `
    )
    .join("");
}

/* ── Uhr im Header ─────────────────────────────────────────── */

function startClock() {
  const clockEl = document.getElementById("headerTime");
  if (!clockEl) return;

  function tick() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString("de-DE");
  }

  tick();
  setInterval(tick, 1000);
}

/* ── Spielerstatus rendern ─────────────────────────────────── */

function renderStatus(data) {
  setEl("spielerName", data.name);
  setEl("spielerEmail", data.email);
  const kx = data.koordinate_x != null ? data.koordinate_x : "-";
  const ky = data.koordinate_y != null ? data.koordinate_y : "-";
  setEl("spielerKoord", kx + ":" + ky);

  setEl("geld", Number(data.ressourcen.geld).toLocaleString("de-DE") + " €");
  setEl("stein", Number(data.ressourcen.stein).toLocaleString("de-DE"));
  setEl("eisen", Number(data.ressourcen.eisen).toLocaleString("de-DE"));
  setEl("treibstoff", Number(data.ressourcen.treibstoff).toLocaleString("de-DE"));
  setEl("bewohner", Number(data.bewohner || 0).toLocaleString("de-DE"));

  setEl("stromProduktion", data.strom.produktion);
  setEl("stromVerbrauch", data.strom.verbrauch);
  setEl("stromFrei", data.strom.frei);

  const einnahmen = data.einnahmen || {};
  const gesamtEinnahmen   = Number(einnahmen.gesamt   ?? data.produktion.geld);
  const mietEinnahmen     = Number(einnahmen.miete     ?? 0);
  const steuerEinnahmen   = Number(einnahmen.steuern   ?? 0);
  const sonstigeEinnahmen = Number(einnahmen.sonstige  ?? data.produktion.geld);

  setEl("einBauzentrale",   sonstigeEinnahmen.toLocaleString("de-DE") + " €");
  setEl("einMieteinnahmen", mietEinnahmen.toLocaleString("de-DE") + " €");
  setEl("einSteuern",       steuerEinnahmen.toLocaleString("de-DE") + " €");
  setEl("gesamtGeld",       gesamtEinnahmen.toLocaleString("de-DE") + " €");
  setEl("prodGeld",         gesamtEinnahmen.toLocaleString("de-DE") + " €");
  setEl("prodStein",        Number(data.produktion.stein).toLocaleString("de-DE") + " t");
  setEl("prodEisen",        Number(data.produktion.eisen).toLocaleString("de-DE") + " t");
  setEl("prodTreibstoff",   Number(data.produktion.treibstoff).toLocaleString("de-DE") + " Barrel");

  setEl("tickDauer",            data.tickDauerSekunden);
  setEl("ticksVerrechnet",      data.ticksVerrechnet);
  setEl("letzteAktualisierung", new Date(data.letzteAktualisierung).toLocaleString("de-DE"));

  renderGebaeudeListe(data.gebaeude);
  updateMilitaerNav(data.gebaeude);
  renderBauWarteschlange(data.bauauftraege || []);
}

/* ── Bauwarteschlange rendern ───────────────────────────────── */

let _bauQueueTimers = [];
const DASHBOARD_RELOAD_DELAY_MS = 1500;

function formatCountdown(fertigAm) {
  const diff = Math.max(0, new Date(fertigAm) - Date.now());
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

function clearBauQueueTimers() {
  _bauQueueTimers.forEach(clearInterval);
  _bauQueueTimers = [];
}

function renderBauWarteschlange(auftraege) {
  /* Rendert die Bauwarteschlange in beide möglichen Container:
     - #bauWarteschlange auf bauzentrum.html
     - #auftragBauContent auf dashboard.html */
  const queueContainer   = document.getElementById("bauWarteschlange");
  const auftragContainer = document.getElementById("auftragBauContent");

  if (!queueContainer && !auftragContainer) return;

  clearBauQueueTimers();

  if (!auftraege || auftraege.length === 0) {
    if (queueContainer)   queueContainer.innerHTML   = '<span class="empty-state">Keine Gebäude in der Bauwarteschlange.</span>';
    if (auftragContainer) auftragContainer.innerHTML = '<span class="empty-state">- Kein Auftrag vorhanden -</span>';
    return;
  }

  /* HTML für jeden Auftrag aufbauen */
  const itemsHtml = auftraege
    .map((a) => {
      const countdownId = `countdown-${a.id}`;
      return `
        <div class="gebaeude-item bau-queue-item">
          <span class="gebaeude-name">${escapeHtml(a.gebaeude_name)}</span>
          <span class="gebaeude-info">&times; ${escapeHtml(String(a.anzahl))}</span>
          <span class="bau-queue-countdown" id="${countdownId}">⏳ ${formatCountdown(a.fertig_am)}</span>
        </div>
      `;
    })
    .join("");

  try {
    /* Beide Container befüllen (nur die, die auf der aktuellen Seite existieren) */
    if (queueContainer)   queueContainer.innerHTML   = itemsHtml;
    if (auftragContainer) auftragContainer.innerHTML = itemsHtml;

    /* Countdown-Timer für jeden Auftrag starten */
    auftraege.forEach((a) => {
      const el = document.getElementById(`countdown-${a.id}`);
      if (!el) return;
      const timer = setInterval(() => {
        const remaining = new Date(a.fertig_am) - Date.now();
        if (remaining <= 0) {
          el.textContent = '✅ Fertig!';
          clearInterval(timer);
          /* Dashboard neu laden, damit fertige Gebäude erscheinen */
          setTimeout(() => loadDashboard(), DASHBOARD_RELOAD_DELAY_MS);
        } else {
          el.textContent = `⏳ ${formatCountdown(a.fertig_am)}`;
        }
      }, 1000);
      _bauQueueTimers.push(timer);
    });
  } catch (err) {
    clearBauQueueTimers();
    throw err;
  }
}
async function loadDashboard() {
  const spielerName = document.getElementById("spielerName");
  if (!spielerName) return;

  const response = await fetch("/api/me");

  if (!response.ok) {
    window.location.href = "/login.html";
    return;
  }

  const data = await response.json();
  renderStatus(data);
  startClock();

  await loadBuildingTypes();
}

/* ── Gebäudetypen im Bauzentrum laden ─────────────────────── */

async function loadBuildingTypes() {
  const container = document.getElementById("buildingTypes");
  if (!container) return;

  const response = await fetch("/api/buildings/types");

  if (!response.ok) {
    container.innerHTML = '<p class="empty-state">Gebäudetypen konnten nicht geladen werden.</p>';
    return;
  }

  const allBuildingTypes = await response.json();

  /* Spieler-Ressourcen, Gebäude und aktive Warteschlange für Berechnungen */
  let spielerGebaeude = [];
  let ressourcen = null;
  let stromFrei = 0;
  let aktiveQueue = [];
  const statusRes = await fetch("/api/me");
  if (statusRes.ok) {
    const statusData = await statusRes.json();
    spielerGebaeude = statusData.gebaeude || [];
    ressourcen = statusData.ressourcen || null;
    stromFrei = statusData.strom ? Number(statusData.strom.frei) : 0;
    aktiveQueue = statusData.bauauftraege || [];
  }

  /* Aktive Kategorie ermitteln */
  const activeTab = document.querySelector(".bau-tab.active");
  const aktiveKategorie = activeTab ? activeTab.dataset.kategorie : "Unterkunft";

  const filtered = allBuildingTypes.filter((b) => b.kategorie === aktiveKategorie);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">Keine Gebäude in dieser Kategorie.</p>';
    return;
  }

  container.innerHTML = filtered
    .map((building) => {
      const gebaut = spielerGebaeude.find((g) => Number(g.id) === Number(building.id));
      const anzahlGebaut = gebaut ? Number(gebaut.anzahl) : 0;

      /* Prüfe, ob dieses Gebäude bereits aktiv in der Warteschlange ist */
      const bereitsInQueue = aktiveQueue.some(
        (a) => Number(a.gebaeude_typ_id) === Number(building.id) && new Date(a.fertig_am) > new Date()
      );

      /* Berechne wie viele Gebäude derzeit baubar sind */
      let derzeit = 0;
      if (ressourcen) {
        const maxGeld  = Number(building.kosten_geld)      > 0 ? Math.floor(Number(ressourcen.geld)  / Number(building.kosten_geld))      : Infinity;
        const maxStein = Number(building.kosten_stein)     > 0 ? Math.floor(Number(ressourcen.stein) / Number(building.kosten_stein))     : Infinity;
        const maxEisen = Number(building.kosten_eisen)     > 0 ? Math.floor(Number(ressourcen.eisen) / Number(building.kosten_eisen))     : Infinity;
        const maxStrom = Number(building.strom_verbrauch)  > 0 ? Math.floor(stromFrei               / Number(building.strom_verbrauch))  : Infinity;
        const finite   = [maxGeld, maxStein, maxEisen, maxStrom].filter((v) => v !== Infinity);
        derzeit = finite.length > 0 ? Math.max(0, Math.min(...finite)) : 0;

        if (building.name === 'Kaserne') {
          const maxDurchKaserne = Math.max(0, 1 - anzahlGebaut);
          derzeit = Math.min(derzeit, maxDurchKaserne);
        }

        if (building.name === 'Öl-Raffinerie') {
          const bohrturmGebaut = spielerGebaeude.find((g) => g.name === 'Bohrturm');
          const bohrturmAnzahl = bohrturmGebaut ? Number(bohrturmGebaut.anzahl) : 0;
          const maxDurchBohrturm = Math.max(0, bohrturmAnzahl * 5 - anzahlGebaut);
          derzeit = Math.min(derzeit, maxDurchBohrturm);
        }
      }

      /* Beschreibung dynamisch aus Datenbankfeldern erzeugen */
      const bewohner        = Number(building.bewohner          || 0);
      const miete           = Number(building.einkommen_geld    || 0);
      const prodStein       = Number(building.produktion_stein   || 0);
      const prodEisen       = Number(building.produktion_eisen   || 0);
      const prodTreibstoff  = Number(building.produktion_treibstoff || 0);
      const stromProduktion = Number(building.strom_produktion   || 0);

      let descLines = "";
      if (building.beschreibung) {
        descLines += `<p class="bau-desc-line">${escapeHtml(building.beschreibung)}</p>`;
      }
      if (bewohner > 0) {
        descLines += `<p class="bau-desc-line">Bietet Platz für ${bewohner.toLocaleString("de-DE")} Bewohner.</p>`;
        descLines += `<p class="bau-desc-line">Mieteinnahmen: ${miete.toLocaleString("de-DE")} € / Tick</p>`;
        descLines += `<p class="bau-desc-line">Steuereinnahmen: ${bewohner.toLocaleString("de-DE")} € / Tick</p>`;
      } else if (miete > 0) {
        descLines += `<p class="bau-desc-line">Einnahmen: ${miete.toLocaleString("de-DE")} € / Tick</p>`;
      }
      if (stromProduktion > 0) {
        descLines += `<p class="bau-desc-line">Produziert: ${stromProduktion.toLocaleString("de-DE")} MWh Strom / Tick</p>`;
      }
      if (prodStein > 0) {
        descLines += `<p class="bau-desc-line">Produziert: ${prodStein.toLocaleString("de-DE")} t Stein / Tick</p>`;
      }
      if (prodEisen > 0) {
        descLines += `<p class="bau-desc-line">Produziert: ${prodEisen.toLocaleString("de-DE")} t Eisen / Tick</p>`;
      }
      if (prodTreibstoff > 0) {
        descLines += `<p class="bau-desc-line">Produziert: ${prodTreibstoff.toLocaleString("de-DE")} l Treibstoff / Tick</p>`;
      }

      return `
        <div class="bau-card">
          <div class="bau-card-header">${escapeHtml(building.name)}</div>
          <div class="bau-card-body">
            <div class="bau-card-left">
              <div class="bau-card-section-title"><u>Beschreibung</u></div>
              <div class="bau-card-desc">${descLines}</div>
              <div class="bau-card-bauzeit">Bauzeit &nbsp;&nbsp; ${building.bauzeit_minuten > 0 ? escapeHtml(String(building.bauzeit_minuten)) + ' Minuten' : '–'}</div>
            </div>
            <div class="bau-card-right">
              <div class="bau-card-section-title"><u>Kosten:</u></div>
              <table class="bau-cost-table">
                <tr><td>Geld</td><td>${Number(building.kosten_geld).toLocaleString("de-DE")} €</td></tr>
                <tr><td>Stein</td><td>${Number(building.kosten_stein).toLocaleString("de-DE")} t</td></tr>
                <tr><td>Eisen</td><td>${Number(building.kosten_eisen).toLocaleString("de-DE")} t</td></tr>
                <tr><td>Strom</td><td>${Number(building.strom_verbrauch).toLocaleString("de-DE")} MW</td></tr>
              </table>
              <table class="bau-cost-table bau-cost-table-sm">
                <tr><td>Bereits gebaut</td><td>${escapeHtml(String(anzahlGebaut))} Stück</td></tr>
                <tr><td>Derzeit baubar</td><td>${bereitsInQueue ? 'In Warteschlange' : escapeHtml(String(derzeit)) + ' Stück'}</td></tr>
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
                  max="${derzeit}"
                  value="${derzeit === 0 || bereitsInQueue ? 0 : 1}"
                  ${derzeit === 0 || bereitsInQueue ? "disabled" : ""}
                >
                <button class="bau-btn-bauen" onclick="buildBuilding(${parseInt(building.id, 10)})" ${derzeit === 0 || bereitsInQueue ? "disabled" : ""}>Bauen</button>
              </div>
              <p class="bau-anzahl-max">${bereitsInQueue ? 'Bereits in Warteschlange' : escapeHtml(String(derzeit)) + ' maximal'}</p>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

/* Tab-Wechsel im Bauzentrum */
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("bau-tab")) return;
  document.querySelectorAll(".bau-tab").forEach((t) => t.classList.remove("active"));
  e.target.classList.add("active");
  await loadBuildingTypes();
});

/* ── Gebäude bauen ─────────────────────────────────────────── */

async function buildBuilding(gebaeudeTypId) {
  const message = document.getElementById("message");
  const input = document.getElementById(`anzahl-${gebaeudeTypId}`);
  const anzahl = input ? Math.max(1, parseInt(input.value, 10) || 1) : 1;

  const result = await postData("/api/buildings/build", { gebaeudeTypId, anzahl });
  if (message) message.textContent = result.message;

  if (result.status) {
    renderStatus(result.status);
    await loadBuildingTypes();
  }
}

/* ── Initialisierung ───────────────────────────────────────── */

loadDashboard();

/* Logout-Button */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login.html";
  });
}
