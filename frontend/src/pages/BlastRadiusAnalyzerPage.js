import React, { useState } from 'react';
import { blastRadiusAnalyze } from '../services/api';

const starter = JSON.stringify({
  traces: [
    { trace_id: 'tr_91', project: 'Support Agent', affected_users: 420, tool_count: 5, retry_count: 3, cost_usd: 22, severity: 'high' },
    { trace_id: 'tr_92', project: 'Billing Agent', affected_users: 38, tool_count: 2, retry_count: 1, cost_usd: 7, severity: 'medium' }
  ]
}, null, 2);

export default function BlastRadiusAnalyzerPage() {
  const [payload, setPayload] = useState(starter);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const run = async () => {
    setError('');
    try {
      setResult(await blastRadiusAnalyze(JSON.parse(payload)));
    } catch (err) {
      setError(err.message || 'Blast-radius analysis failed');
    }
  };

  return (
    <div className="page">
      <div className="page-header"><h1>Trace Blast Radius</h1><p>Estimate incident reach from affected users, tool fan-out, retries, cost, and severity.</p></div>
      <div className="grid two">
        <section className="card">
          <textarea className="input mono" rows={18} value={payload} onChange={(event) => setPayload(event.target.value)} />
          <button className="btn primary" onClick={run}>Analyze Radius</button>
          {error && <p className="error">{error}</p>}
        </section>
        <section className="card">
          {!result ? <p className="muted">Blast-radius tiers appear here.</p> : (
            <>
              <div className="metric-row">
                <div><span>Max Score</span><strong>{result.maxScore}</strong></div>
                <div><span>SEV1</span><strong>{result.sev1Count}</strong></div>
              </div>
              {result.traces.map((trace) => (
                <div className="list-card" key={trace.trace_id}>
                  <div className="row between"><strong>{trace.trace_id}</strong><span>{trace.tier} · {trace.score}</span></div>
                  <p className="muted">{trace.project}</p>
                  <p>{trace.containment}</p>
                </div>
              ))}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
