import express from "express";
import morgan from "morgan";
import cors from "cors";
import session from "express-session";
import crypto from "crypto";
import { body, validationResult } from "express-validator";
import passport, { isLoggedIn } from "./auth.js";
import { initDb, dbGet, dbAll } from "./db.js";
import {
  getNetwork,
  getEvents,
  getRanking,
  recordGame,
  getRandomGameStations,
} from "./dao.js";

const app = express();
const port = 3001;

app.use(morgan("dev"));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(
  session({
    secret: "last-race-session-secret-key-987654321",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // dev mode
      sameSite: "lax",
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

initDb()
  .then(() => {
    console.log("Database initialized successfully.");
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
  });

/* --- AUTH APIs --- */

// POST /api/sessions (Login)
app.post("/api/sessions", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: info.message || "Login failed" });
    }
    req.login(user, (err) => {
      if (err) return next(err);
      return res.json(req.user);
    });
  })(req, res, next);
});

// DELETE /api/sessions/current (Logout)
app.delete("/api/sessions/current", isLoggedIn, (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.status(204).end();
  });
});

// GET /api/sessions/current (Get current session details)
app.get("/api/sessions/current", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

/* --- GAME APIs --- */

// GET /api/network
app.get("/api/network", isLoggedIn, async (req, res, next) => {
  try {
    const network = await getNetwork();
    res.json(network);
  } catch (err) {
    next(err);
  }
});

// GET /api/events
app.get("/api/events", isLoggedIn, async (req, res, next) => {
  try {
    const events = await getEvents();
    res.json(events);
  } catch (err) {
    next(err);
  }
});

// GET /api/ranking
app.get("/api/ranking", isLoggedIn, async (req, res, next) => {
  try {
    const ranking = await getRanking();
    res.json(ranking);
  } catch (err) {
    next(err);
  }
});

// POST /api/games (Start a new game session)
app.post("/api/games", isLoggedIn, async (req, res, next) => {
  try {
    const { start, destination } = await getRandomGameStations();
    const gameId = crypto.randomUUID();

    // game metadata and start timestamp in user session under activeGames dict
    req.session.activeGames = req.session.activeGames || {};
    req.session.activeGames[gameId] = {
      start,
      destination,
      startTime: Date.now(),
    };

    res.json({
      gameId,
      startStation: start,
      destinationStation: destination,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/games/submit (Validate and execute route)
app.post(
  "/api/games/submit",
  isLoggedIn,
  body("gameId").isString().notEmpty().withMessage("gameId is required"),
  body("route")
    .isArray({ min: 4 })
    .withMessage("Route must contain at least 4 stations"),
  body("route.*")
    .isString()
    .notEmpty()
    .withMessage("Each station in the route must be a valid string"),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const { gameId, route } = req.body;
      const currentGame = req.session.activeGames?.[gameId];

      if (!currentGame) {
        return res
          .status(400)
          .json({ error: "No active game found. Please start a new game." });
      }

      const startStation = currentGame.start;
      const destinationStation = currentGame.destination;

      let isValid = true;
      let errorMsg = "";

      // time limit: 90 seconds + 5 seconds buffer for polito bad network latency
      const elapsedSeconds = (Date.now() - currentGame.startTime) / 1000;
      if (elapsedSeconds > 95) {
        isValid = false;
        errorMsg = "Time limit exceeded (90 seconds).";
      }

      if (isValid && route[0] !== startStation) {
        isValid = false;
        errorMsg = `Route must start at the starting station: ${startStation}`;
      }

      if (isValid && route[route.length - 1] !== destinationStation) {
        isValid = false;
        errorMsg = `Route must end at the destination station: ${destinationStation}`;
      }

      const usedSegments = new Set();
      const segmentDetails = [];

      if (isValid) {
        const allStations = await dbAll("SELECT name, is_interchange FROM stations");
        const interchanges = new Set(
          allStations.filter(s => s.is_interchange === 1).map(s => s.name)
        );

        for (let i = 0; i < route.length - 1; i++) {
          const s1 = route[i];
          const s2 = route[i + 1];

          // prevent directional reuse
          const segmentKey = [s1, s2].sort().join("-"); // norm alph
          if (usedSegments.has(segmentKey)) {
            isValid = false;
            errorMsg = `Segment '${segmentKey}' is reused. A segment can only be visited once.`;
            break;
          }
          usedSegments.add(segmentKey);

          const connections = await dbAll(
            "SELECT line_name FROM connections WHERE (station1 = ? AND station2 = ?) OR (station1 = ? AND station2 = ?)",
            [s1, s2, s2, s1],
          );

          if (!connections || connections.length === 0) {
            isValid = false;
            errorMsg = `Invalid route: No direct line connection between '${s1}' and '${s2}'.`;
            break;
          }

          segmentDetails.push({
            s1,
            s2,
            lines: connections.map((conn) => conn.line_name),
          });
        }

        if (isValid) {
          // backtracking to find valid sequence of line names
          const findValidLinePath = (segments, index, currentPath) => {
            if (index === segments.length) {
              return currentPath;
            }
            const seg = segments[index];
            for (const line of seg.lines) {
              if (index === 0) {
                const path = findValidLinePath(segments, index + 1, [line]);
                if (path) return path;
              } else {
                const prevLine = currentPath[index - 1];
                if (line === prevLine) {
                  const path = findValidLinePath(segments, index + 1, [...currentPath, line]);
                  if (path) return path;
                } else {
                  // change occurs at seg.s1 (connecting station)
                  const changeStation = seg.s1;
                  if (interchanges.has(changeStation)) {
                    const path = findValidLinePath(segments, index + 1, [...currentPath, line]);
                    if (path) return path;
                  }
                }
              }
            }
            return null;
          };

          const validLinePath = findValidLinePath(segmentDetails, 0, []);
          if (!validLinePath) {
            isValid = false;
            errorMsg = "Invalid route: Line changes are only allowed at interchange stations.";
          } else {
            // resolved line names back to segment details for result output
            for (let i = 0; i < segmentDetails.length; i++) {
              segmentDetails[i].line = validLinePath[i];
            }
          }
        }
      }

      let score = 0;
      let steps = [];

      if (isValid) {
        // EVENT EXECUTION
        const allEvents = await getEvents();
        let currentCoins = 20;

        for (const seg of segmentDetails) {
          const randomEvent =
            allEvents[Math.floor(Math.random() * allEvents.length)];
          currentCoins += randomEvent.effect;
          steps.push({
            segment: `${seg.s1} - ${seg.s2}`,
            line: seg.line,
            event: {
              description: randomEvent.description,
              effect: randomEvent.effect,
            },
            coins: currentCoins,
          });
        }

        score = Math.max(0, currentCoins);
      } else {
        score = 0;
      }

      await recordGame(req.user.id, score);
      if (req.session.activeGames) {
        delete req.session.activeGames[gameId];
      }

      if (!isValid) {
        return res.status(400).json({ error: errorMsg });
      }

      res.json({
        valid: true,
        errorMsg: "",
        score,
        steps,
      });
    } catch (err) {
      next(err);
    }
  },
);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
