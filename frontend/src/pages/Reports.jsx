import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import { ROLES, money } from '../utils/constants.js';
import { useSettings } from '../hooks/useSettings.jsx';

function BarChart({ data }) {
  const entries = Object.entries(data || {});
  const max = Math.max(1, ...entries.map(([, v]) => v));
  if (!entries.length) return <p className="muted">No data</p>;
  return entries.map(([k, v]) => (
    <div className="chartbar" key={k}>
      <b>{k.replaceAll('_', ' ')}</b>
      <div className="bar"><span style={{ width: `${(v / max) * 100}%` }} /></div>
      <span>{v}</span>
    </div>
  ));
}

function PerfTable({ data, title }) {
  const entries = Object.entries(data || {});
  return (
    <section className="panel">
      <h2>{title}</h2>
      <table>
        <thead><tr><th>Name</th><th>Leads</th><th>Converted</th><th>Pending Docs</th></tr></thead>
        <tbody>
          {entries.map(([name, d]) => (
            <tr key={name}>
              <td><b>{name}</b></td>
              <td>{d.leads}</td>
              <td>{d.converted}</td>
              <td>{d.pending}</td>
            </tr>
          ))}
          {!entries.length && <tr><td colSpan={4} className="muted">No data</td></tr>}
        </tbody>
      </table>
    </section>
  );
}

export default function Reports() {
  const { stages, sources, products } = useSettings();
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [rms, setRms] = useState([]);
  const [managers, setManagers] = useState([]);

  const [filters, setFilters] = useState({
    role: '', employee: '', manager: '', rm: '', branch: '', product: '',
    source: '', status: '', from: '', to: '', score: '', search: ''
  });

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const fetchReport = useCallback(async () => {
    try {
      const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const params = new URLSearchParams(clean);
      const r = await api.get(`/reports/mis?${params}`);
      setData(r.data);
    } catch (e) {}
  }, [filters]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
    api.get('/users/by-role/RM').then(r => setRms(r.data)).catch(() => {});
    api.get('/users/by-role/MANAGER').then(r => setManagers(r.data)).catch(() => {});
  }, []);

  const exportMis = async () => {
    if (!data?.employeeMis?.length) return alert('No data to export');
    const rows = data.employeeMis;
    const csv = [
      'Employee,Role,Manager,Leads,Converted,Pending Docs,Amount,Conversion %',
      ...rows.map(r => `"${r.employee}","${r.role}","${r.manager}","${r.leads}","${r.converted}","${r.pending}","${r.amount}","${r.conversion}"`)
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'employee-wise-mis-filtered.csv';
    a.click();
  };

  const exportLeads = async () => {
    const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    const params = new URLSearchParams(clean);
    const r = await api.get(`/reports/export/leads?${params}`, { responseType: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(r.data);
    a.download = 'filtered-leads.csv';
    a.click();
  };

  // All unique branches from users + leads
  const allBranches = [...new Set([
    ...(managers.map(m => m.city)),
    ...(rms.map(r => r.city)),
    ...(users.map(u => u.city))
  ])].filter(Boolean);

  return (
    <>
      <div className="top">
        <div>
          <h1>Reports &amp; MIS</h1>
          <p>Employee-wise MIS with filters and filter-wise export.</p>
        </div>
        <div className="row">
          <button className="btn primary" onClick={exportMis}>Export Filtered MIS</button>
          <button className="btn" onClick={exportLeads}>Export Filtered Leads</button>
        </div>
      </div>

      {/* ── Filters ── */}
      <section className="panel">
        <h2>MIS Filters</h2>
        <div className="grid four">
          <div>
            <label>Employee Role</label>
            <select className="field" value={filters.role} onChange={e => setF('role', e.target.value)}>
              <option value="">All Roles</option>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label>Employee</label>
            <select className="field" value={filters.employee} onChange={e => setF('employee', e.target.value)}>
              <option value="">All Employees</option>
              {users.map(u => <option key={u._id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label>Manager</label>
            <select className="field" value={filters.manager} onChange={e => setF('manager', e.target.value)}>
              <option value="">All Managers</option>
              {managers.map(m => <option key={m._id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label>RM</label>
            <select className="field" value={filters.rm} onChange={e => setF('rm', e.target.value)}>
              <option value="">All RMs</option>
              {rms.map(r => <option key={r._id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label>Branch / City</label>
            <select className="field" value={filters.branch} onChange={e => setF('branch', e.target.value)}>
              <option value="">All Branches</option>
              {allBranches.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label>Product</label>
            <select className="field" value={filters.product} onChange={e => setF('product', e.target.value)}>
              <option value="">All Products</option>
              {Object.keys(products || {}).map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label>Source</label>
            <select className="field" value={filters.source} onChange={e => setF('source', e.target.value)}>
              <option value="">All Sources</option>
              {(sources || []).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Status</label>
            <select className="field" value={filters.status} onChange={e => setF('status', e.target.value)}>
              <option value="">All Statuses</option>
              {(stages || []).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>From Date</label>
            <input className="field" type="date" value={filters.from} onChange={e => setF('from', e.target.value)} />
          </div>
          <div>
            <label>To Date</label>
            <input className="field" type="date" value={filters.to} onChange={e => setF('to', e.target.value)} />
          </div>
          <div>
            <label>Minimum Score</label>
            <input className="field" type="number" placeholder="0" value={filters.score} onChange={e => setF('score', e.target.value)} />
          </div>
          <div>
            <label>Search</label>
            <input className="field" placeholder="Lead or employee name" value={filters.search} onChange={e => setF('search', e.target.value)} />
          </div>
        </div>
      </section>

      {/* ── Metrics ── */}
      {data && (
        <>
          <div className="grid cards" style={{ marginTop: 14 }}>
            <div className="panel metric"><span>Filtered Leads</span><b>{data.total}</b></div>
            <div className="panel metric"><span>Filtered Amount</span><b>{money(data.totalAmount)}</b></div>
            <div className="panel metric"><span>Converted</span><b>{data.converted}</b></div>
            <div className="panel metric"><span>Employees</span><b>{data.employeeMis?.length || 0}</b></div>
          </div>

          {/* Employee MIS + Charts */}
          <div className="grid two" style={{ marginTop: 14 }}>
            <section className="panel">
              <h2>Employee-wise MIS</h2>
              <div style={{ overflow: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th><th>Role</th><th>Manager</th>
                      <th>Leads</th><th>Converted</th><th>Pending Docs</th>
                      <th>Amount</th><th>Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.employeeMis || []).map((r, i) => (
                      <tr key={i}>
                        <td><b>{r.employee}</b></td>
                        <td><span className={`badge ${r.role}`}>{r.role}</span></td>
                        <td>{r.manager}</td>
                        <td>{r.leads}</td>
                        <td>{r.converted}</td>
                        <td>{r.pending}</td>
                        <td>{money(r.amount)}</td>
                        <td>{r.conversion}%</td>
                      </tr>
                    ))}
                    {!data.employeeMis?.length && (
                      <tr><td colSpan={8} className="muted">No employee MIS data for selected filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              <h2>Filtered Mix</h2>
              <h2>Status</h2><BarChart data={data.funnel} />
              <h2 style={{ marginTop: 14 }}>Source</h2><BarChart data={data.sourceMix} />
              <h2 style={{ marginTop: 14 }}>Product</h2><BarChart data={data.productMix} />
            </section>
          </div>

          {/* Perf Tables */}
          <div className="grid two" style={{ marginTop: 14 }}>
            <PerfTable data={data.resourcePerf} title="Resource Report" />
            <PerfTable data={data.rmPerf} title="RM Report" />
          </div>
        </>
      )}
    </>
  );
}
