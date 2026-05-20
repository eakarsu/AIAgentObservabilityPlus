import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE, getToken } from '../services/api';

// VIZ 1 — Horizontal SVG flame graph of agent execution spans.
// Each row is a depth level; bar width is proportional to duration.
const ROW_H = 22;
const PAD_TOP = 24;
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'];

export default function TraceFlameGraph() {
  const [traceId, setTraceId] = useState(1);
  const [traces, setTraces] = useState([]);
  const [data, setData] = useState(null);
  const [hover, setHover] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/traces`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json()).then((rows) => {
        const arr = Array.isArray(rows) ? rows : [];
        setTraces(arr);
        if (arr.length) setTraceId(arr[0].id);
      }).catch(() => {});
  }, []);

  useEffect(() => {
    setErr(null);
    fetch(`${API_BASE}/custom-views/trace-flame/${traceId}`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json()).then((d) => { if (d.error) setErr(d.error); else setData(d); })
      .catch((e) => setErr(e.message));
  }, [traceId]);

  const layout = useMemo(() => {
    if (!data || !Array.isArray(data.spans)) return null;
    const total = Math.max(1, Number(data.total_duration_ms || 0));
    const width = 880;
    const maxDepth = data.spans.reduce((m, s) => Math.max(m, Number(s.depth || 0)), 0);
    const height = PAD_TOP + (maxDepth + 1) * (ROW_H + 6) + 16;
    const bars = data.spans.map((s, i) => ({
      ...s,
      x: (Number(s.start || 0) / total) * width,
      w: Math.max(3, (Number(s.duration || 0) / total) * width),
      y: PAD_TOP + Number(s.depth || 0) * (ROW_H + 6),
      color: COLORS[i % COLORS.length],
    }));
    return { width, height, bars, total };
  }, [data]);

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: '#cbd5e1' }}>Trace Flame Graph</h3>
        <label style={{ color: '#94a3b8', fontSize: 12 }}>Trace</label>
        <select value={traceId} onChange={(e) => setTraceId(Number(e.target.value))}
          style={{ background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', padding: '4px 8px', borderRadius: 4 }}>
          {traces.length === 0 && <option value={1}>#1 (demo)</option>}
          {traces.map((t) => <option key={t.id} value={t.id}>#{t.id} · {t.project_name} · {t.duration_ms}ms</option>)}
        </select>
        {data && <span style={{ color: '#94a3b8', fontSize: 12 }}>total {data.total_duration_ms}ms · {data.spans.length} spans</span>}
      </div>
      {err && <div className="ai-error">{err}</div>}
      {layout && (
        <div style={{ overflowX: 'auto' }} data-testid="flame-graph">
          <svg width={layout.width} height={layout.height} style={{ background: '#0b1220', borderRadius: 6 }}>
            {/* time axis */}
            <line x1={0} y1={PAD_TOP - 6} x2={layout.width} y2={PAD_TOP - 6} stroke="#1e293b" />
            {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
              <text key={i} x={f * layout.width} y={14} fontSize={10} fill="#64748b" textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}>
                {Math.round(f * layout.total)}ms
              </text>
            ))}
            {layout.bars.map((b) => (
              <g key={b.id} onMouseEnter={() => setHover(b)} onMouseLeave={() => setHover(null)}>
                <rect x={b.x} y={b.y} width={b.w} height={ROW_H} rx={3} ry={3}
                  fill={b.status === 'error' ? '#ef4444' : b.color} opacity={hover && hover.id === b.id ? 1 : 0.85}
                  stroke="#0b1220" strokeWidth={1} />
                <text x={b.x + 6} y={b.y + 15} fontSize={11} fill="#0b1220" style={{ pointerEvents: 'none', fontWeight: 600 }}>
                  {b.w > 60 ? `${b.name} (${b.duration}ms)` : ''}
                </text>
              </g>
            ))}
          </svg>
          {hover && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#cbd5e1' }}>
              <strong>{hover.name}</strong> — {hover.duration}ms · depth {hover.depth} · parent #{hover.parent ?? 'root'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
