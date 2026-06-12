import { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings.jsx';
import { useToast } from '../hooks/useToast.jsx';
import api from '../utils/api.js';

function ListEditor({ label, items = [], onAdd }) {
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
          className="field" style={{ maxWidth: 260 }}
          placeholder={`Add ${label.toLowerCase()}`}
          value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()}
        />
        <button className="btn" type="button" onClick={handle}>Add</button>
      </div>
      <p style={{ marginTop: 8, lineHeight: 2 }}>
        {items.map(x => <span key={x} className="badge" style={{ margin: '2px 3px' }}>{x}</span>)}
      </p>
    </div>
  );
}

export default function Personalisation() {
  const { settings, reload, stages, sources, docTemplates, branches, customFields, products } = useSettings();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const [org, setOrg] = useState({
    name: '', branch: '', accent: '#0f766e'
  });
  const [sys, setSys] = useState({
    capacity: 35, slaHours: 24, docSlaDays: 3
  });
  const [newCat, setNewCat] = useState('');
  const [newSub, setNewSub] = useState('');

  // Sync from settings once loaded
  useEffect(() => {
    if (settings?.org) {
      setOrg({
        name: settings.org.name || '',
        branch: settings.org.branch || '',
        accent: settings.org.accent || '#0f766e'
      });
    }
    if (settings?.settings) {
      setSys({
        capacity: settings.settings.capacity || 35,
        slaHours: settings.settings.slaHours || 24,
        docSlaDays: settings.settings.docSlaDays || 3
      });
    }
  }, [settings]);

  const saveOrg = async () => {
    setSaving(true);
    try {
      await api.patch('/settings/org', org);
      await api.patch('/settings/system', sys);
      document.documentElement.style.setProperty('--teal', org.accent);
      toast('Settings saved successfully');
      reload();
    } catch (e) {
      toast('Error saving settings');
    } finally { setSaving(false); }
  };

  const applyNoidaOffice = async () => {
    const updated = { ...org, branch: 'Noida Sector 62' };
    setOrg(updated);
    await api.patch('/settings/org', updated);
    if (!(branches || []).includes('Noida Sector 62')) {
      await api.post('/settings/list/branches', { value: 'Noida Sector 62' });
    }
    toast('Office updated to Noida Sector 62');
    reload();
  };

  const addToList = async (listName, value) => {
    await api.post(`/settings/list/${listName}`, { value });
    toast(`${value} added`);
    reload();
  };

  const addProduct = async () => {
    if (!newCat.trim() || !newSub.trim()) { toast('Enter both category and sub product'); return; }
    await api.post('/settings/products', { category: newCat.trim(), subProduct: newSub.trim() });
    toast('Product added');
    setNewCat(''); setNewSub('');
    reload();
  };

  const resetData = () => {
    toast('To reset data: run "npm run seed" in the backend folder');
  };

  return (
    <>
      <div className="top">
        <div>
          <h1>Personalisation Studio</h1>
          <p>Make the system yours: organisation, colours, products, statuses, sources, documents, branches and custom fields.</p>
        </div>
        <div className="row">
          <button className="btn primary" onClick={applyNoidaOffice}>Apply Noida Sector 62 Office</button>
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
          <button className="btn primary" style={{ marginTop: 14 }} onClick={saveOrg} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </section>

        {/* ── Products ── */}
        <section className="panel">
          <h2>Add Product / Sub Product</h2>
          <div className="grid three">
            <input className="field" placeholder="Main category (e.g. Loan)" value={newCat} onChange={e => setNewCat(e.target.value)} />
            <input className="field" placeholder="Sub product (e.g. Car Loan)" value={newSub} onChange={e => setNewSub(e.target.value)} />
            <button className="btn primary" type="button" onClick={addProduct}>Add Product</button>
          </div>
          <div style={{ marginTop: 12 }}>
            {Object.entries(products || {}).map(([cat, subs]) => (
              <p key={cat} style={{ margin: '6px 0', fontSize: 13 }}>
                <b>{cat}:</b> {Array.isArray(subs) ? subs.join(', ') : ''}
              </p>
            ))}
          </div>
        </section>

        {/* ── Custom Picklists ── */}
        <section className="panel">
          <h2>Custom Picklists</h2>
          <ListEditor label="Status" items={stages} onAdd={v => addToList('statuses', v)} />
          <ListEditor label="Source" items={sources} onAdd={v => addToList('sources', v)} />
          <ListEditor label="Document Template" items={docTemplates} onAdd={v => addToList('documents', v)} />
        </section>

        {/* ── Branches & Custom Fields ── */}
        <section className="panel">
          <h2>Branches &amp; Custom Fields</h2>
          <ListEditor label="Branch" items={branches} onAdd={v => addToList('branches', v)} />
          <ListEditor label="Custom Lead Field" items={customFields} onAdd={v => addToList('fields', v)} />
          <div style={{ marginTop: 16 }}>
            <label>Danger Zone</label>
            <button className="btn danger" onClick={resetData}>Reset Local Data</button>
            <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
              To fully reset: stop server, run <code>npm run seed</code> in /backend
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
