/**
 * auth.js – Registrierung & Login
 * Benötigt: utils.js (escapeHtml, setEl, postData)
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

    const result = await postData("/api/login", { email, passwort });
    message.textContent = result.message;

    if (result.spieler) {
      window.location.href = "/dashboard.html";
    }
  });
}
