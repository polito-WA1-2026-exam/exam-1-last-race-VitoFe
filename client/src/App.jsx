import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import Navigation from "./components/Navigation.jsx";
import Home from "./pages/Home.jsx";
import Game from "./pages/Game.jsx";
import Ranking from "./pages/Ranking.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navigation />
      <main className="flex-grow-1 py-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/game"
            element={user ? <Game /> : <Navigate to="/" replace />}
          />
          <Route
            path="/ranking"
            element={user ? <Ranking /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="py-4 border-top text-center text-muted small bg-light mt-auto">
        &copy; {new Date().getFullYear()} Vito Ferri. All rights reserved.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
