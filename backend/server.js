const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const bcrypt = require("bcrypt");
const path = require("path");
const pool = require("./db");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: "user_sessions"
    }),
    secret: "civil-wars-super-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use(express.static(path.join(__dirname, "..", "public")));

function requireLogin(req, res, next) {
  if (!req.session.spieler) {
    return res.status(401).json({ message: "Nicht eingeloggt" });
  }
  next();
}

/* Registrierung */
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, passwort } = req.body;

    if (!name || !email || !passwort) {
      return res.status(400).json({ message: "Bitte alle Felder ausfüllen" });
    }

    const userCheck = await pool.query(
      "SELECT id FROM spieler WHERE name = $1 OR email = $2",
      [name, email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: "Name oder E-Mail bereits vergeben" });
    }

    const hash = await bcrypt.hash(passwort, 10);

    const result = await pool.query(
      "INSERT INTO spieler (name, email, passwort_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hash]
    );

    const spieler = result.rows[0];

    await pool.query(
      "INSERT INTO spieler_ressourcen (spieler_id) VALUES ($1)",
      [spieler.id]
    );

    req.session.spieler = {
      id: spieler.id,
      name: spieler.name,
      email: spieler.email
    };

    res.json({
      message: "Registrierung erfolgreich",
      spieler: req.session.spieler
    });
  } catch (error) {
    console.error("Registrierungsfehler:", error);
    res.status(500).json({ message: "Serverfehler bei Registrierung" });
  }
});

/* Login */
app.post("/api/login", async (req, res) => {
  try {
    const { email, passwort } = req.body;

    if (!email || !passwort) {
      return res.status(400).json({ message: "Bitte E-Mail und Passwort eingeben" });
    }

    const result = await pool.query(
      "SELECT * FROM spieler WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Ungültige Login-Daten" });
    }

    const spieler = result.rows[0];
    const passwortKorrekt = await bcrypt.compare(passwort, spieler.passwort_hash);

    if (!passwortKorrekt) {
      return res.status(400).json({ message: "Ungültige Login-Daten" });
    }

    req.session.spieler = {
      id: spieler.id,
      name: spieler.name,
      email: spieler.email
    };

    res.json({
      message: "Login erfolgreich",
      spieler: req.session.spieler
    });
  } catch (error) {
    console.error("Loginfehler:", error);
    res.status(500).json({ message: "Serverfehler bei Login" });
  }
});

/* Session prüfen */
app.get("/api/me", requireLogin, async (req, res) => {
  try {
    const spielerId = req.session.spieler.id;

    const result = await pool.query(
      `SELECT s.id, s.name, s.email,
              r.geld, r.stein, r.eisen, r.strom, r.treibstoff
       FROM spieler s
       JOIN spieler_ressourcen r ON r.spieler_id = s.id
       WHERE s.id = $1`,
      [spielerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Spieler nicht gefunden" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Fehler bei /api/me:", error);
    res.status(500).json({ message: "Serverfehler" });
  }
});

/* Logout */
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout fehlgeschlagen" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logout erfolgreich" });
  });
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});