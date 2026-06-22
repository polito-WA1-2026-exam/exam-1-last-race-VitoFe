import { dbAll, dbGet, dbRun } from './db.js';

export async function getUserById(id) {
  const row = await dbGet('SELECT * FROM users WHERE id = ?', [id]);
  if (!row) return null;
  return { id: row.id, username: row.username };
}

export async function getUserByUsername(username) {
  return await dbGet('SELECT * FROM users WHERE username = ?', [username]);
}

export async function getNetwork() {
  const stations = await dbAll('SELECT * FROM stations');
  const lines = await dbAll('SELECT * FROM lines');
  const connections = await dbAll('SELECT * FROM connections');
  return { stations, lines, connections };
}

export async function getEvents() {
  return await dbAll('SELECT * FROM events');
}

export async function getRanking() {
  return await dbAll(`
    SELECT u.username, MAX(g.score) as bestScore
    FROM users u
    JOIN games g ON u.id = g.user_id
    GROUP BY u.id
    ORDER BY bestScore DESC
  `);
}

export async function recordGame(userId, score) {
  const timestamp = new Date().toISOString();
  await dbRun(
    'INSERT INTO games (user_id, score, timestamp) VALUES (?, ?, ?)',
    [userId, score, timestamp]
  );
}

export async function getRandomGameStations() {
  const stations = await dbAll('SELECT name FROM stations');
  const connections = await dbAll('SELECT station1, station2 FROM connections');

  // adjacency list
  const adj = {};
  for (const s of stations) {
    adj[s.name] = [];
  }
  for (const c of connections) {
    adj[c.station1].push(c.station2);
    adj[c.station2].push(c.station1);
  }

  // all pairs with distance >= 3
  const validPairs = [];
  for (const start of stations) {
    const startName = start.name;
    const distances = {};
    const queue = [startName];
    distances[startName] = 0;

    while (queue.length > 0) {
      const curr = queue.shift();
      const currDist = distances[curr];

      for (const neighbor of adj[curr]) {
        if (distances[neighbor] === undefined) {
          distances[neighbor] = currDist + 1;
          queue.push(neighbor);
        }
      }
    }

    for (const [destName, dist] of Object.entries(distances)) {
      if (dist >= 3) {
        validPairs.push({ start: startName, destination: destName });
      }
    }
  }

  if (validPairs.length === 0) {
    throw new Error("No station pairs with distance >= 3 found in the network.");
  }

  const randomIndex = Math.floor(Math.random() * validPairs.length);
  return validPairs[randomIndex];
}
