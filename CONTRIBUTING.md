# 🤝 Mitwirken an Civil-Wars

Vielen Dank für dein Interesse, zum Projekt beizutragen! Dieses Dokument erklärt, wie du mitmachen kannst.

---

## 📋 Voraussetzungen

Bevor du anfängst, stelle sicher, dass du folgende Tools installiert hast:

- [Node.js](https://nodejs.org/) (Version 20 oder höher)
- [PostgreSQL](https://www.postgresql.org/) (Version 14 oder höher)
- [Git](https://git-scm.com/)

---

## 🚀 Lokale Entwicklungsumgebung einrichten

1. **Repository forken und klonen:**
   ```bash
   git clone https://github.com/DEIN_BENUTZERNAME/Civil-Wars.git
   cd Civil-Wars
   ```

2. **In den Backend-Ordner wechseln und Abhängigkeiten installieren:**
   ```bash
   cd backend
   npm install
   ```

3. **Umgebungsvariablen einrichten:**
   ```bash
   cp .env.example .env
   # Öffne .env und trage deine Datenbankdaten ein
   ```

4. **Datenbank anlegen und Schema einlesen:**
   ```bash
   createdb civil_wars
   psql -d civil_wars -f database/schema.sql
   ```

5. **Server starten:**
   ```bash
   npm start
   ```

6. **Spiel öffnen:** Navigiere zu `http://localhost:3000`

---

## 🌿 Branch-Konvention

Erstelle für jede Änderung einen eigenen Branch:

| Typ | Beispiel |
|---|---|
| Neues Feature | `feature/kampfsystem` |
| Bugfix | `fix/ressourcen-anzeige` |
| Dokumentation | `docs/readme-update` |
| Refactoring | `refactor/auth-controller` |

---

## 📝 Commit-Nachrichten

Schreibe kurze, aussagekräftige Commit-Nachrichten auf Deutsch oder Englisch:

```
feat: Kampfsystem implementiert (Angriff und Verteidigung)
fix: Ressourcen-Overflow bei Tick-Berechnung behoben
docs: NEXT_STEPS.md aktualisiert
refactor: auth.controller in kleinere Funktionen aufgeteilt
```

---

## 🔀 Pull Request erstellen

1. Stelle sicher, dass dein Branch auf dem neuesten Stand ist:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. Erstelle einen Pull Request auf GitHub und fülle die PR-Vorlage vollständig aus.

3. Wichtige Punkte im PR:
   - Beschreibe **was** du geändert hast und **warum**
   - Gib kurze Schritte zum manuellen Testen an
   - Füge Screenshots hinzu, wenn du UI-Änderungen gemacht hast
   - Bestätige, dass die **Spielmechanik nicht vereinfacht oder abgeschwächt** wurde

---

## 🏗️ Projektstruktur einhalten

Halte die bestehende Trennung zwischen den Schichten ein:

```
Route → Controller → Service / Repository → Datenbank
```

- **Routen** (`routes/`) definieren nur Endpunkte und binden Middleware ein
- **Controller** (`controllers/`) verarbeiten HTTP-Requests und delegieren weiter
- **Services** (`services/`) enthalten Spiellogik und Berechnungen
- **Repositories** (`repositories/`) kapseln alle SQL-Abfragen
- **Frontend-JS** (`public/js/`) kommuniziert nur über die API mit dem Backend

---

## 🎮 Wichtige Spielregel

> Die Spielmechanik darf **nicht vereinfacht oder abgeschwächt** werden, nur um den Code einfacher zu machen. Vereinfachungen betreffen ausschließlich Lesbarkeit, Struktur und Wartbarkeit.

---

## 🐛 Bugs melden

Nutze die [Bug-Report-Vorlage](.github/ISSUE_TEMPLATE/bug_report.md) im Issue-Tracker.

## 💡 Features vorschlagen

Nutze die [Feature-Request-Vorlage](.github/ISSUE_TEMPLATE/feature_request.md) im Issue-Tracker.

## 📚 Dokumentation verbessern

Nutze die [Dokumentations-Vorlage](.github/ISSUE_TEMPLATE/dokumentation.md) im Issue-Tracker.

---

## ❓ Fragen?

Öffne einfach ein neues Issue mit deiner Frage – wir helfen gerne!
