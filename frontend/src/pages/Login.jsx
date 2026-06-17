import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';

// const DEMO_CREDS = [
//   { name: 'System Admin', email: 'admin@aadi.local', role: 'ADMIN', password: 'admin123' },
//   { name: 'Meera Iyer', email: 'meera.manager@aadi.local', role: 'MANAGER', password: 'manager123' },
//   { name: 'Riya Mehta', email: 'riya.rm@aadi.local', role: 'RM', password: 'rm123' },
//   { name: 'Arjun Shah', email: 'arjun.rm@aadi.local', role: 'RM', password: 'rm123' },
//   { name: 'Kabir Khan', email: 'kabir.resource@aadi.local', role: 'RESOURCE', password: 'resource123' },
//   { name: 'Sana Rao', email: 'sana.resource@aadi.local', role: 'RESOURCE', password: 'resource123' },
//   { name: 'Lead Desk', email: 'desk@aadi.local', role: 'EMPLOYEE', password: 'employee123' }
// ];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid login. Please check email/mobile and password.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email, pw) => {
    setIdentifier(email);
    setPassword(pw);
  };

  return (
    <div className="login">
      <div className="login-card">
        <section className="panel">
          <div className="brand">
            <div className="logo">AF</div>
            <div><b>Aadi FinLead OS</b><br /><span>Secure employee login</span></div>
          </div>
          <h1>Login Channel</h1>
          <p>Every Admin, Manager, RM, Resource and Employee signs in separately and sees their own reports.</p>
          {error && <p style={{ color: 'var(--red)', fontWeight: 900 }}>{error}</p>}
          <form style={{ marginTop: 18 }} onSubmit={handleSubmit}>
            <label>Email or Mobile</label>
            <input
              className="field"
              placeholder="admin@aadi.local"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              autoComplete="username"
            />
            <label style={{ marginTop: 10 }}>Password</label>
            <input
              type="password"
              className="field"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button className="btn primary" style={{ marginTop: 14, width: '100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </section>

        {/* <section className="panel">
          <h2>Demo Staff Credentials</h2>
          <p>Use these to test role-based reports and lead visibility.</p>
          {DEMO_CREDS.map(u => (
            <div className="cred" key={u.email} onClick={() => quickLogin(u.email, u.password)} style={{ cursor: 'pointer' }}>
              <span>
                <b>{u.name}</b><br />
                <span className="muted">{u.email} | {u.role}</span>
              </span>
              <b>{u.password}</b>
            </div>
          ))}
        </section> */}
      </div>
    </div>
  );
}
