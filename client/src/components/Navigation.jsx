import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext.jsx";
import Icon from "./Icon.jsx";

export default function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <Navbar
      expand="lg"
      className="border-bottom py-3"
      style={{
        background: "var(--bg-navbar, rgba(255, 255, 255, 0.8))",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <Container>
        <Navbar.Brand
          as={Link}
          to="/"
          className="fw-bold fs-4 d-flex align-items-center"
          style={{ color: "var(--text-h)", gap: "8px" }}
        >
          <Icon
            name="train"
            style={{ fontSize: "28px" }}
            className="text-primary"
          />{" "}
          Last Race
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto align-items-center">
            <Nav.Link
              as={NavLink}
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "fw-bold text-primary px-3" : "px-3 text-secondary"
              }
            >
              Instructions
            </Nav.Link>
            {user && (
              <>
                <Nav.Link
                  as={NavLink}
                  to="/game"
                  className={({ isActive }) =>
                    isActive
                      ? "fw-bold text-primary px-3"
                      : "px-3 text-secondary"
                  }
                >
                  Play Game
                </Nav.Link>
                <Nav.Link
                  as={NavLink}
                  to="/ranking"
                  className={({ isActive }) =>
                    isActive
                      ? "fw-bold text-primary px-3"
                      : "px-3 text-secondary"
                  }
                >
                  Leaderboard
                </Nav.Link>
              </>
            )}
          </Nav>
          <Nav className="align-items-center gap-3">
            {user ? (
              <>
                <span className="text-muted d-none d-lg-inline fs-6">
                  Logged in as:{" "}
                  <strong className="text-dark">{user.username}</strong>
                </span>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleLogout}
                  className="px-3"
                >
                  Logout
                </Button>
              </>
            ) : (
              <span className="text-muted fs-6">Guest Mode</span>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
