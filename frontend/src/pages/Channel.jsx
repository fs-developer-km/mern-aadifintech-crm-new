import { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useSettings } from '../hooks/useSettings.jsx';
import { useToast } from '../hooks/useToast.jsx';

export default function Channel() {
  const { products, rules, reload: reloadSettings } = useSettings();
  const toast = useToast();
  const [rms, setRms] = useState([]);
  const [resources, setResources] = useState([]);
  const [managers, setManagers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [ruleProduct, setRuleProduct] = useState('');
  const [ruleResource, setRuleResource] = useState('');
  const [ruleRm, setRuleRm] = useState('');
  const [rulePriority, setRulePriority] = useState(1);

  const allSubs = Object.values(products || {}).flat();

  useEffect(() => {
    api.get('/users/by-role/RM').then(r => { setRms(r.data); if (r.data[0]) setRuleRm(r.data[0].name); }).catch(() => {});
    api.get('/users/by-role/RESOURCE').then(r => { setResources(r.data); if (r.data[0]) setRuleResource(r.data[0].name); }).catch(() => {});
    api.get('/users/by-role/MANAGER').then(r => setManagers(r.data)).catch(() => {});
    api.get('/users').then(r => setAllUsers(r.data)).catch(() => {});
    if (allSubs.length) setRuleProduct(allSubs[0]);
  }, []);

  const saveRule = async () => {
    await api.post('/settings/rules', { product: ruleProduct, resource: ruleResource, rm: ruleRm, priority: rulePriority });
    toast('Assignment rule saved');
    reloadSettings();
  };

  const toggleRule = async (i) => {
    await api.patch(`/settings/rules/${i}/toggle`);
    toast('Rule status changed');
    reloadSettings();
  };

  const deleteRule = async (i) => {
    if (!confirm('Delete this assignment rule?')) return;
    await api.delete(`/settings/rules/${i}`);
    toast('Rule deleted');
    reloadSettings();
  };

  const loadRule = (r) => {
    setRuleProduct(r.product);
    setRuleResource(r.resource || '');
    setRuleRm(r.rm || '');
    setRulePriority(r.priority || 1);
  };

  const setResourceRm = async (userId, rmName) => {
    const rmUser = rms.find(r => r.name === rmName);
    await api.patch(`/users/${userId}`, { rm: rmName, manager: rmUser?.manager });
    toast(`Resource updated to report to ${rmName}`);
    api.get('/users').then(r => setAllUsers(r.data)).catch(() => {});
  };

  return (
    <>
      <div className="top">
        <div>
          <h1>Assignment Channel</h1>
          <p>Edit product routing, resource ownership, priority and reporting chain.</p>
        </div>
        <div className="row">
          <button className="btn primary" onClick={saveRule}>Save Rule</button>
        </div>
      </div>

      <div className="grid two">
        <section className="panel">
          <h2>Rule Builder</h2>
          <div className="grid three">
            <div>
              <label>Sub Product</label>
              <select className="field" value={ruleProduct} onChange={e => setRuleProduct(e.target.value)}>
                {allSubs.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label>Resource Owner</label>
              <select className="field" value={ruleResource} onChange={e => setRuleResource(e.target.value)}>
                {resources.map(r => <option key={r._id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label>Assigned RM</label>
              <select className="field" value={ruleRm} onChange={e => setRuleRm(e.target.value)}>
                {rms.map(r => <option key={r._id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label>Priority</label>
              <input className="field" type="number" value={rulePriority} onChange={e => setRulePriority(Number(e.target.value))} />
            </div>
          </div>

          <h2 style={{ marginTop: 16 }}>Product Routing Rules</h2>
          <table>
            <thead><tr><th>Sub Product</th><th>Resource</th><th>RM</th><th>Priority</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>
              {(rules || []).map((r, i) => {
                const rmUser = rms.find(u => u.name === r.rm);
                return (
                  <tr key={i}>
                    <td>{r.product}<br /><span className="muted">Manager: {rmUser?.manager || '-'}</span></td>
                    <td>{r.resource || '-'}</td>
                    <td>{r.rm}</td>
                    <td>{r.priority || 1}</td>
                    <td>{r.active !== false ? 'Yes' : 'No'}</td>
                    <td className="row">
                      <button className="btn" onClick={() => loadRule(r)}>Edit</button>
                      <button className="btn" onClick={() => toggleRule(i)}>{r.active !== false ? 'Disable' : 'Enable'}</button>
                      <button className="btn danger" onClick={() => deleteRule(i)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h2>Reporting Tree</h2>
          {managers.map(m => (
            <div key={m._id}>
              <p><b>{m.name}</b> — Manager</p>
              {rms.filter(r => r.manager === m.name).map(r => (
                <div key={r._id}>
                  <p style={{ marginLeft: 16 }}><b>{r.name}</b> — RM</p>
                  {allUsers.filter(u => u.rm === r.name && u.role === 'RESOURCE').map(x => (
                    <p key={x._id} style={{ marginLeft: 34 }}>{x.name} — Resource</p>
                  ))}
                </div>
              ))}
            </div>
          ))}

          <h2 style={{ marginTop: 16 }}>Resource Mapping</h2>
          {allUsers.filter(u => u.role === 'RESOURCE').map(u => (
            <div className="split" key={u._id} style={{ borderBottom: '1px solid #eef2f7', padding: '8px 0' }}>
              <span><b>{u.name}</b><br /><span className="muted">{u.city}</span></span>
              <select
                className="field" style={{ maxWidth: 180 }}
                value={u.rm || ''}
                onChange={e => setResourceRm(u._id, e.target.value)}
              >
                {rms.map(r => <option key={r._id}>{r.name}</option>)}
              </select>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
