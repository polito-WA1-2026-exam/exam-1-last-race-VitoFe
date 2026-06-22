import { Link } from "react-router-dom";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext.jsx";
import LoginForm from "../components/LoginForm.jsx";
import Icon from "../components/Icon.jsx";
import metroSvg from "../assets/metro.svg";

export default function Home() {
  const { user } = useAuth();

  return (
    <div
      style={{
        position: "relative",
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${metroSvg})`,
          backgroundPosition: "right",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          opacity: 0.15,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <Container className="py-5" style={{ position: "relative", zIndex: 1 }}>
        <Row className="align-items-center justify-content-center">
          <Col lg={user ? 8 : 7} className="pe-lg-5 mb-5 mb-lg-0 text-start">
            <h1
              className="fw-bold mb-3 display-4 text-dark"
              style={{ letterSpacing: "-1.5px", lineHeight: "1.1" }}
            >
              Catch the
              <span
                style={{
                  background: "linear-gradient(135deg, #457b9d, #2a9d8f)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginLeft: "10px",
                }}
              >
                Last Race
              </span>
            </h1>
            <p
              className="lead text-muted mb-4 fs-5"
              style={{ lineHeight: "1.6" }}
            >
              Plan a valid route between randomly assigned subway stations under
              time pressure. <br /> Dodge pickpockets, collect rewards, and try
              to make it to your destination with the highest possible score!
            </p>

            <h3 className="fw-bold text-dark fs-4 mb-3">How to Play:</h3>
            <div className="d-flex flex-column gap-3 mb-4">
              <div className="d-flex gap-3">
                <div className="fs-4 text-primary">
                  <Icon name="one" />
                </div>
                <div>
                  <strong className="text-dark">Setup:</strong> Study the
                  complete subway map, noting lines, station connections, and
                  the critical interchange stations where lines cross.
                </div>
              </div>
              <div className="d-flex gap-3">
                <div className="fs-4 text-primary">
                  <Icon name="two" />
                </div>
                <div>
                  <strong className="text-dark">Planning:</strong> The
                  connection lines are hidden! Reconstruct the network from
                  memory and build a path from your assigned Start to
                  Destination. Hurry up, no time to waste!
                </div>
              </div>
              <div className="d-flex gap-3">
                <div className="fs-4 text-primary">
                  <Icon name="three" />
                </div>
                <div>
                  <strong className="text-dark">Execution & Result:</strong>{" "}
                  Watch your train complete the route segment by segment. Random
                  events will add or deduct coins from your starting 20. Make it
                  to the end with a positive coin balance to record a score!
                </div>
              </div>
            </div>

            {user && (
              <div className="d-flex gap-3 mt-4">
                <Button
                  as={Link}
                  to="/game"
                  size="lg"
                  className="px-4 py-2.5 fw-bold border-0"
                  style={{
                    background: "linear-gradient(135deg, #457b9d, #2a9d8f)",
                  }}
                >
                  <Icon name="controller" className="me-2" /> Play
                </Button>
                <Button
                  as={Link}
                  to="/ranking"
                  size="lg"
                  variant="outline-secondary"
                  className="px-4 py-2.5 fw-bold"
                >
                  <Icon name="trophy" className="me-2" /> View Leaderboard
                </Button>
              </div>
            )}
          </Col>

          {!user && (
            <Col lg={5} md={8} className="ps-lg-4">
              <LoginForm />
            </Col>
          )}
        </Row>
      </Container>
    </div>
  );
}
