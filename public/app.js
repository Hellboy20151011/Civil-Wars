function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

async function postData(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  return response.json();
}

/* Registrierung */
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const passwort = document.getElementById("passwort").value;
    const message = document.getElementById("message");

    const result = await postData("/api/register", { name, email, passwort });
    message.textContent = result.message;

    if (result.spieler) {
      window.location.href = "/dashboard.html";
    }
  });
}

/* Login */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const passwort = document.getElementById("passwort").value;
    const message = document.getElementById("message");

    const result = await postData("/api/login", { email, passwort });
    message.textContent = result.message;

    if (result.spieler) {
      window.location.href = "/dashboard.html";
    }
  });
}

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

function renderStatus(data) {
  setEl("spielerName", data.name);
  setEl("spielerEmail", data.email);

  setEl("geld", Number(data.ressourcen.geld).toLocaleString("de-DE") + " €");
  setEl("stein", Number(data.ressourcen.stein).toLocaleString("de-DE"));
  setEl("eisen", Number(data.ressourcen.eisen).toLocaleString("de-DE"));
  setEl("treibstoff", Number(data.ressourcen.treibstoff).toLocaleString("de-DE"));
  setEl("bewohner", Number(data.bewohner || 0).toLocaleString("de-DE"));

  setEl("stromProduktion", data.strom.produktion);
  setEl("stromVerbrauch", data.strom.verbrauch);
  setEl("stromFrei", data.strom.frei);

  const einnahmen = data.einnahmen || {};
  const gesamtEinnahmen = Number(einnahmen.gesamt ?? data.produktion.geld);
  const mietEinnahmen   = Number(einnahmen.miete   ?? 0);
  const steuerEinnahmen = Number(einnahmen.steuern ?? 0);
  const sonstigeEinnahmen = Number(einnahmen.sonstige ?? data.produktion.geld);

  setEl("einBauzentrale", sonstigeEinnahmen.toLocaleString("de-DE") + " €");
  setEl("einMieteinnahmen", mietEinnahmen.toLocaleString("de-DE") + " €");
  setEl("einSteuern", steuerEinnahmen.toLocaleString("de-DE") + " €");
  setEl("gesamtGeld", gesamtEinnahmen.toLocaleString("de-DE") + " €");
  setEl("prodGeld", gesamtEinnahmen.toLocaleString("de-DE") + " €");
  setEl("prodStein", Number(data.produktion.stein).toLocaleString("de-DE") + " t");
  setEl("prodEisen", Number(data.produktion.eisen).toLocaleString("de-DE") + " t");
  setEl("prodTreibstoff", Number(data.produktion.treibstoff).toLocaleString("de-DE") + " Barrel");

  setEl("tickDauer", data.tickDauerSekunden);
  setEl("ticksVerrechnet", data.ticksVerrechnet);
  setEl("letzteAktualisierung",
    new Date(data.letzteAktualisierung).toLocaleString("de-DE"));

  renderGebaeudeListe(data.gebaeude);
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

async function loadBuildingTypes() {
  const container = document.getElementById("buildingTypes");
  if (!container) return;

  const response = await fetch("/api/buildings/types");

  if (!response.ok) {
    container.innerHTML = '<p class="empty-state">Gebäudetypen konnten nicht geladen werden.</p>';
    return;
  }

  const allBuildingTypes = await response.json();

  /* Spieler-Ressourcen und Gebäude für Zähler */
  let spielerGebaeude = [];
  let ressourcen = null;
  let stromFrei = 0;
  const statusRes = await fetch("/api/me");
  if (statusRes.ok) {
    const statusData = await statusRes.json();
    spielerGebaeude = statusData.gebaeude || [];
    ressourcen = statusData.ressourcen || null;
    stromFrei = statusData.strom ? Number(statusData.strom.frei) : 0;
  }

  /* Aktive Kategorie ermitteln */
  const activeTab = document.querySelector(".bau-tab.active");
  const aktiveKategorie = activeTab ? activeTab.dataset.kategorie : "Unterkunft";

  const filtered = allBuildingTypes.filter(b => b.kategorie === aktiveKategorie);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">Keine Gebäude in dieser Kategorie.</p>';
    return;
  }

  container.innerHTML = filtered
    .map((building) => {
      const gebaut = spielerGebaeude.find(g => Number(g.id) === Number(building.id));
      const anzahlGebaut = gebaut ? Number(gebaut.anzahl) : 0;

      /* Berechne wie viele Gebäude gerade baubar sind */
      let derzeit = 0;
      if (ressourcen) {
        const maxGeld  = Number(building.kosten_geld)  > 0 ? Math.floor(Number(ressourcen.geld)  / Number(building.kosten_geld))  : Infinity;
        const maxStein = Number(building.kosten_stein) > 0 ? Math.floor(Number(ressourcen.stein) / Number(building.kosten_stein)) : Infinity;
        const maxEisen = Number(building.kosten_eisen) > 0 ? Math.floor(Number(ressourcen.eisen) / Number(building.kosten_eisen)) : Infinity;
        const maxStrom = Number(building.strom_verbrauch) > 0 ? Math.floor(stromFrei / Number(building.strom_verbrauch)) : Infinity;
        const finite = [maxGeld, maxStein, maxEisen, maxStrom].filter(v => v !== Infinity);
        derzeit = finite.length > 0 ? Math.max(0, Math.min(...finite)) : 0;
      }

      /* Beschreibung dynamisch aus Datenbankfeldern erzeugen */
      const bewohner = Number(building.bewohner || 0);
      const miete = Number(building.einkommen_geld || 0);
      let descLines = '';
      if (bewohner > 0) {
        descLines += `<p class="bau-desc-line">Bietet Platz für ${bewohner.toLocaleString("de-DE")} Bewohner.</p>`;
        descLines += `<p class="bau-desc-line">Mieteinnahmen: ${miete.toLocaleString("de-DE")} € / Tick</p>`;
        descLines += `<p class="bau-desc-line">Steuereinnahmen: ${bewohner.toLocaleString("de-DE")} € / Tick</p>`;
      } else if (miete > 0) {
        descLines += `<p class="bau-desc-line">Einnahmen: ${miete.toLocaleString("de-DE")} € / Tick</p>`;
      }

      return `
        <div class="bau-card">
          <div class="bau-card-header">${escapeHtml(building.name)}</div>
          <div class="bau-card-body">
            <div class="bau-card-left">
              <div class="bau-card-section-title"><u>Beschreibung</u></div>
              <div class="bau-card-desc">${descLines}</div>
              <div class="bau-card-bauzeit">Bauzeit &nbsp;&nbsp; --:--:-- h</div>
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
                <tr><td>Derzeit baubar</td><td>${escapeHtml(String(derzeit))} Stück</td></tr>
              </table>
            </div>
            <div class="bau-card-img">
              <div class="bau-img-placeholder"></div>
              <button class="bau-btn-bauen" onclick="buildBuilding(${parseInt(building.id, 10)})">Bauen</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

/* Tab-Switching für Bauzentrum */
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("bau-tab")) return;
  document.querySelectorAll(".bau-tab").forEach(t => t.classList.remove("active"));
  e.target.classList.add("active");
  await loadBuildingTypes();
});

async function buildBuilding(gebaeudeTypId) {
  const message = document.getElementById("message");

  const result = await postData("/api/buildings/build", { gebaeudeTypId });
  if (message) message.textContent = result.message;

  if (result.status) {
    renderStatus(result.status);
    await loadBuildingTypes();
  }
}

loadDashboard();

/* Logout */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await fetch("/api/logout", {
      method: "POST"
    });

    window.location.href = "/login.html";
  });
}