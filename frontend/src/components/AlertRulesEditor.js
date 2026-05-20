import React, { useEffect, useState } from 'react';
import { API_BASE, getToken } from '../services/api';

// NON-VIZ 2 — CRUD on alert rules (metric, threshold, severity, notify channels).
const METRICS = ['p95_latency_ms', 'error_rate_pct', 'token_cost_usd', 'drift_score', 'span_count'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const CHANNELS = ['pagerduty', 'slack', 'email', 'webhook'];

const blank = { metric: 'p95_latency_ms', threshold: 1000, severity: 'medium', channels: [], description: '' };

function authedFetch(path, opts = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts.headers || {}) },
  });
}

export default function AlertRulesEditor() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState(null);

  const load = () => {
    authedFetch('/custom-views/alert-rules').then((r) => r.json()).then((rows) => setRules(Array.isArray(rows) ? rows : [])).catch((e) => setErr(e.message));
  };
  useEffect(load, []);

  const toggleChannel = (ch) => {
    setForm((f) => ({ ...f, channels: f.channels.includes(ch) ? f.channels.filter((c) => c !== ch) : [...f.channels, ch] }));
  };

  const startEdit = (r) => { setEditingId(r.id); setForm({ metric: r.metric, threshold: r.threshold, severity: r.severity, channels: r.channels || [], description: r.description || '' }); };
  const reset = () => { setEditingId(null); setForm(blank); };

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    try {
      const opts = { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(form) };
      const path = editingId ? `/custom-views/alert-rules/${editingId}` : '/custom-views/alert-rules';
      const res = await authedFetch(path, opts);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      reset();
      load();
    } catch (e2) { setErr(e2.message); }
  };

  const remove = async (id) => {
    if (!window.confirm(`Delete rule #${id}?`)) return;
    try {
      const res = await authedFetch(`/custom-views/alert-rules/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (editingId === id) reset();
      load();
    } catch (e) { setErr(e.message); }
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 12px', color: '#cbd5e1' }}>Alert Rules</h3>
      {err && <div className="ai-error">{err}</div>}
      <form onSubmit={submit} data-testid="rule-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, background: '#0b1220', padding: 12, borderRadius: 6, marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: '#94a3b8' }}>Metric
          <select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} style={inputStyle}>
            {METRICS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12, color: '#94a3b8' }}>Threshold
          <input type="number" step="0.01" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} style={inputStyle} />
        </label>
        <label style={{ fontSize: 12, color: '#94a3b8' }}>Severity
          <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} style={inputStyle}>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12, color: '#94a3b8', gridColumn: 'span 2' }}>Description
          <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} placeholder="e.g. p95 latency above 1.5s for 5m" />
        </label>
        <div style={{ gridColumn: 'span 3' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Notify Channels</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CHANNELS.map((ch) => (
              <label key={ch} style={{ color: '#cbd5e1', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="checkbox" checked={form.channels.includes(ch)} onChange={() => toggleChannel(ch)} /> {ch}
              </label>
            ))}
          </div>
        </div>
        <div style={{ gridColumn: 'span 3', display: 'flex', gap: 8 }}>
          <button className="btn" type="submit" data-testid="save-rule-btn">{editingId ? 'Update Rule' : 'Create Rule'}</button>
          {editingId && <button type="button" className="btn secondary" onClick={reset}>Cancel</button>}
        </div>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }} data-testid="rules-table">
        <thead>
          <tr style={{ color: '#94a3b8', fontSize: 12, textAlign: 'left' }}>
            <th style={th}>#</th><th style={th}>Metric</th><th style={th}>Threshold</th><th style={th}>Severity</th><th style={th}>Channels</th><th style={th}>Description</th><th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid #1e293b', color: '#e2e8f0' }}>
              <td style={td}>{r.id}</td>
              <td style={td}><code>{r.metric}</code></td>
              <td style={td}>{r.threshold}</td>
              <td style={td}><span style={{ color: r.severity === 'critical' ? '#ef4444' : r.severity === 'high' ? '#f59e0b' : '#3b82f6' }}>{r.severity}</span></td>
              <td style={td}>{(r.channels || []).join(', ')}</td>
              <td style={td}>{r.description}</td>
              <td style={td}>
                <button className="btn secondary" type="button" onClick={() => startEdit(r)} style={miniBtn}>edit</button>
                <button className="btn secondary" type="button" onClick={() => remove(r.id)} style={{ ...miniBtn, marginLeft: 4 }}>del</button>
              </td>
            </tr>
          ))}
          {rules.length === 0 && (<tr><td colSpan={7} style={{ ...td, color: '#64748b', textAlign: 'center' }}>No rules yet.</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

const inputStyle = { width: '100%', marginTop: 4, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', padding: '6px 8px', borderRadius: 4 };
const th = { padding: '6px 8px', borderBottom: '1px solid #1e293b' };
const td = { padding: '6px 8px' };
const miniBtn = { padding: '2px 8px', fontSize: 11 };
