import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { hashPassword } from "./crypto_utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = process.env.DB_PATH || path.join(__dirname, "last_race.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Database connected successfully.");
  }
});

// Wrap db.run, db.get, db.all inside ES6 Promises
export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// initialize and seed the database
export async function initDb() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      hash TEXT NOT NULL,
      salt TEXT NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS stations (
      name TEXT PRIMARY KEY,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      is_interchange INTEGER NOT NULL DEFAULT 0
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS lines (
      name TEXT PRIMARY KEY,
      color TEXT NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station1 TEXT NOT NULL,
      station2 TEXT NOT NULL,
      line_name TEXT NOT NULL,
      FOREIGN KEY(station1) REFERENCES stations(name),
      FOREIGN KEY(station2) REFERENCES stations(name),
      FOREIGN KEY(line_name) REFERENCES lines(name)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      effect INTEGER NOT NULL
    )
  `);

  await dbRun("DELETE FROM events");
  const events = [
    { description: "Quiet journey, no delays", effect: 0 },
    { description: "Kind passenger offers to pay your ticket", effect: 1 },
    { description: "Found a few coins on the seat", effect: 2 },
    { description: "Wrong coach, had to pay a surcharge", effect: -2 },
    { description: "Ticket inspector fine, expired ticket", effect: -3 },
    { description: "Rush hour delay, lost time", effect: -1 },
    { description: "Helpful transit officer gives directions", effect: 1 },
    { description: "Pickpocket stole your loose change", effect: -4 },
    { description: "Refund for previous train cancellation", effect: 3 },
    { description: "Found a lost wallet and returned it", effect: 4 },
    { description: "Spilled coffee on your shirt, ruined it", effect: -2 },
    { description: "Your train was cancelled, you take a taxi", effect: -3 },
    {
      description: "You help an elderly passenger, they give you a reward",
      effect: 3,
    },
    {
      description: "A tourist asks for directions, they give you a tip",
      effect: 3,
    },
  ];

  for (const e of events) {
    await dbRun("INSERT INTO events (description, effect) VALUES (?, ?)", [
      e.description,
      e.effect,
    ]);
  }

  const stationCount = await dbGet("SELECT COUNT(*) as count FROM stations");
  if (stationCount.count === 0) {
    console.log("Seeding database tables...");

    const stations = [
      { name: "Stazione Est", x: 100, y: 150, is_interchange: 0 },
      { name: "Centrale", x: 250, y: 150, is_interchange: 1 },
      { name: "Porta Velaria", x: 400, y: 150, is_interchange: 1 },
      { name: "Crocevia del Falco", x: 550, y: 150, is_interchange: 0 },
      { name: "Piazza delle Lanterne", x: 700, y: 150, is_interchange: 1 },
      { name: "Fontana Oscura", x: 400, y: 300, is_interchange: 1 },
      { name: "Borgo Sereno", x: 550, y: 300, is_interchange: 0 },
      { name: "Viale dei Mosaici", x: 700, y: 300, is_interchange: 1 },
      { name: "Torre Cinerea", x: 400, y: 420, is_interchange: 0 },
      { name: "Campo dell'Eco", x: 250, y: 420, is_interchange: 0 },
      { name: "Belvedere", x: 700, y: 220, is_interchange: 0 },
      { name: "Valle Verde", x: 800, y: 380, is_interchange: 0 },
    ];

    for (const s of stations) {
      await dbRun(
        "INSERT INTO stations (name, x, y, is_interchange) VALUES (?, ?, ?, ?)",
        [s.name, s.x, s.y, s.is_interchange],
      );
    }

    const lines = [
      { name: "Red Line", color: "#e63946" },
      { name: "Blue Line", color: "#457b9d" },
      { name: "Green Line", color: "#2a9d8f" },
      { name: "Yellow Line", color: "#f4a261" },
    ];

    for (const l of lines) {
      await dbRun("INSERT INTO lines (name, color) VALUES (?, ?)", [
        l.name,
        l.color,
      ]);
    }

    const connections = [
      // Red
      { station1: "Stazione Est", station2: "Centrale", line_name: "Red Line" },
      {
        station1: "Centrale",
        station2: "Porta Velaria",
        line_name: "Red Line",
      },
      {
        station1: "Porta Velaria",
        station2: "Crocevia del Falco",
        line_name: "Red Line",
      },
      {
        station1: "Crocevia del Falco",
        station2: "Piazza delle Lanterne",
        line_name: "Red Line",
      },
      // Blue
      {
        station1: "Centrale",
        station2: "Fontana Oscura",
        line_name: "Blue Line",
      },
      {
        station1: "Fontana Oscura",
        station2: "Borgo Sereno",
        line_name: "Blue Line",
      },
      {
        station1: "Borgo Sereno",
        station2: "Viale dei Mosaici",
        line_name: "Blue Line",
      },
      // Green
      {
        station1: "Porta Velaria",
        station2: "Fontana Oscura",
        line_name: "Green Line",
      },
      {
        station1: "Fontana Oscura",
        station2: "Torre Cinerea",
        line_name: "Green Line",
      },
      {
        station1: "Torre Cinerea",
        station2: "Campo dell'Eco",
        line_name: "Green Line",
      },
      // Yellow
      {
        station1: "Piazza delle Lanterne",
        station2: "Belvedere",
        line_name: "Yellow Line",
      },
      {
        station1: "Belvedere",
        station2: "Viale dei Mosaici",
        line_name: "Yellow Line",
      },
      {
        station1: "Viale dei Mosaici",
        station2: "Valle Verde",
        line_name: "Yellow Line",
      },
    ];

    for (const c of connections) {
      await dbRun(
        "INSERT INTO connections (station1, station2, line_name) VALUES (?, ?, ?)",
        [c.station1, c.station2, c.line_name],
      );
    }

    const u1 = await hashPassword("password123");
    const u2 = await hashPassword("password456");
    const u3 = await hashPassword("password789");

    const res1 = await dbRun(
      "INSERT INTO users (username, hash, salt) VALUES (?, ?, ?)",
      ["user1", u1.hash, u1.salt],
    );
    const res2 = await dbRun(
      "INSERT INTO users (username, hash, salt) VALUES (?, ?, ?)",
      ["user2", u2.hash, u2.salt],
    );
    await dbRun("INSERT INTO users (username, hash, salt) VALUES (?, ?, ?)", [
      "user3",
      u3.hash,
      u3.salt,
    ]);

    await dbRun(
      "INSERT INTO games (user_id, score, timestamp) VALUES (?, ?, ?)",
      [res1.lastID, 18, new Date(Date.now() - 3600000 * 2).toISOString()],
    );
    await dbRun(
      "INSERT INTO games (user_id, score, timestamp) VALUES (?, ?, ?)",
      [res1.lastID, 25, new Date(Date.now() - 3600000).toISOString()],
    );
    await dbRun(
      "INSERT INTO games (user_id, score, timestamp) VALUES (?, ?, ?)",
      [res2.lastID, 22, new Date(Date.now() - 1800000).toISOString()],
    );

    console.log("Database seeded successfully.");
  }
}

export default db;
