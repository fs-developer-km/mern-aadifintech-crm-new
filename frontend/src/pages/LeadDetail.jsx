import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { useSettings } from '../hooks/useSettings.jsx';
import { useToast } from '../hooks/useToast.jsx';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { stages, customFields } = useSettings();
  const toast = useToast();

  const [lead, setLead] = useState(null);
  const [rms, setRms] = useState([]);
  const [resources, setResources] = useState([]);
  const [managers, setManagers] = useState([]);
  const [noteText, setNoteText] = useState('');

  const reload = async () => {
    const r = await api.get(`/leads/${id}`);
    setLead(r.data);
  };

  useEffect(() => {
    reload();
    api.get('/users/by-role/RM').then(r => setRms(r.data)).catch(() => {});
    api.get('/users/by-role/RESOURCE').then(r => setResources(r.data)).catch(() => {});
    api.get('/users/by-role/MANAGER').then(r => setManagers(r.data)).catch(() => {});
  }, [id]);

  const update = async (patch) => {
    try {
      await api.patch(`/leads/${id}`, patch);
      const key = Object.keys(patch)[0];
      toast(`${key} updated`);
      reload();
    } catch (e) { toast('Error saving'); }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    await api.post(`/leads/${id}/notes`, { text: noteText });
    toast('Note added');
    setNoteText('');
    reload();
  };

  const docAction = async (index, status) => {
    await api.patch(`/leads/${id}/docs/${index}`, { status });
    toast(`Document ${status.toLowerCase()}`);
    reload();
  };

  const whatsapp = () => {
    if (!lead) return;
    window.open(
      `https://wa.me/${lead.mobile.replace(/\D/g, '')}?text=${encodeURIComponent('Hello ' + lead.name + ', this is regarding your lead with Aadi Fintech.')}`,
      '_blank'
    );
  };

  if (!lead) return <div className="spinner">Loading lead...</div>;

  const docPct = lead.docs?.length
    ? Math.round(lead.docs.filter(d => d.status === 'APPROVED').length / lead.docs.length * 100)
    : 0;

  return (
    <>
      <div className="top">
        <div>
          <h1>{lead.name}</h1>
          <p>{lead.mobile} | {lead.email} | {lead.city}, {lead.state}</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => navigate('/leads')}>← Back</button>
          <button className="btn primary" onClick={whatsapp}>Open WhatsApp</button>
        </div>
      </div>

      <div className="grid two">
        {/* ── Editable Profile ── */}
        <section className="panel">
          <h2>Editable Lead Profile</h2>
          <div className="grid three">
            {[
              ['name', 'Name', 'text'],
              ['mobile', 'Mobile', 'text'],
              ['email', 'Email', 'text'],
              ['city', 'City', 'text'],
              ['pan', 'PAN', 'text'],
              ['amount', 'Amount', 'number'],
            ].map(([k, label, type]) => (
              <div key={k}>
                <label>{label}</label>
                <input
                  className="field"
                  type={type}
                  defaultValue={lead[k] || ''}
                  key={`${id}-${k}-${lead[k]}`}
                  onBlur={e => {
                    if (String(e.target.value) !== String(lead[k] || '')) {
                      update({ [k]: e.target.value });
                    }
                  }}
                />
              </div>
            ))}
            {(customFields || []).map(f => (
              <div key={f}>
                <label>{f}</label>
                <input
                  className="field"
                  defaultValue={lead.custom?.[f] || ''}
                  key={`${id}-cf-${f}`}
                  onBlur={e => update({ custom: { [f]: e.target.value } })}
                />
              </div>
            ))}
          </div>

          <label style={{ marginTop: 12 }}>Stage</label>
          <select
            className="field"
            value={lead.status}
            onChange={e => update({ status: e.target.value })}
          >
            {stages.map(s => <option key={s}>{s}</option>)}
          </select>

          <label style={{ marginTop: 10 }}>Next Follow-up Date</label>
          <input
            className="field"
            type="date"
            defaultValue={lead.nextFollowUp || ''}
            onBlur={e => update({ nextFollowUp: e.target.value })}
          />

          <label style={{ marginTop: 10 }}>Add Internal Note</label>
          <textarea
            className="field"
            rows={3}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Write a note..."
          />
          <button className="btn primary" style={{ marginTop: 8 }} onClick={addNote}>
            Add Note
          </button>
        </section>

        {/* ── Assignment Chain ── */}
        <section className="panel">
          <h2>Assignment Chain</h2>
          <label>Resource</label>
          <select className="field" value={lead.resource || ''} onChange={e => update({ resource: e.target.value })}>
            <option value="">Select Resource</option>
            {resources.map(r => <option key={r._id}>{r.name}</option>)}
          </select>
          <label style={{ marginTop: 8 }}>RM</label>
          <select className="field" value={lead.rm || ''} onChange={e => update({ rm: e.target.value })}>
            <option value="">Select RM</option>
            {rms.map(r => <option key={r._id}>{r.name}</option>)}
          </select>
          <label style={{ marginTop: 8 }}>Manager</label>
          <select className="field" value={lead.manager || ''} onChange={e => update({ manager: e.target.value })}>
            <option value="">Select Manager</option>
            {managers.map(m => <option key={m._id}>{m.name}</option>)}
          </select>
          <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
            Rule: Resource reports to RM, RM reports to Manager.
          </p>

          <h2 style={{ marginTop: 16 }}>Lead Info</h2>
          <table>
            <tbody>
              <tr><td><b>Product</b></td><td>{lead.main} — {lead.sub}</td></tr>
              <tr><td><b>Source</b></td><td>{lead.source}</td></tr>
              <tr><td><b>Score</b></td><td>{lead.score}/100</td></tr>
              <tr><td><b>Docs</b></td><td>{docPct}% approved</td></tr>
              <tr><td><b>Created</b></td><td>{new Date(lead.createdAt).toLocaleDateString('en-IN')}</td></tr>
              {lead.nextFollowUp && <tr><td><b>Follow-up</b></td><td>{lead.nextFollowUp}</td></tr>}
            </tbody>
          </table>
        </section>

        {/* ── Documents ── */}
        <section className="panel">
          <h2>Documents ({docPct}% approved)</h2>
          {(lead.docs || []).map((d, i) => (
            <div
              className="split"
              style={{ borderBottom: '1px solid #eef2f7', padding: '10px 0' }}
              key={i}
            >
              <span>
                <b>{d.type}</b>
                <br />
                <span className={`badge ${d.status}`}>{d.status}</span>
              </span>
              <span className="row">
                {d.status !== 'APPROVED' && (
                  <button className="btn" onClick={() => docAction(i, 'APPROVED')}>Approve</button>
                )}
                {d.status !== 'REJECTED' && (
                  <button className="btn danger" onClick={() => docAction(i, 'REJECTED')}>Reject</button>
                )}
                {d.status !== 'PENDING' && (
                  <button className="btn" onClick={() => docAction(i, 'PENDING')}>Reset</button>
                )}
              </span>
            </div>
          ))}
          {!(lead.docs?.length) && <p className="muted">No document templates configured</p>}
        </section>

        {/* ── Timeline ── */}
        <section className="panel">
          <h2>Timeline & Notes</h2>
          <div className="timeline">
            {[...(lead.timeline || [])].map((ev, i) => (
              <div className="event" key={`tl-${i}`}>
                <b>{ev.action}</b>
                <p>{ev.text}</p>
                <span className="muted">{ev.by} | {ev.time}</span>
              </div>
            ))}
            {(lead.notes || []).map((n, i) => (
              <div className="event" key={`note-${i}`}>
                <b>Note</b>
                <p>{n}</p>
                <span className="muted">Saved</span>
              </div>
            ))}
            {!(lead.timeline?.length || lead.notes?.length) && (
              <p className="muted">No history yet</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
