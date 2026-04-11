const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const bcrypt = require("bcrypt");
const path = require("path");
const rateLimit = require("express-rate-limit");
const pool = require("./db");

const app = express();
const PORT = 3000;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Zu viele Anfragen. Bitte versuche es später erneut." }
});

/* Zum Testen 30 Sekunden
   Später für Live-Betrieb auf 600 setzen */
const TICK_DURATION_SECONDS = 30;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: "user_sessions"
    }),
    secret: process.env.SESSION_SECRET || "civil-wars-super-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      sameSite: "strict"
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

async function getGebaeudeStatus(spielerId, client = pool) {
  const gebaeudeResult = await client.query(
    `SELECT
        gt.id,
        gt.name,
        gt.kategorie,
        sg.anzahl,
        gt.kosten_geld,
        gt.kosten_stein,
        gt.kosten_eisen,
        gt.kosten_treibstoff,
        gt.einkommen_geld,
        gt.produktion_stein,
        gt.produktion_eisen,
        gt.produktion_treibstoff,
        gt.strom_produktion,
        gt.strom_verbrauch
     FROM spieler_gebaeude sg
     JOIN gebaeude_typen gt ON gt.id = sg.gebaeude_typ_id
     WHERE sg.spieler_id = $1
     ORDER BY gt.id`,
    [spielerId]
  );

  const gebaeude = gebaeudeResult.rows;

  let stromProduktion = 0;
  let stromVerbrauch = 0;
  let produktionGeld = 0;
  let produktionStein = 0;
  let produktionEisen = 0;
  let produktionTreibstoff = 0;

  for (const geb of gebaeude) {
    const anzahl = Number(geb.anzahl);

    stromProduktion += Number(geb.strom_produktion) * anzahl;
    stromVerbrauch += Number(geb.strom_verbrauch) * anzahl;

    produktionGeld += Number(geb.einkommen_geld) * anzahl;
    produktionStein += Number(geb.produktion_stein) * anzahl;
    produktionEisen += Number(geb.produktion_eisen) * anzahl;
    produktionTreibstoff += Number(geb.produktion_treibstoff) * anzahl;
  }

  return {
    gebaeude,
    strom: {
      produktion: stromProduktion,
      verbrauch: stromVerbrauch,
      frei: stromProduktion - stromVerbrauch
    },
    produktion: {
      geld: produktionGeld,
      stein: produktionStein,
      eisen: produktionEisen,
      treibstoff: produktionTreibstoff
    }
  };
}

async function applyProductionTicks(spielerId, client = pool) {
  const ressourcenResult = await client.query(
    `SELECT spieler_id, geld, stein, eisen, treibstoff, letzte_aktualisierung
     FROM spieler_ressourcen
     WHERE spieler_id = $1
     FOR UPDATE`,
    [spielerId]
  );

  if (ressourcenResult.rows.length === 0) {
    throw new Error("Ressourcen des Spielers nicht gefunden");
  }

  const ressourcen = ressourcenResult.rows[0];
  const gebaeudeStatus = await getGebaeudeStatus(spielerId, client);

  const letzteAktualisierung = new Date(ressourcen.letzte_aktualisierung);
  const jetzt = new Date();

  const vergangeneSekunden = Math.floor((jetzt - letzteAktualisierung) / 1000);
  const vergangeneTicks = Math.floor(vergangeneSekunden / TICK_DURATION_SECONDS);

  if (vergangeneTicks <= 0) {
    return {
      ticks: 0,
      ressourcen: {
        geld: Number(ressourcen.geld),
        stein: Number(ressourcen.stein),
        eisen: Number(ressourcen.eisen),
        treibstoff: Number(ressourcen.treibstoff)
      },
      strom: gebaeudeStatus.strom,
      produktion: gebaeudeStatus.produktion,
      gebaeude: gebaeudeStatus.gebaeude,
      letzteAktualisierung
    };
  }

  const addGeld = gebaeudeStatus.produktion.geld * vergangeneTicks;
  const addStein = gebaeudeStatus.produktion.stein * vergangeneTicks;
  const addEisen = gebaeudeStatus.produktion.eisen * vergangeneTicks;
  const addTreibstoff = gebaeudeStatus.produktion.treibstoff * vergangeneTicks;

  const neueLetzteAktualisierung = new Date(
    letzteAktualisierung.getTime() + vergangeneTicks * TICK_DURATION_SECONDS * 1000
  );

  const updateResult = await client.query(
    `UPDATE spieler_ressourcen
     SET geld = geld + $1,
         stein = stein + $2,
         eisen = eisen + $3,
         treibstoff = treibstoff + $4,
         letzte_aktualisierung = $5
     WHERE spieler_id = $6
     RETURNING geld, stein, eisen, treibstoff, letzte_aktualisierung`,
    [
      addGeld,
      addStein,
      addEisen,
      addTreibstoff,
      neueLetzteAktualisierung,
      spielerId
    ]
  );

  const neueRessourcen = updateResult.rows[0];

  return {
    ticks: vergangeneTicks,
    ressourcen: {
      geld: Number(neueRessourcen.geld),
      stein: Number(neueRessourcen.stein),
      eisen: Number(neueRessourcen.eisen),
      treibstoff: Number(neueRessourcen.treibstoff)
    },
    strom: gebaeudeStatus.strom,
    produktion: gebaeudeStatus.produktion,
    gebaeude: gebaeudeStatus.gebaeude,
    letzteAktualisierung: neueRessourcen.letzte_aktualisierung
  };
}

async function getSpielerStatus(spielerId, client = pool) {
  const spielerResult = await client.query(
    `SELECT id, name, email
     FROM spieler
     WHERE id = $1`,
    [spielerId]
  );

  if (spielerResult.rows.length === 0) {
    throw new Error("Spieler nicht gefunden");
  }

  const tickStatus = await applyProductionTicks(spielerId, client);

  return {
    id: spielerResult.rows[0].id,
    name: spielerResult.rows[0].name,
    email: spielerResult.rows[0].email,
    ressourcen: tickStatus.ressourcen,
    strom: tickStatus.strom,
    produktion: tickStatus.produktion,
    gebaeude: tickStatus.gebaeude,
    ticksVerrechnet: tickStatus.ticks,
    tickDauerSekunden: TICK_DURATION_SECONDS,
    letzteAktualisierung: tickStatus.letzteAktualisierung
  };
}

/* Registrierung */
app.post("/api/register", authLimiter, async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, email, passwort } = req.body;

    if (!name || !email || !passwort) {
      return res.status(400).json({ message: "Bitte alle Felder ausfüllen" });
    }

    await client.query("BEGIN");

    const userCheck = await client.query(
      "SELECT id FROM spieler WHERE name = $1 OR email = $2",
      [name, email]
    );

    if (userCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Name oder E-Mail bereits vergeben" });
    }

    const hash = await bcrypt.hash(passwort, 10);

    const result = await client.query(
      "INSERT INTO spieler (name, email, passwort_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hash]
    );

    const spieler = result.rows[0];

    await client.query(
      `INSERT INTO spieler_ressourcen (spieler_id, letzte_aktualisierung)
       VALUES ($1, CURRENT_TIMESTAMP)`,
      [spieler.id]
    );

    const hauptgebaeude = await client.query(
      "SELECT id FROM gebaeude_typen WHERE name = 'Hauptgebäude' LIMIT 1"
    );

    if (hauptgebaeude.rows.length > 0) {
      await client.query(
        `INSERT INTO spieler_gebaeude (spieler_id, gebaeude_typ_id, anzahl)
         VALUES ($1, $2, 1)
         ON CONFLICT (spieler_id, gebaeude_typ_id)
         DO UPDATE SET anzahl = spieler_gebaeude.anzahl + 1`,
        [spieler.id, hauptgebaeude.rows[0].id]
      );
    }

    await client.query("COMMIT");

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
    await client.query("ROLLBACK");
    console.error("Registrierungsfehler:", error);
    res.status(500).json({ message: "Serverfehler bei Registrierung" });
  } finally {
    client.release();
  }
});

/* Login */
app.post("/api/login", authLimiter, async (req, res) => {
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

/* Spielerdaten */
app.get("/api/me", requireLogin, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const status = await getSpielerStatus(req.session.spieler.id, client);

    await client.query("COMMIT");
    res.json(status);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Fehler bei /api/me:", error);
    res.status(500).json({ message: "Serverfehler" });
  } finally {
    client.release();
  }
});

/* Gebäudetypen */
app.get("/api/buildings/types", requireLogin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM gebaeude_typen
       ORDER BY id`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Fehler bei /api/buildings/types:", error);
    res.status(500).json({ message: "Serverfehler" });
  }
});

/* Gebäude bauen */
app.post("/api/buildings/build", requireLogin, async (req, res) => {
  const client = await pool.connect();

  try {
    const spielerId = req.session.spieler.id;
    const gebaeudeTypId = parseInt(req.body.gebaeudeTypId, 10);

    if (!gebaeudeTypId || isNaN(gebaeudeTypId)) {
      return res.status(400).json({ message: "Gebäudetyp fehlt" });
    }

    await client.query("BEGIN");

    /* Erst alte Produktion verrechnen */
    await applyProductionTicks(spielerId, client);

    const gebaeudeResult = await client.query(
      `SELECT *
       FROM gebaeude_typen
       WHERE id = $1`,
      [gebaeudeTypId]
    );

    if (gebaeudeResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Gebäudetyp nicht gefunden" });
    }

    const gebaeude = gebaeudeResult.rows[0];

    if (gebaeude.name === "Hauptgebäude") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Hauptgebäude kann nicht gebaut werden" });
    }

    const ressourcenResult = await client.query(
      `SELECT *
       FROM spieler_ressourcen
       WHERE spieler_id = $1
       FOR UPDATE`,
      [spielerId]
    );

    if (ressourcenResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Ressourcen nicht gefunden" });
    }

    const ressourcen = ressourcenResult.rows[0];

    if (Number(ressourcen.geld) < Number(gebaeude.kosten_geld)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Zu wenig Geld" });
    }

    if (Number(ressourcen.stein) < Number(gebaeude.kosten_stein)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Zu wenig Stein" });
    }

    if (Number(ressourcen.eisen) < Number(gebaeude.kosten_eisen)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Zu wenig Eisen" });
    }

    if (Number(ressourcen.treibstoff) < Number(gebaeude.kosten_treibstoff)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Zu wenig Treibstoff" });
    }

    const statusVorher = await getGebaeudeStatus(spielerId, client);
    const neueFreieLeistung =
      statusVorher.strom.produktion +
      Number(gebaeude.strom_produktion) -
      (statusVorher.strom.verbrauch + Number(gebaeude.strom_verbrauch));

    if (neueFreieLeistung < 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Nicht genug Strom für dieses Gebäude" });
    }

    await client.query(
      `UPDATE spieler_ressourcen
       SET geld = geld - $1,
           stein = stein - $2,
           eisen = eisen - $3,
           treibstoff = treibstoff - $4
       WHERE spieler_id = $5`,
      [
        gebaeude.kosten_geld,
        gebaeude.kosten_stein,
        gebaeude.kosten_eisen,
        gebaeude.kosten_treibstoff,
        spielerId
      ]
    );

    await client.query(
      `INSERT INTO spieler_gebaeude (spieler_id, gebaeude_typ_id, anzahl)
       VALUES ($1, $2, 1)
       ON CONFLICT (spieler_id, gebaeude_typ_id)
       DO UPDATE SET anzahl = spieler_gebaeude.anzahl + 1`,
      [spielerId, gebaeudeTypId]
    );

    const statusNeu = await getSpielerStatus(spielerId, client);

    await client.query("COMMIT");

    res.json({
      message: `${gebaeude.name} erfolgreich gebaut`,
      status: statusNeu
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Fehler bei /api/buildings/build:", error);
    res.status(500).json({ message: "Serverfehler beim Bauen" });
  } finally {
    client.release();
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