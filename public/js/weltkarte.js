/**
 * weltkarte.js – Weltkarte mit Spielerpositionen
 * Zeigt alle Spieler auf einer Canvas-Karte an.
 * Berechnet die Entfernung zum eigenen Spieler.
 * Berechnet die Reisezeit so, dass:
 * - direkte Nachbarn mindestens 5 Minuten brauchen
 * - maximal entfernte Spieler höchstens 120 Minuten brauchen
 */

/* Karten-Einstellungen */
const KARTE_GROESSE = 999;        /* Koordinatenbereich: 1 bis 999 */
const MIN_REISEZEIT = 5;          /* direkter Nachbar = mindestens 5 Minuten */
const MAX_REISEZEIT = 120;        /* größte mögliche Distanz = maximal 120 Minuten */

/* Maximale mögliche Entfernung auf der Karte:
   von Ecke zu Ecke, also ungefähr sqrt((999-1)^2 + (999-1)^2) */
const MAX_ENTFERNUNG = Math.round(
  Math.sqrt((KARTE_GROESSE - 1) ** 2 + (KARTE_GROESSE - 1) ** 2)
);

/* ── Hilfsfunktionen ─────────────────────────────────────────── */

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function escapeHtml(wert) {
  if (wert === null || wert === undefined) return '';
  return String(wert)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ── Entfernung berechnen ──────────────────────────────────────
   Euklidische Distanz zwischen zwei Koordinatenpunkten.
   Formel: sqrt((x2-x1)^2 + (y2-y1)^2), gerundet auf ganze Felder. */
function berechneEntfernung(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.round(Math.sqrt(dx * dx + dy * dy));
}

/* ── Reisezeit berechnen ───────────────────────────────────────
   Lineare Skalierung:
   - Entfernung 1 => 5 Minuten
   - maximale Entfernung => 120 Minuten
   - Entfernung 0 => 0 Minuten (eigener Spieler) */
function berechneReisezeit(entfernung) {
  if (entfernung <= 0) return 0;

  if (MAX_ENTFERNUNG <= 1) {
    return MIN_REISEZEIT;
  }

  const begrenzteEntfernung = Math.min(entfernung, MAX_ENTFERNUNG);

  const reisezeit =
    MIN_REISEZEIT +
    ((begrenzteEntfernung - 1) / (MAX_ENTFERNUNG - 1)) *
      (MAX_REISEZEIT - MIN_REISEZEIT);

  return Math.round(reisezeit * 10) / 10;
}

/* ── Canvas-Karte zeichnen ─────────────────────────────────────
   Zeichnet alle Spieler als Punkte auf dem Canvas.
   Der eigene Spieler wird blau hervorgehoben, andere rot. */
function zeichneKarte(canvas, alleSpieler, eigenerId) {
  const ctx = canvas.getContext('2d');
  const breite = canvas.width;
  const hoehe = canvas.height;

  /* Hintergrund */
  ctx.fillStyle = '#13161c';
  ctx.fillRect(0, 0, breite, hoehe);

  /* Gitterlinien alle 100 Felder */
  ctx.strokeStyle = '#2e3340';
  ctx.lineWidth = 1;

  for (let i = 0; i <= KARTE_GROESSE; i += 100) {
    const xPixel = Math.round((i / KARTE_GROESSE) * breite);
    const yPixel = Math.round((i / KARTE_GROESSE) * hoehe);

    /* Vertikale Linie */
    ctx.beginPath();
    ctx.moveTo(xPixel, 0);
    ctx.lineTo(xPixel, hoehe);
    ctx.stroke();

    /* Horizontale Linie */
    ctx.beginPath();
    ctx.moveTo(0, yPixel);
    ctx.lineTo(breite, yPixel);
    ctx.stroke();
  }

  /* Alle Spieler als Punkte zeichnen */
  alleSpieler.forEach((spieler) => {
    if (
      spieler.koordinate_x === null ||
      spieler.koordinate_y === null ||
      spieler.koordinate_x === undefined ||
      spieler.koordinate_y === undefined
    ) {
      return;
    }

    const xPixel = Math.round((spieler.koordinate_x / KARTE_GROESSE) * breite);
    const yPixel = Math.round((spieler.koordinate_y / KARTE_GROESSE) * hoehe);

    const istEigener = spieler.id === eigenerId;

    /* Punkt */
    ctx.fillStyle = istEigener ? '#7cc8ff' : '#e57373';
    ctx.beginPath();
    ctx.arc(xPixel, yPixel, istEigener ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();

    /* Spielername */
    ctx.fillStyle = istEigener ? '#7cc8ff' : '#ccc';
    ctx.font = istEigener ? 'bold 11px Arial' : '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(spieler.name, xPixel, yPixel - 9);
  });
}

/* ── Spielerliste rendern ──────────────────────────────────────
   Zeigt alle Spieler in einer Tabelle mit Koordinaten,
   Entfernung und Reisezeit. */
function renderSpielerListe(alleSpieler, eigeneSpieler) {
  const container = document.getElementById('spielerTabelle');
  if (!container) return;

  if (!alleSpieler || alleSpieler.length === 0) {
    container.innerHTML =
      '<tr><td colspan="5" class="empty-state">Keine Spieler gefunden.</td></tr>';
    return;
  }

  const rows = alleSpieler.map((spieler) => {
    const istEigener = spieler.id === eigeneSpieler.id;
    let entfernung = '-';
    let reisezeit = '-';

    const hatEigeneKoordinaten =
      eigeneSpieler &&
      eigeneSpieler.koordinate_x !== null &&
      eigeneSpieler.koordinate_y !== null &&
      eigeneSpieler.koordinate_x !== undefined &&
      eigeneSpieler.koordinate_y !== undefined;

    const hatSpielerKoordinaten =
      spieler &&
      spieler.koordinate_x !== null &&
      spieler.koordinate_y !== null &&
      spieler.koordinate_x !== undefined &&
      spieler.koordinate_y !== undefined;

    if (istEigener) {
      entfernung = '0 (du)';
      reisezeit = '-';
    } else if (hatEigeneKoordinaten && hatSpielerKoordinaten) {
      const dist = berechneEntfernung(
        eigeneSpieler.koordinate_x,
        eigeneSpieler.koordinate_y,
        spieler.koordinate_x,
        spieler.koordinate_y
      );

      entfernung = dist;
      reisezeit = berechneReisezeit(dist) + ' Min.';
    }

    const hervorhebung = istEigener
      ? ' style="color: #7cc8ff; font-weight: bold;"'
      : '';

    return `
      <tr${hervorhebung}>
        <td>${escapeHtml(spieler.name)}</td>
        <td>${spieler.koordinate_x ?? '-'}</td>
        <td>${spieler.koordinate_y ?? '-'}</td>
        <td>${entfernung}</td>
        <td>${reisezeit}</td>
      </tr>
    `;
  });

  container.innerHTML = rows.join('');
}

/* ── Seite laden ─────────────────────────────────────────────── */
async function ladeWeltkarte() {
  try {
    /* Eigenen Spielerstatus holen */
    const meRes = await fetch('/api/me');

    if (!meRes.ok) {
      window.location.href = '/login.html';
      return;
    }

    const eigeneSpieler = await meRes.json();

    /* Eigene Koordinaten im Header anzeigen */
    const kx =
      eigeneSpieler.koordinate_x !== null &&
      eigeneSpieler.koordinate_x !== undefined
        ? eigeneSpieler.koordinate_x
        : '-';

    const ky =
      eigeneSpieler.koordinate_y !== null &&
      eigeneSpieler.koordinate_y !== undefined
        ? eigeneSpieler.koordinate_y
        : '-';

    setEl('spielerName', eigeneSpieler.name);
    setEl('spielerKoord', `${kx}:${ky}`);

    /* Alle Spieler laden */
    const karteRes = await fetch('/api/weltkarte');

    if (!karteRes.ok) {
      setEl('karteMessage', 'Karte konnte nicht geladen werden.');
      return;
    }

    const alleSpieler = await karteRes.json();

    /* Canvas zeichnen */
    const canvas = document.getElementById('weltkarteCanvas');
    if (canvas) {
      zeichneKarte(canvas, alleSpieler, eigeneSpieler.id);
    }

    /* Tabelle rendern */
    renderSpielerListe(alleSpieler, eigeneSpieler);
  } catch (fehler) {
    console.error('Fehler beim Laden der Weltkarte:', fehler);
    setEl('karteMessage', 'Fehler beim Laden der Weltkarte.');
  }
}

/* Seite initialisieren */
ladeWeltkarte();

/* Logout-Button */
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (fehler) {
      console.error('Fehler beim Logout:', fehler);
    }

    window.location.href = '/login.html';
  });
}