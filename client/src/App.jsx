
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import NotesDashboard from './components/NotesDashboard';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  // Wait for the authentication state to be restored before rendering the UI
  if (loading) return <div className="loading">Loading...</div>;

  // Display the dashboard for authenticated users and authentication forms otherwise
  if (user) return <NotesDashboard />;

  return (
    <div className="auth-container">
      <h1 className="app-title">Secure Notes</h1>
      <p className="app-subtitle">Your private, secure note-taking app</p>
      {showRegister ? (
        <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
      ) : (
        <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
