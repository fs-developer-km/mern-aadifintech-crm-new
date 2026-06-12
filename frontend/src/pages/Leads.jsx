import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { useSettings } from '../hooks/useSettings.jsx';
import { money } from '../utils/constants.js';

export default function Leads() {
  const { stages } = useSettings();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rms, setRms] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [rmFilter, setRmFilter] = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      if (rmFilter) params.set('rm', rmFilter);
      const r = await api.get(`/leads?${params}`);
      setLeads(r.data.leads);
      setTotal(r.data.total);
    } catch (e) {}
    finally { setLoading(false); }
  }, [q, status, rmFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    api.get('/users/by-role/RM').then(r => setRms(r.data)).catch(() => {});
  }, []);

  const exportCsv = async () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    if (rmFilter) params.set('rm', rmFilter);
    const r = await api.get(`/reports/export/leads?${params}`, { responseType: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(r.data);
    a.download = 'filtered-leads.csv';
    a.click();
  };

  const whatsapp = (mobile, name, e) => {
    e.stopPropagation();
    window.open(
      `https://wa.me/${mobile.replace(/\D/g, '')}?text=${encodeURIComponent('Hello ' + name + ', this is regarding your lead with Aadi Fintech.')}`,
      '_blank'
    );
  };

  return (
    <>
      <div className="top">
        <div>
          <h1>Lead Management</h1>
          <p>Resource → RM → Manager handoff with editable lead data, documents and follow-up controls.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={exportCsv}>Export CSV</button>
          <button className="btn primary" onClick={() => navigate('/capture')}>New Lead</button>
        </div>
      </div>

      {/* Filters */}
      <div className="panel row" style={{ marginBottom: 14 }}>
        <input
          className="field" style={{ maxWidth: 320 }}
          placeholder="Search name, mobile, city, PAN"
          value={q} onChange={e => setQ(e.target.value)}
        />
        <select className="field" style={{ maxWidth: 210 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All stages</option>
          {stages.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="field" style={{ maxWidth: 210 }} value={rmFilter} onChange={e => setRmFilter(e.target.value)}>
          <option value="">All RMs</option>
          {rms.map(r => <option key={r._id}>{r.name}</option>)}
        </select>
      </div>

      <div className="panel" style={{ overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Lead</th>
              <th>Product</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Score</th>
              <th>Docs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} style={{ textAlign: 'center' }} className="muted">Loading...</td></tr>
            )}
            {!loading && leads.map(l => {
              const approved = (l.docs || []).filter(d => d.status === 'APPROVED').length;
              const pct = l.docs?.length ? Math.round(approved / l.docs.length * 100) : 0;
              return (
                <tr key={l._id}>
                  <td>
                    <span className="link" onClick={() => navigate(`/leads/${l._id}`)}>
                      {l.name}
                    </span>
                    <br />
                    <span className="muted">{l.mobile} | {l.city}</span>
                  </td>
                  <td>
                    {l.main}<br />
                    <span className="muted">{l.sub}</span>
                  </td>
                  <td>
                    <b>Resource:</b> {l.resource}<br />
                    <b>RM:</b> {l.rm}<br />
                    <b>Mgr:</b> {l.manager}
                  </td>
                  <td>
                    <span className={`badge ${l.status}`}>{l.status?.replaceAll('_', ' ')}</span>
                  </td>
                  <td>{l.score}/100</td>
                  <td>
                    <div className="bar" style={{ marginBottom: 4 }}>
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    {pct}%
                  </td>
                  <td>
                    <div className="row">
                      <button className="btn" onClick={e => whatsapp(l.mobile, l.name, e)}>WhatsApp</button>
                      <button className="btn" onClick={() => navigate(`/leads/${l._id}`)}>Open</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && leads.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center' }} className="muted">No leads found</td></tr>
            )}
          </tbody>
        </table>
        {total > 0 && (
          <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
            Showing {leads.length} of {total} leads
          </p>
        )}
      </div>
    </>
  );
}
