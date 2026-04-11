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

  setEl("stromProduktion", data.strom.produktion);
  setEl("stromVerbrauch", data.strom.verbrauch);
  setEl("stromFrei", data.strom.frei);

  setEl("einBauzentrale", Number(data.produktion.geld).toLocaleString("de-DE") + " €");
  setEl("gesamtGeld", Number(data.produktion.geld).toLocaleString("de-DE") + " €");
  setEl("prodGeld", Number(data.produktion.geld).toLocaleString("de-DE") + " €");
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

  const buildingTypes = await response.json();

  container.innerHTML = buildingTypes
    .map(
      (building) => `
        <div class="building-item">
          <strong>${escapeHtml(building.name)}</strong> (${escapeHtml(building.kategorie)})<br>
          Kosten:
          Geld ${escapeHtml(String(building.kosten_geld))},
          Stein ${escapeHtml(String(building.kosten_stein))},
          Eisen ${escapeHtml(String(building.kosten_eisen))},
          Treibstoff ${escapeHtml(String(building.kosten_treibstoff))}<br>
          Produktion:
          Geld ${escapeHtml(String(building.einkommen_geld))},
          Stein ${escapeHtml(String(building.produktion_stein))},
          Eisen ${escapeHtml(String(building.produktion_eisen))},
          Treibstoff ${escapeHtml(String(building.produktion_treibstoff))}<br>
          Strom:
          +${escapeHtml(String(building.strom_produktion))} / -${escapeHtml(String(building.strom_verbrauch))}<br><br>
          <button onclick="buildBuilding(${parseInt(building.id, 10)})">Bauen</button>
        </div>
      `
    )
    .join("");
}

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