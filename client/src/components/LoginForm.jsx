// client/src/components/LoginForm.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

export default function LoginForm({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed'));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Log In</h2>
      {error && <div className="error-message">{error}</div>}
      <input type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      <input type="password" placeholder="Password" value={password}
        onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Logging in...' : 'Log In'}
      </button>
      <p>
        No account?{' '}
        <button type="button" className="link-button" onClick={onSwitchToRegister}>Register</button>
      </p>
    </form>
  );
}