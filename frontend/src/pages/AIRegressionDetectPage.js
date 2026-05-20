import React from 'react';
import AIPage from '../components/AIPage';
import { aiRegressionDetect } from '../services/api';

export default function AIRegressionDetectPage() {
  return (
    <AIPage
      title="AI · Regression Detect"
      feature="regression-detect"
      subtitle="Regression Detect"
      inputs={[
        { key: 'baseline_prompt', label: 'Baseline Prompt', type: 'textarea', placeholder: '' },
        { key: 'candidate_prompt', label: 'Candidate Prompt', type: 'textarea', placeholder: '' },
        { key: 'sample_inputs', label: 'Sample Inputs (newline)', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiRegressionDetect(v)}
    />
  );
}
