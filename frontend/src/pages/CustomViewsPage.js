import React from 'react';
import TraceFlameGraph from '../components/TraceFlameGraph';
import LatencyHeatmap from '../components/LatencyHeatmap';
import IncidentReportPDF from '../components/IncidentReportPDF';
import AlertRulesEditor from '../components/AlertRulesEditor';

export default function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page">
      <div className="page-header">
        <div>
          <h2>Observability Views</h2>
          <p>Trace flame graphs, latency heatmaps, incident PDFs, and alert rule management.</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <TraceFlameGraph />
        <LatencyHeatmap />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <IncidentReportPDF />
          <AlertRulesEditor />
        </div>
      </div>
    </div>
  );
}
