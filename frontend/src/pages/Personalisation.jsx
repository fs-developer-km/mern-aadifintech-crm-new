import { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { SYSTEM_ROLES } from '../utils/constants.js';
import api from '../utils/api.js';

function ListEditor({ label, items = [], onAdd, onRemove }) {
  const [val, setVal] = useState('');
  const handle = async () => {
    if (!val.trim()) return;
    await onAdd(val.trim());
    setVal('');
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label>{label}</label>
      <div className="row">
        <input
          className="field" style={{ maxWidth: 240 }}
          placeholder={`Add ${label.toLowerCase()}`}
          value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()}
        />
        <button className="btn" type="button" onClick={handle}>Add</button>
      </div>
      <p style={{ marginTop: 8, lineHeight: 2.2 }}>
        {items.map(x => (
          <span key={x} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, margin: '2px 4px' }}>
            <span className="badge">{x}</span>
            {onRemove && (
              <button
                style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, padding: 0 }}
                onClick={() => onRemove(x)}
                title={`Remove ${x}`}
              >✕</button>
            )}
          </span>
        ))}
      </p>
    </div>
  );
}

export default function Personalisation() {
  const { settings, reload, stages, sources, docTemplates, branches, customFields, products } = useSettings();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [customRoles, setCustomRoles] = useState([]);

  const [org, setOrg] = useState({ name: '', branch: '', accent: '#0f766e' });
  const [sys, setSys] = useState({ capacity: 35, slaHours: 24, docSlaDays: 3 });
  const [newCat, setNewCat] = useState('');
  const [newSub, setNewSub] = useState('');

  useEffect(() => {
    if (settings?.org) setOrg({ name: settings.org.name || '', branch: settings.org.branch || '', accent: settings.org.accent || '#0f766e' });
    if (settings?.settings) setSys({ capacity: settings.settings.capacity || 35, slaHours: settings.settings.slaHours || 24, docSlaDays: settings.settings.docSlaDays || 3 });
    if (settings?.custom?.roles) setCustomRoles(settings.custom.roles);
  }, [settings]);

  const saveOrg = async () => {
    setSaving(true);
    try {
      await api.patch('/settings/org', org);
      await api.patch('/settings/system', sys);
      document.documentElement.style.setProperty('--teal', org.accent);
      toast('Settings saved'); reload();
    } catch { toast('Error saving'); } finally { setSaving(false); }
  };

  const applyNoida = async () => {
    const updated = { ...org, branch: 'Noida Sector 62' };
    setOrg(updated);
    await api.patch('/settings/org', updated);
    toast('Branch set to Noida Sector 62'); reload();
  };

  const addToList = async (listName, value) => {
    await api.post(`/settings/list/${listName}`, { value });
    toast(`${value} added`); reload();
  };

  const removeFromList = async (listName, value) => {
    await api.post(`/settings/list/${listName}`, { value: '__REMOVE__' + value });
    toast(`${value} removed`); reload();
  };

  const addProduct = async () => {
    if (!newCat.trim() || !newSub.trim()) { toast('Enter both category and sub product'); return; }
    await api.post('/settings/products', { category: newCat.trim(), subProduct: newSub.trim() });
    toast('Product added'); setNewCat(''); setNewSub(''); reload();
  };

  const addRole = async (val) => {
    const role = val.toUpperCase();
    if (SYSTEM_ROLES.includes(role)) { toast('Cannot add system role'); return; }
    await api.post('/settings/list/roles', { value: role });
    setCustomRoles(r => [...r, role]);
    toast(`Role "${role}" added — now available in Team Onboarding`); reload();
  };

  const removeRole = async (val) => {
    if (SYSTEM_ROLES.includes(val)) { toast('Cannot remove system roles'); return; }
    if (!confirm(`Remove role "${val}"? Existing members keep their role.`)) return;
    await api.post('/settings/list/roles', { value: '__REMOVE__' + val });
    setCustomRoles(r => r.filter(x => x !== val));
    toast(`Role "${val}" removed`); reload();
  };

  return (
    <>
      <div className="top">
        <div>
          <h1>Personalisation Studio</h1>
          <p>Manage organisation, theme, roles, products, statuses, sources, documents, branches and custom fields.</p>
        </div>
        <div className="row">
          <button className="btn primary" onClick={applyNoida}>Apply Noida Sector 62 Office</button>
        </div>
      </div>

      <div className="grid two">
        {/* ── Organisation ── */}
        <section className="panel">
          <h2>Organisation</h2>
          <div className="grid three">
            <div>
              <label>Organisation Name</label>
              <input className="field" value={org.name} onChange={e => setOrg(o => ({ ...o, name: e.target.value }))} />
            </div>
            <div>
              <label>Default Branch</label>
              <input className="field" value={org.branch} onChange={e => setOrg(o => ({ ...o, branch: e.target.value }))} />
            </div>
            <div>
              <label>Theme Colour</label>
              <input className="field" type="color" value={org.accent} onChange={e => setOrg(o => ({ ...o, accent: e.target.value }))} />
            </div>
            <div>
              <label>Default RM Capacity</label>
              <input className="field" type="number" value={sys.capacity} onChange={e => setSys(s => ({ ...s, capacity: Number(e.target.value) }))} />
            </div>
            <div>
              <label>Follow-up SLA Hours</label>
              <input className="field" type="number" value={sys.slaHours} onChange={e => setSys(s => ({ ...s, slaHours: Number(e.target.value) }))} />
            </div>
            <div>
              <label>Document SLA Days</label>
              <input className="field" type="number" value={sys.docSlaDays} onChange={e => setSys(s => ({ ...s, docSlaDays: Number(e.target.value) }))} />
            </div>
          </div>
          <button className="btn primary" style={{ marginTop: 12 }} onClick={saveOrg} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </section>

        {/* ── Custom Roles ── */}
        <section className="panel">
          <h2>Custom Roles</h2>
          <p className="muted" style={{ margin: '0 0 10px', fontSize: 12 }}>
            System roles: <b>{SYSTEM_ROLES.join(', ')}</b> — cannot be removed.<br />
            Add custom roles (e.g. DSA, LIC_AGENT) — they appear in Team Onboarding dropdown and Lead Capture resource list.
          </p>
          <ListEditor
            label="Custom Role"
            items={customRoles}
            onAdd={addRole}
            onRemove={removeRole}
          />
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, padding: '10px 12px', fontSize: 12 }}>
            <b>Current role dropdown in Team Onboarding:</b><br />
            {[...SYSTEM_ROLES, ...customRoles].map(r => <span key={r} className="badge" style={{ margin: '2px 3px' }}>{r}</span>)}
          </div>
        </section>

        {/* ── Products ── */}
        <section className="panel">
          <h2>Add Product / Sub Product</h2>
          <div className="grid three">
            <input className="field" placeholder="Main category (e.g. Loan)" value={newCat} onChange={e => setNewCat(e.target.value)} />
            <input className="field" placeholder="Sub product (e.g. Car Loan)" value={newSub} onChange={e => setNewSub(e.target.value)} />
            <button className="btn primary" type="button" onClick={addProduct}>Add Product</button>
          </div>
          <div style={{ marginTop: 10 }}>
            {Object.entries(products || {}).map(([cat, subs]) => (
              <p key={cat} style={{ margin: '5px 0', fontSize: 13 }}>
                <b>{cat}:</b> {Array.isArray(subs) ? subs.join(', ') : ''}
              </p>
            ))}
          </div>
        </section>

        {/* ── Picklists ── */}
        <section className="panel">
          <h2>Custom Picklists</h2>
          <ListEditor label="Status" items={stages} onAdd={v => addToList('statuses', v)} onRemove={v => removeFromList('statuses', v)} />
          <ListEditor label="Source" items={sources} onAdd={v => addToList('sources', v)} onRemove={v => removeFromList('sources', v)} />
          <ListEditor label="Document Template" items={docTemplates} onAdd={v => addToList('documents', v)} onRemove={v => removeFromList('documents', v)} />
        </section>

        {/* ── Branches & Fields ── */}
        <section className="panel">
          <h2>Branches &amp; Custom Lead Fields</h2>
          <ListEditor label="Branch" items={branches} onAdd={v => addToList('branches', v)} onRemove={v => removeFromList('branches', v)} />
          <ListEditor label="Custom Lead Field" items={customFields} onAdd={v => addToList('fields', v)} onRemove={v => removeFromList('fields', v)} />
          <div style={{ marginTop: 16 }}>
            <label>Danger Zone</label>
            <button className="btn danger" onClick={() => toast('To reset: run "npm run seed" in /backend folder')}>
              Reset Data Info
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
