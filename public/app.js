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

/* Dashboard laden */
async function loadDashboard() {
  const spielerName = document.getElementById("spielerName");
  if (!spielerName) return;

  const response = await fetch("/api/me");
  if (!response.ok) {
    window.location.href = "/login.html";
    return;
  }

  const data = await response.json();

  document.getElementById("spielerName").textContent = data.name;
  document.getElementById("spielerEmail").textContent = data.email;
  document.getElementById("geld").textContent = data.geld;
  document.getElementById("stein").textContent = data.stein;
  document.getElementById("eisen").textContent = data.eisen;
  document.getElementById("strom").textContent = data.strom;
  document.getElementById("treibstoff").textContent = data.treibstoff;
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