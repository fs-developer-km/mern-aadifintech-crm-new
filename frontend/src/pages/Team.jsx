import { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { ROLES } from '../utils/constants.js';
import { useToast } from '../hooks/useToast.jsx';

export default function Team() {
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [rms, setRms] = useState([]);
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', role: 'RESOURCE', manager: '', rm: '', city: '', target: '', password: '1234'
  });
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    const r = await api.get('/users');
    setMembers(r.data);
  };

  useEffect(() => {
    reload();
    api.get('/users/by-role/RM').then(r => setRms(r.data)).catch(() => {});
    api.get('/users/by-role/MANAGER').then(r => setManagers(r.data)).catch(() => {});
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', form);
      toast('Team member login created');
      setShowForm(false);
      setForm({ name: '', email: '', mobile: '', role: 'RESOURCE', manager: '', rm: '', city: '', target: '', password: '1234' });
      reload();
    } catch (err) {
      toast(err.response?.data?.error || 'Error adding member');
    } finally { setSaving(false); }
  };

  const editMember = async (u) => {
    const name = prompt('Name', u.name);
    if (!name) return;
    const target = prompt('Monthly target', u.target || 0);
    await api.patch(`/users/${u._id}`, { name, target: Number(target || 0) });
    toast('Member updated');
    reload();
  };

  const resetPassword = async (u) => {
    const p = prompt(`Set password for ${u.name}`, u.password || '1234');
    if (!p) return;
    await api.post(`/users/${u._id}/reset-password`, { password: p });
    toast('Password updated');
  };

  const f = form;
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <>
      <div className="top">
        <div>
          <h1>Team Members & Employee Data</h1>
          <p>Add resources, RMs, managers and employees; edit reporting hierarchy and capacity.</p>
        </div>
        <div className="row">
          <button className="btn primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Cancel' : 'Add Member'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <form className="grid four" onSubmit={handleAdd}>
            {[['name','Name'],['email','Email'],['mobile','Mobile']].map(([k,l]) => (
              <div key={k}>
                <label>{l}</label>
                <input className="field" required value={f[k]} onChange={e => set(k, e.target.value)} />
              </div>
            ))}
            <div>
              <label>Role</label>
              <select className="field" value={f.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label>Manager</label>
              <select className="field" value={f.manager} onChange={e => set('manager', e.target.value)}>
                <option value="">None</option>
                {managers.map(m => <option key={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label>RM (for Resource)</label>
              <select className="field" value={f.rm} onChange={e => set('rm', e.target.value)}>
                <option value="">None</option>
                {rms.map(r => <option key={r._id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label>City</label>
              <input className="field" value={f.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <label>Monthly Target</label>
              <input className="field" type="number" value={f.target} onChange={e => set('target', e.target.value)} />
            </div>
            <div>
              <label>Login Password</label>
              <input className="field" value={f.password} onChange={e => set('password', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <button className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save Member & Login'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="panel" style={{ overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Role</th><th>Reports To</th><th>RM Mapping</th><th>Contact</th><th>Target</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map(u => (
              <tr key={u._id}>
                <td><b>{u.name}</b><br /><span className="muted">{u.title}</span></td>
                <td><span className={`badge ${u.role}`}>{u.role}</span></td>
                <td>{u.manager || '-'}</td>
                <td>{u.rm || '-'}</td>
                <td>{u.mobile}<br /><span className="muted">{u.email}</span></td>
                <td>{u.target || 0}</td>
                <td className="row">
                  <button className="btn" onClick={() => editMember(u)}>Edit</button>
                  <button className="btn" onClick={() => resetPassword(u)}>Password</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
