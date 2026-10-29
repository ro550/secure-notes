// client/src/components/RegisterForm.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

export default function RegisterForm({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(email, password, name);
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed'));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Create Account</h2>
      {error && <div className="error-message">{error}</div>}
      <input type="text" placeholder="Name" value={name}
        onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} autoComplete="name" />
      <input type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      {/* Limits mirror the server's Zod schema (8-72 characters) */}
      <input type="password" placeholder="Password (8-72 characters)" value={password}
        onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating account...' : 'Register'}
      </button>
      <p>
        Already registered?{' '}
        <button type="button" className="link-button" onClick={onSwitchToLogin}>Log in</button>
      </p>
    </form>
  );
}