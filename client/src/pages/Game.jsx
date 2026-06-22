import { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Alert,
  Spinner,
  Table,
  ProgressBar,
} from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext.jsx";
import MetroMap from "../components/MetroMap.jsx";
import Icon from "../components/Icon.jsx";

export default function Game() {
  const { user } = useAuth();

  // Game Phase: 'IDLE' | 'SETUP' | 'PLANNING' | 'EXECUTION' | 'RESULT'
  const [phase, setPhase] = useState("SETUP");

  // Network stuff
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(null);

  // Active Game State
  const [gameId, setGameId] = useState(null);
  const [startStation, setStartStation] = useState(null);
  const [destinationStation, setDestinationStation] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState([]); // array of station names
  const [timeLeft, setTimeLeft] = useState(90);

  // Submit/Execution States
  const [submitting, setSubmitting] = useState(false);
  const [executionSteps, setExecutionSteps] = useState([]);
  const [executionValid, setExecutionValid] = useState(false);
  const [executionError, setExecutionError] = useState("");
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [finalScore, setFinalScore] = useState(0);

  const timerRef = useRef(null);
  const executionTimeoutRef = useRef(null);

  // 1. Fetch Network config
  useEffect(() => {
    fetch("http://localhost:3001/api/network", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load metro network.");
        return res.json();
      })
      .then((data) => {
        setNetwork(data);
      })
      .catch((err) => {
        setNetworkError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 2. Planning phase countdown timer
  useEffect(() => {
    if (phase === "PLANNING") {
      setTimeLeft(90);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // auto-submit route when time expires
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // 3. Execution animation timer
  useEffect(() => {
    if (phase === "EXECUTION" && executionSteps.length > 0) {
      setCurrentStepIndex(0);
    }
  }, [phase, executionSteps]);

  useEffect(() => {
    if (phase === "EXECUTION" && currentStepIndex >= 0) {
      if (currentStepIndex < executionSteps.length) {
        // sched next step traversal
        executionTimeoutRef.current = setTimeout(() => {
          setCurrentStepIndex((prev) => prev + 1);
        }, 3500);
      } else {
        setPhase("RESULT");
      }
    }
    return () => {
      if (executionTimeoutRef.current)
        clearTimeout(executionTimeoutRef.current);
    };
  }, [phase, currentStepIndex, executionSteps]);

  // Start new game
  const handleStartGame = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3001/api/games", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to start a new game.");
      const data = await res.json();

      setGameId(data.gameId);
      setStartStation(data.startStation);
      setDestinationStation(data.destinationStation);
      setSelectedRoute([data.startStation]); // with start station in route
      setExecutionSteps([]);
      setExecutionError("");
      setCurrentStepIndex(-1);
      setPhase("PLANNING");
    } catch (err) {
      setNetworkError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit route to server for validation and execution
  const submitRoute = async (routeToSubmit) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:3001/api/games/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, route: routeToSubmit }),
        credentials: "include",
      });

      if (!res.ok) {
        let errorMessage = "Server validation failed.";
        try {
          const errData = await res.json();
          if (errData.error) {
            errorMessage = errData.error;
          } else if (errData.errorMsg) {
            errorMessage = errData.errorMsg;
          } else if (errData.message) {
            errorMessage = errData.message;
          } else if (errData.errors && errData.errors.length > 0) {
            errorMessage =
              errData.errors[0].msg ||
              errData.errors[0].message ||
              JSON.stringify(errData.errors[0]);
          }
        } catch (_) {}
        setExecutionValid(false);
        setExecutionError(errorMessage);
        setFinalScore(0);
        setPhase("RESULT");
        return;
      }

      const data = await res.json();
      setExecutionValid(data.valid);
      setExecutionError(data.errorMsg);
      setFinalScore(data.score);

      if (data.valid) {
        setExecutionSteps(data.steps);
        setPhase("EXECUTION");
      } else {
        // skip execution phase on invalid route
        setExecutionSteps([]);
        setPhase("RESULT");
      }
    } catch (err) {
      console.error(err);
      setExecutionValid(false);
      setExecutionError("Network communication error.");
      setFinalScore(0);
      setPhase("RESULT");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = () => {
    submitRoute(selectedRoute);
  };

  const handleAutoSubmit = () => {
    // Auto submit route using state ref since time ran out
    setSelectedRoute((currentRoute) => {
      submitRoute(currentRoute);
      return currentRoute;
    });
  };

  // Route construction interactions
  const handleStationClick = (stationName) => {
    if (phase !== "PLANNING") return;

    // If the station is already selected, deselect it and all subsequent nodes
    // this is a QOL feature I added to speed up testing, I kept it as it provides better UX overall
    const routeIndex = selectedRoute.indexOf(stationName);
    if (routeIndex !== -1) {
      if (routeIndex === 0) {
        if (selectedRoute.length > 1) {
          setSelectedRoute([startStation]);
        }
      } else {
        setSelectedRoute(selectedRoute.slice(0, routeIndex));
      }
      return;
    }

    setSelectedRoute([...selectedRoute, stationName]);
  };

  const handleUndo = () => {
    if (selectedRoute.length > 1) {
      setSelectedRoute(selectedRoute.slice(0, -1));
    }
  };

  const handleClearRoute = () => {
    setSelectedRoute([startStation]);
  };

  // Timer alert styling
  const getTimerVariant = () => {
    if (timeLeft > 50) return "success";
    if (timeLeft > 25) return "warning";
    return "danger";
  };

  if (loading && !network) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3">Preparing metro map network...</p>
      </Container>
    );
  }

  if (networkError) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Icon name="warn" className="me-2" /> Error: {networkError}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* PHASE 1: SETUP */}
      {phase === "SETUP" && (
        <Row className="justify-content-center">
          <Col lg={10} className="text-center">
            <div className="mb-4">
              <h2 className="fw-bold mb-2">
                <Icon name="subway" className="me-2 text-primary" /> Step 1:
                Study the Map
              </h2>
              <p className="text-muted">
                Analyze the complete subway lines and connections below. Take
                your time to locate the 5 interchange stations (marked with the
                interchange symbol) before starting the planning phase.
              </p>
            </div>

            <MetroMap
              stations={network.stations}
              connections={network.connections}
              lines={network.lines}
              hideLines={false}
            />

            <div className="mt-4">
              <Button
                onClick={handleStartGame}
                size="lg"
                className="px-5 py-3 fw-bold border-0 shadow-lg text-white"
                style={{
                  background: "linear-gradient(135deg, #457b9d, #2a9d8f)",
                }}
              >
                <Icon name="controller" className="me-2" /> Start Game
              </Button>
            </div>
          </Col>
        </Row>
      )}

      {/* PHASE 2: PLANNING */}
      {phase === "PLANNING" && (
        <Row>
          <Col lg={8} className="mb-4 mb-lg-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="fw-bold m-0">
                <Icon name="subway" className="me-2 text-primary" /> Step 2:
                Route Planning
              </h3>
              <Badge
                bg={getTimerVariant()}
                className="fs-5 px-3 py-2 shadow-sm"
              >
                <Icon name="timer" className="me-2" /> {timeLeft}s remaining
              </Badge>
            </div>

            <MetroMap
              stations={network.stations}
              connections={network.connections}
              lines={network.lines}
              selectedRoute={selectedRoute}
              startStation={startStation}
              destinationStation={destinationStation}
              hideLines={true}
              onStationClick={handleStationClick}
              hideInterchangeIcons={true}
            />

            <div className="d-flex gap-3 justify-content-center mt-3">
              <Button
                variant="outline-dark"
                onClick={handleUndo}
                disabled={selectedRoute.length <= 1}
              >
                <Icon name="undo" className="me-2" /> Undo Step
              </Button>
              <Button
                variant="outline-danger"
                onClick={handleClearRoute}
                disabled={selectedRoute.length <= 1}
              >
                <Icon name="clear" className="me-2" /> Clear Route
              </Button>
            </div>
          </Col>

          <Col lg={4} className="text-start">
            <Card className="shadow-sm border-0 rounded-4 p-4 bg-white mb-4">
              <h5 className="fw-bold mb-3 text-secondary">
                Mission Coordinates
              </h5>
              <div className="d-flex flex-column gap-2 mb-4">
                <div className="p-3 rounded-3 bg-light border-start border-4 border-success">
                  <span className="small text-muted d-block">
                    STARTING STATION
                  </span>
                  <strong className="text-success fs-5">{startStation}</strong>
                </div>
                <div className="p-3 rounded-3 bg-light border-start border-4 border-danger">
                  <span className="small text-muted d-block">
                    DESTINATION STATION
                  </span>
                  <strong className="text-danger fs-5">
                    {destinationStation}
                  </strong>
                </div>
              </div>

              <h5 className="fw-bold mb-2 text-secondary">
                Your Planned Route
              </h5>
              <div
                className="p-3 bg-light rounded-3 mb-4"
                style={{ maxHeight: "180px", overflowY: "auto" }}
              >
                {selectedRoute.map((st, i) => (
                  <div
                    key={st}
                    className="d-flex align-items-center gap-2 mb-1.5 fs-6"
                  >
                    <Badge
                      bg={
                        i === 0
                          ? "success"
                          : i === selectedRoute.length - 1 &&
                              st === destinationStation
                            ? "danger"
                            : "primary"
                      }
                    >
                      {i + 1}
                    </Badge>
                    <span>{st}</span>
                    {i < selectedRoute.length - 1 && (
                      <span className="text-muted">➔</span>
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={handleManualSubmit}
                size="lg"
                className="w-100 py-3 fw-bold border-0 text-white shadow-sm"
                disabled={submitting}
                style={{
                  background: "linear-gradient(135deg, #aa3bff, #457b9d)",
                }}
              >
                {submitting ? (
                  "Validating Route..."
                ) : (
                  <>
                    <Icon name="submit" className="me-2" /> Let's Go!
                  </>
                )}
              </Button>
            </Card>

            <Card className="shadow-sm border-0 rounded-4 p-4 bg-white">
              <h5 className="fw-bold mb-3 text-secondary">Metro Segments</h5>
              <div
                style={{ maxHeight: "300px", overflowY: "auto" }}
                className="d-flex flex-column gap-2"
              >
                {[...network.connections]
                  .sort((a, b) => {
                    const nameA = `${a.station1}-${a.station2}`;
                    const nameB = `${b.station1}-${b.station2}`;
                    return nameA.localeCompare(nameB);
                  })
                  .map((conn) => (
                    <div
                      key={conn.id}
                      className="p-2 border rounded-3 bg-light d-flex align-items-center"
                      style={{ border: "1px solid var(--border)" }}
                    >
                      <span className="small text-dark fw-medium">
                        {conn.station1} - {conn.station2}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* PHASE 3: EXECUTION */}
      {phase === "EXECUTION" && (
        <Row className="justify-content-center">
          <Col lg={10} className="text-center">
            <h2 className="fw-bold mb-3">
              <Icon name="train" className="me-2 text-primary" /> Journey
              Simulation
            </h2>
            <p className="text-muted">
              Your route is valid! The train is moving to the destination.
              Random events will apply along each segment.
            </p>

            <MetroMap
              stations={network.stations}
              connections={network.connections}
              lines={network.lines}
              selectedRoute={selectedRoute}
              startStation={startStation}
              destinationStation={destinationStation}
              hideLines={false}
              activeStepIndex={currentStepIndex}
              executionSteps={executionSteps}
              hideInterchangeIcons={true}
            />

            {currentStepIndex >= 0 &&
              currentStepIndex < executionSteps.length && (
                <Card
                  className="shadow-lg border-0 rounded-4 max-w-600 mx-auto mt-4 p-4 animate-fade-in"
                  style={{ borderLeft: "6px solid #aa3bff" }}
                >
                  <Card.Body className="text-start">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <Badge bg="info" className="fs-6 py-2 px-3">
                        Segment {currentStepIndex + 1} of{" "}
                        {executionSteps.length}
                      </Badge>
                      <span className="text-muted small">
                        Traversing Line:{" "}
                        <strong>{executionSteps[currentStepIndex].line}</strong>
                      </span>
                    </div>

                    <h4 className="fw-bold text-dark mb-3">
                      <Icon name="trainFill" className="me-2 text-primary" />{" "}
                      {executionSteps[currentStepIndex].segment}
                    </h4>

                    <div className="p-3 bg-light rounded-3 mb-4">
                      <strong className="d-block text-secondary small mb-1">
                        UNEXPECTED EVENT
                      </strong>
                      <p className="fs-5 text-dark fw-semibold mb-2">
                        {executionSteps[currentStepIndex].event.description}
                      </p>
                      <span
                        className={`fw-bold fs-6 ${executionSteps[currentStepIndex].event.effect >= 0 ? "text-success" : "text-danger"}`}
                      >
                        {executionSteps[currentStepIndex].event.effect >= 0
                          ? `+${executionSteps[currentStepIndex].event.effect}`
                          : executionSteps[currentStepIndex].event.effect}{" "}
                        coins
                      </span>
                    </div>

                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="text-muted font-monospace fw-semibold">
                          COIN WALLET TALLY
                        </span>
                        <strong className="fs-4 text-primary">
                          {executionSteps[currentStepIndex].coins}{" "}
                          <Icon name="coin" className="text-warning" />
                        </strong>
                      </div>
                      <ProgressBar
                        now={Math.max(
                          0,
                          Math.min(
                            100,
                            (executionSteps[currentStepIndex].coins / 40) * 100,
                          ),
                        )}
                        variant={
                          executionSteps[currentStepIndex].coins > 15
                            ? "success"
                            : executionSteps[currentStepIndex].coins > 5
                              ? "info"
                              : "danger"
                        }
                        style={{ height: "8px" }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              )}
          </Col>
        </Row>
      )}

      {/* PHASE 4: RESULT */}
      {phase === "RESULT" && (
        <Row className="justify-content-center">
          <Col md={8} lg={6} className="text-center">
            <Card className="shadow-lg border-0 rounded-4 overflow-hidden mt-4 p-4 text-center">
              <div className="p-4">
                <h1 className="fw-bold mb-2">
                  {executionValid
                    ? "Journey Completed!"
                    : "Route Invalid / Failed"}
                </h1>

                {executionValid ? (
                  <p className="text-success fw-bold fs-5 mb-4">
                    Successfully reached {destinationStation}!
                  </p>
                ) : (
                  <Alert
                    variant="danger"
                    className="py-2.5 rounded-3 mb-4 border-0"
                  >
                    <Icon name="warn" className="me-2" />{" "}
                    {executionError ||
                      "The route was incomplete, disjoint, or took too long to build."}
                  </Alert>
                )}

                <div className="bg-light p-4 rounded-4 mb-4">
                  <span className="text-muted d-block small mb-1 fw-semibold">
                    FINAL SCORE
                  </span>
                  <span className="display-3 fw-bold text-primary font-monospace">
                    {finalScore}
                  </span>
                  <span className="fs-4 text-muted"> coins</span>
                </div>

                {executionSteps.length > 0 && (
                  <div className="text-start mt-4">
                    <h5 className="fw-bold text-dark mb-3">
                      Segment Journey Log:
                    </h5>
                    <Table responsive striped bordered hover size="sm">
                      <thead>
                        <tr>
                          <th>Segment</th>
                          <th>Event</th>
                          <th className="text-end">Coins</th>
                        </tr>
                      </thead>
                      <tbody>
                        {executionSteps.map((step, i) => (
                          <tr key={i}>
                            <td className="small font-monospace">
                              {step.segment}
                            </td>
                            <td className="small">
                              {step.event.description} (
                              <span
                                className={
                                  step.event.effect >= 0
                                    ? "text-success"
                                    : "text-danger"
                                }
                              >
                                {step.event.effect >= 0
                                  ? `+${step.event.effect}`
                                  : step.event.effect}
                              </span>
                              )
                            </td>
                            <td className="text-end font-monospace fw-bold small">
                              {step.coins}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}

                <div className="d-flex gap-3 justify-content-center mt-5">
                  <Button
                    onClick={() => setPhase("SETUP")}
                    size="lg"
                    className="px-4 py-2.5 fw-bold border-0 text-white"
                    style={{
                      background: "linear-gradient(135deg, #457b9d, #2a9d8f)",
                    }}
                  >
                    <Icon name="controller" className="me-2" /> Play Again
                  </Button>
                  <Button
                    href="/ranking"
                    variant="outline-secondary"
                    size="lg"
                    className="px-4 py-2.5 fw-bold"
                  >
                    <Icon name="trophy" className="me-2" /> Leaderboard
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}
