import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { money, CONVERTED } from '../utils/constants.js';

function Metric({ label, value }) {
  return (
    <div className="panel metric">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [rms, setRms] = useState([]);
  const [activities, setActivities] = useState([]);
  const [teamCount, setTeamCount] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get('/leads/stats'),
      api.get('/users'),
      api.get('/settings/activities'),
      api.get('/users/by-role/RM'),
    ]).then(([s, u, a, rmRes]) => {
      setStats(s.data);
      setTeamCount(u.data.length);
      setActivities(a.data || []);
      setRms(rmRes.data || []);
    }).catch(() => {});
  }, []);

  if (!stats) return <div className="spinner">Loading dashboard...</div>;

  return (
    <>
      <div className="top">
        <div>
          <h1>Command Dashboard</h1>
          <p>Role-filtered lead, channel, source and team performance.</p>
        </div>
        <div className="row">
          <button className="btn primary" onClick={() => navigate('/capture')}>Add Lead</button>
        </div>
      </div>

      <div className="grid cards">
        <Metric label="Visible Leads" value={stats.total} />
        <Metric label="Conversion" value={`${stats.conversionRate}%`} />
        <Metric label="Pending Docs" value={stats.pendingDocs} />
        <Metric label="Team Members" value={teamCount} />
      </div>

      <div className="grid two" style={{ marginTop: 14 }}>
        <section className="panel">
          <h2>Pipeline Funnel</h2>
          <BarChart data={stats.funnel} />
        </section>
        <section className="panel">
          <h2>Lead Source Mix</h2>
          <BarChart data={stats.sourceMix} />
        </section>

        <section className="panel">
          <h2>RM Performance</h2>
          <table>
            <thead>
              <tr><th>RM</th><th>Leads</th><th>Converted</th><th>Manager</th></tr>
            </thead>
            <tbody>
              {rms.map(r => {
                const rmStats = stats.rmPerf?.[r.name] || { leads: 0, converted: 0 };
                return (
                  <tr key={r._id}>
                    <td><b>{r.name}</b><br /><span className="muted">{r.city}</span></td>
                    <td>{rmStats.leads}</td>
                    <td>{rmStats.converted}</td>
                    <td>{r.manager || '-'}</td>
                  </tr>
                );
              })}
              {!rms.length && <tr><td colSpan={4} className="muted">No RMs found</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h2>Live Activity Feed</h2>
          <div className="timeline">
            {activities.slice(0, 10).map((ev, i) => (
              <div className="event" key={i}>
                <b>{ev.action}</b>
                <p>{ev.text}</p>
                <span className="muted">{ev.by} | {ev.time}</span>
              </div>
            ))}
            {!activities.length && <p className="muted">No recent activity</p>}
          </div>
        </section>
      </div>
    </>
  );
}
