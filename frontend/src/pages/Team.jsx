import { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { SYSTEM_ROLES, DEFAULT_EXTRA_ROLES, LEAD_CAPTURE_ROLES } from '../utils/constants.js';
import { useToast } from '../hooks/useToast.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

// ─── Role badge colours ────────────────────────────────────────────────────
const roleBadge = (role) => {
  const map = {
    ADMIN: 'ADMIN', MANAGER: 'MANAGER', RM: 'RM',
    RESOURCE: 'RESOURCE', EMPLOYEE: 'EMPLOYEE',
    CONNECTOR: 'RESOURCE',   // teal-ish
    CA: 'MANAGER',           // blue-ish
    BANKER: 'RM',            // teal
    INTERN: 'EMPLOYEE'       // grey
  };
  return map[role] || 'EMPLOYEE';
};

// ─── Role descriptions (shown as hint) ────────────────────────────────────
const ROLE_HINTS = {
  ADMIN:     'Full system access',
  MANAGER:   'Manages RMs and their leads',
  RM:        'Manages Resources and reviews leads',
  RESOURCE:  'Captures and owns leads',
  EMPLOYEE:  'Back-office / support',
  CONNECTOR: 'External connector — captures leads only',
  CA:        'Charted Accountant — captures & refers leads',
  BANKER:    'Bank partner — captures & refers leads',
  INTERN:    'Intern — captures leads under supervision',
  INTERN:    'Intern — captures leads under supervisionsdfsdf'
};

// Roles that should appear in Resource dropdown (lead capture owners)
// Admin can add more roles — we check against settings.captureRoles
const isCaptureRole = (role, captureRoles = LEAD_CAPTURE_ROLES) =>
  captureRoles.includes(role);

export default function Team() {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [members, setMembers]     = useState([]);
  const [rms, setRms]             = useState([]);
  const [managers, setManagers]   = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [filterRole, setFilterRole] = useState('');

  // ── Dynamic custom roles stored in Settings ────────────────────────────
  const [customRoles, setCustomRoles]   = useState(DEFAULT_EXTRA_ROLES);
  const [newRoleInput, setNewRoleInput] = useState('');
  const [showRoleMgr, setShowRoleMgr]  = useState(false);

  const allRoles = [...SYSTEM_ROLES, ...customRoles];

  const [form, setForm] = useState({
    name: '', email: '', mobile: '', role: 'RESOURCE',
    manager: '', rm: '', city: '', target: '', capacity: '', password: '1234'
  });

  // ── Load data ─────────────────────────────────────────────────────────
  const reload = async () => {
    try {
      const r = await api.get('/users');
      setMembers(r.data);
    } catch (e) {}
  };

  useEffect(() => {
    reload();
    api.get('/users/by-role/RM').then(r => setRms(r.data)).catch(() => {});
    api.get('/users/by-role/MANAGER').then(r => setManagers(r.data)).catch(() => {});
    // Load custom roles from settings
    api.get('/settings').then(r => {
      if (r.data?.custom?.roles?.length) setCustomRoles(r.data.custom.roles);
    }).catch(() => {});
  }, []);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // ── Add team member ────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', form);
      toast(`✅ ${form.name} added — login: ${form.email} / ${form.password}`);
      setShowForm(false);
      setForm({ name: '', email: '', mobile: '', role: 'RESOURCE', manager: '', rm: '', city: '', target: '', capacity: '', password: '1234' });
      reload();
    } catch (err) {
      toast(err.response?.data?.error || 'Error adding member');
    } finally { setSaving(false); }
  };

  // ── Edit member (inline prompt) ────────────────────────────────────────
  const editMember = async (u) => {
    const name   = prompt('Full Name', u.name);    if (!name) return;
    const target = prompt('Monthly Target', u.target || 0);
    const cap    = prompt('Capacity (max leads)', u.capacity || 0);
    await api.patch(`/users/${u._id}`, { name, target: Number(target || 0), capacity: Number(cap || 0) });
    toast('Member updated');
    reload();
  };

  // ── Toggle active ──────────────────────────────────────────────────────
  const toggleActive = async (u) => {
    if (!confirm(`${u.active ? 'Deactivate' : 'Activate'} ${u.name}?`)) return;
    await api.patch(`/users/${u._id}`, { active: !u.active });
    toast(`${u.name} ${u.active ? 'deactivated' : 'activated'}`);
    reload();
  };

  // ── Reset password ─────────────────────────────────────────────────────
  const resetPassword = async (u) => {
    const p = prompt(`New password for ${u.name}`, '1234');
    if (!p) return;
    await api.post(`/users/${u._id}/reset-password`, { password: p });
    toast(`Password updated for ${u.name}`);
  };

  // ── Role-based CSV download ────────────────────────────────────────────
  // ADMIN → all data
  // MANAGER → only their own reporting chain (RMs + Resources under them)
  // RM → only their Resources
  const downloadMis = async () => {
    let params = '';
    if (user?.role === 'MANAGER') params = `?manager=${encodeURIComponent(user.name)}`;
    else if (user?.role === 'RM')  params = `?rm=${encodeURIComponent(user.name)}`;

    try {
      const r = await api.get(`/reports/export/leads${params}`, { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(r.data);
      a.download = `team-leads-${user?.name?.replace(/\s/g, '-')}.csv`;
      a.click();
      toast('CSV downloaded');
    } catch (e) { toast('Download failed'); }
  };

  // ── Add custom role ────────────────────────────────────────────────────
  const addCustomRole = async () => {
    const val = newRoleInput.trim().toUpperCase();
    if (!val || allRoles.includes(val)) { toast('Role already exists or empty'); return; }
    const updated = [...customRoles, val];
    setCustomRoles(updated);
    setNewRoleInput('');
    // Persist in settings
    await api.post('/settings/list/roles', { value: val }).catch(() => {});
    toast(`Role "${val}" added`);
  };

  const removeCustomRole = async (role) => {
    if (SYSTEM_ROLES.includes(role)) { toast('Cannot remove system roles'); return; }
    if (!confirm(`Remove role "${role}"? Existing members keep their role.`)) return;
    const updated = customRoles.filter(r => r !== role);
    setCustomRoles(updated);
    await api.post('/settings/list/roles', { value: '__REMOVE__' + role }).catch(() => {});
    toast(`Role "${role}" removed`);
  };

  // ── Filtered member list ───────────────────────────────────────────────
  const filtered = filterRole ? members.filter(m => m.role === filterRole) : members;

  return (
    <>
      {/* ── Header ── */}
      <div className="top">
        <div>
          <h1>Team Members &amp; Employee Data</h1>
          <p>Onboard connectors, CAs, bankers, interns and staff. Each gets their own login, role and reporting chain.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={downloadMis}>
            {user?.role === 'ADMIN' ? '⬇ Export All Leads' :
             user?.role === 'MANAGER' ? '⬇ Export My Team Leads' :
             '⬇ Export My Resource Leads'}
          </button>
          {isAdmin && (
            <button className="btn" onClick={() => setShowRoleMgr(s => !s)}>
              {showRoleMgr ? 'Close Role Manager' : 'Manage Roles'}
            </button>
          )}
          <button className="btn primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Cancel' : '+ Add Member'}
          </button>
        </div>
      </div>

      {/* ── Role Manager (Admin only) ── */}
      {isAdmin && showRoleMgr && (
        <section className="panel" style={{ marginBottom: 14 }}>
          <h2>Manage Custom Roles</h2>
          <p className="muted" style={{ margin: '0 0 10px' }}>
            Add roles like INTERN, DSA, LIC_AGENT, etc. System roles (ADMIN, MANAGER, RM, RESOURCE, EMPLOYEE) cannot be removed.
          </p>
          <div className="row" style={{ marginBottom: 10 }}>
            <input
              className="field" style={{ maxWidth: 220 }}
              placeholder="New role name (e.g. DSA)"
              value={newRoleInput}
              onChange={e => setNewRoleInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && addCustomRole()}
            />
            <button className="btn primary" onClick={addCustomRole}>Add Role</button>
          </div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            {SYSTEM_ROLES.map(r => (
              <span key={r} className="badge ADMIN" style={{ opacity: 0.7 }}>{r} (system)</span>
            ))}
            {customRoles.map(r => (
              <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="badge RESOURCE">{r}</span>
                <button
                  style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14, padding: 0 }}
                  onClick={() => removeCustomRole(r)}
                  title={`Remove ${r}`}
                >✕</button>
              </span>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 8, fontSize: 11 }}>
            Custom capture roles (appear in Resource dropdown on Lead Capture page): {LEAD_CAPTURE_ROLES.join(', ')} + any new role you add.
          </p>
        </section>
      )}

      {/* ── Add Member Form ── */}
      {showForm && (
        <section className="panel" style={{ marginBottom: 14 }}>
          <h2>Onboard New Member</h2>
          <form className="grid four" onSubmit={handleAdd}>
            {/* Basic info */}
            <div>
              <label>Full Name *</label>
              <input className="field" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Rahul Sharma" />
            </div>
            <div>
              <label>Email *</label>
              <input className="field" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="rahul@company.com" />
            </div>
            <div>
              <label>Mobile *</label>
              <input className="field" required value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="9876543210" />
            </div>
            <div>
              <label>City</label>
              <input className="field" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" />
            </div>

            {/* Role — dynamic from allRoles */}
            <div>
              <label>Role *</label>
              <select className="field" value={form.role} onChange={e => set('role', e.target.value)}>
                {allRoles.map(r => (
                  <option key={r} value={r}>{r} — {ROLE_HINTS[r] || 'Custom role'}</option>
                ))}
              </select>
            </div>

            {/* Reports to Manager */}
            <div>
              <label>Reports to Manager</label>
              <select className="field" value={form.manager} onChange={e => set('manager', e.target.value)}>
                <option value="">None (Top Level)</option>
                {managers.map(m => <option key={m._id} value={m.name}>{m.name}</option>)}
              </select>
            </div>

            {/* RM mapping — only relevant for capture roles */}
            <div>
              <label>Supervised by RM</label>
              <select className="field" value={form.rm} onChange={e => set('rm', e.target.value)}>
                <option value="">None</option>
                {rms.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
              </select>
            </div>

            {/* Monthly target */}
            <div>
              <label>Monthly Target (leads)</label>
              <input className="field" type="number" value={form.target} onChange={e => set('target', e.target.value)} placeholder="25" />
            </div>

            {/* Capacity */}
            <div>
              <label>Max Lead Capacity</label>
              <input className="field" type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="60" />
            </div>

            {/* Password */}
            <div>
              <label>Login Password *</label>
              <input className="field" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Default: 1234" />
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <button className="btn primary" disabled={saving}>
                {saving ? 'Creating login...' : 'Save Member & Create Login'}
              </button>
              <p className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                Member will log in at <b>localhost:5173/login</b> using their email and the password above.
              </p>
            </div>
          </form>
        </section>
      )}

      {/* ── Filter bar ── */}
      <div className="row panel" style={{ marginBottom: 14 }}>
        <label>Filter by Role:</label>
        <select className="field" style={{ maxWidth: 200 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">All Roles ({members.length})</option>
          {allRoles.map(r => {
            const count = members.filter(m => m.role === r).length;
            return count > 0 ? <option key={r} value={r}>{r} ({count})</option> : null;
          })}
        </select>
        <span className="muted" style={{ fontSize: 12 }}>
          Showing {filtered.length} of {members.length} members
        </span>
      </div>

      {/* ── Members Table ── */}
      <div className="panel" style={{ overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Name &amp; Role</th>
              <th>Reports To</th>
              <th>RM / Supervisor</th>
              <th>Contact</th>
              <th>Target / Cap</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u._id} style={{ opacity: u.active === false ? 0.5 : 1 }}>
                <td>
                  <b>{u.name}</b>
                  <br />
                  <span className={`badge ${roleBadge(u.role)}`}>{u.role}</span>
                  {u.title && <span className="muted" style={{ fontSize: 11, marginLeft: 4 }}>{u.title}</span>}
                </td>
                <td>{u.manager || <span className="muted">—</span>}</td>
                <td>{u.rm || <span className="muted">—</span>}</td>
                <td>
                  {u.mobile}
                  <br />
                  <span className="muted">{u.email}</span>
                </td>
                <td>
                  Target: <b>{u.target || 0}</b>
                  <br />
                  Cap: {u.capacity || 0}
                </td>
                <td>
                  <span className={`badge ${u.active === false ? '' : 'RM'}`}>
                    {u.active === false ? 'Inactive' : 'Active'}
                  </span>
                </td>
                <td>
                  <div className="row">
                    {isAdmin && <button className="btn" onClick={() => editMember(u)}>Edit</button>}
                    {isAdmin && <button className="btn" onClick={() => resetPassword(u)}>Password</button>}
                    {isAdmin && (
                      <button
                        className={`btn ${u.active !== false ? 'danger' : ''}`}
                        onClick={() => toggleActive(u)}
                      >
                        {u.active === false ? 'Activate' : 'Deactivate'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                  No members found{filterRole ? ` with role ${filterRole}` : ''}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
