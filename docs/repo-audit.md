# 🧾 Repository Audit

## 📊 Summary

* Score: 6.2/10
* Critical Issues: 2
* Warnings: 9

---

## 🐛 Bugs

* `backend/src/controllers/auth.controller.js:61-63`
  → Problem: Jeder `23505`-Fehler wird als „Name oder E-Mail bereits vergeben“ gemeldet. Bei Kollision der Weltkarten-Koordinaten (`UNIQUE (koordinate_x, koordinate_y)`) ist die Fehlermeldung fachlich falsch.
  → Fix: `error.constraint` auswerten und unterschiedliche Meldungen für `spieler_name_key`, `spieler_email_key`, `spieler_koordinate_x_koordinate_y_key` zurückgeben.

* `public/js/render/bauzentrumView.js:186-192`
  → Problem: Der Build-Button wird sofort deaktiviert, aber bei Netzwerk-/Runtime-Fehlern nicht garantiert wieder aktiviert (kein `try/finally`). Das kann die UI in einem „Button bleibt deaktiviert“-Zustand lassen.
  → Fix: API-Aufruf in `try/catch/finally` kapseln und im `finally` den Button-Zustand deterministisch zurücksetzen (oder direkt neu rendern).

* `public/js/core/liveState.js:63-65`
  → Problem: Beim direkten Initial-Callback in `subscribe` fehlt ein `try/catch`; ein Fehler im Subscriber kann den Aufrufer unterbrechen.
  → Fix: Callback-Aufruf konsistent wie in `notify()` absichern (`try/catch` + Logging).

---

## 🧹 Dead Code

* `public/js/dashboard.js`
  → Not imported anywhere (wird in keiner HTML-Datei per `<script>` eingebunden). Funktional durch `public/js/pages/dashboard.page.js` + `public/js/render/*` ersetzt.

* `public/js/militaer.js`
  → Not imported anywhere (wird in keiner HTML-Datei per `<script>` eingebunden). Funktional durch `public/js/pages/militaer.page.js` + `public/js/render/militaerView.js` ersetzt.

* `backend/src/repositories/einheiten.repository.js:10-14`
  → `findAllEinheitenTypen` ist exportiert, aber im Repository aktuell ohne Aufrufer.

---

## 🔐 Security Issues

* `backend/src/config/index.js:25`
  → Problem: Harte Fallback-Session-Secret (`civil-wars-super-secret`) erlaubt vorhersehbare Session-Signaturen, falls `SESSION_SECRET` in Non-Prod nicht gesetzt ist.
  → Fix: `SESSION_SECRET` in allen Umgebungen verpflichtend machen oder mindestens einen starken, zufälligen Startwert beim Boot erzwingen.

* `backend/src/config/index.js:30`
  → Problem: Hartes Default-DB-Passwort (`admin`) erhöht Risiko von Fehlkonfigurationen in geteilten/staging Umgebungen.
  → Fix: Kein Passwort-Fallback; bei fehlendem `DB_PASSWORD` den Start abbrechen (nicht nur in Production).

* `backend/src/controllers/weltkarte.controller.js:11-13` + `backend/src/routes/weltkarte.routes.js:18`
  → Problem: Endpoint liefert vollständige Spielerliste ohne Paging/Limit. Das ist ein Informationsabfluss-Risiko bei wachsender Spielerbasis (Enumeration aller Accounts mit Koordinaten).
  → Fix: Serverseitige Limits/Paging einführen und nur benötigte Teilmenge zurückgeben (z. B. Sichtfenster/Radius).

---

## ⚡ Performance Issues

* `backend/src/services/economy.service.js:143-145`
  → Problem: Pro fertigem Bauauftrag werden 2 DB-Queries in einer Schleife ausgeführt (`upsert` + `delete`) ⇒ N+1-Muster bei großen Queues.
  → Fix: Batch-Verarbeitung (z. B. `DELETE ... RETURNING` + gruppiertes `UPSERT`) in wenigen Queries.

* `backend/src/controllers/military.controller.js:27,35-38`
  → Problem: Für jede Statusabfrage werden alle `kaserne_stufen` geladen, obwohl nur die nächste Stufe benötigt wird.
  → Fix: Repository-Methode für gezielte Abfrage der nächsten Stufe (`WHERE stufe = $1`) nutzen.

* `backend/src/controllers/buildings.controller.js:75-77`
  → Problem: Für Raffinerie-Regel werden zwei serielle Einzelabfragen ausgeführt (`Bohrturm`, `Öl-Raffinerie`).
  → Fix: Kombinierte Aggregatabfrage (ein Roundtrip) für beide Gebäudezahlen.

---

## 🏗 Architecture Issues

* `public/js/dashboard.js` und `public/js/militaer.js` im Vergleich zu `public/js/pages/*` + `public/js/render/*`
  → Problem: Zwei konkurrierende Frontend-Architekturen liegen parallel im Repo (legacy monolithisch vs. neue modulare Struktur). Das erschwert Wartung und Einsteiger-Onboarding.
  → Fix: Legacy-Dateien entfernen oder klar als deprecated markieren und README auf die aktive Struktur ausrichten.

* `README.md:103-107`
  → Problem: Dokumentation zeigt weiterhin die alten Frontend-Dateien (`dashboard.js`, `militaer.js`) als aktive Struktur, obwohl die HTML-Seiten bereits modulare Dateien laden.
  → Fix: Projektstruktur im README an die tatsächlich eingebundene `core/`, `render/`, `pages/`-Struktur anpassen.

* `public/js/weltkarte.js:26-39`
  → Problem: Utility-Funktionen (`setEl`, `escapeHtml`) werden lokal dupliziert statt die bestehenden Helfer aus `utils.js` konsistent zu nutzen.
  → Fix: Auf gemeinsame Utility-Quelle vereinheitlichen, um Doppelpflege zu vermeiden.

---

## 🚀 Priorities

1. Critical fixes
   - Harte Secrets/Passwörter in `backend/src/config/index.js` entfernen.
   - Fehlerklassifikation in `auth.controller.register` für Unique-Verletzungen korrigieren.
2. Improvements
   - N+1 in `economy.service.processFertigeBauauftraege` und unnötige Roundtrips in Military/Buildings reduzieren.
   - Weltkarten-Endpoint mit Paging/Limit absichern.
3. Nice-to-have
   - Legacy-Frontend-Dateien bereinigen und README-Struktur angleichen.
   - Kleine Robustheitsfixes in `LiveState.subscribe` und Bau-Button-Fehlerpfad.
