import React from 'react';
import AIPage from '../components/AIPage';
import { aiCostAnomaly } from '../services/api';

export default function AICostAnomalyPage() {
  return (
    <AIPage
      title="AI · Cost Anomaly Detector"
      feature="cost-anomaly"
      subtitle="Cost Anomaly Detector"
      inputs={[
        { key: 'cost_series', label: 'Daily Cost ($) — csv', type: 'textarea', placeholder: '' },
        { key: 'token_series', label: 'Daily Tokens — csv', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiCostAnomaly(v)}
    />
  );
}
