# 🗺️ Civil-Wars – Nächste Schritte

Dieses Dokument beschreibt die nächsten sinnvollen Entwicklungsschritte für das Projekt, basierend auf dem aktuellen Stand des Repos.

---

## ✅ Aktueller Stand

| Feature | Status |
|---|---|
| Registrierung & Login | ✅ Fertig |
| Session-Verwaltung | ✅ Fertig |
| Ressourcen-System (Geld, Stein, Eisen, Treibstoff, Strom) | ✅ Fertig |
| Tick-basierte Produktion | ✅ Fertig |
| Gebäude bauen & verwalten | ✅ Fertig |
| Militär – Kaserne-Upgrades | ✅ Fertig |
| Militär – Infanterie ausbilden | ✅ Fertig |
| Militär – Fahrzeuge produzieren (Fahrzeugfabrik) | ⚠️ Backend-Logik vorhanden, aber Kosten & Balance fehlen noch |

---

## 🔜 Nächste Schritte (nach Priorität)

### 1. 🚗 Fahrzeugfabrik fertigstellen

**Warum jetzt?** Die Fahrzeugfabrik-Tabelle und Einheitentypen (Geländewagen, Schützenpanzer, Kampfpanzer) sind in der Datenbank vorhanden. Die Kosten und Bauzeit der Fahrzeugfabrik sind jedoch noch auf `0` gesetzt.

**Was zu tun ist:**
- Kosten & Bauzeit für die Fahrzeugfabrik in `schema.sql` festlegen
- Sicherstellen, dass der Fahrzeugfabrik-Tab in `militaer.html` korrekt angezeigt wird
- Testen, ob Fahrzeuge produziert werden können, sobald eine Fahrzeugfabrik gebaut wurde

---

### 2. ⚔️ Kampfsystem implementieren

**Warum jetzt?** Das ist der Kern-PvP-Feature des Spiels. Die nötige Basis ist vorhanden (Einheiten mit Angriff/Abwehr-Werten, Reisezeit in der DB), aber der eigentliche Angriffs-Ablauf fehlt noch komplett.

**Was zu tun ist:**
- Neue DB-Tabelle `kampf_auftraege` für laufende Angriffe anlegen (Angreifer, Verteidiger, Einheiten, Start-/Ankunftszeit)
- Neue Route `POST /api/attack` zum Starten eines Angriffs erstellen
- `attack.controller.js`, `attack.service.js` anlegen (Kampfberechnung: Angriff vs. Abwehr)
- Kampfergebnis-Logik: Ressourcen/Gebäude abziehen beim Verlierer, Belohnungen für den Gewinner
- Neue Seite `angriff.html` zum Auswählen von Ziel und Einheiten
- Angriffsprotokoll (Kampfberichte) anzeigen

---

### 3. 🌍 Koordinatensystem & Weltkarte

**Warum jetzt?** Die Spalten `koordinate_x` und `koordinate_y` existieren bereits in der `spieler`-Tabelle, werden aber noch nicht genutzt.

**Was zu tun ist:**
- Koordinaten beim Registrieren eines neuen Spielers automatisch vergeben
- Neue Seite `weltkarte.html` erstellen, die eine einfache Gitter-Karte der Spieler zeigt
- Entfernung zwischen Spielern berechnen, um Reisezeit beim Angriff zu bestimmen

---

### 4. 🏆 Highscore-Seite

**Warum jetzt?** Ein Highscore ist eine einfache Funktion mit großem Motivationseffekt. Der Navigationspunkt ist bereits vorhanden (`<a href="#">Highscore</a>`).

**Was zu tun ist:**
- Neue Route `GET /api/highscore` anlegen, die z. B. nach Anzahl Gebäude, Einheiten oder Ressourcen sortiert
- Neue Seite `highscore.html` erstellen
- Verlinkung im Navigationsmenü aktivieren

---

### 5. 👤 Spieler-Profil-Seite

**Warum jetzt?** Jeder Spieler sollte sein eigenes Profil einsehen können. Der Link ist im Menü vorhanden, aber es gibt keine Seite.

**Was zu tun ist:**
- Neue Route `GET /api/spieler/:id` anlegen (öffentliche Profildaten)
- Neue Seite `profil.html` erstellen mit: Name, Beitrittsdatum, Gebäudeanzahl, Einheitenanzahl
- Verlinkung im Navigationsmenü aktivieren

---

### 6. 🔍 Spieler-Suche

**Warum jetzt?** Um andere Spieler anzugreifen oder Nachrichten zu senden, braucht man eine Suche.

**Was zu tun ist:**
- Route `GET /api/spieler/suche?q=name` anlegen
- Einfache Suchseite `suche.html` erstellen mit Trefferliste und Link zum Profil

---

### 7. ✉️ Nachrichten-System

**Warum jetzt?** Direkte Kommunikation zwischen Spielern ist ein wichtiges Multiplayer-Feature.

**Was zu tun ist:**
- Neue DB-Tabelle `nachrichten` anlegen (Von, An, Betreff, Text, Gelesen, Zeitstempel)
- Routen: `GET /api/nachrichten`, `POST /api/nachrichten`, `PATCH /api/nachrichten/:id/gelesen`
- Neue Seite `nachrichten.html` mit Posteingang und Nachricht schreiben
- Verlinkung im Navigationsmenü aktivieren

---

### 8. 🔬 Forschungssystem

**Warum jetzt?** Das Forschungslabor-Gebäude existiert bereits, aber es gibt keine Forschungslogik.

**Was zu tun ist:**
- DB-Tabelle für Forschungstypen und Spieler-Forschungen anlegen
- Routen und Controller für Forschung erstellen
- Neue Seite `forschung.html` für die Forschungsübersicht
- Forschungen können z. B. Produktionsraten verbessern oder neue Gebäude freischalten

---

### 9. 🏦 Bank

**Warum jetzt?** Das Bank-Gebäude ist in der DB definiert, aber ohne Funktion.

**Was zu tun ist:**
- Einzahlen/Auszahlen-Logik implementieren (max. 100.000.000 €, mit Zinsen)
- Route `POST /api/bank/einzahlen` und `POST /api/bank/auszahlen`
- Neue Seite `bank.html` erstellen

---

### 10. 🕵️ Geheimdienst

**Warum jetzt?** Das Geheimdienstzentrum-Gebäude ist in der DB, aber es gibt kein Gameplay dafür.

**Was zu tun ist:**
- Spionageaufgaben definieren (z. B. Ressourcen ausspähen, Gebäude sabotieren)
- DB-Tabelle für Spionage-Aufträge anlegen
- Routen und Controller für Spionage implementieren
- Neue Seite `geheimdienst.html` erstellen

---

### 11. 🛡️ Unionen (Allianzen)

**Warum jetzt?** Der Menüpunkt „Union" ist vorhanden, aber ohne Funktion.

**Was zu tun ist:**
- DB-Tabellen für Unionen anlegen (`unionen`, `union_mitglieder`)
- Routen: Union gründen, beitreten, verlassen, auflösen
- Neue Seite `union.html` mit Übersicht über die eigene Union
- Gemeinsamer Schutz oder Angriff als mögliche Spielmechanik

---

### 12. ✈️ Lufteinheiten (Flughafen)

**Hinweis:** Das Flughafen-Gebäude hat noch keine Kosten und Bauzeit definiert.

**Was zu tun ist:**
- Kosten und Bauzeit für den Flughafen in `schema.sql` festlegen
- Lufteinheiten-Typen (z. B. Kampfjet, Bomber) in `einheiten_typen` anlegen
- Neue Frontend-Seite oder Tab für Lufteinheiten

---

### 13. ⚓ Marineeinheiten (Schiffswerft)

**Hinweis:** Die Schiffswerft hat ebenfalls noch keine Kosten und ist nicht implementiert.

**Was zu tun ist:**
- Kosten und Bauzeit für die Schiffswerft in `schema.sql` festlegen
- Marineeinheiten-Typen (z. B. Patrouillenboot, Zerstörer) anlegen
- Frontend-Tab für Marineeinheiten

---

### 14. 🧪 Tests hinzufügen

**Warum?** Aktuell gibt es keinerlei automatische Tests im Projekt. Das macht spätere Änderungen riskant.

**Was zu tun ist:**
- Test-Framework einrichten (z. B. **Jest** + **Supertest** für Backend-API-Tests)
- Tests für die wichtigsten Endpunkte schreiben: Auth, Gebäude bauen, Einheiten ausbilden
- Kampfberechnung unit-testen (pure Funktion, leicht testbar)

---

### 15. 🔁 CI/CD-Pipeline einrichten

**Warum?** Automatisiertes Testen und Deployen spart Zeit und verhindert Fehler.

**Was zu tun ist:**
- GitHub Actions Workflow anlegen (`.github/workflows/ci.yml`)
- `npm install && npm test` bei jedem Push/PR ausführen
- Optional: Automatisches Deployment auf einen Server (z. B. Railway, Render, oder eigener VPS)

---

## 💡 Kurzfristige Quick-Wins (< 1 Tag Aufwand)

Diese Änderungen sind klein, verbessern aber sofort die Spielerfahrung:

- **Bauzentrum-Menü aktualisieren**: Wenn ein Spieler kein Kraftwerk hat, Warnung anzeigen (Strom fehlt)
- **Punkte-Berechnung**: Spalte oder berechneten Wert für Spielerpunkte hinzufügen (z. B. Gebäude-Wert + Einheiten-Stärke)
- **Ressourcen-Obergrenzen**: Maximalwerte für Ressourcen einführen (z. B. Lager-Kapazität)
- **Gebäude-Abreißen**: Funktion zum Entfernen von Gebäuden implementieren
- **Bauzeit anzeigen**: Im Bauzentrum die verbleibende Bauzeit für laufende Aufträge anzeigen (API gibt `fertig_am` zurück – nur noch Frontend nötig)

---

> Zuletzt aktualisiert: April 2026
