import React, { useEffect, useState } from 'react';
import { API_BASE, getToken } from '../services/api';

// NON-VIZ 1 — Incident picker -> downloads a pdfkit-generated PDF.
export default function IncidentReportPDF() {
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/custom-views/incidents`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json()).then((rows) => {
        const arr = Array.isArray(rows) ? rows : [];
        setIncidents(arr);
        if (arr.length) setSelected(arr[0].id);
      }).catch((e) => setErr(e.message));
  }, []);

  const generate = async () => {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/custom-views/incident-report-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ incidentId: selected }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${selected}-report.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setMsg(`Downloaded ${selected}-report.pdf (${blob.size} bytes)`);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const inc = incidents.find((i) => i.id === selected) || incidents[0];

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 12px', color: '#cbd5e1' }}>Incident Report (PDF)</h3>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ color: '#94a3b8', fontSize: 12 }}>Incident</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}
          style={{ background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', padding: '6px 10px', borderRadius: 4, minWidth: 360 }}>
          {incidents.map((i) => <option key={i.id} value={i.id}>{i.id} · {i.severity} · {i.title}</option>)}
        </select>
        <button className="btn" onClick={generate} disabled={busy || !selected} data-testid="generate-pdf-btn">
          {busy ? 'Generating…' : 'Generate PDF'}
        </button>
      </div>
      {err && <div className="ai-error">{err}</div>}
      {msg && <div style={{ color: '#10b981', fontSize: 12, marginBottom: 10 }}>{msg}</div>}
      {inc && (
        <div style={{ background: '#0b1220', borderRadius: 6, padding: 14, fontSize: 13, color: '#cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{inc.id} — {inc.title}</strong>
            <span style={{ color: inc.severity === 'critical' ? '#ef4444' : inc.severity === 'high' ? '#f59e0b' : '#3b82f6' }}>{inc.severity.toUpperCase()}</span>
          </div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
            opened {inc.opened} · {inc.resolved ? `resolved ${inc.resolved}` : 'OPEN'} · owner {inc.owner}
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ color: '#60a5fa', fontSize: 12, marginBottom: 4 }}>TRACE IDS</div>
            <code>{(inc.traces || []).map((t) => `#${t}`).join(', ') || '(none)'}</code>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ color: '#60a5fa', fontSize: 12, marginBottom: 4 }}>TIMELINE</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {(inc.timeline || []).map((row, i) => (<li key={i}><code>{row.t}</code> — {row.e}</li>))}
            </ul>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ color: '#60a5fa', fontSize: 12, marginBottom: 4 }}>ROOT CAUSE</div>
            {inc.rootCause}
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ color: '#60a5fa', fontSize: 12, marginBottom: 4 }}>REMEDIATION</div>
            {inc.remediation}
          </div>
        </div>
      )}
    </div>
  );
}
