import React from 'react';
import AIPage from '../components/AIPage';
import { aiDriftScore } from '../services/api';

export default function AIDriftScorePage() {
  return (
    <AIPage
      title="AI · Drift Score"
      feature="drift-score"
      subtitle="Drift Score"
      inputs={[
        { key: 'baseline_outputs', label: 'Baseline Outputs (last week)', type: 'textarea', placeholder: '' },
        { key: 'current_outputs', label: 'Current Outputs (today)', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiDriftScore(v)}
    />
  );
}
