/**
 * auth.js – Registrierung & Login
 * Benötigt: utils.js (escapeHtml, setEl, postData)
 * API-Verknüpfung:
 * - Formular "Registrieren" -> POST /api/register -> auth.routes -> auth.controller.register
 * - Formular "Login" -> POST /api/login -> auth.routes -> auth.controller.login
 */

/* Registrierungsformular */
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const passwort = document.getElementById("passwort").value;
    const message = document.getElementById("message");

    // Leitet die Formulardaten an den Backend-Endpoint für Registrierung weiter.
    const result = await postData("/api/register", { name, email, passwort });
    message.textContent = result.message;

    if (result.spieler) {
      window.location.href = "/dashboard.html";
    }
  });
}

/* Login-Formular */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const passwort = document.getElementById("passwort").value;
    const message = document.getElementById("message");

    // Leitet die Logindaten an den Backend-Endpoint für Session-Login weiter.
    const result = await postData("/api/login", { email, passwort });
    message.textContent = result.message;

    if (result.spieler) {
      window.location.href = "/dashboard.html";
    }
  });
}
