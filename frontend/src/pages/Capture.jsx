import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { useSettings } from '../hooks/useSettings.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { SOURCE_ROLE_MAP } from '../utils/constants.js';

export default function Capture() {
  const navigate = useNavigate();
  const { products, sources, stages, customFields, rules } = useSettings();
  const toast = useToast();

  // ── Team lists ──────────────────────────────────────────────────────────
  const [allUsers,  setAllUsers]  = useState([]);
  const [rms,       setRms]       = useState([]);
  const [managers,  setManagers]  = useState([]);

  // ── Form state ──────────────────────────────────────────────────────────
  const productCategories = Object.keys(products || {});
  const [mainCat,    setMainCat]    = useState(productCategories[0] || '');
  const [subProduct, setSubProduct] = useState('');
  const [source,     setSource]     = useState('');
  const [resource,   setResource]   = useState('');
  const [rm,         setRm]         = useState('');
  const [manager,    setManager]    = useState('');

  const [form, setForm] = useState({
    name: '', mobile: '', email: '', city: '', state: '', amount: '', message: ''
  });
  const [customForm, setCustomForm] = useState({});
  const [loading, setLoading] = useState(false);

  // ── Load users ──────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/users').then(r => {
      setAllUsers(r.data);
    }).catch(() => {});

    api.get('/users/by-role/RM').then(r => {
      setRms(r.data);
      if (r.data[0]) setRm(r.data[0].name);
    }).catch(() => {});

    api.get('/users/by-role/MANAGER').then(r => {
      setManagers(r.data);
      if (r.data[0]) setManager(r.data[0].name);
    }).catch(() => {});
  }, []);

  // ── Source → Resource filtering (DEPENDENT DROPDOWN) ───────────────────
  // Jab source change ho → resource dropdown filter ho jata hai
  const filteredCaptureUsers = useMemo(() => {
    const allowedRoles = SOURCE_ROLE_MAP[source]; // null = show all

    const base = allUsers.filter(u =>
      u.active !== false &&
      !['ADMIN', 'MANAGER', 'RM'].includes(u.role)  // never show admin/mgr/rm in resource
    );

    if (!source || allowedRoles === null || allowedRoles === undefined) {
      // No source selected or source maps to null → show all capture users
      return base;
    }

    // Filter to only matching roles
    return base.filter(u => allowedRoles.includes(u.role));
  }, [source, allUsers]);

  // Group filtered users by role for <optgroup>
  const grouped = useMemo(() => {
    return filteredCaptureUsers.reduce((acc, u) => {
      if (!acc[u.role]) acc[u.role] = [];
      acc[u.role].push(u);
      return acc;
    }, {});
  }, [filteredCaptureUsers]);

  // When source changes → reset resource if current resource is no longer in filtered list
  useEffect(() => {
    if (!resource) return;
    const stillValid = filteredCaptureUsers.some(u => u.name === resource);
    if (!stillValid) {
      setResource('');
      // Auto-select first available
      if (filteredCaptureUsers.length > 0) {
        const first = filteredCaptureUsers[0];
        setResource(first.name);
        if (first.rm)      setRm(first.rm);
        if (first.manager) setManager(first.manager);
      }
    }
  }, [source, filteredCaptureUsers]);

  // ── First sub when main changes ─────────────────────────────────────────
  useEffect(() => {
    const subs = products?.[mainCat] || [];
    if (subs.length) {
      setSubProduct(subs[0]);
      applyRule(subs[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainCat, products]);

  // ── Auto-assign via product rule ────────────────────────────────────────
  const applyRule = (sub) => {
    const rule = (rules || [])
      .filter(r => r.active !== false && r.product === sub)
      .sort((a, b) => (a.priority || 9) - (b.priority || 9))[0];
    if (rule) {
      if (rule.resource) setResource(rule.resource);
      if (rule.rm)       setRm(rule.rm);
      const rmUser = allUsers.find(u => u.name === rule.rm);
      if (rmUser?.manager) setManager(rmUser.manager);
    }
  };

  const handleSubChange = (sub) => {
    setSubProduct(sub);
    applyRule(sub);
  };

  // When resource changed manually → auto-fill RM & Manager from user profile
  const handleResourceChange = (name) => {
    setResource(name);
    const u = allUsers.find(x => x.name === name);
    if (u?.rm)      setRm(u.rm);
    if (u?.manager) setManager(u.manager);
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resource) { toast('Please select a Resource / Connector'); return; }
    setLoading(true);
    try {
      await api.post('/leads', {
        ...form,
        main:    mainCat,
        sub:     subProduct,
        source,
        resource,
        rm,
        manager,
        custom:  customForm
      });
      toast(`✅ Lead saved — ${resource} → ${rm} → ${manager}`);
      navigate('/leads');
    } catch (err) {
      toast(err.response?.data?.error || 'Error creating lead');
    } finally { setLoading(false); }
  };

  const subs = products?.[mainCat] || [];
  const selectedUser = allUsers.find(u => u.name === resource);

  // Count hint for source dropdown
  const sourceUserCount = (src) => {
    if (!src) return null;
    const allowed = SOURCE_ROLE_MAP[src];
    if (allowed === null || allowed === undefined) return allUsers.filter(u => !['ADMIN','MANAGER','RM'].includes(u.role) && u.active !== false).length;
    return allUsers.filter(u => allowed.includes(u.role) && u.active !== false).length;
  };

  return (
    <>
      <div className="top">
        <div>
          <h1>Lead Capture</h1>
          <p>Add lead, select source, choose resource owner — Resource dropdown filters automatically based on source.</p>
        </div>
      </div>

      <form className="panel grid three" onSubmit={handleSubmit}>

        {/* ── Lead Info ── */}
        {[
          ['name',   'Full Name *',  'text'],
          ['mobile', 'Mobile *',     'text'],
          ['email',  'Email',        'email'],
          ['city',   'City',         'text'],
          ['state',  'State',        'text'],
          ['amount', 'Amount (₹)',   'number'],
        ].map(([k, label, type]) => (
          <div key={k}>
            <label>{label}</label>
            <input
              className="field" type={type}
              required={['name', 'mobile'].includes(k)}
              value={form[k]}
              onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
            />
          </div>
        ))}

        {/* ── Product ── */}
        <div>
          <label>Main Category</label>
          <select className="field" value={mainCat} onChange={e => setMainCat(e.target.value)}>
            {productCategories.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label>Sub Category</label>
          <select className="field" value={subProduct} onChange={e => handleSubChange(e.target.value)}>
            {subs.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* ── Source (updated list) ── */}
        <div>
          <label>
            Source
            {source && (
              <span className="muted" style={{ fontWeight: 400, marginLeft: 6 }}>
                ({sourceUserCount(source)} matching resource{sourceUserCount(source) !== 1 ? 's' : ''})
              </span>
            )}
          </label>
          <select
            className="field"
            value={source}
            onChange={e => setSource(e.target.value)}
          >
            <option value="">Select source</option>

            {/* ── New sources group ── */}
            {/* ── New sources group ── */}
          <optgroup label="── Internal Sources ──">
            {['Employee', 'Charted Account', 'Banker', 'Connector', 'Founder', 'Admin Team'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </optgroup>

            {/* ── Digital / Marketing ── */}
            <optgroup label="── Digital / Marketing ──">
              {['Website Organic', 'Google Ads', 'Facebook / Instagram Ads', 'YouTube', 'WhatsApp Campaign'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </optgroup>

            {/* ── Field / Direct ── */}
            <optgroup label="── Field / Direct ──">
              {['Referral', 'Walk-in', 'Telecalling', 'Partner / DSA', 'Other'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* ── DEPENDENT: Resource / Connector ── */}
        <div>
          <label>
            Resource / Connector *
            {source && SOURCE_ROLE_MAP[source] && (
              <span className="muted" style={{ fontWeight: 400, marginLeft: 6 }}>
                (filtered: {SOURCE_ROLE_MAP[source].join(', ')})
              </span>
            )}
            {selectedUser && (
              <span className="muted" style={{ fontWeight: 400, marginLeft: 6 }}>
                · {selectedUser.role}{selectedUser.city ? ` · ${selectedUser.city}` : ''}
              </span>
            )}
          </label>

          {/* Show info banner when source filters resources */}
          {source && SOURCE_ROLE_MAP[source] && filteredCaptureUsers.length === 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '8px 12px', marginBottom: 6, fontSize: 12, color: '#b91c1c' }}>
              ⚠ No active {SOURCE_ROLE_MAP[source].join(' / ')} found. Add team members from Team Members page.
            </div>
          )}

          <select
            className="field"
            value={resource}
            onChange={e => handleResourceChange(e.target.value)}
            required
          >
            <option value="">
              {filteredCaptureUsers.length === 0
                ? 'No matching resources'
                : 'Select resource owner'}
            </option>
            {Object.entries(grouped).map(([role, users]) => (
              <optgroup key={role} label={`── ${role} ──`}>
                {users.map(u => (
                  <option key={u._id} value={u.name}>
                    {u.name}{u.city ? ` (${u.city})` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* ── RM ── */}
        <div>
          <label>RM</label>
          <select className="field" value={rm} onChange={e => setRm(e.target.value)}>
            <option value="">Select RM</option>
            {rms.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
          </select>
        </div>

        {/* ── Manager ── */}
        <div>
          <label>Manager</label>
          <select className="field" value={manager} onChange={e => setManager(e.target.value)}>
            <option value="">Select Manager</option>
            {managers.map(m => <option key={m._id} value={m.name}>{m.name}</option>)}
          </select>
        </div>

        {/* ── Custom Fields ── */}
        {(customFields || []).map(f => (
          <div key={f}>
            <label>{f}</label>
            <input
              className="field"
              value={customForm[f] || ''}
              onChange={e => setCustomForm(c => ({ ...c, [f]: e.target.value }))}
            />
          </div>
        ))}

        {/* ── Message ── */}
        <div style={{ gridColumn: '1/-1' }}>
          <label>Message / Notes</label>
          <textarea
            className="field" rows={3}
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            placeholder="Any initial notes about this lead..."
          />
        </div>

        {/* ── Assignment Preview ── */}
        {resource && (
          <div style={{
            gridColumn: '1/-1',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 7,
            padding: '10px 14px',
            fontSize: 13
          }}>
            <b>Assignment Chain:</b> &nbsp;
            <span style={{ color: '#0f766e', fontWeight: 700 }}>{resource}</span>
            {selectedUser?.role && (
              <span className="muted"> ({selectedUser.role})</span>
            )}
            {rm && <> → <span style={{ color: '#1d4ed8', fontWeight: 700 }}>{rm}</span> <span className="muted">(RM)</span></>}
            {manager && <> → <span style={{ color: '#7c3aed', fontWeight: 700 }}>{manager}</span> <span className="muted">(Manager)</span></>}
          </div>
        )}

        {/* ── Buttons ── */}
        <div className="row" style={{ gridColumn: '1/-1' }}>
          <button className="btn primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Lead'}
          </button>
          <button type="button" className="btn" onClick={() => navigate('/leads')}>
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
