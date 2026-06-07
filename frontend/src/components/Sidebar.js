import React from 'react';
import { NavLink } from 'react-router-dom';
import { logout, getStoredUser } from '../services/api';

const CRUD_LINKS = [
  { to: '/projects', label: 'Projects' },
  { to: '/traces', label: 'Traces' },
  { to: '/prompts', label: 'Prompts' },
  { to: '/evals', label: 'Evals' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/prompt-versions', label: 'Prompt Versions' },
  { to: '/eval-results', label: 'Eval Results' },
  { to: '/api-keys', label: 'API Keys' },
];

const AI_LINKS = [
  { to: '/ai/regression-detect', label: 'AI · Regression Detect' },
  { to: '/ai/auto-rca', label: 'AI · Auto RCA' },
  { to: '/ai/drift-score', label: 'AI · Drift Score' },
  { to: '/ai/anomaly-classify', label: 'AI · Anomaly Classifier' },
  { to: '/ai/prompt-diff', label: 'AI · Prompt Diff Analyzer' },
  { to: '/ai/cost-anomaly', label: 'AI · Cost Anomaly Detector' },
  { to: '/ai/eval-generator', label: 'AI · Eval Generator' },
  { to: '/ai/judge-calibrator', label: 'AI · Judge Calibrator' },
];

const CUSTOM_LINKS = [
  { to: '/wb/trace-viewer', label: 'Trace Viewer' },
  { to: '/wb/otlp-ingest', label: 'OTLP Ingest' },
];

const OBS_LINKS = [
  { to: '/custom-views', label: 'Custom Observability Views' },
  { to: '/blast-radius', label: 'Trace Blast Radius' },
  { to: '/production-controls', label: 'Production Controls' },
];

export default function Sidebar() {
  const user = getStoredUser();
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <h1>AGENT OBSERVABILITY PLUS</h1>
        <p>Regression detection, auto-RCA, and drift alarms for production AI agents.</p>
      </div>
      <NavLink to="/" end>Dashboard</NavLink>
      <div className="sidebar-group-label">Data</div>
      {CRUD_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
      <div className="sidebar-group-label">AI Features</div>
      {AI_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
      {CUSTOM_LINKS.length > 0 && <div className="sidebar-group-label">Workbenches</div>}
      {CUSTOM_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
      <div className="sidebar-group-label">Observability Views</div>
      {OBS_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
      <div className="sidebar-user">
        {user && (
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name || user.email}</div>
            <div className="sidebar-user-role">{user.role || 'user'}</div>
          </div>
        )}
        <button className="btn secondary sidebar-logout" onClick={logout}>Sign Out</button>
      </div>
    </nav>
  );
}
