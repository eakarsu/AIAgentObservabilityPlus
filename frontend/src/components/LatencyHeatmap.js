import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE, getToken } from '../services/api';

// VIZ 2 — CSS-grid heatmap of agents x hours colored by p95 latency.
function colorFor(p95, min, max) {
  if (max <= min) return '#1e293b';
  const t = Math.min(1, Math.max(0, (p95 - min) / (max - min)));
  // green -> amber -> red
  const r = Math.round(34 + t * (239 - 34));
  const g = Math.round(197 - t * (197 - 68));
  const b = Math.round(94 - t * (94 - 68));
  return `rgb(${r},${g},${b})`;
}

export default function LatencyHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/custom-views/latency-heatmap`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json()).then((d) => { if (d.error) setErr(d.error); else setData(d); })
      .catch((e) => setErr(e.message));
  }, []);

  const { min, max } = useMemo(() => {
    if (!data) return { min: 0, max: 1 };
    let mn = Infinity, mx = -Infinity;
    for (const row of data.grid) for (const c of row.hours) { mn = Math.min(mn, c.p95_ms); mx = Math.max(mx, c.p95_ms); }
    return { min: mn === Infinity ? 0 : mn, max: mx === -Infinity ? 1 : mx };
  }, [data]);

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: '#cbd5e1' }}>Latency Heatmap (p95 ms · last 7d)</h3>
        {data && <span style={{ color: '#94a3b8', fontSize: 12 }}>min {min}ms · max {max}ms</span>}
      </div>
      {err && <div className="ai-error">{err}</div>}
      {data && (
        <div data-testid="latency-heatmap">
          <div style={{ display: 'grid', gridTemplateColumns: `140px repeat(${data.hours.length}, 1fr)`, gap: 2, fontSize: 10 }}>
            <div></div>
            {data.hours.map((h) => (
              <div key={h} style={{ color: '#64748b', textAlign: 'center', padding: '2px 0' }}>{h}</div>
            ))}
            {data.grid.map((row) => (
              <React.Fragment key={row.agent}>
                <div style={{ color: '#cbd5e1', padding: '4px 6px', fontSize: 12 }}>{row.agent}</div>
                {row.hours.map((c) => (
                  <div key={c.hour} onMouseEnter={() => setHover({ agent: row.agent, ...c })} onMouseLeave={() => setHover(null)}
                    title={`${row.agent} @ ${c.hour}:00 — p95 ${c.p95_ms}ms · n=${c.samples}`}
                    style={{ background: colorFor(c.p95_ms, min, max), height: 26, borderRadius: 2, cursor: 'crosshair' }} />
                ))}
              </React.Fragment>
            ))}
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>low</span>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'linear-gradient(90deg, rgb(34,197,94), rgb(245,158,11), rgb(239,68,68))' }} />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>high</span>
          </div>
          {hover && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#cbd5e1' }}>
              <strong>{hover.agent}</strong> · hour {hover.hour} · p95 {hover.p95_ms}ms · {hover.samples} samples
            </div>
          )}
        </div>
      )}
    </div>
  );
}
