'use strict';

const bcrypt = require('bcrypt');
const pool = require('../../db');
const playerRepo = require('../repositories/player.repository');
const buildingRepo = require('../repositories/building.repository');
const resourcesRepo = require('../repositories/resources.repository');

async function register(req, res) {
  const client = await pool.connect();
  try {
    const { name, email, passwort } = req.body;

    await client.query('BEGIN');

    const existing = await playerRepo.findByNameOrEmail(name, email, client);
    if (existing.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Name oder E-Mail bereits vergeben' });
    }

    const hash = await bcrypt.hash(passwort, 10);
    const spieler = await playerRepo.create(name, email, hash, client);

    await resourcesRepo.initForSpieler(spieler.id, client);

    const hauptgebaeude = await buildingRepo.findHauptgebaeude(client);
    if (hauptgebaeude) {
      await buildingRepo.upsertSpielerGebaeude(spieler.id, hauptgebaeude.id, client);
    }

    await client.query('COMMIT');

    req.session.spieler = { id: spieler.id, name: spieler.name, email: spieler.email };
    res.json({ message: 'Registrierung erfolgreich', spieler: req.session.spieler });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Name oder E-Mail bereits vergeben' });
    }
    throw error;
  } finally {
    client.release();
  }
}

async function login(req, res) {
  const { email, passwort } = req.body;

  const spieler = await playerRepo.findByEmail(email);

  if (!spieler) {
    return res.status(400).json({ message: 'Ungültige Login-Daten' });
  }

  const passwortKorrekt = await bcrypt.compare(passwort, spieler.passwort_hash);
  if (!passwortKorrekt) {
    return res.status(400).json({ message: 'Ungültige Login-Daten' });
  }

  req.session.spieler = { id: spieler.id, name: spieler.name, email: spieler.email };
  res.json({ message: 'Login erfolgreich', spieler: req.session.spieler });
}

function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout fehlgeschlagen' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout erfolgreich' });
  });
}

module.exports = { register, login, logout };
