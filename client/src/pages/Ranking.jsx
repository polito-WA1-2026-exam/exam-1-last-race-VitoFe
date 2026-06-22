import { useState, useEffect } from "react";
import {
  Container,
  Table,
  Spinner,
  Card,
  Alert,
  Button,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import Icon from "../components/Icon.jsx";

export default function Ranking() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/ranking", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load rankings.");
        }
        return res.json();
      })
      .then((data) => {
        setRankings(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getRankBadge = (index) => {
    if (index === 0) return <Icon name="gold" className="fs-4" />;
    if (index === 1) return <Icon name="silver" className="fs-4" />;
    if (index === 2) return <Icon name="bronze" className="fs-4" />;
    return <span className="text-muted fw-bold">#{index + 1}</span>;
  };

  return (
    <Container className="py-5" style={{ maxWidth: "800px" }}>
      <div className="text-center mb-5">
        <h1 className="fw-bold text-dark" style={{ letterSpacing: "-1px" }}>
          <Icon name="trophyFill" className="me-2 text-warning" /> Global
          Leaderboard
        </h1>
        <p className="text-muted">
          The best results achieved by our registered users.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-3">Loading users list...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">
          <Icon name="warn" className="me-2" /> {error}
        </Alert>
      ) : (
        <Card className="shadow border-0 rounded-4 overflow-hidden">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th
                  className="py-3 px-4 text-muted fw-semibold"
                  style={{ width: "100px" }}
                >
                  Rank
                </th>
                <th className="py-3 px-4 text-muted fw-semibold">User</th>
                <th
                  className="py-3 px-4 text-muted fw-semibold text-end"
                  style={{ width: "200px" }}
                >
                  Best Score
                </th>
              </tr>
            </thead>
            <tbody>
              {rankings.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-5 text-muted">
                    No games played yet. Be the first to play!
                  </td>
                </tr>
              ) : (
                rankings.map((rank, index) => {
                  const isCurrentUser = user && rank.username === user.username;
                  return (
                    <tr
                      key={rank.username}
                      style={{
                        backgroundColor: isCurrentUser
                          ? "rgba(42, 157, 143, 0.05)"
                          : "transparent",
                        fontWeight: isCurrentUser ? "600" : "normal",
                      }}
                    >
                      <td className="py-3 px-4">{getRankBadge(index)}</td>
                      <td className="py-3 px-4">
                        {rank.username}{" "}
                        {isCurrentUser && (
                          <span className="badge bg-success ms-2">You</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-end text-primary fw-bold fs-5">
                        {rank.bestScore}{" "}
                        <Icon name="coin" className="ms-1 text-warning" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Card>
      )}

      <div className="text-center mt-4">
        <Button
          as={Link}
          to="/game"
          className="px-4 py-2.5 fw-bold border-0"
          style={{ background: "linear-gradient(135deg, #457b9d, #2a9d8f)" }}
        >
          <Icon name="controller" className="me-2" /> Play
        </Button>
      </div>
    </Container>
  );
}
