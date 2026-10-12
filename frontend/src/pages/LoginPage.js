import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, setToken, setStoredUser } from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(null);
  useEffect(() => () => { pending.current?.abort(); pending.current = null; }, []);
  const navigate = useNavigate();
  const signIn = async (loginEmail, loginPassword) => {
    if (pending.current) return;
    const controller = new AbortController(); pending.current = controller;
    setBusy(true); setError(null);
    try {
      const { token, user } = await login(loginEmail, loginPassword, { signal: controller.signal });
      if (pending.current !== controller || controller.signal.aborted) return;
      if (!token || !user) throw new Error('The sign-in service returned an incomplete response.');
      setToken(token); setStoredUser(user);
      navigate('/');
    } catch (err) { if (pending.current === controller && !controller.signal.aborted) setError(err.message); }
    finally { if (pending.current === controller && !controller.signal.aborted) { pending.current = null; setBusy(false); } }
  };
  const submit = (event) => { event.preventDefault(); signIn(email, password); };
  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <h2 className="login-brand">AGENT OBSERVABILITY PLUS</h2>
        <p className="login-sub">Regression detection, auto-RCA, and drift alarms for production AI agents.</p>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div className="ai-error">{error}</div>}
        <button
          type="button"
          onClick={() => signIn(import.meta.env.VITE_DEMO_EMAIL, import.meta.env.VITE_DEMO_PASSWORD)}
          disabled={busy || !import.meta.env.VITE_DEMO_EMAIL || !import.meta.env.VITE_DEMO_PASSWORD}
          aria-label="Log In as Demo"
          style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
        >
          Log In as Demo
        </button>
        <button className="btn" type="submit" disabled={busy} style={{ width: '100%', marginTop: 10 }}>
          {busy ? 'Signing in...' : 'Sign In'}
        </button>
        <p className="login-hint">Use an account provisioned by an administrator.</p>
      </form>
    </div>
  );
}
