'use strict';

/*
 * Validierungs-Middleware:
 * Bindet Zod-Schemata in Express ein und liefert bei fehlerhaften Nutzerdaten
 * eine einheitliche 400-Antwort zurück.
 */

/**
 * Gibt eine Middleware zurück, die req.body gegen ein Zod-Schema prüft.
 * Bei Erfolg werden geparste Daten in req.body übernommen.
 * Bei Fehlern wird mit Status 400 geantwortet.
 */
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message);
      return res.status(400).json({ message: errors[0], errors });
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validateBody };
