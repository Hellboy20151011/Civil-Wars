# 🧾 Repository Audit

**Stand: 2026-04-22 · Basis: `main`-Branch**

---

## 📊 Summary

* **Score: 9.5 / 10**
* Critical Issues: 0
* Warnings: 5
* Bewertungslogik: Startwert 10, pro Critical -1.5 Punkte, pro Warning -0.1 Punkte.

> **Vergleich zum letzten Audit (PR #57, Score 6.2/10):**
> Alle 15 damals gemeldeten Findings (2 Critical, 13 Warnings) wurden vollständig behoben.
> Neu identifiziert: 5 Warnings (0 Critical).

---

## ✅ Behobene Issues aus PR #57

Die folgenden Findings aus dem vorherigen Audit sind im aktuellen Stand von `main` vollständig behoben:

| # | Kategorie | Datei / Zeile | Status |
|---|-----------|---------------|--------|
| 1 | Bug | `auth.controller.js:61-63` – Falsche Fehlermeldung bei UNIQUE-Kollision | ✅ Behoben (Zeilen 63–72: constraint-spezifische Meldungen) |
| 2 | Bug | `bauzentrumView.js:186-192` – Bau-Button bleibt bei Fehler deaktiviert | ✅ Behoben (`try/catch/finally` in `onBuildButtonClick`) |
| 3 | Bug | `liveState.js:63-65` – Kein `try/catch` im Initial-Callback | ✅ Behoben (Zeilen 65–69: `try/catch` ergänzt) |
| 4 | Dead Code | `public/js/dashboard.js` – Nicht eingebunden | ✅ Datei entfernt |
| 5 | Dead Code | `public/js/militaer.js` – Nicht eingebunden | ✅ Datei entfernt |
| 6 | Dead Code | `einheiten.repository.js:findAllEinheitenTypen` – Nicht aufgerufen | ✅ Funktion entfernt |
| 7 | Security | `config/index.js:25` – Hartes Fallback-Session-Secret | ✅ Behoben (zufälliger `crypto.randomBytes`-Wert + Warnung) |
| 8 | Security | `config/index.js:30` – Hartes Default-DB-Passwort | ✅ Behoben (`process.exit(1)` wenn `DB_PASSWORD` fehlt) |
| 9 | Security | `weltkarte.controller.js` – Keine Paginierung/Limit | ✅ Behoben (`MAX_LIMIT = 200`, Query-Parameter `limit`/`offset`) |
| 10 | Performance | `economy.service.js:143-145` – N+1 in `processFertigeBauauftraege` | ✅ Behoben (`batchUpsertSpielerGebaeude` + einzelnes `DELETE`) |
| 11 | Performance | `military.controller.js:27,35-38` – Alle Kaserne-Stufen geladen | ✅ Behoben (`findKaserneStufenById(nextStufe)`) |
| 12 | Performance | `buildings.controller.js:75-77` – Zwei serielle Einzelabfragen | ✅ Behoben (`findBohrturmUndRaffinerie` – ein Roundtrip) |
| 13 | Architecture | Legacy-Dateien `dashboard.js` / `militaer.js` parallel zu `pages/*` | ✅ Behoben (Dateien entfernt) |
| 14 | Architecture | `README.md:103-107` – Veraltete Frontend-Struktur dokumentiert | ✅ Behoben (README zeigt modulare `core/`/`render/`/`pages/`-Struktur) |
| 15 | Architecture | `weltkarte.js:26-39` – `setEl`/`escapeHtml` lokal dupliziert | ✅ Behoben (globale Helfer aus `utils.js` werden genutzt) |

---

## 🐛 Bugs

* `public/weltkarte.html:82`
  → Problem: Der UI-Text lautet „Die Reisezeit beim Angriff berechnet sich aus der Entfernung: **1 Feld = 1 Minute** Reisezeit." Die tatsächliche Berechnungslogik in `public/js/weltkarte.js:38-53` (`berechneReisezeit`) skaliert jedoch linear zwischen **5 Minuten** (direkter Nachbar) und **120 Minuten** (maximale Entfernung). Der Hinweistext ist damit inhaltlich falsch.
  → Fix: UI-Text anpassen, z. B. „Reisezeit: 5 Min. (Nachbar) bis 120 Min. (max. Entfernung)".

---

## 🧹 Dead Code

* `backend/src/repositories/building.repository.js:129-133`
  → `findKaserneStufen` (lädt **alle** Kaserne-Stufen) ist exportiert (Zeile 241), wird aber nirgendwo im Codebase importiert oder aufgerufen. Die gezieltere Funktion `findKaserneStufenById` hat sie vollständig ersetzt.
  → Fix: Funktionsdefinition und Export entfernen.

* `backend/src/repositories/building.repository.js:192-195`
  → `deleteBauauftrag` (löscht einen einzelnen Auftrag per ID) ist exportiert (Zeile 247), wird aber nirgendwo aufgerufen. Die Batch-Variante `deleteFertigeBauauftraege` hat sie vollständig ersetzt.
  → Fix: Funktionsdefinition und Export entfernen.

---

## 🔐 Security Issues

> Alle kritischen Security-Issues aus PR #57 sind behoben. Derzeit keine neuen kritischen Findings.

---

## ⚡ Performance Issues

* `backend/src/repositories/building.repository.js:209-228`
  → `batchUpsertSpielerGebaeude` fasst Bauaufträge zwar nach Gebäudetyp zusammen, führt aber intern noch eine `for`-Schleife aus – ein `INSERT … ON CONFLICT` pro Typ. Bei der aktuellen Gebäudeanzahl unkritisch; ein echter Single-Statement-Upsert via `unnest` / mehrzeiligem `VALUES` wäre robuster bei wachsender Typenanzahl.
  → Fix (Nice-to-have): Single-Statement-Upsert mit `unnest($1::int[], $2::int[])` für alle Typen in einem Roundtrip.

---

## 🏗 Architecture Issues

* `public/js/weltkarte.js` (gesamte Datei)
  → Die Weltkarten-Seite folgt nicht dem modularen Muster des restlichen Frontends (`core/api.js`, `pages/*.page.js`). Sie ruft `fetch()` direkt auf, enthält ihren eigenen Bootstrap-Aufruf (`ladeWeltkarte()` am Dateiende, Zeile 237) und hat keinen `pages/`-Einstiegspunkt. Das erzeugt eine Architektur-Inkonsistenz gegenüber `dashboard.page.js`, `bauzentrum.page.js` und `militaer.page.js`.
  → Fix: Refactor in `public/js/pages/weltkarte.page.js` (Bootstrap) + Auslagerung der API-Calls in `CoreApi` oder einen eigenen `weltkarte.api.js`-Wrapper, analog zu den anderen Seiten.

---

## 🚀 Priorities

1. **Critical fixes** – keine offenen Critical-Issues.
2. **Improvements**
   - Dokumentationsinkonsistenz in `public/weltkarte.html:82` (Reisezeit-Text) korrigieren.
   - Dead-Code-Exporte `findKaserneStufen` und `deleteBauauftrag` aus `building.repository.js` entfernen.
3. **Nice-to-have**
   - `batchUpsertSpielerGebaeude` auf echten Single-Statement-Upsert umstellen.
   - `weltkarte.js` in die modulare `pages/`-Architektur überführen.
