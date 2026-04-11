🛡️ Civil-Wars

Civil-Wars ist ein browserbasiertes Strategiespiel, in dem Spieler ihre eigene Basis aufbauen, Ressourcen verwalten und strategisch gegen andere Spieler antreten.

🎮 Spielprinzip

Der Spieler startet mit einer kleinen Basis und entwickelt diese Schritt für Schritt weiter:

🏗️ Basisaufbau
Errichte Gebäude, erweitere deine Infrastruktur und optimiere deine Produktion.
⚙️ Ressourcenmanagement
Verwalte wichtige Ressourcen wie:
Geld
Stein
Eisen
Strom
Treibstoff
📈 Wachstum durch Expansion
Mehr Gebäude bedeuten höhere Einnahmen – aber auch steigende Kosten.
Eine effiziente Balance ist entscheidend für langfristigen Erfolg.
⚔️ Kampfsystem

Sobald deine Basis stark genug ist, kannst du andere Spieler angreifen:

Plane strategische Angriffe
Nutze deine militärischen Gebäude zur Truppenproduktion
Gewinne Kämpfe, um deine Macht auszubauen

🏴‍☠️ Belohnungssystem:

Besiegte Gegner verlieren einen Teil ihrer Gebäude, den du übernehmen kannst.

🧠 Strategie im Fokus

Civil-Wars kombiniert:

langfristige Planung
wirtschaftliches Denken
taktische Entscheidungen im Kampf

Jede Entscheidung beeinflusst deinen Fortschritt und deine Dominanz im Spiel.

🛠️ Features (aktuell / geplant)
✅ Registrierung & Login
✅ Ressourcen-System
✅ Gebäudeverwaltung
🔄 Kampfsystem (in Entwicklung)
🔄 Multiplayer-Interaktionen
🔄 Karten-/Weltsystem
🚀 Ziel des Projekts

Ein tiefgehendes, langfristig motivierendes Browsergame zu entwickeln, das klassische Aufbaustrategie mit kompetitiven PvP-Elementen verbindet.

---

## 📁 Projektstruktur

```
Civil-Wars/
├── backend/                  # Node.js / Express Server
│   ├── database/             # Datenbankskripte
│   │   └── schema.sql        # Vollständiges Datenbankschema (Tabellen + Seed-Daten)
│   ├── src/                  # Anwendungsquellcode
│   │   ├── index.js          # Einstiegspunkt – startet den HTTP-Server
│   │   ├── app.js            # Express-App-Konfiguration (Middleware, Routen)
│   │   ├── db.js             # Datenbank-Verbindungspool (PostgreSQL)
│   │   ├── config/
│   │   │   └── index.js      # Zentrale Konfiguration (Umgebungsvariablen)
│   │   ├── controllers/      # HTTP-Request-Handler (thin layer)
│   │   │   ├── auth.controller.js
│   │   │   ├── buildings.controller.js
│   │   │   └── me.controller.js
│   │   ├── middleware/       # Express-Middleware
│   │   │   ├── asyncWrapper.js   # Async-Fehlerweiterleitung
│   │   │   ├── auth.js           # Authentifizierungsprüfung
│   │   │   ├── errorHandler.js   # Zentraler Fehler-Handler
│   │   │   ├── rateLimiters.js   # Rate-Limiting
│   │   │   └── validate.js       # Zod-Schema-Validierung
│   │   ├── repositories/     # Datenbankabfragen (Data Access Layer)
│   │   │   ├── building.repository.js
│   │   │   ├── einheiten.repository.js
│   │   │   ├── player.repository.js
│   │   │   └── resources.repository.js
│   │   ├── routes/           # Express-Routen-Definitionen
│   │   │   ├── auth.routes.js
│   │   │   ├── buildings.routes.js
│   │   │   └── me.routes.js
│   │   └── services/         # Geschäftslogik
│   │       ├── economy.service.js   # Tick-Produktion, Strom, Einnahmen
│   │       └── player.service.js    # Spielerstatus aggregieren
│   ├── .env.example          # Vorlage für Umgebungsvariablen
│   └── package.json
└── public/                   # Statisches Frontend (HTML / CSS / JS)
    ├── index.html            # Startseite
    ├── login.html            # Login-Seite
    ├── register.html         # Registrierungsseite
    ├── dashboard.html        # Spieler-Dashboard
    ├── bauzentrum.html       # Bauzentrum
    ├── style.css             # Globales Stylesheet
    └── js/                   # Frontend-JavaScript (modular)
        ├── utils.js          # Hilfsfunktionen (escapeHtml, setEl, postData)
        ├── auth.js           # Login- und Registrierungslogik
        └── dashboard.js      # Dashboard, Gebäudeverwaltung, Logout
```

### Architektur-Überblick (Backend)

```
Request → Route → Middleware (auth, validate, rateLimit) → Controller → Service / Repository → DB
```

- **Routes** definieren Endpunkte und binden Middleware ein.
- **Controllers** verarbeiten HTTP-Requests und delegieren Logik an Services / Repositories.
- **Services** enthalten die Geschäftslogik (z. B. Tick-Berechnung, Wirtschaftssystem).
- **Repositories** kapseln alle SQL-Abfragen.
- **Middleware** übernimmt übergreifende Aufgaben (Auth, Validierung, Fehlerbehandlung).

### Erste Schritte

1. In den Backend-Ordner wechseln: `cd backend`
2. Abhängigkeiten installieren: `npm install`
3. `.env.example` nach `.env` kopieren und Werte eintragen
4. Datenbankschema einlesen: `psql -d civil_wars -f database/schema.sql`
5. Server starten: `npm start`
