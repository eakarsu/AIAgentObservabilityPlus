import React from 'react';

const controls = [
  ['OTLP Connector Health', 'Trace, span, log, metric, webhook, and SDK ingestion freshness with retry queues.'],
  ['Agent Identity & Access', 'SSO/MFA, project roles, API key ownership, service identities, and access certification.'],
  ['Run Replay & Regression Gates', 'Trace replay, prompt snapshots, tool IO capture, eval gates, and release approval evidence.'],
  ['Alert Delivery Ledger', 'Pager, Slack, email, webhook, retry, escalation, and acknowledgement history.'],
  ['Audit Export Center', 'Trace, prompt, eval, API key, alert, and user-access exports for compliance review.'],
  ['Production Observability Runbooks', 'Incident routing, blast-radius checks, on-call ownership, and postmortem closeout.'],
];

export default function ProductionControlsPage() {
  return (
    <div className="page">
      <div className="page-header"><h1>Production Controls</h1><p>Go-live controls for agent observability, regression detection, and AI incident response.</p></div>
      <div className="grid two">
        {controls.map(([title, detail]) => (
          <section className="card" key={title}>
            <h2>{title}</h2>
            <p className="muted">{detail}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
