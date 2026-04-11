/**
 * utils.js – Allgemeine Hilfsfunktionen
 * Wird als erstes Script eingebunden und stellt globale Helfer bereit.
 */

/**
 * Wandelt einen String in HTML-sichere Zeichen um (XSS-Schutz).
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Setzt den Textinhalt eines Elements per ID.
 * @param {string} id
 * @param {string|number} value
 */
function setEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * Sendet JSON-Daten per POST an eine URL und gibt die JSON-Antwort zurück.
 * @param {string} url
 * @param {object} data
 * @returns {Promise<object>}
 */
async function postData(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}
