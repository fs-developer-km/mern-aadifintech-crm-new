import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useSettings } from '../hooks/useSettings.jsx';
import { NAV } from '../utils/constants.js';
import { useEffect, useState } from 'react';
import api from '../utils/api.js';

const NAV_ROUTES = {
  'Dashboard': '/',
  'Leads': '/leads',
  'Lead Capture': '/capture',
  'Team Members': '/team',
  'Assignment Channel': '/channel',
  'Reports': '/reports',
  'Access Control': '/access',
  'Personalisation': '/personalisation'
};

export default function AppShell() {
  const { user, setUser, logout, can } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    if (settings?.org?.accent) {
      document.documentElement.style.setProperty('--teal', settings.org.accent);
    }
  }, [settings?.org?.accent]);

  // Admin: load all users for view-as dropdown
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/users').then(r => setAllUsers(r.data)).catch(() => {});
    }
  }, [user?.role]);

  if (!user) return null;

  const visibleNav = NAV.filter(n => can(n, settings));

  // Admin can switch view to simulate another user's perspective
  const handleViewAs = (userId) => {
    if (user.role !== 'ADMIN') return;
    const found = allUsers.find(u => u._id === userId);
    if (found) {
      // Temporarily set user context (does NOT change JWT — only view simulation)
      setUser({ ...found, _viewAs: true, _realAdminId: user._id });
      navigate('/');
    }
  };

  const handleRestoreAdmin = () => {
    api.get('/auth/me').then(r => {
      setUser(r.data.user);
      navigate('/');
    }).catch(() => {});
  };

  return (
    <div className="app">
      <aside className="side">
        {/* Brand */}
        <div className="brand">
          <div className="logo">AF</div>
          <div>
            <b>{settings?.org?.name || 'Aadi FinLead OS'}</b>
            <br /><span>DSA Channel &amp; Lead Portal</span>
          </div>
        </div>

        {/* User box */}
        <div className="userbox">
          <div className="split">
            <label>Logged In</label>
            <button className="btn" onClick={logout}>Logout</button>
          </div>

          {/* Admin: view-as dropdown */}
          {(user.role === 'ADMIN' || user._viewAs) && allUsers.length > 0 && (
            <select
              className="field"
              style={{ marginTop: 8 }}
              value={user._id}
              onChange={e => handleViewAs(e.target.value)}
            >
              {allUsers.map(u => (
                <option key={u._id} value={u._id}>{u.name} – {u.role}</option>
              ))}
            </select>
          )}

          <p style={{ margin: '8px 0 2px', fontWeight: 700 }}>{user.name}</p>
          <p className="muted" style={{ margin: 0 }}>{user.title || user.role} | {user.city}</p>
          <div className="row" style={{ marginTop: 6 }}>
            <span className={`badge ${user.role}`}>{user.role}</span>
            {user._viewAs && (
              <button className="btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={handleRestoreAdmin}>
                Restore Admin
              </button>
            )}
          </div>
          {user.role === 'ADMIN' && !user._viewAs && (
            <p className="muted" style={{ margin: '4px 0 0', fontSize: 11 }}>Admin can switch role view above</p>
          )}
        </div>

        {/* Nav */}
        <nav className="nav">
          {visibleNav.map(n => (
            <button
              key={n}
              className={location.pathname === NAV_ROUTES[n] ? 'active' : ''}
              onClick={() => navigate(NAV_ROUTES[n])}
            >
              {n}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
