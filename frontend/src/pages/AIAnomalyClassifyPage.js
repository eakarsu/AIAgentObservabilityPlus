import React from 'react';
import AIPage from '../components/AIPage';
import { aiAnomalyClassify } from '../services/api';

export default function AIAnomalyClassifyPage() {
  return (
    <AIPage
      title="AI · Anomaly Classifier"
      feature="anomaly-classify"
      subtitle="Anomaly Classifier"
      inputs={[
        { key: 'metric_name', label: 'Metric Name', type: 'text', placeholder: '' },
        { key: 'recent_series', label: 'Recent Series (csv)', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiAnomalyClassify(v)}
    />
  );
}
