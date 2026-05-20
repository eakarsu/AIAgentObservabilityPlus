import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';

const FEATURES = [
  { path: '/projects', title: 'Projects', icon: 'P', color: '#3b82f6', desc: 'Manage projects.' },
  { path: '/traces', title: 'Traces', icon: 'T', color: '#3b82f6', desc: 'Manage traces.' },
  { path: '/prompts', title: 'Prompts', icon: 'M', color: '#3b82f6', desc: 'Manage prompts.' },
  { path: '/evals', title: 'Evals', icon: 'E', color: '#3b82f6', desc: 'Manage evals.' },
  { path: '/alerts', title: 'Alerts', icon: 'A', color: '#3b82f6', desc: 'Manage alerts.' },
  { path: '/prompt-versions', title: 'Prompt Versions', icon: 'V', color: '#3b82f6', desc: 'Manage prompt versions.' },
  { path: '/eval-results', title: 'Eval Results', icon: 'R', color: '#3b82f6', desc: 'Manage eval results.' },
  { path: '/api-keys', title: 'API Keys', icon: 'K', color: '#3b82f6', desc: 'Manage api keys.' },
  { path: '/ai/regression-detect', title: 'AI · Regression Detect', icon: '*', color: '#8b5cf6', desc: 'Regression Detect' },
  { path: '/ai/auto-rca', title: 'AI · Auto RCA', icon: '*', color: '#8b5cf6', desc: 'Auto RCA' },
  { path: '/ai/drift-score', title: 'AI · Drift Score', icon: '*', color: '#8b5cf6', desc: 'Drift Score' },
  { path: '/ai/anomaly-classify', title: 'AI · Anomaly Classifier', icon: '*', color: '#8b5cf6', desc: 'Anomaly Classifier' },
  { path: '/ai/prompt-diff', title: 'AI · Prompt Diff Analyzer', icon: '*', color: '#8b5cf6', desc: 'Prompt Diff Analyzer' },
  { path: '/ai/cost-anomaly', title: 'AI · Cost Anomaly Detector', icon: '*', color: '#8b5cf6', desc: 'Cost Anomaly Detector' },
  { path: '/ai/eval-generator', title: 'AI · Eval Generator', icon: '*', color: '#8b5cf6', desc: 'Eval Generator' },
  { path: '/ai/judge-calibrator', title: 'AI · Judge Calibrator', icon: '*', color: '#8b5cf6', desc: 'Judge Calibrator' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { getDashboardStats().then(setStats).catch((e) => setErr(e.message)); }, []);

  return (
    <div>
      <div className="dashboard-header">
        <h2>Agent Observability Plus</h2>
        <p>Regression detection, auto-RCA, and drift alarms for production AI agents.</p>
      </div>
      {err && <div className="ai-error">Stats unavailable: {err}</div>}
      {stats && (
        <div className="stats-grid">
          <div className="stat"><div className="stat-label">Projects</div><div className="stat-value">{stats.projects?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Traces</div><div className="stat-value">{stats.traces?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Prompts</div><div className="stat-value">{stats.prompts?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Evals</div><div className="stat-value">{stats.evals?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Alerts</div><div className="stat-value">{stats.alerts?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Prompt Versions</div><div className="stat-value">{stats.prompt_versions?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">Eval Results</div><div className="stat-value">{stats.eval_results?.total ?? '—'}</div></div>
          <div className="stat"><div className="stat-label">API Keys</div><div className="stat-value">{stats.api_keys?.total ?? '—'}</div></div>
        </div>
      )}
      <h3 style={{ color: '#cbd5e1', margin: '8px 0 14px', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 }}>Capabilities</h3>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div key={f.path} className="feature-card" style={{ ['--card-color']: f.color }} onClick={() => navigate(f.path)}>
            <div className="feature-card-icon" style={{ background: f.color + '22', color: f.color }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
