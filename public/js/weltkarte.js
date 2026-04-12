/**
 * weltkarte.js – Weltkarte mit Spielerpositionen
 * Zeigt alle Spieler auf einer Canvas-Karte an.
 * Berechnet die Entfernung zum eigenen Spieler.
 */

/* Karten-Einstellungen */
const KARTE_GROESSE = 999;   /* Koordinatenbereich: 1 bis 999 */
const KARTE_ABSTAND = 1;     /* Reisegeschwindigkeit: 1 Feld pro Minute */

/* ── Entfernung berechnen ──────────────────────────────────────
   Euklidische Distanz zwischen zwei Koordinatenpunkten.
   Die Entfernung bestimmt die Reisezeit beim Angriff.
   Formel: sqrt((x2-x1)^2 + (y2-y1)^2), gerundet auf ganze Felder. */
function berechneEntfernung(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.round(Math.sqrt(dx * dx + dy * dy));
}

/* ── Reisezeit berechnen ───────────────────────────────────────
   Reisezeit in Minuten = Entfernung × Reisefaktor. */
function berechneReisezeit(entfernung) {
  return entfernung * KARTE_ABSTAND;
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
    const xPixel = Math.round((spieler.koordinate_x / KARTE_GROESSE) * breite);
    const yPixel = Math.round((spieler.koordinate_y / KARTE_GROESSE) * hoehe);

    /* Eigener Spieler = blau, andere = rot */
    const istEigener = spieler.id === eigenerId;
    ctx.fillStyle = istEigener ? '#7cc8ff' : '#e57373';
    ctx.beginPath();
    ctx.arc(xPixel, yPixel, istEigener ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();

    /* Spielername über dem Punkt */
    ctx.fillStyle = istEigener ? '#7cc8ff' : '#ccc';
    ctx.font = istEigener ? 'bold 11px Arial' : '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(spieler.name, xPixel, yPixel - 9);
  });
}

/* ── Spielerliste rendern ──────────────────────────────────────
   Zeigt alle Spieler in einer Tabelle mit Koordinaten und
   berechneter Entfernung sowie Reisezeit. */
function renderSpielerListe(alleSpieler, eigeneSpieler) {
  const container = document.getElementById('spielerTabelle');
  if (!container) return;

  if (!alleSpieler || alleSpieler.length === 0) {
    container.innerHTML = '<tr><td colspan="5" class="empty-state">Keine Spieler gefunden.</td></tr>';
    return;
  }

  const rows = alleSpieler.map((spieler) => {
    const istEigener = spieler.id === eigeneSpieler.id;
    let entfernung = '-';
    let reisezeit = '-';

    /* Entfernung und Reisezeit nur für andere Spieler berechnen */
    if (!istEigener && eigeneSpieler.koordinate_x !== null) {
      const dist = berechneEntfernung(
        eigeneSpieler.koordinate_x,
        eigeneSpieler.koordinate_y,
        spieler.koordinate_x,
        spieler.koordinate_y
      );
      entfernung = dist;
      reisezeit = berechneReisezeit(dist) + ' Min.';
    } else if (istEigener) {
      entfernung = '0 (du)';
      reisezeit = '-';
    }

    const hervorhebung = istEigener ? ' style="color: #7cc8ff; font-weight: bold;"' : '';
    return `
      <tr${hervorhebung}>
        <td>${escapeHtml(spieler.name)}</td>
        <td>${spieler.koordinate_x}</td>
        <td>${spieler.koordinate_y}</td>
        <td>${entfernung}</td>
        <td>${reisezeit}</td>
      </tr>
    `;
  });

  container.innerHTML = rows.join('');
}

/* ── Seite laden ───────────────────────────────────────────── */
async function ladeWeltkarte() {
  /* Eigenen Spielerstatus holen (für Koordinaten und ID) */
  const meRes = await fetch('/api/me');
  if (!meRes.ok) {
    window.location.href = '/login.html';
    return;
  }
  const eigeneSpieler = await meRes.json();

  /* Eigene Koordinaten im Header anzeigen */
  const kx = eigeneSpieler.koordinate_x !== null ? eigeneSpieler.koordinate_x : '-';
  const ky = eigeneSpieler.koordinate_y !== null ? eigeneSpieler.koordinate_y : '-';
  setEl('spielerName', eigeneSpieler.name);
  setEl('spielerKoord', kx + ':' + ky);

  /* Alle Spieler von der Weltkarte-API laden */
  const karteRes = await fetch('/api/weltkarte');
  if (!karteRes.ok) {
    document.getElementById('karteMessage').textContent = 'Karte konnte nicht geladen werden.';
    return;
  }
  const alleSpieler = await karteRes.json();

  /* Canvas zeichnen */
  const canvas = document.getElementById('weltkarteCanvas');
  if (canvas) {
    zeichneKarte(canvas, alleSpieler, eigeneSpieler.id);
  }

  /* Spielerliste darunter anzeigen */
  renderSpielerListe(alleSpieler, eigeneSpieler);
}

/* Seite initialisieren */
ladeWeltkarte();

/* Logout-Button */
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });
}
