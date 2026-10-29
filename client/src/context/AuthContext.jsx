
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the user's session when the application loads.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    authAPI
      .getMe()
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  // Clear the authenticated user when the API detects an expired session.
  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  // Store the authentication token and update the current user state.
  const startSession = (data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
  };

  // Authenticate the user and initialize their session.
  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    startSession(res.data);
  };

  // Register a new user and initialize their session.
  const register = async (email, password, name) => {
    const res = await authAPI.register({ email, password, name });
    startSession(res.data);
  };

  // Remove the stored token and clear the current user state.
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  // Share authentication state and actions with children components.
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Provide a reusable hook for accessing authentication context.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
