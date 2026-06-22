import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // check if user is already logged in on mount
  useEffect(() => {
    fetch('http://localhost:3001/api/sessions/current', { credentials: 'include' })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Not authenticated');
      })
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (username, password) => {
    const res = await fetch('http://localhost:3001/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
      return userData;
    } else {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Login failed');
    }
  };

  const logout = async () => {
    const res = await fetch('http://localhost:3001/api/sessions/current', {
      method: 'DELETE',
      credentials: 'include',
    });

    if (res.ok) {
      setUser(null);
    } else {
      console.error('Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
