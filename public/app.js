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
    container.innerHTML = "<p>Noch keine Gebäude vorhanden.</p>";
    return;
  }

  container.innerHTML = gebaeude
    .map(
      (g) => `
        <div class="building-item">
          <strong>${g.name}</strong> (${g.kategorie})<br>
          Anzahl: ${g.anzahl}<br>
          Strom: +${g.strom_produktion} / -${g.strom_verbrauch}
        </div>
      `
    )
    .join("");
}

function renderStatus(data) {
  document.getElementById("spielerName").textContent = data.name;
  document.getElementById("spielerEmail").textContent = data.email;

  document.getElementById("geld").textContent = data.ressourcen.geld;
  document.getElementById("stein").textContent = data.ressourcen.stein;
  document.getElementById("eisen").textContent = data.ressourcen.eisen;
  document.getElementById("treibstoff").textContent = data.ressourcen.treibstoff;

  document.getElementById("stromProduktion").textContent = data.strom.produktion;
  document.getElementById("stromVerbrauch").textContent = data.strom.verbrauch;
  document.getElementById("stromFrei").textContent = data.strom.frei;

  document.getElementById("prodGeld").textContent = data.produktion.geld;
  document.getElementById("prodStein").textContent = data.produktion.stein;
  document.getElementById("prodEisen").textContent = data.produktion.eisen;
  document.getElementById("prodTreibstoff").textContent = data.produktion.treibstoff;

  document.getElementById("tickDauer").textContent = data.tickDauerSekunden;
  document.getElementById("ticksVerrechnet").textContent = data.ticksVerrechnet;
  document.getElementById("letzteAktualisierung").textContent =
    new Date(data.letzteAktualisierung).toLocaleString("de-DE");

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

  await loadBuildingTypes();
}

async function loadBuildingTypes() {
  const container = document.getElementById("buildingTypes");
  if (!container) return;

  const response = await fetch("/api/buildings/types");
  const buildingTypes = await response.json();

  container.innerHTML = buildingTypes
    .map(
      (building) => `
        <div class="building-item">
          <strong>${building.name}</strong> (${building.kategorie})<br>
          Kosten:
          Geld ${building.kosten_geld},
          Stein ${building.kosten_stein},
          Eisen ${building.kosten_eisen},
          Treibstoff ${building.kosten_treibstoff}<br>
          Produktion:
          Geld ${building.einkommen_geld},
          Stein ${building.produktion_stein},
          Eisen ${building.produktion_eisen},
          Treibstoff ${building.produktion_treibstoff}<br>
          Strom:
          +${building.strom_produktion} / -${building.strom_verbrauch}<br><br>
          <button onclick="buildBuilding(${building.id})">Bauen</button>
        </div>
      `
    )
    .join("");
}

async function buildBuilding(gebaeudeTypId) {
  const message = document.getElementById("message");

  const result = await postData("/api/buildings/build", { gebaeudeTypId });
  message.textContent = result.message;

  if (result.status) {
    const meResponse = await fetch("/api/me");
    const meData = await meResponse.json();
    renderStatus(meData);
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