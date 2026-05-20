import React from 'react';
import AIPage from '../components/AIPage';
import { aiAutoRca } from '../services/api';

export default function AIAutoRcaPage() {
  return (
    <AIPage
      title="AI · Auto RCA"
      feature="auto-rca"
      subtitle="Auto RCA"
      inputs={[
        { key: 'trace_json', label: 'Failing Trace', type: 'textarea', placeholder: '' },
        { key: 'user_intent', label: 'User Intent', type: 'text', placeholder: '' }
      ]}
      run={(v) => aiAutoRca(v)}
    />
  );
}
