import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { useSettings } from '../hooks/useSettings.jsx';
import { useToast } from '../hooks/useToast.jsx';

export default function Capture() {
  const navigate = useNavigate();
  const { products, sources, stages, docTemplates, customFields, rules } = useSettings();
  const toast = useToast();

  const [rms, setRms] = useState([]);
  const [resources, setResources] = useState([]);
  const [managers, setManagers] = useState([]);

  const productCategories = Object.keys(products || {});
  const [mainCat, setMainCat] = useState(productCategories[0] || '');
  const [subProduct, setSubProduct] = useState('');
  const [source, setSource] = useState('');
  const [resource, setResource] = useState('');
  const [rm, setRm] = useState('');
  const [manager, setManager] = useState('');

  const [form, setForm] = useState({
    name: '', mobile: '', email: '', city: '', state: '', amount: '', message: ''
  });
  const [customForm, setCustomForm] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/users/by-role/RM').then(r => { setRms(r.data); if (r.data[0]) setRm(r.data[0].name); }).catch(() => {});
    api.get('/users/by-role/RESOURCE').then(r => { setResources(r.data); if (r.data[0]) setResource(r.data[0].name); }).catch(() => {});
    api.get('/users/by-role/MANAGER').then(r => { setManagers(r.data); if (r.data[0]) setManager(r.data[0].name); }).catch(() => {});
  }, []);

  // Set first sub when main changes
  useEffect(() => {
    const subs = products?.[mainCat] || [];
    if (subs.length) { setSubProduct(subs[0]); applyRule(subs[0]); }
  }, [mainCat, products]);

  const applyRule = (sub) => {
    const rule = (rules || []).filter(r => r.active !== false && r.product === sub)
      .sort((a, b) => (a.priority || 9) - (b.priority || 9))[0];
    if (rule) {
      if (rule.resource) setResource(rule.resource);
      if (rule.rm) setRm(rule.rm);
      const rmUser = rms.find(r => r.name === rule.rm);
      if (rmUser?.manager) setManager(rmUser.manager);
    }
  };

  const handleSubChange = (sub) => { setSubProduct(sub); applyRule(sub); };

  const handleResourceChange = (name) => {
    setResource(name);
    const r = resources.find(u => u.name === name);
    if (r?.rm) setRm(r.rm);
    if (r?.manager) setManager(r.manager);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/leads', {
        ...form,
        main: mainCat,
        sub: subProduct,
        source,
        resource,
        rm,
        manager,
        custom: customForm
      });
      toast(`Lead assigned ${resource} → ${rm} → ${manager}`);
      navigate('/leads');
    } catch (err) {
      toast(err.response?.data?.error || 'Error creating lead');
    } finally { setLoading(false); }
  };

  const subs = products?.[mainCat] || [];

  return (
    <>
      <div className="top">
        <div>
          <h1>Lead Capture</h1>
          <p>Add lead, choose resource owner, and auto-map RM/Manager reporting chain.</p>
        </div>
      </div>

      <form className="panel grid three" onSubmit={handleSubmit}>
        {[
          ['name', 'Full Name', 'text'],
          ['mobile', 'Mobile', 'text'],
          ['email', 'Email', 'email'],
          ['city', 'City', 'text'],
          ['state', 'State', 'text'],
          ['amount', 'Amount', 'number']
        ].map(([k, label, type]) => (
          <div key={k}>
            <label>{label}</label>
            <input className="field" type={type} required={['name', 'mobile'].includes(k)}
              value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
          </div>
        ))}

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
        <div>
          <label>Source</label>
          <select className="field" value={source} onChange={e => setSource(e.target.value)}>
            <option value="">Select source</option>
            {sources.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label>Resource</label>
          <select className="field" value={resource} onChange={e => handleResourceChange(e.target.value)}>
            {resources.map(r => <option key={r._id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label>RM</label>
          <select className="field" value={rm} onChange={e => setRm(e.target.value)}>
            {rms.map(r => <option key={r._id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label>Manager</label>
          <select className="field" value={manager} onChange={e => setManager(e.target.value)}>
            {managers.map(m => <option key={m._id}>{m.name}</option>)}
          </select>
        </div>

        {customFields.map(f => (
          <div key={f}>
            <label>{f}</label>
            <input className="field" value={customForm[f] || ''}
              onChange={e => setCustomForm(c => ({ ...c, [f]: e.target.value }))} />
          </div>
        ))}

        <div style={{ gridColumn: '1/-1' }}>
          <label>Message</label>
          <textarea className="field" rows={3} value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
        </div>

        <div className="row" style={{ gridColumn: '1/-1' }}>
          <button className="btn primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Lead'}
          </button>
        </div>
      </form>
    </>
  );
}
